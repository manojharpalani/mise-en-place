import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendDailyMenu } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' })

  // Find all published menus with items for today
  const weeklyMenuDays = await prisma.weeklyMenuDay.findMany({
    where: {
      dayOfWeek,
      weeklyMenu: { status: 'PUBLISHED' },
      date: {
        gte: new Date(today.toDateString()),
        lt: new Date(new Date(today.toDateString()).getTime() + 86400000),
      },
    },
    include: {
      menuItems: { include: { menuItem: true } },
      comboItems: { include: { comboItem: true } },
      weeklyMenu: {
        include: {
          seller: {
            include: { subscribers: { where: { status: 'ACTIVE', channels: { has: 'whatsapp' } } } },
          },
        },
      },
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  let notified = 0

  for (const day of weeklyMenuDays) {
    const { seller } = day.weeklyMenu
    const items = day.menuItems.map((mi) => mi.menuItem)

    if (items.length === 0) continue

    const dayLabel = `${dayOfWeek}, ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
    const storefrontUrl = `${appUrl}/s/${seller.storeSlug}`

    for (const subscriber of seller.subscribers) {
      if (!subscriber.phone) continue
      await sendDailyMenu(subscriber.phone, seller.storeName, dayLabel, items, storefrontUrl)
      notified++
    }
  }

  return NextResponse.json({ success: true, notified, date: today.toISOString() })
}
