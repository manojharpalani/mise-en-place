import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNewsletter } from '@/lib/email'
import { sendSMS } from '@/lib/sms'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['email', 'sms']),
  sellerId: z.string(),
  subject: z.string().optional(),
  message: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Verify seller ownership
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: data.sellerId, userId: session.user.id },
    })
    if (!seller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Get subscribers
    const subscribers = await prisma.subscriber.findMany({
      where: { sellerId: data.sellerId, status: 'ACTIVE' },
    })

    let sent = 0

    if (data.type === 'email') {
      const emailList = subscribers
        .filter((s) => s.channels.includes('email') && s.email)
        .map((s) => s.email!)

      if (emailList.length > 0) {
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Message from ${seller.storeName}</h2>
            <div style="white-space: pre-wrap; line-height: 1.6;">${data.message.replace(/\n/g, '<br>')}</div>
            <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              You're receiving this because you subscribed to ${seller.storeName} on Mise en Place.
            </p>
          </div>
        `
        const result = await sendNewsletter({
          recipients: emailList,
          subject: data.subject || `Update from ${seller.storeName}`,
          html,
          storeName: seller.storeName,
        })
        sent = result.sent || 0
      }
    } else if (data.type === 'sms') {
      const phoneList = subscribers
        .filter((s) => (s.channels.includes('sms') || s.channels.includes('whatsapp')) && s.phone)
        .map((s) => s.phone!)

      const results = await Promise.allSettled(
        phoneList.map((phone) => sendSMS(phone, `${seller.storeName}: ${data.message}`))
      )
      sent = results.filter((r) => r.status === 'fulfilled').length
    }

    return NextResponse.json({ success: true, sent })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error('Marketing send error:', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
