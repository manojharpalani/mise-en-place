'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(10, 'Content is too short'),
})

type FormData = z.infer<typeof schema>

interface Article {
  id: string
  title: string
  body: string
  imageUrl?: string | null
  isPublished: boolean
  createdAt: Date
  author: { name?: string | null }
}

interface ContentClientProps {
  seller: { id: string }
  initialArticles: Article[]
  userId: string
}

export function ContentClient({ seller, initialArticles, userId }: ContentClientProps) {
  const [articles, setArticles] = useState(initialArticles)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = editingId ? `/api/articles/${editingId}` : '/api/articles'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, sellerId: seller.id, authorId: userId }),
      })

      if (!res.ok) throw new Error()
      const article = await res.json()

      if (editingId) {
        setArticles((prev) => prev.map((a) => (a.id === editingId ? article : a)))
        toast.success('Article updated!')
      } else {
        setArticles((prev) => [article, ...prev])
        toast.success('Article published!')
      }

      setShowForm(false)
      setEditingId(null)
      reset()
    } catch {
      toast.error('Failed to save article')
    } finally {
      setLoading(false)
    }
  }

  const deleteArticle = async (id: string) => {
    if (!confirm('Delete this article?')) return
    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' })
      setArticles((prev) => prev.filter((a) => a.id !== id))
      toast.success('Article deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="bg-[#c1622d] hover:bg-[#a64f20]">
          <Plus className="w-4 h-4 mr-2" /> New Article
        </Button>
      )}

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Article title..." {...register('title')} />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea placeholder="Write your story or update..." rows={10} {...register('body')} />
                {errors.body && <p className="text-sm text-red-500">{errors.body.message}</p>}
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="bg-[#c1622d] hover:bg-[#a64f20]">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingId ? 'Update Article' : 'Publish Article'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowForm(false); setEditingId(null); reset() }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No articles yet. Share your story with your community!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{article.title}</h3>
                      <Badge variant={article.isPublished ? 'default' : 'secondary'} className="text-xs">
                        {article.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{formatDate(article.createdAt)}</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{article.body}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(article.id)
                        reset({ title: article.title, body: article.body })
                        setShowForm(true)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteArticle(article.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
