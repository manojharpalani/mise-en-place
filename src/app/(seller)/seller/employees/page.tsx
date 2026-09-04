export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { EmployeesClient } from './employees-client'

async function getEmployees(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } })
  if (!seller) return null

  const employees = await prisma.employee.findMany({
    where: { sellerId: seller.id },
    include: { user: { select: { name: true, email: true } } },
  })

  return { seller, employees }
}

export default async function EmployeesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')
  const data = await getEmployees(session.user.id)
  if (!data) redirect('/seller/onboarding')

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Employees</h1>
      <EmployeesClient seller={data.seller} initialEmployees={data.employees} />
    </div>
  )
}
