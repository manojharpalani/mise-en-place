'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const [fulfillmentType, setFulfillmentType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [pickupWindow, setPickupWindow] = useState('')
  const [notes, setNotes] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [loading, setLoading] = useState(false)

  const sellerId = items[0]?.sellerId
  const subtotal = getTotal()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <Button asChild className="bg-[#d4a5a5] hover:bg-[#c49090]">
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Order form */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Fulfillment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={fulfillmentType} onValueChange={(v) => setFulfillmentType(v as 'PICKUP' | 'DELIVERY')}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <RadioGroupItem value="PICKUP" />
                    <span className="font-medium">Pickup</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <RadioGroupItem value="DELIVERY" />
                    <span className="font-medium">Delivery</span>
                  </label>
                </RadioGroup>

                {fulfillmentType === 'DELIVERY' && (
                  <div className="space-y-2">
                    <Label>Delivery Address</Label>
                    <Input
                      placeholder="123 Main St, City, State, ZIP"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                )}

                {fulfillmentType === 'PICKUP' && (
                  <div className="space-y-2">
                    <Label>Pickup Window</Label>
                    <Input
                      placeholder="e.g. 12:00 PM - 2:00 PM"
                      value={pickupWindow}
                      onChange={(e) => setPickupWindow(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Scheduled Date</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Special Instructions (optional)</Label>
                  <Textarea
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
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-500 font-medium">{items[0]?.sellerName}</p>

                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {fulfillmentType === 'DELIVERY' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Delivery fee</span>
                      <span>Calculated at order</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#d4a5a5]">{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-[#d4a5a5] hover:bg-[#c49090] mt-4"
                  size="lg"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Place Order
                </Button>
                <p className="text-xs text-gray-400 text-center">
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
