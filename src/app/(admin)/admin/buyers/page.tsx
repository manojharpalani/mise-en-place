export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils'

async function getBuyers() {
  return prisma.user.findMany({
    where: { role: 'BUYER' },
    include: {
      _count: { select: { buyerOrders: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function AdminBuyersPage() {
  const buyers = await getBuyers()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Buyers ({buyers.length})</h1>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Orders</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((buyer) => (
              <tr key={buyer.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-[#f7e9de] text-[#a64f20]">
                        {(buyer.name || buyer.email || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{buyer.name || 'No name'}</p>
                      <p className="text-gray-400 text-xs">{buyer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {buyer.neighborhood ? `${buyer.neighborhood}${buyer.zip ? `, ${buyer.zip}` : ''}` : '—'}
                </td>
                <td className="px-4 py-3 font-medium">{buyer._count.buyerOrders}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(buyer.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {buyers.length === 0 && (
          <p className="text-gray-400 text-center py-12">No buyers yet.</p>
        )}
      </div>
    </div>
  )
}
