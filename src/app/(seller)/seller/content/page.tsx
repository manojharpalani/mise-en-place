export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ContentClient } from './content-client'

async function getSellerContent(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } })
  if (!seller) return null

  const articles = await prisma.article.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { name: true } } },
  })

  return { seller, articles }
}

export default async function ContentPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')
  const data = await getSellerContent(session.user.id)
  if (!data) redirect('/seller/onboarding')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Content</h1>
      <ContentClient seller={data.seller} initialArticles={data.articles} userId={session.user.id} />
    </div>
  )
}
