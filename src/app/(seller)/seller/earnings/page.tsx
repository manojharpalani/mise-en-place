export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { EarningsClient } from './earnings-client'

async function getOrders(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } })
  if (!seller) return null

  return prisma.order.findMany({
    where: { sellerId: seller.id, status: { not: 'CANCELLED' } },
    include: {
      buyer: { select: { name: true, email: true } },
      items: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function EarningsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const orders = await getOrders(session.user.id)
  if (orders === null) redirect('/seller/onboarding')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
      <EarningsClient orders={orders} />
    </div>
  )
}
