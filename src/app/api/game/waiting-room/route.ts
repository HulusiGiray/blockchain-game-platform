import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const gameInstanceId = searchParams.get('gameInstanceId')

    if (!gameInstanceId) {
      // SCHEDULED oyun var mı kontrol et
      const scheduledGame = await prisma.gameInstance.findFirst({
        where: { status: 'SCHEDULED' },
        include: {
          waitingRoom: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            },
            orderBy: { joinedAt: 'asc' }
          },
          game: true
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!scheduledGame) {
        return NextResponse.json({ waiting: [] })
      }

      const isUserInWaiting = scheduledGame.waitingRoom.some(w => w.userId === session.user.id)

      return NextResponse.json({
        gameInstanceId: scheduledGame.id,
        gameTitle: scheduledGame.game.title,
        weekNo: scheduledGame.weekNo,
        isUserInWaiting,
        waiting: scheduledGame.waitingRoom.map(w => ({
          userId: w.user.id,
          username: w.user.username,
          studentNumber: w.user.email?.split('@')[0],
          joinedAt: w.joinedAt,
          isReady: w.isReady
        }))
      })
    }

    // Belirli bir oyun için
    const waitingUsers = await prisma.gameWaitingRoom.findMany({
      where: { gameInstanceId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    })

    return NextResponse.json({
      waiting: waitingUsers.map(w => ({
        userId: w.user.id,
        username: w.user.username,
        studentNumber: w.user.email?.split('@')[0],
        joinedAt: w.joinedAt,
        isReady: w.isReady
      }))
    })
  } catch (error) {
    console.error('Waiting room getirme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}



