import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PlannerSidebar } from '@/components/layout/planner-sidebar'

export default async function PlannerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/planner/dashboard')
  }

  if (session.user.role !== 'PLANNER') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <PlannerSidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
