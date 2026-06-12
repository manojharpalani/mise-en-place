import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOTPEmail } from '@/lib/email'
import { generateOTP } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['BUYER', 'SELLER', 'PLANNER']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, role } = schema.parse(body)

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Account already exists. Please sign in.' }, { status: 409 })
    }

    // Create user
    await prisma.user.create({
      data: { name, email, role },
    })

    // Send OTP
    const otp = generateOTP()
    const expires = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    await prisma.verificationToken.create({
      data: { identifier: email, token: otp, expires },
    })

    const emailResult = await sendOTPEmail(email, otp)

    if (!emailResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] OTP for ${email}: ${otp}`)
        return NextResponse.json({ success: true, devOtp: otp })
      } else {
        console.error('Failed to send OTP email:', emailResult.error)
        return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
