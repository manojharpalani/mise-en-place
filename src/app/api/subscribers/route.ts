import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  sellerId: z.string(),
  channels: z.array(z.string()).min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const session = await auth()

    const subscriber = await prisma.subscriber.create({
      data: {
        sellerId: data.sellerId,
        channels: data.channels,
        email: data.email || null,
        phone: data.phone || null,
        buyerId: session?.user?.id || null,
      },
    })

    return NextResponse.json(subscriber, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const sellerId = searchParams.get('sellerId')

  if (!email || !sellerId) {
    return NextResponse.json({ error: 'Email and sellerId required' }, { status: 400 })
  }

  await prisma.subscriber.updateMany({
    where: { email, sellerId },
    data: { status: 'UNSUBSCRIBED' },
  })

  return NextResponse.json({ success: true })
}
