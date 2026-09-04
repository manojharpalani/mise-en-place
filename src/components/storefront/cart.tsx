'use client'

import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

export function CartSheet() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount, clearCart } = useCartStore()
  const router = useRouter()
  const count = getItemCount()

  const handleCheckout = () => {
    router.push('/checkout')
  }

  return (
    <Sheet>
      <SheetTrigger render={
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ShoppingCart className="w-6 h-6 text-gray-700" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c1622d] text-white text-xs rounded-full flex items-center justify-center font-bold">
              {count}
            </span>
          )}
        </button>
      } />
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Your Cart ({count})</span>
            {items.length > 0 && (
              <button onClick={clearCart} className="text-sm text-red-500 hover:underline font-normal">
                Clear all
              </button>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center text-gray-400">
            <div>
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Your cart is empty</p>
              <p className="text-sm mt-1">Add items from the menu</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.length > 0 && (
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  From: {items[0].sellerName}
                </p>
              )}
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const id = item.type === 'ITEM' ? item.menuItemId! : item.comboItemId!
                        updateQuantity(id, item.type, item.quantity - 1)
                      }}
                      className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                    <button
                      onClick={() => {
                        const id = item.type === 'ITEM' ? item.menuItemId! : item.comboItemId!
                        updateQuantity(id, item.type, item.quantity + 1)
                      }}
                      className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        const id = item.type === 'ITEM' ? item.menuItemId! : item.comboItemId!
                        removeItem(id, item.type)
                      }}
                      className="ml-1 text-gray-300 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatCurrency(getTotal())}</span>
              </div>
              <p className="text-xs text-gray-400">Delivery fees calculated at checkout</p>
              <Button onClick={handleCheckout} className="w-full bg-[#c1622d] hover:bg-[#a64f20] text-white">
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
