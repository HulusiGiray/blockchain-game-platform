import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed başlatılıyor...')

  // Admin kullanıcı oluştur
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: '2000004677@stu.iku.edu.tr' },
    update: {},
    create: {
      username: 'Hulusi Giray',
      email: '2000004677@stu.iku.edu.tr',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin oluşturuldu:', admin.username)

  // Not: Öğrenciler admin panelden manuel olarak eklenecek

  // Oyun template'leri oluştur
  const lostKeyGame = await prisma.game.upsert({
    where: { code: 'lost-key' },
    update: {},
    create: {
      code: 'lost-key',
      title: 'Kayıp Anahtar Operasyonu',
      description: 'Private key sahibini bul! Sadece gerçek sahip geçerli imza atabilir.',
      isActiveTemplate: true,
    },
  })
  console.log('✅ Oyun template oluşturuldu:', lostKeyGame.title)

  console.log('🎉 Seed tamamlandı!')
  console.log('')
  console.log('📋 Giriş Bilgileri:')
  console.log('  Admin (Hulusi Giray):')
  console.log('    Öğrenci No: 2000004677')
  console.log('    Şifre: admin123')
  console.log('')
  console.log('  Not: Giriş için sadece öğrenci numarasını girin!')
  console.log('       @stu.iku.edu.tr otomatik eklenir.')
  console.log('')
  console.log('  Öğrenci eklemek için Admin Panel kullanın!')
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
