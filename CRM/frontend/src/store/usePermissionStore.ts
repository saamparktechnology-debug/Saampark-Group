import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Role, User } from './useAuthStore'

// The complete, clean list of all real CRM modules in the application
export const ALL_APP_MODULES = [
  // CRM & Sales
  'Leads',
  'Clients',
  'Proposals',
  'Quotations',
  'Estimates',
  'Sales Orders',
  'Invoices',
  'Payments',
  'Credit Notes',
  'Debit Notes',
  'Services & Store',

  // Projects & Operations
  'Projects',
  'Tasks',

  // Subscriptions & Retainers
  'Subscriptions',
  'EMI',

  // HR & Workforce
  'Teams',
  'Attendance',
  'Leave',
  'Payroll',

  // Support & Communication
  'Tickets',
  'Knowledge base',
  'Messages',
  'Events',
  'Notes',
  'Files',

  // Organisation & Administration
  'Dashboard',
  'Companies',
  'Branches',
  'Departments',
  'Users',
  'Permissions',
  'Expenses',
  'Reports',
  'Settings',
  'Activity Logs',
] as const

export type AppModuleName = typeof ALL_APP_MODULES[number]
export type ModuleName = AppModuleName | string

// Configurable modules (Dashboard is global view)
export const CONFIGURABLE_MODULES = ALL_APP_MODULES.filter(m => m !== 'Dashboard')
export const ALL_MODULE_NAMES = CONFIGURABLE_MODULES
export const ALL_NAV_MODULES = ALL_APP_MODULES

// Core CRUD actions
export const ALL_ACTIONS = ['view', 'add', 'edit', 'delete'] as const
export type ActionType = typeof ALL_ACTIONS[number]

export interface ModuleActionFlags {
  view: boolean
  add: boolean
  edit: boolean
  delete: boolean
  [key: string]: boolean | undefined
}

export const MODULE_ACTION_CONFIG: Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean; hasAdd: boolean; hasEdit: boolean; hasDelete: boolean; description: string }> = ALL_APP_MODULES.reduce((acc, mod) => {
  acc[mod] = {
    view: true,
    add: true,
    edit: true,
    delete: true,
    hasAdd: true,
    hasEdit: true,
    hasDelete: true,
    description: `Manage ${mod} records with view, add, edit, delete capabilities`
  }
  return acc
}, {} as any)

