import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Fake blockchain address generator
function generateFakeAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let address = '1' // Bitcoin addresses start with 1
  for (let i = 0; i < 8; i++) {
    address += chars[Math.floor(Math.random() * chars.length)]
  }
  return address + '...'
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { gameInstanceId, gameCode, weekNo, config } = await req.json()

    // Eğer gameInstanceId varsa, SCHEDULED oyunu ACTIVE yap
    if (gameInstanceId) {
      const gameInstance = await prisma.gameInstance.findUnique({
        where: { id: gameInstanceId },
        include: {
          game: true,
          waitingRoom: {
            include: { user: true }
          }
        }
      })

      if (!gameInstance || gameInstance.status !== 'SCHEDULED') {
        return NextResponse.json({ error: 'Başlatılacak oyun bulunamadı' }, { status: 404 })
      }

      // Lobideki oyuncuları al (ADMIN HARİÇ!)
      const players = gameInstance.waitingRoom
        .filter(wr => wr.user.role === 'STUDENT')
        .map(wr => ({
          userId: wr.user.id,
          username: wr.user.username,
          email: wr.user.email,
          address: generateFakeAddress() // Fake blockchain address
        }))

      if (players.length === 0) {
        return NextResponse.json({ error: 'Lobide hiç öğrenci yok!' }, { status: 400 })
      }

      // Rastgele bir oyuncuyu owner yap
      const randomIndex = Math.floor(Math.random() * players.length)
      const ownerId = players[randomIndex].userId

      // Kayıp Anahtar oyunu için özel config
      const gameConfig = {
        ownerPlayerId: ownerId,
        players: players,
        gamePhase: 'GUESSING', // GUESSING -> SIGNING -> ENDED
        startedAt: new Date().toISOString()
      }

      // Oyunu başlat
      await prisma.gameInstance.update({
        where: { id: gameInstanceId },
        data: {
          status: 'ACTIVE',
          config: JSON.stringify(gameConfig),
          startAt: new Date()
        }
      })

      // Waiting room'u temizle
      await prisma.gameWaitingRoom.deleteMany({
        where: { gameInstanceId }
      })

      return NextResponse.json({ 
        message: 'Oyun başlatıldı!',
        gameInstance,
        playersCount: players.length
      })
    }

    // Yeni oyun oluştur (SCHEDULED)
    if (!gameCode || !weekNo) {
      return NextResponse.json({ error: 'Game code ve hafta numarası gerekli' }, { status: 400 })
    }

    // Önce aktif ve scheduled oyunları bitir
    await prisma.gameInstance.updateMany({
      where: { status: { in: ['ACTIVE', 'SCHEDULED'] } },
      data: { status: 'ENDED', endAt: new Date() }
    })

    // Game template bul veya oluştur
    let game = await prisma.game.findUnique({
      where: { code: gameCode }
    })

    if (!game) {
      game = await prisma.game.create({
        data: {
          code: gameCode,
          title: config?.title || gameCode,
          description: config?.description || '',
          configJson: config ? JSON.stringify(config) : null,
        }
      })
    }

    // Yeni oyun instance'ı oluştur (SCHEDULED - henüz başlamadı)
    const gameInstance = await prisma.gameInstance.create({
      data: {
        gameId: game.id,
        weekNo,
        status: 'SCHEDULED',
        createdBy: session.user.id,
      }
    })

    // Config'i güncelle
    if (config) {
      await prisma.game.update({
        where: { id: game.id },
        data: { configJson: JSON.stringify(config) }
      })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'START_GAME',
        targetType: 'GameInstance',
        targetId: gameInstance.id,
        payloadJson: JSON.stringify({ gameCode, weekNo }),
      }
    })

    return NextResponse.json({ 
      message: 'Oyun başlatıldı',
      gameInstance 
    })
  } catch (error) {
    console.error('Oyun başlatma hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

