import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  var prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.warn('[prisma] DATABASE_URL is not set — DB queries will fail at runtime')
    return new PrismaClient()
  }

  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    const adapter = new PrismaPg({ connectionString: dbUrl })
    return new PrismaClient({ adapter })
  }

  // Fallback for other URL schemes (e.g., connection poolers that accept standard URLs)
  console.warn('[prisma] Unrecognised DATABASE_URL scheme — trying without adapter')
  return new PrismaClient()
}

export const prisma = global.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
