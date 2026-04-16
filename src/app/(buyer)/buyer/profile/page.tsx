export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProfileClient } from './profile-client'

async function getBuyerProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, image: true,
      phone: true, notificationChannel: true,
      neighborhood: true, zip: true,
      creditBalance: { select: { balance: true } },
    },
  })
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const user = await getBuyerProfile(session.user.id)
  if (!user) redirect('/auth/signin')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <ProfileClient user={user} />
    </div>
  )
}
