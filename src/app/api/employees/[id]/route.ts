import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { seller: true },
  })

  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (employee.seller.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.employee.update({ where: { id }, data: { status: 'REMOVED' } })
  return NextResponse.json({ success: true })
}
