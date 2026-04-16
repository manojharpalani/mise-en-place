export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { MarketingClient } from './marketing-client'

async function getSellerData(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: {
      subscribers: { where: { status: 'ACTIVE' } },
      menuItems: { where: { isActive: true }, select: { id: true, name: true } },
    },
  })
  return seller
}

export default async function MarketingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')
  const seller = await getSellerData(session.user.id)
  if (!seller) redirect('/seller/onboarding')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Marketing</h1>
      <p className="text-gray-500 mb-6">Send newsletters and create social media assets</p>
      <MarketingClient seller={seller} />
    </div>
  )
}
