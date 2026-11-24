import { create } from 'zustand';

export interface ClientUser {
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  crmUserId?: string;
}

interface AuthState {
  user: ClientUser | null;
  authModalOpen: boolean;

  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, name?: string, phone?: string) => void;
  setAuthenticatedUser: (userData: ClientUser) => void;
  updateProfile: (partial: Partial<ClientUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const getStoredUser = (): ClientUser | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('saampark_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  return {
    user: getStoredUser(),
    authModalOpen: false,

    openAuthModal: () => set({ authModalOpen: true }),
    closeAuthModal: () => set({ authModalOpen: false }),

    login: (email, name, phone) => {
      const existing = get().user;
      const user: ClientUser = {
        ...(existing || {}),
        name: name || existing?.name || email.split('@')[0],
        email: email.toLowerCase().trim(),
        phone: phone || existing?.phone || '',
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('saampark_user', JSON.stringify(user));
      }
      set({ user, authModalOpen: false });
    },

    setAuthenticatedUser: (userData) => {
      const normalized: ClientUser = {
        ...userData,
        email: userData.email.toLowerCase().trim(),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('saampark_user', JSON.stringify(normalized));
      }
      set({ user: normalized, authModalOpen: false });
    },

    updateProfile: (partial) => {
      const current = get().user;
      if (!current) return;
      const updated: ClientUser = { ...current, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem('saampark_user', JSON.stringify(updated));
      }
      set({ user: updated });
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('saampark_user');
      }
      set({ user: null });
    },
  };
});