// Clean module categories for intuitive UI display
export const CLEAN_MODULE_CATEGORIES: Record<string, { label: string; icon: string; modules: { key: string; name: string; description: string }[] }> = {
  crm: {
    label: "CRM & Sales Pipeline",
    icon: "Target",
    modules: [
      { key: "Leads", name: "Leads", description: "Telecalling pipeline, cold leads & status progression" },
      { key: "Clients", name: "Clients", description: "Client accounts, contact directories & profiles" },
      { key: "Proposals", name: "Proposals", description: "Digital commercial proposals & e-signatures" },
      { key: "Quotations", name: "Quotations", description: "Itemized formal customer price quotes" },
      { key: "Estimates", name: "Estimates", description: "Dynamic cost estimations with tax calculations" },
      { key: "Sales Orders", name: "Sales Orders", description: "Confirmed customer purchase & sales orders" },
      { key: "Invoices", name: "Invoices", description: "Tax invoices, billing releases & payment tracking" },
      { key: "Payments", name: "Payments", description: "Payment collections, bank receipts & ledger" },
      { key: "Credit Notes", name: "Credit Notes", description: "Credit adjustments and bill reversals" },
      { key: "Debit Notes", name: "Debit Notes", description: "Supplementary debit claims and debits" },
      { key: "Services & Store", name: "Services & Store", description: "Standardized service catalog and pricing" },
    ]
  },
  projects: {
    label: "Projects & Tasks",
    icon: "KanbanSquare",
    modules: [
      { key: "Projects", name: "Projects", description: "Client deliverables, execution phases & progress" },
      { key: "Tasks", name: "Tasks", description: "Kanban task boards, milestones & priorities" },
    ]
  },
  subscriptions: {
    label: "Subscriptions & EMI",
    icon: "CreditCard",
    modules: [
      { key: "Subscriptions", name: "Subscriptions", description: "Recurring retainers and recurring billing cycles" },
      { key: "EMI", name: "EMI Milestone Plans", description: "Installment payment contracts and milestones" },
    ]
  },
  hr: {
    label: "HR & Workforce Management",
    icon: "UserCheck",
    modules: [
      { key: "Teams", name: "Teams & Members", description: "Staff directory, profiles & bank details" },
      { key: "Attendance", name: "Attendance & Timecards", description: "Real-time shift punch clock and timesheets" },
      { key: "Leave", name: "Leave Management", description: "Leave requests, balances & annual holidays" },
      { key: "Payroll", name: "Payroll & Payouts", description: "Monthly salary calculations, payslips & payouts" },
    ]
  },
  support: {
    label: "Support & Communication",
    icon: "HeadphonesIcon",
    modules: [
      { key: "Tickets", name: "Tickets", description: "Customer support tickets, SLAs & resolutions" },
      { key: "Knowledge base", name: "Knowledge Base", description: "Help center articles, FAQs & tutorials" },
      { key: "Messages", name: "Messages", description: "Real-time internal and team live messaging" },
      { key: "Events", name: "Events", description: "Shared corporate calendar and milestone reminders" },
      { key: "Notes", name: "Notes", description: "Global announcements and scratchpads" },
      { key: "Files", name: "Files", description: "Cloud documents, attachments & vault" },
    ]
  },
  admin: {
    label: "Organisation & Governance",
    icon: "Building2",
    modules: [
      { key: "Companies", name: "Companies", description: "Multi-tenant company profiles and branding" },
      { key: "Branches", name: "Branches", description: "Branch offices, locations & regional centers" },
      { key: "Departments", name: "Departments", description: "Corporate business units & divisions" },
      { key: "Users", name: "Users", description: "User account credentials and login management" },
      { key: "Permissions", name: "Permissions", description: "Role-based access control and matrices" },
      { key: "Expenses", name: "Expenses", description: "Operating overheads, approvals & claims" },
      { key: "Reports", name: "Reports", description: "Financial audits, P&L exports & analytics" },
      { key: "Settings", name: "Settings", description: "Workspace preferences and system configuration" },
      { key: "Activity Logs", name: "Activity Logs", description: "Tamper-evident system activity and login logs" },
    ]
  }
}

export const DEFAULT_FULL_ACTIONS: ModuleActionFlags = {
  view: true,
  add: true,
  edit: true,
  delete: true,
}

export const DEFAULT_VIEW_ONLY_ACTIONS: ModuleActionFlags = {
  view: true,
  add: false,
  edit: false,
  delete: false,
}

export const DEFAULT_NO_ACTIONS: ModuleActionFlags = {
  view: false,
  add: false,
  edit: false,
  delete: false,
}

// Role normalization helper
export function normalizeRole(role: string): Role {
  if (!role) return 'Teams'
  const lower = role.toLowerCase().trim()
  if (lower.includes('super')) return 'Super Admin'
  if (lower.includes('admin')) return 'Admin'
  if (lower.includes('client')) return 'Clients'
  if (lower.includes('team') || lower.includes('user') || lower.includes('employee') || lower.includes('manager')) return 'Teams'
  return 'Teams'
}

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, ModuleName[]> = {
  'Super Admin': [...ALL_APP_MODULES],
  'Admin': [...ALL_APP_MODULES],
  'Teams': [
    'Dashboard', 'Leads', 'Clients', 'Proposals', 'Quotations', 'Estimates',
    'Sales Orders', 'Invoices', 'Payments', 'Services & Store', 'Projects',
    'Tasks', 'Teams', 'Attendance', 'Leave', 'Tickets', 'Knowledge base',
    'Messages', 'Events', 'Notes', 'Files', 'Expenses', 'Reports', 'Settings'
  ],
  'Clients': [
    'Dashboard', 'Projects', 'Tasks', 'Subscriptions', 'EMI', 'Invoices',
    'Payments', 'Tickets', 'Knowledge base', 'Messages', 'Files', 'Settings',
    'Leads', 'Proposals', 'Estimates'
  ]
}

