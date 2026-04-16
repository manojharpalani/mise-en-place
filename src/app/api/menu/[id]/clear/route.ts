import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const menu = await prisma.weeklyMenu.findUnique({
    where: { id, sellerId: seller.id },
    include: { days: { select: { id: true } } },
  })
  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

  const dayIds = menu.days.map(d => d.id)

  await prisma.weeklyMenuDayItem.deleteMany({ where: { weeklyMenuDayId: { in: dayIds } } })
  await prisma.weeklyMenuDayComboItem.deleteMany({ where: { weeklyMenuDayId: { in: dayIds } } })

  const updatedMenu = await prisma.weeklyMenu.findUnique({
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

  return NextResponse.json(updatedMenu)
}
