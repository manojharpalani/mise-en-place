import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  menuItemId?: number
  comboItemId?: string
  name: string
  price: number
  quantity: number
  type: 'ITEM' | 'COMBO'
  sellerId: string
  sellerName: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: number | string, type: 'ITEM' | 'COMBO') => void
  updateQuantity: (id: number | string, type: 'ITEM' | 'COMBO', quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

// One-time migration: carry over a cart saved under the old storage key
// so no one's in-progress order silently disappears after the rebrand.
if (typeof window !== 'undefined') {
  const legacy = window.localStorage.getItem('withmetta-cart')
  if (legacy && !window.localStorage.getItem('mise-en-place-cart')) {
    window.localStorage.setItem('mise-en-place-cart', legacy)
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const items = get().items
        const existingIndex = items.findIndex((i) => {
          if (newItem.type === 'ITEM') return i.menuItemId === newItem.menuItemId
          return i.comboItemId === newItem.comboItemId
        })

        if (existingIndex >= 0) {
          const updated = [...items]
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          }
          set({ items: updated })
        } else {
          set({ items: [...items, newItem] })
        }
      },

      removeItem: (id, type) => {
        set((state) => ({
          items: state.items.filter((item) => {
            if (type === 'ITEM') return item.menuItemId !== (id as number)
            return item.comboItemId !== (id as string)
          }),
        }))
      },

      updateQuantity: (id, type, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id, type)
          return
        }
        set((state) => ({
          items: state.items.map((item) => {
            if (type === 'ITEM' && item.menuItemId === (id as number)) {
              return { ...item, quantity }
            }
            if (type === 'COMBO' && item.comboItemId === (id as string)) {
              return { ...item, quantity }
            }
            return item
          }),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    { name: 'mise-en-place-cart' }
  )
)
