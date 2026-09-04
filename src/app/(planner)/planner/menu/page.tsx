export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PlannerWeeklyPlanner } from '@/components/planner/planner-weekly-planner'

export default async function PlannerMenuPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const planner = await prisma.plannerProfile.findUnique({ where: { userId: session.user.id } })
  if (!planner) redirect('/planner/onboarding')

  const [menuItems, weeklyMenus] = await Promise.all([
    prisma.plannerMenuItem.findMany({
      where: { plannerId: planner.id, isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.plannerWeeklyMenu.findMany({
      where: { plannerId: planner.id },
      orderBy: { weekStartDate: 'desc' },
      take: 10,
      include: {
        days: {
          include: { menuItems: { include: { menuItem: true } } },
          orderBy: { date: 'asc' },
        },
      },
    }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Meal Plan</h1>
      <PlannerWeeklyPlanner
        planner={planner}
        initialMenuItems={menuItems}
        initialWeeklyMenus={weeklyMenus}
      />
    </div>
  )
}
