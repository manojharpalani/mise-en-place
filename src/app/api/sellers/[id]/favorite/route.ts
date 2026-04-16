import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const fav = await prisma.favoriteSeller.create({
      data: { buyerId: session.user.id, sellerId: id },
    })
    return NextResponse.json(fav, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Already favorited or not found' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.favoriteSeller.deleteMany({
    where: { buyerId: session.user.id, sellerId: id },
  })
  return NextResponse.json({ success: true })
}
