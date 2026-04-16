import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = await prisma.menuItem.findUnique({ where: { id: Number(id) } })
  if (!item || item.sellerId !== seller.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { sellerId: _, ...updateData } = body

  const updated = await prisma.menuItem.update({
    where: { id: Number(id) },
    data: updateData,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = await prisma.menuItem.findUnique({ where: { id: Number(id) } })
  if (!item || item.sellerId !== seller.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.menuItem.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
