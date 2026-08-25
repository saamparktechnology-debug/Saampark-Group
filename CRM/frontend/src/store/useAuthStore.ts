import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '@/services/apiServices'
import { api, setAuthToken } from '@/lib/api'

export type Role = 'Super Admin' | 'Admin' | 'Clients' | 'Teams'
export type CompanyId = string

export interface Branch {
  id: string
  companyId: string
  name: string
  code?: string
  city?: string
  address?: string
  phone?: string
  email?: string
  managerName?: string
  status: 'Active' | 'Inactive'
  createdAt?: string
}

export interface Company {
  id: string
  name: string
  slug?: string
  logo?: string
  logo_url?: string
  currency?: string
  currency_symbol?: string
}

export interface User {
  id: string | number
  name: string
  email: string
  role: Role
  companyId: string
  companyIds?: string[] // Assigned companies list
  branchId?: string     // Assigned specific sub-branch
  branchIds?: string[]    // Assigned multiple sub-branches
  branchName?: string   // Human-readable branch name
  avatar: string
  phone?: string
  department?: string
  allowedModules?: string[]
  permissions?: any
}

export const DEFAULT_COMPANIES: Company[] = [
  { id: 'tech', name: 'SAAMPARK Technology', logo: '💻', slug: 'tech', currency_symbol: '₹' },
  { id: 'digital', name: 'SAAMPARK Digital Marketing & Research', logo: '📈', slug: 'digital', currency_symbol: '₹' },
]

export const DEFAULT_BRANCHES: Branch[] = [
  { id: 'tech-hq', companyId: 'tech', name: 'Tech HQ - Sector V', code: 'TECH-01', city: 'Kolkata', status: 'Active', createdAt: '2026-01-01' },
  { id: 'tech-north', companyId: 'tech', name: 'North Hub - Dum Dum', code: 'TECH-02', city: 'Kolkata', status: 'Active', createdAt: '2026-01-01' },
  { id: 'digital-main', companyId: 'digital', name: 'Digital HQ - South Kolkata', code: 'DIG-01', city: 'Kolkata', status: 'Active', createdAt: '2026-01-01' },
  { id: 'digital-mumbai', companyId: 'digital', name: 'Western Hub - Andheri', code: 'DIG-02', city: 'Mumbai', status: 'Active', createdAt: '2026-01-01' },
]

export const COMPANIES = DEFAULT_COMPANIES

