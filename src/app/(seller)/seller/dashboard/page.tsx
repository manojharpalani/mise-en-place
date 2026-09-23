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
          <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em] text-[#12402C]">Welcome back! 👋</h1>
          <p className="text-muted-foreground mt-1">{seller.storeName}</p>
        </div>
        <div className="flex gap-3">
          {!seller.isActive && (
            <Badge variant="secondary" className="bg-[#FFF1D6] text-[#7A5A12]">
              Pending Approval
            </Badge>
          )}
          <Button asChild className="bg-[#e2472b] hover:bg-[#c43a20]">
            <Link href={`/${seller.storeSlug}`}>View Store <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </div>

      {!seller.isActive && (
        <div className="bg-[#FFF9EC] border border-[#F3D08A] rounded-xl p-4">
          <p className="text-[#5C430D] font-medium">Your store is pending admin approval.</p>
          <p className="text-[#7A5A12] text-sm mt-1">
            We review all seller applications within 24-48 hours. Make sure you&apos;ve uploaded your permit in{' '}
            <Link href="/seller/settings" className="underline">Settings</Link>.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Today's Orders", value: todayOrders.length, icon: ShoppingBag, color: 'text-[#12402C]', bg: 'bg-[#E3EFE7]' },
          { label: 'Pending Orders', value: pendingOrders.length, icon: TrendingUp, color: 'text-[#B07D00]', bg: 'bg-[#FFF9EC]' },
          { label: 'Weekly Revenue', value: formatCurrency(weeklyRevenue), icon: DollarSign, color: 'text-[#e2472b]', bg: 'bg-[#fff1d6]' },
          { label: 'Subscribers', value: seller.subscribers.length, icon: Users, color: 'text-[#D9661F]', bg: 'bg-[#FDE9DA]' },
          { label: 'Avg Rating', value: seller.ratingAvg ? `${seller.ratingAvg.toFixed(1)} ★` : '—', icon: Star, color: 'text-[#D99A16]', bg: 'bg-[#FFF9EC]' },
          { label: 'Total Reviews', value: seller.reviewCount, icon: Star, color: 'text-[#D99A16]', bg: 'bg-[#FFF9EC]' },
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
            <div className="bg-white border rounded-xl p-4 hover:border-[#efe3c7] hover:shadow-sm transition-all text-center cursor-pointer">
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
                        order.status === 'PENDING' ? 'bg-[#FFF1D6] text-[#7A5A12]' :
                        order.status === 'PROCESSING' ? 'bg-[#E3EFE7] text-[#12402C]' :
                        order.status === 'READY' ? 'bg-[#fff1d6] text-[#c43a20]' :
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
            <Star className="w-4 h-4 text-[#F5B82E] fill-[#F5B82E]" />
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
                              fill={s <= review.rating ? '#f5b82e' : 'none'}
                              stroke={s <= review.rating ? '#f5b82e' : '#d1d5db'}
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
