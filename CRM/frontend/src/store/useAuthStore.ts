import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'Super Admin' | 'Admin' | 'Manager' | 'Employee' | 'Client'
export type CompanyId = 'tech' | 'digital' | 'all'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  companyId: CompanyId // which company this user belongs to, 'all' for Super Admin
  avatar: string
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
    companyId: 'tech', // the company they are a client OF
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Client',
  },
}

export const COMPANIES = [
  { id: 'tech', name: 'SAAMPARK Technology', logo: '💻' },
  { id: 'digital', name: 'SAAMPARK Digital Marketing & Research', logo: '📈' },
]

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  activeCompanyId: CompanyId | null // The company currently being viewed/managed
  
  // Actions
  loginAs: (role: Role) => void
  logout: () => void
  switchCompany: (companyId: CompanyId) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: true,
      user: DEMO_USERS['Super Admin'],
      activeCompanyId: 'tech',

      loginAs: (role: Role) => {
        const user = DEMO_USERS[role]
        // Default to the user's company, but if Super Admin, default to 'tech' as the initial view
        const activeCompanyId = user.role === 'Super Admin' ? 'tech' : user.companyId
        
        set({
          isAuthenticated: true,
          user,
          activeCompanyId,
        })
      },

      logout: () => {
        set({
          isAuthenticated: false,
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
