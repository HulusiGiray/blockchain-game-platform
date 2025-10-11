import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Aktif veya yeni bitmiş oyun var mı?
    const activeGame = await prisma.gameInstance.findFirst({
      where: { 
        status: { in: ['ACTIVE', 'ENDED'] }
      },
      include: { game: true },
      orderBy: { createdAt: 'desc' }
    })

    if (!activeGame) {
      return NextResponse.json({ 
        status: 'waiting',
        message: 'Şu anda aktif oyun yok'
      })
    }

    // Oyun bittiyse kontrol et
    if (activeGame.status === 'ENDED') {
      // Kullanıcı bu oyuna katıldı mı?
      const userParticipated = await prisma.submission.findFirst({
        where: {
          userId: session.user.id,
          gameInstanceId: activeGame.id
        }
      })

      // Katılmadıysa, bekleme döndür
      if (!userParticipated) {
        return NextResponse.json({ 
          status: 'waiting',
          message: 'Şu anda aktif oyun yok'
        })
      }

      // Oyun bittikten 3 dakika geçtiyse, artık gösterme
      const endTime = activeGame.endAt ? new Date(activeGame.endAt).getTime() : 0
      const now = new Date().getTime()
      const threeMinutes = 3 * 60 * 1000
      
      if (endTime && (now - endTime) > threeMinutes) {
        return NextResponse.json({ 
          status: 'waiting',
          message: 'Şu anda aktif oyun yok'
        })
      }
    }

    // Kullanıcı bu oyuna katıldı mı?
    const submission = await prisma.submission.findFirst({
      where: {
        userId: session.user.id,
        gameInstanceId: activeGame.id
      }
    })

    // Config'i parse et
    let parsedConfig = {}
    if (activeGame.config) {
      try {
        parsedConfig = JSON.parse(activeGame.config)
      } catch (e) {
        console.error('Config parse error:', e)
      }
    }

    return NextResponse.json({
      status: 'active',
      game: {
        id: activeGame.id,
        code: activeGame.game.code,
        title: activeGame.game.title,
        description: activeGame.game.description,
        config: parsedConfig,
        weekNo: activeGame.weekNo,
        hasSubmitted: !!submission,
        submission: submission
      }
    })
  } catch (error) {
    console.error('Game current error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

