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

    const { gameInstanceId, guessedOwnerId } = await request.json()

    // Aktif oyun var mı kontrol et
    const gameInstance = await prisma.gameInstance.findUnique({
      where: { id: gameInstanceId }
    })

    if (!gameInstance || gameInstance.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Aktif oyun bulunamadı' }, { status: 404 })
    }

    const config = JSON.parse(gameInstance.config || '{}')
    
    // Oyun fazı uygun mu?
    if (config.gamePhase !== 'GUESSING') {
      return NextResponse.json({ error: 'Tahmin süresi doldu' }, { status: 400 })
    }

    // Daha önce tahmin yaptı mı kontrol et
    const existingGuess = await prisma.submission.findFirst({
      where: {
        gameInstanceId,
        userId: session.user.id,
        submissionType: 'GUESS'
      }
    })

    if (existingGuess) {
      return NextResponse.json({ error: 'Zaten tahmin yaptınız' }, { status: 400 })
    }

    // Tahmini kaydet
    await prisma.submission.create({
      data: {
        gameInstanceId,
        userId: session.user.id,
        submissionType: 'GUESS',
        payloadJson: JSON.stringify({
          guessedOwnerId,
          timestamp: new Date().toISOString()
        }),
        isValid: true
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Tahmin kaydedildi'
    })
  } catch (error) {
    console.error('Guess submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

