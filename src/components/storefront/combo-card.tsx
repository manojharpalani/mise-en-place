'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Package } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface ComboCardProps {
  combo: {
    id: string
    name: string
    description?: string | null
    comboPrice: number
    photoUrl?: string | null
    menuItems?: Array<{
      quantity: number
      menuItem: { name: string; price: number }
    }>
  }
  sellerId: string
  sellerName: string
}

export function ComboCard({ combo, sellerId, sellerName }: ComboCardProps) {
  const { addItem, items, removeItem, updateQuantity } = useCartStore()

  const cartItem = items.find((i) => i.comboItemId === combo.id)
  const currentQty = cartItem?.quantity || 0

  const originalTotal = combo.menuItems?.reduce(
    (sum, ci) => sum + ci.menuItem.price * ci.quantity,
    0
  ) || 0
  const savings = originalTotal > combo.comboPrice ? originalTotal - combo.comboPrice : 0

  const handleAdd = () => {
    if (items.length > 0 && items[0].sellerId !== sellerId) {
      toast.error('Your cart has items from another store.')
      return
    }
    addItem({
      comboItemId: combo.id,
      name: combo.name,
      price: combo.comboPrice,
      quantity: 1,
      type: 'COMBO',
      sellerId,
      sellerName,
    })
    toast.success(`${combo.name} added to cart`)
  }

  const handleIncrement = () => updateQuantity(combo.id, 'COMBO', currentQty + 1)
  const handleDecrement = () => {
    if (currentQty <= 1) removeItem(combo.id, 'COMBO')
    else updateQuantity(combo.id, 'COMBO', currentQty - 1)
  }

  return (
    <div className="bg-white rounded-xl border border-amber-100 overflow-hidden hover:shadow-md transition-shadow">
      {combo.photoUrl ? (
        <div className="aspect-video relative">
          <Image src={combo.photoUrl} alt={combo.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
          <div className="absolute top-2 left-2">
            <Badge className="bg-amber-500 text-white text-xs">Combo Deal</Badge>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-amber-50 flex items-center justify-center">
          <Package className="w-10 h-10 text-amber-300" />
          <div className="absolute top-2 left-2">
            <Badge className="bg-amber-500 text-white text-xs">Combo Deal</Badge>
          </div>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{combo.name}</h3>
        {combo.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{combo.description}</p>
        )}
        {combo.menuItems && combo.menuItems.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <span className="font-medium">Includes: </span>
            {combo.menuItems.map((ci) => `${ci.quantity}x ${ci.menuItem.name}`).join(', ')}
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="font-bold text-amber-600 text-lg">{formatCurrency(combo.comboPrice)}</span>
            {savings > 0 && (
              <span className="text-xs text-[#d4a5a5] ml-2">Save {formatCurrency(savings)}</span>
            )}
          </div>
        </div>
        <div className="mt-2">
          {currentQty === 0 ? (
            <Button onClick={handleAdd} size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white">
              Add Combo
            </Button>
          ) : (
            <div className="flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={handleDecrement} className="w-9 h-9 p-0">-</Button>
              <span className="font-semibold text-lg">{currentQty}</span>
              <Button size="sm" variant="outline" onClick={handleIncrement} className="w-9 h-9 p-0">+</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
