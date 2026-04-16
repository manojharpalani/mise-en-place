import { NextRequest, NextResponse } from 'next/server'

interface MealDbMeal {
  idMeal: string
  strMeal: string
  strInstructions: string
  strMealThumb: string
  strArea?: string
  strCategory?: string
  strTags?: string
}

interface MealDbResponse {
  meals: MealDbMeal[] | null
}

// Truncate instructions to a clean 1-2 sentence description
function toDescription(instructions: string): string {
  const clean = instructions.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim()
  const sentences = clean.match(/[^.!?]*[.!?]/g) || []
  const first2 = sentences.slice(0, 2).join(' ').trim()
  if (first2.length > 20) return first2
  return clean.slice(0, 160).trim() + (clean.length > 160 ? '...' : '')
}

async function searchMealDb(query: string): Promise<{ description: string; thumbnailUrl: string } | null> {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data: MealDbResponse = await res.json()
    if (!data.meals?.length) return null
    const meal = data.meals[0]
    return {
      description: toDescription(meal.strInstructions),
      thumbnailUrl: meal.strMealThumb + '/preview',
    }
  } catch {
    return null
  }
}

async function searchByArea(cuisine: string): Promise<{ description: string; thumbnailUrl: string } | null> {
  // Map free-form cuisine type to TheMealDB area name
  const AREA_MAP: Record<string, string> = {
    indian: 'Indian',
    mexican: 'Mexican',
    italian: 'Italian',
    chinese: 'Chinese',
    japanese: 'Japanese',
    thai: 'Thai',
    french: 'French',
    greek: 'Greek',
    moroccan: 'Moroccan',
    spanish: 'Spanish',
    american: 'American',
    british: 'British',
    canadian: 'Canadian',
    vietnamese: 'Vietnamese',
    turkish: 'Turkish',
    russian: 'Russian',
    polish: 'Polish',
    dutch: 'Dutch',
    croatian: 'Croatian',
    egyptian: 'Egyptian',
    filipino: 'Filipino',
    jamaican: 'Jamaican',
    malaysian: 'Malaysian',
    portuguese: 'Portuguese',
    tunisian: 'Tunisian',
    ukrainian: 'Ukrainian',
  }
  const key = Object.keys(AREA_MAP).find(k => cuisine.toLowerCase().includes(k))
  if (!key) return null
  const area = AREA_MAP[key]
  const url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(area)}`
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.meals?.length) return null
    // Pick a random meal from the area
    const meal = data.meals[Math.floor(Math.random() * Math.min(data.meals.length, 10))]
    return {
      description: `A traditional ${area} dish.`,
      thumbnailUrl: meal.strMealThumb + '/preview',
    }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')?.trim()
  const cuisine = searchParams.get('cuisine')?.trim() || ''

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Name too short' }, { status: 400 })
  }

  // 1. Try exact name search
  let result = await searchMealDb(name)

  // 2. Try first word of the name (e.g. "Biryani" from "Chicken Biryani")
  if (!result) {
    const words = name.split(/\s+/)
    for (const word of words.reverse()) {
      if (word.length >= 4) {
        result = await searchMealDb(word)
        if (result) break
      }
    }
  }

  // 3. Fall back to a random dish from the cuisine area
  if (!result && cuisine) {
    result = await searchByArea(cuisine)
  }

  if (!result) {
    return NextResponse.json({ description: null, thumbnailUrl: null })
  }

  return NextResponse.json(result)
}
