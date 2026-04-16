'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Copy, Check, Loader2, ChevronDown, ChevronRight, Users } from 'lucide-react'
import { toast } from 'sonner'

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
  servings: number
  hasIngredients: boolean
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  produce:  { label: 'Produce',        emoji: '🥦' },
  protein:  { label: 'Proteins',       emoji: '🍗' },
  dairy:    { label: 'Dairy & Eggs',   emoji: '🥛' },
  grains:   { label: 'Grains & Bread', emoji: '🌾' },
  spices:   { label: 'Spices & Herbs', emoji: '🌿' },
  pantry:   { label: 'Pantry',         emoji: '🫙' },
  other:    { label: 'Other',          emoji: '🛒' },
}

function formatAmount(amount: number, unit: string): string {
  const fracMap: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾', '0.33': '⅓', '0.67': '⅔' }
  const whole = Math.floor(amount)
  const frac = amount % 1
  const fracStr = fracMap[frac.toFixed(2)] ?? (frac > 0 ? frac.toFixed(1) : '')
  const wholeStr = whole > 0 ? String(whole) : ''
  const numStr = wholeStr && fracStr ? `${wholeStr} ${fracStr}` : wholeStr || fracStr || String(amount)
  return `${numStr} ${unit}`
}

interface WeekOption { id: string; label: string }

interface Props {
  menus: WeekOption[]
  initialMenuId: string
  householdSize: number
}

export function PlannerGroceryList({ menus, initialMenuId, householdSize }: Props) {
  const [activeMenuId, setActiveMenuId] = useState(initialMenuId)
  const [dishes, setDishes] = useState<DishEntry[]>([])
  const [aggregated, setAggregated] = useState<GroceryIngredient[]>([])
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const load = useCallback(async (menuId: string) => {
    if (!menuId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/planner/ingredients?weeklyMenuId=${menuId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDishes(data.dishes ?? [])
      setAggregated(data.aggregated ?? [])
    } catch {
      toast.error('Failed to load grocery list')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (activeMenuId) load(activeMenuId) }, [activeMenuId, load])

  const categories = [...new Set(aggregated.map((i) => i.category))]
  const dishesWithoutIngredients = dishes.filter((d) => !d.hasIngredients)
  const totalItems = aggregated.length

  function toggleCheck(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleCollapse(cat: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  async function copyToClipboard() {
    const lines: string[] = []
    for (const cat of categories) {
      const catItems = aggregated.filter((i) => i.category === cat)
      if (!catItems.length) continue
      const info = CATEGORY_LABELS[cat] ?? { label: cat, emoji: '🛒' }
      lines.push(`${info.emoji} ${info.label}`)
      catItems.forEach((i) => lines.push(`  □ ${formatAmount(i.amount, i.unit)} ${i.name}`))
      lines.push('')
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  if (!initialMenuId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No meal plan found. Create one in <a href="/planner/menu" className="text-[#d4a5a5] hover:underline">Meal Plan</a>.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Week selector */}
      {menus.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {menus.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMenuId(m.id)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                m.id === activeMenuId
                  ? 'bg-[#d4a5a5] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Household scaling notice */}
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-blue-50 rounded-lg px-3 py-2">
        <Users className="w-4 h-4 text-blue-400 shrink-0" />
        Quantities scaled for {householdSize} {householdSize === 1 ? 'person' : 'people'}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : dishes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="font-medium text-gray-700">No meals planned this week</p>
          <p className="text-sm mt-1">Add meals in <a href="/planner/menu" className="text-[#d4a5a5] hover:underline">Meal Plan</a> first</p>
        </div>
      ) : (
        <>
          {/* Missing ingredients warning */}
          {dishesWithoutIngredients.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>{dishesWithoutIngredients.length} dish{dishesWithoutIngredients.length > 1 ? 'es' : ''} missing ingredient data:</strong>{' '}
              {dishesWithoutIngredients.map((d) => d.name).join(', ')}
              <p className="mt-1 text-amber-600 text-xs">Add ingredients via the dish library to include them in the grocery list.</p>
            </div>
          )}

          {totalItems === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No ingredient data yet. Add ingredients to your dishes.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{totalItems} items across {categories.length} categories</p>
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  {copied ? <Check className="w-3.5 h-3.5 mr-1 text-green-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Copied' : 'Copy List'}
                </Button>
              </div>

              <div className="space-y-3">
                {categories.map((cat) => {
                  const info = CATEGORY_LABELS[cat] ?? { label: cat, emoji: '🛒' }
                  const items = aggregated.filter((i) => i.category === cat)
                  const isCollapsed = collapsed.has(cat)
                  const checkedCount = items.filter((i) => checked[`${i.name}__${i.unit}`]).length

                  return (
                    <Card key={cat}>
                      <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => toggleCollapse(cat)}>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <span>{info.emoji}</span>
                            {info.label}
                            <span className="text-xs font-normal text-gray-400">
                              {checkedCount}/{items.length}
                            </span>
                          </CardTitle>
                          {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </CardHeader>
                      {!isCollapsed && (
                        <CardContent className="pt-0 px-4 pb-3 space-y-1">
                          {items.map((item) => {
                            const key = `${item.name}__${item.unit}`
                            const done = checked[key]
                            return (
                              <label
                                key={key}
                                className="flex items-center gap-3 py-1.5 cursor-pointer group"
                              >
                                <input
                                  type="checkbox"
                                  checked={done ?? false}
                                  onChange={() => toggleCheck(key)}
                                  className="w-4 h-4 rounded border-gray-300 text-[#d4a5a5] cursor-pointer"
                                />
                                <span className={`text-sm ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                  <strong>{formatAmount(item.amount, item.unit)}</strong>{' '}
                                  <span className="capitalize">{item.name}</span>
                                </span>
                              </label>
                            )
                          })}
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            </>
          )}

          {/* Dishes summary */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">This Week&apos;s Meals</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-3">
              <div className="space-y-1">
                {dishes.map((dish) => (
                  <div key={`${dish.dayOfWeek}_${dish.id}`} className="flex items-center justify-between text-sm py-1">
                    <span className="text-gray-700">{dish.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">{dish.dayOfWeek}</span>
                      <span className="text-gray-500 text-xs">×{dish.servings}</span>
                      {!dish.hasIngredients && (
                        <span className="text-xs text-amber-500">no ingredients</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="text-gray-400"
        onClick={() => load(activeMenuId)}
        disabled={loading}
      >
        <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  )
}
