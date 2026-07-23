import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { blockRateLimit, clearRateLimit, isRateLimited, rateLimit } from '@/lib/rate-limit'

const ADMIN_LOGIN_MAX_ATTEMPTS = 5
const ADMIN_LOGIN_WINDOW_MS = 5 * 60 * 1000
const ADMIN_BLOCK_DURATION_MS = 15 * 60 * 1000

type AuthClaims = {
  id?: string
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'PLATFORM_MANAGER' | 'EVALUATOR'
  platformId?: string | null
  platformName?: string | null
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

        const email = String(credentials.email).trim().toLowerCase()
        const password = credentials.password as string
        const attemptKey = `admin-login:email:${email}`
        const blockKey = `admin-login:block:${email}`

        if (isRateLimited(blockKey)) return null
        const attempt = rateLimit(attemptKey, ADMIN_LOGIN_MAX_ATTEMPTS, ADMIN_LOGIN_WINDOW_MS)
        if (!attempt.success) {
          blockRateLimit(blockKey, ADMIN_BLOCK_DURATION_MS)
          return null
        }

        // Development-only fallback. Production must authenticate against the database.
        if (process.env.NODE_ENV === 'development' && process.env.DEV_ADMIN_EMAIL && process.env.DEV_ADMIN_PASSWORD) {
          if (email === process.env.DEV_ADMIN_EMAIL && password === process.env.DEV_ADMIN_PASSWORD) {
            clearRateLimit(attemptKey)
            clearRateLimit(blockKey)
            return {
              id: 'dev-admin',
              email,
              name: process.env.DEV_ADMIN_NAME || 'Dev Admin',
              role: 'SUPER_ADMIN',
              platformId: null,
              platformName: null,
            }
          }
        }

        try {
          const user = await prisma.adminUser.findUnique({
            where: { email },
            include: { platform: { select: { id: true, name: true } } },
          })

          if (!user || !user.isActive) return null

          const isValid = await bcrypt.compare(password, user.passwordHash)

          if (!isValid) return null

          clearRateLimit(attemptKey)
          clearRateLimit(blockKey)

          await prisma.adminUser.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
            platformId: user.platformId ?? null,
            platformName: user.platform?.name ?? null,
          }
        } catch (error) {
          logger.error('[auth] Database error during login', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const tokenClaims = token as AuthClaims
        const userClaims = user as AuthClaims
        tokenClaims.role = userClaims.role
        tokenClaims.id = user.id
        tokenClaims.platformId = userClaims.platformId ?? null
        tokenClaims.platformName = userClaims.platformName ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as typeof session.user & AuthClaims
        const tokenClaims = token as AuthClaims
        user.role = tokenClaims.role
        user.id = tokenClaims.id || ''
        user.platformId = tokenClaims.platformId
        user.platformName = tokenClaims.platformName
      }
      return session
    },
  },
  pages: {
    signIn: '/ar/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
})
