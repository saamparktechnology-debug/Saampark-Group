"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  Lock, 
  UserCheck, 
  RotateCcw, 
  Save, 
  Loader2, 
  Sparkles,
  Layers,
  CheckCheck,
  CheckCircle2,
  Database
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { PermissionService } from "@/services/permissionService"
import { 
  CONFIGURABLE_MODULES, 
  CLEAN_MODULE_CATEGORIES,
  ALL_ACTIONS,
  usePermissionStore, 
  ModuleActionFlags,
  DEFAULT_ROLE_ACTION_PERMISSIONS
} from "@/store/usePermissionStore"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { getUsers } from "@/app/feature/users/services/userService"
import { UserItem } from "@/app/feature/users/types"

type Tab = "permissions" | "user-permissions" | "roles" | "custom-roles"

interface CustomRole { id: string; name: string; description?: string; permissionCount?: number }

// The clean 4 core actions requested: View, Add, Edit, Delete
const ACTIONS = [
  { key: "view", label: "View", icon: "👁️" },
  { key: "add", label: "Add", icon: "➕" },
  { key: "edit", label: "Edit", icon: "✏️" },
  { key: "delete", label: "Delete", icon: "🗑️" },
] as const

const DEFAULT_ROLES_CONFIG = [
  { 
    name: "Super Admin", 
    description: "Full master governance with unrestricted access across all companies and branches", 
    permissionCount: 4 * CONFIGURABLE_MODULES.length,
    badge: "Master Access",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
  },
  { 
    name: "Admin", 
    description: "Administrative access to configure and manage operational modules and team records", 
    permissionCount: 4 * CONFIGURABLE_MODULES.length,
    badge: "Full Admin",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
  },
  { 
    name: "Teams", 
    description: "Operational staff executing assigned daily CRM telecalling, projects, tasks & records", 
    permissionCount: 3 * CONFIGURABLE_MODULES.length,
    badge: "Operational",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
  },
  { 
    name: "Clients", 
    description: "Restricted client portal access to digital proposals, milestones, tickets & invoices", 
    permissionCount: 15,
    badge: "Client Portal",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
  },
]

