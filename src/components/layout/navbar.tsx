'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChefHat, ShoppingBag, LayoutDashboard, Shield, LogOut, User, CalendarDays } from 'lucide-react'

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const role = (session?.user as { role?: string } | undefined)?.role

  return (
    <nav className="sticky top-0 z-50 bg-[#FBF6EC]/90 backdrop-blur border-b border-[#E7DDCB]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo-mark.svg" alt="" width={40} height={24} className="h-6 w-auto" />
          <span className="font-heading italic text-xl text-[#2A2420]">mise en place</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-stone-600">
          <Link href="/sellers" className="hover:text-[#C1622D] transition-colors font-medium">
            Find Chefs
          </Link>
          {role === 'SELLER' && (
            <Link href="/seller/dashboard" className="hover:text-[#C1622D] transition-colors flex items-center gap-1 font-medium">
              <ChefHat className="w-4 h-4" /> Dashboard
            </Link>
          )}
          {role === 'BUYER' && (
            <Link href="/buyer/orders" className="hover:text-[#C1622D] transition-colors flex items-center gap-1 font-medium">
              <ShoppingBag className="w-4 h-4" /> My Orders
            </Link>
          )}
          {role === 'PLANNER' && (
            <Link href="/planner/dashboard" className="hover:text-[#C1622D] transition-colors flex items-center gap-1 font-medium">
              <CalendarDays className="w-4 h-4" /> Meal Planner
            </Link>
          )}
          {role === 'ADMIN' && (
            <Link href="/admin/dashboard" className="hover:text-[#C1622D] transition-colors flex items-center gap-1 font-medium">
              <Shield className="w-4 h-4" /> Admin
            </Link>
          )}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="flex items-center gap-2 focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image ?? ''} />
                    <AvatarFallback className="bg-[#E7DDCB] text-[#6B625A] text-xs font-semibold">
                      {session.user?.name?.[0]?.toUpperCase() ?? session.user?.email?.[0]?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium text-stone-700">
                    {session.user?.name || session.user?.email}
                  </span>
                </button>
              } />
              <DropdownMenuContent align="end" className="w-48">
                {role === 'SELLER' && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/seller/dashboard')} className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/seller/settings')} className="flex items-center gap-2 cursor-pointer">
                      <ChefHat className="w-4 h-4" /> Store Settings
                    </DropdownMenuItem>
                  </>
                )}
                {role === 'BUYER' && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/buyer/orders')} className="flex items-center gap-2 cursor-pointer">
                      <ShoppingBag className="w-4 h-4" /> My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/buyer/profile')} className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" /> Profile
                    </DropdownMenuItem>
                  </>
                )}
                {role === 'PLANNER' && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/planner/dashboard')} className="flex items-center gap-2 cursor-pointer">
                      <CalendarDays className="w-4 h-4" /> Meal Planner
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/planner/profile')} className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" /> Planner Profile
                    </DropdownMenuItem>
                  </>
                )}
                {role === 'ADMIN' && (
                  <DropdownMenuItem onClick={() => router.push('/admin/dashboard')} className="flex items-center gap-2 cursor-pointer">
                    <Shield className="w-4 h-4" /> Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-stone-600 hover:text-[#C1622D]">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#C1622D] hover:bg-[#A64F20] text-white border-0 shadow-none">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
