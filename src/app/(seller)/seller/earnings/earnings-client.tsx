'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, ShoppingBag } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { format, subDays, subMonths, startOfWeek, startOfMonth } from 'date-fns'

type Period = '7d' | '30d' | '90d' | 'all'

interface Order {
  id: string
  total: number
  createdAt: Date
  fulfillmentType: string
  buyer: { name: string | null; email: string | null }
  items: { id: string }[]
}

interface Props {
  orders: Order[]
}

function buildChartData(orders: Order[], period: Period) {
  const now = new Date()
  let filtered = orders

  if (period === '7d') {
    const cutoff = subDays(now, 7)
    filtered = orders.filter((o) => new Date(o.createdAt) >= cutoff)
  } else if (period === '30d') {
    const cutoff = subDays(now, 30)
    filtered = orders.filter((o) => new Date(o.createdAt) >= cutoff)
  } else if (period === '90d') {
    const cutoff = subDays(now, 90)
    filtered = orders.filter((o) => new Date(o.createdAt) >= cutoff)
  }

  // Group by day (7d) or week (30d/90d) or month (all)
  const grouped: Record<string, number> = {}

  filtered.forEach((o) => {
    const d = new Date(o.createdAt)
    let key: string
    if (period === '7d') {
      key = format(d, 'EEE MMM d')
    } else if (period === '30d' || period === '90d') {
      key = format(startOfWeek(d), 'MMM d')
    } else {
      key = format(startOfMonth(d), 'MMM yyyy')
    }
    grouped[key] = (grouped[key] ?? 0) + o.total
  })

  return Object.entries(grouped)
    .map(([label, revenue]) => ({ label, revenue }))
    .sort((a, b) => {
      // keep chronological order by re-parsing
      return new Date(a.label).getTime() - new Date(b.label).getTime()
    })
}

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
}

export function EarningsClient({ orders }: Props) {
  const [period, setPeriod] = useState<Period>('30d')

  const filteredOrders = useMemo(() => {
    const now = new Date()
    if (period === '7d') return orders.filter((o) => new Date(o.createdAt) >= subDays(now, 7))
    if (period === '30d') return orders.filter((o) => new Date(o.createdAt) >= subDays(now, 30))
    if (period === '90d') return orders.filter((o) => new Date(o.createdAt) >= subDays(now, 90))
    return orders
  }, [orders, period])

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0)
  const orderCount = filteredOrders.length
  const avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0

  const chartData = useMemo(() => buildChartData(orders, period), [orders, period])

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? 'default' : 'outline'}
            onClick={() => setPeriod(p)}
            className={period === p ? 'bg-[#d4a5a5] hover:bg-[#c49090] border-0' : ''}
          >
            {PERIOD_LABELS[p]}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#fdf0ee] rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#d4a5a5]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500">Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orderCount}</p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(avgOrder)}</p>
              <p className="text-xs text-gray-500">Avg order</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue — {PERIOD_LABELS[period]}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">No orders in this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
                <Bar dataKey="revenue" fill="#d4a5a5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Order list */}
      <Card>
        <CardHeader><CardTitle className="text-base">Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">No orders in this period.</p>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{order.buyer.name || order.buyer.email}</p>
                    <p className="text-xs text-gray-400">
                      {order.items.length} items · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{order.fulfillmentType}</Badge>
                    <span className="font-semibold text-[#d4a5a5]">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
