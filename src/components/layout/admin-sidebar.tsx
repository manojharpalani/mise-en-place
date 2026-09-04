'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ChefHat, ShoppingBag, Users, FileText, Shield } from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/sellers', label: 'Sellers', icon: ChefHat },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/buyers', label: 'Buyers', icon: Users },
  { href: '/admin/content', label: 'Content', icon: FileText },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <img src="/logo-mark.svg" alt="" className="w-6 h-4" />
          <span className="font-heading italic">mise en place</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Shield className="w-3 h-3" /> Admin Panel
        </p>
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
                  : 'text-muted-foreground hover:bg-gray-800 hover:text-white'
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
