import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 })
    }

    // Kendi hesabını silemesin
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Kendi hesabınızı silemezsiniz' }, { status: 400 })
    }

    // Kullanıcıyı kontrol et
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Kullanıcının toplam puanını ve oyun sayısını hesapla
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId }
    })
    const totalPoints = transactions.reduce((sum, tx) => sum + tx.deltaPoints, 0)

    const gamesPlayed = await prisma.submission.count({
      where: { userId }
    })

    const fullUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    // Silinen kullanıcıyı çöp kutusuna kaydet
    await prisma.deletedUser.create({
      data: {
        username: user.username,
        email: fullUser?.email || '',
        role: user.role,
        totalPoints,
        gamesPlayed,
        createdAt: fullUser?.createdAt || new Date(),
        deletedBy: session.user.id,
        deletedByUsername: session.user.username
      }
    })

    // İlişkili verileri sil (cascade delete için)
    await prisma.$transaction([
      // Wallet transactions
      prisma.walletTransaction.deleteMany({
        where: { userId }
      }),
      // Scores
      prisma.score.deleteMany({
        where: { userId }
      }),
      // Submissions
      prisma.submission.deleteMany({
        where: { userId }
      }),
      // Audit logs (actor olarak)
      prisma.auditLog.deleteMany({
        where: { actorUserId: userId }
      }),
      // User
      prisma.user.delete({
        where: { id: userId }
      })
    ])

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'DELETE_USER',
        targetType: 'User',
        targetId: userId,
        payloadJson: JSON.stringify({ username: user.username, role: user.role }),
      }
    })

    return NextResponse.json({ 
      message: `${user.username} kullanıcısı başarıyla silindi`
    })
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

