import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, neighborhood, zip, phone, notificationChannel } = body

  // Phone uniqueness check
  if (phone) {
    const existing = await prisma.user.findFirst({
      where: { phone, NOT: { id: session.user.id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Phone number already in use' }, { status: 409 })
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      neighborhood,
      zip,
      ...(phone !== undefined && { phone: phone || null }),
      ...(notificationChannel !== undefined && { notificationChannel }),
    },
  })

  return NextResponse.json(updated)
}
