export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { OrderManagement } from '@/components/seller/order-management'

async function getSellerOrders(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } })
  if (!seller) return { seller: null, orders: [] }

  const orders = await prisma.order.findMany({
    where: { sellerId: seller.id },
    include: {
      buyer: { select: { name: true, email: true, phone: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return { seller, orders }
}

export default async function SellerOrdersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const { seller, orders } = await getSellerOrders(session.user.id)
  if (!seller) redirect('/seller/onboarding')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
      <OrderManagement initialOrders={orders} />
    </div>
  )
}
