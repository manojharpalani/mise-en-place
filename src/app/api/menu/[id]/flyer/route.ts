import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOpenAI } from '@/lib/openai'
import { format } from 'date-fns'
import { writeFile } from 'fs/promises'
import { join } from 'path'

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
      },
    },
  })
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const seen = new Set<string>()
  const dishNames: string[] = []
  for (const day of menu.days) {
    for (const { menuItem } of day.menuItems) {
      if (!seen.has(menuItem.name)) { seen.add(menuItem.name); dishNames.push(menuItem.name) }
    }
    for (const { comboItem } of day.comboItems) {
      if (!seen.has(comboItem.name)) { seen.add(comboItem.name); dishNames.push(comboItem.name) }
    }
  }

  const weekLabel = `Week of ${format(new Date(menu.weekStartDate), 'MMM d, yyyy')}`
  const dishes = dishNames.slice(0, 8).join(', ')

  try {
    const openai = getOpenAI()
    const prompt =
      `A lush, appetizing food illustration for a home kitchen weekly menu. ` +
      `Featured dishes: ${dishes}. ` +
      `Style: warm watercolor illustration, farmers market aesthetic, ` +
      `soft cream and terracotta color palette with rose accents. ` +
      `Show beautifully rendered food illustrations of the featured dishes arranged in an abundant, inviting composition. ` +
      `Decorative botanical elements — fresh herbs, vegetables, leaves — frame the scene. ` +
      `The mood is handcrafted, warm, and artisanal — like a lovingly made home kitchen. ` +
      `Purely illustration, no text, no words, no letters, no labels, no signs, no banners, no QR codes, no URLs, no prices.`

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) throw new Error('No image URL returned')

    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) throw new Error('Failed to download image')
    const buffer = Buffer.from(await imgRes.arrayBuffer())

    const filename = `${Date.now()}.png`
    await writeFile(join(process.cwd(), 'public', 'flyers', filename), buffer)
    const flyerImageUrl = `/flyers/${filename}`

    await prisma.weeklyMenu.update({ where: { id }, data: { flyerImageUrl } })

    return NextResponse.json({ flyerImageUrl })
  } catch (err) {
    console.error('[DALL-E] flyer generation failed:', err)
    return NextResponse.json({ error: 'Flyer generation failed' }, { status: 500 })
  }
}
