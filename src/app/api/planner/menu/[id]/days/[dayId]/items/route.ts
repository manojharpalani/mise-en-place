import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getDay(menuId: string, dayId: string, userId: string) {
  const planner = await prisma.plannerProfile.findUnique({ where: { userId } })
  if (!planner) return null
  const menu = await prisma.plannerWeeklyMenu.findFirst({ where: { id: menuId, plannerId: planner.id } })
  if (!menu) return null
  return prisma.plannerWeeklyMenuDay.findFirst({ where: { id: dayId, weeklyMenuId: menuId } })
}

type Params = { params: Promise<{ id: string; dayId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id, dayId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const day = await getDay(id, dayId, session.user.id)
  if (!day) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { menuItemId, servings = 1 } = await req.json()
  if (!menuItemId) return NextResponse.json({ error: 'menuItemId required' }, { status: 400 })

  const dayItem = await prisma.plannerWeeklyMenuDayItem.create({
    data: { weeklyMenuDayId: dayId, menuItemId: parseInt(menuItemId), servings },
    include: { menuItem: true },
  })

  return NextResponse.json(dayItem, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, dayId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const day = await getDay(id, dayId, session.user.id)
  if (!day) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { dayItemId, servings } = await req.json()
  if (!dayItemId || servings == null) return NextResponse.json({ error: 'dayItemId and servings required' }, { status: 400 })

  const updated = await prisma.plannerWeeklyMenuDayItem.update({
    where: { id: dayItemId },
    data: { servings },
    include: { menuItem: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, dayId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const day = await getDay(id, dayId, session.user.id)
  if (!day) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { dayItemId, clearAll } = body

  if (clearAll) {
    await prisma.plannerWeeklyMenuDayItem.deleteMany({ where: { weeklyMenuDayId: dayId } })
    return NextResponse.json({ ok: true })
  }

  if (!dayItemId) return NextResponse.json({ error: 'dayItemId required' }, { status: 400 })
  await prisma.plannerWeeklyMenuDayItem.delete({ where: { id: dayItemId } })
  return NextResponse.json({ ok: true })
}
