import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const order = await prisma.order.findUnique({
      where: { id: data.orderId, buyerId: session.user.id },
    })

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (!['DELIVERED', 'PICKED_UP'].includes(order.status)) {
      return NextResponse.json({ error: 'Can only review completed orders' }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        orderId: data.orderId,
        buyerId: session.user.id,
        sellerId: order.sellerId,
        rating: data.rating,
        comment: data.comment,
      },
    })

    // Update seller rating
    const allReviews = await prisma.review.findMany({ where: { sellerId: order.sellerId } })
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length

    await prisma.sellerProfile.update({
      where: { id: order.sellerId },
      data: { ratingAvg: avg, reviewCount: allReviews.length },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
