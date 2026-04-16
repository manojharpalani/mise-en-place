import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  const role = (token as { role?: string } | null)?.role

  // Seller routes
  if (pathname.startsWith('/seller/')) {
    if (!token) {
      return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, req.url))
    }
    if (role !== 'SELLER' && role !== 'EMPLOYEE' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Buyer routes
  if (pathname.startsWith('/buyer/')) {
    if (!token) {
      return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, req.url))
    }
  }

  // Admin routes
  if (pathname.startsWith('/admin/')) {
    if (!token || role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/seller/:path*',
    '/buyer/:path*',
    '/admin/:path*',
  ],
}
