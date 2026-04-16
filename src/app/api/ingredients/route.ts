import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { IngredientItem } from '@/app/api/menu-items/[id]/ingredients/route'

export interface GroceryIngredient {
  name: string
  amount: number
  unit: string
  category: string
}

export interface DishEntry {
  id: number
  name: string
  dayOfWeek: string
  date: string
  servings: number
  ingredients: IngredientItem[]
  hasIngredients: boolean
}

export interface GroceryListResponse {
  weeklyMenuId: string
  dishes: DishEntry[]
  aggregated: GroceryIngredient[]
}

function aggregateIngredients(dishes: DishEntry[]): GroceryIngredient[] {
  const map = new Map<string, GroceryIngredient>()

  for (const dish of dishes) {
    if (!dish.ingredients?.length) continue
    const scale = dish.servings
    for (const ing of dish.ingredients) {
      const key = `${ing.name.toLowerCase()}__${ing.unit}`
      const existing = map.get(key)
      if (existing) {
        existing.amount = Math.round((existing.amount + ing.amount * scale) * 100) / 100
      } else {
        map.set(key, {
          name: ing.name,
          amount: Math.round(ing.amount * scale * 100) / 100,
          unit: ing.unit,
          category: ing.category,
        })
      }
    }
  }

  const categoryOrder = ['produce', 'protein', 'dairy', 'grains', 'spices', 'pantry', 'other']
  return Array.from(map.values()).sort(
    (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
  )
}

// GET /api/ingredients?weeklyMenuId=xxx
// Returns full structured grocery list data for client-side filtering
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const weeklyMenuId = searchParams.get('weeklyMenuId')
  if (!weeklyMenuId) return NextResponse.json({ error: 'weeklyMenuId required' }, { status: 400 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not a seller' }, { status: 403 })

  const menu = await prisma.weeklyMenu.findUnique({
    where: { id: weeklyMenuId, sellerId: seller.id },
    include: {
      days: {
        orderBy: { date: 'asc' },
        include: {
          menuItems: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  ingredients: true,
                  ingredientsUpdatedAt: true,
                },
              },
            },
          },
          comboItems: {
            include: {
              comboItem: {
                include: {
                  menuItems: {
                    include: {
                      menuItem: {
                        select: {
                          id: true,
                          name: true,
                          ingredients: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

  // Build dish entries — one entry per unique dish per day
  const dishes: DishEntry[] = []
  const seen = new Set<string>() // deduplicate dish+day

  for (const day of menu.days) {
    for (const dayItem of day.menuItems) {
      const key = `${day.id}_${dayItem.menuItem.id}`
      if (seen.has(key)) continue
      seen.add(key)

      dishes.push({
        id: dayItem.menuItem.id,
        name: dayItem.menuItem.name,
        dayOfWeek: day.dayOfWeek,
        date: day.date.toISOString(),
        servings: dayItem.quantity,
        ingredients: (dayItem.menuItem.ingredients as unknown as IngredientItem[]) ?? [],
        hasIngredients: !!(dayItem.menuItem.ingredients && (dayItem.menuItem.ingredients as unknown as IngredientItem[]).length > 0),
      })
    }

    for (const dayCombo of day.comboItems) {
      for (const cmi of dayCombo.comboItem.menuItems) {
        const key = `${day.id}_${cmi.menuItem.id}`
        if (seen.has(key)) continue
        seen.add(key)

        dishes.push({
          id: cmi.menuItem.id,
          name: cmi.menuItem.name,
          dayOfWeek: day.dayOfWeek,
          date: day.date.toISOString(),
          servings: dayCombo.quantity * cmi.quantity,
          ingredients: (cmi.menuItem.ingredients as unknown as IngredientItem[]) ?? [],
          hasIngredients: !!(cmi.menuItem.ingredients && (cmi.menuItem.ingredients as unknown as IngredientItem[]).length > 0),
        })
      }
    }
  }

  const aggregated = aggregateIngredients(dishes)

  return NextResponse.json({ weeklyMenuId, dishes, aggregated } satisfies GroceryListResponse)
}

// POST kept for backwards compat — now delegates to GET logic and also saves legacy format
export async function POST(req: NextRequest) {
  const { weeklyMenuId } = await req.json()
  const url = new URL(req.url)
  url.searchParams.set('weeklyMenuId', weeklyMenuId)
  return GET(new NextRequest(url.toString(), { headers: req.headers }))
}
