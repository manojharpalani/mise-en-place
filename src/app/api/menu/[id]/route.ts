import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eachDayOfInterval, format } from 'date-fns'

function parseDate(str: string): Date {
  return new Date(str + 'T12:00:00.000Z')
}

function daysForRange(start: Date, end: Date) {
  return eachDayOfInterval({ start, end }).map(date => ({
    date: new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)),
    dayOfWeek: format(date, 'EEEE'),
  }))
}

// UTC-aware day key: "YYYY-MM-DD"
function utcKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const menu = await prisma.weeklyMenu.findUnique({ where: { id, sellerId: seller.id } })
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.weeklyMenu.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// PATCH /api/menu/[id] — update start/end dates, reconcile days
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const menu = await prisma.weeklyMenu.findUnique({
    where: { id, sellerId: seller.id },
    include: { days: true },
  })
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const newStart = parseDate(body.weekStartDate)
  const newEnd = parseDate(body.weekEndDate)

  const newDays = daysForRange(newStart, newEnd)
  const newDayKeys = new Set(newDays.map(nd => utcKey(nd.date)))

  // Update the menu dates
  await prisma.weeklyMenu.update({
    where: { id },
    data: { weekStartDate: newStart, weekEndDate: newEnd },
  })

  // Delete ALL days outside the new range (cascade removes their items)
  const daysToDelete = menu.days.filter(ed => !newDayKeys.has(utcKey(new Date(ed.date))))
  for (const d of daysToDelete) {
    await prisma.weeklyMenuDay.delete({ where: { id: d.id } })
  }

  // Add days not yet present in the menu
  const existingDays = await prisma.weeklyMenuDay.findMany({ where: { weeklyMenuId: id } })
  const existingKeys = new Set(existingDays.map(ed => utcKey(new Date(ed.date))))
  const toAdd = newDays.filter(nd => !existingKeys.has(utcKey(nd.date)))
  for (const d of toAdd) {
    await prisma.weeklyMenuDay.create({
      data: { weeklyMenuId: id, date: d.date, dayOfWeek: d.dayOfWeek },
    })
  }

  const updated = await prisma.weeklyMenu.findUnique({
    where: { id },
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

  return NextResponse.json(updated)
}
