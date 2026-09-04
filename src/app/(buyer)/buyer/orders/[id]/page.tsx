export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, MapPin, Package, Calendar, Clock, Star, Receipt } from 'lucide-react'
import { OrderReviewButton } from '../order-review-button'
import { CancelOrderButton } from '../cancel-order-button'

async function getOrder(id: string, userId: string) {
  return prisma.order.findUnique({
    where: { id, buyerId: userId },
    include: {
      seller: { select: { storeName: true, storeSlug: true } },
      items: true,
      review: true,
    },
  })
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  READY:      'bg-[#f7e9de] text-[#a64f20]',
  DELIVERED:  'bg-gray-100 text-gray-600',
  PICKED_UP:  'bg-gray-100 text-gray-600',
  CANCELLED:  'bg-red-100 text-red-600',
}

const STATUS_MSG: Record<string, string> = {
  PENDING:    'Your order has been received and is awaiting confirmation.',
  PROCESSING: 'The chef is preparing your order.',
  READY:      'Your order is ready!',
  DELIVERED:  'Order delivered. Enjoy your meal!',
  PICKED_UP:  'Order picked up. Enjoy your meal!',
  CANCELLED:  'This order was cancelled.',
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className="w-4 h-4"
          fill={s <= rating ? '#f59e0b' : 'none'}
          stroke={s <= rating ? '#f59e0b' : '#d1d5db'}
        />
      ))}
    </div>
  )
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const { id } = await params
  const order = await getOrder(id, session.user.id)
  if (!order) notFound()

  const completed = order.status === 'DELIVERED' || order.status === 'PICKED_UP'

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-stone-500 -ml-2">
          <Link href="/buyer/orders">
            <ArrowLeft className="w-4 h-4 mr-1" /> Orders
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#c1622d]" />
            Order Receipt
          </h1>
          <p className="text-xs text-stone-400 mt-0.5 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
        </div>
        <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
      </div>

      {/* Status message */}
      <div className="rounded-xl bg-stone-50 border px-4 py-3 text-sm text-stone-600">
        {STATUS_MSG[order.status]}
      </div>

      {/* Store + fulfillment */}
      <div className="bg-white rounded-xl border divide-y">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-stone-400 uppercase tracking-wide">From</span>
          <Link
            href={`/${order.seller.storeSlug}`}
            className="font-medium text-gray-900 hover:text-[#c1622d] text-sm"
          >
            {order.seller.storeName}
          </Link>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-stone-400 uppercase tracking-wide">Date ordered</span>
          <span className="text-sm text-gray-700">{formatDate(order.createdAt)}</span>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-stone-400 uppercase tracking-wide flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Scheduled
          </span>
          <span className="text-sm text-gray-700">
            {formatDate(order.scheduledDate)}
          </span>
        </div>

        <div className="px-4 py-3 flex items-start justify-between gap-3">
          <span className="text-xs text-stone-400 uppercase tracking-wide flex items-center gap-1 mt-0.5">
            {order.fulfillmentType === 'DELIVERY'
              ? <><MapPin className="w-3 h-3" /> Delivery address</>
              : <><Package className="w-3 h-3" /> Pickup</>
            }
          </span>
          <span className="text-sm text-gray-700 text-right">
            {order.fulfillmentType === 'DELIVERY'
              ? order.deliveryAddress || '—'
              : order.pickupWindow || 'See store for window'
            }
          </span>
        </div>

        {order.notes && (
          <div className="px-4 py-3 flex items-start justify-between gap-3">
            <span className="text-xs text-stone-400 uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3 h-3" /> Notes
            </span>
            <span className="text-sm text-gray-700 text-right italic">{order.notes}</span>
          </div>
        )}
      </div>

      {/* Items + totals */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-stone-50">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Items</p>
        </div>
        <div className="divide-y">
          {order.items.map(item => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.itemName}</p>
                <p className="text-xs text-stone-400">{formatCurrency(item.unitPrice)} × {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {formatCurrency(item.unitPrice * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-3 space-y-1.5 bg-stone-50">
          <div className="flex justify-between text-sm text-stone-500">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-stone-500">
              <span>Delivery fee</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t">
            <span>Total</span>
            <span className="text-[#c1622d]">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Review */}
      {(completed || order.review) && (
        <div className="bg-white rounded-xl border px-4 py-4 space-y-2">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Your Review</p>
          {order.review ? (
            <div className="space-y-1">
              <StarDisplay rating={order.review.rating} />
              {order.review.comment && (
                <p className="text-sm text-stone-600 italic">"{order.review.comment}"</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-stone-400">No review yet.</p>
              <OrderReviewButton orderId={order.id} storeName={order.seller.storeName} />
            </div>
          )}
        </div>
      )}

      {/* Cancel */}
      {order.status === 'PENDING' && (
        <div className="flex justify-end">
          <CancelOrderButton orderId={order.id} storeName={order.seller.storeName} />
        </div>
      )}
    </div>
  )
}
