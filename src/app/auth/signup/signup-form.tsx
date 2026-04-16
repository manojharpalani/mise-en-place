'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Heart, Loader2, ShoppingBag, ChefHat, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['BUYER', 'SELLER', 'PLANNER']),
})

type FormData = z.infer<typeof schema>

function callbackForRole(role: string) {
  if (role === 'SELLER') return '/seller/onboarding'
  if (role === 'PLANNER') return '/planner/onboarding'
  return '/'
}

export function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole =
    searchParams.get('role') === 'seller'
      ? 'SELLER'
      : searchParams.get('role') === 'planner'
      ? 'PLANNER'
      : 'BUYER'
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole as FormData['role'] },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create account')
      }

      router.push(
        `/auth/verify?email=${encodeURIComponent(data.email)}&callbackUrl=${encodeURIComponent(callbackForRole(data.role))}`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const roles: { value: FormData['role']; icon: React.ReactNode; label: string; description: string }[] = [
    {
      value: 'BUYER',
      icon: <ShoppingBag className={`w-8 h-8 ${selectedRole === 'BUYER' ? 'text-[#d4a5a5]' : 'text-gray-400'}`} />,
      label: 'Buy Food',
      description: 'Order from local chefs',
    },
    {
      value: 'SELLER',
      icon: <ChefHat className={`w-8 h-8 ${selectedRole === 'SELLER' ? 'text-[#d4a5a5]' : 'text-gray-400'}`} />,
      label: 'Sell Food',
      description: 'Start your home kitchen',
    },
    {
      value: 'PLANNER',
      icon: <CalendarDays className={`w-8 h-8 ${selectedRole === 'PLANNER' ? 'text-[#d4a5a5]' : 'text-gray-400'}`} />,
      label: 'Plan Meals',
      description: 'Weekly meal planner',
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf0ee] to-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-gray-900">
            <Heart className="w-7 h-7 text-[#d4a5a5] fill-[#d4a5a5]" />
            WithMetta
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Join the local food community today.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Role */}
              <div className="space-y-3">
                <Label>I want to...</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(v) => setValue('role', v as FormData['role'])}
                  className="grid grid-cols-3 gap-3"
                >
                  {roles.map(({ value, icon, label, description }) => (
                    <label
                      key={value}
                      className={`flex flex-col items-center gap-2 border-2 rounded-xl p-4 cursor-pointer transition-colors ${
                        selectedRole === value
                          ? 'border-[#e28a93] bg-[#fdf0ee]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value={value} className="sr-only" />
                      {icon}
                      <span className="font-medium text-sm">{label}</span>
                      <span className="text-xs text-gray-500 text-center">{description}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" type="text" placeholder="Your name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-[#d4a5a5] hover:bg-[#c49090]" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-[#d4a5a5] font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
