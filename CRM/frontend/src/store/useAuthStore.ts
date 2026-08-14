import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '@/services/apiServices'
import { setAuthToken } from '@/lib/api'

export type Role = 'Super Admin' | 'Admin' | 'Manager' | 'Employee' | 'Client'
export type CompanyId = 'tech' | 'digital' | 'all'

export interface User {
  id: string | number
  name: string
  email: string
  role: Role
  companyId: CompanyId // which company this user belongs to, 'all' for Super Admin
  avatar: string
  phone?: string
}

export const DEMO_USERS: Record<Role, User> = {
  'Super Admin': {
    id: 'u1',
    name: 'Super Admin',
    email: 'superadmin@saampark.in',
    role: 'Super Admin',
    companyId: 'all',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=SuperAdmin',
  },
  'Admin': {
    id: 'u2',
    name: 'Tech Admin',
    email: 'admin@tech.saampark.in',
    role: 'Admin',
    companyId: 'tech',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=TechAdmin',
  },
  'Manager': {
    id: 'u3',
    name: 'Sales Manager',
    email: 'manager@saampark.in',
    role: 'Manager',
    companyId: 'tech',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Manager',
  },
  'Employee': {
    id: 'u4',
    name: 'John Doe',
    email: 'john@saampark.in',
    role: 'Employee',
    companyId: 'tech',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Employee',
  },
  'Client': {
    id: 'u5',
    name: 'Acme Corp Client',
    email: 'client@acmecorp.com',
    role: 'Client',
    companyId: 'tech',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Client',
  },
}

export const COMPANIES = [
  { id: 'tech', name: 'SAAMPARK Technology', logo: '💻' },
  { id: 'digital', name: 'SAAMPARK Digital Marketing & Research', logo: '📈' },
]

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  user: User | null
  activeCompanyId: CompanyId | null
  
  // Actions
  loginAs: (role: Role) => void
  loginWithCredentials: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchCompany: (companyId: CompanyId) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: true,
      token: null,
      user: DEMO_USERS['Super Admin'],
      activeCompanyId: 'tech',

      loginAs: (role: Role) => {
        const user = DEMO_USERS[role]
        const activeCompanyId = user.role === 'Super Admin' ? 'tech' : user.companyId
        
        set({
          isAuthenticated: true,
          user,
          activeCompanyId,
        })
      },

      loginWithCredentials: async (email: string, password: string) => {
        try {
          const res = await AuthService.login({ email, password })
          if (res && res.token) {
            const role = (res.user?.role as Role) || 'Employee'
            const userObj: User = {
              id: res.user?.id || 'u_live',
              name: res.user?.full_name || res.user?.name || res.user?.email || 'User',
              email: res.user?.email || email,
              role: role,
              companyId: 'tech',
              avatar: res.user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${res.user?.email || 'user'}`,
              phone: res.user?.phone,
            }

            set({
              isAuthenticated: true,
              token: res.token,
              user: userObj,
              activeCompanyId: 'tech',
            })
            return true
          }
          return false
        } catch (err) {
          console.error('Login error:', err)
          throw err
        }
      },

      logout: () => {
        AuthService.logout()
        set({
          isAuthenticated: false,
          token: null,
          user: null,
          activeCompanyId: null,
        })
      },

      switchCompany: (companyId: CompanyId) => {
        const { user } = get()
        if (user?.role === 'Super Admin') {
          set({ activeCompanyId: companyId })
        }
      },
    }),
    {
      name: 'saampark-auth',
    }
  )
)
