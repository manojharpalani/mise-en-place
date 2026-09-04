'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface ItemCardProps {
  item: {
    id: number
    name: string
    description?: string | null
    price: number
    salePrice?: number | null
    photoUrl?: string | null
    dietaryTags?: string[]
    allergenTags?: string[]
  }
  sellerId: string
  sellerName: string
}

export function ItemCard({ item, sellerId, sellerName }: ItemCardProps) {
  const [quantity, setQuantity] = useState(0)
  const { addItem, items, removeItem, updateQuantity } = useCartStore()

  const cartItem = items.find((i) => i.menuItemId === item.id)
  const currentQty = cartItem?.quantity || 0

  const handleAdd = () => {
    if (items.length > 0 && items[0].sellerId !== sellerId) {
      toast.error('Your cart has items from another store. Clear it first.')
      return
    }
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.salePrice ?? item.price,
      quantity: 1,
      type: 'ITEM',
      sellerId,
      sellerName,
    })
    setQuantity(currentQty + 1)
    toast.success(`${item.name} added to cart`)
  }

  const handleIncrement = () => {
    updateQuantity(item.id, 'ITEM', currentQty + 1)
    setQuantity(currentQty + 1)
  }

  const handleDecrement = () => {
    if (currentQty <= 1) {
      removeItem(item.id, 'ITEM')
      setQuantity(0)
    } else {
      updateQuantity(item.id, 'ITEM', currentQty - 1)
      setQuantity(currentQty - 1)
    }
  }

  const DIETARY_COLORS: Record<string, string> = {
    vegan: 'bg-[#f7e9de] text-[#a64f20]',
    vegetarian: 'bg-lime-100 text-lime-700',
    'gluten-free': 'bg-amber-100 text-amber-700',
    halal: 'bg-blue-100 text-blue-700',
    kosher: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
      {item.photoUrl && (
        <div className="aspect-video relative">
          <Image
            src={item.photoUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {item.salePrice && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-red-500 text-white text-xs">SALE</Badge>
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            {item.salePrice ? (
              <>
                <div className="font-bold text-[#c1622d]">{formatCurrency(item.salePrice)}</div>
                <div className="text-xs text-muted-foreground line-through">{formatCurrency(item.price)}</div>
              </>
            ) : (
              <div className="font-bold text-foreground">{formatCurrency(item.price)}</div>
            )}
          </div>
        </div>

        {item.dietaryTags && item.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.dietaryTags.map((tag) => (
              <span
                key={tag}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIETARY_COLORS[tag.toLowerCase()] || 'bg-muted text-muted-foreground'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3">
          {currentQty === 0 ? (
            <Button
              onClick={handleAdd}
              size="sm"
              className="w-full bg-[#c1622d] hover:bg-[#a64f20] text-white"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
            </Button>
          ) : (
            <div className="flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={handleDecrement} className="w-9 h-9 p-0">
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-lg">{currentQty}</span>
              <Button size="sm" variant="outline" onClick={handleIncrement} className="w-9 h-9 p-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