export const DEFAULT_ROLE_ACTION_PERMISSIONS: Record<Role, Record<string, ModuleActionFlags>> = {
  'Super Admin': (() => {
    const init: Record<string, ModuleActionFlags> = {}
    CONFIGURABLE_MODULES.forEach((m) => { init[m] = { ...DEFAULT_FULL_ACTIONS } })
    return init
  })(),
  'Admin': (() => {
    const init: Record<string, ModuleActionFlags> = {}
    CONFIGURABLE_MODULES.forEach((m) => {
      init[m] = { view: true, add: true, edit: true, delete: true }
    })
    return init
  })(),
  'Teams': (() => {
    const init: Record<string, ModuleActionFlags> = {}
    CONFIGURABLE_MODULES.forEach((m) => {
      const isRestricted = ['Companies', 'Branches', 'Permissions', 'Payroll', 'Settings'].includes(m)
      init[m] = {
        view: !isRestricted,
        add: !isRestricted,
        edit: !isRestricted,
        delete: false,
      }
    })
    return init
  })(),
  'Clients': (() => {
    const init: Record<string, ModuleActionFlags> = {}
    const clientAllowed = ['Dashboard', 'Projects', 'Tasks', 'Subscriptions', 'EMI', 'Invoices', 'Tickets', 'Knowledge base', 'Messages', 'Files', 'Leads', 'Proposals', 'Estimates']
    CONFIGURABLE_MODULES.forEach((m) => {
      const allowed = clientAllowed.includes(m)
      init[m] = {
        view: allowed,
        add: ['Tickets', 'Messages', 'Leads'].includes(m),
        edit: ['Tickets', 'Leads'].includes(m),
        delete: false,
      }
    })
    return init
  })(),
}

interface PermissionState {
  rolePermissions: Record<Role, ModuleName[]>
  roleActionPermissions: Record<Role, Record<string, ModuleActionFlags>>
  userPermissions: Record<string, ModuleName[]>
  userActionPermissions: Record<string, Record<string, ModuleActionFlags>>
  companyEnabledModules: Record<string, string[]>
  
  // Actions
  fetchRolePermissions: () => Promise<void>
  fetchUserPermissions: (userId?: string) => Promise<void>
  setRolePermissions: (role: Role, modules: ModuleName[]) => void
  setRoleAllModuleActions: (role: Role, matrix: Record<string, ModuleActionFlags>) => void
  setUserPermissions: (userId: string, modules: ModuleName[]) => void
  setUserModuleAction: (userId: string, moduleName: ModuleName, action: ActionType, value: boolean) => void
  setUserAllModuleActions: (userId: string, matrix: Record<string, ModuleActionFlags>) => void
  setCompanyEnabledModules: (companyId: string, modules: string[]) => void
  resetToDefaults: () => void
  
  // Helpers
  isModuleAllowed: (user: User | null, moduleName: string) => boolean
  isCompanyModuleAllowed: (companyId: string | null | undefined, moduleName: string) => boolean
  getEnabledModulesForCompany: (companyId: string | null | undefined) => string[]
  getModulesForUser: (user: User | null) => ModuleName[]
  getUserModuleActions: (user: User | null, moduleName: string) => ModuleActionFlags
  canPerformAction: (user: User | null, moduleName: string, action: ActionType) => boolean
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      rolePermissions: DEFAULT_ROLE_PERMISSIONS,
      roleActionPermissions: DEFAULT_ROLE_ACTION_PERMISSIONS,
      userPermissions: {},
      userActionPermissions: {},
      companyEnabledModules: {
        tech: [...ALL_APP_MODULES],
        consultancy: [...ALL_APP_MODULES],
      },

