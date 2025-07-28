import { create } from 'zustand'
import { CartItem, CartStore } from '@/types'

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  total: 0,
  selectedRestaurant: undefined,
  pickupType: undefined,
  
  addItem: (item: CartItem) => {
    set((state) => {
      const newItems = [...state.items, item]
      const newTotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0)
      return { items: newItems, total: newTotal }
    })
  },
  
  removeItem: (index: number) => {
    set((state) => {
      const newItems = state.items.filter((_, i) => i !== index)
      const newTotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0)
      return { items: newItems, total: newTotal }
    })
  },
  
  updateQuantity: (index: number, quantity: number) => {
    set((state) => {
      const newItems = [...state.items]
      if (quantity <= 0) {
        newItems.splice(index, 1)
      } else {
        const item = newItems[index]
        const unitPrice = item.totalPrice / item.quantity
        newItems[index] = {
          ...item,
          quantity,
          totalPrice: unitPrice * quantity
        }
      }
      const newTotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0)
      return { items: newItems, total: newTotal }
    })
  },
  
  clearCart: () => {
    set({ items: [], total: 0, selectedRestaurant: undefined, pickupType: undefined })
  },

  setRestaurant: (restaurant) => {
    set((state) => {
      // If switching restaurants, clear the cart since menu items are restaurant-specific
      if (state.selectedRestaurant && state.selectedRestaurant.id !== restaurant.id) {
        return {
          selectedRestaurant: restaurant,
          items: [],
          total: 0,
          pickupType: undefined
        }
      }
      return { selectedRestaurant: restaurant }
    })
  },

  setPickupType: (type) => {
    set({ pickupType: type })
  }
})) 