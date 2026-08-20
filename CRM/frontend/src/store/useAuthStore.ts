import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '@/services/apiServices'
import { setAuthToken } from '@/lib/api'

export type Role = 'Super Admin' | 'Admin' | 'Clients' | 'Teams'
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

export const DEMO_USERS: Record<Role, User | null> = {
  'Super Admin': null,
  'Admin': null,
  'Teams': null,
  'Clients': null,
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
      isAuthenticated: false,
      token: null,
      user: null,
      activeCompanyId: null,


      loginAs: (role: Role | string, customUser?: Partial<User>) => {
        const demoUser = DEMO_USERS[role as Role]
        
        const user: User = customUser
          ? {
              id: customUser.id || `u_${Date.now()}`,
              name: customUser.name || 'User Account',
              email: (customUser.email || 'user@saampark.in').toLowerCase().trim(),
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

        // Block login if user email was deleted
        if (typeof window !== 'undefined') {
          const rawDeleted = localStorage.getItem("saampark_deleted_user_emails")
          const deletedEmails: string[] = rawDeleted ? JSON.parse(rawDeleted) : []
          if (deletedEmails.includes(user.email.toLowerCase().trim())) {
            throw new Error("Account does not exist. Please create one.")
          }
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
        const normEmail = email.toLowerCase().trim()
        if (typeof window !== 'undefined') {
          const rawDeleted = localStorage.getItem("saampark_deleted_user_emails")
          const deletedEmails: string[] = rawDeleted ? JSON.parse(rawDeleted) : []
          if (deletedEmails.includes(normEmail)) {
            throw new Error("Account does not exist. Please create one.")
          }
        }

        try {
          const res = await AuthService.login({ email: normEmail, password })
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
          
          if (res && (res.status === 'error' || res.message)) {
            throw new Error(res.message || "Account does not exist. Please create one.")
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
      name: 'saampark-auth-v2',
    }
  )
)

