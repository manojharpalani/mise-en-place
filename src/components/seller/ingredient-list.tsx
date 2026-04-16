'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function IngredientListComponent({ items }: { items: Record<string, number> }) {
  const handleDownload = () => {
    const text = Object.entries(items)
      .map(([name, qty]) => `${name}: ${qty} servings`)
      .join('\n')
    const blob = new Blob([`Shopping List\n${'-'.repeat(30)}\n${text}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shopping-list.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" /> Download List
        </Button>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        {Object.entries(items).map(([name, qty]) => (
          <div key={name} className="flex justify-between items-center py-1.5 border-b last:border-0">
            <span className="text-sm font-medium text-gray-900">{name}</span>
            <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full border">
              {qty} servings
            </span>
          </div>
        ))}
        {Object.keys(items).length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">No items in this week&apos;s menu.</p>
        )}
      </div>
    </div>
  )
}
