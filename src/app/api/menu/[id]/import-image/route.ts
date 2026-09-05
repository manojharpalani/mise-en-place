import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAnthropic } from '@/lib/anthropic'

export interface ExtractedItem {
  name: string
  description?: string
  estimatedPrice?: number
  isCombo: boolean
  comboComponents?: string[] // names of component dishes for combos
}

export interface ExtractedDay {
  dayOfWeek: string
  items: ExtractedItem[]
}

export interface ExtractedPlan {
  days: ExtractedDay[]
  notes?: string
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type AllowedMime = typeof ALLOWED_MIME[number]

// POST /api/menu/[id]/import-image  { action: 'analyze', imageBase64, imageMimeType }
// POST /api/menu/[id]/import-image  { action: 'apply', plan: ExtractedPlan }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const body = await req.json()
  const { action } = body

  // ─── ANALYZE ─────────────────────────────────────────────────────────────
  if (action === 'analyze') {
    const { imageBase64, imageMimeType } = body
    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const mimeType: AllowedMime = ALLOWED_MIME.includes(imageMimeType as AllowedMime)
      ? (imageMimeType as AllowedMime)
      : 'image/jpeg'

    const dayLabels = menu.days.map(d => {
      const dt = new Date(d.date)
      return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dt.getUTCDay()]
    })

    const systemPrompt = `You are a menu parsing assistant. Analyze images of weekly menus (handwritten, printed, whiteboard, photos) and extract the structured plan.
Return ONLY valid JSON. No markdown, no explanation, no code fences.`

    const userPrompt = `Extract the weekly menu plan from this image.

The menu covers these days: ${dayLabels.join(', ')}

For each day, extract:
- Every dish or meal listed
- Estimated price if visible (leave out if not visible)
- Whether it is a combo/bundle deal (multiple items grouped together)
- If it's a combo, list the component dish names

Return this exact JSON shape:
{
  "days": [
    {
      "dayOfWeek": "Monday",
      "items": [
        {
          "name": "Chicken Biryani",
          "description": "Fragrant basmati rice with tender chicken",
          "estimatedPrice": 15,
          "isCombo": false
        },
        {
          "name": "Biryani Combo",
          "description": "Biryani with raita and dessert",
          "estimatedPrice": 22,
          "isCombo": true,
          "comboComponents": ["Chicken Biryani", "Raita", "Kheer"]
        }
      ]
    }
  ],
  "notes": "any general notes or caveats about the extraction"
}

Rules:
- Only include days that have visible items in the image
- If a day is not visible or has no items, omit it entirely
- Use the exact day names from: ${dayLabels.join(', ')}
- estimatedPrice should be a number (no currency symbol)
- If you cannot read the price, omit estimatedPrice
- Keep descriptions concise (1 sentence)
- For combos: comboComponents lists the individual dish names that make up the combo`

