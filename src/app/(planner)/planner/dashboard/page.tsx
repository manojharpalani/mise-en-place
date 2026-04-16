import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, ShoppingBasket, ChefHat, ArrowRight } from 'lucide-react'

export default async function PlannerDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const profile = await prisma.plannerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      weeklyMenus: {
        orderBy: { weekStartDate: 'desc' },
        take: 1,
        include: {
          days: {
            include: { menuItems: true },
          },
        },
      },
    },
  })

  // If no profile yet, redirect to onboarding
  if (!profile) redirect('/planner/onboarding')

  const currentMenu = profile.weeklyMenus[0] ?? null
  const totalMealsThisWeek = currentMenu
    ? currentMenu.days.reduce((sum, d) => sum + d.menuItems.length, 0)
    : 0

  const daysPlanned = currentMenu
    ? currentMenu.days.filter((d) => d.menuItems.length > 0).length
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile.displayName.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          {currentMenu
            ? `You have ${daysPlanned} day${daysPlanned !== 1 ? 's' : ''} planned this week`
            : "You haven't started this week's meal plan yet"}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">{daysPlanned}</div>
            <div className="text-sm text-gray-500 mt-1">Days planned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">{totalMealsThisWeek}</div>
            <div className="text-sm text-gray-500 mt-1">Meals this week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">{profile.householdSize}</div>
            <div className="text-sm text-gray-500 mt-1">
              {profile.householdSize === 1 ? 'Person' : 'People'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#d4a5a5]" />
              Meal Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-500 mb-3">Plan your week, add dishes, use AI suggestions</p>
            <Button asChild size="sm" className="w-full bg-[#d4a5a5] hover:bg-[#c49090]">
              <Link href="/planner/menu">
                Plan This Week <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBasket className="w-5 h-5 text-[#d4a5a5]" />
              Grocery List
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-500 mb-3">
              Auto-generated from your meal plan, scaled for {profile.householdSize}{' '}
              {profile.householdSize === 1 ? 'person' : 'people'}
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/planner/grocery">
                View List <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-[#d4a5a5]" />
              Order from Local Chefs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-500 mb-3">
              Find home chefs making the dishes on your meal plan
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/sellers">
                Browse Chefs <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
