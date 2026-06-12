'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'

export function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const devOtp = searchParams.get('devOtp') || ''
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // In dev: auto-fill the OTP from the URL and show a banner
  useEffect(() => {
    if (devOtp && devOtp.length === 6) {
      setOtp(devOtp.split(''))
      toast.info(`Dev mode — OTP auto-filled: ${devOtp}`, { duration: 8000 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      inputs.current[index + 1]?.focus()
    }
    if (newOtp.every(Boolean) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (code: string) => {
    if (code.length !== 6) return
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        otp: code,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid or expired code. Please try again.')
        setOtp(['', '', '', '', '', ''])
        inputs.current[0]?.focus()
      } else {
        toast.success('Signed in successfully!')
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Failed to resend')
      const json = await res.json()
      if (json.devOtp) {
        setOtp(json.devOtp.split(''))
        toast.info(`Dev mode — new OTP: ${json.devOtp}`, { duration: 8000 })
      } else {
        toast.success('New code sent!')
        setOtp(['', '', '', '', '', ''])
        inputs.current[0]?.focus()
      }
    } catch {
      toast.error('Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf0ee] to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-gray-900">
            <Heart className="w-7 h-7 text-[#d4a5a5] fill-[#d4a5a5]" />
            WithMetta
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <div className="w-14 h-14 bg-[#fdf0ee] rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-7 h-7 text-[#d4a5a5]" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a 6-digit code to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 justify-center mb-6">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold"
                  disabled={loading}
                />
              ))}
            </div>

            <Button
              onClick={() => handleVerify(otp.join(''))}
              className="w-full bg-[#d4a5a5] hover:bg-[#c49090]"
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">Didn&apos;t receive it? </span>
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-[#d4a5a5] font-medium hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend code'}
              </button>
            </div>

            <div className="mt-3 text-center">
              <Link href="/auth/signin" className="text-sm text-gray-500 hover:underline">
                Use a different email
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
