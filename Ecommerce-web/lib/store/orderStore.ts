import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Service } from '../data/services';

export interface OrderItem {
  serviceId: string;
  name: string;
  price: number;
  qty: number;
  priceType?: string;
  deliveryDays?: number | string;
}

export interface PlacedOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  businessName?: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  pincode: string;
  gstNumber?: string;
  panNumber?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Order Pending' | 'Invoice Created' | 'Order Processed' | 'Cancelled';
  companyId: 'tech' | 'consultancy';
  orderDate: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  clientPortal?: {
    loginUrl: string;
    email: string;
    defaultPassword?: string;
  };
}

interface OrderStoreState {
  checkoutOpen: boolean;
  trackingOpen: boolean;
  trackingOrderNumber: string;
  activeDirectService: Service | null;
  myOrders: PlacedOrder[];

  openCheckout: (service?: Service | null) => void;
  closeCheckout: () => void;
  openTracking: (orderNumber?: string) => void;
  closeTracking: () => void;
  savePlacedOrder: (order: PlacedOrder) => void;
}

export const useOrderStore = create<OrderStoreState>()(
  persist(
    (set) => ({
      checkoutOpen: false,
      trackingOpen: false,
      trackingOrderNumber: '',
      activeDirectService: null,
      myOrders: [],

      openCheckout: (service = null) =>
        set({ checkoutOpen: true, activeDirectService: service }),

      closeCheckout: () =>
        set({ checkoutOpen: false, activeDirectService: null }),

      openTracking: (orderNumber = '') =>
        set({ trackingOpen: true, trackingOrderNumber: orderNumber }),

      closeTracking: () =>
        set({ trackingOpen: false, trackingOrderNumber: '' }),

      savePlacedOrder: (order) =>
        set((state) => ({
          myOrders: [order, ...state.myOrders.filter((o) => o.orderNumber !== order.orderNumber)],
        })),
    }),
    {
      name: 'saampark_order_storage',
    }
  )
);
