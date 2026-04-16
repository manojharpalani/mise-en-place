import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planner = await prisma.plannerProfile.findUnique({ where: { userId: session.user.id } })
  if (!planner) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const menu = await prisma.plannerWeeklyMenu.findFirst({
    where: { id, plannerId: planner.id },
    include: { days: { select: { id: true } } },
  })
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dayIds = menu.days.map((d) => d.id)
  await prisma.plannerWeeklyMenuDayItem.deleteMany({ where: { weeklyMenuDayId: { in: dayIds } } })

  const updated = await prisma.plannerWeeklyMenu.findUnique({
    where: { id },
    include: {
      days: {
        include: { menuItems: { include: { menuItem: true } } },
        orderBy: { date: 'asc' },
      },
    },
  })

  return NextResponse.json(updated)
}
