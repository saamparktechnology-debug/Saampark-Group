import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Role, User } from './useAuthStore'

export const ALL_MODULE_NAMES = [
  'Dashboard',
  'Events',
  'Clients',
  'Projects',
  'Tasks',
  'Leads',
  'Subscriptions',
  'Sales',
  'Estimates',
  'Proposals',
  'Notes',
  'Messages',
  'Team',
  'Users',
  'Tickets',
  'Knowledge base',
  'Files',
  'Expenses',
  'Reports',
  'Settings',
] as const

export type ModuleName = typeof ALL_MODULE_NAMES[number]

export interface ModuleActionFlags {
  view: boolean
  add: boolean
  edit: boolean
  delete: boolean
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

// Role normalization helper to prevent singular/plural or API mismatch
export function normalizeRole(role: string): Role {
  if (!role) return 'User'
  const lower = role.toLowerCase().trim()
  if (lower.includes('super')) return 'Super Admin'
  if (lower.includes('admin')) return 'Admin'
  if (lower.includes('client')) return 'Clients'
  if (lower.includes('team')) return 'Teams'
  return 'User'
}

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, ModuleName[]> = {
  'Super Admin': [...ALL_MODULE_NAMES],
  'Admin': [...ALL_MODULE_NAMES],
  'Teams': [
    'Dashboard', 'Events', 'Clients', 'Projects', 'Tasks',
    'Leads', 'Subscriptions', 'Sales', 'Estimates', 'Notes',
    'Messages', 'Team', 'Tickets', 'Knowledge base', 'Files',
    'Expenses', 'Reports'
  ],
  'User': [
    'Dashboard', 'Events', 'Projects', 'Tasks', 'Notes',
    'Messages', 'Tickets', 'Knowledge base', 'Files'
  ],
  'Clients': [
    'Dashboard', 'Knowledge base', 'Files', 'Tickets', 'Projects', 'Sales'
  ]
}

interface PermissionState {
  rolePermissions: Record<Role, ModuleName[]>
  userPermissions: Record<string, ModuleName[]>
  userActionPermissions: Record<string, Record<string, ModuleActionFlags>>
  
  // Actions
  setRolePermissions: (role: Role, modules: ModuleName[]) => void
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
      userPermissions: {},
      userActionPermissions: {},

      setRolePermissions: (role: Role, modules: ModuleName[]) => {
        const norm = normalizeRole(role)
        set((state) => ({
          rolePermissions: {
            ...state.rolePermissions,
            [norm]: modules,
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
          const currentFlags = userMatrix[moduleName] || { ...DEFAULT_FULL_ACTIONS }
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
            [userId]: matrix,
          },
        }))
      },

      resetToDefaults: () => {
        set({
          rolePermissions: DEFAULT_ROLE_PERMISSIONS,
          userPermissions: {},
          userActionPermissions: {},
        })
      },

      isModuleAllowed: (user: User | null, moduleName: string) => {
        if (!user) return false
        
        // Dashboard is ALWAYS accessible to all logged in users
        if (moduleName === 'Dashboard') return true

        const normRole = normalizeRole(user.role)
        if (normRole === 'Super Admin' || normRole === 'Admin') return true

        const state = get()
        const userIdStr = String(user.id)
        const userMatrix = state.userActionPermissions[userIdStr]

        if (userMatrix && userMatrix[moduleName]) {
          const flags = userMatrix[moduleName]
          return flags.view || flags.add || flags.edit || flags.delete
        }

        if (state.userPermissions[userIdStr]) {
          return state.userPermissions[userIdStr].includes(moduleName as ModuleName)
        }

        const roleMods = state.rolePermissions[normRole] || DEFAULT_ROLE_PERMISSIONS[normRole] || []
        return roleMods.includes(moduleName as ModuleName)
      },

      getModulesForUser: (user: User | null) => {
        if (!user) return ['Dashboard']
        
        const normRole = normalizeRole(user.role)
        if (normRole === 'Super Admin' || normRole === 'Admin') return [...ALL_MODULE_NAMES]

        const state = get()
        const userIdStr = String(user.id)
        if (state.userPermissions[userIdStr]) {
          return state.userPermissions[userIdStr]
        }

        const allowed = state.rolePermissions[normRole] || DEFAULT_ROLE_PERMISSIONS[normRole] || ['Dashboard']
        return allowed.includes('Dashboard') ? allowed : ['Dashboard', ...allowed]
      },

      getUserModuleActions: (user: User | null, moduleName: string): ModuleActionFlags => {
        if (!user) return { view: false, add: false, edit: false, delete: false }
        
        const normRole = normalizeRole(user.role)
        if (normRole === 'Super Admin' || normRole === 'Admin') return { ...DEFAULT_FULL_ACTIONS }

        const state = get()
        const userIdStr = String(user.id)
        const userMatrix = state.userActionPermissions[userIdStr]

        if (userMatrix && userMatrix[moduleName]) {
          return userMatrix[moduleName]
        }

        const isAllowed = get().isModuleAllowed(user, moduleName)
        return isAllowed ? { ...DEFAULT_FULL_ACTIONS } : { view: false, add: false, edit: false, delete: false }
      },

      canPerformAction: (user: User | null, moduleName: string, action: keyof ModuleActionFlags): boolean => {
        if (!user) return false
        
        const normRole = normalizeRole(user.role)
        if (normRole === 'Super Admin' || normRole === 'Admin') return true

        const flags = get().getUserModuleActions(user, moduleName)
        return flags[action]
      },
    }),
    {
      name: 'saampark-module-permissions',
    }
  )
)
