'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChefHat, ExternalLink, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SellerMatch {
  sellerId: string
  storeName: string
  storeSlug: string
  cuisineType: string | null
  menuItemName: string
  price: number
  salePrice: number | null
}

interface DishMatch {
  dishName: string
  matches: SellerMatch[]
}

interface Props {
  dishNames: string[]
  className?: string
}

export function InspiredBy({ dishNames, className }: Props) {
  const [results, setResults] = useState<DishMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (dishNames.length === 0) return
    setLoading(true)
    fetch(`/api/planner/inspired-by?names=${encodeURIComponent(dishNames.join(','))}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.matches ?? [])
        setLoaded(true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dishNames.join(',')])

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-400 ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Finding local chefs…
      </div>
    )
  }

  if (!loaded || results.length === 0) return null

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <ChefHat className="w-4 h-4 text-[#c1622d]" />
        <h3 className="text-sm font-semibold text-gray-700">Order from local chefs</h3>
      </div>
      <div className="space-y-3">
        {results.map(({ dishName, matches }) => (
          <div key={dishName}>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">{dishName}</p>
            <div className="space-y-1.5">
              {matches.map((m) => (
                <Link
                  key={`${m.storeSlug}-${m.menuItemName}`}
                  href={`/s/${m.storeSlug}`}
                  className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-100 hover:border-[#c1622d] hover:shadow-sm transition-all group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.storeName}</p>
                    <p className="text-xs text-gray-500 truncate">{m.menuItemName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {m.cuisineType && (
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                        {m.cuisineType}
                      </Badge>
                    )}
                    <span className="text-sm font-semibold text-gray-900">
                      ${(m.salePrice ?? m.price).toFixed(2)}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#c1622d]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
