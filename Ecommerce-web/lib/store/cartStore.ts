import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Service } from '../data/services';

export interface CartItem {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number | null;
  quantity: number;
  // Options user selected during customization
  options?: Record<string, any>;
}

interface CommerceState {
  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  
  // Wishlist
  wishlistIds: string[];
  toggleWishlist: (serviceId: string) => void;

  // Compare (max 3)
  compareIds: string[];
  toggleCompare: (serviceId: string) => void;
  clearCompare: () => void;
}

export const useCommerceStore = create<CommerceState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (item) =>
        set((state) => {
          // simple unique id generator
          const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
          return { cart: [...state.cart, newItem] };
        }),
      removeFromCart: (id) =>
        set((state) => ({ cart: state.cart.filter((c) => c.id !== id) })),
      updateQuantity: (id, qty) =>
        set((state) => ({
          cart: state.cart.map((c) => (c.id === id ? { ...c, quantity: qty } : c)),
        })),
      clearCart: () => set({ cart: [] }),

      wishlistIds: [],
      toggleWishlist: (serviceId) =>
        set((state) => {
          if (state.wishlistIds.includes(serviceId)) {
            return { wishlistIds: state.wishlistIds.filter((id) => id !== serviceId) };
          }
          return { wishlistIds: [...state.wishlistIds, serviceId] };
        }),

      compareIds: [],
      toggleCompare: (serviceId) =>
        set((state) => {
          if (state.compareIds.includes(serviceId)) {
            return { compareIds: state.compareIds.filter((id) => id !== serviceId) };
          }
          if (state.compareIds.length >= 3) {
            // max 3
            return { compareIds: [...state.compareIds.slice(1), serviceId] };
          }
          return { compareIds: [...state.compareIds, serviceId] };
        }),
      clearCompare: () => set({ compareIds: [] }),
    }),
    {
      name: 'saampark-commerce-storage',
    }
  )
);
