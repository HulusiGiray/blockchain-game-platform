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

    const { gameInstanceId, payload } = await req.json()

    if (!gameInstanceId || !payload) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }

    // Oyun aktif mi kontrol et
    const gameInstance = await prisma.gameInstance.findUnique({
      where: { id: gameInstanceId },
      include: { game: true }
    })

    if (!gameInstance || gameInstance.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Oyun aktif değil' }, { status: 400 })
    }

    // Kullanıcı daha önce katıldı mı?
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        unique_submission_per_game_instance_user: {
          gameInstanceId,
          userId: session.user.id
        }
      }
    })

    if (existingSubmission) {
      return NextResponse.json({ error: 'Bu oyuna zaten katıldınız' }, { status: 400 })
    }

    // Submission kaydet
    const submission = await prisma.submission.create({
      data: {
        gameInstanceId,
        userId: session.user.id,
        payloadJson: JSON.stringify(payload),
      }
    })

    return NextResponse.json({ 
      message: 'Cevabınız kaydedildi',
      submission 
    })
  } catch (error) {
    console.error('Submission kaydetme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}



