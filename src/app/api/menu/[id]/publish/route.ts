import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage, sendWhatsAppTemplate } from '@/lib/whatsapp'
import { format } from 'date-fns'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const menu = await prisma.weeklyMenu.findUnique({
    where: { id, sellerId: seller.id },
    include: {
      days: {
        include: {
          menuItems: { include: { menuItem: true } },
          comboItems: { include: { comboItem: true } },
        },
        orderBy: { date: 'asc' },
      },
    },
  })
  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

  await prisma.weeklyMenu.update({ where: { id }, data: { status: 'PUBLISHED' } })

  // Build WhatsApp message
  const weekLabel = `Week of ${format(new Date(menu.weekStartDate), 'MMMM d, yyyy')}`
  let message = `🍽️ *${seller.storeName} — Weekly Menu*\n📅 ${weekLabel}\n\n`

  for (const day of menu.days) {
    const hasItems = day.menuItems.length > 0 || day.comboItems.length > 0
    if (!hasItems) continue
    message += `*${day.dayOfWeek}*\n`
    for (const { menuItem } of day.menuItems) {
      const priceStr = menuItem.salePrice
        ? `$${menuItem.salePrice.toFixed(2)} ~~was $${menuItem.price.toFixed(2)}~~`
        : `$${menuItem.price.toFixed(2)}`
      message += `• ${menuItem.name} — ${priceStr}\n`
    }
    for (const { comboItem } of day.comboItems) {
      message += `• ${comboItem.name} (Combo) — $${comboItem.comboPrice.toFixed(2)}\n`
    }
    message += '\n'
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const storeUrl = `${appUrl}/s/${seller.storeSlug}`
  message += `Order here: ${storeUrl}`

  const subscribers = await prisma.subscriber.findMany({
    where: { sellerId: seller.id, status: 'ACTIVE', channels: { has: 'whatsapp' } },
  })

  const waOpts = { phoneNumberId: seller.waPhoneNumberId, accessToken: seller.waAccessToken }

  const results = await Promise.allSettled(
    subscribers.filter(s => s.phone).map(s => {
      if (seller.waMenuTemplate) {
        // Use approved template: {{1}} = store name, {{2}} = week label, {{3}} = store URL
        return sendWhatsAppTemplate(
          s.phone!,
          seller.waMenuTemplate,
          [seller.storeName, weekLabel, storeUrl],
          { ...waOpts, language: seller.waTemplateLanguage || 'en_US' }
        )
      }
      return sendWhatsAppMessage(s.phone!, message, waOpts)
    })
  )

  return NextResponse.json({ success: true, whatsappSent: results.filter(r => r.status === 'fulfilled').length })
}
