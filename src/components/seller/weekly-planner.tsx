'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MenuItemForm } from './menu-item-form'
import { GroceryList } from './grocery-list'
import { DishInspiration } from './dish-inspiration'
import { FlyerCanvas } from './flyer-canvas'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Trash2, ShoppingCart, Share2, ChefHat, Loader2, X, Pencil, Download, Sparkles, MessageCircle, RefreshCw, Wand2, Layers } from 'lucide-react'
import { addDays, startOfWeek, format } from 'date-fns'

interface MenuItem {
  id: number
  name: string
  price: number
  salePrice?: number | null
  photoUrl?: string | null
  dietaryTags?: string[]
  ingredients?: unknown
}

interface ComboItem {
  id: string
  name: string
  comboPrice: number
}

interface WeeklyMenuDayItem {
  menuItem: MenuItem
  quantity: number
}

interface WeeklyMenuDayComboItem {
  comboItem: ComboItem
  quantity: number
}

interface DayData {
  id?: string
  date?: Date
  dayOfWeek: string
  menuItems: WeeklyMenuDayItem[]
  comboItems: WeeklyMenuDayComboItem[]
}

interface WeeklyMenuData {
  id: string
  weekStartDate: Date
  weekEndDate?: Date | null
  status: string
  flyerImageUrl?: string | null
  days: DayData[]
}

interface WeeklyMenuPlannerProps {
  seller: { id: string; storeName: string; storeSlug: string; cuisineType?: string | null; bio?: string | null }
  initialMenuItems: MenuItem[]
  initialComboItems: ComboItem[]
  initialWeeklyMenus: WeeklyMenuData[]
}

// Dates from the server are stored as noon UTC. Extract the UTC date parts
// so display is always correct regardless of the client's local timezone.
function utcDay(d: Date | string): Date {
  const dt = typeof d === 'string' ? new Date(d) : d
  return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())
}

// Derive the day name from the date field (UTC) rather than trusting the stored dayOfWeek string,
// which may be stale if it was written with a timezone bug.
const UTC_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
function dayNameFromDate(d: Date | string | undefined, fallback: string): string {
  if (!d) return fallback
  const dt = typeof d === 'string' ? new Date(d) : d
  return UTC_DAY_NAMES[dt.getUTCDay()] ?? fallback
}

