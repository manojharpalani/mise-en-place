'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Calendar, SkipForward } from 'lucide-react'

interface Subscription {
  id: string
  status: string
  totalAmount: number
  skippedDays?: unknown
  createdAt: Date
  seller: { storeName: string; storeSlug: string }
  weeklyMenu: {
    weekStartDate: Date
    days: Array<{
      id: string
      date: Date
      dayOfWeek: string
      menuItems: Array<{ menuItem: { name: string; price: number } }>
    }>
  }
}

export function SubscriptionsClient({ initialSubscriptions }: { initialSubscriptions: Subscription[] }) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions)

  const skipDay = async (subscriptionId: string, dayId: string, dayDate: Date) => {
    const hoursUntil = (new Date(dayDate).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 24) {
      toast.error('Can only skip days more than 24 hours in advance')
      return
    }

    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Day skipped! Credit added to your account.')
    } catch {
      toast.error('Failed to skip day')
    }
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>No active subscriptions</p>
        <p className="text-sm mt-2 mb-6">Subscribe to a weekly menu to get daily meals!</p>
        <Button asChild className="bg-[#c1622d] hover:bg-[#a64f20]">
          <Link href="/sellers">Browse Sellers</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {subscriptions.map((sub) => {
        const skippedDays = (sub.skippedDays as string[]) || []

        return (
          <Card key={sub.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  <Link href={`/${sub.seller.storeSlug}`} className="hover:text-[#c1622d]">
                    {sub.seller.storeName}
                  </Link>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={sub.status === 'ACTIVE' ? 'bg-[#f7e9de] text-[#a64f20]' : 'bg-muted text-muted-foreground'}>
                    {sub.status}
                  </Badge>
                  <span className="font-bold text-[#c1622d]">{formatCurrency(sub.totalAmount)}/week</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Week of {formatDate(sub.weeklyMenu.weekStartDate)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sub.weeklyMenu.days.map((day) => {
                  const isSkipped = skippedDays.includes(day.id)
                  const isPast = new Date(day.date) < new Date()

                  return (
                    <div
                      key={day.id}
                      className={`border rounded-xl p-3 ${isSkipped ? 'opacity-50 bg-muted' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{day.dayOfWeek}</span>
                        {isSkipped && <Badge variant="secondary" className="text-xs">Skipped</Badge>}
                      </div>
                      {day.menuItems.slice(0, 2).map((mi) => (
                        <p key={mi.menuItem.name} className="text-xs text-muted-foreground truncate">{mi.menuItem.name}</p>
                      ))}
                      {!isSkipped && !isPast && sub.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => skipDay(sub.id, day.id, day.date)}
                          className="w-full mt-2 text-xs h-7 text-muted-foreground hover:text-amber-600"
                        >
                          <SkipForward className="w-3 h-3 mr-1" /> Skip Day
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