    try {
      const anthropic = getAnthropic()
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: userPrompt },
          ],
        }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      let plan: ExtractedPlan
      try {
        plan = JSON.parse(text)
      } catch {
        const match = text.match(/\{[\s\S]*\}/)
        if (!match) throw new Error('Could not parse AI response')
        plan = JSON.parse(match[0])
      }

      // Normalise: ensure days only contains valid day names
      const validDays = new Set(dayLabels)
      plan.days = (plan.days ?? []).filter(d => validDays.has(d.dayOfWeek))

      return NextResponse.json({ plan })
    } catch (err) {
      console.error('Import analyze error:', err)
      return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 })
    }
  }

  // ─── APPLY ────────────────────────────────────────────────────────────────
  if (action === 'apply') {
    const { plan } = body as { plan: ExtractedPlan }
    if (!plan?.days?.length) return NextResponse.json({ error: 'No plan provided' }, { status: 400 })

    // Load existing items for fuzzy name matching
    const existingItems = await prisma.menuItem.findMany({
      where: { sellerId: seller.id, isActive: true },
      select: { id: true, name: true },
    })
    const existingCombos = await prisma.comboItem.findMany({
      where: { sellerId: seller.id, isActive: true },
      select: { id: true, name: true },
    })

    const normalize = (s: string) => s.toLowerCase().trim()

    // name → id caches (built up as we create new items)
    const itemNameToId = new Map<string, number>()
    existingItems.forEach(i => itemNameToId.set(normalize(i.name), i.id))
    const comboNameToId = new Map<string, string>()
    existingCombos.forEach(c => comboNameToId.set(normalize(c.name), c.id))

    const getOrCreateItem = async (item: ExtractedItem): Promise<number> => {
      const key = normalize(item.name)
      if (itemNameToId.has(key)) return itemNameToId.get(key)!
      const created = await prisma.menuItem.create({
        data: {
          sellerId: seller.id,
          name: item.name,
          description: item.description ?? null,
          price: item.estimatedPrice ?? 12,
          dietaryTags: [],
          allergenTags: [],
          cuisineTags: [],
          availableQuantity: 100,
          isActive: true,
        },
      })
      itemNameToId.set(key, created.id)
      return created.id
    }

    const getOrCreateCombo = async (item: ExtractedItem): Promise<string> => {
      const key = normalize(item.name)
      if (comboNameToId.has(key)) return comboNameToId.get(key)!

      // Resolve component item IDs (create if needed)
      const componentIds: number[] = []
      for (const compName of item.comboComponents ?? []) {
        const compKey = normalize(compName)
        let compId = itemNameToId.get(compKey)
        if (!compId) {
          const created = await prisma.menuItem.create({
            data: {
              sellerId: seller.id,
              name: compName,
              price: 10,
              dietaryTags: [], allergenTags: [], cuisineTags: [],
              availableQuantity: 100, isActive: true,
            },
          })
          itemNameToId.set(compKey, created.id)
          compId = created.id
        }
        componentIds.push(compId)
      }

      // Need at least 2 components for a valid combo
      while (componentIds.length < 2) componentIds.push(componentIds[0] ?? 0)

      const created = await prisma.comboItem.create({
        data: {
          sellerId: seller.id,
          name: item.name,
          description: item.description ?? null,
          comboPrice: item.estimatedPrice ?? 18,
          isActive: true,
          menuItems: {
            create: componentIds.map(menuItemId => ({ menuItemId, quantity: 1 })),
          },
        },
      })
      comboNameToId.set(key, created.id)
      return created.id
    }

    let newItemCount = 0
    let newComboCount = 0

    for (const dayPlan of plan.days) {
      const day = menu.days.find(d => {
        const dt = new Date(d.date)
        return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dt.getUTCDay()] === dayPlan.dayOfWeek
      })
      if (!day?.id) continue

      for (const item of dayPlan.items) {
        if (item.isCombo) {
          const alreadyExisted = comboNameToId.has(normalize(item.name))
          const comboId = await getOrCreateCombo(item)
          if (!alreadyExisted) newComboCount++
          const alreadyAdded = day.comboItems.some(ci => ci.comboItem.id === comboId)
          if (!alreadyAdded) {
            await prisma.weeklyMenuDayComboItem.create({
              data: { weeklyMenuDayId: day.id, comboItemId: comboId, quantity: 10 },
            })
          }
        } else {
          const alreadyExisted = itemNameToId.has(normalize(item.name))
          const itemId = await getOrCreateItem(item)
          if (!alreadyExisted) newItemCount++
          const alreadyAdded = day.menuItems.some(mi => mi.menuItem.id === itemId)
          if (!alreadyAdded) {
            await prisma.weeklyMenuDayItem.create({
              data: { weeklyMenuDayId: day.id, menuItemId: itemId, quantity: 10 },
            })
          }
        }
      }
    }

    const updatedMenu = await prisma.weeklyMenu.findUnique({
      where: { id },
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

    // Return updated catalog too so planner state stays fresh
    const updatedItemCatalog = await prisma.menuItem.findMany({
      where: { sellerId: seller.id, isActive: true },
      select: { id: true, name: true, price: true, salePrice: true, photoUrl: true, dietaryTags: true, ingredients: true },
      orderBy: { name: 'asc' },
    })
    const updatedComboCatalog = await prisma.comboItem.findMany({
      where: { sellerId: seller.id, isActive: true },
      select: { id: true, name: true, comboPrice: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      menu: updatedMenu,
      updatedItemCatalog,
      updatedComboCatalog,
      summary: { newItemsCreated: newItemCount, newCombosCreated: newComboCount, daysImported: plan.days.length },
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
