export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SubscriptionsClient } from './subscriptions-client'

async function getBuyerSubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: { buyerId: userId, status: { not: 'CANCELLED' } },
    include: {
      seller: { select: { storeName: true, storeSlug: true } },
      weeklyMenu: {
        include: {
          days: {
            include: {
              menuItems: { include: { menuItem: { select: { name: true, price: true } } } },
            },
            orderBy: { date: 'asc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function BuyerSubscriptionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const subscriptions = await getBuyerSubscriptions(session.user.id)

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">My Subscriptions</h1>
      <SubscriptionsClient initialSubscriptions={subscriptions} />
    </div>
  )
}
