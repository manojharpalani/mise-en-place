export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PlannerGroceryList } from '@/components/planner/planner-grocery-list'
import { format } from 'date-fns'

function utcDay(d: Date | string): Date {
  const dt = typeof d === 'string' ? new Date(d) : d
  return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())
}

export default async function PlannerGroceryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const planner = await prisma.plannerProfile.findUnique({ where: { userId: session.user.id } })
  if (!planner) redirect('/planner/onboarding')

  const weeklyMenus = await prisma.plannerWeeklyMenu.findMany({
    where: { plannerId: planner.id },
    orderBy: { weekStartDate: 'desc' },
    take: 6,
    include: {
      days: {
        include: { menuItems: { include: { menuItem: true } } },
        orderBy: { date: 'asc' },
      },
    },
  })

  const menuOptions = weeklyMenus.map((m) => {
    const start = format(utcDay(m.weekStartDate), 'MMM d')
    const end = m.weekEndDate ? format(utcDay(m.weekEndDate), 'MMM d') : null
    return { id: m.id, label: end ? `${start} – ${end}` : start }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Grocery List</h1>
      <p className="text-gray-500 text-sm mb-6">
        Scaled for {planner.householdSize} {planner.householdSize === 1 ? 'person' : 'people'}
      </p>
      <PlannerGroceryList
        menus={menuOptions}
        initialMenuId={weeklyMenus[0]?.id ?? ''}
        householdSize={planner.householdSize}
      />
    </div>
  )
}
