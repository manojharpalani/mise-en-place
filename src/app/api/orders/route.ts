import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// The checkout form sends `null` (not `undefined`) for an unset optional
// field, so every optional field here must accept null too — `.optional()`
// alone only allows the key to be missing/undefined and rejects an explicit
// null, which was turning a normal pickup order (no delivery address; often
// no pickup-window note either) into a 400 validation error at checkout.
const orderSchema = z.object({
  sellerId: z.string(),
  fulfillmentType: z.enum(['PICKUP', 'DELIVERY']),
  scheduledDate: z.string(),
  pickupWindow: z.string().nullish(),
  deliveryAddress: z.string().nullish(),
  notes: z.string().nullish(),
  items: z.array(z.object({
    menuItemId: z.number().nullish(),
    comboItemId: z.string().nullish(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    itemType: z.enum(['ITEM', 'COMBO']),
    itemName: z.string(),
  })),
  stripePaymentIntentId: z.string().nullish(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = orderSchema.parse(body)

    const seller = await prisma.sellerProfile.findUnique({ where: { id: data.sellerId } })
    if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

    const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const deliveryFee = data.fulfillmentType === 'DELIVERY' ? (seller.deliveryFee || 0) : 0
    const total = subtotal + deliveryFee

    const order = await prisma.order.create({
      data: {
        buyerId: session.user.id,
        sellerId: data.sellerId,
        fulfillmentType: data.fulfillmentType,
        subtotal,
        deliveryFee,
        total,
        scheduledDate: new Date(data.scheduledDate),
        pickupWindow: data.pickupWindow,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        stripePaymentIntentId: data.stripePaymentIntentId,
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            comboItemId: item.comboItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            itemType: item.itemType,
            itemName: item.itemName,
          })),
        },
      },
      include: { items: true, seller: { select: { storeName: true } }, buyer: true },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error('Create order error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
