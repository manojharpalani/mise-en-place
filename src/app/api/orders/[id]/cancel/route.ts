import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { format } from 'date-fns'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reason } = await req.json().catch(() => ({ reason: undefined })) as { reason?: string }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      seller: true,
      buyer: { select: { id: true, name: true, phone: true, notificationChannel: true } },
      items: true,
    },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
  if (['DELIVERED', 'PICKED_UP'].includes(order.status)) {
    return NextResponse.json({ error: 'Completed orders cannot be cancelled' }, { status: 400 })
  }

  const isBuyer = order.buyerId === session.user.id
  const isSeller = order.seller.userId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'

  if (!isBuyer && !isSeller && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Buyers can only cancel PENDING orders
  if (isBuyer && !isSeller && !isAdmin && order.status !== 'PENDING') {
    return NextResponse.json(
      { error: 'Orders can only be cancelled before the seller starts processing them' },
      { status: 400 }
    )
  }

  // Sellers must provide a reason when cancelling a PROCESSING order
  if ((isSeller || isAdmin) && order.status === 'PROCESSING' && !reason?.trim()) {
    return NextResponse.json({ error: 'A reason is required when cancelling a processing order' }, { status: 422 })
  }

  // Mark cancelled
  const cancelled = await prisma.order.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })

  // Stripe refund — only if a payment intent was captured
  if (order.stripePaymentIntentId) {
    try {
      const stripe = getStripe()
      const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId)
      if (pi.status === 'succeeded') {
        await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          reason: 'requested_by_customer',
        })
      }
    } catch (err) {
      console.error('Stripe refund error:', err)
      // Non-fatal — order is still cancelled, refund can be issued manually
    }
  }

  // WhatsApp notification
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const itemsSummary = order.items.map(i => `• ${i.quantity}x ${i.itemName}`).join('\n')
  const scheduledStr = format(new Date(order.scheduledDate), 'EEEE, MMMM d')

  if (isBuyer) {
    // Notify the seller that the buyer cancelled
    const waOpts = { phoneNumberId: order.seller.waPhoneNumberId, accessToken: order.seller.waAccessToken }
    if (order.seller.waPhoneNumberId) {
      // Sellers don't have a phone field in our DB — use platform-level WA if configured
      const msg =
        `❌ *Order Cancelled by Customer*\n\n` +
        `Customer: ${order.buyer.name || 'Customer'}\n` +
        `Scheduled: ${scheduledStr}\n\n` +
        `${itemsSummary}\n\n` +
        `Total: $${order.total.toFixed(2)}\n\n` +
        `View orders: ${appUrl}/seller/orders`
      await sendWhatsAppMessage(order.seller.waPhoneNumberId, msg, waOpts).catch(() => {})
    }
  } else {
    // Notify the buyer that the seller cancelled
    const buyerPhone = order.buyer.phone
    if (buyerPhone) {
      const waOpts = { phoneNumberId: order.seller.waPhoneNumberId, accessToken: order.seller.waAccessToken }
      const reasonLine = reason?.trim() ? `\nReason: ${reason.trim()}` : ''
      const msg =
        `❌ *Your order has been cancelled*\n\n` +
        `Store: ${order.seller.storeName}\n` +
        `Scheduled: ${scheduledStr}${reasonLine}\n\n` +
        `${itemsSummary}\n\n` +
        `${order.stripePaymentIntentId ? 'A refund has been initiated and will appear within 5–10 business days.' : ''}\n\n` +
        `Browse other chefs: ${appUrl}/sellers`
      await sendWhatsAppMessage(buyerPhone, msg, waOpts).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, order: cancelled })
}