export default function PermissionsMain() {
  const { user: currentUser, activeCompanyId, activeBranchId, companies, branches } = useAuthStore()
  const { 
    roleActionPermissions, 
    userActionPermissions,
    setRoleAllModuleActions, 
    setUserAllModuleActions,
    fetchRolePermissions,
    fetchUserPermissions,
  } = usePermissionStore()

  const [activeTab, setActiveTab] = React.useState<Tab>("permissions")
  const [customRoles, setCustomRoles] = React.useState<CustomRole[]>([])
  const [usersList, setUsersList] = React.useState<UserItem[]>([])
  const [selectedRole, setSelectedRole] = React.useState<string>("Admin")
  const [selectedUserId, setSelectedUserId] = React.useState<string>("")
  const [permissionMatrix, setPermissionMatrix] = React.useState<Record<string, Record<string, boolean>>>({})
  const [userPermissionMatrix, setUserPermissionMatrix] = React.useState<Record<string, Record<string, boolean>>>({})
  const [isLoadingMatrix, setIsLoadingMatrix] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Filtering & Category Navigation
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  
  // Custom role modal states
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false)
  const [editingRole, setEditingRole] = React.useState<CustomRole | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<CustomRole | null>(null)
  const [formName, setFormName] = React.useState("")
  const [formDescription, setFormDescription] = React.useState("")

  const loadRoles = React.useCallback(async () => {
    try { 
      const res = await PermissionService.getCustomRoles()
      const data = res?.data?.data || res?.data || res
      setCustomRoles(Array.isArray(data) ? data : []) 
    } catch { }
  }, [])

  const loadUsersList = React.useCallback(async () => {
    try {
      const list = await getUsers("all")
      setUsersList(Array.isArray(list) ? list : [])
    } catch { }
  }, [])

  React.useEffect(() => { 
    loadRoles()
    loadUsersList()
  }, [loadRoles, loadUsersList])

  // Filter users strictly matching active company / branch
  const visibleUsersList = React.useMemo(() => {
    if (!usersList || usersList.length === 0) return []
    const isSuperAdmin = currentUser?.role === "Super Admin"
    const targetComp = (activeCompanyId || currentUser?.companyId || "").toLowerCase().trim()
    const targetBranch = activeBranchId || currentUser?.branchId

    let filtered = usersList

    if (!isSuperAdmin) {
      filtered = filtered.filter((u) => u.role !== "Super Admin")
    }

    if (targetComp && targetComp !== "all") {
      const matchedCompany = companies.find(
        (c) =>
          String(c.id).toLowerCase().trim() === targetComp ||
          String(c.slug || "").toLowerCase().trim() === targetComp ||
          String(c.name || "").toLowerCase().trim() === targetComp
      )
      const validTargetCompIds = new Set<string>([
        targetComp,
        ...(matchedCompany?.id ? [String(matchedCompany.id).toLowerCase().trim()] : []),
        ...(matchedCompany?.slug ? [String(matchedCompany.slug).toLowerCase().trim()] : []),
        ...(matchedCompany?.name ? [String(matchedCompany.name).toLowerCase().trim()] : []),
      ])

      filtered = filtered.filter((u) => {
        if (u.role === "Super Admin") {
          const sCompIds = (u.companyIds || [u.companyId]).map(id => String(id || "").toLowerCase().trim())
          return sCompIds.some(id => validTargetCompIds.has(id)) || u.email === "hiisupriya@gmail.com"
        }

        const uCompIds = (u.companyIds && u.companyIds.length > 0)
          ? u.companyIds.map(id => String(id).toLowerCase().trim())
          : (u.companyId ? [String(u.companyId).toLowerCase().trim()] : [])
        
        if (u.companyName) {
          uCompIds.push(String(u.companyName).toLowerCase().trim())
        }

        return uCompIds.some(id => validTargetCompIds.has(id))
      })
    }

    if (targetBranch && targetBranch !== "all") {
      const targetBranchObj = branches.find(b => b.id === targetBranch || b.name.toLowerCase() === targetBranch.toLowerCase())
      const targetBranchId = String(targetBranchObj?.id || targetBranch).toLowerCase().trim()
      const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

      filtered = filtered.filter((u) => {
        if (u.role === "Super Admin") return true
        const uBranchIds = (u.branchIds && u.branchIds.length > 0)
          ? u.branchIds.map(id => String(id).toLowerCase().trim())
          : (u.branchId ? [String(u.branchId).toLowerCase().trim()] : [])
        const uBranchName = String(u.branchName || "").toLowerCase().trim()

        return (
          uBranchIds.includes(targetBranchId) ||
          (targetBranchName && uBranchIds.includes(targetBranchName)) ||
          String(u.branchId || "").toLowerCase().trim() === targetBranchId ||
          (targetBranchName && (uBranchName === targetBranchName || String(u.branchId || "").toLowerCase().trim() === targetBranchName))
        )
      })
    }

    return filtered
  }, [usersList, currentUser, activeCompanyId, activeBranchId, companies, branches])

  // Sync selectedUserId
  React.useEffect(() => {
    if (visibleUsersList.length > 0) {
      if (!selectedUserId || !visibleUsersList.some(u => u.id === selectedUserId)) {
        setSelectedUserId(visibleUsersList[0].id)
      }
    } else {
      setSelectedUserId("")
    }
  }, [visibleUsersList, selectedUserId])

  // Load role matrix from backend
  React.useEffect(() => {
    if (!selectedRole) return
    let isMounted = true
    const fetchMatrix = async () => {
      setIsLoadingMatrix(true)
      try {
        const res = await PermissionService.getRoleMatrix(selectedRole)
        const dbMatrix = res?.data?.data
        const fallbackMatrix = (roleActionPermissions as any)[selectedRole] || (DEFAULT_ROLE_ACTION_PERMISSIONS as any)[selectedRole] || {}
        const sourceMatrix = (dbMatrix && typeof dbMatrix === 'object') ? dbMatrix : fallbackMatrix

        const filled: Record<string, Record<string, boolean>> = {}
        CONFIGURABLE_MODULES.forEach(m => {
          filled[m] = {}
          ACTIONS.forEach(a => { 
            filled[m][a.key] = sourceMatrix[m]?.[a.key] ?? (selectedRole === 'Super Admin')
          })
        })
        if (isMounted) setPermissionMatrix(filled)
      } catch {
        const fallbackMatrix = (roleActionPermissions as any)[selectedRole] || (DEFAULT_ROLE_ACTION_PERMISSIONS as any)[selectedRole] || {}
        const filled: Record<string, Record<string, boolean>> = {}
        CONFIGURABLE_MODULES.forEach(m => {
          filled[m] = {}
          ACTIONS.forEach(a => { 
            filled[m][a.key] = fallbackMatrix[m]?.[a.key] ?? (selectedRole === 'Super Admin')
          })
        })
        if (isMounted) setPermissionMatrix(filled)
      } finally {
        if (isMounted) setIsLoadingMatrix(false)
      }
    }
    fetchMatrix()
    return () => { isMounted = false }
  }, [selectedRole, roleActionPermissions])

  // Load user matrix when selectedUserId changes
  React.useEffect(() => {
    if (!selectedUserId) return
    let isMounted = true
    const fetchUserMatrix = async () => {
      setIsLoadingMatrix(true)
      try {
        const selectedUser = usersList.find(u => u.id === selectedUserId)
        const userRole = selectedUser?.role || "Teams"
        
        const res = await PermissionService.getUserMatrix(selectedUserId)
        const dbUserMatrix = res?.data?.data
        
        const roleMatrix = (roleActionPermissions as any)[userRole] || (DEFAULT_ROLE_ACTION_PERMISSIONS as any)[userRole] || {}
        const sourceMatrix = (dbUserMatrix && typeof dbUserMatrix === 'object') ? dbUserMatrix : roleMatrix

        const filled: Record<string, Record<string, boolean>> = {}
        CONFIGURABLE_MODULES.forEach(m => {
          filled[m] = {}
          ACTIONS.forEach(a => { 
            filled[m][a.key] = sourceMatrix[m]?.[a.key] ?? (userRole === 'Super Admin')
          })
        })
        if (isMounted) setUserPermissionMatrix(filled)
      } catch {
        const selectedUser = usersList.find(u => u.id === selectedUserId)
        const userRole = selectedUser?.role || "Teams"
        const roleMatrix = (roleActionPermissions as any)[userRole] || (DEFAULT_ROLE_ACTION_PERMISSIONS as any)[userRole] || {}
        const filled: Record<string, Record<string, boolean>> = {}
        CONFIGURABLE_MODULES.forEach(m => {
          filled[m] = {}
          ACTIONS.forEach(a => { 
            filled[m][a.key] = roleMatrix[m]?.[a.key] ?? (userRole === 'Super Admin')
          })
        })
        if (isMounted) setUserPermissionMatrix(filled)
      } finally {
        if (isMounted) setIsLoadingMatrix(false)
      }
    }
    fetchUserMatrix()
    return () => { isMounted = false }
  }, [selectedUserId, usersList, roleActionPermissions])

  const handlePermissionToggle = (module: string, action: string) => {
    setPermissionMatrix(prev => ({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module]?.[action] }
    }))
  }

  const handleUserPermissionToggle = (module: string, action: string) => {
    setUserPermissionMatrix(prev => ({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module]?.[action] }
    }))
  }

  const handleToggleRow = (module: string, isUser = false) => {
    const currentMatrix = isUser ? userPermissionMatrix : permissionMatrix
    const row = currentMatrix[module] || {}
    const allChecked = ACTIONS.every(a => row[a.key])
    const newRow: Record<string, boolean> = {}
    ACTIONS.forEach(a => { newRow[a.key] = !allChecked })

    if (isUser) {
      setUserPermissionMatrix(prev => ({ ...prev, [module]: newRow }))
    } else {
      setPermissionMatrix(prev => ({ ...prev, [module]: newRow }))
    }
  }

  const handleToggleCategory = (categoryKey: string, isUser = false) => {
    const group = CLEAN_MODULE_CATEGORIES[categoryKey]
    if (!group) return

    const currentMatrix = isUser ? userPermissionMatrix : permissionMatrix
    const allEnabled = group.modules.every(m => 
      ACTIONS.every(a => !!currentMatrix[m.key]?.[a.key])
    )

    const updated: Record<string, Record<string, boolean>> = { ...currentMatrix }
    group.modules.forEach(m => {
      updated[m.key] = { ...(updated[m.key] || {}) }
      ACTIONS.forEach(a => {
        updated[m.key][a.key] = !allEnabled
      })
    })

    if (isUser) {
      setUserPermissionMatrix(updated)
    } else {
      setPermissionMatrix(updated)
    }
  }

  const handleSetTemplate = (template: "full" | "view" | "none", isUser = false) => {
    const updated: Record<string, Record<string, boolean>> = {}
    CONFIGURABLE_MODULES.forEach(m => {
      updated[m] = {
        view: template === "full" || template === "view",
        add: template === "full",
        edit: template === "full",
        delete: template === "full",
      }
    })
    if (isUser) setUserPermissionMatrix(updated)
    else setPermissionMatrix(updated)
  }

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return
    setIsSaving(true)
    try {
      const typed: Record<string, ModuleActionFlags> = {}
      Object.keys(permissionMatrix).forEach(m => { 
        typed[m] = {
          view: !!permissionMatrix[m]?.view,
          add: !!permissionMatrix[m]?.add,
          edit: !!permissionMatrix[m]?.edit,
          delete: !!permissionMatrix[m]?.delete,
        }
      })

      await executeWithFeedback(async () => { 
        await PermissionService.saveRoleMatrix(selectedRole, typed)
        setRoleAllModuleActions(selectedRole as any, typed)
        await fetchRolePermissions()
      }, {
        actionType: "update", 
        successTitle: "Role Permissions Saved", 
        successMsg: "Permission matrix saved to database for role " + selectedRole + "."
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveUserPermissions = async () => {
    if (!selectedUserId) return
    setIsSaving(true)
    try {
      const typed: Record<string, ModuleActionFlags> = {}
      Object.keys(userPermissionMatrix).forEach(m => { 
        typed[m] = {
          view: !!userPermissionMatrix[m]?.view,
          add: !!userPermissionMatrix[m]?.add,
          edit: !!userPermissionMatrix[m]?.edit,
          delete: !!userPermissionMatrix[m]?.delete,
        }
      })

      const selectedUser = usersList.find(u => u.id === selectedUserId)
      const userLabel = selectedUser ? selectedUser.name + " (" + selectedUser.email + ")" : selectedUserId

      await executeWithFeedback(async () => { 
        await PermissionService.saveUserMatrix(selectedUserId, typed)
        if (selectedUser?.email) {
          await PermissionService.saveUserMatrix(selectedUser.email, typed)
        }
        setUserAllModuleActions(selectedUserId, typed)
        if (selectedUser?.email) {
          setUserAllModuleActions(selectedUser.email, typed)
        }
        await fetchUserPermissions(selectedUserId)
      }, {
        actionType: "update", 
        successTitle: "User Overrides Saved", 
        successMsg: "Custom permission overrides saved to database for " + userLabel + "."
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetUserToRoleDefaults = () => {
    const selectedUser = usersList.find(u => u.id === selectedUserId)
    const userRole = selectedUser?.role || "Teams"
    const roleMatrix = (roleActionPermissions as any)[userRole] || (DEFAULT_ROLE_ACTION_PERMISSIONS as any)[userRole] || {}
    const filled: Record<string, Record<string, boolean>> = {}
    CONFIGURABLE_MODULES.forEach(m => {
      filled[m] = {}
      ACTIONS.forEach(a => { 
        filled[m][a.key] = roleMatrix[m]?.[a.key] ?? false 
      })
    })
    setUserPermissionMatrix(filled)
  }

  // Filtered module list by category & search
  const visibleCategories = React.useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim()
    const result: Array<{ key: string; label: string; modules: { key: string; name: string; description: string }[] }> = []

    Object.entries(CLEAN_MODULE_CATEGORIES).forEach(([catKey, catData]) => {
      if (selectedCategory !== "all" && selectedCategory !== catKey) return

      const matchingModules = catData.modules.filter(m => {
        if (!searchLower) return true
        return (
          m.name.toLowerCase().includes(searchLower) ||
          m.key.toLowerCase().includes(searchLower) ||
          m.description.toLowerCase().includes(searchLower)
        )
      })

      if (matchingModules.length > 0) {
        result.push({
          key: catKey,
          label: catData.label,
          modules: matchingModules
        })
      }
    })

    return result
  }, [selectedCategory, searchQuery])

  // Count active permissions currently checked in matrix
  const currentTotalChecked = React.useMemo(() => {
    const matrix = activeTab === "user-permissions" ? userPermissionMatrix : permissionMatrix
    let count = 0
    Object.values(matrix).forEach(mod => {
      Object.values(mod).forEach(val => {
        if (val) count++
      })
    })
    return count
  }, [activeTab, userPermissionMatrix, permissionMatrix])

  const selectedUserData = visibleUsersList.find(u => u.id === selectedUserId) || usersList.find(u => u.id === selectedUserId)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Shield className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Permissions & Access Control</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {CONFIGURABLE_MODULES.length} Modules • View, Add, Edit, Delete
            </span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Configure role-based access control (RBAC) and individual user overrides with instant database persistence
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-700 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{currentTotalChecked} Active Checks</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px overflow-x-auto">
        {(["permissions", "user-permissions", "roles", "custom-roles"] as Tab[]).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={"flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer " + (
              activeTab === tab 
                ? "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30" 
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            {tab === "permissions" && <Shield size={14} />}
            {tab === "user-permissions" && <UserCheck size={14} />}
            {tab === "roles" && <Lock size={14} />}
            {tab === "custom-roles" && <Sparkles size={14} />}
            <span>
              {tab === "permissions" && "Role Permission Matrix"}
              {tab === "user-permissions" && "Per-User Permissions"}
              {tab === "roles" && "Roles Overview"}
              {tab === "custom-roles" && "Custom Roles"}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Role Permission Matrix */}
      {activeTab === "permissions" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Configuring Role:</span>
              <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)} 
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {["Super Admin", "Admin", "Teams", "Clients", ...customRoles.map(r => r.name)].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Search Box */}
              <div className="relative w-52">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search modules..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick Template Helpers */}
              <div className="flex items-center gap-1 pl-2 border-l border-zinc-200 dark:border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSetTemplate("full", false)}
                  className="px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:underline cursor-pointer"
                >
                  Full Access
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTemplate("view", false)}
                  className="px-2 py-0.5 rounded font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:underline cursor-pointer"
                >
                  View Only
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTemplate("none", false)}
                  className="px-2 py-0.5 rounded font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleSaveRolePermissions} 
                disabled={isSaving || isLoadingMatrix}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save Role Permissions</span>
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={"px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer " + (
                selectedCategory === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
              )}
            >
              All Modules ({CONFIGURABLE_MODULES.length})
            </button>
            {Object.entries(CLEAN_MODULE_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={"px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer " + (
                  selectedCategory === key
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
                )}
              >
                {cat.label} ({cat.modules.length})
              </button>
            ))}
          </div>

          {/* Matrix Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
            {isLoadingMatrix ? (
              <div className="p-16 flex flex-col items-center justify-center text-zinc-400 gap-3">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <span className="text-xs">Loading permissions matrix from database...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4 min-w-[220px]">Module</th>
                      <th className="py-3 px-2 text-center w-20">Row All</th>
                      {ACTIONS.map(a => (
                        <th key={a.key} className="py-3 px-3 text-center min-w-[70px] capitalize font-bold text-zinc-700 dark:text-zinc-300">
                          <span className="mr-1">{a.icon}</span> {a.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                    {visibleCategories.map(cat => (
                      <React.Fragment key={cat.key}>
                        {/* Category Header Row */}
                        <tr className="bg-zinc-100/70 dark:bg-zinc-800/40 border-t border-b border-zinc-200/60 dark:border-zinc-800">
                          <td colSpan={ACTIONS.length + 2} className="py-2 px-4">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                                <Layers size={13} className="text-blue-600" />
                                <span>{cat.label} ({cat.modules.length} Modules)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleCategory(cat.key, false)}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCheck size={12} />
                                <span>Toggle Category</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Individual Module Rows */}
                        {cat.modules.map(mod => {
                          const isAllChecked = ACTIONS.every(a => permissionMatrix[mod.key]?.[a.key])
                          return (
                            <tr key={mod.key} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-zinc-900 dark:text-zinc-100">{mod.name}</div>
                                <div className="text-[10px] text-zinc-400 line-clamp-1">{mod.description}</div>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRow(mod.key, false)}
                                  className={"text-[10px] px-2 py-0.5 rounded font-medium border transition-colors cursor-pointer " + (
                                    isAllChecked 
                                      ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400" 
                                      : "bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700"
                                  )}
                                >
                                  {isAllChecked ? "Clear" : "All"}
                                </button>
                              </td>
                              {ACTIONS.map(a => {
                                const checked = !!permissionMatrix[mod.key]?.[a.key]
                                return (
                                  <td key={a.key} className="py-3 px-3 text-center">
                                    <button 
                                      type="button"
                                      onClick={() => handlePermissionToggle(mod.key, a.key)} 
                                      title={"Toggle " + a.label + " for " + mod.name}
                                      className={"w-6 h-6 mx-auto rounded-md border flex items-center justify-center transition-all cursor-pointer " + (
                                        checked 
                                          ? "bg-blue-600 border-blue-600 text-white shadow-xs" 
                                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-transparent hover:border-blue-400"
                                      )}
                                    >
                                      {checked && <Check size={12} strokeWidth={3} />}
                                    </button>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Table Footer */}
            <div className="px-5 py-3.5 bg-zinc-50/70 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs text-zinc-500">
                All changes take effect immediately across active user accounts.
              </span>
              <button 
                onClick={handleSaveRolePermissions} 
                disabled={isSaving || isLoadingMatrix}
                className="px-5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save Role Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Per-User Permission Overrides */}
      {activeTab === "user-permissions" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Select User Account:</label>
                <select 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)} 
                  className="w-full sm:w-96 px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select a user account</option>
                  {visibleUsersList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) — {u.email}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUserData && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleResetUserToRoleDefaults} 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset to Role Defaults</span>
                  </button>
                  <button 
                    onClick={handleSaveUserPermissions} 
                    disabled={isSaving || isLoadingMatrix}
                    className="flex items-center gap-2 px-5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Save User Overrides</span>
                  </button>
                </div>
              )}
            </div>

            {selectedUserData && (
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-lg flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} />
                  <span>Configuring custom permissions for <strong>{selectedUserData.name}</strong> ({selectedUserData.email})</span>
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400">Role: {selectedUserData.role}</span>
              </div>
            )}
          </div>

          {/* User Matrix Table */}
          {selectedUserId && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
              {isLoadingMatrix ? (
                <div className="p-16 flex flex-col items-center justify-center text-zinc-400 gap-3">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span className="text-xs">Loading user custom overrides...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-3 px-4 min-w-[220px]">Module</th>
                        <th className="py-3 px-2 text-center w-20">Row All</th>
                        {ACTIONS.map(a => (
                          <th key={a.key} className="py-3 px-3 text-center min-w-[70px] capitalize font-bold text-zinc-700 dark:text-zinc-300">
                            <span className="mr-1">{a.icon}</span> {a.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                      {visibleCategories.map(cat => (
                        <React.Fragment key={cat.key}>
                          <tr className="bg-zinc-100/70 dark:bg-zinc-800/40 border-t border-b border-zinc-200/60 dark:border-zinc-800">
                            <td colSpan={ACTIONS.length + 2} className="py-2 px-4">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                                {cat.label} ({cat.modules.length} Modules)
                              </span>
                            </td>
                          </tr>

                          {cat.modules.map(mod => {
                            const isAllChecked = ACTIONS.every(a => userPermissionMatrix[mod.key]?.[a.key])
                            return (
                              <tr key={mod.key} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-zinc-900 dark:text-zinc-100">{mod.name}</div>
                                  <div className="text-[10px] text-zinc-400 line-clamp-1">{mod.description}</div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRow(mod.key, true)}
                                    className={"text-[10px] px-2 py-0.5 rounded font-medium border transition-colors cursor-pointer " + (
                                      isAllChecked 
                                        ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400" 
                                        : "bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700"
                                    )}
                                  >
                                    {isAllChecked ? "Clear" : "All"}
                                  </button>
                                </td>
                                {ACTIONS.map(a => {
                                  const checked = !!userPermissionMatrix[mod.key]?.[a.key]
                                  return (
                                    <td key={a.key} className="py-3 px-3 text-center">
                                      <button 
                                        type="button"
                                        onClick={() => handleUserPermissionToggle(mod.key, a.key)} 
                                        title={"Toggle " + a.label + " for " + mod.name}
                                        className={"w-6 h-6 mx-auto rounded-md border flex items-center justify-center transition-all cursor-pointer " + (
                                          checked 
                                            ? "bg-blue-600 border-blue-600 text-white shadow-xs" 
                                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-transparent hover:border-blue-400"
                                        )}
                                      >
                                        {checked && <Check size={12} strokeWidth={3} />}
                                      </button>
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Roles Overview */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEFAULT_ROLES_CONFIG.map(role => (
              <div key={role.name} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-sm">
                    <Lock size={18} />
                  </div>
                  <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full border " + role.badgeColor}>
                    {role.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{role.name}</h3>
                <p className="text-[11px] text-zinc-500 mb-4 line-clamp-3">{role.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-bold text-blue-600">{role.permissionCount} Checks</span>
                  <button 
                    onClick={() => { setSelectedRole(role.name); setActiveTab("permissions") }}
                    className="text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    Configure →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Custom Roles */}
      {activeTab === "custom-roles" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">Create bespoke roles with custom permission matrices.</p>
            <button 
              onClick={() => { setEditingRole(null); setFormName(""); setFormDescription(""); setIsRoleModalOpen(true) }} 
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Custom Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRoles.map(role => (
              <div key={role.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{role.name}</h3>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => { setEditingRole(role); setFormName(role.name); setFormDescription(role.description || ""); setIsRoleModalOpen(true) }}
                      className="p-1.5 text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(role)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mb-3">{role.description || "No description provided."}</p>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400">Custom Defined</span>
                  <button 
                    onClick={() => { setSelectedRole(role.name); setActiveTab("permissions") }}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Configure Matrix →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Role Modal */}
      <AnimatePresence>
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {editingRole ? "Edit Custom Role" : "Create Custom Role"}
                </h3>
                <button onClick={() => setIsRoleModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!formName.trim()) return
                const data = { name: formName, description: formDescription }
                await executeWithFeedback(async () => {
                  if (editingRole) { 
                    await PermissionService.updateCustomRole(editingRole.id, data) 
                  } else { 
                    await PermissionService.createCustomRole(data) 
                  }
                }, { 
                  actionType: editingRole ? "update" : "create", 
                  successTitle: editingRole ? "Role Updated" : "Role Created" 
                })
                setIsRoleModalOpen(false)
                loadRoles()
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Role Name</label>
                  <input 
                    type="text" 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    placeholder="e.g. Field Team Lead"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                  <textarea 
                    value={formDescription} 
                    onChange={(e) => setFormDescription(e.target.value)} 
                    placeholder="Describe role responsibilities..."
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 rounded-lg cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer">
                    {editingRole ? "Save Changes" : "Create Role"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Delete Custom Role?</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to delete role <strong className="text-zinc-900 dark:text-zinc-100">{deleteConfirm.name}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button onClick={async () => {
                  if (!deleteConfirm) return
                  await executeWithFeedback(async () => { 
                    await PermissionService.deleteCustomRole(deleteConfirm.id) 
                  }, { actionType: "delete", successTitle: "Role Deleted" })
                  setDeleteConfirm(null)
                  loadRoles()
                }} className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer">
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
