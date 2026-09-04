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

      const json = await res.json()
      const verifyUrl = new URL('/auth/verify', window.location.origin)
      verifyUrl.searchParams.set('email', data.email)
      verifyUrl.searchParams.set('callbackUrl', callbackForRole(data.role))
      if (json.devOtp) verifyUrl.searchParams.set('devOtp', json.devOtp)
      router.push(verifyUrl.pathname + verifyUrl.search)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const roles: { value: FormData['role']; icon: React.ReactNode; label: string; description: string }[] = [
    {
      value: 'BUYER',
      icon: <ShoppingBag className={`w-8 h-8 ${selectedRole === 'BUYER' ? 'text-[#c1622d]' : 'text-muted-foreground'}`} />,
      label: 'Buy Food',
      description: 'Order from local chefs',
    },
    {
      value: 'SELLER',
      icon: <ChefHat className={`w-8 h-8 ${selectedRole === 'SELLER' ? 'text-[#c1622d]' : 'text-muted-foreground'}`} />,
      label: 'Sell Food',
      description: 'Start your home kitchen',
    },
    {
      value: 'PLANNER',
      icon: <CalendarDays className={`w-8 h-8 ${selectedRole === 'PLANNER' ? 'text-[#c1622d]' : 'text-muted-foreground'}`} />,
      label: 'Plan Meals',
      description: 'Weekly meal planner',
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7e9de] to-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-foreground">
            <Heart className="w-7 h-7 text-[#c1622d] fill-[#c1622d]" />
            Mise en Place
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
                          ? 'border-[#a64f20] bg-[#f7e9de]'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <RadioGroupItem value={value} className="sr-only" />
                      {icon}
                      <span className="font-medium text-sm">{label}</span>
                      <span className="text-xs text-muted-foreground text-center">{description}</span>
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

              <Button type="submit" className="w-full bg-[#c1622d] hover:bg-[#a64f20]" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-[#c1622d] font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