      fetchRolePermissions: async () => {
        try {
          const { PermissionService } = await import('@/services/permissionService')
          const res = await PermissionService.getAllRoleMatrices()
          const data = res?.data?.data || res?.data
          if (data && typeof data === 'object') {
            const current = get().roleActionPermissions || DEFAULT_ROLE_ACTION_PERMISSIONS
            const updated = { ...current }
            for (const [r, matrix] of Object.entries(data)) {
              if (matrix && typeof matrix === 'object') {
                updated[r as Role] = { ...(updated[r as Role] || {}), ...(matrix as any) }
              }
            }
            set({ roleActionPermissions: updated })
          }
        } catch (err) {
          console.warn('fetchRolePermissions error:', err)
        }
      },

      fetchUserPermissions: async (userId?: string) => {
        if (!userId) return
        try {
          const { PermissionService } = await import('@/services/permissionService')
          const res = await PermissionService.getUserMatrix(userId)
          const data = res?.data?.data || res?.data
          if (data && typeof data === 'object') {
            const allowedMods = Object.keys(data).filter(m => {
              const f = data[m]
              return f && (f.view || f.add || f.edit || f.delete)
            })
            const normId = String(userId).toLowerCase().trim()
            set((state) => ({
              userActionPermissions: {
                ...state.userActionPermissions,
                [userId]: data,
                [normId]: data,
              },
              userPermissions: {
                ...state.userPermissions,
                [userId]: allowedMods,
                [normId]: allowedMods,
              }
            }))
          }
        } catch (err) {
          console.warn('fetchUserPermissions error:', err)
        }
      },

      setRolePermissions: (role: Role, modules: ModuleName[]) => {
        const norm = normalizeRole(role)
        set((state) => ({
          rolePermissions: {
            ...state.rolePermissions,
            [norm]: modules,
          },
        }))
      },

      setRoleAllModuleActions: (role: Role, matrix: Record<string, ModuleActionFlags>) => {
        const norm = normalizeRole(role)
        set((state) => ({
          roleActionPermissions: {
            ...(state.roleActionPermissions || DEFAULT_ROLE_ACTION_PERMISSIONS),
            [norm]: {
              ...((state.roleActionPermissions || {})[norm] || {}),
              ...matrix,
            },
          },
        }))
      },

      setUserPermissions: (userId: string, modules: ModuleName[]) => {
        const normId = String(userId).toLowerCase().trim()
        set((state) => ({
          userPermissions: {
            ...state.userPermissions,
            [userId]: modules,
            [normId]: modules,
          },
        }))
      },

      setUserModuleAction: (userId: string, moduleName: ModuleName, action: ActionType, value: boolean) => {
        set((state) => {
          const userMatrix = state.userActionPermissions[userId] || {}
          const currentFlags = userMatrix[moduleName] || { view: false, add: false, edit: false, delete: false }
          return {
            userActionPermissions: {
              ...state.userActionPermissions,
              [userId]: {
                ...userMatrix,
                [moduleName]: {
                  ...currentFlags,
                  [action]: value,
                },
              },
            },
          }
        })
      },

      setUserAllModuleActions: (userId: string, matrix: Record<string, ModuleActionFlags>) => {
        const normId = String(userId).toLowerCase().trim()
        const allowedMods = Object.keys(matrix).filter(m => {
          const f = matrix[m]
          return f && (f.view || f.add || f.edit || f.delete)
        })
        set((state) => ({
          userActionPermissions: {
            ...state.userActionPermissions,
            [userId]: {
              ...(state.userActionPermissions[userId] || {}),
              ...matrix,
            },
            [normId]: {
              ...(state.userActionPermissions[normId] || {}),
              ...matrix,
            },
          },
          userPermissions: {
            ...state.userPermissions,
            [userId]: allowedMods,
            [normId]: allowedMods,
          }
        }))
      },

