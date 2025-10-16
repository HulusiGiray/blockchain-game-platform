import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    // Admin'e gelen mesajları çek
    const messages = await prisma.message.findMany({
      where: {
        receiverId: session.user.id
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Okunmamış mesaj sayısı
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        isRead: false
      }
    })

    return NextResponse.json({ 
      messages,
      unreadCount
    })
  } catch (error) {
    console.error('Mesaj listesi yükleme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

