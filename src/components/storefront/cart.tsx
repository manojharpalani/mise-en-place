'use client'

import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ShoppingBag, Trash2, Plus, Minus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

export function CartSheet() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount, clearCart } = useCartStore()
  const router = useRouter()
  const count = getItemCount()
  const total = getTotal()

  const idOf = (item: (typeof items)[number]) => (item.type === 'ITEM' ? item.menuItemId! : item.comboItemId!)

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            className={`inline-flex items-center gap-2 rounded-xl px-4 h-10 text-sm font-semibold transition-colors ${
              count > 0
                ? 'bg-[#E2472B] text-white hover:bg-[#C43A20] shadow-sm'
                : 'border border-[#12402C]/30 bg-white text-[#12402C] hover:bg-[#FFF9EC]'
            }`}
            aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
          >
            <ShoppingBag className="w-4 h-4" />
            {count > 0 ? (
              <>
                View cart
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs tabular-nums">{count}</span>
                <span className="tabular-nums">{formatCurrency(total)}</span>
              </>
            ) : (
              'Cart'
            )}
          </button>
        }
      />
      <SheetContent className="flex flex-col w-full sm:max-w-md gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#EFE3C7] pr-14">
          <SheetTitle className="font-heading text-[22px] font-extrabold tracking-[-0.03em] text-[#12402C]">
            Your cart
          </SheetTitle>
          {items.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {count} item{count === 1 ? '' : 's'} from <span className="font-semibold text-foreground">{items[0].sellerName}</span>
            </p>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <div className="w-16 h-16 rounded-full bg-[#FFF1D6] mx-auto mb-4 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-[#E2472B]" />
              </div>
              <p className="font-semibold text-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Add dishes from the menu to get started.</p>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 divide-y divide-[#EFE3C7]">
              {items.map((item) => (
                <li key={`${item.type}-${idOf(item)}`} className="py-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-[15px] text-foreground leading-snug">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(item.price)} each{item.type === 'COMBO' ? ' · Combo' : ''}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-right">{formatCurrency(item.price * item.quantity)}</p>
                  <div className="inline-flex items-center rounded-full border border-[#12402C]/25 bg-white">
                    <button
                      onClick={() => updateQuantity(idOf(item), item.type, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-[#12402C] hover:bg-[#FFF9EC]"
                      aria-label={`Decrease ${item.name}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(idOf(item), item.type, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-[#12402C] hover:bg-[#FFF9EC]"
                      aria-label={`Increase ${item.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(idOf(item), item.type)}
                    className="justify-self-end inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-[#E2472B]"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-[#EFE3C7] bg-[#FFF9EC] px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-heading text-xl font-extrabold text-[#12402C] tabular-nums">{formatCurrency(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Pickup time and any delivery fee are set at checkout. You pay the chef at pickup or delivery.</p>
              <Button onClick={() => router.push('/checkout')} size="lg" className="w-full">
                Checkout
              </Button>
              <div className="flex items-center justify-between">
                <SheetClose render={<button className="text-sm font-semibold text-[#12402C] hover:underline" />}>
                  Continue shopping
                </SheetClose>
                <button onClick={clearCart} className="text-sm text-muted-foreground hover:text-[#E2472B] hover:underline">
                  Clear cart
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
