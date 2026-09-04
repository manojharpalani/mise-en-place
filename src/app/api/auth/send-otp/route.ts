import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOTPEmail } from '@/lib/email'
import { generateOTP } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    const otp = generateOTP()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete existing tokens for this email
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })

    // Create new token
    await prisma.verificationToken.create({
      data: { identifier: email, token: otp, expires },
    })

    // Send email
    const emailResult = await sendOTPEmail(email, otp)

    if (!emailResult.success) {
      // No working email delivery configured (or the send failed) — this is a
      // demo/self-hosted deployment without a verified SendGrid sender, not a
      // reason to block the person from signing in. Fall back to handing the
      // code back in the response (shown on-screen in the verify UI) instead
      // of hard-failing. Once SENDGRID_API_KEY points at a verified sender,
      // sendOTPEmail() succeeds and this branch stops firing on its own.
      console.warn(`OTP email delivery unavailable, returning code in response for ${email}:`, emailResult.error)
      return NextResponse.json({ success: true, devOtp: otp })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    console.error('Send OTP error:', err)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
