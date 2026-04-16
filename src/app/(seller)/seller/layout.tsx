import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SellerSidebar } from '@/components/layout/seller-sidebar'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/seller/dashboard')
  }

  if (session.user.role !== 'SELLER' && session.user.role !== 'EMPLOYEE') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <SellerSidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
