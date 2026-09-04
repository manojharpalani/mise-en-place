'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  displayName: z.string().min(2, 'At least 2 characters'),
  bio: z.string().optional(),
  cuisinePrefs: z.string().optional(),
  householdSize: z.number().int().min(1).max(20),
  isPublic: z.boolean(),
})

type FormData = z.infer<typeof schema>

export default function PlannerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { householdSize: 1, isPublic: false },
  })

  const isPublic = watch('isPublic')

  useEffect(() => {
    fetch('/api/planner/profile')
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile) {
          reset({
            displayName: profile.displayName,
            bio: profile.bio ?? '',
            cuisinePrefs: profile.cuisinePrefs?.join(', ') ?? '',
            householdSize: profile.householdSize,
            isPublic: profile.isPublic,
          })
        }
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [reset])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const res = await fetch('/api/planner/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: data.displayName,
          bio: data.bio || null,
          cuisinePrefs: data.cuisinePrefs
            ? data.cuisinePrefs.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          householdSize: data.householdSize,
          isPublic: data.isPublic,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#c1622d]" />
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Identity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input {...register('displayName')} />
              {errors.displayName && <p className="text-sm text-red-500">{errors.displayName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Bio <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea rows={3} {...register('bio')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Household Size</Label>
              <Input
                type="number"
                min={1}
                max={20}
                {...register('householdSize', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">Used to scale grocery quantities</p>
              {errors.householdSize && <p className="text-sm text-red-500">{errors.householdSize.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Cuisine Preferences <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. Indian, Mexican, Italian" {...register('cuisinePrefs')} />
              <p className="text-xs text-muted-foreground">Comma-separated</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Public Profile</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Others can follow your meal plans</p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={(v) => setValue('isPublic', v)}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="bg-[#c1622d] hover:bg-[#a64f20]">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </form>
    </div>
  )
}
