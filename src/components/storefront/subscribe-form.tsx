'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, MessageCircle } from 'lucide-react'

const schema = z
  .object({
    phone: z.string().min(1, 'Phone number is required'),
    channels: z.array(z.string()).min(1, 'Select at least one channel'),
  })

type FormData = z.infer<typeof schema>

export function SubscribeForm({ sellerId }: { sellerId: string }) {
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { channels: ['whatsapp'], phone: '' },
  })

  const selectedChannels = watch('channels') || []

  const toggleChannel = (channel: string) => {
    const current = selectedChannels
    if (current.includes(channel)) {
      setValue('channels', current.filter((c) => c !== channel))
    } else {
      setValue('channels', [...current, channel])
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, sellerId }),
      })
      if (!res.ok) throw new Error('Failed to subscribe')
      setSubscribed(true)
      toast.success("You're subscribed! You'll get updates from this seller.")
    } catch {
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (subscribed) {
    return (
      <div className="bg-[#f7e9de] border border-[#e7ddcb] rounded-xl p-4 text-center">
        <MessageCircle className="w-8 h-8 text-[#c1622d] mx-auto mb-2" />
        <p className="font-medium text-[#a64f20]">You&apos;re subscribed!</p>
        <p className="text-sm text-[#c1622d] mt-1">You&apos;ll receive updates from this seller.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-[#c1622d]" /> Get Updates
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Notify me via</Label>
          <div className="flex gap-3">
            {['whatsapp', 'sms'].map((ch) => (
              <label key={ch} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={selectedChannels.includes(ch)}
                  onCheckedChange={() => toggleChannel(ch)}
                />
                <span className="text-sm">{ch === 'sms' ? 'SMS' : 'WhatsApp'}</span>
              </label>
            ))}
          </div>
          {errors.channels && <p className="text-xs text-red-500">{errors.channels.message}</p>}
        </div>

        <div>
          <Input
            type="tel"
            placeholder="+1 (555) 000-0000"
            className="text-sm"
            {...register('phone')}
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>

        <Button type="submit" size="sm" className="w-full bg-[#c1622d] hover:bg-[#a64f20]" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Subscribe for Updates
        </Button>
      </form>
    </div>
  )
}
