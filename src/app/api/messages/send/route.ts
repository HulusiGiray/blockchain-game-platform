import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { receiverId, message } = await req.json()

    if (!receiverId || !message) {
      return NextResponse.json({ error: 'Alıcı ve mesaj gerekli' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Mesaj en fazla 500 karakter olabilir' }, { status: 400 })
    }

    // Alıcı admin mi kontrol et
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { role: true }
    })

    if (!receiver || receiver.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sadece adminlere mesaj gönderebilirsiniz' }, { status: 400 })
    }

    // Mesaj oluştur
    const newMessage = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        message
      }
    })

    return NextResponse.json({ 
      message: 'Mesaj başarıyla gönderildi',
      messageId: newMessage.id
    })
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

