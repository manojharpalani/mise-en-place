import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  storeName: z.string().min(2),
  storeSlug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  cuisineType: z.string().optional(),
  bio: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const active = searchParams.get('active') === 'true'

  const sellers = await prisma.sellerProfile.findMany({
    where: active ? { isActive: true, permitStatus: 'APPROVED' } : undefined,
    include: {
      user: { select: { name: true, neighborhood: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(sellers)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    // Check slug availability
    const existing = await prisma.sellerProfile.findUnique({ where: { storeSlug: data.storeSlug } })
    if (existing) {
      return NextResponse.json({ error: 'Store URL already taken. Try a different one.' }, { status: 409 })
    }

    // Check user already has a seller profile
    const existingProfile = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
    if (existingProfile) {
      return NextResponse.json({ error: 'Store already exists' }, { status: 409 })
    }

    // Create seller profile
    const seller = await prisma.sellerProfile.create({
      data: {
        userId: session.user.id,
        storeName: data.storeName,
        storeSlug: data.storeSlug,
        cuisineType: data.cuisineType || null,
        bio: data.bio || null,
      },
    })

    // Update user role to SELLER
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'SELLER' },
    })

    return NextResponse.json(seller, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error('Create seller error:', err)
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 })
  }
}
