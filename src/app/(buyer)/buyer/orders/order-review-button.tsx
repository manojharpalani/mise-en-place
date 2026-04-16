'use client'

import { useState } from 'react'
import { ReviewDialog } from '@/components/buyer/review-dialog'
import { Star } from 'lucide-react'

export function OrderReviewButton({ orderId, storeName }: { orderId: string; storeName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-[#d4a5a5] hover:text-[#b08080] font-medium"
      >
        <Star className="w-3.5 h-3.5" />
        Rate &amp; Review
      </button>
      <ReviewDialog orderId={orderId} storeName={storeName} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
