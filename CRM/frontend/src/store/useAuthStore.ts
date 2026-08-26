import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '@/services/apiServices'
import { api, setAuthToken } from '@/lib/api'
import { fetchModuleDataFromDB, saveModuleDataToDB } from '@/lib/storageSync'

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
  kycStatus?: "Pending" | "Processing" | "Verified" | "Rejected"
  kycData?: any
}

export const DEFAULT_COMPANIES: Company[] = [
  { id: 'tech', name: 'SAAMPARK Technology', logo: '💻', slug: 'tech', currency_symbol: '₹' },
  { id: 'digital', name: 'SAAMPARK Digital Marketing & Research', logo: '📈', slug: 'digital', currency_symbol: '₹' },
]

export const DEFAULT_BRANCHES: Branch[] = []

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
          const dbBranches = await fetchModuleDataFromDB<Branch[]>('branches', [], 'all').catch(() => null)
          if (Array.isArray(dbBranches)) {
            set({ branches: dbBranches })
            return dbBranches
          }
          const res: any = await api.get('/branches').catch(() => null)
          if (res && (Array.isArray(res.data) || Array.isArray(res))) {
            const list = Array.isArray(res.data) ? res.data : res
            set({ branches: list })
            return list
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

        const remainingBranches = branches.filter(b => b.companyId !== companyId)
        set({
          companies: companies.filter(c => c.id !== companyId && c.slug !== companyId),
          branches: remainingBranches,
        })
        saveModuleDataToDB('branches', remainingBranches, 'all').catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
        }
        return true
      },

      addBranch: async (branchData: Partial<Branch>) => {
        const { user, branches } = get()
        
        let targetCompanyId = branchData.companyId || 'tech'
        if (user && user.role !== 'Super Admin') {
          const allowedCompIds = user.companyIds || (user.companyId ? [user.companyId] : ['tech'])
          if (!allowedCompIds.includes(targetCompanyId)) {
            targetCompanyId = allowedCompIds[0] || 'tech'
          }
        }

        const newBranch: Branch = {
          id: branchData.id || `branch_${Date.now()}`,
          companyId: targetCompanyId,
          name: branchData.name || 'New Sub-Branch',
          code: branchData.code || `BR-${Math.floor(100 + Math.random() * 900)}`,
          city: branchData.city || '',
          address: branchData.address || '',
          phone: branchData.phone || '',
          email: branchData.email || '',
          managerName: branchData.managerName || user?.name || '',
          status: branchData.status || 'Active',
          createdAt: new Date().toISOString().split('T')[0],
        }

        try {
          await api.post(`/companies/${newBranch.companyId}/branches`, newBranch).catch(() => {})
        } catch {}

        const updated = [...branches.filter(b => b.id !== newBranch.id), newBranch]
        set({ branches: updated })
        saveModuleDataToDB('branches', updated, 'all').catch(() => {})

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

        const updated = branches.map(b => b.id === branchId ? { ...b, ...updates } : b)
        set({ branches: updated })
        saveModuleDataToDB('branches', updated, 'all').catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
        }
      },

      deleteBranch: async (branchId: string) => {
        const { branches } = get()
        try {
          await api.delete(`/branches/${branchId}`).catch(() => {})
        } catch {}

        const updated = branches.filter(b => b.id !== branchId)
        set({ branches: updated })
        saveModuleDataToDB('branches', updated, 'all').catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
        }
        return true
      },

      switchBranch: (branchId: string | null) => {
        const { user } = get()
        if (!user) return

        const canSwitch =
          user.role === 'Super Admin' ||
          user.role === 'Admin' ||
          !branchId ||
          user.branchId === branchId ||
          (user.branchIds && user.branchIds.includes(branchId))

        if (canSwitch) {
          set({ activeBranchId: branchId })
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('saampark_branch_switched', { detail: branchId }))
            window.dispatchEvent(new Event('storage'))
          }
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
        const { user, companies } = get()
        if (!user) return

        const targetNorm = String(companyId || '').toLowerCase().trim()
        const matchedComp = companies.find(c => 
          String(c.id).toLowerCase().trim() === targetNorm || 
          String(c.slug || '').toLowerCase().trim() === targetNorm ||
          String(c.name || '').toLowerCase().trim() === targetNorm
        )
        const effectiveId = matchedComp?.id || companyId
        
        // Super Admin can switch to any company.
        // Admins, Teams, Clients can switch between any company they are assigned to.
        const isSuperAdmin = user.role === 'Super Admin'
        const userCompIds = (user.companyIds && user.companyIds.length > 0)
          ? user.companyIds.map(id => String(id).toLowerCase().trim())
          : [String(user.companyId || 'tech').toLowerCase().trim()]

        const canSwitch =
          isSuperAdmin ||
          userCompIds.includes(targetNorm) ||
          (matchedComp && userCompIds.includes(String(matchedComp.id).toLowerCase().trim())) ||
          (matchedComp?.slug && userCompIds.includes(String(matchedComp.slug).toLowerCase().trim())) ||
          String(user.companyId).toLowerCase().trim() === targetNorm

        if (canSwitch) {
          set({
            activeCompanyId: effectiveId,
            activeBranchId: null,
            user: user ? { ...user, companyId: effectiveId as any } : null,
          })
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('saampark_company_switched', { detail: effectiveId }))
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

