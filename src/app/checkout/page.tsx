import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CheckoutForm } from './checkout-form'

// Bug fix: this page used to be a plain client component with no auth check
// at all. A signed-out visitor could add items to their cart, land on
// /checkout, fill out the whole form, and only discover they weren't signed
// in when "Place Order" came back with a confusing "Unauthorized" toast from
// the API (which does require a session). The cart itself survives a
// redirect fine since it's persisted to localStorage (see src/store/cart.ts),
// so redirecting up front — the same pattern already used by the buyer/
// seller/planner/admin layouts — is a strict improvement with no downside.
export default async function CheckoutPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/checkout')
  }

  return <CheckoutForm />
}
