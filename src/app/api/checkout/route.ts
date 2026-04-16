import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const schema = z.object({
  sellerId: z.string(),
  items: z.array(z.object({
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    type: z.enum(['ITEM', 'COMBO']),
    menuItemId: z.number().optional(),
    comboItemId: z.string().optional(),
  })),
  fulfillmentType: z.enum(['PICKUP', 'DELIVERY']),
  scheduledDate: z.string(),
  pickupWindow: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const seller = await prisma.sellerProfile.findUnique({ where: { id: data.sellerId } })
    if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

    const subtotal = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const deliveryFee = data.fulfillmentType === 'DELIVERY' ? (seller.deliveryFee || 0) : 0
    const total = subtotal + deliveryFee

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      metadata: {
        sellerId: data.sellerId,
        buyerId: session.user.id,
        fulfillmentType: data.fulfillmentType,
        scheduledDate: data.scheduledDate,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      total,
      subtotal,
      deliveryFee,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
