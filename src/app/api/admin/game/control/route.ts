import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Admin game control endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, gameInstanceId } = await request.json()

    switch (action) {
      case 'start_sign_phase': {
        // İmza turunu başlat
        const gameInstance = await prisma.gameInstance.findUnique({
          where: { id: gameInstanceId }
        })

        if (!gameInstance) {
          return NextResponse.json({ error: 'Game not found' }, { status: 404 })
        }

        const config = JSON.parse(gameInstance.config || '{}')
        config.gamePhase = 'SIGNING'
        config.signPhaseStartedAt = new Date().toISOString()

        await prisma.gameInstance.update({
          where: { id: gameInstanceId },
          data: { config: JSON.stringify(config) }
        })

        return NextResponse.json({ success: true, phase: 'SIGNING' })
      }

      case 'reveal_results': {
        // Sonuçları açıkla
        const gameInstance = await prisma.gameInstance.findUnique({
          where: { id: gameInstanceId },
          include: {
            game: true,
            submissions: {
              include: { user: true }
            }
          }
        })

        if (!gameInstance) {
          return NextResponse.json({ error: 'Game not found' }, { status: 404 })
        }

        const config = JSON.parse(gameInstance.config || '{}')
        const ownerId = config.ownerPlayerId
        const players = config.players || []

        // Puanları hesapla ve ver
        for (const player of players) {
          let points = 1 // Katılım bonusu

          // Gerçek owner mı?
          if (player.userId === ownerId) {
            points = 5 // Owner bonusu
          } else {
            // Doğru tahmin etti mi?
            const guessSubmission = await prisma.submission.findFirst({
              where: {
                gameInstanceId,
                userId: player.userId,
                submissionType: 'GUESS'
              }
            })

            if (guessSubmission) {
              const guessData = JSON.parse(guessSubmission.payloadJson)
              if (guessData.guessedOwnerId === ownerId) {
                points = 3 // Doğru tahmin bonusu
              }
            }
          }

          // Score kaydet
          await prisma.score.create({
            data: {
              gameInstanceId,
              userId: player.userId,
              points,
              reason: player.userId === ownerId 
                ? 'Gerçek private key sahibi' 
                : points === 3 
                  ? 'Doğru tahmin' 
                  : 'Katılım bonusu'
            }
          })

          // Wallet transaction ekle
          await prisma.walletTransaction.create({
            data: {
              userId: player.userId,
              deltaPoints: points,
              note: `${gameInstance.game.title} - Hafta ${gameInstance.weekNo}`
            }
          })
        }

        // Oyun durumunu güncelle
        config.gamePhase = 'ENDED'
        config.revealedAt = new Date().toISOString()

        await prisma.gameInstance.update({
          where: { id: gameInstanceId },
          data: {
            status: 'ENDED',
            config: JSON.stringify(config),
            endAt: new Date()
          }
        })

        return NextResponse.json({ 
          success: true, 
          phase: 'ENDED',
          ownerId 
        })
      }

      case 'start_hacker_mode': {
        // Hacker modu simülasyonu
        const gameInstance = await prisma.gameInstance.findUnique({
          where: { id: gameInstanceId }
        })

        if (!gameInstance) {
          return NextResponse.json({ error: 'Game not found' }, { status: 404 })
        }

        const config = JSON.parse(gameInstance.config || '{}')
        config.hackerModeActive = true
        config.hackerModeStartedAt = new Date().toISOString()

        await prisma.gameInstance.update({
          where: { id: gameInstanceId },
          data: { config: JSON.stringify(config) }
        })

        return NextResponse.json({ success: true, hackerMode: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Game control error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

