# Blockchain Oyunları - Eğitsel Oyun Platformu

Blockchain dersi için tasarlanmış interaktif oyun platformu. Öğrenciler oyunlara katılarak bonus puan kazanır ve dönem sonunda bu puanlar sınav bonusuna dönüşür.

## 🎮 Özellikler

- **Kullanıcı Sistemi**: Öğrenci ve admin rolleri
- **Oyun Yönetimi**: Admin tarafından kontrol edilen haftalık oyunlar
- **Bonus Sistemi**: Oyun performansına göre puan kazanma
- **Güvenli Veri Tabanı**: Prisma ile SQLite (production'da PostgreSQL kullanılabilir)
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Environment Değişkenlerini Ayarlayın

`.env` dosyası oluşturun (veya `.env.example`'ı kopyalayın):

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="blockchain-game-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Veritabanını Hazırlayın

```bash
# Prisma migrate
npx prisma migrate dev

# Seed (örnek kullanıcılar ve oyunlar)
npm run seed
```

### 4. Uygulamayı Başlatın

```bash
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresine gidin.

## 👤 Giriş Bilgileri

### Admin (Hulusi Giray)
- **Öğrenci Numarası**: `2000004677`
- **Şifre**: `admin123`

### Giriş Sistemi
- Giriş yaparken sadece **10 haneli öğrenci numaranızı** girin
- `@stu.iku.edu.tr` otomatik olarak eklenir
- Örnek: `2000004677` yazın → Sistem `2000004677@stu.iku.edu.tr` olarak işler

### Örnek Öğrenciler (Eski Format - Güncellenecek)
- **E-postalar**: `ahmet@student.edu`, `mehmet@student.edu`, vs.
- **Şifre**: `student123`

## 🎯 Kullanım

### Öğrenci Olarak

1. Giriş yapın
2. **Oyun** sayfasında aktif oyunu bekleyin
3. Admin oyunu başlattığında katılın
4. **Hesabım** sayfasından bonus puanlarınızı görüntüleyin ve şifrenizi değiştirin

### Admin Olarak

1. Admin hesabıyla giriş yapın
2. **Admin Panel**'e gidin
3. Yeni oyun başlatın:
   - Oyun türünü seçin (Bit Tahmin Oyunu)
   - Hafta numarasını girin
   - Bit uzunluğunu ve doğru cevabı belirleyin
4. Katılımcıları takip edin
5. Oyunu bitirin ve puanları otomatik dağıtın

## 🎲 Oyunlar

### Bit Tahmin Oyunu

Bitcoin'deki anahtar uzunluğunu anlamak için tasarlanmış oyun. Admin gizli bir sayı tutar, öğrenciler tahmin eder.

**Puanlama**:
- İlk doğru tahmin: 10 puan
- İkinci doğru tahmin: 7 puan
- Üçüncü doğru tahmin: 5 puan
- Diğer doğru tahminler: 3 puan

## 📦 Production'a Yükleme

### Vercel'e Deploy

1. Projeyi GitHub'a yükleyin
2. Vercel'de projeyi import edin
3. Environment değişkenlerini ekleyin
4. Deploy edin

### PostgreSQL Kullanımı

Production'da SQLite yerine PostgreSQL kullanmanız önerilir:

1. `prisma/schema.prisma`'da provider'ı değiştirin:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. DATABASE_URL'i PostgreSQL connection string olarak güncelleyin
3. Migrate çalıştırın: `npx prisma migrate deploy`

## 🔧 Teknolojiler

- **Framework**: Next.js 15
- **Authentication**: NextAuth.js
- **Database**: Prisma + SQLite (dev) / PostgreSQL (prod)
- **Styling**: Tailwind CSS
- **TypeScript**: Type-safe kod

## 📝 Yeni Oyun Ekleme

1. `src/components/games/` klasörüne yeni oyun componenti ekleyin
2. `src/app/game/page.tsx`'da game code kontrolü ekleyin
3. `src/app/admin/page.tsx`'da oyun seçeneklerini ekleyin
4. Gerekli API endpoint'lerini oluşturun

## 🤝 Katkıda Bulunma

Bu proje eğitim amaçlıdır. Önerileriniz için issue açabilirsiniz.

## 📄 Lisans

MIT

## 🎓 Yapımcı Notları

Bu platform, blockchain derslerinde kullanılan oyunları dijitalleştirmek ve öğrenci katılımını artırmak için geliştirilmiştir. Her hafta farklı oyunlar ekleyerek dersi daha eğlenceli hale getirebilirsiniz!