      setCompanyEnabledModules: (companyId: string, modules: string[]) => {
        const cKey = String(companyId || '').toLowerCase().trim()
        const canonKey = (cKey.includes('consult') || cKey === '2') ? 'consultancy' : (cKey.includes('tech') || cKey === '1' ? 'tech' : cKey)
        set((state) => ({
          companyEnabledModules: {
            ...state.companyEnabledModules,
            [companyId]: modules,
            [canonKey]: modules,
          }
        }))
      },

      getEnabledModulesForCompany: (companyId: string | null | undefined): string[] => {
        if (!companyId || companyId === 'all') return [...ALL_APP_MODULES]
        const state = get()
        const cKey = String(companyId).toLowerCase().trim()
        const canonKey = (cKey.includes('consult') || cKey === '2') ? 'consultancy' : (cKey.includes('tech') || cKey === '1' ? 'tech' : cKey)
        const enabled = state.companyEnabledModules?.[canonKey] || state.companyEnabledModules?.[companyId]
        if (Array.isArray(enabled) && enabled.length > 0) {
          return enabled
        }
        return [...ALL_APP_MODULES]
      },

      isCompanyModuleAllowed: (companyId: string | null | undefined, moduleName: string): boolean => {
        if (!companyId || companyId === 'all') return true
        const mKey = String(moduleName || '').toLowerCase().trim()
        if (mKey === 'dashboard' || mKey === 'companies' || mKey === 'settings') return true

        const state = get()
        const cKey = String(companyId).toLowerCase().trim()
        const canonKey = (cKey.includes('consult') || cKey === '2') ? 'consultancy' : (cKey.includes('tech') || cKey === '1' ? 'tech' : cKey)
        const enabled = state.companyEnabledModules?.[canonKey] || state.companyEnabledModules?.[companyId]
        if (!enabled || !Array.isArray(enabled) || enabled.length === 0) {
          return true
        }

        const ALIAS_MAP: Record<string, string> = {
          'sales': 'Invoices',
          'store': 'Services & Store',
          'packages & retainers': 'Subscriptions',
          'emi milestone plans': 'EMI',
          'team members': 'Teams',
          'payments & payroll': 'Payroll',
          'leave management': 'Leave',
          'attendance & timecards': 'Attendance',
          'knowledge base': 'Knowledge base',
          'documents': 'Files',
          'crm': 'Leads',
          'organisation': 'Companies',
          'hr & employees': 'Teams',
          'support': 'Tickets'
        }
        const resolvedName = (ALIAS_MAP[mKey] || mKey).toLowerCase().trim()

        return enabled.some(m => {
          const modNorm = String(m).toLowerCase().trim()
          return modNorm === mKey || modNorm === resolvedName || (ALIAS_MAP[modNorm] && ALIAS_MAP[modNorm].toLowerCase() === mKey)
        })
      },

      resetToDefaults: () => {
        set({
          rolePermissions: DEFAULT_ROLE_PERMISSIONS,
          roleActionPermissions: DEFAULT_ROLE_ACTION_PERMISSIONS,
          userPermissions: {},
          userActionPermissions: {},
          companyEnabledModules: {
            tech: [...ALL_APP_MODULES],
            consultancy: [...ALL_APP_MODULES],
          },
        })
      },

