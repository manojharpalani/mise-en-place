import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const planner = await prisma.plannerProfile.findUnique({ where: { slug, isPublic: true } })
  if (!planner) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const session = await auth().catch(() => null)
  const body = await req.json().catch(() => ({}))
  const { email } = schema.parse(body)

  const userId = session?.user?.id ?? null

  // Check for duplicate
  if (userId) {
    const existing = await prisma.plannerSubscriber.findFirst({
      where: { plannerId: planner.id, userId },
    })
    if (existing) {
      if (existing.status === 'UNSUBSCRIBED') {
        await prisma.plannerSubscriber.update({ where: { id: existing.id }, data: { status: 'ACTIVE' } })
        return NextResponse.json({ ok: true })
      }
      return NextResponse.json({ error: 'Already following' }, { status: 409 })
    }
  } else if (email) {
    const existing = await prisma.plannerSubscriber.findFirst({
      where: { plannerId: planner.id, email },
    })
    if (existing) {
      if (existing.status === 'UNSUBSCRIBED') {
        await prisma.plannerSubscriber.update({ where: { id: existing.id }, data: { status: 'ACTIVE' } })
        return NextResponse.json({ ok: true })
      }
      return NextResponse.json({ error: 'Already following' }, { status: 409 })
    }
  }

  await prisma.plannerSubscriber.create({
    data: {
      plannerId: planner.id,
      userId,
      email: email ?? null,
      status: 'ACTIVE',
    },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planner = await prisma.plannerProfile.findUnique({ where: { slug } })
  if (!planner) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.plannerSubscriber.updateMany({
    where: { plannerId: planner.id, userId: session.user.id },
    data: { status: 'UNSUBSCRIBED' },
  })

  return NextResponse.json({ ok: true })
}
