import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmation } from '@/lib/whatsapp'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { sellerId, buyerId, fulfillmentType, scheduledDate } = paymentIntent.metadata

        // Find the order and update payment status
        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
          include: {
            seller: { select: { storeName: true } },
            buyer: { select: { phone: true } },
            items: true,
          },
        })

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'PROCESSING' },
          })

          // Send WhatsApp confirmation if buyer has phone
          if (order.buyer.phone) {
            await sendOrderConfirmation(order.buyer.phone, {
              orderNumber: order.id.slice(-8).toUpperCase(),
              storeName: order.seller.storeName,
              total: order.total,
              fulfillmentType: order.fulfillmentType,
              scheduledDate: new Date(order.scheduledDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }),
              pickupWindow: order.pickupWindow,
            })
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { status: 'CANCELLED' },
        })
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
