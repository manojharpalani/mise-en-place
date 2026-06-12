'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, UtensilsCrossed, Loader2 } from 'lucide-react'

interface DishItem {
  id: number
  name: string
  description: string | null
  servings: number
  photoUrl: string | null
  cuisineTags: string[]
  dietaryTags: string[]
}

interface FormState {
  name: string
  description: string
  servings: number
  photoUrl: string
  cuisineTags: string
  dietaryTags: string
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  servings: 1,
  photoUrl: '',
  cuisineTags: '',
  dietaryTags: '',
}

function parseTags(s: string): string[] {
  return s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export function DishLibraryClient({ initialItems }: { initialItems: DishItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DishItem | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (item: DishItem) => {
    setEditing(item)
    setForm({
      name: item.name,
      description: item.description ?? '',
      servings: item.servings,
      photoUrl: item.photoUrl ?? '',
      cuisineTags: item.cuisineTags.join(', '),
      dietaryTags: item.dietaryTags.join(', '),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        servings: form.servings,
        photoUrl: form.photoUrl.trim() || undefined,
        cuisineTags: parseTags(form.cuisineTags),
        dietaryTags: parseTags(form.dietaryTags),
      }

      if (editing) {
        const res = await fetch(`/api/planner/menu-items/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const { item } = await res.json()
        setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
        toast.success('Dish updated')
      } else {
        const res = await fetch('/api/planner/menu-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const { item } = await res.json()
        setItems((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
        toast.success('Dish added')
      }

      setDialogOpen(false)
    } catch {
      toast.error('Failed to save dish')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this dish from your library?')) return
    try {
      const res = await fetch(`/api/planner/menu-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Dish removed')
    } catch {
      toast.error('Failed to remove dish')
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search dishes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openNew} className="bg-[#d4a5a5] hover:bg-[#c49090] ml-auto gap-1.5">
          <Plus className="w-4 h-4" /> Add Dish
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-30" />
          {search ? (
            <p>No dishes match &ldquo;{search}&rdquo;</p>
          ) : (
            <>
              <p className="font-medium">No dishes yet</p>
              <p className="text-sm mt-1 mb-5">Add your favourite dishes to start planning meals</p>
              <Button onClick={openNew} className="bg-[#d4a5a5] hover:bg-[#c49090] gap-1.5">
                <Plus className="w-4 h-4" /> Add your first dish
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              {item.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="w-full h-36 object-cover rounded-t-xl"
                />
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {item.servings} {item.servings === 1 ? 'serving' : 'servings'}
                    </p>
                    {(item.cuisineTags.length > 0 || item.dietaryTags.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.cuisineTags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                        ))}
                        {item.dietaryTags.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs text-green-700 border-green-200">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Dish' : 'Add Dish'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dal Tadka"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-gray-400">(optional)</span></Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="A few words about the dish..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Servings</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={form.servings}
                onChange={(e) => setForm({ ...form, servings: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Photo URL <span className="text-gray-400">(optional)</span></Label>
              <Input
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cuisine Tags <span className="text-gray-400">(comma-separated)</span></Label>
              <Input
                value={form.cuisineTags}
                onChange={(e) => setForm({ ...form, cuisineTags: e.target.value })}
                placeholder="e.g. Indian, Vegetarian"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dietary Tags <span className="text-gray-400">(comma-separated)</span></Label>
              <Input
                value={form.dietaryTags}
                onChange={(e) => setForm({ ...form, dietaryTags: e.target.value })}
                placeholder="e.g. Vegan, Gluten-Free"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={saving}
              onClick={handleSave}
              className="bg-[#d4a5a5] hover:bg-[#c49090]"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Save Changes' : 'Add Dish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
