import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/planner/inspired-by?names=Chicken+Biryani,Masala+Dosa&lat=37.3&lng=-121.9
// Returns local seller menu items that fuzzy-match the given dish names
export async function GET(req: NextRequest) {
  const session = await auth().catch(() => null)
  const { searchParams } = new URL(req.url)
  const namesParam = searchParams.get('names')
  const lat = parseFloat(searchParams.get('lat') ?? 'NaN')
  const lng = parseFloat(searchParams.get('lng') ?? 'NaN')

  if (!namesParam) return NextResponse.json({ matches: [] })

  const dishNames = namesParam
    .split(',')
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean)

  if (dishNames.length === 0) return NextResponse.json({ matches: [] })

  // Get active sellers with their menu items
  const sellers = await prisma.sellerProfile.findMany({
    where: { isActive: true },
    include: {
      user: { select: { locationLat: true, locationLng: true, neighborhood: true } },
      menuItems: {
        where: { isActive: true },
        select: { id: true, name: true, price: true, salePrice: true, photoUrl: true },
      },
    },
  })

  // For each dish name, find best matching seller items (substring or word match)
  interface MatchResult {
    dishName: string
    matches: {
      sellerId: string
      storeName: string
      storeSlug: string
      cuisineType: string | null
      menuItemId: number
      menuItemName: string
      price: number
      salePrice: number | null
      photoUrl: string | null
      score: number
    }[]
  }

  const results: MatchResult[] = []

  for (const dishName of dishNames) {
    const words = dishName.split(/\s+/).filter((w) => w.length > 2)
    const matches: MatchResult['matches'] = []

    for (const seller of sellers) {
      for (const item of seller.menuItems) {
        const itemNameLower = item.name.toLowerCase()
        let score = 0

        if (itemNameLower === dishName) {
          score = 100
        } else if (itemNameLower.includes(dishName) || dishName.includes(itemNameLower)) {
          score = 80
        } else {
          const wordMatches = words.filter((w) => itemNameLower.includes(w)).length
          score = (wordMatches / Math.max(words.length, 1)) * 60
        }

        if (score >= 40) {
          // Apply distance penalty if coordinates available
          const sellerLat = seller.user?.locationLat ?? null
          const sellerLng = seller.user?.locationLng ?? null
          if (!isNaN(lat) && !isNaN(lng) && sellerLat && sellerLng) {
            const dist = Math.sqrt((lat - sellerLat) ** 2 + (lng - sellerLng) ** 2)
            score = score / (1 + dist * 10) // penalise distance
          }
          matches.push({
            sellerId: seller.id,
            storeName: seller.storeName,
            storeSlug: seller.storeSlug,
            cuisineType: seller.cuisineType,
            menuItemId: item.id,
            menuItemName: item.name,
            price: item.price,
            salePrice: item.salePrice,
            photoUrl: item.photoUrl,
            score,
          })
        }
      }
    }

    matches.sort((a, b) => b.score - a.score)
    if (matches.length > 0) {
      results.push({ dishName, matches: matches.slice(0, 3) })
    }
  }

  return NextResponse.json({ matches: results })
}
