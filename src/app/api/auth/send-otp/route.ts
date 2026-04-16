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
    await sendOTPEmail(email, otp)

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    console.error('Send OTP error:', err)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
