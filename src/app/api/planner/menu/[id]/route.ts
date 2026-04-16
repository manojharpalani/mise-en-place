import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eachDayOfInterval, format } from 'date-fns'

function parseDate(str: string): Date {
  return new Date(str + 'T12:00:00.000Z')
}

function daysForRange(start: Date, end: Date) {
  return eachDayOfInterval({ start, end }).map((date) => ({
    date: new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)),
    dayOfWeek: format(date, 'EEEE'),
  }))
}

function utcKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

const menuInclude = {
  days: {
    include: { menuItems: { include: { menuItem: true } } },
    orderBy: { date: 'asc' as const },
  },
}

async function getMenu(id: string, userId: string) {
  const planner = await prisma.plannerProfile.findUnique({ where: { userId } })
  if (!planner) return null
  return prisma.plannerWeeklyMenu.findFirst({ where: { id, plannerId: planner.id } })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const menu = await getMenu(id, session.user.id)
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.plannerWeeklyMenu.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planner = await prisma.plannerProfile.findUnique({ where: { userId: session.user.id } })
  if (!planner) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const menu = await prisma.plannerWeeklyMenu.findFirst({
    where: { id, plannerId: planner.id },
    include: { days: true },
  })
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  // Handle publish toggle
  if (body.isPublished !== undefined) {
    const updated = await prisma.plannerWeeklyMenu.update({
      where: { id },
      data: { isPublished: body.isPublished },
      include: menuInclude,
    })
    return NextResponse.json(updated)
  }

  // Handle date range update
  const newStart = parseDate(body.weekStartDate)
  const newEnd = parseDate(body.weekEndDate)
  const newDays = daysForRange(newStart, newEnd)
  const newDayKeys = new Set(newDays.map((nd) => utcKey(nd.date)))

  await prisma.plannerWeeklyMenu.update({ where: { id }, data: { weekStartDate: newStart, weekEndDate: newEnd } })

  const daysToDelete = menu.days.filter((ed) => !newDayKeys.has(utcKey(new Date(ed.date))))
  for (const d of daysToDelete) {
    await prisma.plannerWeeklyMenuDay.delete({ where: { id: d.id } })
  }

  const existingDays = await prisma.plannerWeeklyMenuDay.findMany({ where: { weeklyMenuId: id } })
  const existingKeys = new Set(existingDays.map((ed) => utcKey(new Date(ed.date))))
  const toAdd = newDays.filter((nd) => !existingKeys.has(utcKey(nd.date)))
  for (const d of toAdd) {
    await prisma.plannerWeeklyMenuDay.create({ data: { weeklyMenuId: id, date: d.date, dayOfWeek: d.dayOfWeek } })
  }

  const updated = await prisma.plannerWeeklyMenu.findUnique({ where: { id }, include: menuInclude })
  return NextResponse.json(updated)
}
