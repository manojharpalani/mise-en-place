import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  sellerId: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Verify seller
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: data.sellerId, userId: session.user.id },
    })
    if (!seller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Find or create user
    let inviteUser = await prisma.user.findUnique({ where: { email: data.email } })
    if (!inviteUser) {
      inviteUser = await prisma.user.create({
        data: { email: data.email, role: 'EMPLOYEE' },
      })
    }

    // Check if already employee
    const existing = await prisma.employee.findFirst({
      where: { sellerId: data.sellerId, userId: inviteUser.id },
    })
    if (existing) return NextResponse.json({ error: 'Already an employee' }, { status: 409 })

    const employee = await prisma.employee.create({
      data: {
        sellerId: data.sellerId,
        userId: inviteUser.id,
        inviteEmail: data.email,
      },
      include: { user: { select: { name: true, email: true } } },
    })

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await sendEmail({
      to: data.email,
      subject: `You've been invited to manage ${seller.storeName} on Mise en Place`,
      html: `
        <p>Hi!</p>
        <p>You've been invited to manage orders for <strong>${seller.storeName}</strong> on Mise en Place.</p>
        <p><a href="${appUrl}/auth/signin">Click here to sign in</a></p>
      `,
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to invite employee' }, { status: 500 })
  }
}
