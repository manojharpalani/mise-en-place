'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  ShoppingCart, RefreshCw, Copy, Check, ChevronDown, ChevronRight,
  Loader2, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import type { GroceryListResponse, DishEntry, GroceryIngredient } from '@/app/api/ingredients/route'

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  produce:  { label: 'Produce',       emoji: '🥦' },
  protein:  { label: 'Proteins',      emoji: '🍗' },
  dairy:    { label: 'Dairy & Eggs',  emoji: '🥛' },
  grains:   { label: 'Grains & Bread',emoji: '🌾' },
  spices:   { label: 'Spices & Herbs',emoji: '🌿' },
  pantry:   { label: 'Pantry',        emoji: '🫙' },
  other:    { label: 'Other',         emoji: '🛒' },
}

interface WeekOption {
  id: string
  label: string
}

interface GroceryListProps {
  menus: WeekOption[]
  initialMenuId: string
  open: boolean
  onClose: () => void
}

type FilterMode = 'week' | 'day' | 'dish'

interface CheckState {
  [key: string]: boolean // key: "name__unit"
}

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function formatAmount(amount: number, unit: string): string {
  const frac = amount % 1
  const whole = Math.floor(amount)
  const fracMap: Record<string, string> = {
    '0.25': '¼', '0.5': '½', '0.75': '¾',
    '0.33': '⅓', '0.67': '⅔', '0.125': '⅛',
  }
  const fracStr = fracMap[frac.toFixed(2)] ?? (frac > 0 ? frac.toFixed(1) : '')
  const wholeStr = whole > 0 ? String(whole) : ''
  const numStr = wholeStr && fracStr ? `${wholeStr} ${fracStr}` : wholeStr || fracStr || String(amount)
  return `${numStr} ${unit}`
}

