'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, UserPlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Valid email required'),
})

interface Employee {
  id: string
  inviteEmail?: string | null
  status: string
  role: string
  user: { name?: string | null; email: string | null }
}

export function EmployeesClient({ seller, initialEmployees }: { seller: { id: string }; initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
  })

  const inviteEmployee = async (data: { email: string }) => {
    setLoading(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, sellerId: seller.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to invite')
      }
      const newEmployee = await res.json()
      setEmployees((prev) => [...prev, newEmployee])
      toast.success('Invitation sent!')
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite employee')
    } finally {
      setLoading(false)
    }
  }

  const removeEmployee = async (id: string) => {
    if (!confirm('Remove this employee?')) return
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      setEmployees((prev) => prev.filter((e) => e.id !== id))
      toast.success('Employee removed')
    } catch {
      toast.error('Failed to remove employee')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(inviteEmployee)} className="space-y-4">
            <div className="space-y-2">
              <Label>Invite Employee by Email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="employee@example.com"
                  {...register('email')}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading} className="bg-[#d4a5a5] hover:bg-[#c49090]">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                </Button>
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {employees.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No employees yet. Invite someone to help manage orders!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center gap-3 bg-white border rounded-xl p-4">
              <Avatar>
                <AvatarFallback>{(emp.user.name || emp.user.email || '?')[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{emp.user.name || emp.user.email}</p>
                <p className="text-sm text-gray-500">{emp.inviteEmail || emp.user.email}</p>
              </div>
              <Badge
                className={
                  emp.status === 'ACTIVE' ? 'bg-[#fdf0ee] text-[#c49090]' :
                  emp.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }
              >
                {emp.status}
              </Badge>
              <Badge variant="outline" className="text-xs">{emp.role.replace('_', ' ')}</Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeEmployee(emp.id)}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
