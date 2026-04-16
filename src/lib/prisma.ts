import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    // Return a no-op client for build time
    return new PrismaClient()
  }

  // Standard postgresql:// URL — use PrismaPg adapter
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    try {
      const { PrismaPg } = require('@prisma/adapter-pg')
      const adapter = new PrismaPg({ connectionString: dbUrl })
      return new PrismaClient({ adapter })
    } catch {
      return new PrismaClient()
    }
  }

  // Prisma Postgres URL (prisma+postgres://) — use PrismaPostgres adapter
  if (dbUrl.startsWith('prisma+postgres://')) {
    try {
      const { PrismaPostgres } = require('@prisma/adapter-pg')
      const adapter = new PrismaPostgres({ connectionString: dbUrl })
      return new PrismaClient({ adapter })
    } catch {
      return new PrismaClient()
    }
  }

  return new PrismaClient()
}

export const prisma = global.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
