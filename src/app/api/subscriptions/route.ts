import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  sellerId: z.string(),
  weeklyMenuId: z.string(),
  fulfillmentPreferences: z.object({
    type: z.enum(['PICKUP', 'DELIVERY']),
    address: z.string().optional(),
    pickupWindow: z.string().optional(),
  }),
  stripePaymentIntentId: z.string().optional(),
  totalAmount: z.number().positive(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const subscription = await prisma.subscription.create({
      data: {
        buyerId: session.user.id,
        sellerId: data.sellerId,
        weeklyMenuId: data.weeklyMenuId,
        fulfillmentPreferences: data.fulfillmentPreferences,
        stripePaymentIntentId: data.stripePaymentIntentId,
        totalAmount: data.totalAmount,
      },
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
