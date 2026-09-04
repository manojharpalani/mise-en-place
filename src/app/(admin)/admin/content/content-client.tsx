'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Trash2, EyeOff, Eye } from 'lucide-react'

interface Article {
  id: string
  title: string
  body: string | null
  isPublished: boolean
  createdAt: Date
  seller: { storeName: string }
  author: { name: string | null }
}

export function ContentClient({ initialArticles }: { initialArticles: Article[] }) {
  const [articles, setArticles] = useState(initialArticles)
  const [loading, setLoading] = useState<string | null>(null)

  const togglePublish = async (article: Article) => {
    setLoading(article.id + '-publish')
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !article.isPublished }),
      })
      if (!res.ok) throw new Error()
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, isPublished: !article.isPublished } : a))
      )
      toast.success(article.isPublished ? 'Article unpublished' : 'Article published')
    } catch {
      toast.error('Failed to update article')
    } finally {
      setLoading(null)
    }
  }

  const deleteArticle = async (id: string) => {
    if (!confirm('Delete this article? This cannot be undone.')) return
    setLoading(id + '-delete')
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setArticles((prev) => prev.filter((a) => a.id !== id))
      toast.success('Article deleted')
    } catch {
      toast.error('Failed to delete article')
    } finally {
      setLoading(null)
    }
  }

  if (articles.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No articles yet.</p>
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <div key={article.id} className="bg-white border rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground truncate">{article.title}</h3>
                <Badge variant={article.isPublished ? 'default' : 'secondary'}>
                  {article.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {article.seller.storeName} · {article.author.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{formatDate(article.createdAt)}</p>
              {article.body && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{article.body}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={loading === article.id + '-publish'}
                onClick={() => togglePublish(article)}
                className="gap-1.5"
              >
                {article.isPublished ? (
                  <><EyeOff className="w-3.5 h-3.5" /> Unpublish</>
                ) : (
                  <><Eye className="w-3.5 h-3.5" /> Publish</>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading === article.id + '-delete'}
                onClick={() => deleteArticle(article.id)}
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
