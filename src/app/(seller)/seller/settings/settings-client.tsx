'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Save, ExternalLink, Info } from 'lucide-react'
import { toast } from 'sonner'

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/

const schema = z.object({
  storeName: z.string().min(1, 'Store name required'),
  storeSlug: z
    .string()
    .min(3, 'Minimum 3 characters')
    .max(50, 'Maximum 50 characters')
    .regex(SLUG_RE, 'Lowercase letters, numbers, hyphens only (no leading/trailing hyphens)'),
  bio: z.string().optional(),
  story: z.string().optional(),
  cuisineType: z.string().optional(),
  deliveryEnabled: z.boolean(),
  deliveryRadiusMiles: z.coerce.number().optional(),
  deliveryFee: z.coerce.number().optional(),
  pickupEnabled: z.boolean(),
  whatsappGroupLink: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  neighborhood: z.string().optional(),
  zip: z.string().optional(),
  waPhoneNumberId: z.string().optional(),
  waAccessToken: z.string().optional(),
  waTemplateLanguage: z.string().optional(),
  waMenuTemplate: z.string().optional(),
  waArticleTemplate: z.string().optional(),
  waMarketingTemplate: z.string().optional(),
  waOrderTemplate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function SettingsClient({ seller }: {
  seller: {
    id: string
    storeName: string
    storeSlug: string
    bio?: string | null
    story?: string | null
    cuisineType?: string | null
    deliveryEnabled: boolean
    deliveryRadiusMiles?: number | null
    deliveryFee?: number | null
    pickupEnabled: boolean
    whatsappGroupLink?: string | null
    waPhoneNumberId?: string | null
    waAccessToken?: string | null
    waTemplateLanguage?: string | null
    waMenuTemplate?: string | null
    waArticleTemplate?: string | null
    waMarketingTemplate?: string | null
    waOrderTemplate?: string | null
    socialLinks?: Record<string, string> | null
    user: { name?: string | null; email?: string | null; neighborhood?: string | null; zip?: string | null; [key: string]: unknown }
  }
}) {
  const [loading, setLoading] = useState(false)
  const [showWAToken, setShowWAToken] = useState(false)
  const socialLinks = seller.socialLinks as Record<string, string> | null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      storeName: seller.storeName,
      storeSlug: seller.storeSlug,
      bio: seller.bio || '',
      story: seller.story || '',
      cuisineType: seller.cuisineType || '',
      deliveryEnabled: seller.deliveryEnabled,
      deliveryRadiusMiles: seller.deliveryRadiusMiles ?? undefined,
      deliveryFee: seller.deliveryFee ?? undefined,
      pickupEnabled: seller.pickupEnabled,
      whatsappGroupLink: seller.whatsappGroupLink || '',
      instagram: socialLinks?.instagram || '',
      facebook: socialLinks?.facebook || '',
      neighborhood: seller.user.neighborhood || '',
      zip: seller.user.zip || '',
      waPhoneNumberId: seller.waPhoneNumberId || '',
      waAccessToken: seller.waAccessToken || '',
      waTemplateLanguage: seller.waTemplateLanguage || 'en_US',
      waMenuTemplate: seller.waMenuTemplate || '',
      waArticleTemplate: seller.waArticleTemplate || '',
      waMarketingTemplate: seller.waMarketingTemplate || '',
      waOrderTemplate: seller.waOrderTemplate || '',
    },
  })

  const deliveryEnabled = watch('deliveryEnabled')
  const pickupEnabled = watch('pickupEnabled')
  const slugValue = watch('storeSlug')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const socialLinksData: Record<string, string> = {}
      if (data.instagram) socialLinksData.instagram = data.instagram
      if (data.facebook) socialLinksData.facebook = data.facebook

      const res = await fetch(`/api/sellers/${seller.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: data.storeName,
          storeSlug: data.storeSlug,
          bio: data.bio || null,
          story: data.story || null,
          cuisineType: data.cuisineType || null,
          deliveryEnabled: data.deliveryEnabled,
          deliveryRadiusMiles: data.deliveryRadiusMiles || null,
          deliveryFee: data.deliveryFee || null,
          pickupEnabled: data.pickupEnabled,
          whatsappGroupLink: data.whatsappGroupLink || null,
          socialLinks: Object.keys(socialLinksData).length > 0 ? socialLinksData : null,
          neighborhood: data.neighborhood || null,
          zip: data.zip || null,
          waPhoneNumberId: data.waPhoneNumberId || null,
          waAccessToken: data.waAccessToken || null,
          waTemplateLanguage: data.waTemplateLanguage || null,
          waMenuTemplate: data.waMenuTemplate || null,
          waArticleTemplate: data.waArticleTemplate || null,
          waMarketingTemplate: data.waMarketingTemplate || null,
          waOrderTemplate: data.waOrderTemplate || null,
        }),
      })

      if (res.status === 409) {
        toast.error('That store URL is already taken — choose another')
        return
      }
      if (res.status === 422) {
        const body = await res.json()
        toast.error(body.error || 'Invalid store URL')
        return
      }
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Settings saved!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Store Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Store Name *</Label>
            <Input {...register('storeName')} />
            {errors.storeName && <p className="text-sm text-red-500">{errors.storeName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Short Bio</Label>
            <Textarea {...register('bio')} rows={3} placeholder="Tell customers about your food..." />
          </div>
          <div className="space-y-2">
            <Label>Full Story</Label>
            <Textarea {...register('story')} rows={6} placeholder="Share the story behind your cooking..." />
          </div>
          <div className="space-y-2">
            <Label>Cuisine Type</Label>
            <Input {...register('cuisineType')} placeholder="e.g. South Indian, Mexican, Italian..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Store URL</CardTitle>
          <CardDescription>Your public storefront address — share this with customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Store slug</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-stone-400 whitespace-nowrap">{appUrl}/store/</span>
              <Input
                {...register('storeSlug')}
                className="flex-1"
                placeholder="my-kitchen"
                onChange={e => setValue('storeSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, ''))}
              />
            </div>
            {errors.storeSlug && <p className="text-sm text-red-500">{errors.storeSlug.message}</p>}
            {slugValue && SLUG_RE.test(slugValue) && (
              <p className="text-xs text-stone-500">
                Preview: <span className="font-medium text-stone-700">{appUrl}/store/{slugValue}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Location</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Neighborhood</Label>
              <Input {...register('neighborhood')} placeholder="e.g. Sunset District" />
            </div>
            <div className="space-y-2">
              <Label>ZIP Code</Label>
              <Input {...register('zip')} placeholder="94100" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fulfillment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Pickup Available</Label>
              <p className="text-sm text-gray-500">Customers can pick up from your location</p>
            </div>
            <Switch
              checked={pickupEnabled}
              onCheckedChange={(v) => setValue('pickupEnabled', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Delivery Available</Label>
              <p className="text-sm text-gray-500">You offer delivery to customers</p>
            </div>
            <Switch
              checked={deliveryEnabled}
              onCheckedChange={(v) => setValue('deliveryEnabled', v)}
            />
          </div>

          {deliveryEnabled && (
            <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-[#e8d5d0]">
              <div className="space-y-2">
                <Label>Delivery Radius (miles)</Label>
                <Input type="number" step="0.5" {...register('deliveryRadiusMiles')} placeholder="5" />
              </div>
              <div className="space-y-2">
                <Label>Delivery Fee ($)</Label>
                <Input type="number" step="0.50" {...register('deliveryFee')} placeholder="5.00" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contact & Social</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>WhatsApp Group Link</Label>
            <Input {...register('whatsappGroupLink')} placeholder="https://chat.whatsapp.com/..." />
            {errors.whatsappGroupLink && <p className="text-sm text-red-500">{errors.whatsappGroupLink.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Instagram URL</Label>
            <Input {...register('instagram')} placeholder="https://instagram.com/yourstore" />
          </div>
          <div className="space-y-2">
            <Label>Facebook URL</Label>
            <Input {...register('facebook')} placeholder="https://facebook.com/yourpage" />
          </div>
        </CardContent>
      </Card>

      {/* ── WhatsApp Business Integration ── */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Business</CardTitle>
          <CardDescription>
            Connect your Meta WhatsApp Business account to send menus, articles, and order updates to customers.{' '}
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-rose-600 hover:underline"
            >
              Setup guide <ExternalLink className="w-3 h-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* ── Connection ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-700 border-b pb-1.5">Connection</h3>
            <div className="space-y-2">
              <Label>Phone Number ID</Label>
              <Input
                {...register('waPhoneNumberId')}
                placeholder="e.g. 123456789012345"
                className="font-mono text-sm"
              />
              <p className="text-xs text-stone-500">Meta Business Manager → WhatsApp → Phone Numbers</p>
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <div className="relative">
                <Input
                  {...register('waAccessToken')}
                  type={showWAToken ? 'text' : 'password'}
                  placeholder="EAAxxxxxxx..."
                  className="font-mono text-sm pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowWAToken(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-500 hover:text-stone-700"
                >
                  {showWAToken ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-stone-500">Use a permanent system user token — never a temporary token</p>
            </div>
          </div>

          {/* ── Message Templates ── */}
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b pb-1.5">
              <h3 className="text-sm font-semibold text-stone-700">Message Templates</h3>
              <a
                href="https://business.facebook.com/wa/manage/message-templates/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline"
              >
                Manage templates <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 flex gap-2 text-xs text-amber-800">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div>
                Templates must be created and approved in Meta Business Manager first.
                Enter the exact approved template name below. Leave blank to fall back to free-form text
                (works within the 24-hour customer service window or in test mode).
              </div>
            </div>

            <div className="space-y-2">
              <Label>Template Language</Label>
              <Input
                {...register('waTemplateLanguage')}
                placeholder="en_US"
                className="font-mono text-sm max-w-[140px]"
              />
              <p className="text-xs text-stone-500">Applied to all templates. Common codes: en_US, en_GB, hi, es</p>
            </div>

            {/* Template rows */}
            {([
              {
                key: 'waMenuTemplate' as const,
                label: 'Weekly Menu',
                description: 'Sent to subscribers when you publish a weekly menu',
                vars: '{{1}} Store name · {{2}} Week label · {{3}} Store URL',
                example: 'weekly_menu_update',
              },
              {
                key: 'waArticleTemplate' as const,
                label: 'Content Article',
                description: 'Sent when you publish a blog post or announcement',
                vars: '{{1}} Article title · {{2}} Article URL',
                example: 'new_article_share',
              },
              {
                key: 'waMarketingTemplate' as const,
                label: 'Marketing Notification',
                description: 'Ad-hoc broadcast to all subscribers',
                vars: '{{1}} Message body',
                example: 'marketing_blast',
              },
              {
                key: 'waOrderTemplate' as const,
                label: 'Order Update',
                description: 'Sent on order confirmation and status changes',
                vars: '{{1}} Customer name · {{2}} Order status · {{3}} Scheduled date',
                example: 'order_status_update',
              },
            ] as const).map(t => (
              <div key={t.key} className="rounded-lg border border-stone-200 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{t.label}</p>
                    <p className="text-xs text-stone-500">{t.description}</p>
                  </div>
                </div>
                <Input
                  {...register(t.key)}
                  placeholder={t.example}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-stone-400">
                  <span className="font-medium text-stone-500">Variables your template must include:</span>{' '}
                  {t.vars}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="bg-[#d4a5a5] hover:bg-[#c49090]">
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Settings
      </Button>
    </form>
  )
}
