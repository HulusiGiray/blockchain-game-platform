import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const gameInstanceId = searchParams.get('gameInstanceId')

    if (!gameInstanceId) {
      return NextResponse.json({ error: 'Game instance ID gerekli' }, { status: 400 })
    }

    const submissions = await prisma.submission.findMany({
      where: { gameInstanceId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({
      submissions: submissions.map(s => ({
        id: s.id,
        userId: s.userId,
        username: s.user.username,
        payload: JSON.parse(s.payloadJson),
        createdAt: s.createdAt,
        isValid: s.isValid,
      }))
    })
  } catch (error) {
    console.error('Submissions getirme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}



