import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    // SCHEDULED durumundaki oyunu bul
    const scheduledGame = await prisma.gameInstance.findFirst({
      where: { status: 'SCHEDULED' },
      orderBy: { createdAt: 'desc' }
    })

    if (!scheduledGame) {
      return NextResponse.json({ error: 'Bekleyen oyun bulunamadı' }, { status: 404 })
    }

    // Waiting room'a ekle (zaten varsa güncelle)
    const waitingEntry = await prisma.gameWaitingRoom.upsert({
      where: {
        gameInstanceId_userId: {
          gameInstanceId: scheduledGame.id,
          userId: session.user.id
        }
      },
      update: {
        isReady: true,
        joinedAt: new Date()
      },
      create: {
        gameInstanceId: scheduledGame.id,
        userId: session.user.id,
        isReady: true
      }
    })

    return NextResponse.json({ 
      message: 'Lobiye katıldınız',
      gameInstanceId: scheduledGame.id
    })
  } catch (error) {
    console.error('Lobby katılma hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}



