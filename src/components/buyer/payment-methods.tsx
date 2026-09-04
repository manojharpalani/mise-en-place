'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, CreditCard, Trash2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface SavedPM {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  wallet: string | null
}

// ── Inner form rendered inside <Elements> ──────────────────────
function SetupForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSaving(true)
    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/buyer/profile`,
        },
        redirect: 'if_required',
      })
      if (error) {
        toast.error(error.message ?? 'Failed to save payment method')
      } else {
        toast.success('Payment method saved!')
        onSuccess()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!stripe || saving}
          className="flex-1 bg-[#c1622d] hover:bg-[#a64f20] text-white"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save Card
        </Button>
      </div>
    </form>
  )
}

// ── Main component ─────────────────────────────────────────────
export function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<SavedPM[]>([])
  const [loadingPMs, setLoadingPMs] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadingSetup, setLoadingSetup] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchPaymentMethods = useCallback(async () => {
    setLoadingPMs(true)
    try {
      const res = await fetch('/api/profile/payment-methods')
      const data = await res.json()
      setPaymentMethods(data.paymentMethods ?? [])
    } finally {
      setLoadingPMs(false)
    }
  }, [])

  useEffect(() => { fetchPaymentMethods() }, [fetchPaymentMethods])

  const openAddForm = async () => {
    setLoadingSetup(true)
    try {
      const res = await fetch('/api/profile/payment-methods', { method: 'POST' })
      const data = await res.json()
      if (!data.clientSecret) throw new Error()
      setClientSecret(data.clientSecret)
      setShowAddForm(true)
    } catch {
      toast.error('Could not start payment setup')
    } finally {
      setLoadingSetup(false)
    }
  }

  const removePaymentMethod = async (id: string) => {
    setRemovingId(id)
    try {
      const res = await fetch('/api/profile/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: id }),
      })
      if (!res.ok) throw new Error()
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id))
      toast.success('Card removed')
    } catch {
      toast.error('Failed to remove card')
    } finally {
      setRemovingId(null)
    }
  }

  const handleSetupSuccess = () => {
    setShowAddForm(false)
    setClientSecret(null)
    fetchPaymentMethods()
  }

  const brandLabel = (brand: string) => brand.charAt(0).toUpperCase() + brand.slice(1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Payment Methods
        </CardTitle>
        <CardDescription>
          Save a card via Stripe Link for faster checkout. Your payment info is stored securely by Stripe — we never see your card details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Saved cards */}
        {loadingPMs ? (
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : paymentMethods.length > 0 ? (
          <div className="space-y-2">
            {paymentMethods.map(pm => (
              <div
                key={pm.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-stone-400" />
                  <div>
                    <p className="text-sm font-medium">
                      {brandLabel(pm.brand)} ···· {pm.last4}
                      {pm.wallet === 'link' && (
                        <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold">Link</span>
                      )}
                    </p>
                    <p className="text-xs text-stone-400">Expires {pm.expMonth}/{pm.expYear}</p>
                  </div>
                </div>
                <button
                  onClick={() => removePaymentMethod(pm.id)}
                  disabled={removingId === pm.id}
                  className="text-stone-300 hover:text-red-400 transition-colors"
                >
                  {removingId === pm.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            ))}
          </div>
        ) : !showAddForm ? (
          <p className="text-sm text-stone-400">No saved cards yet.</p>
        ) : null}

        {/* Add card form */}
        {showAddForm && clientSecret ? (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-stone-700">Add a card</p>
              <button
                onClick={() => { setShowAddForm(false); setClientSecret(null) }}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: 'stripe', variables: { colorPrimary: '#c1622d' } },
              }}
            >
              <SetupForm onSuccess={handleSetupSuccess} />
            </Elements>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={openAddForm}
            disabled={loadingSetup}
            className="w-full border-dashed"
          >
            {loadingSetup
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Plus className="w-4 h-4 mr-2" />
            }
            Add Card
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
