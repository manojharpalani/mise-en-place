export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DishLibraryClient } from './dish-library-client'

export default async function PlannerDishesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const planner = await prisma.plannerProfile.findUnique({ where: { userId: session.user.id } })
  if (!planner) redirect('/planner/onboarding')

  const items = await prisma.plannerMenuItem.findMany({
    where: { plannerId: planner.id, isActive: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dish Library</h1>
          <p className="text-gray-500 text-sm mt-1">Your personal collection of dishes to plan meals from</p>
        </div>
      </div>
      <DishLibraryClient initialItems={items} />
    </div>
  )
}
