import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    // Kullanıcının toplam bonus puanını hesapla
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    const totalPoints = transactions.reduce((sum, tx) => sum + tx.deltaPoints, 0)

    // Katıldığı oyun sayısı (Submission tablosundan)
    const gamesPlayed = await prisma.submission.count({
      where: { userId: session.user.id }
    })

    // Katıldığı oyunların listesi
    const submissions = await prisma.submission.findMany({
      where: { userId: session.user.id },
      include: {
        gameInstance: {
          include: {
            game: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const uniqueGames = [...new Set(submissions.map(s => s.gameInstance.game.title))]

    // Wallet transactions'ları bonus geçmişi olarak formatla
    const bonusHistory = await Promise.all(transactions.map(async (tx) => {
      let source = ''
      let reason = tx.note || 'Bonus'
      
      if (tx.grantedBy && tx.grantedByName) {
        // Admin tarafından manuel bonus
        source = `${tx.grantedByName} (Admin)`
        reason = tx.note || 'Manuel bonus'
      } else if (tx.refScoreId) {
        // Oyundan gelen bonus
        const score = await prisma.score.findUnique({
          where: { id: tx.refScoreId },
          include: {
            gameInstance: {
              include: { game: true }
            }
          }
        })
        source = score ? `${score.gameInstance.game.title} oyununa katıldı` : 'Oyun Bonusu'
        reason = tx.note || 'Oyun kazancı'
      } else {
        source = 'Sistem Bonusu'
      }

      return {
        points: tx.deltaPoints,
        source,
        date: tx.createdAt,
        reason
      }
    }))

    return NextResponse.json({ 
      totalPoints,
      gamesPlayed,
      uniqueGames,
      bonusHistory: bonusHistory.slice(0, 20) // Son 20 kayıt
    })
  } catch (error) {
    console.error('Bakiye getirme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

