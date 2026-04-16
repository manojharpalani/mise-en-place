import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays, eachDayOfInterval, format, startOfWeek } from 'date-fns'

// Parse a date-only string (YYYY-MM-DD) as noon UTC to avoid timezone day-boundary shifts
function parseDate(str: string): Date {
  return new Date(str + 'T12:00:00.000Z')
}

function daysForRange(start: Date, end: Date) {
  return eachDayOfInterval({ start, end }).map(date => ({
    // Store as noon UTC of the local calendar date to avoid day-boundary shifts
    date: new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)),
    // Use local date for the day name — eachDayOfInterval gives local midnight
    dayOfWeek: format(date, 'EEEE'),
  }))
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const menus = await prisma.weeklyMenu.findMany({
    where: { sellerId: seller.id },
    include: {
      days: {
        include: {
          menuItems: { include: { menuItem: true } },
          comboItems: { include: { comboItem: true } },
        },
        orderBy: { date: 'asc' },
      },
    },
    orderBy: { weekStartDate: 'desc' },
  })

  return NextResponse.json(menus)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  const body = await req.json()
  const weekStartDate = parseDate(body.weekStartDate)
  // Default end date: 4 days after start (Mon–Fri)
  const weekEndDate = body.weekEndDate ? parseDate(body.weekEndDate) : addDays(weekStartDate, 4)

  const menu = await prisma.weeklyMenu.create({
    data: {
      sellerId: seller.id,
      weekStartDate,
      weekEndDate,
      days: {
        create: daysForRange(weekStartDate, weekEndDate),
      },
    },
    include: {
      days: {
        include: {
          menuItems: { include: { menuItem: true } },
          comboItems: { include: { comboItem: true } },
        },
        orderBy: { date: 'asc' },
      },
    },
  })

  return NextResponse.json(menu, { status: 201 })
}
