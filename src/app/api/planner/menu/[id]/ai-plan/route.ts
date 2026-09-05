import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAnthropic } from '@/lib/anthropic'
import { subWeeks } from 'date-fns'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type AllowedMime = (typeof ALLOWED_MIME)[number]

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planner = await prisma.plannerProfile.findUnique({ where: { userId: session.user.id } })
  if (!planner) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const menu = await prisma.plannerWeeklyMenu.findFirst({
    where: { id, plannerId: planner.id },
    include: {
      days: {
        include: { menuItems: { include: { menuItem: true } } },
        orderBy: { date: 'asc' },
      },
    },
  })
  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

  const { prompt, itemsPerDay = 2, imageBase64, imageMimeType } = await req.json()

  const existingItems = await prisma.plannerMenuItem.findMany({
    where: { plannerId: planner.id, isActive: true },
    select: { id: true, name: true, description: true },
  })

  const fourWeeksAgo = subWeeks(new Date(), 4)
  const pastMenus = await prisma.plannerWeeklyMenu.findMany({
    where: { plannerId: planner.id, weekStartDate: { gte: fourWeeksAgo }, id: { not: id } },
    include: {
      days: { include: { menuItems: { include: { menuItem: { select: { name: true } } } } } },
    },
    orderBy: { weekStartDate: 'desc' },
  })

  const recentlyUsed = new Set<string>()
  pastMenus.forEach((pm) => pm.days.forEach((d) => d.menuItems.forEach((mi) => recentlyUsed.add(mi.menuItem.name))))

  const dayLabels = menu.days.map((d) => {
    const dt = new Date(d.date)
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dt.getUTCDay()]
  })

  const catalogLines = existingItems.map((i) => `existing:${i.id} — ${i.name}${i.description ? ` (${i.description})` : ''}`).join('\n')
  const recentList = recentlyUsed.size > 0 ? [...recentlyUsed].join(', ') : 'none'
  const prefLine = planner.cuisinePrefs.length > 0 ? `Cuisine preferences: ${planner.cuisinePrefs.join(', ')}` : ''

  const systemPrompt = `You are a meal planning assistant for a home cook. Plan a practical weekly meal plan.
Return ONLY valid JSON. No markdown fences, no explanation.`

  const userText = `Plan a weekly meal plan for the following days: ${dayLabels.join(', ')}.

${prefLine}
Items per day: ${itemsPerDay}
Household size: ${planner.householdSize} people
${prompt ? `Special request: ${prompt}` : ''}

Existing dish library (prefer to reuse):
${catalogLines || 'None yet'}

Recently made (try to vary):
${recentList}

Return this JSON shape:
{
  "days": [
    {
      "dayOfWeek": "Monday",
      "items": [
        { "ref": "existing:42" },
        { "ref": "new:temp1", "name": "Lemon Pasta", "description": "Light lemon garlic pasta" }
      ]
    }
  ]
}

Rules:
- Use existing:ID refs when reusing library dishes
- Use new:tempN refs for new dishes (give a name and short description)
- Cover all days: ${dayLabels.join(', ')}
- Vary dishes from what was recently made`

  const resolvedMime: AllowedMime = ALLOWED_MIME.includes(imageMimeType as AllowedMime)
    ? (imageMimeType as AllowedMime)
    : 'image/jpeg'

  const userContent: Parameters<ReturnType<typeof getAnthropic>['messages']['create']>[0]['messages'][0]['content'] =
    imageBase64
      ? [
          { type: 'image', source: { type: 'base64', media_type: resolvedMime, data: imageBase64 } },
          { type: 'text', text: userText + '\n\nNote: A reference image has been provided — use it for inspiration.' },
        ]
      : userText

  try {
    const anthropic = getAnthropic()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let aiPlan: { days: { dayOfWeek: string; items: { ref: string; name?: string; description?: string }[] }[] }
    try {
      aiPlan = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Could not parse AI response')
      aiPlan = JSON.parse(match[0])
    }

    // Build name→id map for existing items
    const itemNameToId = new Map<string, number>()
    existingItems.forEach((i) => itemNameToId.set(i.name.toLowerCase().trim(), i.id))

    const tempToId = new Map<string, number>()
    let newItemsCreated = 0

    const getOrCreateItem = async (ref: string, name?: string, description?: string): Promise<number | null> => {
      if (ref.startsWith('existing:')) {
        const id = parseInt(ref.replace('existing:', ''))
        const valid = existingItems.find((i) => i.id === id)
        return valid ? id : null
      }
      if (ref.startsWith('new:')) {
        if (tempToId.has(ref)) return tempToId.get(ref)!
        if (!name) return null
        const key = name.toLowerCase().trim()
        if (itemNameToId.has(key)) {
          tempToId.set(ref, itemNameToId.get(key)!)
          return itemNameToId.get(key)!
        }
        const created = await prisma.plannerMenuItem.create({
          data: {
            plannerId: planner.id,
            name,
            description: description ?? null,
            cuisineTags: [],
            dietaryTags: [],
          },
        })
        itemNameToId.set(key, created.id)
        tempToId.set(ref, created.id)
        newItemsCreated++
        return created.id
      }
      return null
    }

    let daysPlanned = 0
    for (const dayPlan of aiPlan.days ?? []) {
      const day = menu.days.find((d) => {
        const dt = new Date(d.date)
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dt.getUTCDay()] === dayPlan.dayOfWeek
      })
      if (!day) continue

      const alreadyAdded = new Set(day.menuItems.map((di) => di.menuItem.id))
      let addedToDay = false

      for (const item of dayPlan.items ?? []) {
        const itemId = await getOrCreateItem(item.ref, item.name, item.description)
        if (!itemId || alreadyAdded.has(itemId)) continue
        await prisma.plannerWeeklyMenuDayItem.create({
          data: { weeklyMenuDayId: day.id, menuItemId: itemId, servings: planner.householdSize },
        })
        alreadyAdded.add(itemId)
        addedToDay = true
      }

      if (addedToDay) daysPlanned++
    }

    const updated = await prisma.plannerWeeklyMenu.findUnique({
      where: { id },
      include: {
        days: {
          include: { menuItems: { include: { menuItem: true } } },
          orderBy: { date: 'asc' },
        },
      },
    })

    return NextResponse.json({ menu: updated, summary: { newItemsCreated, daysPlanned } })
  } catch (err) {
    console.error('Planner AI plan error:', err)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