      isModuleAllowed: (user: User | null, moduleName: string) => {
        if (!user) return false
        
        const mKey = String(moduleName || '').toLowerCase().trim()
        if (mKey === 'dashboard') return true

        const normRole = normalizeRole(user.role)
        if (normRole === 'Super Admin') return true

        const state = get()
        const userIdStr = String(user.id)
        const emailStr = (user.email || '').toLowerCase().trim()
        const normId = userIdStr.toLowerCase().trim()
        const uAny = user as any

        // 1. FIRST PRIORITY: User custom action matrix (exact source of truth)
        let userMatrix = state.userActionPermissions[userIdStr] || 
          (emailStr ? state.userActionPermissions[emailStr] : undefined) ||
          state.userActionPermissions[normId]

        if (!userMatrix && uAny.permissions) {
          let pObj: any = uAny.permissions
          if (typeof pObj === 'string') {
            try { pObj = JSON.parse(pObj) } catch {}
          }
          if (pObj && pObj.actionMatrix && typeof pObj.actionMatrix === 'object') {
            userMatrix = pObj.actionMatrix
          }
        }

        if (userMatrix && typeof userMatrix === 'object' && Object.keys(userMatrix).length > 0) {
          const matchedKey = Object.keys(userMatrix).find(k => k.toLowerCase().trim() === mKey)
          if (matchedKey && userMatrix[matchedKey]) {
            const flags = userMatrix[matchedKey]
            return Boolean(flags.view || flags.add || flags.edit || flags.delete)
          }
          // Explicit custom matrix configured: if unlisted or all false, disallow
          return false
        }

        // 2. SECOND PRIORITY: Custom allowedModules list
        let userAllowed: string[] | undefined = undefined
        let hasCustomOverride = false

        if (state.userPermissions[userIdStr] !== undefined) {
          userAllowed = state.userPermissions[userIdStr]
          hasCustomOverride = true
        } else if (emailStr && state.userPermissions[emailStr] !== undefined) {
          userAllowed = state.userPermissions[emailStr]
          hasCustomOverride = true
        } else if (state.userPermissions[normId] !== undefined) {
          userAllowed = state.userPermissions[normId]
          hasCustomOverride = true
        } else if (Array.isArray(uAny.allowedModules)) {
          userAllowed = uAny.allowedModules
          hasCustomOverride = true
        } else if (uAny.permissions) {
          let pObj: any = uAny.permissions
          if (typeof pObj === 'string') {
            try { pObj = JSON.parse(pObj) } catch {}
          }
          if (pObj && Array.isArray(pObj.allowedModules)) {
            userAllowed = pObj.allowedModules
            hasCustomOverride = true
          }
        }

        if (hasCustomOverride && userAllowed && Array.isArray(userAllowed)) {
          return userAllowed.some(m => m.toLowerCase().trim() === mKey)
        }

        // 3. THIRD PRIORITY: Fallback to role action matrix
        const roleMatrix = state.roleActionPermissions[normRole] || (DEFAULT_ROLE_ACTION_PERMISSIONS as any)[normRole]
        if (roleMatrix && typeof roleMatrix === 'object') {
          const matchedKey = Object.keys(roleMatrix).find(k => k.toLowerCase().trim() === mKey)
          if (matchedKey && roleMatrix[matchedKey]) {
            const flags = roleMatrix[matchedKey]
            return Boolean(flags.view || flags.add || flags.edit || flags.delete)
          }
        }

        // 4. Fallback to role permissions list
        const roleMods = state.rolePermissions[normRole] || DEFAULT_ROLE_PERMISSIONS[normRole] || []
        return roleMods.some(m => m.toLowerCase().trim() === mKey)
      },

      getModulesForUser: (user: User | null) => {
        if (!user) return ['Dashboard']
        const normRole = normalizeRole(user.role)
        if (normRole === 'Super Admin') return [...ALL_APP_MODULES]

        const state = get()
        return ALL_APP_MODULES.filter(m => state.isModuleAllowed(user, m))
      },

