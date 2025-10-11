import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gameInstanceId = searchParams.get('gameInstanceId')

    if (!gameInstanceId) {
      return NextResponse.json({ error: 'Game instance ID required' }, { status: 400 })
    }

    const gameInstance = await prisma.gameInstance.findUnique({
      where: { id: gameInstanceId },
      include: {
        game: true,
        submissions: {
          include: { user: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!gameInstance) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const config = JSON.parse(gameInstance.config || '{}')
    const players = config.players || []
    const ownerId = config.ownerPlayerId

    // Her oyuncu için tahmin ve imza durumunu topla
    const playerStatuses = players.map((player: any) => {
      const guessSubmission = gameInstance.submissions.find(
        s => s.userId === player.userId && s.submissionType === 'GUESS'
      )
      const signSubmission = gameInstance.submissions.find(
        s => s.userId === player.userId && s.submissionType === 'SIGN'
      )

      let guessedPlayer = null
      if (guessSubmission) {
        const guessData = JSON.parse(guessSubmission.payloadJson)
        const guessed = players.find((p: any) => p.userId === guessData.guessedOwnerId)
        guessedPlayer = guessed ? guessed.username : 'Bilinmiyor'
      }

      let signResult = null
      let signTime = null
      if (signSubmission) {
        const signData = JSON.parse(signSubmission.payloadJson)
        signResult = signData.valid
        signTime = signSubmission.createdAt
      }

      return {
        userId: player.userId,
        username: player.username,
        address: player.address,
        isOwner: player.userId === ownerId,
        guessedPlayer,
        guessedAt: guessSubmission?.createdAt,
        signResult,
        signedAt: signTime
      }
    })

    // İstatistikler
    const guessCount = gameInstance.submissions.filter(s => s.submissionType === 'GUESS').length
    const signCount = gameInstance.submissions.filter(s => s.submissionType === 'SIGN').length
    const validSignCount = gameInstance.submissions.filter(s => s.submissionType === 'SIGN' && s.isValid).length

    return NextResponse.json({
      gameInstance: {
        id: gameInstance.id,
        title: gameInstance.game.title,
        weekNo: gameInstance.weekNo,
        status: gameInstance.status,
        phase: config.gamePhase
      },
      ownerId,
      players: playerStatuses,
      stats: {
        totalPlayers: players.length,
        guessCount,
        signCount,
        validSignCount
      }
    })
  } catch (error) {
    console.error('Live status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

