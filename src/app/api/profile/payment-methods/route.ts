import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

// GET — list saved payment methods
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.stripeCustomerId) return NextResponse.json({ paymentMethods: [] })

  const stripe = getStripe()
  const pms = await stripe.paymentMethods.list({
    customer: user.stripeCustomerId,
    type: 'card',
  })

  return NextResponse.json({
    paymentMethods: pms.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      wallet: pm.card?.wallet?.type ?? null, // 'link' | 'apple_pay' etc
    })),
  })
}

// POST — create SetupIntent (creates Stripe customer if needed)
export async function POST(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const stripe = getStripe()

  // Create or reuse Stripe customer
  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card', 'link'],
    usage: 'off_session',
  })

  return NextResponse.json({ clientSecret: setupIntent.client_secret })
}

// DELETE — detach a payment method
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paymentMethodId } = await req.json()
  if (!paymentMethodId) return NextResponse.json({ error: 'Missing paymentMethodId' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.stripeCustomerId) return NextResponse.json({ error: 'No customer' }, { status: 400 })

  const stripe = getStripe()

  // Verify ownership before detaching
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
  if (pm.customer !== user.stripeCustomerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await stripe.paymentMethods.detach(paymentMethodId)
  return NextResponse.json({ ok: true })
}
