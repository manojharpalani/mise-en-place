import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const seller = await prisma.sellerProfile.findUnique({
    where: { storeSlug: slug, isActive: true },
    include: {
      user: { select: { name: true, neighborhood: true, zip: true } },
      menuItems: { where: { isActive: true } },
      comboItems: { where: { isActive: true } },
      weeklyMenus: {
        where: { status: 'PUBLISHED' },
        orderBy: { weekStartDate: 'desc' },
        take: 1,
        include: {
          days: {
            include: {
              menuItems: { include: { menuItem: true } },
              comboItems: { include: { comboItem: true } },
            },
            orderBy: { date: 'asc' },
          },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { buyer: { select: { name: true, image: true } } },
      },
    },
  })

  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(seller)
}
