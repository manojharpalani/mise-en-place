import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAnthropic } from '@/lib/anthropic'
import { subWeeks } from 'date-fns'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify menu belongs to seller
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

  const { prompt, itemsPerDay = 2, includeCombo = false, comboSize = 2, imageBase64, imageMimeType } = await req.json()

  // Fetch existing catalog
  const existingItems = await prisma.menuItem.findMany({
    where: { sellerId: seller.id, isActive: true },
    select: { id: true, name: true, description: true, price: true, dietaryTags: true },
  })

  const existingCombos = await prisma.comboItem.findMany({
    where: { sellerId: seller.id, isActive: true },
    select: { id: true, name: true, comboPrice: true },
  })

  // Fetch previous 4 weeks of menus to check for variety
  const fourWeeksAgo = subWeeks(new Date(), 4)
  const pastMenus = await prisma.weeklyMenu.findMany({
    where: {
      sellerId: seller.id,
      weekStartDate: { gte: fourWeeksAgo },
      id: { not: id }, // exclude current
    },
    include: {
      days: {
        include: {
          menuItems: { include: { menuItem: { select: { name: true } } } },
          comboItems: { include: { comboItem: { select: { name: true } } } },
        },
      },
    },
    orderBy: { weekStartDate: 'desc' },
  })

  // Summarize what was on recent menus
  const recentlyUsed = new Set<string>()
  pastMenus.forEach(pm => {
    pm.days.forEach(d => {
      d.menuItems.forEach(mi => recentlyUsed.add(mi.menuItem.name))
      d.comboItems.forEach(ci => recentlyUsed.add(ci.comboItem.name))
    })
  })

  // Summarize current days for context
  const dayLabels = menu.days.map(d => {
    const dt = new Date(d.date)
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dt.getUTCDay()]
    return dayName
  })

  const systemPrompt = `You are a meal planning assistant for a home chef marketplace.
Return ONLY valid JSON. No markdown, no explanation, no code fences.`

  const userPrompt = `Plan a weekly menu for a ${seller.cuisineType || 'home cook'} chef named "${seller.storeName}".

Days to plan: ${dayLabels.join(', ')}
Items per day: ${itemsPerDay}
Include combo meals: ${includeCombo ? `Yes — each combo should bundle ${comboSize} items` : 'No'}

Existing menu items in their catalog:
${existingItems.length > 0
  ? existingItems.map(i => `- ID:${i.id} "${i.name}" $${i.price.toFixed(2)}${i.dietaryTags?.length ? ` [${i.dietaryTags.join(', ')}]` : ''}`).join('\n')
  : '(none yet)'}

Existing combo meals:
${existingCombos.length > 0
  ? existingCombos.map(c => `- ID:${c.id} "${c.name}" $${c.comboPrice.toFixed(2)}`).join('\n')
  : '(none yet)'}

Items served in the last 4 weeks (try to vary these):
${recentlyUsed.size > 0 ? [...recentlyUsed].join(', ') : '(none)'}

${prompt ? `Seller's inspiration / special requests: ${prompt}` : ''}

Rules:
1. Prefer using EXISTING items (by ID) when suitable. Only suggest new items when the catalog is insufficient or the request calls for something new.
2. New items must be authentic to the cuisine type.
3. For combos: bundle ${comboSize} individual menu items together (use existing item IDs or reference new item names).
4. Try to vary items across days — don't repeat the same dish on multiple days.
5. Avoid items that appear frequently in the last 4 weeks unless unavoidable.

Return JSON with this exact shape:
{
  "newMenuItems": [
    { "tempId": "tmp_1", "name": "...", "description": "...", "price": 0.00, "dietaryTags": [] }
  ],
  "newCombos": [
    {
      "name": "...",
      "description": "...",
      "comboPrice": 0.00,
      "components": [
        { "itemRef": "existing:123" },
        { "itemRef": "new:tmp_1" }
      ]
    }
  ],
  "days": [
    {
      "dayOfWeek": "Monday",
      "menuItemRefs": ["existing:123", "new:tmp_1"],
      "comboRefs": ["combo:Biryani Combo"]
    }
  ]
}

