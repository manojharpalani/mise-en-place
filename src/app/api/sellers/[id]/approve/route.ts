import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action } = await req.json()

  if (action === 'approve') {
    const updated = await prisma.sellerProfile.update({
      where: { id },
      data: { permitStatus: 'APPROVED', isActive: true },
    })
    return NextResponse.json(updated)
  } else if (action === 'reject') {
    const updated = await prisma.sellerProfile.update({
      where: { id },
      data: { permitStatus: 'REJECTED', isActive: false },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
