import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { IngredientItem } from '@/app/api/menu-items/[id]/ingredients/route'

interface GroceryIngredient {
  name: string
  amount: number
  unit: string
  category: string
}

interface DishEntry {
  id: number
  name: string
  dayOfWeek: string
  date: string
  servings: number
  ingredients: IngredientItem[]
  hasIngredients: boolean
}

function aggregateIngredients(dishes: DishEntry[]): GroceryIngredient[] {
  const map = new Map<string, GroceryIngredient>()
  for (const dish of dishes) {
    if (!dish.ingredients?.length) continue
    for (const ing of dish.ingredients) {
      const key = `${ing.name.toLowerCase()}__${ing.unit}`
      const ex = map.get(key)
      if (ex) {
        ex.amount = Math.round((ex.amount + ing.amount * dish.servings) * 100) / 100
      } else {
        map.set(key, {
          name: ing.name,
          amount: Math.round(ing.amount * dish.servings * 100) / 100,
          unit: ing.unit,
          category: ing.category,
        })
      }
    }
  }
  const order = ['produce', 'protein', 'dairy', 'grains', 'spices', 'pantry', 'other']
  return Array.from(map.values()).sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
}

// GET /api/planner/ingredients?weeklyMenuId=xxx
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weeklyMenuId = new URL(req.url).searchParams.get('weeklyMenuId')
  if (!weeklyMenuId) return NextResponse.json({ error: 'weeklyMenuId required' }, { status: 400 })

  const planner = await prisma.plannerProfile.findUnique({ where: { userId: session.user.id } })
  if (!planner) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const menu = await prisma.plannerWeeklyMenu.findFirst({
    where: { id: weeklyMenuId, plannerId: planner.id },
    include: {
      days: {
        orderBy: { date: 'asc' },
        include: {
          menuItems: {
            include: {
              menuItem: {
                select: { id: true, name: true, ingredients: true },
              },
            },
          },
        },
      },
    },
  })
  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

  const dishes: DishEntry[] = []
  const seen = new Set<string>()
  const UTC_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  for (const day of menu.days) {
    const dayName = UTC_DAYS[new Date(day.date).getUTCDay()] ?? day.dayOfWeek
    for (const di of day.menuItems) {
      const key = `${day.id}_${di.menuItem.id}`
      if (seen.has(key)) continue
      seen.add(key)
      dishes.push({
        id: di.menuItem.id,
        name: di.menuItem.name,
        dayOfWeek: dayName,
        date: day.date.toISOString(),
        servings: di.servings,
        ingredients: (di.menuItem.ingredients as unknown as IngredientItem[]) ?? [],
        hasIngredients: !!(di.menuItem.ingredients && (di.menuItem.ingredients as unknown as IngredientItem[]).length > 0),
      })
    }
  }

  const aggregated = aggregateIngredients(dishes)
  return NextResponse.json({ weeklyMenuId, dishes, aggregated, householdSize: planner.householdSize })
}
