'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, ChefHat, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { slugify } from '@/lib/utils'

const schema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  storeSlug: z.string().min(2, 'URL must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  cuisineType: z.string().min(1, 'Cuisine type required'),
  bio: z.string().min(10, 'Tell us more about your food (min 10 characters)'),
})

type FormData = z.infer<typeof schema>

const STEPS = [
  { label: 'Store Info', description: 'Name & identity' },
  { label: 'Your Story', description: 'Bio & cuisine' },
  { label: 'Submit', description: 'Review & submit' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const storeName = watch('storeName')

  const handleStoreNameBlur = () => {
    if (storeName && !watch('storeSlug')) {
      setValue('storeSlug', slugify(storeName))
    }
  }

  const nextStep = async () => {
    const fieldsToValidate: (keyof FormData)[] =
      step === 0 ? ['storeName', 'storeSlug'] : ['cuisineType', 'bio']
    const valid = await trigger(fieldsToValidate)
    if (valid) setStep(step + 1)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create store')
      }

      setSubmitted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create store')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-[#fdf0ee] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9 text-[#d4a5a5]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Store Created!</h2>
        <p className="text-gray-600 mb-2">
          Your store has been submitted for review. We&apos;ll approve it within 24-48 hours.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          In the meantime, you can set up your menu, add items, and configure your settings.
        </p>
        <Button onClick={() => router.push('/seller/dashboard')} className="bg-[#d4a5a5] hover:bg-[#c49090]">
          Go to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <ChefHat className="w-12 h-12 text-[#d4a5a5] mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">Set Up Your Store</h1>
        <p className="text-gray-500 mt-1">Let&apos;s get your kitchen on WithMetta</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          {STEPS.map((s, i) => (
            <span key={s.label} className={`font-medium ${i <= step ? 'text-[#d4a5a5]' : 'text-gray-400'}`}>
              {s.label}
            </span>
          ))}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 0 && (
          <Card>
            <CardHeader><CardTitle>Store Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Store Name *</Label>
                <Input
                  placeholder="e.g. Maria's Kitchen"
                  {...register('storeName')}
                  onBlur={handleStoreNameBlur}
                />
                {errors.storeName && <p className="text-sm text-red-500">{errors.storeName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Store URL *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap">withmetta.com/s/</span>
                  <Input placeholder="marias-kitchen" {...register('storeSlug')} />
                </div>
                {errors.storeSlug && <p className="text-sm text-red-500">{errors.storeSlug.message}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>About Your Food</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cuisine Type *</Label>
                <Input placeholder="e.g. South Indian, Mexican, Fusion..." {...register('cuisineType')} />
                {errors.cuisineType && <p className="text-sm text-red-500">{errors.cuisineType.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Your Bio *</Label>
                <Textarea
                  rows={5}
                  placeholder="Tell customers about yourself and your food. What makes your cooking special? What's your background?"
                  {...register('bio')}
                />
                {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader><CardTitle>Review & Submit</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Store Name</span>
                  <span className="font-medium">{watch('storeName')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">URL</span>
                  <span className="font-medium">withmetta.com/s/{watch('storeSlug')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cuisine</span>
                  <span className="font-medium">{watch('cuisineType')}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                After submitting, your store will be reviewed by our team within 24-48 hours.
                You&apos;ll be notified when approved.
              </p>
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
            <Button type="button" onClick={nextStep} className="ml-auto bg-[#d4a5a5] hover:bg-[#c49090]">
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={loading} className="ml-auto bg-[#d4a5a5] hover:bg-[#c49090]">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit for Review
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
