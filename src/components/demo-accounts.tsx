'use client'

import { Sparkles } from 'lucide-react'

export type DemoAccount = {
  role: string
  email: string
  description: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'Admin', email: 'admin@miseenplace.local', description: 'Approvals, orders, platform metrics' },
  { role: 'Seller', email: 'chef@example.com', description: "Chef Maya's Kitchen dashboard" },
  { role: 'Buyer', email: 'buyer@example.com', description: 'Orders, favorites, subscriptions' },
  { role: 'Planner', email: 'planner@example.com', description: 'Weekly meal planning' },
]

/**
 * This deployment doesn't have a verified email sender configured, so the
 * one-time login code is shown right in the verify screen instead of being
 * emailed (see the fallback in /api/auth/send-otp). This callout exists so
 * that behavior reads as an intentional demo convenience, not a broken login.
 */
export function DemoAccountsCallout({ onSelect }: { onSelect: (email: string) => void }) {
  return (
    <div className="mt-6 rounded-xl border border-[#E7DDCB] bg-[#FBF6EC] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-[#8a5a2e]">
        <Sparkles className="w-4 h-4" />
        Try a demo account
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        No email set up in this demo — pick a role below and your login code will appear on the next screen automatically.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map((acct) => (
          <button
            key={acct.email}
            type="button"
            onClick={() => onSelect(acct.email)}
            className="text-left rounded-lg border border-[#E7DDCB] bg-white px-3 py-2 hover:border-[#C1622D] hover:bg-[#f7e9de] transition-colors"
          >
            <div className="text-xs font-semibold text-foreground">{acct.role}</div>
            <div className="text-[11px] text-muted-foreground truncate">{acct.email}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
