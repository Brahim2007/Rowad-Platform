import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const DEV_ADMIN = {
  email: 'admin@rowad-network.org',
  password: 'Admin@2024!',
  id: 'dev-admin',
  name: 'المدير',
  role: 'SUPER_ADMIN',
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'البريد الإلكتروني', type: 'email' },
        password: { label: 'كلمة المرور', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        // Development fallback when database is unavailable
        if (process.env.NODE_ENV === 'development') {
          if (email === DEV_ADMIN.email && password === DEV_ADMIN.password) {
            return { id: DEV_ADMIN.id, email: DEV_ADMIN.email, name: DEV_ADMIN.name, role: DEV_ADMIN.role }
          }
        }

        try {
          const user = await prisma.adminUser.findUnique({
            where: { email },
          })

          if (!user || !user.isActive) return null

          const isValid = await bcrypt.compare(password, user.passwordHash)

          if (!isValid) return null

          await prisma.adminUser.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
          }
        } catch (error) {
          console.error('[auth] Database error during login:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ;(token as any).role = (user as any).role
        ;(token as any).id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as any
        u.role = (token as any).role
        u.id = (token as any).id
      }
      return session
    },
  },
  pages: {
    signIn: '/ar/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
})
