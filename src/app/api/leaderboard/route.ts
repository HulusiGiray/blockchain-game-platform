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

    // Tüm öğrencileri getir
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        username: true,
        _count: {
          select: {
            scores: true,
            submissions: true
          }
        }
      }
    })

    // Her kullanıcının toplam puanını hesapla
    const leaderboard = await Promise.all(
      users.map(async (user) => {
        const transactions = await prisma.walletTransaction.findMany({
          where: { userId: user.id }
        })
        const totalPoints = transactions.reduce((sum, tx) => sum + tx.deltaPoints, 0)
        
        return {
          id: user.id,
          username: user.username,
          totalPoints,
          gamesPlayed: user._count.submissions,
          scoresCount: user._count.scores
        }
      })
    )

    // Puana göre sırala (en yüksekten en düşüğe)
    // Not: Puan 0 olanlar da gösterilir
    const sortedLeaderboard = leaderboard
      .sort((a, b) => b.totalPoints - a.totalPoints)

    return NextResponse.json({ 
      leaderboard: sortedLeaderboard,
      currentUserId: session.user.id 
    })
  } catch (error) {
    console.error('Liderlik tablosu hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

