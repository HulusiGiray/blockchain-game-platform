import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    // Tüm adminleri listele
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        username: true,
        email: true
      },
      orderBy: {
        username: 'asc'
      }
    })

    return NextResponse.json({ admins })
  } catch (error) {
    console.error('Admin listesi yükleme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

