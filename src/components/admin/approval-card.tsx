'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface ApprovalCardProps {
  seller: {
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
  onUpdate: (id: string, updates: { isActive?: boolean; permitStatus?: string }) => void
}

export function ApprovalCard({ seller, onUpdate }: ApprovalCardProps) {
  const approve = async () => {
    try {
      const res = await fetch(`/api/sellers/${seller.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (!res.ok) throw new Error()
      onUpdate(seller.id, { isActive: true, permitStatus: 'APPROVED' })
      toast.success(`${seller.storeName} approved!`)
    } catch {
      toast.error('Failed to approve seller')
    }
  }

  const reject = async () => {
    try {
      const res = await fetch(`/api/sellers/${seller.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      if (!res.ok) throw new Error()
      onUpdate(seller.id, { isActive: false, permitStatus: 'REJECTED' })
      toast.success(`${seller.storeName} rejected`)
    } catch {
      toast.error('Failed to reject seller')
    }
  }

  const toggle = async () => {
    try {
      const res = await fetch(`/api/sellers/${seller.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !seller.isActive }),
      })
      if (!res.ok) throw new Error()
      onUpdate(seller.id, { isActive: !seller.isActive })
      toast.success(`Store ${seller.isActive ? 'deactivated' : 'activated'}`)
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{seller.storeName}</h3>
            <Badge
              className={
                seller.permitStatus === 'APPROVED' ? 'bg-[#f7e9de] text-[#a64f20]' :
                seller.permitStatus === 'REJECTED' ? 'bg-red-100 text-red-600' :
                'bg-amber-100 text-amber-700'
              }
            >
              {seller.permitStatus}
            </Badge>
            <Badge variant={seller.isActive ? 'default' : 'secondary'} className="text-xs">
              {seller.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{seller.user.name || seller.user.email}</p>
          {seller.cuisineType && <p className="text-sm text-muted-foreground">{seller.cuisineType}</p>}
          <p className="text-xs text-muted-foreground mt-1">{seller._count.orders} orders · /s/{seller.storeSlug}</p>

          {seller.permitDocumentUrl && (
            <a
              href={seller.permitDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
            >
              View Permit <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {seller.permitStatus === 'PENDING' && (
            <>
              <Button size="sm" onClick={approve} className="bg-[#c1622d] hover:bg-[#a64f20] text-xs">
                <CheckCircle className="w-3 h-3 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={reject} className="text-xs">
                <XCircle className="w-3 h-3 mr-1" /> Reject
              </Button>
            </>
          )}
          {seller.permitStatus === 'APPROVED' && (
            <Button size="sm" variant="outline" onClick={toggle} className="text-xs">
              {seller.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
