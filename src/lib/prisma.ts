import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const rawUrl = process.env.ROWAD_DATABASE_URL!.replace(/^["']|["']$/g, '')
  const url = new URL(rawUrl)
  // pgbouncer=true is required for db.prisma.io — do NOT remove it
  // Limit to 1 connection per serverless instance; PgBouncer pools on the other side
  url.searchParams.set('connection_limit', '5')
  url.searchParams.set('pool_timeout', '30')

  return new PrismaClient({
    datasources: {
      db: { url: url.toString() },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Reuse the client across hot-reloads in dev and across invocations in prod
globalForPrisma.prisma = prisma