// Format a date for <input type="date"> (YYYY-MM-DD) using UTC parts
function toDateInput(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function menuLabel(menu: WeeklyMenuData): string {
  const start = format(utcDay(menu.weekStartDate), 'MMM d')
  if (menu.weekEndDate) {
    const end = format(utcDay(menu.weekEndDate), 'MMM d')
    return `${start} – ${end}`
  }
  return `Week of ${start}`
}

interface DateRangeDialogProps {
  open: boolean
  onClose: () => void
  title: string
  initialStart: string
  initialEnd: string
  saving: boolean
  onSave: (start: string, end: string) => void
}

function DateRangeDialog({ open, onClose, title, initialStart, initialEnd, saving, onSave }: DateRangeDialogProps) {
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)

  // Reset when dialog opens
  useEffect(() => {
    if (open) { setStart(initialStart); setEnd(initialEnd) }
  }, [open, initialStart, initialEnd])

  const valid = start && end && end >= start

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={start}
              onChange={e => setStart(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e28a93]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={end}
              min={start}
              onChange={e => setEnd(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e28a93]"
            />
          </div>
          {start && end && end < start && (
            <p className="text-xs text-red-500">End date must be on or after start date.</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-[#d4a5a5] hover:bg-[#c49090] text-white"
              disabled={!valid || saving}
              onClick={() => onSave(start, end)}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              {title === 'New Plan' ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function WeeklyMenuPlanner({
  seller,
  initialMenuItems,
  initialComboItems,
  initialWeeklyMenus,
}: WeeklyMenuPlannerProps) {
  const [menuItems, setMenuItems] = useState(initialMenuItems)
  const [weeklyMenus, setWeeklyMenus] = useState(initialWeeklyMenus)
  const [activeMenuIndex, setActiveMenuIndex] = useState(0)
  const [showItemForm, setShowItemForm] = useState(false)
  const [addingToDayIndex, setAddingToDayIndex] = useState<number | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [generatingFlyer, setGeneratingFlyer] = useState(false)
  const [flyerDataUrl, setFlyerDataUrl] = useState<string | null>(null)
  const [showFlyerModal, setShowFlyerModal] = useState(false)
  const flyerRef = useRef<HTMLDivElement>(null)
  const [showGroceryList, setShowGroceryList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [todayStr, setTodayStr] = useState<string | null>(null)
  const [inspiredItem, setInspiredItem] = useState<{ id: number; name: string; description?: string | null } | null>(null)

  // Date picker dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingMenuIndex, setEditingMenuIndex] = useState<number | null>(null)

  // AI plan dialog state
  const [showAiPlan, setShowAiPlan] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiItemsPerDay, setAiItemsPerDay] = useState(2)
  const [aiIncludeCombo, setAiIncludeCombo] = useState(false)
  const [aiComboSize, setAiComboSize] = useState(2)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiImage, setAiImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null)
  const aiImageInputRef = useRef<HTMLInputElement>(null)

  // Import from image state
  const [showImport, setShowImport] = useState(false)
  const [importImage, setImportImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null)
  const importImageRef = useRef<HTMLInputElement>(null)
  const [importAnalyzing, setImportAnalyzing] = useState(false)
  const [importPlan, setImportPlan] = useState<{
    days: Array<{
      dayOfWeek: string
      items: Array<{ name: string; description?: string; estimatedPrice?: number; isCombo: boolean; comboComponents?: string[]; selected: boolean }>
    }>
    notes?: string
  } | null>(null)
  const [importApplying, setImportApplying] = useState(false)

  // Combo creation dialog state
  const [showComboForm, setShowComboForm] = useState(false)
  const [comboName, setComboName] = useState('')
  const [comboDescription, setComboDescription] = useState('')
  const [comboPrice, setComboPrice] = useState('')
  const [comboSelectedItems, setComboSelectedItems] = useState<number[]>([])
  const [comboItems, setComboItems] = useState(initialComboItems)
  const [savingCombo, setSavingCombo] = useState(false)

  useEffect(() => { setTodayStr(new Date().toDateString()) }, [])

  const currentMenu = weeklyMenus[activeMenuIndex]

  // Default new plan: this Monday → Saturday
  const defaultStart = () => {
    const mon = startOfWeek(new Date(), { weekStartsOn: 1 })
    return toDateInput(mon)
  }
  const defaultEnd = () => toDateInput(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 4))

  const createMenu = async (startStr: string, endStr: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStartDate: startStr, weekEndDate: endStr }),
      })
      if (!res.ok) throw new Error()
      const newMenu = await res.json()
      setWeeklyMenus(prev => [newMenu, ...prev])
      setActiveMenuIndex(0)
      setShowCreateDialog(false)
      toast.success('Plan created!')
    } catch {
      toast.error('Failed to create plan')
    } finally {
      setSaving(false)
    }
  }

  const updateMenuDates = async (index: number, startStr: string, endStr: string) => {
    const menu = weeklyMenus[index]
    if (!menu) return
    setSaving(true)
    try {
      const res = await fetch(`/api/menu/${menu.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStartDate: startStr, weekEndDate: endStr }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setWeeklyMenus(prev => prev.map((m, i) => (i === index ? updated : m)))
      setEditingMenuIndex(null)
      toast.success('Dates updated!')
    } catch {
      toast.error('Failed to update dates')
    } finally {
      setSaving(false)
    }
  }

  const deleteMenu = async (menuId: string, index: number) => {
    if (!confirm('Delete this plan? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/menu/${menuId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      const next = weeklyMenus.filter((_, i) => i !== index)
      setWeeklyMenus(next)
      setActiveMenuIndex(Math.max(0, Math.min(activeMenuIndex, next.length - 1)))
      toast.success('Plan deleted')
    } catch {
      toast.error('Failed to delete plan')
    }
  }

  const addItemToDay = async (dayIndex: number, itemId: number | null, comboId: string | null) => {
    if (!currentMenu) return
    const day = currentMenu.days[dayIndex]
    if (!day?.id) { toast.error('Save the menu first'); return }
    try {
      const res = await fetch(`/api/menu/${currentMenu.id}/days/${day.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId: itemId, comboItemId: comboId, quantity: 10 }),
      })
      if (!res.ok) throw new Error()
      const updatedMenu = await res.json()
      setWeeklyMenus(prev => prev.map((m, i) => (i === activeMenuIndex ? updatedMenu : m)))
      toast.success('Item added')
    } catch {
      toast.error('Failed to add item')
    }
    setAddingToDayIndex(null)
  }

  const removeItemFromDay = async (dayId: string | undefined, menuItemId: number | null, comboItemId: string | null) => {
    if (!dayId || !currentMenu) return
    try {
      const res = await fetch(`/api/menu/${currentMenu.id}/days/${dayId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId, comboItemId }),
      })
      if (!res.ok) throw new Error()
      const updatedMenu = await res.json()
      setWeeklyMenus(prev => prev.map((m, i) => (i === activeMenuIndex ? updatedMenu : m)))
    } catch {
      toast.error('Failed to remove item')
    }
  }

  const updateItemQuantity = async (dayId: string | undefined, menuItemId: number | null, comboItemId: string | null, quantity: number) => {
    if (!dayId || !currentMenu || quantity < 1) return
    try {
      const res = await fetch(`/api/menu/${currentMenu.id}/days/${dayId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId, comboItemId, quantity }),
      })
      if (!res.ok) throw new Error()
      const updatedMenu = await res.json()
      setWeeklyMenus(prev => prev.map((m, i) => (i === activeMenuIndex ? updatedMenu : m)))
    } catch {
      toast.error('Failed to update quantity')
    }
  }

  const resizeImage = (file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> =>
    new Promise(resolve => {
      const previewUrl = URL.createObjectURL(file)
      const img = new window.Image()
      img.onload = () => {
        const MAX = 1024
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg', previewUrl })
      }
      img.src = previewUrl
    })

  const handleImportImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await resizeImage(file)
    setImportImage(result)
    setImportPlan(null)
  }

  const analyzeImportImage = async () => {
    if (!importImage || !currentMenu) return
    setImportAnalyzing(true)
    try {
      const res = await fetch(`/api/menu/${currentMenu.id}/import-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', imageBase64: importImage.base64, imageMimeType: importImage.mimeType }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to analyze image'); return }
      // Add `selected: true` to every item for the review step
      setImportPlan({
        ...data.plan,
        days: data.plan.days.map((d: { dayOfWeek: string; items: Array<{ name: string; description?: string; estimatedPrice?: number; isCombo: boolean; comboComponents?: string[] }> }) => ({
          ...d,
          items: d.items.map((item) => ({ ...item, selected: true })),
        })),
      })
    } catch {
      toast.error('Failed to analyze image')
    } finally {
      setImportAnalyzing(false)
    }
  }

  const applyImportPlan = async () => {
    if (!importPlan || !currentMenu) return
    setImportApplying(true)
    try {
      // Strip `selected: false` items and the `selected` field itself
      const filteredPlan = {
        ...importPlan,
        days: importPlan.days
          .map(d => ({ ...d, items: d.items.filter(i => i.selected).map(({ selected: _s, ...rest }) => rest) }))
          .filter(d => d.items.length > 0),
      }
      const res = await fetch(`/api/menu/${currentMenu.id}/import-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', plan: filteredPlan }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to import plan'); return }
      setWeeklyMenus(prev => prev.map((m, i) => (i === activeMenuIndex ? data.menu : m)))
      if (data.updatedItemCatalog) setMenuItems(data.updatedItemCatalog)
      if (data.updatedComboCatalog) setComboItems(data.updatedComboCatalog)
      const { newItemsCreated, newCombosCreated, daysImported } = data.summary
      const parts = [`${daysImported} day${daysImported !== 1 ? 's' : ''} imported`]
      if (newItemsCreated > 0) parts.push(`${newItemsCreated} new item${newItemsCreated > 1 ? 's' : ''} created`)
      if (newCombosCreated > 0) parts.push(`${newCombosCreated} new combo${newCombosCreated > 1 ? 's' : ''} created`)
      toast.success(parts.join(' · '))
      setShowImport(false)
      setImportImage(null)
      setImportPlan(null)
    } catch {
      toast.error('Failed to import plan')
    } finally {
      setImportApplying(false)
    }
  }

  const handleAiImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await resizeImage(file)
    setAiImage(result)
  }

  const generateAiPlan = async () => {
    if (!currentMenu) return
    setAiGenerating(true)
    try {
      const res = await fetch(`/api/menu/${currentMenu.id}/ai-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt.trim() || undefined,
          itemsPerDay: aiItemsPerDay,
          includeCombo: aiIncludeCombo,
          comboSize: aiComboSize,
          ...(aiImage ? { imageBase64: aiImage.base64, imageMimeType: aiImage.mimeType } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to generate plan'); return }
      setWeeklyMenus(prev => prev.map((m, i) => (i === activeMenuIndex ? data.menu : m)))
      const { newItemsCreated, newCombosCreated, daysPlanned } = data.summary
      const parts = [`${daysPlanned} days planned`]
      if (newItemsCreated > 0) parts.push(`${newItemsCreated} new item${newItemsCreated > 1 ? 's' : ''} created`)
      if (newCombosCreated > 0) parts.push(`${newCombosCreated} new combo${newCombosCreated > 1 ? 's' : ''} created`)
      toast.success(parts.join(' · '))
      setShowAiPlan(false)
      setAiPrompt('')
      setAiImage(null)
    } catch {
      toast.error('Failed to generate plan')
    } finally {
      setAiGenerating(false)
    }
  }

  const saveCombo = async () => {
    if (!comboName.trim() || comboSelectedItems.length < 2 || !comboPrice) {
      toast.error('Name, price, and at least 2 items are required')
      return
    }
    setSavingCombo(true)
    try {
      const res = await fetch('/api/combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: comboName.trim(),
          description: comboDescription.trim() || null,
          comboPrice: parseFloat(comboPrice),
          components: comboSelectedItems.map(id => ({ menuItemId: id, quantity: 1 })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to create combo'); return }
      setComboItems(prev => [...prev, { id: data.id, name: data.name, comboPrice: data.comboPrice }])
      toast.success('Combo created!')
      setShowComboForm(false)
      setComboName('')
      setComboDescription('')
      setComboPrice('')
      setComboSelectedItems([])
    } catch {
      toast.error('Failed to create combo')
    } finally {
      setSavingCombo(false)
    }
  }

  const clearDay = async (dayId: string | undefined) => {
    if (!dayId || !currentMenu) return
    if (!confirm('Clear all items from this day?')) return
    try {
      const res = await fetch(`/api/menu/${currentMenu.id}/days/${dayId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAll: true }),
      })
      if (!res.ok) throw new Error()
      const updatedMenu = await res.json()
      setWeeklyMenus(prev => prev.map((m, i) => (i === activeMenuIndex ? updatedMenu : m)))
    } catch {
      toast.error('Failed to clear day')
    }
  }

  const clearWeek = async () => {
    if (!currentMenu) return
    if (!confirm('Clear all items from every day this week?')) return
    try {
      const res = await fetch(`/api/menu/${currentMenu.id}/clear`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      const updatedMenu = await res.json()
      setWeeklyMenus(prev => prev.map((m, i) => (i === activeMenuIndex ? updatedMenu : m)))
      toast.success('Week cleared')
    } catch {
      toast.error('Failed to clear week')
    }
  }

  const captureFlyer = useCallback(async (): Promise<string | null> => {
    if (!flyerRef.current) return null
    const { toPng } = await import('html-to-image')
    return toPng(flyerRef.current, { pixelRatio: 2, cacheBust: true })
  }, [])

  const publishMenu = async () => {
    if (!currentMenu) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/menu/${currentMenu.id}/publish`, { method: 'POST' })
      if (!res.ok) throw new Error()
      setWeeklyMenus(prev => prev.map((m, i) =>
        i === activeMenuIndex ? { ...m, status: 'PUBLISHED' } : m
      ))
      toast.success('Menu published!')
    } catch {
      toast.error('Failed to publish menu')
    } finally {
      setPublishing(false)
    }
  }

  const generateFlyer = async () => {
    setGeneratingFlyer(true)
    try {
      const dataUrl = await captureFlyer()
      if (!dataUrl) throw new Error()
      setFlyerDataUrl(dataUrl)
      setShowFlyerModal(true)
    } catch {
      toast.error('Could not generate flyer')
    } finally {
      setGeneratingFlyer(false)
    }
  }

  const getDayData = (dayOfWeek: string): DayData =>
    currentMenu?.days.find(d => d.dayOfWeek === dayOfWeek) ?? { dayOfWeek, menuItems: [], comboItems: [] }

  // Per-day data for the flyer
  const flyerDays = (currentMenu?.days ?? [])
    .filter(d => d.menuItems.length > 0 || d.comboItems.length > 0)
    .map(d => ({
      dayOfWeek: dayNameFromDate(d.date, d.dayOfWeek),
      dishes: [
        ...d.menuItems.map(mi => ({
          name: mi.menuItem.name,
          price: mi.menuItem.price,
          salePrice: mi.menuItem.salePrice,
          quantity: mi.quantity,
          isCombo: false,
        })),
        ...d.comboItems.map(ci => ({
          name: ci.comboItem.name,
          price: ci.comboItem.comboPrice,
          quantity: ci.quantity,
          isCombo: true,
        })),
      ],
    }))

  const missingIngredientsCount = currentMenu
    ? currentMenu.days.flatMap(d => d.menuItems).filter(mi => !mi.menuItem.ingredients).length
    : 0

  // For the edit dialog, derive current values
  const editingMenu = editingMenuIndex !== null ? weeklyMenus[editingMenuIndex] : null
  const editStart = editingMenu ? toDateInput(editingMenu.weekStartDate) : defaultStart()
  const editEnd = editingMenu
    ? toDateInput(editingMenu.weekEndDate ? editingMenu.weekEndDate : addDays(utcDay(editingMenu.weekStartDate), 4))
    : defaultEnd()

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        {/* Week tabs */}
        <div className="flex gap-2 flex-wrap items-center">
          {weeklyMenus.map((menu, i) => (
            <div
              key={menu.id}
              className={`flex items-center rounded-lg border text-sm font-medium transition-colors ${
                i === activeMenuIndex
                  ? 'bg-[#d4a5a5] text-white border-[#d4a5a5]'
                  : 'bg-white text-stone-600 border-stone-200'
              }`}
            >
              <button onClick={() => setActiveMenuIndex(i)} className="pl-3 pr-1 py-1.5">
                {menuLabel(menu)}
                {menu.status === 'PUBLISHED' && ' ✓'}
              </button>
              {/* Edit dates */}
              <button
                onClick={() => setEditingMenuIndex(i)}
                className="px-1.5 py-1.5 opacity-60 hover:opacity-100 transition-opacity"
                title="Edit dates"
              >
                <Pencil className="w-3 h-3" />
              </button>
              {/* Delete */}
              <button
                onClick={() => deleteMenu(menu.id, i)}
                className="pr-2 py-1.5 opacity-60 hover:opacity-100 transition-opacity"
                title="Delete plan"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Plan
          </Button>
        </div>

        {currentMenu && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowGroceryList(true)} className="relative">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Grocery List
              {missingIngredientsCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                  style={{ background: '#e28a93' }}
                >
                  {missingIngredientsCount}
                </span>
              )}
            </Button>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-[#d4a5a5] text-[#d4a5a5]"
                onClick={generateFlyer}
                disabled={generatingFlyer}
              >
                {generatingFlyer
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Building…</>
                  : <><Sparkles className="w-4 h-4 mr-1.5" /> Flyer</>
                }
              </Button>
              {currentMenu.status === 'PUBLISHED' ? (
                <Button size="sm" disabled className="bg-stone-100 text-stone-400">
                  <Share2 className="w-4 h-4 mr-2" /> Published
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={publishMenu}
                  disabled={publishing}
                  className="bg-[#d4a5a5] hover:bg-[#c49090] text-white"
                >
                  {publishing
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing…</>
                    : <><Share2 className="w-4 h-4 mr-2" /> Publish & Notify</>
                  }
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Item management buttons */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowItemForm(true)} variant="outline" size="sm">
            <ChefHat className="w-4 h-4 mr-2" /> New Item
          </Button>
          <Button onClick={() => setShowComboForm(true)} variant="outline" size="sm">
            <Layers className="w-4 h-4 mr-2" /> New Combo
          </Button>
        </div>
        {currentMenu && (
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={clearWeek}
              size="sm"
              variant="ghost"
              className="text-stone-400 hover:text-red-500 hover:bg-red-50"
              title="Clear entire week"
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Clear Week
            </Button>
            <Button
              onClick={() => setShowImport(true)}
              size="sm"
              variant="outline"
              className="border-[#d4a5a5] text-[#d4a5a5] hover:bg-[#fdf0ee]"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Import from Image
            </Button>
            <Button
              onClick={() => setShowAiPlan(true)}
              size="sm"
              className="bg-gradient-to-r from-[#d4a5a5] to-[#c8a0d0] hover:from-[#c49090] hover:to-[#b890c0] text-white"
            >
              <Wand2 className="w-4 h-4 mr-2" /> AI Plan Week
            </Button>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      {currentMenu ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentMenu.days.map((dayData, dayIndex) => {
            const dayDate = dayData.date ? utcDay(dayData.date) : null
            const isToday = !!todayStr && dayDate?.toDateString() === todayStr
            const totalItems = dayData.menuItems.length + dayData.comboItems.length

            return (
              <Card key={dayData.id ?? dayData.dayOfWeek} className={isToday ? 'border-[#e8d5d0] shadow-sm' : ''}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className={isToday ? 'text-[#d4a5a5]' : ''}>
                      {dayNameFromDate(dayData.date, dayData.dayOfWeek)}{isToday && <span className="text-xs ml-1 font-normal">(Today)</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      {totalItems > 0 && (
                        <>
                          <span className="text-xs font-normal" style={{ color: '#a8a29e' }}>
                            {totalItems} item{totalItems !== 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={() => clearDay(dayData.id)}
                            className="text-stone-200 hover:text-red-400 transition-colors"
                            title="Clear this day"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      {dayDate && (
                        <span className="text-xs text-stone-400 font-normal">
                          {format(dayDate, 'MMM d')}
                        </span>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {dayData.menuItems.map(mi => (
                    <div key={mi.menuItem.id} className="bg-[#fdf0ee] rounded-lg px-2 py-1.5 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setInspiredItem({ id: mi.menuItem.id, name: mi.menuItem.name })}
                          className="flex items-center gap-1.5 min-w-0 text-left flex-1 hover:opacity-80 active:scale-95 transition-transform"
                          title="Get recipe inspiration"
                        >
                          <span className="font-medium truncate">{mi.menuItem.name}</span>
                          <span className="text-[10px] flex-shrink-0" style={{ color: '#d4a5a5' }}>✦</span>
                          {!mi.menuItem.ingredients && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: '#fdf0ee', color: '#e28a93', border: '1px solid #e8d5d0' }}>
                              No ingredients
                            </span>
                          )}
                        </button>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <span className="text-stone-400 text-xs">{formatCurrency(mi.menuItem.salePrice ?? mi.menuItem.price)}</span>
                          <button onClick={() => removeItemFromDay(dayData.id, mi.menuItem.id, null)} className="text-stone-200 hover:text-red-400 ml-1">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-stone-400">Qty:</span>
                        <button
                          onClick={() => updateItemQuantity(dayData.id, mi.menuItem.id, null, mi.quantity - 1)}
                          className="w-5 h-5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center text-xs"
                          disabled={mi.quantity <= 1}
                        >−</button>
                        <span className="text-xs font-medium w-6 text-center">{mi.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(dayData.id, mi.menuItem.id, null, mi.quantity + 1)}
                          className="w-5 h-5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center text-xs"
                        >+</button>
                      </div>
                    </div>
                  ))}
                  {dayData.comboItems.map(ci => (
                    <div key={ci.comboItem.id} className="bg-amber-50 rounded-lg px-2 py-1.5 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{ci.comboItem.name}</span>
                          <Badge className="ml-1 text-xs bg-amber-100 text-amber-700 py-0">Combo</Badge>
                        </div>
                        <button onClick={() => removeItemFromDay(dayData.id, null, ci.comboItem.id)} className="text-stone-200 hover:text-red-400 ml-2">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-stone-400">Qty:</span>
                        <button
                          onClick={() => updateItemQuantity(dayData.id, null, ci.comboItem.id, ci.quantity - 1)}
                          className="w-5 h-5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center text-xs"
                          disabled={ci.quantity <= 1}
                        >−</button>
                        <span className="text-xs font-medium w-6 text-center">{ci.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(dayData.id, null, ci.comboItem.id, ci.quantity + 1)}
                          className="w-5 h-5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center text-xs"
                        >+</button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setAddingToDayIndex(dayIndex)}
                    className="w-full text-xs text-stone-400 hover:text-[#d4a5a5] border border-dashed border-stone-200 hover:border-[#e8d5d0] rounded-lg py-2 transition-colors"
                  >
                    + Add item
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border">
          <p className="text-stone-400 mb-4">No plan yet. Create one to get started.</p>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-[#d4a5a5] hover:bg-[#c49090] text-white">
            Create a Plan
          </Button>
        </div>
      )}

      {/* Add / Remove Items for Day Dialog */}
      <Dialog open={addingToDayIndex !== null} onOpenChange={() => setAddingToDayIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addingToDayIndex !== null ? dayNameFromDate(currentMenu?.days[addingToDayIndex]?.date, currentMenu?.days[addingToDayIndex]?.dayOfWeek ?? '') : ''} — Manage Items
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {menuItems.length === 0 ? (
              <p className="text-stone-500 text-sm">No menu items yet. Create some first.</p>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-stone-700 mb-2">Menu Items</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {menuItems.map(item => {
                      const dayData = addingToDayIndex !== null ? currentMenu?.days[addingToDayIndex] : null
                      const isAdded = dayData?.menuItems.some(mi => mi.menuItem.id === item.id) ?? false
                      return (
                        <div key={item.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${isAdded ? 'bg-[#fdf0ee] border-[#e8d5d0]' : 'bg-white'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={isAdded ? 'font-medium' : ''}>{item.name}</span>
                            {!item.ingredients && <span className="text-[10px] text-[#e28a93] flex-shrink-0">· needs ingredients</span>}
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <span className="text-stone-400">{formatCurrency(item.salePrice ?? item.price)}</span>
                            {isAdded ? (
                              <button
                                onClick={() => removeItemFromDay(dayData?.id, item.id, null)}
                                className="text-xs text-red-400 hover:text-red-600 font-medium"
                              >
                                Remove
                              </button>
                            ) : (
                              <button
                                onClick={() => addItemToDay(addingToDayIndex!, item.id, null)}
                                className="text-xs text-[#d4a5a5] hover:text-[#b08080] font-medium"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {comboItems.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-stone-700 mb-2">Combos</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {comboItems.map(combo => {
                        const dayData = addingToDayIndex !== null ? currentMenu?.days[addingToDayIndex] : null
                        const isAdded = dayData?.comboItems.some(ci => ci.comboItem.id === combo.id) ?? false
                        return (
                          <div key={combo.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${isAdded ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
                            <span className={isAdded ? 'font-medium' : ''}>{combo.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-stone-400">{formatCurrency(combo.comboPrice)}</span>
                              {isAdded ? (
                                <button
                                  onClick={() => removeItemFromDay(dayData?.id, null, combo.id)}
                                  className="text-xs text-red-400 hover:text-red-600 font-medium"
                                >
                                  Remove
                                </button>
                              ) : (
                                <button
                                  onClick={() => addItemToDay(addingToDayIndex!, null, combo.id)}
                                  className="text-xs text-[#d4a5a5] hover:text-[#b08080] font-medium"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Import from Image Dialog */}
      <Dialog open={showImport} onOpenChange={v => { if (!v) { setShowImport(false); setImportImage(null); setImportPlan(null) } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#d4a5a5]" />
              Import Plan from Image
            </DialogTitle>
          </DialogHeader>

          {/* Step 1 — upload */}
          {!importPlan && (
            <div className="space-y-4 pt-1">
              <p className="text-sm text-stone-500">
                Upload a photo of your handwritten menu, whiteboard, or printed plan. Claude will extract the dishes per day and add them to this week.
              </p>

              {importImage ? (
                <div className="relative rounded-xl overflow-hidden border border-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={importImage.previewUrl} alt="Menu to import" className="w-full max-h-56 object-contain bg-stone-50" />
                  <button
                    type="button"
                    onClick={() => { setImportImage(null); if (importImageRef.current) importImageRef.current.value = '' }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => importImageRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-200 hover:border-[#d4a5a5] rounded-xl py-10 text-stone-400 hover:text-[#d4a5a5] transition-colors"
                >
                  <Sparkles className="w-8 h-8" />
                  <span className="font-medium">Click to upload menu image</span>
                  <span className="text-xs">JPG, PNG, WEBP — max 10 MB</span>
                </button>
              )}
              <input
                ref={importImageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImportImageChange}
              />

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShowImport(false)}>Cancel</Button>
                <Button
                  className="flex-1 bg-[#d4a5a5] hover:bg-[#c49090] text-white"
                  disabled={!importImage || importAnalyzing}
                  onClick={analyzeImportImage}
                >
                  {importAnalyzing
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</>
                    : <><Sparkles className="w-4 h-4 mr-2" /> Analyze Menu</>
                  }
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — review extracted plan */}
          {importPlan && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-stone-700">Review extracted plan</p>
                <button
                  type="button"
                  onClick={() => setImportPlan(null)}
                  className="text-xs text-stone-400 hover:text-stone-600 underline"
                >
                  ← Re-upload
                </button>
              </div>

              {importPlan.notes && (
                <p className="text-xs text-stone-400 italic">{importPlan.notes}</p>
              )}

              <div className="space-y-3">
                {importPlan.days.map((day, di) => (
                  <div key={day.dayOfWeek} className="border rounded-xl overflow-hidden">
                    <div className="bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600 uppercase tracking-wide">
                      {day.dayOfWeek}
                    </div>
                    <div className="divide-y">
                      {day.items.map((item, ii) => (
                        <label key={ii} className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${item.selected ? 'bg-white' : 'bg-stone-50 opacity-50'}`}>
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => setImportPlan(prev => {
                              if (!prev) return prev
                              const days = prev.days.map((d, dIdx) =>
                                dIdx !== di ? d : {
                                  ...d,
                                  items: d.items.map((it, iIdx) =>
                                    iIdx !== ii ? it : { ...it, selected: !it.selected }
                                  ),
                                }
                              )
                              return { ...prev, days }
                            })}
                            className="mt-0.5 accent-[#d4a5a5] flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-stone-800">{item.name}</span>
                              {item.isCombo && (
                                <Badge className="text-[10px] bg-amber-100 text-amber-700 py-0">Combo</Badge>
                              )}
                              {item.estimatedPrice != null && (
                                <span className="text-xs text-stone-400">{formatCurrency(item.estimatedPrice)}</span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-stone-400 mt-0.5 truncate">{item.description}</p>
                            )}
                            {item.isCombo && item.comboComponents?.length ? (
                              <p className="text-xs text-stone-400 mt-0.5">
                                Includes: {item.comboComponents.join(', ')}
                              </p>
                            ) : null}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {importPlan.days.every(d => d.items.every(i => !i.selected)) && (
                <p className="text-sm text-amber-600 text-center">Select at least one item to import.</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => { setShowImport(false); setImportImage(null); setImportPlan(null) }}>Cancel</Button>
                <Button
                  className="flex-1 bg-[#d4a5a5] hover:bg-[#c49090] text-white"
                  disabled={importApplying || importPlan.days.every(d => d.items.every(i => !i.selected))}
                  onClick={applyImportPlan}
                >
                  {importApplying
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing…</>
                    : <><Plus className="w-4 h-4 mr-2" /> Import to Week</>
                  }
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Plan Dialog */}
      <Dialog open={showAiPlan} onOpenChange={v => { if (!v) { setShowAiPlan(false); setAiImage(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-[#d4a5a5]" />
              AI Plan This Week
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <p className="text-sm text-stone-500">
              Claude will generate a varied weekly menu using your existing items{seller.cuisineType ? ` (${seller.cuisineType})` : ''}, creating new items or combos where needed. Previous 4 weeks are checked to keep meals fresh.
            </p>

            <div className="space-y-2">
              <Label>Inspiration / special requests <span className="text-stone-400 font-normal">(optional)</span></Label>
              <Textarea
                placeholder={`e.g. "Focus on lighter meals this week" or "Add a festive theme for the weekend"`}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Reference image <span className="text-stone-400 font-normal">(optional)</span></Label>
              {aiImage ? (
                <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={aiImage.previewUrl} alt="Inspiration" className="w-full max-h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setAiImage(null); if (aiImageInputRef.current) aiImageInputRef.current.value = '' }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => aiImageInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-1.5 border border-dashed border-stone-200 hover:border-[#d4a5a5] rounded-lg py-4 text-stone-400 hover:text-[#d4a5a5] transition-colors text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Upload a handwritten menu, food photo, or reference image</span>
                  <span className="text-xs">JPG, PNG, WEBP — max 10 MB</span>
                </button>
              )}
              <input
                ref={aiImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAiImageChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Items per day</Label>
                <div className="flex gap-1">
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAiItemsPerDay(n)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        aiItemsPerDay === n
                          ? 'bg-[#d4a5a5] text-white border-[#d4a5a5]'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Include combos</Label>
                <div className="flex gap-1">
                  {([false, true] as const).map(v => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() => setAiIncludeCombo(v)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        aiIncludeCombo === v
                          ? 'bg-[#d4a5a5] text-white border-[#d4a5a5]'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {v ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {aiIncludeCombo && (
              <div className="space-y-2">
                <Label>Combo size</Label>
                <div className="flex gap-2">
                  {[2, 3].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAiComboSize(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        aiComboSize === n
                          ? 'bg-[#d4a5a5] text-white border-[#d4a5a5]'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {n}-item combo
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowAiPlan(false)} disabled={aiGenerating}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-[#d4a5a5] to-[#c8a0d0] hover:from-[#c49090] hover:to-[#b890c0] text-white"
                onClick={generateAiPlan}
                disabled={aiGenerating}
              >
                {aiGenerating
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                  : <><Wand2 className="w-4 h-4 mr-2" /> Generate Plan</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Combo Form Dialog */}
      <Dialog open={showComboForm} onOpenChange={v => { if (!v) { setShowComboForm(false); setComboSelectedItems([]) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#d4a5a5]" />
              Create Combo Meal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Combo Name *</Label>
              <Input
                placeholder="e.g. Biryani Combo, Family Feast"
                value={comboName}
                onChange={e => setComboName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description..."
                value={comboDescription}
                onChange={e => setComboDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Combo Price ($) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 18.99"
                value={comboPrice}
                onChange={e => setComboPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Select Items (min. 2) *</Label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border rounded-lg p-2">
                {menuItems.length === 0 ? (
                  <p className="text-sm text-stone-400 p-2">No menu items yet. Create items first.</p>
                ) : menuItems.map(item => {
                  const selected = comboSelectedItems.includes(item.id)
                  return (
                    <label key={item.id} className={`flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${selected ? 'bg-[#fdf0ee]' : 'hover:bg-stone-50'}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => setComboSelectedItems(prev =>
                          selected ? prev.filter(id => id !== item.id) : [...prev, item.id]
                        )}
                        className="accent-[#d4a5a5]"
                      />
                      <span className="flex-1 text-sm">{item.name}</span>
                      <span className="text-xs text-stone-400">{formatCurrency(item.salePrice ?? item.price)}</span>
                    </label>
                  )
                })}
              </div>
              {comboSelectedItems.length > 0 && (
                <p className="text-xs text-stone-500">{comboSelectedItems.length} item{comboSelectedItems.length > 1 ? 's' : ''} selected</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setShowComboForm(false); setComboSelectedItems([]) }} disabled={savingCombo}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#d4a5a5] hover:bg-[#c49090] text-white"
                onClick={saveCombo}
                disabled={savingCombo || comboSelectedItems.length < 2 || !comboName.trim() || !comboPrice}
              >
                {savingCombo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Combo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Menu Item Form */}
      <Dialog open={showItemForm} onOpenChange={setShowItemForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <MenuItemForm
            sellerId={seller.id}
            cuisineType={seller.cuisineType}
            onSuccess={newItem => {
              setMenuItems(prev => [...prev, newItem])
              setShowItemForm(false)
              toast.success('Menu item created!')
            }}
            onCancel={() => setShowItemForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog */}
      <DateRangeDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="New Plan"
        initialStart={defaultStart()}
        initialEnd={defaultEnd()}
        saving={saving}
        onSave={createMenu}
      />

      {/* Edit Dates Dialog */}
      <DateRangeDialog
        open={editingMenuIndex !== null}
        onClose={() => setEditingMenuIndex(null)}
        title="Edit Dates"
        initialStart={editStart}
        initialEnd={editEnd}
        saving={saving}
        onSave={(s, e) => editingMenuIndex !== null && updateMenuDates(editingMenuIndex, s, e)}
      />

      {/* Grocery List Sheet */}
      {weeklyMenus.length > 0 && (
        <GroceryList
          menus={weeklyMenus.map(m => ({ id: m.id, label: menuLabel(m) }))}
          initialMenuId={currentMenu?.id ?? weeklyMenus[0].id}
          open={showGroceryList}
          onClose={() => setShowGroceryList(false)}
        />
      )}

      {/* Dish Inspiration Sheet */}
      <DishInspiration
        item={inspiredItem}
        seller={seller}
        open={!!inspiredItem}
        onClose={() => setInspiredItem(null)}
      />

      {/* Hidden flyer canvas — always in DOM so ref is ready */}
      <div style={{ position: 'fixed', left: -9999, top: -9999, pointerEvents: 'none', zIndex: -1 }}>
        <FlyerCanvas
          ref={flyerRef}
          storeName={seller.storeName}
          storeUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/s/${seller.storeSlug}`}
          cuisineType={seller.cuisineType}
          bio={seller.bio}
          weekLabel={currentMenu ? menuLabel(currentMenu) : ''}
          days={flyerDays}
        />
      </div>

      {/* Flyer Modal */}
      <Dialog open={showFlyerModal} onOpenChange={setShowFlyerModal}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
            {flyerDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={flyerDataUrl} alt="Weekly menu flyer" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => setShowFlyerModal(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3 bg-white">
            <p className="text-xs text-stone-500">Download and share with your customers on WhatsApp, Instagram, or Stories.</p>
            <div className="flex gap-2">
              <a
                href={flyerDataUrl ?? '#'}
                download={`${seller.storeName.replace(/\s+/g, '-')}-menu-flyer.png`}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border border-stone-200 hover:bg-stone-50 transition-colors text-stone-700"
              >
                <Download className="w-4 h-4" /> Download
              </a>
              <button
                onClick={() => {
                  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                  const storeUrl = `${appUrl}/s/${seller.storeSlug}`
                  const text = encodeURIComponent(
                    `🍽️ *${seller.storeName}* — This week's menu is live!\n\nOrder here → ${storeUrl}`
                  )
                  window.open(`https://wa.me/?text=${text}`, '_blank')
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium text-white"
                style={{ background: '#25D366' }}
              >
                <MessageCircle className="w-4 h-4" /> Share on WhatsApp
              </button>
              <button
                onClick={async () => {
                  setGeneratingFlyer(true)
                  try {
                    const dataUrl = await captureFlyer()
                    if (!dataUrl) throw new Error()
                    setFlyerDataUrl(dataUrl)
                  } catch {
                    toast.error('Could not regenerate flyer')
                  } finally {
                    setGeneratingFlyer(false)
                  }
                }}
                disabled={generatingFlyer}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border border-stone-200 hover:bg-stone-50 transition-colors text-stone-700 disabled:opacity-50"
              >
                {generatingFlyer ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
