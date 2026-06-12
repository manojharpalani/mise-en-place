import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAnthropic } from '@/lib/anthropic'

export interface IngredientItem {
  name: string
  amount: number
  unit: string
  category: 'produce' | 'protein' | 'dairy' | 'grains' | 'spices' | 'pantry' | 'other'
}

// POST /api/menu-items/[id]/ingredients — generate (or regenerate) via AI
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const itemId = parseInt(id)
  if (isNaN(itemId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not a seller' }, { status: 403 })

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId, sellerId: seller.id },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const prompt = `You are a culinary assistant. For the dish "${item.name}"${item.description ? ` (${item.description})` : ''}, list the ingredients needed to prepare a standard recipe serving 1 person.

Return ONLY a JSON array with this exact structure, no explanation:
[{"name":"ingredient name","amount":0.5,"unit":"cup","category":"grains"}]

Categories must be one of: produce, protein, dairy, grains, spices, pantry, other.
Units should be practical cooking units (cup, tbsp, tsp, oz, lb, g, ml, piece, clove, bunch, etc.).
List 5-12 ingredients. Be specific (e.g. "basmati rice" not "rice").`

  try {
    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: 'claude-fable-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    const ingredients: IngredientItem[] = JSON.parse(jsonMatch[0])

    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: { ingredients: ingredients as unknown as import('@prisma/client').Prisma.InputJsonValue, ingredientsUpdatedAt: new Date() },
    })

    return NextResponse.json({ ingredients, updatedAt: updated.ingredientsUpdatedAt })
  } catch (err) {
    console.error('Ingredient generation error:', err)
    return NextResponse.json({ error: 'Failed to generate ingredients' }, { status: 500 })
  }
}

// GET /api/menu-items/[id]/ingredients — return stored ingredients
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const itemId = parseInt(id)
  if (isNaN(itemId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not a seller' }, { status: 403 })

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId, sellerId: seller.id },
    select: { id: true, name: true, ingredients: true, ingredientsUpdatedAt: true },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ingredients: item.ingredients ?? [],
    updatedAt: item.ingredientsUpdatedAt,
  })
}
