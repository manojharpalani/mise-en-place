'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Save, Wallet, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { PaymentMethods } from '@/components/buyer/payment-methods'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  notificationChannel: z.enum(['whatsapp', 'sms']),
  neighborhood: z.string().optional(),
  zip: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ProfileClient({ user }: {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    phone?: string | null
    notificationChannel?: string | null
    neighborhood?: string | null
    zip?: string | null
    creditBalance?: { balance: number } | null
  }
}) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name || '',
      phone: user.phone || '',
      notificationChannel: (user.notificationChannel as 'whatsapp' | 'sms') || 'whatsapp',
      neighborhood: user.neighborhood || '',
      zip: user.zip || '',
    },
  })

  const channel = watch('notificationChannel')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.status === 409) {
        toast.error('That phone number is already associated with another account')
        return
      }
      if (!res.ok) throw new Error()
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Identity card */}
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.image ?? ''} />
            <AvatarFallback className="text-xl bg-[#f7e9de] text-[#a64f20]">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user.name || 'No name set'}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Credit balance */}
      {user.creditBalance && user.creditBalance.balance > 0 && (
        <Card className="border-[#e7ddcb] bg-[#f7e9de]">
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-[#c1622d]" />
            <div>
              <p className="font-bold text-[#a64f20] text-xl">{formatCurrency(user.creditBalance.balance)}</p>
              <p className="text-sm text-[#c1622d]">Available store credit</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile form */}
      <Card>
        <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            {/* Phone + notification channel */}
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                type="tel"
                {...register('phone')}
                placeholder="+1 (555) 000-0000"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              <p className="text-xs text-stone-500">Used for order updates and menu notifications.</p>
            </div>

            {/* Notification channel toggle */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Notify me via
              </Label>
              <div className="flex gap-2">
                {(['whatsapp', 'sms'] as const).map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setValue('notificationChannel', ch)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      channel === ch
                        ? 'bg-[#c1622d] text-white border-[#c1622d]'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-[#e7ddcb]'
                    }`}
                  >
                    {ch === 'whatsapp' ? '💬 WhatsApp' : '📱 SMS'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-500">
                {channel === 'whatsapp'
                  ? 'You\'ll receive updates via WhatsApp on the number above.'
                  : 'You\'ll receive SMS text messages on the number above.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Neighborhood</Label>
                <Input {...register('neighborhood')} placeholder="e.g. Mission District" />
              </div>
              <div className="space-y-2">
                <Label>ZIP Code</Label>
                <Input {...register('zip')} placeholder="94100" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="bg-[#c1622d] hover:bg-[#a64f20]">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stripe payment methods */}
      <PaymentMethods />
    </div>
  )
}
