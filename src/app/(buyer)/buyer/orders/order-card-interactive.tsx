'use client'

import { Star } from 'lucide-react'
import { OrderReviewButton } from './order-review-button'
import { CancelOrderButton } from './cancel-order-button'

// These two pieces need real event handlers (navigate to the seller's store
// without also triggering the card's own link to the order-detail page, and
// stop clicks on the review/cancel buttons from doing the same). The parent
// order list is a Server Component, and passing a function like `onClick`
// straight through a plain server-rendered element throws "Event handlers
// cannot be passed to Client Component props" — so both live here instead.

export function SellerNameButton({ storeSlug, storeName }: { storeSlug: string; storeName: string }) {
  return (
    <span
      className="font-semibold text-foreground hover:text-[#c1622d] cursor-pointer"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        window.location.href = `/${storeSlug}`
      }}
    >
      {storeName}
    </span>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="w-3.5 h-3.5"
          fill={s <= rating ? '#f59e0b' : 'none'}
          stroke={s <= rating ? '#f59e0b' : '#d1d5db'}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">Your review</span>
    </div>
  )
}

export interface OrderActionsRowProps {
  orderId: string
  storeName: string
  status: string
  reviewRating: number | null
  isCompleted: boolean
}

export function OrderActionsRow({ orderId, storeName, status, reviewRating, isCompleted }: OrderActionsRowProps) {
  return (
    // Bug fix: this row sits inside the order card's <Link> to the detail
    // page. stopPropagation() alone stops the click from reaching the
    // Link's own onClick -- but that's exactly where Next.js calls
    // preventDefault() to swap in client-side routing. With the Link's
    // handler never running, the anchor's native "follow this href"
    // behavior went through anyway, so clicking "Cancel Order" or
    // "Rate & Review" silently navigated to the order detail page instead
    // of opening their dialog in place. Calling preventDefault() here too
    // suppresses that native navigation directly.
    <div
      className="mt-3 flex items-center gap-3"
      onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
    >
      {reviewRating != null ? (
        <StarDisplay rating={reviewRating} />
      ) : isCompleted ? (
        <OrderReviewButton orderId={orderId} storeName={storeName} />
      ) : null}
      {status === 'PENDING' && <CancelOrderButton orderId={orderId} storeName={storeName} />}
    </div>
  )
}
