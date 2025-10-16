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

    const { messageId } = await req.json()

    if (!messageId) {
      return NextResponse.json({ error: 'Mesaj ID gerekli' }, { status: 400 })
    }

    // Mesajı okundu olarak işaretle
    await prisma.message.update({
      where: {
        id: messageId,
        receiverId: session.user.id // Sadece kendi mesajlarını işaretleyebilsin
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({ message: 'Mesaj okundu olarak işaretlendi' })
  } catch (error) {
    console.error('Mesaj işaretleme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

