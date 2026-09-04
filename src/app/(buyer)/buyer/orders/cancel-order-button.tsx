'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function CancelOrderButton({ orderId, storeName }: { orderId: string; storeName: string }) {
  const [open, setOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()

  const confirm = async () => {
    setCancelling(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to cancel order')
        return
      }
      toast.success('Order cancelled')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-medium"
      >
        <X className="w-3.5 h-3.5" />
        Cancel Order
      </button>

      <Dialog open={open} onOpenChange={v => { if (!v) setOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Your order from <span className="font-medium">{storeName}</span> will be cancelled.
              {' '}If you paid online, a refund will be initiated automatically.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={cancelling}>
                Keep Order
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirm}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Yes, Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
