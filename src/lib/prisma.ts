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

// Lazily construct the client on first actual use rather than at module
// import time. Next.js evaluates route modules (top-level code included)
// during its build-time "Collecting page data" phase, which previously
// forced a real PrismaClient (and DB adapter) to be constructed during the
// build itself -- crashing the build in environments where DATABASE_URL
// isn't surfaced to that phase, even though every request handler that
// actually needs it runs fine at runtime.
function getPrismaClient(): PrismaClient {
  if (!global.prisma) {
    global.prisma = createPrismaClient()
  }
  return global.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver)
  },
})

export default prisma
