import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  servings: z.number().int().min(1).optional(),
  photoUrl: z.string().url().optional().nullable().or(z.literal('')),
  cuisineTags: z.array(z.string()).optional(),
  dietaryTags: z.array(z.string()).optional(),
  ingredients: z.any().optional(),
  isActive: z.boolean().optional(),
})

async function getItem(id: string, userId: string) {
  const planner = await prisma.plannerProfile.findUnique({ where: { userId } })
  if (!planner) return null
  return prisma.plannerMenuItem.findFirst({ where: { id: parseInt(id), plannerId: planner.id } })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await getItem(id, session.user.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ item })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await getItem(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const item = await prisma.plannerMenuItem.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.servings !== undefined && { servings: data.servings }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl || null }),
        ...(data.cuisineTags !== undefined && { cuisineTags: data.cuisineTags }),
        ...(data.dietaryTags !== undefined && { dietaryTags: data.dietaryTags }),
        ...(data.ingredients !== undefined && { ingredients: data.ingredients }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    return NextResponse.json({ item })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    console.error('Update planner menu item error:', err)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await getItem(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.plannerMenuItem.update({
    where: { id: parseInt(id) },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
