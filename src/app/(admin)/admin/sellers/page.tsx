export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { SellersAdminClient } from './sellers-client'

async function getAllSellers() {
  return prisma.sellerProfile.findMany({
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function AdminSellersPage() {
  const sellers = await getAllSellers()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Seller Management</h1>
      <SellersAdminClient initialSellers={sellers} />
    </div>
  )
}
