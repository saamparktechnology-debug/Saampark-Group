import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sanitizeQuantity } from '../utils/pricing';

export interface CartItem {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number | null;
  quantity: number;
  group?: 'technology' | 'consultancy' | 'research';
  entity?: string;
  priceType?: string;
  deliveryDays?: number | string;
  image?: string;
  options?: Record<string, any>;
}

interface CommerceState {
  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  removeServiceFromCart: (serviceId: string) => void;
  updateQuantity: (idOrServiceId: string, qty: number) => void;
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
          const qtyToAdd = sanitizeQuantity(item.quantity);
          const cleanPrice =
            typeof item.price === 'number' && Number.isFinite(item.price) && item.price > 0
              ? Math.round(item.price)
              : null;

          const existingIdx = state.cart.findIndex((c) => c.serviceId === item.serviceId);
          if (existingIdx >= 0) {
            const next = state.cart.map((c, idx) =>
              idx === existingIdx
                ? {
                    ...c,
                    price: cleanPrice ?? c.price,
                    quantity: Math.min(99, c.quantity + qtyToAdd),
                    group: item.group || c.group,
                    entity: item.entity || c.entity,
                    priceType: item.priceType || c.priceType,
                    deliveryDays: item.deliveryDays ?? c.deliveryDays,
                    image: item.image || c.image,
                  }
                : c
            );
            return { cart: next };
          }

          const newItem: CartItem = {
            ...item,
            price: cleanPrice,
            quantity: qtyToAdd,
            id: `cart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          };
          return { cart: [...state.cart, newItem] };
        }),
      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((c) => c.id !== id && c.serviceId !== id),
        })),
      removeServiceFromCart: (serviceId) =>
        set((state) => ({
          cart: state.cart.filter((c) => c.serviceId !== serviceId),
        })),
      updateQuantity: (idOrServiceId, qty) =>
        set((state) => {
          const n = Math.round(Number(qty));
          if (!Number.isFinite(n) || n <= 0) {
            return {
              cart: state.cart.filter((c) => c.id !== idOrServiceId && c.serviceId !== idOrServiceId),
            };
          }
          return {
            cart: state.cart.map((c) =>
              c.id === idOrServiceId || c.serviceId === idOrServiceId
                ? { ...c, quantity: Math.min(99, n) }
                : c
            ),
          };
        }),
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
