import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  servings: z.number().int().min(1).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  cuisineTags: z.array(z.string()).optional(),
  dietaryTags: z.array(z.string()).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planner = await prisma.plannerProfile.findUnique({ where: { userId: session.user.id } })
  if (!planner) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const items = await prisma.plannerMenuItem.findMany({
    where: { plannerId: planner.id, isActive: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planner = await prisma.plannerProfile.findUnique({ where: { userId: session.user.id } })
  if (!planner) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const item = await prisma.plannerMenuItem.create({
      data: {
        plannerId: planner.id,
        name: data.name,
        description: data.description ?? null,
        servings: data.servings ?? 1,
        photoUrl: data.photoUrl || null,
        cuisineTags: data.cuisineTags ?? [],
        dietaryTags: data.dietaryTags ?? [],
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    console.error('Create planner menu item error:', err)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
