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

    const { gameCode, weekNo, config } = await req.json()

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

    // Yeni oyun instance'ı oluştur (SCHEDULED durumunda - henüz başlamadı)
    const gameInstance = await prisma.gameInstance.create({
      data: {
        gameId: game.id,
        weekNo,
        status: 'SCHEDULED',
        createdBy: session.user.id,
      }
    })

    return NextResponse.json({ 
      message: 'Oyun oluşturuldu. Öğrenciler lobiye katılabilir.',
      gameInstance 
    })
  } catch (error) {
    console.error('Oyun oluşturma hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}