export const DEMO_USERS: Record<Role, User | null> = {
  'Super Admin': null,
  'Admin': null,
  'Teams': null,
  'Clients': null,
}

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  user: User | null
  activeCompanyId: string | null
  activeBranchId: string | null
  companies: Company[]
  branches: Branch[]
  
  // Actions
  loginAs: (role: Role | string, customUser?: Partial<User>) => void
  loginWithCredentials: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchCompany: (companyId: string) => void
  switchBranch: (branchId: string | null) => void
  fetchCompanies: () => Promise<Company[]>
  fetchBranches: () => Promise<Branch[]>
  addCompany: (company: Partial<Company>) => Promise<Company | null>
  deleteCompany: (companyId: string) => Promise<boolean>
  addBranch: (branch: Partial<Branch>) => Promise<Branch | null>
  updateBranch: (branchId: string, updates: Partial<Branch>) => Promise<void>
  deleteBranch: (branchId: string) => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      activeCompanyId: null,
      activeBranchId: null,
      companies: DEFAULT_COMPANIES,
      branches: DEFAULT_BRANCHES,

      fetchCompanies: async () => {
        try {
          const res: any = await api.get('/companies').catch(() => null)
          if (res && (Array.isArray(res.data) || Array.isArray(res))) {
            const list = Array.isArray(res.data) ? res.data : res
            const formatted: Company[] = list.map((c: any) => ({
              id: c.slug || String(c.id),
              name: c.name,
              slug: c.slug || String(c.id),
              logo: c.slug === 'digital' ? '📈' : '💻',
              logo_url: c.logo_url,
              currency: c.currency || 'INR',
              currency_symbol: c.currency_symbol || '₹',
            }))
            if (formatted.length > 0) {
              set({ companies: formatted })
              return formatted
            }
          }
        } catch {}
        return get().companies
      },

      fetchBranches: async () => {
        try {
          const res: any = await api.get('/branches').catch(() => null)
          if (res && (Array.isArray(res.data) || Array.isArray(res))) {
            const list = Array.isArray(res.data) ? res.data : res
            if (list.length > 0) {
              set({ branches: list })
              return list
            }
          }
        } catch {}
        return get().branches
      },

      addCompany: async (newComp: Partial<Company>) => {
        try {
          const compSlug = newComp.slug || newComp.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `comp_${Date.now()}`
          await api.post('/companies', {
            name: newComp.name,
            slug: compSlug,
            currency: newComp.currency || 'INR',
            currency_symbol: newComp.currency_symbol || '₹',
            logo_url: newComp.logo_url,
          }).catch((err) => {
            console.warn('Create company API warning:', err)
          })

          const created: Company = {
            id: compSlug,
            name: newComp.name || 'New Company',
            slug: compSlug,
            logo: newComp.logo || '🏢',
            currency_symbol: newComp.currency_symbol || '₹',
          }

          set((state) => ({
            companies: [...state.companies.filter(c => c.id !== created.id), created]
          }))

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'))
          }

          return created
        } catch {
          return null
        }
      },

      deleteCompany: async (companyId: string) => {
        const { user, companies, branches } = get()
        if (user?.role !== 'Super Admin') {
          throw new Error('Only Super Admin can delete companies.')
        }

        try {
          await api.delete(`/companies/${companyId}`).catch(() => {})
        } catch {}

        set({
          companies: companies.filter(c => c.id !== companyId && c.slug !== companyId),
          branches: branches.filter(b => b.companyId !== companyId),
        })

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
        }
        return true
      },

      addBranch: async (branchData: Partial<Branch>) => {
        const { branches } = get()
        const newBranch: Branch = {
          id: branchData.id || `branch_${Date.now()}`,
          companyId: branchData.companyId || 'tech',
          name: branchData.name || 'New Sub-Branch',
          code: branchData.code || `BR-${Math.floor(100 + Math.random() * 900)}`,
          city: branchData.city || 'Kolkata',
          address: branchData.address || '',
          phone: branchData.phone || '',
          email: branchData.email || '',
          managerName: branchData.managerName || '',
          status: branchData.status || 'Active',
          createdAt: new Date().toISOString().split('T')[0],
        }

        try {
          await api.post(`/companies/${newBranch.companyId}/branches`, newBranch).catch(() => {})
        } catch {}

        set({ branches: [...branches.filter(b => b.id !== newBranch.id), newBranch] })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
        }
        return newBranch
      },

      updateBranch: async (branchId: string, updates: Partial<Branch>) => {
        const { branches } = get()
        try {
          await api.put(`/branches/${branchId}`, updates).catch(() => {})
        } catch {}

        set({
          branches: branches.map(b => b.id === branchId ? { ...b, ...updates } : b)
        })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
        }
      },

      deleteBranch: async (branchId: string) => {
        const { branches } = get()
        try {
          await api.delete(`/branches/${branchId}`).catch(() => {})
        } catch {}

        set({
          branches: branches.filter(b => b.id !== branchId)
        })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
        }
        return true
      },

      switchBranch: (branchId: string | null) => {
        set({ activeBranchId: branchId })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('saampark_branch_switched', { detail: branchId }))
          window.dispatchEvent(new Event('storage'))
        }
      },

      loginAs: (role: Role | string, customUser?: Partial<User>) => {
        let normalizedRole: Role = 'Teams'
        const rLower = String(role || '').toLowerCase().trim()
        if (rLower.includes('super')) normalizedRole = 'Super Admin'
        else if (rLower.includes('admin')) normalizedRole = 'Admin'
        else if (rLower.includes('client')) normalizedRole = 'Clients'

        const assignedCompanyIds = customUser?.companyIds || (normalizedRole === 'Super Admin' ? ['tech', 'digital'] : [customUser?.companyId || 'tech'])

        let parsedPerms: any = customUser?.permissions
        if (typeof parsedPerms === 'string') {
          try { parsedPerms = JSON.parse(parsedPerms) } catch {}
        }

        const userAllowedMods =
          customUser?.allowedModules ||
          (parsedPerms && Array.isArray(parsedPerms.allowedModules) ? parsedPerms.allowedModules : undefined)

        const user: User = {
          id: customUser?.id || `u_${Date.now()}`,
          name: customUser?.name || `${normalizedRole} User`,
          email: (customUser?.email || 'user@saampark.in').toLowerCase().trim(),
          role: normalizedRole,
          companyId: customUser?.companyId || assignedCompanyIds[0] || 'tech',
          companyIds: assignedCompanyIds,
          avatar: customUser?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${customUser?.email || normalizedRole}`,
          phone: customUser?.phone,
          allowedModules: userAllowedMods,
          permissions: parsedPerms || customUser?.permissions,
        }

        const activeCompanyId = user.companyId || 'tech'

        set({
          isAuthenticated: true,
          user,
          activeCompanyId,
        })
      },

      loginWithCredentials: async (email: string, password: string) => {
        const normEmail = email.toLowerCase().trim()
        try {
          const res = await AuthService.login({ email: normEmail, password })
          if (res && res.token) {
            let role: Role = 'Teams'
            const uRole = res.user?.role_name || res.user?.role || ''
            const uRoleId = res.user?.role_id
            if (uRoleId === 1 || String(uRole).toLowerCase().includes('super')) {
              role = 'Super Admin'
            } else if (uRoleId === 2 || String(uRole).toLowerCase().includes('admin')) {
              role = 'Admin'
            } else if (uRoleId === 4 || String(uRole).toLowerCase().includes('client')) {
              role = 'Clients'
            }

            let parsedCompanyIds: string[] = []
            if (res.user?.company_ids) {
              try {
                parsedCompanyIds = JSON.parse(res.user.company_ids)
              } catch {
                parsedCompanyIds = [res.user.company_ids]
              }
            }
            if (!Array.isArray(parsedCompanyIds) || parsedCompanyIds.length === 0) {
              parsedCompanyIds = [res.user?.company_id || 'tech']
            }

            let resPerms: any = res.user?.permissions
            if (typeof resPerms === 'string') {
              try { resPerms = JSON.parse(resPerms) } catch {}
            }

            const userAllowedMods =
              res.user?.allowedModules ||
              (resPerms && Array.isArray(resPerms.allowedModules) ? resPerms.allowedModules : undefined)

            const userObj: User = {
              id: res.user?.id || 'u_live',
              name: res.user?.full_name || res.user?.name || res.user?.email || 'User',
              email: res.user?.email || email,
              role: role,
              companyId: res.user?.company_id || parsedCompanyIds[0] || 'tech',
              companyIds: parsedCompanyIds,
              avatar: res.user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${res.user?.email || 'user'}`,
              phone: res.user?.phone,
              allowedModules: userAllowedMods,
              permissions: resPerms || res.user?.permissions,
            }

            set({
              isAuthenticated: true,
              token: res.token,
              user: userObj,
              activeCompanyId: userObj.companyId || 'tech',
            })

            // Fetch dynamic company list on login
            get().fetchCompanies()

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

      switchCompany: (companyId: string) => {
        const { user } = get()
        if (!user) return
        
        // Super Admin can switch to any company.
        // Admins, Teams, Clients can switch between any company they are assigned to.
        const canSwitch =
          user.role === 'Super Admin' ||
          (user.companyIds && user.companyIds.includes(companyId)) ||
          user.companyId === companyId

        if (canSwitch) {
          set({
            activeCompanyId: companyId,
            user: user ? { ...user, companyId: companyId as any } : null,
          })
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('saampark_company_switched', { detail: companyId }))
            window.dispatchEvent(new Event('storage'))
          }
        }
      },
    }),
    {
      name: 'saampark-auth-v3',
    }
  )
)

