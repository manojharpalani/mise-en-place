'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, ShoppingBag, Store, Truck } from 'lucide-react'
import { pickupSlotsFor } from '@/lib/pickup'
import Link from 'next/link'

export function CheckoutForm() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const [fulfillmentType, setFulfillmentType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [pickupWindow, setPickupWindow] = useState('')
  const [notes, setNotes] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [loading, setLoading] = useState(false)

  const [todayStr, setTodayStr] = useState('')
  useEffect(() => { setTodayStr(new Date().toISOString().split('T')[0]) }, [])

  const sellerId = items[0]?.sellerId
  const subtotal = getTotal()

  // Seller's pickup windows drive the pickup-time dropdown.
  const [sellerInfo, setSellerInfo] = useState<{ pickupWindows: unknown; pickupEnabled: boolean; deliveryEnabled: boolean; deliveryFee: number | null } | null>(null)
  useEffect(() => {
    if (!sellerId) return
    fetch(`/api/sellers/${sellerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setSellerInfo({ pickupWindows: s.pickupWindows, pickupEnabled: s.pickupEnabled, deliveryEnabled: s.deliveryEnabled, deliveryFee: s.deliveryFee }))
      .catch(() => {})
  }, [sellerId])

  const pickupSlots = useMemo(() => pickupSlotsFor(scheduledDate, sellerInfo?.pickupWindows), [scheduledDate, sellerInfo])
  useEffect(() => {
    if (pickupWindow && !pickupSlots.includes(pickupWindow)) setPickupWindow('')
  }, [pickupSlots, pickupWindow])

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em] text-[#12402C] mb-4">Your cart is empty</h1>
          <Button asChild className="bg-[#e2472b] hover:bg-[#c43a20]">
            <Link href="/sellers">Browse Sellers</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handlePlaceOrder = async () => {
    if (!scheduledDate) {
      toast.error('Please select a pickup/delivery date')
      return
    }
    if (fulfillmentType === 'PICKUP' && !pickupWindow) {
      toast.error('Please choose a pickup time')
      return
    }
    if (fulfillmentType === 'DELIVERY' && !deliveryAddress) {
      toast.error('Please enter a delivery address')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          fulfillmentType,
          scheduledDate,
          pickupWindow: pickupWindow || null,
          deliveryAddress: deliveryAddress || null,
          notes: notes || null,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            comboItemId: item.comboItemId,
            quantity: item.quantity,
            unitPrice: item.price,
            itemType: item.type,
            itemName: item.name,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to place order')
      }

      const order = await res.json()
      clearCart()
      toast.success('Order placed successfully!')
      router.push(`/buyer/orders`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em] text-[#12402C] mb-6">Checkout</h1>

        <div className="grid md:grid-cols-[1.2fr_1fr] gap-6 items-start">
          {/* Left: Order form */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="font-heading text-lg font-bold text-[#12402C]">How do you want it?</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Fulfillment">
                  {([
                    { value: 'PICKUP', label: 'Pickup', hint: 'From the chef’s kitchen', Icon: Store, enabled: sellerInfo?.pickupEnabled !== false },
                    { value: 'DELIVERY', label: 'Delivery', hint: sellerInfo?.deliveryFee ? `${formatCurrency(sellerInfo.deliveryFee)} fee` : 'To your door', Icon: Truck, enabled: sellerInfo?.deliveryEnabled !== false },
                  ] as const).map(({ value, label, hint, Icon, enabled }) => {
                    const active = fulfillmentType === value
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={!enabled}
                        onClick={() => setFulfillmentType(value)}
                        className={`text-left rounded-xl border p-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          active ? 'border-[#12402C] bg-[#E3EFE7] ring-1 ring-[#12402C]' : 'border-[#EFE3C7] bg-white hover:border-[#12402C]/40'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${active ? 'text-[#12402C]' : 'text-muted-foreground'}`} />
                        <span className="block font-semibold text-sm text-foreground">{label}</span>
                        <span className="block text-xs text-muted-foreground">{enabled ? hint : 'Not offered'}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">{fulfillmentType === 'PICKUP' ? 'Pickup date' : 'Delivery date'}</Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={todayStr}
                    className="h-10"
                  />
                </div>

                {fulfillmentType === 'PICKUP' && (
                  <div className="space-y-2">
                    <Label htmlFor="pickup-window">Pickup time</Label>
                    <select
                      id="pickup-window"
                      value={pickupWindow}
                      onChange={(e) => setPickupWindow(e.target.value)}
                      disabled={!scheduledDate || pickupSlots.length === 0}
                      className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground"
                    >
                      <option value="">
                        {!scheduledDate ? 'Choose a date first' : pickupSlots.length === 0 ? 'No pickup times that day' : 'Select a time range'}
                      </option>
                      {pickupSlots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    {scheduledDate && pickupSlots.length === 0 && (
                      <p className="text-xs text-[#B07D00]">This chef doesn’t offer pickup on that day. Try another date.</p>
                    )}
                  </div>
                )}

                {fulfillmentType === 'DELIVERY' && (
                  <div className="space-y-2">
                    <Label htmlFor="delivery-address">Delivery address</Label>
                    <Input
                      id="delivery-address"
                      placeholder="123 Main St, City, State, ZIP"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="h-10"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="order-notes">Special instructions (optional)</Label>
                  <Textarea
                    id="order-notes"
                    placeholder="Allergies, special requests..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Order summary */}
          <div>
            <Card>
              <CardHeader><CardTitle className="font-heading text-lg font-bold text-[#12402C]">Order summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground font-medium">{items[0]?.sellerName}</p>

                {items.map((item, i) => (
                  <div key={i} className="flex justify-between gap-3 text-sm">
                    <span><span className="font-semibold tabular-nums">{item.quantity}×</span> {item.name}</span>
                    <span className="tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {fulfillmentType === 'DELIVERY' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery fee</span>
                      <span>{sellerInfo?.deliveryFee ? formatCurrency(sellerInfo.deliveryFee) : 'Set by the chef'}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-semibold">Total</span>
                    <span className="font-heading text-2xl font-extrabold text-[#12402C] tabular-nums">
                      {formatCurrency(subtotal + (fulfillmentType === 'DELIVERY' ? sellerInfo?.deliveryFee ?? 0 : 0))}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-[#e2472b] hover:bg-[#c43a20] mt-4"
                  size="lg"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Place Order
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Payment collected at pickup/delivery
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
