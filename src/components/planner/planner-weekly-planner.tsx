'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Plus, Trash2, Loader2, X, Pencil, Wand2,
  ChevronLeft, ChevronRight, CalendarDays,
} from 'lucide-react'
import { addDays, format, startOfWeek } from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlannerMenuItem {
  id: number
  name: string
  description?: string | null
  servings: number
  photoUrl?: string | null
  cuisineTags: string[]
  dietaryTags: string[]
}

interface PlannerWeeklyMenuDayItem {
  id: string
  menuItem: PlannerMenuItem
  servings: number
}

interface PlannerDay {
  id: string
  date: string | Date
  dayOfWeek: string
  menuItems: PlannerWeeklyMenuDayItem[]
}

interface PlannerWeeklyMenu {
  id: string
  weekStartDate: string | Date
  weekEndDate?: string | Date | null
  isPublished: boolean
  days: PlannerDay[]
}

interface PlannerProfile {
  id: string
  displayName: string
  householdSize: number
  cuisinePrefs: string[]
}

interface Props {
  planner: PlannerProfile
  initialMenuItems: PlannerMenuItem[]
  initialWeeklyMenus: PlannerWeeklyMenu[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function utcDay(d: Date | string): Date {
  const dt = typeof d === 'string' ? new Date(d) : d
  return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())
}

function toDateInput(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

function menuLabel(menu: PlannerWeeklyMenu): string {
  const start = format(utcDay(menu.weekStartDate), 'MMM d')
  if (menu.weekEndDate) {
    const end = format(utcDay(menu.weekEndDate), 'MMM d')
    return `${start} – ${end}`
  }
  return start
}

const UTC_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
function dayNameFromDate(d: Date | string | undefined, fallback: string): string {
  if (!d) return fallback
  const dt = typeof d === 'string' ? new Date(d) : d
  return UTC_DAY_NAMES[dt.getUTCDay()] ?? fallback
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PlannerWeeklyPlanner({ planner, initialMenuItems, initialWeeklyMenus }: Props) {
  const [menuItems, setMenuItems] = useState<PlannerMenuItem[]>(initialMenuItems)
  const [weeklyMenus, setWeeklyMenus] = useState<PlannerWeeklyMenu[]>(initialWeeklyMenus)
  const [activeMenuIdx, setActiveMenuIdx] = useState(0)

  // New item dialog
  const [showNewItem, setShowNewItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemDesc, setNewItemDesc] = useState('')
  const [savingItem, setSavingItem] = useState(false)

  // New week dialog
  const [showNewWeek, setShowNewWeek] = useState(false)
  const [newWeekStart, setNewWeekStart] = useState('')
  const [newWeekEnd, setNewWeekEnd] = useState('')
  const [creatingWeek, setCreatingWeek] = useState(false)

  // Add item to day dialog
  const [manageDayId, setManageDayId] = useState<string | null>(null)
  const [addingItem, setAddingItem] = useState(false)

  // AI plan
  const [showAiPlan, setShowAiPlan] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiImage, setAiImage] = useState<{ base64: string; mime: string } | null>(null)
  const aiImageRef = useRef<HTMLInputElement>(null)

  const activeMenu = weeklyMenus[activeMenuIdx] ?? null

  // Seed default week dates when dialog opens
  useEffect(() => {
    if (showNewWeek) {
      const mon = startOfWeek(new Date(), { weekStartsOn: 1 })
      setNewWeekStart(format(mon, 'yyyy-MM-dd'))
      setNewWeekEnd(format(addDays(mon, 5), 'yyyy-MM-dd'))
    }
  }, [showNewWeek])

  // ── API helpers ────────────────────────────────────────────────────────────

  async function createWeek() {
    setCreatingWeek(true)
    try {
      const res = await fetch('/api/planner/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStartDate: newWeekStart, weekEndDate: newWeekEnd }),
      })
      if (!res.ok) throw new Error('Failed to create week')
      const menu = await res.json()
      setWeeklyMenus((prev) => [menu, ...prev])
      setActiveMenuIdx(0)
      setShowNewWeek(false)
      toast.success('Week created')
    } catch {
      toast.error('Failed to create week')
    } finally {
      setCreatingWeek(false)
    }
  }

  async function saveNewItem() {
    if (!newItemName.trim()) return
    setSavingItem(true)
    try {
      const res = await fetch('/api/planner/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName.trim(), description: newItemDesc.trim() || undefined }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const { item } = await res.json()
      setMenuItems((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setShowNewItem(false)
      setNewItemName('')
      setNewItemDesc('')
      toast.success(`"${item.name}" added to your library`)
    } catch {
      toast.error('Failed to save item')
    } finally {
      setSavingItem(false)
    }
  }

  async function addItemToDay(dayId: string, menuItemId: number) {
    if (!activeMenu) return
    setAddingItem(true)
    try {
      const res = await fetch(`/api/planner/menu/${activeMenu.id}/days/${dayId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId, servings: planner.householdSize }),
      })
      if (!res.ok) throw new Error('Failed to add')
      const dayItem = await res.json()
      setWeeklyMenus((prev) =>
        prev.map((m) =>
          m.id !== activeMenu.id
            ? m
            : {
                ...m,
                days: m.days.map((d) =>
                  d.id !== dayId ? d : { ...d, menuItems: [...d.menuItems, dayItem] }
                ),
              }
        )
      )
    } catch {
      toast.error('Failed to add item')
    } finally {
      setAddingItem(false)
    }
  }

  async function removeItemFromDay(dayId: string, dayItemId: string) {
    if (!activeMenu) return
    const res = await fetch(`/api/planner/menu/${activeMenu.id}/days/${dayId}/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayItemId }),
    })
    if (!res.ok) { toast.error('Failed to remove'); return }
    setWeeklyMenus((prev) =>
      prev.map((m) =>
        m.id !== activeMenu.id
          ? m
          : {
              ...m,
              days: m.days.map((d) =>
                d.id !== dayId ? d : { ...d, menuItems: d.menuItems.filter((i) => i.id !== dayItemId) }
              ),
            }
      )
    )
  }

  async function updateServings(dayId: string, dayItemId: string, servings: number) {
    if (!activeMenu || servings < 1) return
    const res = await fetch(`/api/planner/menu/${activeMenu.id}/days/${dayId}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayItemId, servings }),
    })
    if (!res.ok) { toast.error('Failed to update'); return }
    setWeeklyMenus((prev) =>
      prev.map((m) =>
        m.id !== activeMenu.id
          ? m
          : {
              ...m,
              days: m.days.map((d) =>
                d.id !== dayId
                  ? d
                  : { ...d, menuItems: d.menuItems.map((i) => (i.id === dayItemId ? { ...i, servings } : i)) }
              ),
            }
      )
    )
  }

  async function clearDay(dayId: string) {
    if (!activeMenu || !confirm('Clear all items from this day?')) return
    const res = await fetch(`/api/planner/menu/${activeMenu.id}/days/${dayId}/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearAll: true }),
    })
    if (!res.ok) { toast.error('Failed to clear'); return }
    setWeeklyMenus((prev) =>
      prev.map((m) =>
        m.id !== activeMenu.id
          ? m
          : { ...m, days: m.days.map((d) => (d.id !== dayId ? d : { ...d, menuItems: [] })) }
      )
    )
    toast.success('Day cleared')
  }

  async function clearWeek() {
    if (!activeMenu || !confirm('Clear all items from every day this week?')) return
    const res = await fetch(`/api/planner/menu/${activeMenu.id}/clear`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to clear'); return }
    const updated = await res.json()
    setWeeklyMenus((prev) => prev.map((m) => (m.id !== activeMenu.id ? m : updated)))
    toast.success('Week cleared')
  }

  async function deleteWeek() {
    if (!activeMenu || !confirm('Delete this week? All items will be lost.')) return
    const res = await fetch(`/api/planner/menu/${activeMenu.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    const next = weeklyMenus.filter((m) => m.id !== activeMenu.id)
    setWeeklyMenus(next)
    setActiveMenuIdx(Math.max(0, activeMenuIdx - 1))
    toast.success('Week deleted')
  }

  // ── Image resize helper ────────────────────────────────────────────────────

  function resizeImage(file: File): Promise<{ base64: string; mime: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const MAX = 1024
          const scale = Math.min(1, MAX / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve({ base64: canvas.toDataURL('image/jpeg', 0.85).split(',')[1], mime: 'image/jpeg' })
        }
        img.src = e.target!.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  async function generateAiPlan() {
    if (!activeMenu) return
    setAiGenerating(true)
    try {
      const body: Record<string, unknown> = { prompt: aiPrompt, itemsPerDay: 2 }
      if (aiImage) { body.imageBase64 = aiImage.base64; body.imageMimeType = aiImage.mime }

      const res = await fetch(`/api/planner/menu/${activeMenu.id}/ai-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to generate plan')
      const { menu: updated, summary } = await res.json()
      setWeeklyMenus((prev) => prev.map((m) => (m.id !== activeMenu.id ? m : updated)))
      setShowAiPlan(false)
      setAiPrompt('')
      setAiImage(null)
      toast.success(`AI plan applied — ${summary.newItemsCreated} new dishes created, ${summary.daysPlanned} days planned`)
    } catch {
      toast.error('Failed to generate plan')
    } finally {
      setAiGenerating(false)
    }
  }

  // ── Manage day dialog ─────────────────────────────────────────────────────

  const manageDay = activeMenu?.days.find((d) => d.id === manageDayId)
  const existingItemIds = new Set(manageDay?.menuItems.map((i) => i.menuItem.id) ?? [])

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setShowNewItem(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Dish
        </Button>
        {activeMenu && (
          <>
            <Button size="sm" variant="outline" onClick={() => setShowAiPlan(true)}>
              <Wand2 className="w-4 h-4 mr-1" /> AI Plan Week
            </Button>
            <Button size="sm" variant="outline" onClick={clearWeek}>
              <Trash2 className="w-4 h-4 mr-1" /> Clear Week
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={deleteWeek}>
              Delete Week
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setShowNewWeek(true)}>
          <CalendarDays className="w-4 h-4 mr-1" /> New Week
        </Button>
      </div>

      {/* ── Week tabs ── */}
      {weeklyMenus.length > 0 ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {weeklyMenus.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setActiveMenuIdx(i)}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  i === activeMenuIdx
                    ? 'bg-[#d4a5a5] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {menuLabel(m)}
              </button>
            ))}
          </div>

          {/* ── Day grid ── */}
          {activeMenu && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeMenu.days.map((day) => {
                const dayName = dayNameFromDate(day.date, day.dayOfWeek)
                const totalItems = day.menuItems.length
                return (
                  <Card key={day.id} className="flex flex-col">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-gray-700">{dayName}</CardTitle>
                        <div className="flex gap-1">
                          {totalItems > 0 && (
                            <button
                              onClick={() => clearDay(day.id)}
                              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                              title="Clear day"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setManageDayId(day.id)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            title="Add items"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 flex-1 space-y-1.5">
                      {totalItems === 0 ? (
                        <button
                          onClick={() => setManageDayId(day.id)}
                          className="w-full text-xs text-gray-400 hover:text-[#d4a5a5] flex items-center justify-center gap-1 py-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-[#d4a5a5] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add meals
                        </button>
                      ) : (
                        day.menuItems.map((di) => (
                          <div key={di.id} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5 group">
                            <span className="flex-1 text-xs font-medium text-gray-800 truncate">{di.menuItem.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => updateServings(day.id, di.id, di.servings - 1)}
                                className="w-5 h-5 rounded text-xs bg-white border border-gray-200 hover:bg-gray-100"
                              >−</button>
                              <span className="text-xs w-5 text-center font-medium">{di.servings}</span>
                              <button
                                onClick={() => updateServings(day.id, di.id, di.servings + 1)}
                                className="w-5 h-5 rounded text-xs bg-white border border-gray-200 hover:bg-gray-100"
                              >+</button>
                              <button
                                onClick={() => removeItemFromDay(day.id, di.id)}
                                className="ml-0.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700">No meal plans yet</p>
          <p className="text-sm mt-1 mb-4">Create your first week to start planning</p>
          <Button onClick={() => setShowNewWeek(true)} className="bg-[#d4a5a5] hover:bg-[#c49090]">
            <Plus className="w-4 h-4 mr-1" /> Create First Week
          </Button>
        </div>
      )}

      {/* ── New Item Dialog ── */}
      <Dialog open={showNewItem} onOpenChange={setShowNewItem}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Dish</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dish Name *</Label>
              <Input
                placeholder="e.g. Chicken Stir Fry"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveNewItem()}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes <span className="text-gray-400">(optional)</span></Label>
              <Textarea
                rows={3}
                placeholder="Recipe notes, special ingredients..."
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewItem(false)}>Cancel</Button>
              <Button onClick={saveNewItem} disabled={savingItem || !newItemName.trim()} className="bg-[#d4a5a5] hover:bg-[#c49090]">
                {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Dish'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── New Week Dialog ── */}
      <Dialog open={showNewWeek} onOpenChange={setShowNewWeek}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Week</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={newWeekStart} onChange={(e) => setNewWeekStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={newWeekEnd} onChange={(e) => setNewWeekEnd(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewWeek(false)}>Cancel</Button>
              <Button
                onClick={createWeek}
                disabled={creatingWeek || !newWeekStart}
                className="bg-[#d4a5a5] hover:bg-[#c49090]"
              >
                {creatingWeek ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Week'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Manage Day Dialog ── */}
      <Dialog open={!!manageDayId} onOpenChange={(o) => !o && setManageDayId(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {manageDay ? dayNameFromDate(manageDay.date, manageDay.dayOfWeek) : 'Add Meals'}
            </DialogTitle>
          </DialogHeader>
          {menuItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No dishes in your library yet.</p>
              <Button
                size="sm"
                className="mt-3 bg-[#d4a5a5] hover:bg-[#c49090]"
                onClick={() => { setManageDayId(null); setShowNewItem(true) }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add a Dish
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {menuItems.map((item) => {
                const already = existingItemIds.has(item.id)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      already ? 'bg-[#fdf0ee] border-[#d4a5a5]' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={already ? 'outline' : 'default'}
                      className={already ? '' : 'bg-[#d4a5a5] hover:bg-[#c49090]'}
                      disabled={addingItem}
                      onClick={() => {
                        if (already) {
                          const dayItem = manageDay?.menuItems.find((di) => di.menuItem.id === item.id)
                          if (dayItem && manageDayId) removeItemFromDay(manageDayId, dayItem.id)
                        } else {
                          if (manageDayId) addItemToDay(manageDayId, item.id)
                        }
                      }}
                    >
                      {already ? 'Remove' : 'Add'}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── AI Plan Dialog ── */}
      <Dialog open={showAiPlan} onOpenChange={setShowAiPlan}>
        <DialogContent>
          <DialogHeader><DialogTitle>AI Plan Week</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Inspiration <span className="text-gray-400">(optional)</span></Label>
              <Textarea
                rows={3}
                placeholder="e.g. Light summer meals, more vegetarian, use up pantry staples..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reference Image <span className="text-gray-400">(optional)</span></Label>
              {aiImage ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Image attached</Badge>
                  <Button size="sm" variant="ghost" onClick={() => setAiImage(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => aiImageRef.current?.click()}
                    type="button"
                  >
                    Upload Image
                  </Button>
                  <input
                    ref={aiImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) setAiImage(await resizeImage(file))
                    }}
                  />
                </>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAiPlan(false)}>Cancel</Button>
              <Button onClick={generateAiPlan} disabled={aiGenerating} className="bg-[#d4a5a5] hover:bg-[#c49090]">
                {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Wand2 className="w-4 h-4 mr-1" />}
                Generate Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
