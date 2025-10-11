import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gameInstanceId } = await request.json()

    // Aktif oyun var mı kontrol et
    const gameInstance = await prisma.gameInstance.findUnique({
      where: { id: gameInstanceId }
    })

    if (!gameInstance || gameInstance.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Aktif oyun bulunamadı' }, { status: 404 })
    }

    const config = JSON.parse(gameInstance.config || '{}')
    
    // İmza fazında mı?
    if (config.gamePhase !== 'SIGNING') {
      return NextResponse.json({ error: 'İmza turu başlamadı' }, { status: 400 })
    }

    // Daha önce imza attı mı? (İdempotent - aynı sonucu döndür)
    const existingSignature = await prisma.submission.findFirst({
      where: {
        gameInstanceId,
        userId: session.user.id,
        submissionType: 'SIGN'
      }
    })

    if (existingSignature) {
      // Zaten imza atmış, aynı sonucu döndür
      const payload = JSON.parse(existingSignature.payloadJson)
      return NextResponse.json({ 
        success: true,
        valid: payload.valid,
        message: payload.valid 
          ? '✅ İmzan geçerli! Sen gerçek sahibisin!' 
          : '❌ İmza geçersiz. Sen gerçek sahip değilsin.',
        alreadySubmitted: true
      })
    }

    // İmza doğrulama - Gerçek owner mı?
    const isOwner = session.user.id === config.ownerPlayerId
    
    // İmzayı kaydet
    await prisma.submission.create({
      data: {
        gameInstanceId,
        userId: session.user.id,
        submissionType: 'SIGN',
        payloadJson: JSON.stringify({
          valid: isOwner,
          timestamp: new Date().toISOString()
        }),
        isValid: isOwner
      }
    })

    return NextResponse.json({ 
      success: true,
      valid: isOwner,
      message: isOwner 
        ? '✅ İmzan geçerli! Sen gerçek sahibisin!' 
        : '❌ İmza geçersiz. Sen gerçek sahip değilsin.'
    })
  } catch (error) {
    console.error('Sign submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

