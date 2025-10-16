import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    // Tüm logları çek - en yeniden eskiye doğru
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200, // Son 200 log
    })

    // Log içeriklerini parse et ve zenginleştir
    const enrichedLogs = logs.map((log) => {
      let payload = null
      try {
        if (log.payloadJson) {
          payload = JSON.parse(log.payloadJson)
        }
      } catch (e) {
        payload = log.payloadJson
      }

      return {
        id: log.id,
        actor: log.actor,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        payload,
        createdAt: log.createdAt,
      }
    })

    return NextResponse.json({ logs: enrichedLogs })
  } catch (error) {
    console.error('Log yükleme hatası:', error)
    return NextResponse.json({ error: 'Log yükleme hatası' }, { status: 500 })
  }
}

