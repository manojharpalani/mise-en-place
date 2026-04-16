import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  displayName: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  bio: z.string().optional(),
  cuisinePrefs: z.array(z.string()).optional(),
  householdSize: z.number().int().min(1).max(20).optional(),
  isPublic: z.boolean().optional(),
})

const updateSchema = createSchema.partial()

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.plannerProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json({ profile })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'PLANNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    // Check slug uniqueness
    const existing = await prisma.plannerProfile.findUnique({ where: { slug: data.slug } })
    if (existing) return NextResponse.json({ error: 'That URL is already taken' }, { status: 409 })

    const profile = await prisma.plannerProfile.create({
      data: {
        userId: session.user.id,
        displayName: data.displayName,
        slug: data.slug,
        bio: data.bio ?? null,
        cuisinePrefs: data.cuisinePrefs ?? [],
        householdSize: data.householdSize ?? 1,
        isPublic: data.isPublic ?? false,
      },
    })

    return NextResponse.json({ profile }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    console.error('Create planner profile error:', err)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    // If changing slug, check uniqueness
    if (data.slug) {
      const existing = await prisma.plannerProfile.findFirst({
        where: { slug: data.slug, NOT: { userId: session.user.id } },
      })
      if (existing) return NextResponse.json({ error: 'That URL is already taken' }, { status: 409 })
    }

    const profile = await prisma.plannerProfile.update({
      where: { userId: session.user.id },
      data,
    })

    return NextResponse.json({ profile })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    console.error('Update planner profile error:', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
