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

    const { userId, points, reason } = await req.json()

    if (!userId || !points) {
      return NextResponse.json({ error: 'Kullanıcı ID ve puan gerekli' }, { status: 400 })
    }

    if (points <= 0) {
      return NextResponse.json({ error: 'Puan 0\'dan büyük olmalıdır' }, { status: 400 })
    }

    // Kullanıcıyı kontrol et
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Wallet transaction ekle
    await prisma.walletTransaction.create({
      data: {
        userId,
        deltaPoints: points,
        note: reason || 'Admin tarafından manuel bonus',
        grantedBy: session.user.id,
        grantedByName: session.user.username,
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'ADD_MANUAL_BONUS',
        targetType: 'User',
        targetId: userId,
        payloadJson: JSON.stringify({ points, reason, username: user.username }),
      }
    })

    return NextResponse.json({ 
      message: `${user.username} kullanıcısına ${points} bonus puan eklendi`
    })
  } catch (error) {
    console.error('Bonus ekleme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

