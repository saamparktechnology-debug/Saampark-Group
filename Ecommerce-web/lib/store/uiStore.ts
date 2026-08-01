import { create } from 'zustand';

interface UIDrawerState {
  cartOpen: boolean;
  wishlistOpen: boolean;
  compareOpen: boolean;
  
  openCart: () => void;
  closeCart: () => void;
  openWishlist: () => void;
  closeWishlist: () => void;
  openCompare: () => void;
  closeCompare: () => void;
  closeAll: () => void;
}

export const useUIStore = create<UIDrawerState>((set) => ({
  cartOpen: false,
  wishlistOpen: false,
  compareOpen: false,

  openCart: () => set({ cartOpen: true, wishlistOpen: false, compareOpen: false }),
  closeCart: () => set({ cartOpen: false }),
  
  openWishlist: () => set({ wishlistOpen: true, cartOpen: false, compareOpen: false }),
  closeWishlist: () => set({ wishlistOpen: false }),
  
  openCompare: () => set({ compareOpen: true, cartOpen: false, wishlistOpen: false }),
  closeCompare: () => set({ compareOpen: false }),
  
  closeAll: () => set({ cartOpen: false, wishlistOpen: false, compareOpen: false }),
}));
