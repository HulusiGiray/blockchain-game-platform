import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcrypt'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { username, email, password, role } = await req.json()

    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 })
    }

    // E-posta formatı kontrolü (okul maili)
    const emailRegex = /^[0-9]{10}@stu\.iku\.edu\.tr$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'E-posta formatı geçersiz. Format: 2200004567@stu.iku.edu.tr' 
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır' }, { status: 400 })
    }

    // Kullanıcı adı kontrolü
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json({ error: 'Bu kullanıcı adı zaten kullanılıyor' }, { status: 400 })
    }

    // Email kontrolü
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kullanılıyor' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        role: role as 'ADMIN' | 'STUDENT',
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'CREATE_USER',
        targetType: 'User',
        targetId: user.id,
        payloadJson: JSON.stringify({ username, email, role }),
      }
    })

    return NextResponse.json({ 
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

