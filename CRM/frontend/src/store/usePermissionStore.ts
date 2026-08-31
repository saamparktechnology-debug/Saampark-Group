import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Role, User } from './useAuthStore'

export const ALL_NAV_MODULES = [
  'Dashboard',
  'Events',
  'Clients',
  'Projects',
  'Tasks',
  'Leads',
  'Subscriptions',
  'EMI',
  'Sales',
  'Estimates',
  'Notes',
  'Messages',
  'Teams',
  'Users',
  'Tickets',
  'Knowledge base',
  'Files',
  'Expenses',
  'Reports',
  'Settings',
] as const

// Configurable modules in permission matrix (Dashboard is removed from configurable CRUD since it's global view)
export const CONFIGURABLE_MODULES = [
  'Events',
  'Clients',
  'Projects',
  'Tasks',
  'Leads',
  'Subscriptions',
  'EMI',
  'Sales',
  'Estimates',
  'Notes',
  'Messages',
  'Teams',
  'Users',
  'Tickets',
  'Knowledge base',
  'Files',
  'Expenses',
  'Reports',
  'Settings',
] as const

export const ALL_MODULE_NAMES = CONFIGURABLE_MODULES

export type ModuleName = typeof ALL_NAV_MODULES[number]

export interface ModuleActionFlags {
  view: boolean
  add: boolean
  edit: boolean
  delete: boolean
}

export const MODULE_ACTION_CONFIG: Record<string, { hasAdd: boolean; hasEdit: boolean; hasDelete: boolean; description: string }> = {
  Events: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage calendar schedules & reminders" },
  Clients: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage customer profiles & accounts" },
  Projects: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage delivery roadmaps & milestones" },
  Tasks: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage deliverables, kanban & status" },
  Leads: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage sales pipeline & telecalling" },
  Subscriptions: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage recurring retainers & billing cycles" },
  EMI: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage part-payment contracts & milestone installments" },
  Sales: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage tax invoices, orders & payments" },
  Estimates: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage dynamic itemized service quotes" },
  Notes: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage global broadcasts & scratchpads" },
  Messages: { hasAdd: true, hasEdit: false, hasDelete: true, description: "Real-time multi-user live chat" },
  Teams: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage team directory, member banking & salary/payout ledger" },
  Users: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage account logins & RBAC permissions" },
  Tickets: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage dispute inquiries & resolutions" },
  'Knowledge base': { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage help center articles & guides" },
  Files: { hasAdd: true, hasEdit: false, hasDelete: true, description: "Manage cloud document & Google Drive links" },
  Expenses: { hasAdd: true, hasEdit: true, hasDelete: true, description: "Manage operating expenses & approvals" },
  Reports: { hasAdd: false, hasEdit: true, hasDelete: false, description: "View & export business analytics" },
  Settings: { hasAdd: false, hasEdit: true, hasDelete: false, description: "Configure system & workspace preferences" },
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
  'Super Admin': [...ALL_NAV_MODULES],
  'Admin': [...ALL_NAV_MODULES],
  'Teams': [
    'Dashboard', 'Events', 'Clients', 'Projects', 'Tasks',
    'Leads', 'Subscriptions', 'EMI', 'Sales', 'Estimates', 'Notes',
    'Messages', 'Tickets', 'Knowledge base', 'Files',
    'Expenses', 'Reports', 'Settings'
  ],
  'Clients': [
    'Dashboard', 'Projects', 'Subscriptions', 'EMI', 'Sales', 'Estimates', 'Messages', 'Tickets', 'Files', 'Settings'
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
    const adminMods = DEFAULT_ROLE_PERMISSIONS['Admin']
    CONFIGURABLE_MODULES.forEach((m) => {
      const isAllowed = adminMods.includes(m as ModuleName)
      const config = MODULE_ACTION_CONFIG[m] || { hasAdd: true, hasEdit: true, hasDelete: true }
      init[m] = isAllowed
        ? {
            view: true,
            add: config.hasAdd !== false,
            edit: config.hasEdit !== false,
            delete: config.hasDelete !== false,
          }
        : { view: false, add: false, edit: false, delete: false }
    })
    return init
  })(),
  'Teams': (() => {
    const init: Record<string, ModuleActionFlags> = {}
    const teamMods = DEFAULT_ROLE_PERMISSIONS['Teams']
    CONFIGURABLE_MODULES.forEach((m) => {
      const isAllowed = teamMods.includes(m as ModuleName)
      const config = MODULE_ACTION_CONFIG[m] || { hasAdd: true, hasEdit: true, hasDelete: true }
      init[m] = isAllowed
        ? {
            view: true,
            add: config.hasAdd !== false,
            edit: config.hasEdit !== false,
            delete: false,
          }
        : { view: false, add: false, edit: false, delete: false }
    })
    return init
  })(),
  'Clients': (() => {
    const init: Record<string, ModuleActionFlags> = {}
    const clientMods = DEFAULT_ROLE_PERMISSIONS['Clients']
    CONFIGURABLE_MODULES.forEach((m) => {
      const isAllowed = clientMods.includes(m as ModuleName)
      const canAdd = ['Tickets', 'Messages'].includes(m)
      init[m] = isAllowed
        ? { view: true, add: canAdd, edit: false, delete: false }
        : { view: false, add: false, edit: false, delete: false }
    })
    return init
  })(),
}

