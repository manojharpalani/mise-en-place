export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Users, ChefHat, ShoppingBag, DollarSign, Clock } from 'lucide-react'

async function getMetrics() {
  const [
    totalUsers,
    totalSellers,
    pendingSellers,
    totalOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.sellerProfile.count({ where: { isActive: true } }),
    prisma.sellerProfile.count({ where: { permitStatus: 'PENDING' } }),
    prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
    prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      include: { seller: { select: { storeName: true } }, buyer: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const totalRevenue = await prisma.order.aggregate({
    where: { status: { not: 'CANCELLED' } },
    _sum: { total: true },
  })

  return { totalUsers, totalSellers, pendingSellers, totalOrders, recentOrders, totalRevenue: totalRevenue._sum.total || 0 }
}

export default async function AdminDashboardPage() {
  const metrics = await getMetrics()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: metrics.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Sellers', value: metrics.totalSellers, icon: ChefHat, color: 'text-[#c1622d]', bg: 'bg-[#f7e9de]' },
          { label: 'Total Orders', value: metrics.totalOrders, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Platform Revenue', value: formatCurrency(metrics.totalRevenue), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {metrics.pendingSellers > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800">
            <strong>{metrics.pendingSellers} seller{metrics.pendingSellers > 1 ? 's' : ''}</strong> pending approval.
            <a href="/admin/sellers" className="ml-2 underline">Review now</a>
          </p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                <div>
                  <p className="font-medium">{order.buyer.name || order.buyer.email}</p>
                  <p className="text-muted-foreground">{order.seller.storeName}</p>
                </div>
                <span className="font-semibold text-[#c1622d]">{formatCurrency(order.total)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
