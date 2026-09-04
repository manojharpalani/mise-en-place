'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  salePrice: z.coerce.number().positive().optional(),
  dietaryTags: z.string().optional(),
  allergenTags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface MenuItemFormProps {
  sellerId: string
  cuisineType?: string | null
  editItem?: {
    id: number
    name: string
    description?: string | null
    price: number
    salePrice?: number | null
    dietaryTags?: string[]
    allergenTags?: string[]
    photoUrl?: string | null
  }
  onSuccess: (item: {
    id: number
    name: string
    price: number
    salePrice?: number | null
    photoUrl?: string | null
    dietaryTags?: string[]
  }) => void
  onCancel: () => void
}

export function MenuItemForm({ sellerId, cuisineType, editItem, onSuccess, onCancel }: MenuItemFormProps) {
  const [loading, setLoading] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [thumbnail, setThumbnail] = useState<string | null>(editItem?.photoUrl ?? null)
  const [suggesting, setSuggesting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: editItem
      ? {
          name: editItem.name,
          description: editItem.description || '',
          price: editItem.price,
          salePrice: editItem.salePrice ?? undefined,
          dietaryTags: editItem.dietaryTags?.join(', ') || '',
          allergenTags: editItem.allergenTags?.join(', ') || '',
        }
      : {},
  })

  const nameValue = watch('name')

  // Debounced suggestion fetch on name change (new items only)
  useEffect(() => {
    if (editItem) return
    if (!nameValue || nameValue.trim().length < 3) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSuggesting(true)
      try {
        const params = new URLSearchParams({ name: nameValue.trim() })
        if (cuisineType) params.set('cuisine', cuisineType)
        const res = await fetch(`/api/menu-items/suggest?${params}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.description) {
          const current = watch('description')
          if (!current?.trim()) setValue('description', data.description)
        }
        if (data.thumbnailUrl) {
          setThumbnail(data.thumbnailUrl)
        }
      } catch {
        // silent
      } finally {
        setSuggesting(false)
      }
    }, 800)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameValue])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        price: data.price,
        salePrice: data.salePrice || null,
        dietaryTags: data.dietaryTags ? data.dietaryTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        allergenTags: data.allergenTags ? data.allergenTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isActive,
        sellerId,
        ...(thumbnail ? { photoUrl: thumbnail } : {}),
      }

      const url = editItem ? `/api/menu-items/${editItem.id}` : '/api/menu-items'
      const method = editItem ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save item')
      }

      const item = await res.json()
      onSuccess(item)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <div className="space-y-2">
        <Label>Item Name *</Label>
        <div className="relative">
          <Input placeholder="e.g. Homemade Biryani" {...register('name')} />
          {suggesting && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-[#c1622d]">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>Finding image…</span>
            </div>
          )}
        </div>
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* Thumbnail preview */}
      {thumbnail && (
        <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border">
          <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-stone-100">
            <Image
              src={thumbnail}
              alt="Dish thumbnail"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-stone-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#c1622d]" />
              Suggested thumbnail
            </p>
            <p className="text-xs text-stone-400 mt-0.5">Will be saved with the item</p>
          </div>
          <button
            type="button"
            onClick={() => setThumbnail(null)}
            className="text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea placeholder="Describe the dish..." rows={3} {...register('description')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Price ($) *</Label>
          <Input type="number" step="0.01" placeholder="12.99" {...register('price')} />
          {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Sale Price ($)</Label>
          <Input type="number" step="0.01" placeholder="Optional" {...register('salePrice')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Dietary Tags</Label>
        <Input placeholder="vegan, gluten-free, halal (comma-separated)" {...register('dietaryTags')} />
        <p className="text-xs text-muted-foreground">Examples: vegan, vegetarian, gluten-free, halal, kosher</p>
      </div>

      <div className="space-y-2">
        <Label>Allergen Tags</Label>
        <Input placeholder="nuts, dairy, gluten (comma-separated)" {...register('allergenTags')} />
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={isActive} onCheckedChange={setIsActive} id="isActive" />
        <Label htmlFor="isActive">Active (visible on store)</Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="bg-[#c1622d] hover:bg-[#a64f20] flex-1" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {editItem ? 'Update Item' : 'Create Item'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