Notes:
- "existing:ID" references an existing menu item by its numeric ID
- "new:tempId" references a new item you are creating
- "combo:Name" references a combo by its name (existing or new)
- Keep prices realistic for homemade food ($8–$25 per item, combos 10–15% cheaper than sum)
- Only include "newMenuItems" and "newCombos" keys if there are new items/combos to create`

  try {
    const anthropic = getAnthropic()

    // Build message content — include image if provided
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
    type AllowedMime = typeof ALLOWED_MIME[number]

    const userContent: Array<{ type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: AllowedMime; data: string } }> = []

    const resolvedMime: AllowedMime = ALLOWED_MIME.includes(imageMimeType as AllowedMime)
      ? (imageMimeType as AllowedMime)
      : 'image/jpeg'

    if (imageBase64 && imageMimeType) {
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: resolvedMime, data: imageBase64 },
      })
      userContent.push({
        type: 'text',
        text: `The image above is provided as inspiration for the menu plan (it could be a handwritten menu, food photos, or a reference image). Use it to inform dish names, styles, or themes where relevant.\n\n${userPrompt}`,
      })
    } else {
      userContent.push({ type: 'text', text: userPrompt })
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let plan: {
      newMenuItems?: Array<{ tempId: string; name: string; description?: string; price: number; dietaryTags?: string[] }>
      newCombos?: Array<{ name: string; description?: string; comboPrice: number; components: Array<{ itemRef: string }> }>
      days: Array<{ dayOfWeek: string; menuItemRefs?: string[]; comboRefs?: string[] }>
    }

    try {
      plan = JSON.parse(text)
    } catch {
      // Try to extract JSON from response if it has extra text
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Invalid AI response format')
      plan = JSON.parse(match[0])
    }

    // --- Apply the plan to the database ---

    // 1. Create new menu items and build a tempId → real ID map
    const tempIdToRealId = new Map<string, number>()
    if (plan.newMenuItems?.length) {
      for (const item of plan.newMenuItems) {
        const created = await prisma.menuItem.create({
          data: {
            sellerId: seller.id,
            name: item.name,
            description: item.description || null,
            price: item.price,
            dietaryTags: item.dietaryTags || [],
            allergenTags: [],
            cuisineTags: [],
            availableQuantity: 100,
            isActive: true,
          },
        })
        tempIdToRealId.set(item.tempId, created.id)
      }
    }

    // Helper: resolve a ref to a menu item ID
    const resolveItemRef = (ref: string): number | null => {
      if (ref.startsWith('existing:')) {
        return parseInt(ref.split(':')[1], 10)
      }
      if (ref.startsWith('new:')) {
        return tempIdToRealId.get(ref.split(':')[1]) ?? null
      }
      return null
    }

    // 2. Create new combos and build a name → real combo ID map
    const comboNameToId = new Map<string, string>()
    // Seed existing combos
    existingCombos.forEach(c => comboNameToId.set(c.name, c.id))

    if (plan.newCombos?.length) {
      for (const combo of plan.newCombos) {
        const components = combo.components
          .map(c => resolveItemRef(c.itemRef))
          .filter((id): id is number => id !== null)

        if (components.length < 2) continue // Skip invalid combos

        const created = await prisma.comboItem.create({
          data: {
            sellerId: seller.id,
            name: combo.name,
            description: combo.description || null,
            comboPrice: combo.comboPrice,
            isActive: true,
            menuItems: {
              create: components.map(menuItemId => ({ menuItemId, quantity: 1 })),
            },
          },
        })
        comboNameToId.set(combo.name, created.id)
      }
    }

    // 3. Add items to each day
    for (const dayPlan of plan.days) {
      const day = menu.days.find(d => {
        const dt = new Date(d.date)
        const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dt.getUTCDay()]
        return dayName === dayPlan.dayOfWeek
      })
      if (!day?.id) continue

      // Add menu items (skip if already present)
      for (const ref of dayPlan.menuItemRefs ?? []) {
        const itemId = resolveItemRef(ref)
        if (!itemId) continue
        const alreadyPresent = day.menuItems.some(mi => mi.menuItem.id === itemId)
        if (alreadyPresent) continue
        await prisma.weeklyMenuDayItem.create({
          data: { weeklyMenuDayId: day.id, menuItemId: itemId, quantity: 10 },
        })
      }

      // Add combos (skip if already present)
      for (const comboRef of dayPlan.comboRefs ?? []) {
        const comboName = comboRef.replace(/^combo:/, '')
        const comboId = comboNameToId.get(comboName)
        if (!comboId) continue
        const alreadyPresent = day.comboItems.some(ci => ci.comboItem.id === comboId)
        if (alreadyPresent) continue
        await prisma.weeklyMenuDayComboItem.create({
          data: { weeklyMenuDayId: day.id, comboItemId: comboId, quantity: 10 },
        })
      }
    }

    // 4. Return the updated menu
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

    const newItemCount = tempIdToRealId.size
    const newComboCount = plan.newCombos?.length ?? 0

    return NextResponse.json({
      menu: updatedMenu,
      summary: {
        newItemsCreated: newItemCount,
        newCombosCreated: newComboCount,
        daysPlanned: plan.days.length,
      },
    })
  } catch (err) {
    console.error('AI plan error:', err)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
