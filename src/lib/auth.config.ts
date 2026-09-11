import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Minimal auth config for edge runtime (middleware)
// Does NOT include adapter or any Node.js-only modules
export const authConfig: NextAuthConfig = {
  // Trust the host from the incoming request (X-Forwarded-Host) instead of
  // requiring a hardcoded NEXTAUTH_URL. Vercel deployments get a new URL
  // per-deploy plus a stable alias, so a fixed NEXTAUTH_URL either goes
  // stale or has to be updated on every deploy. This is the Vercel/Auth.js
  // recommended approach. See: https://authjs.dev/reference/nextjs#trusthost
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
  providers: [
    // Credentials provider is listed here for edge compat;
    // actual authorize logic is in auth.ts (Node runtime only)
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize() {
        return null // handled in full auth.ts
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl
      const session = auth
      const role = (session?.user as { role?: string } | undefined)?.role

      if (pathname.startsWith('/seller/')) {
        if (!session) return Response.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, nextUrl))
        if (role !== 'SELLER' && role !== 'EMPLOYEE' && role !== 'ADMIN') return Response.redirect(new URL('/', nextUrl))
      }
      if (pathname.startsWith('/buyer/')) {
        if (!session) return Response.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, nextUrl))
      }
      if (pathname.startsWith('/planner/')) {
        if (!session) return Response.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, nextUrl))
        if (role !== 'PLANNER' && role !== 'ADMIN') return Response.redirect(new URL('/', nextUrl))
      }
      if (pathname.startsWith('/admin/')) {
        if (!session || role !== 'ADMIN') return Response.redirect(new URL('/', nextUrl))
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role || 'BUYER'
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
