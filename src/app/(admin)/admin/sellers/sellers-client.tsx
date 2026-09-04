'use client'

import { useState } from 'react'
import { ApprovalCard } from '@/components/admin/approval-card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface Seller {
  id: string
  storeName: string
  storeSlug: string
  permitStatus: string
  permitDocumentUrl?: string | null
  isActive: boolean
  cuisineType?: string | null
  user: { name?: string | null; email: string | null; createdAt?: Date }
  _count: { orders: number }
}

export function SellersAdminClient({ initialSellers }: { initialSellers: Seller[] }) {
  const [sellers, setSellers] = useState(initialSellers)
  const [search, setSearch] = useState('')

  const filtered = sellers.filter(
    (s) =>
      s.storeName.toLowerCase().includes(search.toLowerCase()) ||
      (s.user.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const updateSeller = (id: string, updates: Partial<Seller>) => {
    setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const pending = filtered.filter((s) => s.permitStatus === 'PENDING')
  const approved = filtered.filter((s) => s.permitStatus === 'APPROVED')
  const rejected = filtered.filter((s) => s.permitStatus === 'REJECTED')

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search sellers..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-amber-700 mb-3">Pending Review ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((s) => <ApprovalCard key={s.id} seller={s} onUpdate={updateSeller} />)}
          </div>
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#a64f20] mb-3">Approved ({approved.length})</h2>
          <div className="space-y-3">
            {approved.map((s) => <ApprovalCard key={s.id} seller={s} onUpdate={updateSeller} />)}
          </div>
        </div>
      )}

      {rejected.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-600 mb-3">Rejected ({rejected.length})</h2>
          <div className="space-y-3">
            {rejected.map((s) => <ApprovalCard key={s.id} seller={s} onUpdate={updateSeller} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-gray-400 text-center py-12">No sellers found.</p>
      )}
    </div>
  )
}
