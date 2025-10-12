# 🎮 Blockchain Game Platform

> An interactive educational game platform for blockchain courses where students earn bonus points by participating in weekly games.

**Live Demo:** [blockchain-game-platform.vercel.app](https://blockchain-game-platform.vercel.app)

---

## ✨ Features

- **Role-Based Access**: Student and admin user management
- **Real-Time Games**: Interactive weekly games controlled by instructors
- **Bonus System**: Performance-based point distribution
- **Leaderboard**: Track student rankings and achievements
- **Responsive Design**: Fully optimized for mobile and desktop
- **Secure Authentication**: NextAuth.js with session management
- **Production-Ready**: PostgreSQL database with Prisma ORM

---

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Authentication**: NextAuth.js
- **Database**: Prisma + PostgreSQL (Neon)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **TypeScript**: Type-safe development

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use Neon/Vercel Postgres)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/HulusiGiray/blockchain-game-platform.git
cd blockchain-game-platform

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create .env file with:
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 4. Run database migrations
npx prisma migrate deploy

# 5. Seed initial data (admin user + games)
npx tsx prisma/seed.ts

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Credentials

### Admin Account
- **Student ID**: `2000004677`
- **Password**: `admin123`

> **Note**: Only enter the 10-digit student number. The system automatically appends `@stu.iku.edu.tr`

---

## 🎯 Usage

### For Students
1. Log in with your credentials
2. Navigate to **Game** tab and wait for active game
3. Participate when instructor starts a game
4. View your points in **My Account** and check **Leaderboard**

### For Instructors (Admin)
1. Log in with admin credentials
2. Go to **Admin Panel**
3. Create new users (students)
4. Start a game and monitor live submissions
5. End game and distribute points automatically

---

## 🎲 Available Games

### Lost Key Operation (Kayıp Anahtar Operasyonu)
A multi-phase cryptographic simulation game teaching digital signatures and verification.

**Phases:**
1. **Lobby**: Players join and wait
2. **Guessing**: Each player guesses a secret number
3. **Signing**: Players sign their guess with their private key
4. **Results**: Verification and scoring

**Scoring:**
- Correct guess: +10 points
- Signature participation: +3 points
- Additional hacker bonus for specific scenarios

---

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Import repository at [vercel.com](https://vercel.com)
   - Add environment variables
   - Deploy automatically

3. **Add Database (Neon)**
   - Install Neon integration in Vercel
   - Database URL auto-configured
   - Run migrations in production

4. **Seed Production Database**
   ```bash
   vercel env pull
   npx tsx prisma/seed.ts
   ```

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration history
│   └── seed.ts                # Seed data script
├── src/
│   ├── app/                   # Next.js app router
│   │   ├── (auth)/login/      # Login page
│   │   ├── admin/             # Admin panel
│   │   ├── game/              # Game interface
│   │   ├── account/           # User account page
│   │   ├── leaderboard/       # Leaderboard page
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── games/             # Game components
│   │   ├── Header.tsx         # Navigation header
│   │   └── Footer.tsx         # Page footer
│   └── lib/                   # Utilities
└── public/                    # Static assets
```

---

## 🔧 Environment Variables

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

---

## 📝 Adding New Games

1. Create game component in `src/components/games/YourGame.tsx`
2. Add game logic and UI
3. Register game in admin panel (`src/app/admin/page.tsx`)
4. Create API endpoints for game actions
5. Update database schema if needed (Prisma migrations)

Example game structure:
```tsx
export default function YourGame({ 
  gameInstance, 
  onComplete 
}: GameProps) {
  // Game logic here
  return <div>Your Game UI</div>
}
```

---

## 🤝 Contributing

This is an educational project. Contributions, issues, and feature requests are welcome!

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👨‍💻 Author

**Hulusi Giray Güzel**  
Developed for blockchain education courses at Istanbul Kültür University

---

## 🙏 Acknowledgments

- Built with Next.js and Vercel
- Database powered by Neon (Serverless Postgres)
- Designed for SEN0401 - Blockchain Technology course

---

**⭐ Star this repo if you find it useful!**
