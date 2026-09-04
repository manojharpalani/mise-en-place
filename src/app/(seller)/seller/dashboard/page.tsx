export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ShoppingBag, DollarSign, Users, TrendingUp, ChefHat, ArrowRight, Star } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

async function getSellerData(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: {
      orders: {
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
        include: { buyer: { select: { name: true, email: true } }, items: true },
      },
      subscribers: { where: { status: 'ACTIVE' } },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { buyer: { select: { name: true, image: true } } },
      },
    },
  })
  return seller
}

export default async function SellerDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const seller = await getSellerData(session.user.id)

  if (!seller) {
    redirect('/seller/onboarding')
  }

  const todayOrders = seller.orders.filter((o) => {
    const today = new Date()
    const orderDate = new Date(o.createdAt)
    return orderDate.toDateString() === today.toDateString()
  })

  const pendingOrders = seller.orders.filter((o) => o.status === 'PENDING' || o.status === 'PROCESSING')
  const weeklyRevenue = seller.orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0)

  const recentOrders = seller.orders.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back! 👋</h1>
          <p className="text-muted-foreground mt-1">{seller.storeName}</p>
        </div>
        <div className="flex gap-3">
          {!seller.isActive && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              Pending Approval
            </Badge>
          )}
          <Button asChild className="bg-[#c1622d] hover:bg-[#a64f20]">
            <Link href={`/${seller.storeSlug}`}>View Store <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </div>

      {!seller.isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 font-medium">Your store is pending admin approval.</p>
          <p className="text-amber-700 text-sm mt-1">
            We review all seller applications within 24-48 hours. Make sure you&apos;ve uploaded your permit in{' '}
            <Link href="/seller/settings" className="underline">Settings</Link>.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Today's Orders", value: todayOrders.length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Orders', value: pendingOrders.length, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Weekly Revenue', value: formatCurrency(weeklyRevenue), icon: DollarSign, color: 'text-[#c1622d]', bg: 'bg-[#f7e9de]' },
          { label: 'Subscribers', value: seller.subscribers.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg Rating', value: seller.ratingAvg ? `${seller.ratingAvg.toFixed(1)} ★` : '—', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Total Reviews', value: seller.reviewCount, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
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
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/seller/menu', label: 'Plan Weekly Menu', icon: '📅' },
          { href: '/seller/orders', label: 'Manage Orders', icon: '📦' },
          { href: '/seller/marketing', label: 'Send Newsletter', icon: '📣' },
          { href: '/seller/content', label: 'Write Article', icon: '✍️' },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="bg-white border rounded-xl p-4 hover:border-[#e7ddcb] hover:shadow-sm transition-all text-center cursor-pointer">
              <div className="text-2xl mb-1">{action.icon}</div>
              <p className="text-sm font-medium text-foreground">{action.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/seller/orders">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ChefHat className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No orders yet this week</p>
              <p className="text-sm mt-1">Share your store to start getting orders!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{order.buyer.name || order.buyer.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} items · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{formatCurrency(order.total)}</span>
                    <Badge
                      className={
                        order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'READY' ? 'bg-[#f7e9de] text-[#a64f20]' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-muted text-foreground'
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {seller.reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No reviews yet — complete some orders to start getting feedback!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {seller.reviews.map((review) => (
                <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {review.buyer.name || 'Customer'}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              className="w-3 h-3"
                              fill={s <= review.rating ? '#f59e0b' : 'none'}
                              stroke={s <= review.rating ? '#f59e0b' : '#d1d5db'}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-snug">{review.comment}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
