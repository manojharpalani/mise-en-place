export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { ContentClient } from './content-client'

async function getArticles() {
  return prisma.article.findMany({
    include: {
      seller: { select: { storeName: true } },
      author: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export default async function AdminContentPage() {
  const articles = await getArticles()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
      <ContentClient initialArticles={articles} />
    </div>
  )
}
