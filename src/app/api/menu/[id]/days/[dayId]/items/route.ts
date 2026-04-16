import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; dayId: string }> }) {
  const { id, dayId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { menuItemId, comboItemId, quantity = 10 } = body

  if (menuItemId) {
    await prisma.weeklyMenuDayItem.create({
      data: { weeklyMenuDayId: dayId, menuItemId: Number(menuItemId), quantity },
    })
  } else if (comboItemId) {
    await prisma.weeklyMenuDayComboItem.create({
      data: { weeklyMenuDayId: dayId, comboItemId, quantity },
    })
  } else {
    return NextResponse.json({ error: 'Provide menuItemId or comboItemId' }, { status: 400 })
  }

  // Return updated menu
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; dayId: string }> }) {
  const { id, dayId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { menuItemId, comboItemId, quantity } = body

  if (menuItemId) {
    await prisma.weeklyMenuDayItem.updateMany({
      where: { weeklyMenuDayId: dayId, menuItemId: Number(menuItemId) },
      data: { quantity: Number(quantity) },
    })
  } else if (comboItemId) {
    await prisma.weeklyMenuDayComboItem.updateMany({
      where: { weeklyMenuDayId: dayId, comboItemId },
      data: { quantity: Number(quantity) },
    })
  } else {
    return NextResponse.json({ error: 'Provide menuItemId or comboItemId' }, { status: 400 })
  }

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; dayId: string }> }) {
  const { id, dayId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { menuItemId, comboItemId, clearAll } = body

  if (clearAll) {
    await prisma.weeklyMenuDayItem.deleteMany({ where: { weeklyMenuDayId: dayId } })
    await prisma.weeklyMenuDayComboItem.deleteMany({ where: { weeklyMenuDayId: dayId } })
  } else if (menuItemId) {
    await prisma.weeklyMenuDayItem.deleteMany({
      where: { weeklyMenuDayId: dayId, menuItemId: Number(menuItemId) },
    })
  } else if (comboItemId) {
    await prisma.weeklyMenuDayComboItem.deleteMany({
      where: { weeklyMenuDayId: dayId, comboItemId },
    })
  }

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
