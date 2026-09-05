export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ShoppingBag } from 'lucide-react'
import { SellerNameButton, OrderActionsRow } from './order-card-interactive'

async function getBuyerOrders(userId: string) {
  return prisma.order.findMany({
    where: { buyerId: userId },
    include: {
      seller: { select: { storeName: true, storeSlug: true } },
      items: true,
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  READY: 'bg-[#f7e9de] text-[#a64f20]',
  DELIVERED: 'bg-muted text-muted-foreground',
  PICKED_UP: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default async function BuyerOrdersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const orders = await getBuyerOrders(session.user.id)
  const completed = new Set(['DELIVERED', 'PICKED_UP'])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No orders yet</p>
          <p className="text-sm mt-2 mb-6">Discover local chefs and place your first order!</p>
          <Button asChild className="bg-[#c1622d] hover:bg-[#a64f20]">
            <Link href="/sellers">Find Sellers</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/buyer/orders/${order.id}`} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <SellerNameButton storeSlug={order.seller.storeSlug} storeName={order.seller.storeName} />
                        <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                      <div className="mt-2 space-y-1">
                        {order.items.map((item) => (
                          <p key={item.id} className="text-sm text-foreground">
                            {item.quantity}x {item.itemName} — {formatCurrency(item.unitPrice * item.quantity)}
                          </p>
                        ))}
                      </div>

                      <OrderActionsRow
                        orderId={order.id}
                        storeName={order.seller.storeName}
                        status={order.status}
                        reviewRating={order.review?.rating ?? null}
                        isCompleted={completed.has(order.status)}
                      />
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-[#c1622d] text-lg">{formatCurrency(order.total)}</p>
                      <Badge variant="outline" className="text-xs">{order.fulfillmentType}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
