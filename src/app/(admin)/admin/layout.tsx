import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