      getUserModuleActions: (user: User | null, moduleName: string): ModuleActionFlags => {
        if (!user) return { view: false, add: false, edit: false, delete: false }
        
        const mKey = String(moduleName || '').toLowerCase().trim()
        if (mKey === 'dashboard') return { ...DEFAULT_FULL_ACTIONS }

        const normRole = normalizeRole(user.role)
        if (normRole === 'Super Admin') return { ...DEFAULT_FULL_ACTIONS }

        const state = get()
        const userIdStr = String(user.id)
        const emailStr = (user.email || '').toLowerCase().trim()
        const uAny = user as any

        // Check if user has custom action matrix in store or in user object
        let userMatrix = state.userActionPermissions[userIdStr] || (emailStr ? state.userActionPermissions[emailStr] : undefined)
        let hasCustomMatrix = !!(userMatrix && typeof userMatrix === 'object' && Object.keys(userMatrix).length > 0)
        
        if (!hasCustomMatrix && uAny.permissions) {
          let pObj: any = uAny.permissions
          if (typeof pObj === 'string') {
            try { pObj = JSON.parse(pObj) } catch {}
          }
          if (pObj && pObj.actionMatrix && typeof pObj.actionMatrix === 'object') {
            userMatrix = pObj.actionMatrix
            hasCustomMatrix = Object.keys(userMatrix).length > 0
          }
        }

        // Module group alias mappings for backwards-compatible queries (e.g. "Sales" -> Invoices, etc.)
        const ALIAS_MAP: Record<string, string> = {
          'sales': 'Invoices',
          'store': 'Services & Store',
          'packages & retainers': 'Subscriptions',
          'emi milestone plans': 'EMI',
          'team members': 'Teams',
          'payments & payroll': 'Payroll',
          'leave management': 'Leave',
          'attendance & timecards': 'Attendance',
          'knowledge base': 'Knowledge base',
          'documents': 'Files',
        }

        const resolvedName = ALIAS_MAP[mKey] ? ALIAS_MAP[mKey].toLowerCase().trim() : mKey

        // If this user has custom matrix overrides:
        if (hasCustomMatrix && userMatrix) {
          const matchedKey = Object.keys(userMatrix).find(k => {
            const kNorm = k.toLowerCase().trim()
            return kNorm === mKey || kNorm === resolvedName
          })
          if (matchedKey && userMatrix[matchedKey]) {
            const flags = userMatrix[matchedKey]
            return {
              view: Boolean(flags.view),
              add: Boolean(flags.view && flags.add),
              edit: Boolean(flags.view && flags.edit),
              delete: Boolean(flags.view && flags.delete),
            }
          }
          // If custom matrix exists but module not listed, access is completely denied
          return { view: false, add: false, edit: false, delete: false }
        }

        // If user has allowedModules list override:
        let userAllowed: string[] | undefined = undefined
        if (Array.isArray(uAny.allowedModules)) {
          userAllowed = uAny.allowedModules
        } else if (uAny.permissions && Array.isArray(uAny.permissions.allowedModules)) {
          userAllowed = uAny.permissions.allowedModules
        } else if (state.userPermissions[userIdStr] !== undefined) {
          userAllowed = state.userPermissions[userIdStr]
        } else if (emailStr && state.userPermissions[emailStr] !== undefined) {
          userAllowed = state.userPermissions[emailStr]
        }

        if (userAllowed !== undefined && Array.isArray(userAllowed)) {
          const isAllowed = userAllowed.some(m => {
            const mNorm = m.toLowerCase().trim()
            return mNorm === mKey || mNorm === resolvedName
          })
          if (!isAllowed) {
            return { view: false, add: false, edit: false, delete: false }
          }
        }

        // Fallback to role action permissions only if user has no custom overrides
        const roleActionMatrix = (state.roleActionPermissions && state.roleActionPermissions[normRole]) || (DEFAULT_ROLE_ACTION_PERMISSIONS[normRole])
        if (roleActionMatrix) {
          const matchedKey = Object.keys(roleActionMatrix).find(k => {
            const kNorm = k.toLowerCase().trim()
            return kNorm === mKey || kNorm === resolvedName
          })
          if (matchedKey && roleActionMatrix[matchedKey]) {
            return { ...roleActionMatrix[matchedKey] }
          }
        }

        return { view: false, add: false, edit: false, delete: false }
      },

      canPerformAction: (user: User | null, moduleName: string, action: ActionType): boolean => {
        if (!user) return false
        const normRole = normalizeRole(user.role)
        if (normRole === 'Super Admin') return true

        const actions = get().getUserModuleActions(user, moduleName)
        if (!actions.view) return false

        return Boolean(actions[action])
      }
    }),
    {
      name: 'saampark_clean_permissions_store_v3',
    }
  )
)