export function GroceryList({ menus, initialMenuId, open, onClose }: GroceryListProps) {
  const [activeMenuId, setActiveMenuId] = useState(initialMenuId)

  // Sync with the active week in the planner when it changes externally
  useEffect(() => { setActiveMenuId(initialMenuId) }, [initialMenuId])
  const [data, setData] = useState<GroceryListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterMode, setFilterMode] = useState<FilterMode>('week')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null)
  const [checked, setChecked] = useState<CheckState>({})
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const [generatingFor, setGeneratingFor] = useState<number | null>(null)

  const weekLabel = menus.find(m => m.id === activeMenuId)?.label ?? ''
  const storageKey = `grocery_check_${activeMenuId}`

  // Load check state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) setChecked(JSON.parse(saved))
      } catch {}
    }
  }, [storageKey])

  const saveChecked = useCallback((state: CheckState) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(state))
    }
  }, [storageKey])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ingredients?weeklyMenuId=${activeMenuId}`)
      if (!res.ok) throw new Error()
      const json: GroceryListResponse = await res.json()
      setData(json)
    } catch {
      toast.error('Failed to load grocery list')
    } finally {
      setLoading(false)
    }
  }, [activeMenuId])

  // Reset data when week changes or sheet opens
  useEffect(() => {
    setData(null)
    setFilterMode('week')
    setSelectedDay(null)
    setSelectedDishId(null)
  }, [activeMenuId])

  useEffect(() => {
    if (open && !data) fetchData()
  }, [open, data, fetchData])

  // Unique days that have dishes
  const days = useMemo(() => {
    if (!data) return []
    const seen = new Map<string, string>()
    for (const d of data.dishes) {
      if (!seen.has(d.dayOfWeek)) seen.set(d.dayOfWeek, d.date)
    }
    return Array.from(seen.entries()).map(([day, date]) => ({ day, date }))
  }, [data])

  // Current filtered dishes
  const filteredDishes = useMemo(() => {
    if (!data) return []
    if (filterMode === 'week') return data.dishes
    if (filterMode === 'day' && selectedDay) return data.dishes.filter(d => d.dayOfWeek === selectedDay)
    if (filterMode === 'dish' && selectedDishId !== null) return data.dishes.filter(d => d.id === selectedDishId)
    return data.dishes
  }, [data, filterMode, selectedDay, selectedDishId])

  // Aggregate ingredients for current filter
  const aggregated = useMemo(() => {
    if (!filteredDishes.length) return []
    const map = new Map<string, GroceryIngredient>()
    for (const dish of filteredDishes) {
      if (!dish.ingredients?.length) continue
      const scale = dish.servings
      for (const ing of dish.ingredients) {
        const key = `${ing.name.toLowerCase()}__${ing.unit}`
        const ex = map.get(key)
        if (ex) {
          ex.amount = Math.round((ex.amount + ing.amount * scale) * 100) / 100
        } else {
          map.set(key, { ...ing, amount: Math.round(ing.amount * scale * 100) / 100 })
        }
      }
    }
    const order = ['produce', 'protein', 'dairy', 'grains', 'spices', 'pantry', 'other']
    return Array.from(map.values()).sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
  }, [filteredDishes])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, GroceryIngredient[]>()
    for (const ing of aggregated) {
      const cat = ing.category || 'other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(ing)
    }
    return map
  }, [aggregated])

  // Unique dishes (deduplicated by id — same dish can appear on multiple days)
  const uniqueDishes = useMemo(
    () => Array.from(new Map(filteredDishes.map(d => [d.id, d])).values()),
    [filteredDishes]
  )

  const dishesWithoutIngredients = useMemo(
    () => uniqueDishes.filter(d => !d.hasIngredients),
    [uniqueDishes]
  )

  const checkedCount = useMemo(
    () => aggregated.filter(ing => checked[`${ing.name.toLowerCase()}__${ing.unit}`]).length,
    [aggregated, checked]
  )

  const toggleCheck = (ing: GroceryIngredient) => {
    const key = `${ing.name.toLowerCase()}__${ing.unit}`
    const next = { ...checked, [key]: !checked[key] }
    setChecked(next)
    saveChecked(next)
  }

  const clearChecked = () => {
    const next: CheckState = {}
    setChecked(next)
    saveChecked(next)
  }

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const generateForDish = async (dish: DishEntry) => {
    setGeneratingFor(dish.id)
    try {
      const res = await fetch(`/api/menu-items/${dish.id}/ingredients`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success(`Ingredients generated for ${dish.name}`)
      await fetchData()
    } catch {
      toast.error(`Failed to generate ingredients for ${dish.name}`)
    } finally {
      setGeneratingFor(null)
    }
  }

  const generateAll = async () => {
    const missing = dishesWithoutIngredients
    if (!missing.length) return
    for (const dish of missing) {
      await generateForDish(dish)
    }
  }

  const copyList = () => {
    const lines: string[] = [`🛒 Shopping List — ${weekLabel}\n`]
    let currentCat = ''
    for (const ing of aggregated) {
      const cat = CATEGORY_LABELS[ing.category]?.label ?? 'Other'
      if (cat !== currentCat) {
        lines.push(`\n${CATEGORY_LABELS[ing.category]?.emoji ?? '•'} ${cat}`)
        currentCat = cat
      }
      const key = `${ing.name.toLowerCase()}__${ing.unit}`
      const done = checked[key] ? '✓ ' : '○ '
      lines.push(`  ${done}${toTitleCase(ing.name)} — ${formatAmount(ing.amount, ing.unit)}`)
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const setDayFilter = (day: string) => {
    setFilterMode('day')
    setSelectedDay(day)
    setSelectedDishId(null)
  }

  const setDishFilter = (id: number) => {
    setFilterMode('dish')
    setSelectedDishId(id)
    setSelectedDay(null)
  }

  const setWeekFilter = () => {
    setFilterMode('week')
    setSelectedDay(null)
    setSelectedDishId(null)
  }

  const activeFilterLabel = filterMode === 'week'
    ? 'All Week'
    : filterMode === 'day' && selectedDay
      ? selectedDay
      : filterMode === 'dish' && selectedDishId !== null
        ? data?.dishes.find(d => d.id === selectedDishId)?.name ?? 'Dish'
        : 'All Week'

  return (
    <Sheet open={open} onOpenChange={(v: boolean) => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        className="flex flex-col p-0 rounded-t-2xl"
        style={{ background: '#fbf6ec', height: '92dvh' }}
      >
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b" style={{ borderColor: '#e7ddcb' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" style={{ color: '#c1622d' }} />
              <SheetTitle className="font-heading text-lg" style={{ color: '#2a2420' }}>
                Grocery List
              </SheetTitle>
            </div>
            <div className="flex items-center gap-2">
              {aggregated.length > 0 && checkedCount > 0 && (
                <button
                  onClick={clearChecked}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ color: '#6b625a', background: '#f1e9db' }}
                >
                  Clear ({checkedCount})
                </button>
              )}
              <button
                onClick={copyList}
                disabled={!aggregated.length}
                className="p-1.5 rounded-lg disabled:opacity-40"
                style={{ color: '#6b625a', background: '#f1e9db' }}
              >
                {copied ? <Check className="w-4 h-4 text-[#c1622d]" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={fetchData} className="p-1.5 rounded-lg" style={{ color: '#6b625a', background: '#f1e9db' }}>
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Week picker */}
          {menus.length > 1 && (
            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {menus.map(m => (
                <button
                  key={m.id}
                  onClick={() => setActiveMenuId(m.id)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    m.id === activeMenuId
                      ? 'text-white border-transparent'
                      : 'border-[#e7ddcb] text-[#6b625a] bg-white'
                  }`}
                  style={m.id === activeMenuId ? { background: '#2a2420', borderColor: '#2a2420' } : {}}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* Filter bar */}
          <div className="mt-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {/* All Week pill */}
              <button
                onClick={setWeekFilter}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  filterMode === 'week'
                    ? 'text-white border-transparent'
                    : 'border-[#e7ddcb] text-[#6b625a] bg-white'
                }`}
                style={filterMode === 'week' ? { background: '#c1622d', borderColor: '#c1622d' } : {}}
              >
                All Week
              </button>

              {/* Day pills */}
              {days.map(({ day }) => (
                <button
                  key={day}
                  onClick={() => setDayFilter(day)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    filterMode === 'day' && selectedDay === day
                      ? 'text-white border-transparent'
                      : 'border-[#e7ddcb] text-[#6b625a] bg-white'
                  }`}
                  style={filterMode === 'day' && selectedDay === day ? { background: '#c1622d', borderColor: '#c1622d' } : {}}
                >
                  {day.slice(0, 3)}
                </button>
              ))}

              {/* Divider */}
              {days.length > 0 && data && data.dishes.length > 0 && (
                <span className="flex-shrink-0 w-px h-5 bg-[#e7ddcb]" />
              )}

              {/* Dish pills */}
              {uniqueDishes.map((dish) => (
                <button
                  key={dish.id}
                  onClick={() => setDishFilter(dish.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors max-w-[140px] truncate ${
                    filterMode === 'dish' && selectedDishId === dish.id
                      ? 'text-white border-transparent'
                      : 'border-[#e7ddcb] text-[#6b625a] bg-white'
                  }`}
                  style={filterMode === 'dish' && selectedDishId === dish.id ? { background: '#a64f20', borderColor: '#a64f20' } : {}}
                >
                  {dish.name}
                </button>
              ))}
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#c1622d' }} />
              <p className="text-sm" style={{ color: '#6b625a' }}>Loading grocery list...</p>
            </div>
          ) : !data ? null : (
            <div className="px-4 py-4 space-y-2">

              {/* Missing ingredients banner */}
              {dishesWithoutIngredients.length > 0 && (
                <div className="rounded-xl p-3 mb-4 border" style={{ background: '#f7e9de', borderColor: '#e7ddcb' }}>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#a64f20' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#2a2420' }}>
                        {dishesWithoutIngredients.length} dish{dishesWithoutIngredients.length > 1 ? 'es' : ''} need ingredients
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b625a' }}>
                        {dishesWithoutIngredients.map(d => d.name).join(', ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={generateAll}
                      disabled={generatingFor !== null}
                      className="flex-shrink-0 text-white text-xs px-3 h-8"
                      style={{ background: '#c1622d' }}
                    >
                      {generatingFor !== null ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 mr-1" />
                      )}
                      Generate All
                    </Button>
                  </div>

                  {/* Individual dish buttons */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dishesWithoutIngredients.map(dish => (
                      <button
                        key={dish.id}
                        onClick={() => generateForDish(dish)}
                        disabled={generatingFor !== null}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border disabled:opacity-50"
                        style={{ borderColor: '#e7ddcb', color: '#6b625a', background: 'white' }}
                      >
                        {generatingFor === dish.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" style={{ color: '#a64f20' }} />
                        )}
                        {dish.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {aggregated.length === 0 && dishesWithoutIngredients.length === 0 && (
                <div className="text-center py-16">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: '#c1622d' }} />
                  <p className="text-sm" style={{ color: '#6b625a' }}>
                    {filterMode === 'week'
                      ? 'No items scheduled this week.'
                      : `No items for ${activeFilterLabel}.`}
                  </p>
                </div>
              )}

              {/* Progress bar */}
              {aggregated.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: '#6b625a' }}>
                    <span>{checkedCount} of {aggregated.length} checked</span>
                    <span>{Math.round(checkedCount / aggregated.length * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#e7ddcb' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(checkedCount / aggregated.length * 100)}%`,
                        background: 'linear-gradient(90deg, #c1622d, #a64f20)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Grouped checklist */}
              {Array.from(grouped.entries()).map(([cat, items]) => {
                const { label, emoji } = CATEGORY_LABELS[cat] ?? { label: cat, emoji: '•' }
                const isCollapsed = collapsedCategories.has(cat)
                const catChecked = items.filter(i => checked[`${i.name.toLowerCase()}__${i.unit}`]).length

                return (
                  <div key={cat} className="rounded-xl overflow-hidden border" style={{ borderColor: '#e7ddcb' }}>
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="w-full flex items-center justify-between px-4 py-3"
                      style={{ background: '#faf3e6' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{emoji}</span>
                        <span className="font-medium text-sm" style={{ color: '#2a2420' }}>{label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#e7ddcb', color: '#6b625a' }}>
                          {catChecked}/{items.length}
                        </span>
                      </div>
                      {isCollapsed
                        ? <ChevronRight className="w-4 h-4" style={{ color: '#8a7a63' }} />
                        : <ChevronDown className="w-4 h-4" style={{ color: '#8a7a63' }} />
                      }
                    </button>

                    {/* Items */}
                    {!isCollapsed && (
                      <div style={{ background: 'white' }}>
                        {items.map((ing, idx) => {
                          const key = `${ing.name.toLowerCase()}__${ing.unit}`
                          const isChecked = !!checked[key]
                          return (
                            <button
                              key={key}
                              onClick={() => toggleCheck(ing)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-[#f7e9de]"
                              style={{
                                borderTop: idx > 0 ? '1px solid #f1e9db' : undefined,
                              }}
                            >
                              {/* Checkbox */}
                              <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                                style={{
                                  borderColor: isChecked ? '#c1622d' : '#d8cbb4',
                                  background: isChecked ? '#c1622d' : 'white',
                                }}
                              >
                                {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                              </div>

                              {/* Name */}
                              <span
                                className="flex-1 text-sm"
                                style={{
                                  color: isChecked ? '#8a7a63' : '#2a2420',
                                  textDecoration: isChecked ? 'line-through' : 'none',
                                }}
                              >
                                {toTitleCase(ing.name)}
                              </span>

                              {/* Amount */}
                              <span
                                className="text-sm font-medium flex-shrink-0"
                                style={{ color: isChecked ? '#8a7a63' : '#6b625a' }}
                              >
                                {formatAmount(ing.amount, ing.unit)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Bottom padding for safe area */}
              <div className="h-8" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
