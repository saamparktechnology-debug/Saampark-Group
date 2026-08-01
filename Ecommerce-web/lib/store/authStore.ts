import { create } from 'zustand';

interface User {
  name: string;
  email: string;
  phone: string;
}

interface AuthState {
  user: User | null;
  authModalOpen: boolean;
  
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, name?: string, phone?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe localStorage check for SSR environments
  const getStoredUser = () => {
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

    login: (email, name = 'Supriyo', phone = '9091518567') => {
      const user = { name, email, phone };
      if (typeof window !== 'undefined') {
        localStorage.setItem('saampark_user', JSON.stringify(user));
      }
      set({ user, authModalOpen: false });
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('saampark_user');
      }
      set({ user: null });
    },
  };
});