interface PermissionState {
  rolePermissions: Record<Role, ModuleName[]>
  roleActionPermissions: Record<Role, Record<string, ModuleActionFlags>>
  userPermissions: Record<string, ModuleName[]>
  userActionPermissions: Record<string, Record<string, ModuleActionFlags>>
  
  // Actions
  fetchRolePermissions: () => Promise<void>
  setRolePermissions: (role: Role, modules: ModuleName[]) => void
  setRoleAllModuleActions: (role: Role, matrix: Record<string, ModuleActionFlags>) => void
  setUserPermissions: (userId: string, modules: ModuleName[]) => void
  setUserModuleAction: (userId: string, moduleName: ModuleName, action: keyof ModuleActionFlags, value: boolean) => void
  setUserAllModuleActions: (userId: string, matrix: Record<string, ModuleActionFlags>) => void
  resetToDefaults: () => void
  
  // Helpers
  isModuleAllowed: (user: User | null, moduleName: string) => boolean
  getModulesForUser: (user: User | null) => ModuleName[]
  getUserModuleActions: (user: User | null, moduleName: string) => ModuleActionFlags
  canPerformAction: (user: User | null, moduleName: string, action: keyof ModuleActionFlags) => boolean
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      rolePermissions: DEFAULT_ROLE_PERMISSIONS,
      roleActionPermissions: DEFAULT_ROLE_ACTION_PERMISSIONS,
      userPermissions: {},
      userActionPermissions: {},

