export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

async function getAllOrders() {
  return prisma.order.findMany({
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { storeName: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  READY: 'bg-[#fdf0ee] text-[#c49090]',
  DELIVERED: 'bg-gray-100 text-gray-600',
  PICKED_UP: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default async function AdminOrdersPage() {
  const orders = await getAllOrders()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{order.buyer.name || order.buyer.email}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-700">{order.seller.storeName}</span>
                    <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                  <p className="text-sm text-gray-600 mt-1">{order.items.length} items</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#d4a5a5]">{formatCurrency(order.total)}</p>
                  <Badge variant="outline" className="text-xs">{order.fulfillmentType}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <p className="text-gray-400 text-center py-12">No orders yet.</p>
        )}
      </div>
    </div>
  )
}
