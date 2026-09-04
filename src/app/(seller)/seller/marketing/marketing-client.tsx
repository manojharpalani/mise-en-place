'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SocialAssetGenerator } from '@/components/seller/social-asset-generator'
import { Loader2, Send, Users } from 'lucide-react'
import { toast } from 'sonner'
import { displayUrl } from '@/lib/site'

const emailSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message too short'),
})

const smsSchema = z.object({
  message: z.string().min(5, 'Message too short').max(160, 'SMS max 160 chars'),
})

interface MarketingClientProps {
  seller: {
    id: string
    storeSlug: string
    storeName: string
    subscribers: Array<{ channels: string[]; email?: string | null; phone?: string | null }>
    menuItems: Array<{ id: number; name: string }>
  }
}

export function MarketingClient({ seller }: MarketingClientProps) {
  const [sending, setSending] = useState(false)

  const emailSubscribers = seller.subscribers.filter((s) => s.channels.includes('email') && s.email)
  const smsSubscribers = seller.subscribers.filter((s) => (s.channels.includes('sms') || s.channels.includes('whatsapp')) && s.phone)

  const emailForm = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema) })
  const smsForm = useForm<z.infer<typeof smsSchema>>({ resolver: zodResolver(smsSchema) })

  const sendEmailNewsletter = async (data: z.infer<typeof emailSchema>) => {
    setSending(true)
    try {
      const res = await fetch('/api/marketing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          sellerId: seller.id,
          subject: data.subject,
          message: data.message,
        }),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      toast.success(`Newsletter sent to ${result.sent} subscribers!`)
      emailForm.reset()
    } catch {
      toast.error('Failed to send newsletter')
    } finally {
      setSending(false)
    }
  }

  const sendSMSBlast = async (data: z.infer<typeof smsSchema>) => {
    setSending(true)
    try {
      const res = await fetch('/api/marketing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sms',
          sellerId: seller.id,
          message: data.message,
        }),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      toast.success(`SMS sent to ${result.sent} subscribers!`)
      smsForm.reset()
    } catch {
      toast.error('Failed to send SMS')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Subscriber stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{emailSubscribers.length}</p>
              <p className="text-xs text-muted-foreground">Email Subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f7e9de] rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-[#c1622d]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{smsSubscribers.length}</p>
              <p className="text-xs text-muted-foreground">SMS/WhatsApp Subscribers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="email">Email Newsletter</TabsTrigger>
          <TabsTrigger value="sms">SMS/WhatsApp</TabsTrigger>
          <TabsTrigger value="social">Social Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Send Email Newsletter</CardTitle>
            </CardHeader>
            <CardContent>
              {emailSubscribers.length === 0 ? (
                <p className="text-muted-foreground">No email subscribers yet. Share your store to grow your list!</p>
              ) : (
                <form onSubmit={emailForm.handleSubmit(sendEmailNewsletter)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject Line</Label>
                    <Input placeholder="This week's menu is out!" {...emailForm.register('subject')} />
                    {emailForm.formState.errors.subject && (
                      <p className="text-sm text-red-500">{emailForm.formState.errors.subject.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Write your newsletter message here..."
                      rows={8}
                      {...emailForm.register('message')}
                    />
                    {emailForm.formState.errors.message && (
                      <p className="text-sm text-red-500">{emailForm.formState.errors.message.message}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={sending} className="bg-[#c1622d] hover:bg-[#a64f20]">
                    {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send to {emailSubscribers.length} Subscribers
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>Send SMS/WhatsApp Blast</CardTitle>
            </CardHeader>
            <CardContent>
              {smsSubscribers.length === 0 ? (
                <p className="text-muted-foreground">No SMS/WhatsApp subscribers yet.</p>
              ) : (
                <form onSubmit={smsForm.handleSubmit(sendSMSBlast)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Message (max 160 chars)</Label>
                    <Textarea
                      placeholder={`Today's special: Lamb Biryani $15! Order at ${displayUrl('/s/yourstore')}`}
                      rows={4}
                      maxLength={160}
                      {...smsForm.register('message')}
                    />
                    {smsForm.formState.errors.message && (
                      <p className="text-sm text-red-500">{smsForm.formState.errors.message.message}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={sending} className="bg-[#c1622d] hover:bg-[#a64f20]">
                    {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send to {smsSubscribers.length} Subscribers
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate branded images for Instagram, Facebook, and WhatsApp
              </p>
              <SocialAssetGenerator storeSlug={seller.storeSlug} menuItems={seller.menuItems} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
