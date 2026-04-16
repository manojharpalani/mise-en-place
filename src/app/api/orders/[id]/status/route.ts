import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await req.json()

  const order = await prisma.order.findUnique({
    where: { id },
    include: { seller: true },
  })

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Must be seller or admin
  if (order.seller.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(updated)
}
