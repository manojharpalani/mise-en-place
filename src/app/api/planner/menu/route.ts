import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays, eachDayOfInterval, format } from 'date-fns'

function parseDate(str: string): Date {
  return new Date(str + 'T12:00:00.000Z')
}

function daysForRange(start: Date, end: Date) {
  return eachDayOfInterval({ start, end }).map((date) => ({
    date: new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)),
    dayOfWeek: format(date, 'EEEE'),
  }))
}

const menuInclude = {
  days: {
    include: { menuItems: { include: { menuItem: true } } },
    orderBy: { date: 'asc' as const },
  },
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planner = await prisma.plannerProfile.findUnique({ where: { userId: session.user.id } })
  if (!planner) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const menus = await prisma.plannerWeeklyMenu.findMany({
    where: { plannerId: planner.id },
    include: menuInclude,
    orderBy: { weekStartDate: 'desc' },
  })

  return NextResponse.json(menus)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planner = await prisma.plannerProfile.findUnique({ where: { userId: session.user.id } })
  if (!planner) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await req.json()
  const weekStartDate = parseDate(body.weekStartDate)
  const weekEndDate = body.weekEndDate ? parseDate(body.weekEndDate) : addDays(weekStartDate, 4)

  const menu = await prisma.plannerWeeklyMenu.create({
    data: {
      plannerId: planner.id,
      weekStartDate,
      weekEndDate,
      days: { create: daysForRange(weekStartDate, weekEndDate) },
    },
    include: menuInclude,
  })

  return NextResponse.json(menu, { status: 201 })
}
