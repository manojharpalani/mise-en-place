export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Navbar } from '@/components/layout/navbar'
import { PlannerFollowButton } from '@/components/planner/planner-follow-button'
import { InspiredBy } from '@/components/planner/inspired-by'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Users, Globe } from 'lucide-react'
import { format } from 'date-fns'

interface PageProps {
  params: Promise<{ slug: string }>
}

function utcDay(d: Date | string): Date {
  const dt = typeof d === 'string' ? new Date(d) : d
  return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())
}

const UTC_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function PublicPlannerPage({ params }: PageProps) {
  const { slug } = await params

  const planner = await prisma.plannerProfile.findUnique({
    where: { slug, isPublic: true },
    include: {
      user: { select: { name: true } },
      weeklyMenus: {
        where: { isPublished: true },
        orderBy: { weekStartDate: 'desc' },
        take: 4,
        include: {
          days: {
            include: { menuItems: { include: { menuItem: true } } },
            orderBy: { date: 'asc' },
          },
        },
      },
      _count: { select: { subscribers: { where: { status: 'ACTIVE' } } } },
    },
  })

  if (!planner) notFound()

  const session = await auth().catch(() => null)
  const userId = session?.user?.id ?? null

  const isOwner = userId === planner.userId

  let isFollowing = false
  if (userId && !isOwner) {
    const sub = await prisma.plannerSubscriber.findFirst({
      where: { plannerId: planner.id, userId, status: 'ACTIVE' },
    })
    isFollowing = !!sub
  }

  // Collect all unique dish names from published menus for "inspired by"
  const allDishNames = [
    ...new Set(
      planner.weeklyMenus.flatMap((m) =>
        m.days.flatMap((d) => d.menuItems.map((di) => di.menuItem.name))
      )
    ),
  ].slice(0, 10)

  const profileUrl = `withmetta.com/u/${slug}`
  const followerCount = planner._count.subscribers

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* ── Profile Header ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{planner.displayName}</h1>
              {planner.bio && (
                <p className="text-gray-500 mt-1 text-sm leading-relaxed">{planner.bio}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
                {planner.cuisinePrefs.length > 0 && (
                  <span className="flex items-center gap-1">
                    {planner.cuisinePrefs.join(' · ')}
                  </span>
                )}
                {planner.householdSize > 1 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {planner.householdSize} people
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {profileUrl}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {!isOwner && (
                <PlannerFollowButton
                  slug={slug}
                  isLoggedIn={!!userId}
                  isAlreadyFollowing={isFollowing}
                />
              )}
              {followerCount > 0 && (
                <span className="text-xs text-gray-400">
                  {followerCount} follower{followerCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {planner.cuisinePrefs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {planner.cuisinePrefs.map((pref) => (
                <Badge key={pref} variant="secondary" className="text-xs">{pref}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* ── Published Menus ── */}
        {planner.weeklyMenus.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-gray-600">No published plans yet</p>
            <p className="text-sm mt-1">Check back soon</p>
          </div>
        ) : (
          <div className="space-y-6">
            {planner.weeklyMenus.map((menu) => {
              const start = format(utcDay(menu.weekStartDate), 'MMMM d')
              const end = menu.weekEndDate ? format(utcDay(menu.weekEndDate), 'MMMM d, yyyy') : null
              const label = end ? `${start} – ${end}` : start

              const activeDays = menu.days.filter((d) => d.menuItems.length > 0)

              return (
                <div key={menu.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Week header */}
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-[#d4a5a5]" />
                      <h2 className="font-semibold text-gray-900">{label}</h2>
                    </div>
                  </div>

                  {/* Day rows */}
                  <div className="divide-y divide-gray-50">
                    {activeDays.map((day) => {
                      const dayName = UTC_DAYS[new Date(day.date).getUTCDay()] ?? day.dayOfWeek
                      return (
                        <div key={day.id} className="px-5 py-3 flex gap-4">
                          <span className="w-20 shrink-0 text-sm font-medium text-gray-500 pt-0.5">
                            {dayName.slice(0, 3)}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {day.menuItems.map((di) => (
                              <span
                                key={di.id}
                                className="inline-flex items-center gap-1.5 text-sm bg-[#fdf0ee] text-gray-800 rounded-full px-3 py-1"
                              >
                                {di.menuItem.name}
                                {di.servings > 1 && (
                                  <span className="text-xs text-[#d4a5a5]">×{di.servings}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    {activeDays.length === 0 && (
                      <div className="px-5 py-4 text-sm text-gray-400">No meals planned</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Inspired By (Sprint 3 cross-sell) ── */}
        {allDishNames.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <InspiredBy dishNames={allDishNames} />
          </div>
        )}

      </div>
    </>
  )
}
