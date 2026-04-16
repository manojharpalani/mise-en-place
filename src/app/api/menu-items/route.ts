import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().positive(),
  salePrice: z.number().positive().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  dietaryTags: z.array(z.string()).optional(),
  allergenTags: z.array(z.string()).optional(),
  cuisineTags: z.array(z.string()).optional(),
  availableQuantity: z.number().int().positive().default(100),
  isActive: z.boolean().default(true),
  sellerId: z.string(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const items = await prisma.menuItem.findMany({
    where: { sellerId: seller.id },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
    if (!seller || seller.id !== data.sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const item = await prisma.menuItem.create({
      data: {
        sellerId: data.sellerId,
        name: data.name,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice,
        photoUrl: data.photoUrl,
        dietaryTags: data.dietaryTags || [],
        allergenTags: data.allergenTags || [],
        cuisineTags: data.cuisineTags || [],
        availableQuantity: data.availableQuantity,
        isActive: data.isActive,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error('Create menu item error:', err)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
