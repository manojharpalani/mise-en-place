export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

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
      <div className="space-y-3">
        {articles.map((article) => (
          <div key={article.id} className="bg-white border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-gray-900">{article.title}</h3>
                <p className="text-sm text-gray-500">
                  {article.seller.storeName} · {article.author.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(article.createdAt)}</p>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{article.body}</p>
              </div>
              <Badge variant={article.isPublished ? 'default' : 'secondary'}>
                {article.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
          </div>
        ))}
        {articles.length === 0 && (
          <p className="text-gray-400 text-center py-12">No articles yet.</p>
        )}
      </div>
    </div>
  )
}
