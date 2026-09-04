'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ReviewDialogProps {
  orderId: string
  storeName: string
  open: boolean
  onClose: () => void
}

export function ReviewDialog({ orderId, storeName, open, onClose }: ReviewDialogProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please select a star rating'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, rating, comment: comment.trim() || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to submit review')
        return
      }
      toast.success('Review submitted — thank you!')
      onClose()
      router.refresh()
    } catch {
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const display = hovered || rating

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate your order from {storeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* Star picker */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className="w-8 h-8 transition-colors"
                  fill={star <= display ? '#f59e0b' : 'none'}
                  stroke={star <= display ? '#f59e0b' : '#d1d5db'}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
            </p>
          )}

          <Textarea
            placeholder="What did you love? Any feedback? (optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            className="resize-none"
          />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#c1622d] hover:bg-[#a64f20] text-white"
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Submit Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
