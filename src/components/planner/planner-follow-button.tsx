'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Bell, BellOff, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  slug: string
  isLoggedIn: boolean
  isAlreadyFollowing: boolean
}

export function PlannerFollowButton({ slug, isLoggedIn, isAlreadyFollowing }: Props) {
  const [following, setFollowing] = useState(isAlreadyFollowing)
  const [loading, setLoading] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [email, setEmail] = useState('')

  async function follow(emailOverride?: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/planner/${slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailOverride ? { email: emailOverride } : {}),
      })
      if (res.status === 409) {
        setFollowing(true)
        setShowEmailDialog(false)
        return
      }
      if (!res.ok) throw new Error()
      setFollowing(true)
      setShowEmailDialog(false)
      toast.success('Following! You\'ll get notified when new meal plans are published.')
    } catch {
      toast.error('Failed to follow. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function unfollow() {
    setLoading(true)
    try {
      const res = await fetch(`/api/planner/${slug}/subscribe`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setFollowing(false)
      toast.success('Unfollowed')
    } catch {
      toast.error('Failed to unfollow')
    } finally {
      setLoading(false)
    }
  }

  if (following) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={isLoggedIn ? unfollow : undefined}
        disabled={loading}
        className="text-[#c1622d] border-[#c1622d]"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
        Following
      </Button>
    )
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => isLoggedIn ? follow() : setShowEmailDialog(true)}
        disabled={loading}
        className="bg-[#c1622d] hover:bg-[#a64f20]"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Bell className="w-3.5 h-3.5 mr-1" />}
        Follow
      </Button>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Follow this planner</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Enter your email to get notified when new meal plans are published.</p>
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && follow(email)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => follow(email)}
                disabled={loading || !email}
                className="bg-[#c1622d] hover:bg-[#a64f20]"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Follow'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
