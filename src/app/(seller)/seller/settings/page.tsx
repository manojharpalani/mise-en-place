export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'

async function getSellerSettings(userId: string) {
  return prisma.sellerProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true, neighborhood: true, zip: true } } },
  })
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')
  const seller = await getSellerSettings(session.user.id)
  if (!seller) redirect('/seller/onboarding')

  return (
    <div>
      <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em] text-[#12402C] mb-6">Store Settings</h1>
      <SettingsClient seller={seller as any} />
    </div>
  )
}
