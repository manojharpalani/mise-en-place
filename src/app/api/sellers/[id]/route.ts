import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const seller = await prisma.sellerProfile.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true, neighborhood: true } } },
  })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(seller)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    const seller = await prisma.sellerProfile.findUnique({ where: { id } })
    if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (seller.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { neighborhood, zip, storeSlug, ...sellerData } = body

    // Validate + check uniqueness of new storeSlug
    if (storeSlug !== undefined && storeSlug !== seller.storeSlug) {
      if (!SLUG_RE.test(storeSlug)) {
        return NextResponse.json(
          { error: 'Store URL must be 3–50 lowercase letters, numbers, or hyphens (no leading/trailing hyphens)' },
          { status: 422 }
        )
      }
      const conflict = await prisma.sellerProfile.findUnique({ where: { storeSlug } })
      if (conflict) {
        return NextResponse.json({ error: 'That store URL is already taken' }, { status: 409 })
      }
      sellerData.storeSlug = storeSlug
    }

    if (neighborhood !== undefined || zip !== undefined) {
      await prisma.user.update({
        where: { id: seller.userId },
        data: {
          ...(neighborhood !== undefined && { neighborhood }),
          ...(zip !== undefined && { zip }),
        },
      })
    }

    const updated = await prisma.sellerProfile.update({
      where: { id },
      data: sellerData,
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Update seller error:', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.sellerProfile.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
