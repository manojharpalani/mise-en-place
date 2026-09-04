'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { MapPin, Phone, Clock, Package, Loader2 } from 'lucide-react'

type OrderStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'DELIVERED' | 'PICKED_UP' | 'CANCELLED'

interface Order {
  id: string
  status: OrderStatus
  fulfillmentType: string
  subtotal: number
  deliveryFee: number
  total: number
  scheduledDate: Date
  pickupWindow?: string | null
  deliveryAddress?: string | null
  notes?: string | null
  createdAt: Date
  buyer: { name?: string | null; email: string | null; phone?: string | null }
  items: Array<{ itemName: string; quantity: number; unitPrice: number }>
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  READY: 'bg-[#f7e9de] text-[#a64f20]',
  DELIVERED: 'bg-muted text-muted-foreground',
  PICKED_UP: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-red-100 text-red-600',
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'PROCESSING',
  PROCESSING: 'READY',
  READY: 'DELIVERED',
}

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: 'Start Processing',
  PROCESSING: 'Mark Ready',
  READY: 'Mark Delivered',
}

const CANCEL_REASONS = [
  'Out of ingredients',
  'Too many orders today',
  'Scheduling conflict',
  'Customer unreachable',
  'Other',
]

export function OrderManagement({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelCustom, setCancelCustom] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
      toast.success(`Order updated to ${status}`)
    } catch {
      toast.error('Failed to update order')
    }
  }

  const openCancel = (order: Order) => {
    setCancellingOrder(order)
    setCancelReason('')
    setCancelCustom('')
  }

  const submitCancel = async () => {
    if (!cancellingOrder) return
    const reason = cancelReason === 'Other' ? cancelCustom.trim() : cancelReason
    // PENDING orders don't need a reason; PROCESSING ones do
    if (cancellingOrder.status === 'PROCESSING' && !reason) {
      toast.error('Please select a reason')
      return
    }
    setCancelling(true)
    try {
      const res = await fetch(`/api/orders/${cancellingOrder.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to cancel order'); return }
      setOrders(prev => prev.map(o => o.id === cancellingOrder.id ? { ...o, status: 'CANCELLED' } : o))
      toast.success('Order cancelled')
      setCancellingOrder(null)
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'PENDING', 'PROCESSING', 'READY', 'DELIVERED', 'PICKED_UP', 'CANCELLED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === status ? 'bg-[#c1622d] text-white' : 'bg-white border text-muted-foreground hover:bg-muted'
            }`}
          >
            {status}
            {counts[status] && status !== 'ALL' ? ` (${counts[status]})` : ''}
            {status === 'ALL' ? ` (${orders.length})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white border rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{order.buyer.name || order.buyer.email}</span>
                    <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(order.createdAt)}
                    </span>
                    {order.fulfillmentType === 'DELIVERY' ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Delivery: {order.deliveryAddress}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" /> Pickup: {order.pickupWindow || 'TBD'}
                      </span>
                    )}
                    {order.buyer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {order.buyer.phone}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-bold text-lg text-[#c1622d]">{formatCurrency(order.total)}</span>
              </div>

              <div className="bg-muted rounded-lg p-3 mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-0.5">
                    <span className="text-foreground">{item.quantity}x {item.itemName}</span>
                    <span className="text-muted-foreground">{formatCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t mt-2 text-muted-foreground">
                    <span>Delivery fee</span>
                    <span>{formatCurrency(order.deliveryFee)}</span>
                  </div>
                )}
              </div>

              {order.notes && (
                <p className="text-sm text-muted-foreground italic mb-3">Note: {order.notes}</p>
              )}

              <div className="flex gap-2">
                {NEXT_STATUS[order.status] && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus(order.id, NEXT_STATUS[order.status]!)}
                    className="bg-[#c1622d] hover:bg-[#a64f20]"
                  >
                    {NEXT_STATUS_LABEL[order.status]}
                  </Button>
                )}
                {order.status === 'READY' && order.fulfillmentType === 'PICKUP' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(order.id, 'PICKED_UP')}
                  >
                    Mark Picked Up
                  </Button>
                )}
                {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openCancel(order)}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      <Dialog open={!!cancellingOrder} onOpenChange={v => { if (!v) setCancellingOrder(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Order from <span className="font-medium">{cancellingOrder?.buyer.name || cancellingOrder?.buyer.email}</span>
              {cancellingOrder?.status === 'PROCESSING' && ' is being processed. Please provide a reason.'}
              {cancellingOrder?.status === 'PENDING' && '. The customer will be notified.'}
            </p>

            {/* Reason picker — required for PROCESSING, optional for PENDING */}
            <div className="space-y-2">
              <Label>
                Reason {cancellingOrder?.status === 'PROCESSING' ? '*' : '(optional)'}
              </Label>
              <div className="space-y-1.5">
                {CANCEL_REASONS.map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cancel-reason"
                      value={r}
                      checked={cancelReason === r}
                      onChange={() => setCancelReason(r)}
                      className="accent-[#c1622d]"
                    />
                    <span className="text-sm">{r}</span>
                  </label>
                ))}
              </div>
              {cancelReason === 'Other' && (
                <Textarea
                  placeholder="Describe the reason..."
                  value={cancelCustom}
                  onChange={e => setCancelCustom(e.target.value)}
                  rows={2}
                  className="mt-2 resize-none"
                />
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setCancellingOrder(null)} disabled={cancelling}>
                Keep Order
              </Button>
              <Button variant="destructive" className="flex-1" onClick={submitCancel} disabled={cancelling}>
                {cancelling ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Cancel Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
