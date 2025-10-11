import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            scores: true,
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Her kullanıcının toplam puanını hesapla
    const usersWithPoints = await Promise.all(
      users.map(async (user) => {
        const transactions = await prisma.walletTransaction.findMany({
          where: { userId: user.id }
        })
        const totalPoints = transactions.reduce((sum, tx) => sum + tx.deltaPoints, 0)
        
        return {
          ...user,
          totalPoints,
          gamesPlayed: user._count.submissions,
          scoresCount: user._count.scores,
          createdAt: user.createdAt
        }
      })
    )

    return NextResponse.json({ users: usersWithPoints })
  } catch (error) {
    console.error('Kullanıcı listesi getirme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

