'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Loader2, CalendarDays, CheckCircle, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { slugify } from '@/lib/utils'
import { displayUrl } from '@/lib/site'

const schema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Profile URL must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  bio: z.string().optional(),
  cuisinePrefs: z.string().optional(), // comma-separated, parsed before submit
  householdSize: z.number().int().min(1).max(20),
  isPublic: z.boolean(),
})

type FormData = z.infer<typeof schema>

const STEPS = [
  { label: 'Your Profile', description: 'Name & URL' },
  { label: 'Preferences', description: 'Household & cuisine' },
  { label: 'Done', description: 'Review & finish' },
]

export default function PlannerOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { householdSize: 1, isPublic: false },
  })

  const displayName = watch('displayName')
  const isPublic = watch('isPublic')

  const handleDisplayNameBlur = () => {
    if (displayName && !watch('slug')) {
      setValue('slug', slugify(displayName))
    }
  }

  const nextStep = async () => {
    const fields: (keyof FormData)[] =
      step === 0 ? ['displayName', 'slug'] : ['householdSize']
    const valid = await trigger(fields)
    if (valid) setStep(step + 1)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/planner/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: data.displayName,
          slug: data.slug,
          bio: data.bio || undefined,
          cuisinePrefs: data.cuisinePrefs
            ? data.cuisinePrefs
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          householdSize: data.householdSize,
          isPublic: data.isPublic,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create profile')
      }

      setDone(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7e9de] to-white px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-[#f7e9de] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-[#c1622d]" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">You&apos;re all set!</h2>
          <p className="text-muted-foreground mb-6">
            Your meal planning profile is ready. Start planning your week.
          </p>
          <Button onClick={() => router.push('/planner/dashboard')} className="bg-[#c1622d] hover:bg-[#a64f20]">
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7e9de] to-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-foreground">
            <Heart className="w-7 h-7 text-[#c1622d] fill-[#c1622d]" />
            Mise en Place
          </Link>
          <div className="mt-4">
            <CalendarDays className="w-10 h-10 text-[#c1622d] mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-foreground">Set Up Your Meal Planner</h1>
            <p className="text-muted-foreground mt-1">Plan your week, build your grocery list</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            {STEPS.map((s, i) => (
              <span key={s.label} className={`font-medium ${i <= step ? 'text-[#c1622d]' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            ))}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 0 && (
            <Card>
              <CardHeader><CardTitle>Your Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Display Name *</Label>
                  <Input
                    placeholder="e.g. The Sharma Family"
                    {...register('displayName')}
                    onBlur={handleDisplayNameBlur}
                  />
                  {errors.displayName && <p className="text-sm text-red-500">{errors.displayName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Profile URL *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{displayUrl('/u/')}</span>
                    <Input placeholder="sharma-family" {...register('slug')} />
                  </div>
                  {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Bio <span className="text-muted-foreground">(optional)</span></Label>
                  <Textarea
                    rows={3}
                    placeholder="A few words about your household and what you like to cook..."
                    {...register('bio')}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Household Size *</Label>
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
                  <Input
                    placeholder="e.g. Indian, Mexican, Italian"
                    {...register('cuisinePrefs')}
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated — helps with AI suggestions</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Public Profile</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Let others follow your meal plans at {displayUrl('/u/')}{watch('slug') || '…'}
                    </p>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={(v) => setValue('isPublic', v)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader><CardTitle>Review & Finish</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{watch('displayName')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">URL</span>
                    <span className="font-medium">{displayUrl('/u/')}{watch('slug')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Household</span>
                    <span className="font-medium">{watch('householdSize')} {Number(watch('householdSize')) === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profile</span>
                    <span className="font-medium">{watch('isPublic') ? 'Public' : 'Private'}</span>
                  </div>
                  {watch('cuisinePrefs') && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cuisine</span>
                      <span className="font-medium">{watch('cuisinePrefs')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between mt-6">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button type="button" onClick={nextStep} className="ml-auto bg-[#c1622d] hover:bg-[#a64f20]">
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={loading} className="ml-auto bg-[#c1622d] hover:bg-[#a64f20]">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Finish Setup
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
