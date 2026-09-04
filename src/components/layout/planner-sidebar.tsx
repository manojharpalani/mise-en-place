'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, CalendarDays, ShoppingBasket, User, UtensilsCrossed } from 'lucide-react'

const navItems = [
  { href: '/planner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/planner/menu', label: 'Meal Plan', icon: CalendarDays },
  { href: '/planner/dishes', label: 'Dish Library', icon: UtensilsCrossed },
  { href: '/planner/grocery', label: 'Grocery List', icon: ShoppingBasket },
  { href: '/planner/profile', label: 'Profile', icon: User },
]

export function PlannerSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-muted border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
          <img src="/logo-mark.svg" alt="" className="w-6 h-4" />
          <span className="font-heading italic">mise en place</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">Meal Planner</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#F7E9DE] text-[#C1622D]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
