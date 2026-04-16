import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dayId } = await req.json()

  const subscription = await prisma.subscription.findUnique({
    where: { id, buyerId: session.user.id },
  })

  if (!subscription) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const skippedDays = (subscription.skippedDays as string[]) || []

  if (skippedDays.includes(dayId)) {
    return NextResponse.json({ error: 'Day already skipped' }, { status: 400 })
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: { skippedDays: [...skippedDays, dayId] },
  })

  // Add credit to buyer's balance
  const dayPrice = subscription.totalAmount / 6 // Approximate per-day cost
  await prisma.creditBalance.upsert({
    where: { buyerId: session.user.id },
    update: { balance: { increment: dayPrice } },
    create: { buyerId: session.user.id, balance: dayPrice },
  })

  return NextResponse.json({ success: true, creditAdded: dayPrice })
}
