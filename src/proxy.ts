import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

// Edge-safe route protection: a lightweight NextAuth instance built from the
// shared, Node-free `authConfig` (no Prisma adapter). This intentionally
// reuses the SAME session-verification path (`auth()`/JWT decode) that the
// full instance in `lib/auth.ts` uses for everything else, via the
// `authorized` callback already defined in `auth.config.ts` — rather than
// re-deriving a session from a raw `getToken()` call, which needs its own
// cookie-name/salt configuration to match next-auth v5's token encoding and
// had drifted out of sync, causing signed-in buyers/sellers/admins to be
// bounced back to sign-in when hitting a protected route.
const { auth } = NextAuth(authConfig)

export { auth as proxy }

export const config = {
  matcher: [
    '/seller/:path*',
    '/buyer/:path*',
    '/planner/:path*',
    '/admin/:path*',
  ],
}
