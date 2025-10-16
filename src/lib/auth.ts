import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        studentNumber: { label: "Öğrenci Numarası", type: "text" },
        password: { label: "Şifre", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.studentNumber || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        // E-posta veya öğrenci numarası kontrolü
        let email: string
        if (credentials.studentNumber.includes('@')) {
          // Direkt e-posta girilmiş (adminler için)
          email = credentials.studentNumber
        } else {
          // Öğrenci numarası girilmiş, domain ekle
          email = `${credentials.studentNumber}@stu.iku.edu.tr`
        }
        
        console.log('🔍 Looking for user with email:', email)

        const user = await prisma.user.findUnique({
          where: {
            email: email
          }
        })

        if (!user) {
          console.log('❌ User not found')
          return null
        }

        console.log('✅ User found:', user.username)

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          console.log('❌ Invalid password')
          return null
        }

        console.log('✅ Password valid')

        // Son giriş zamanını güncelle
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          username: user.username,
          role: user.role,
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          username: token.username,
          role: token.role,
        }
      }
    },
  },
}

