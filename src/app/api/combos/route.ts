import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  comboPrice: z.number().positive(),
  photoUrl: z.string().url().optional().nullable(),
  // Array of { menuItemId, quantity }
  components: z.array(z.object({
    menuItemId: z.number().int().positive(),
    quantity: z.number().int().positive().default(1),
  })).min(2, 'A combo needs at least 2 items'),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    // Verify all component menu items belong to this seller
    const itemIds = data.components.map(c => c.menuItemId)
    const items = await prisma.menuItem.findMany({
      where: { id: { in: itemIds }, sellerId: seller.id },
      select: { id: true },
    })
    if (items.length !== itemIds.length) {
      return NextResponse.json({ error: 'One or more menu items not found' }, { status: 400 })
    }

    const combo = await prisma.comboItem.create({
      data: {
        sellerId: seller.id,
        name: data.name,
        description: data.description,
        comboPrice: data.comboPrice,
        photoUrl: data.photoUrl,
        isActive: true,
        menuItems: {
          create: data.components.map(c => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
          })),
        },
      },
      include: {
        menuItems: { include: { menuItem: true } },
      },
    })

    return NextResponse.json(combo, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    }
    console.error('Create combo error:', err)
    return NextResponse.json({ error: 'Failed to create combo' }, { status: 500 })
  }
}
