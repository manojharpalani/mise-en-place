export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { WeeklyMenuPlanner } from '@/components/seller/weekly-planner'

async function getSellerMenuData(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } })
  if (!seller) return null

  const menuItems = await prisma.menuItem.findMany({
    where: { sellerId: seller.id, isActive: true },
    orderBy: { name: 'asc' },
  })

  const comboItems = await prisma.comboItem.findMany({
    where: { sellerId: seller.id, isActive: true },
    orderBy: { name: 'asc' },
    include: { menuItems: { include: { menuItem: true } } },
  })

  const weeklyMenus = await prisma.weeklyMenu.findMany({
    where: { sellerId: seller.id },
    orderBy: { weekStartDate: 'desc' },
    take: 10,
    include: {
      days: {
        include: {
          menuItems: { include: { menuItem: true } },
          comboItems: { include: { comboItem: true } },
        },
        orderBy: { date: 'asc' },
      },
    },
  })

  return { seller, menuItems, comboItems, weeklyMenus }
}

export default async function SellerMenuPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const data = await getSellerMenuData(session.user.id)
  if (!data) redirect('/seller/onboarding')

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Weekly Menu Planner</h1>
      <WeeklyMenuPlanner
        seller={data.seller}
        initialMenuItems={data.menuItems}
        initialComboItems={data.comboItems}
        initialWeeklyMenus={data.weeklyMenus}
      />
    </div>
  )
}
