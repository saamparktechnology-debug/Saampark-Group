import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '@/services/apiServices'
import { setAuthToken } from '@/lib/api'

export type Role = 'Super Admin' | 'Admin' | 'Clients' | 'Teams' | 'User'
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
    name: 'Rahul Sharma (Super Admin)',
    email: 'superadmin@saampark.in',
    role: 'Super Admin',
    companyId: 'all',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=SuperAdmin',
  },
  'Admin': {
    id: 'u2',
    name: 'Priya Patel (Admin)',
    email: 'admin@tech.saampark.in',
    role: 'Admin',
    companyId: 'tech',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=TechAdmin',
  },
  'Teams': {
    id: 'u3',
    name: 'Sneha Gupta (Team Lead)',
    email: 'team@saampark.in',
    role: 'Teams',
    companyId: 'tech',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Teams',
  },
  'User': {
    id: 'u4',
    name: 'John Doe (User)',
    email: 'john@example.com',
    role: 'User',
    companyId: 'tech',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=User',
  },
  'Clients': {
    id: 'u5',
    name: 'Acme Corp (Client Portal)',
    email: 'client@acmecorp.com',
    role: 'Clients',
    companyId: 'tech',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Clients',
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
  loginAs: (role: Role | string, customUser?: Partial<User>) => void
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

      loginAs: (role: Role | string, customUser?: Partial<User>) => {
        const demoUser = DEMO_USERS[role as Role]
        
        const user: User = customUser
          ? {
              id: customUser.id || `u_${Date.now()}`,
              name: customUser.name || 'User Account',
              email: customUser.email || 'user@saampark.in',
              role: (customUser.role as Role) || (role as Role) || 'User',
              companyId: (customUser.companyId as CompanyId) || 'tech',
              avatar: customUser.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${customUser.email || role}`,
              phone: customUser.phone,
            }
          : demoUser || {
              id: `u_${Date.now()}`,
              name: `${role} User`,
              email: 'user@saampark.in',
              role: (role as Role) || 'User',
              companyId: 'tech',
              avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${role}`,
            }

        const activeCompanyId = user.role === 'Super Admin' ? 'tech' : (user.companyId || 'tech')
        
        // Record logged in account in persistent real users database
        if (typeof window !== 'undefined') {
          import('../app/feature/users/services/userService').then(({ recordUserAccount }) => {
            recordUserAccount({
              id: String(user.id),
              name: user.name,
              email: user.email,
              role: user.role,
              companyId: activeCompanyId,
              status: 'Active',
              lastLogin: 'Today (Active Session)',
            })
          })
        }

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

            if (typeof window !== 'undefined') {
              import('../app/feature/users/services/userService').then(({ recordUserAccount }) => {
                recordUserAccount({
                  id: String(userObj.id),
                  name: userObj.name,
                  email: userObj.email,
                  role: userObj.role,
                  companyId: userObj.companyId,
                  status: 'Active',
                  phone: userObj.phone,
                  lastLogin: 'Just now',
                })
              })
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
