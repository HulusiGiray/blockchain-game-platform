import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { gameInstanceId, winners } = await req.json()

    if (!gameInstanceId) {
      return NextResponse.json({ error: 'Game instance ID gerekli' }, { status: 400 })
    }

    // Oyunu bitir
    await prisma.gameInstance.update({
      where: { id: gameInstanceId },
      data: { 
        status: 'ENDED',
        endAt: new Date() 
      }
    })

    // Kazananlara puan ver
    if (winners && Array.isArray(winners)) {
      for (const winner of winners) {
        // Score kaydet
        const score = await prisma.score.create({
          data: {
            gameInstanceId,
            userId: winner.userId,
            points: winner.points,
            reason: winner.reason || 'Oyun tamamlandı',
          }
        })

        // Wallet transaction ekle
        await prisma.walletTransaction.create({
          data: {
            userId: winner.userId,
            deltaPoints: winner.points,
            note: winner.reason || 'Oyun kazancı',
            refScoreId: score.id,
            grantedBy: null,
            grantedByName: null,
          }
        })
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'END_GAME',
        targetType: 'GameInstance',
        targetId: gameInstanceId,
        payloadJson: JSON.stringify({ winnersCount: winners?.length || 0 }),
      }
    })

    return NextResponse.json({ 
      message: 'Oyun sonlandırıldı ve puanlar dağıtıldı'
    })
  } catch (error) {
    console.error('Oyun bitirme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