      fetchRolePermissions: async () => {
        try {
          const { fetchModuleDataFromDB } = await import('@/lib/storageSync')
          const dbData = await fetchModuleDataFromDB<any>('role_permissions', null, 'all')
          if (dbData && typeof dbData === 'object') {
            const updates: Partial<PermissionState> = {}
            if (dbData.rolePermissions && typeof dbData.rolePermissions === 'object') {
              updates.rolePermissions = { ...get().rolePermissions, ...dbData.rolePermissions }
            }
            if (dbData.roleActionPermissions && typeof dbData.roleActionPermissions === 'object') {
              const currentActionPerms = get().roleActionPermissions || {}
              const mergedActionPerms: Record<string, Record<string, ModuleActionFlags>> = { ...currentActionPerms }
              for (const [r, matrix] of Object.entries(dbData.roleActionPermissions)) {
                if (matrix && typeof matrix === 'object') {
                  mergedActionPerms[r] = { ...(matrix as any) }
                }
              }
              updates.roleActionPermissions = mergedActionPerms as any
            }
            if (Object.keys(updates).length > 0) {
              set(updates)
            }
          }
        } catch (err) {
          console.warn('fetchRolePermissions error:', err)
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
            [norm]: matrix,
          },
        }))
      },

      setUserPermissions: (userId: string, modules: ModuleName[]) => {
        set((state) => ({
          userPermissions: {
            ...state.userPermissions,
            [userId]: modules,
          },
        }))
      },

      setUserModuleAction: (userId: string, moduleName: ModuleName, action: keyof ModuleActionFlags, value: boolean) => {
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
        set((state) => ({
          userActionPermissions: {
            ...state.userActionPermissions,
            [userId]: {
              ...(state.userActionPermissions[userId] || {}),
              ...matrix,
            },
          },
        }))
      },

      resetToDefaults: () => {
        set({
          rolePermissions: DEFAULT_ROLE_PERMISSIONS,
          roleActionPermissions: DEFAULT_ROLE_ACTION_PERMISSIONS,
          userPermissions: {},
          userActionPermissions: {},
        })
      },

      isModuleAllowed: (user: User | null, moduleName: string) => {
        if (!user) return false
        
        // Dashboard is ALWAYS accessible to all logged in users
        if (moduleName === 'Dashboard') return true

        const normRole = normalizeRole(user.role)
        // Super Admin ALWAYS has master access to all modules
        if (normRole === 'Super Admin') return true

        const state = get()
        const userIdStr = String(user.id)
        const emailStr = (user.email || '').toLowerCase().trim()

        const uAny = user as any
        // 1. Extract explicit user allowed modules array from user object or Zustand store
        let userAllowed: string[] | undefined = undefined
        if (Array.isArray(uAny.allowedModules) && uAny.allowedModules.length > 0) {
          userAllowed = uAny.allowedModules
        } else if (uAny.permissions) {
          let pObj: any = uAny.permissions
          if (typeof pObj === 'string') {
            try { pObj = JSON.parse(pObj) } catch {}
          }
          if (pObj && Array.isArray(pObj.allowedModules) && pObj.allowedModules.length > 0) {
            userAllowed = pObj.allowedModules
          }
        }

        if (!userAllowed) {
          userAllowed = state.userPermissions[userIdStr] || (emailStr ? state.userPermissions[emailStr] : undefined)
        }

        // If user explicitly has an allowed modules list, strictly restrict access to ONLY those modules!
        if (userAllowed && Array.isArray(userAllowed)) {
          return userAllowed.includes(moduleName as ModuleName)
        }

        // 2. Check explicit userActionPermissions matrix
        let userMatrix = state.userActionPermissions[userIdStr] || (emailStr ? state.userActionPermissions[emailStr] : undefined)
        if (!userMatrix && uAny.permissions) {
          let pObj: any = uAny.permissions
          if (typeof pObj === 'string') {
            try { pObj = JSON.parse(pObj) } catch {}
          }
          if (pObj && pObj.actionMatrix && typeof pObj.actionMatrix === 'object') {
            userMatrix = pObj.actionMatrix
          }
        }

        if (userMatrix && userMatrix[moduleName] !== undefined) {
          const flags = userMatrix[moduleName]
          return !!(flags && (flags.view || flags.add || flags.edit || flags.delete))
        }

        // 3. Fallback to role permissions
        const roleMods = state.rolePermissions[normRole] || DEFAULT_ROLE_PERMISSIONS[normRole] || []
        return roleMods.includes(moduleName as ModuleName)
      },

      getModulesForUser: (user: User | null) => {
        if (!user) return ['Dashboard']
        
        const normRole = normalizeRole(user.role)
        if (normRole === 'Super Admin') return [...ALL_NAV_MODULES]

        const state = get()
        const userIdStr = String(user.id)
        const emailStr = (user.email || '').toLowerCase().trim()

        const uAny = user as any
        let userAllowed: string[] | undefined = undefined
        if (Array.isArray(uAny.allowedModules) && uAny.allowedModules.length > 0) {
          userAllowed = uAny.allowedModules
        } else if (uAny.permissions) {
          let pObj: any = uAny.permissions
          if (typeof pObj === 'string') {
            try { pObj = JSON.parse(pObj) } catch {}
          }
          if (pObj && Array.isArray(pObj.allowedModules) && pObj.allowedModules.length > 0) {
            userAllowed = pObj.allowedModules
          }
        }

        if (!userAllowed) {
          userAllowed = state.userPermissions[userIdStr] || (emailStr ? state.userPermissions[emailStr] : undefined)
        }

        if (userAllowed && Array.isArray(userAllowed)) {
          const activeMods = ALL_NAV_MODULES.filter((m) => userAllowed!.includes(m as ModuleName))
          return activeMods.includes('Dashboard') ? activeMods : ['Dashboard', ...activeMods]
        }

        let userMatrix = state.userActionPermissions[userIdStr] || (emailStr ? state.userActionPermissions[emailStr] : undefined)
        if (!userMatrix && uAny.permissions) {
          let pObj: any = uAny.permissions
          if (typeof pObj === 'string') {
            try { pObj = JSON.parse(pObj) } catch {}
          }
          if (pObj && pObj.actionMatrix && typeof pObj.actionMatrix === 'object') {
            userMatrix = pObj.actionMatrix
          }
        }

        const roleMods = state.rolePermissions[normRole] || DEFAULT_ROLE_PERMISSIONS[normRole] || ['Dashboard']

        const activeMods = ALL_NAV_MODULES.filter((m) => {
          if (userMatrix && userMatrix[m] !== undefined) {
            const flags = userMatrix[m]
            return flags ? (flags.view || flags.add || flags.edit || flags.delete) : false
          }
          return roleMods.includes(m as ModuleName)
        })

        return activeMods.includes('Dashboard') ? activeMods : ['Dashboard', ...activeMods]
      },

      getUserModuleActions: (user: User | null, moduleName: string): ModuleActionFlags => {
        if (!user) return { view: false, add: false, edit: false, delete: false }
        
        // Dashboard is always viewable
        if (moduleName === 'Dashboard') return { view: true, add: false, edit: false, delete: false }

        const normRole = normalizeRole(user.role)
        // Super Admin ALWAYS has full action rights
        if (normRole === 'Super Admin') return { ...DEFAULT_FULL_ACTIONS }

        // FIRST check if module itself is allowed for this user
        const isAllowed = get().isModuleAllowed(user, moduleName)
        if (!isAllowed) return { view: false, add: false, edit: false, delete: false }

        const state = get()
        const userIdStr = String(user.id)
        const emailStr = (user.email || '').toLowerCase().trim()

        const uAny = user as any
        let userMatrix = state.userActionPermissions[userIdStr] || (emailStr ? state.userActionPermissions[emailStr] : undefined)
        if (!userMatrix && uAny.permissions) {
          let pObj: any = uAny.permissions
          if (typeof pObj === 'string') {
            try { pObj = JSON.parse(pObj) } catch {}
          }
          if (pObj && pObj.actionMatrix && typeof pObj.actionMatrix === 'object') {
            userMatrix = pObj.actionMatrix
          }
        }

        if (userMatrix && userMatrix[moduleName]) {
          return userMatrix[moduleName]
        }

        const roleActionMatrix = (state.roleActionPermissions && state.roleActionPermissions[normRole]) || (DEFAULT_ROLE_ACTION_PERMISSIONS[normRole])
        if (roleActionMatrix && roleActionMatrix[moduleName]) {
          return roleActionMatrix[moduleName]
        }

        const roleMods = state.rolePermissions[normRole] || DEFAULT_ROLE_PERMISSIONS[normRole] || []
        const isModInRole = roleMods.includes(moduleName as ModuleName)
        if (!isModInRole) return { view: false, add: false, edit: false, delete: false }

        const config = MODULE_ACTION_CONFIG[moduleName] || { hasAdd: true, hasEdit: true, hasDelete: true }
        if (normRole === 'Teams') {
          return { view: true, add: config.hasAdd !== false, edit: config.hasEdit !== false, delete: false }
        }
        if (normRole === 'Clients') {
          const canAdd = ['Tickets', 'Messages'].includes(moduleName)
          return { view: true, add: canAdd, edit: false, delete: false }
        }
        return {
          view: true,
          add: config.hasAdd !== false,
          edit: config.hasEdit !== false,
          delete: config.hasDelete !== false,
        }
      },

      canPerformAction: (user: User | null, moduleName: string, action: keyof ModuleActionFlags): boolean => {
        if (!user) return false
        
        // Dashboard is view-only
        if (moduleName === 'Dashboard') return action === 'view'

        const normRole = normalizeRole(user.role)
        // Super Admin ALWAYS has master access to all actions across all modules
        if (normRole === 'Super Admin') return true

        // Clients can NEVER delete records in any module (Invoices, Projects, Orders, Payments, EMI, etc.)
        if (normRole === 'Clients' && action === 'delete') {
          return false
        }

        // Clients can only add/edit tickets and messages
        if (normRole === 'Clients' && (action === 'edit' || action === 'add')) {
          return ['Tickets', 'Messages'].includes(moduleName)
        }

        const flags = get().getUserModuleActions(user, moduleName)
        return Boolean(flags && flags[action])
      },
    }),
    {
      name: 'saampark-module-permissions',
    }
  )
)

if (typeof window !== 'undefined') {
  setTimeout(() => {
    usePermissionStore.getState().fetchRolePermissions?.()
  }, 100)
  window.addEventListener('saampark_data_synced', () => {
    usePermissionStore.getState().fetchRolePermissions?.()
  })
}

