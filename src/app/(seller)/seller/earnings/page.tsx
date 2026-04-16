export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, ShoppingBag } from 'lucide-react'

async function getEarnings(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } })
  if (!seller) return null

  const orders = await prisma.order.findMany({
    where: { sellerId: seller.id, status: { not: 'CANCELLED' } },
    include: { buyer: { select: { name: true, email: true } }, items: true },
    orderBy: { createdAt: 'desc' },
  })

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)

  const thisMonth = new Date()
  thisMonth.setDate(1)
  const monthlyRevenue = orders
    .filter((o) => new Date(o.createdAt) >= thisMonth)
    .reduce((s, o) => s + o.total, 0)

  return { seller, orders, totalRevenue, monthlyRevenue }
}

export default async function EarningsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')
  const data = await getEarnings(session.user.id)
  if (!data) redirect('/seller/onboarding')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#fdf0ee] rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#d4a5a5]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(data.monthlyRevenue)}</p>
              <p className="text-xs text-gray-500">This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.orders.length}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Order History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.orders.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No completed orders yet.</p>
            ) : (
              data.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{order.buyer.name || order.buyer.email}</p>
                    <p className="text-xs text-gray-400">
                      {order.items.length} items · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{order.fulfillmentType}</Badge>
                    <span className="font-semibold text-[#d4a5a5]">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
