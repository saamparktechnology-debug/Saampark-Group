"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Mail, Shield, Building, Phone, Lock, UserCheck, ShieldCheck, Check, Info, Crown, MapPin } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { UserItem as UserType, UserRole, UserStatus } from "../types"
import { useAuthStore } from "@/store/useAuthStore"
import { 
  usePermissionStore, 
  CONFIGURABLE_MODULES, 
  ModuleName, 
  ModuleActionFlags, 
  DEFAULT_FULL_ACTIONS, 
  DEFAULT_VIEW_ONLY_ACTIONS, 
  MODULE_ACTION_CONFIG,
  normalizeRole, 
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLE_ACTION_PERMISSIONS
} from "@/store/usePermissionStore"

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (user: Partial<UserType>) => void
  editingUser?: UserType | null
  initialRole?: UserRole
}

export function UserModal({ isOpen, onClose, onSave, editingUser, initialRole }: UserModalProps) {
  const { 
    rolePermissions,
    roleActionPermissions,
    userActionPermissions, 
    userPermissions, 
    setUserPermissions, 
    setUserAllModuleActions,
    isModuleAllowed,
    canPerformAction,
    getUserModuleActions 
  } = usePermissionStore()
  const { companies, branches, user: currentUser, activeCompanyId, fetchCompanies, fetchBranches } = useAuthStore()
  
  const isCurrentSuperAdmin = currentUser?.role === "Super Admin"
  const isCurrentAdmin = currentUser?.role === "Admin"

  // Filter allowed roles based on current user's role:
  // Super Admin can assign: Super Admin, Admin, Teams, Clients
  // Admin can ONLY assign: Teams, Clients
  const availableRoles: UserRole[] = React.useMemo(() => {
    if (isCurrentSuperAdmin) {
      return ["Super Admin", "Admin", "Teams", "Clients"]
    }
    return ["Admin", "Teams", "Clients"]
  }, [isCurrentSuperAdmin])

  // Filter available companies based on current user's assigned companies:
  // Super Admin can assign any company
  // Admin can only assign companies the Admin is assigned to
  const availableCompanies = React.useMemo(() => {
    if (isCurrentSuperAdmin) return companies
    const adminCompanyIds = currentUser?.companyIds || (currentUser?.companyId ? [currentUser.companyId] : ["tech"])
    return companies.filter((c) => adminCompanyIds.includes(c.id) || adminCompanyIds.includes(c.slug || ""))
  }, [isCurrentSuperAdmin, companies, currentUser])

  const isCurrentBranchAdmin = Boolean(currentUser?.branchId && currentUser?.role === "Admin")

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [emailError, setEmailError] = React.useState<string | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = React.useState(false)
  const [role, setRole] = React.useState<UserRole>("Teams")
  const [adminScope, setAdminScope] = React.useState<"company" | "branch">("company")
  const [selectedCompanyIds, setSelectedCompanyIds] = React.useState<string[]>(["tech"])
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>("")
  const [department, setDepartment] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [status, setStatus] = React.useState<UserStatus>("Active")
  const [avatarUrl, setAvatarUrl] = React.useState("")
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const avatarInputRef = React.useRef<HTMLInputElement>(null)

  // Available branches for selected companies (with robust slug/id normalization)
  const availableBranches = React.useMemo(() => {
    if (!branches || branches.length === 0) return []
    if (selectedCompanyIds.length === 0) return branches
    return branches.filter((b) => {
      const bComp = String(b.companyId || "").toLowerCase().trim()
      return selectedCompanyIds.some((cId) => {
        const norm = String(cId || "").toLowerCase().trim()
        if (norm === bComp) return true
        const matchedComp = companies.find(
          (c) => String(c.id).toLowerCase() === norm || String(c.slug || "").toLowerCase() === norm
        )
        return (
          matchedComp &&
          (String(matchedComp.id).toLowerCase() === bComp ||
            String(matchedComp.slug || "").toLowerCase() === bComp)
        )
      })
    })
  }, [branches, selectedCompanyIds, companies])

  // Filter configurable modules: Admin can ONLY see & grant modules the Admin himself has permission to access
  const displayableModules = React.useMemo(() => {
    if (isCurrentSuperAdmin) return CONFIGURABLE_MODULES
    return CONFIGURABLE_MODULES.filter((m) => {
      const uAny = currentUser as any
      if (uAny?.allowedModules && Array.isArray(uAny.allowedModules)) {
        return uAny.allowedModules.includes(m)
      }
      if (uAny?.permissions?.allowedModules && Array.isArray(uAny.permissions.allowedModules)) {
        return uAny.permissions.allowedModules.includes(m)
      }
      return isModuleAllowed(currentUser, m)
    })
  }, [
    isCurrentSuperAdmin,
    currentUser,
    currentUser?.permissions,
    (currentUser as any)?.allowedModules,
    isModuleAllowed,
    userPermissions,
    userActionPermissions,
  ])

  // Matrix of active module checkboxes per user
  const [actionMatrix, setActionMatrix] = React.useState<Record<string, ModuleActionFlags>>({})
  const [allowedModules, setAllowedModules] = React.useState<ModuleName[]>([])

  // Helper to compute standard action matrix for a role according to system and admin configurations
  const getMatrixForRole = React.useCallback((targetRole: UserRole) => {
    const norm = normalizeRole(targetRole)
    const storeState = usePermissionStore.getState()
    const configuredRoleMatrix = (storeState.roleActionPermissions && storeState.roleActionPermissions[norm]) || DEFAULT_ROLE_ACTION_PERMISSIONS[norm] || {}
    const configuredRoleMods = (storeState.rolePermissions && storeState.rolePermissions[norm]) || DEFAULT_ROLE_PERMISSIONS[norm] || []

    const matrix: Record<string, ModuleActionFlags> = {}
    CONFIGURABLE_MODULES.forEach((m) => {
      const adminFlags = isCurrentSuperAdmin ? DEFAULT_FULL_ACTIONS : getUserModuleActions(currentUser, m)

      if (configuredRoleMatrix[m]) {
        const flag = configuredRoleMatrix[m]
        matrix[m] = {
          view: Boolean(adminFlags.view && flag.view),
          add: Boolean(adminFlags.add && flag.add),
          edit: Boolean(adminFlags.edit && flag.edit),
          delete: Boolean(adminFlags.delete && flag.delete),
        }
      } else {
        const isModInRole = configuredRoleMods.includes(m as ModuleName)
        matrix[m] = isModInRole
          ? {
              view: Boolean(adminFlags.view),
              add: Boolean(adminFlags.add && norm !== 'Clients'),
              edit: Boolean(adminFlags.edit && norm !== 'Clients'),
              delete: Boolean(adminFlags.delete && norm === 'Admin'),
            }
          : { view: false, add: false, edit: false, delete: false }
      }
    })
    return matrix
  }, [isCurrentSuperAdmin, currentUser, getUserModuleActions])

  React.useEffect(() => {
    fetchCompanies()
    fetchBranches()
    if (isOpen) {
      usePermissionStore.getState().fetchRolePermissions?.()
    }
  }, [fetchCompanies, fetchBranches, isOpen])

  const prevIsOpenRef = React.useRef(false)
  const prevEditingIdRef = React.useRef<string | undefined>(undefined)

  React.useEffect(() => {
    const wasClosed = !prevIsOpenRef.current && isOpen
    const editingChanged = editingUser?.id !== prevEditingIdRef.current
    prevIsOpenRef.current = isOpen
    prevEditingIdRef.current = editingUser?.id

    if (!isOpen) return
    if (!wasClosed && !editingChanged) return

    if (editingUser) {
      setName(editingUser.name || "")
      setEmail(editingUser.email || "")
      const userRole = editingUser.role || "Teams"
      setRole(userRole)
      
      const compIds = editingUser.companyIds && editingUser.companyIds.length > 0 
        ? editingUser.companyIds 
        : [editingUser.companyId || "tech"]
      setSelectedCompanyIds(compIds)
      const bId = editingUser.branchId || (editingUser as any).branch_id || ""
      setSelectedBranchId(bId)
      setAdminScope(bId ? "branch" : "company")

      setDepartment(editingUser.department || "")
      setPhone(editingUser.phone || "")
      setStatus(editingUser.status || "Active")
      setPassword(editingUser.password || "Password123")
      setAvatarUrl(editingUser.avatarUrl || (editingUser as any)?.avatar || "")

      const userIdStr = String(editingUser.id)
      const emailNorm = (editingUser.email || "").toLowerCase().trim()
      const existingMatrix =
        userActionPermissions[userIdStr] ||
        (emailNorm ? userActionPermissions[emailNorm] : undefined) ||
        (editingUser.permissions?.actionMatrix)

      const existingMods =
        userPermissions[userIdStr] ||
        (emailNorm ? userPermissions[emailNorm] : undefined) ||
        (editingUser.permissions?.allowedModules)

      const fallbackMatrix = getMatrixForRole(editingUser.role || "Teams")

      const fullMatrix: Record<string, ModuleActionFlags> = {}
      CONFIGURABLE_MODULES.forEach((m) => {
        const adminFlags = isCurrentSuperAdmin ? DEFAULT_FULL_ACTIONS : getUserModuleActions(currentUser, m)

        if (existingMatrix && existingMatrix[m]) {
          const ef = existingMatrix[m]
          fullMatrix[m] = {
            view: Boolean(adminFlags.view && ef.view),
            add: Boolean(adminFlags.add && ef.add),
            edit: Boolean(adminFlags.edit && ef.edit),
            delete: Boolean(adminFlags.delete && ef.delete),
          }
        } else if (existingMods && existingMods.length > 0) {
          const isAllowed = existingMods.includes(m as ModuleName)
          const base = fallbackMatrix[m] || { view: true, add: false, edit: false, delete: false }
          fullMatrix[m] = isAllowed
            ? {
                view: Boolean(adminFlags.view && base.view),
                add: Boolean(adminFlags.add && base.add),
                edit: Boolean(adminFlags.edit && base.edit),
                delete: Boolean(adminFlags.delete && base.delete),
              }
            : { view: false, add: false, edit: false, delete: false }
        } else {
          fullMatrix[m] = fallbackMatrix[m] || { view: false, add: false, edit: false, delete: false }
        }
      })

      setActionMatrix(fullMatrix)
      setAllowedModules(CONFIGURABLE_MODULES.filter(m => {
        const flags = fullMatrix[m]
        return flags ? (flags.view || flags.add || flags.edit || flags.delete) : false
      }))
    } else {
      setName("")
      setEmail("")
      setEmailError(null)
      const defaultRole: UserRole = "Teams"
      setRole(defaultRole)
      if (isCurrentBranchAdmin && currentUser?.branchId) {
        setAdminScope("branch")
        setSelectedBranchId(currentUser.branchId)
        setSelectedCompanyIds(currentUser.companyIds || (currentUser.companyId ? [currentUser.companyId] : ["tech"]))
      } else {
        setAdminScope("company")
        const defaultComp = (activeCompanyId && availableCompanies.some(c => c.id === activeCompanyId || c.slug === activeCompanyId))
          ? activeCompanyId
          : (availableCompanies[0]?.id || "tech")
        setSelectedCompanyIds([defaultComp])
        setSelectedBranchId("")
      }
      setDepartment("")
      setPhone("")
      setPassword("Password123")
      setStatus("Active")
      setAvatarUrl("")
      
      const initMatrix = getMatrixForRole(defaultRole)
      setActionMatrix(initMatrix)
      setAllowedModules(CONFIGURABLE_MODULES.filter(m => {
        const flags = initMatrix[m]
        return flags ? (flags.view || flags.add || flags.edit || flags.delete) : false
      }))
    }
  }, [editingUser, isOpen, availableCompanies, isCurrentBranchAdmin, currentUser, activeCompanyId, getMatrixForRole, userActionPermissions, userPermissions, isCurrentSuperAdmin, getUserModuleActions])

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    const nextMatrix = getMatrixForRole(newRole)
    setActionMatrix(nextMatrix)
    setAllowedModules(CONFIGURABLE_MODULES.filter(m => {
      const flags = nextMatrix[m]
      return flags ? (flags.view || flags.add || flags.edit || flags.delete) : false
    }))
  }

  const handleToggleCompany = (compId: string) => {
    const norm = String(compId).toLowerCase().trim()
    const isAlreadySelected = selectedCompanyIds.some(id => {
      const idNorm = String(id).toLowerCase().trim()
      return idNorm === norm
    })

    if (isAlreadySelected) {
      if (selectedCompanyIds.length > 1) {
        setSelectedCompanyIds(selectedCompanyIds.filter(id => String(id).toLowerCase().trim() !== norm))
      }
    } else {
      setSelectedCompanyIds([...selectedCompanyIds, compId])
    }
  }

  const handleCheckboxChange = (mod: ModuleName, actionKey: keyof ModuleActionFlags, checked: boolean) => {
    const currentFlags = actionMatrix[mod] || { view: false, add: false, edit: false, delete: false }
    const updatedFlags = { ...currentFlags, [actionKey]: checked }

    // If unchecking View, uncheck Add, Edit, Delete as well
    if (actionKey === "view" && !checked) {
      updatedFlags.add = false
      updatedFlags.edit = false
      updatedFlags.delete = false
    }

    // If checking Add, Edit, or Delete, automatically ensure View is checked
    if ((actionKey === "add" || actionKey === "edit" || actionKey === "delete") && checked) {
      updatedFlags.view = true
    }

    const nextMatrix = { ...actionMatrix, [mod]: updatedFlags }
    setActionMatrix(nextMatrix)

    const hasAnyChecked = updatedFlags.view || updatedFlags.add || updatedFlags.edit || updatedFlags.delete
    if (!hasAnyChecked) {
      setAllowedModules(allowedModules.filter((m) => m !== mod))
    } else if (!allowedModules.includes(mod)) {
      setAllowedModules([...allowedModules, mod])
    }
  }

  const handleToggleModuleAll = (mod: ModuleName) => {
    const current = actionMatrix[mod] || { view: false, add: false, edit: false, delete: false }
    const config = MODULE_ACTION_CONFIG[mod] || { hasAdd: true, hasEdit: true, hasDelete: true }
    const allOn = current.view && (!config.hasAdd || current.add) && (!config.hasEdit || current.edit) && (!config.hasDelete || current.delete)
    
    // Check ceiling for Admin delegation
    const adminFlags = isCurrentSuperAdmin ? DEFAULT_FULL_ACTIONS : getUserModuleActions(currentUser, mod)

    const nextFlags = allOn
      ? { view: false, add: false, edit: false, delete: false }
      : { 
          view: adminFlags.view, 
          add: config.hasAdd !== false && adminFlags.add, 
          edit: config.hasEdit !== false && adminFlags.edit, 
          delete: config.hasDelete !== false && adminFlags.delete 
        }
    
    setActionMatrix({ ...actionMatrix, [mod]: nextFlags })
    if (allOn) {
      setAllowedModules(allowedModules.filter((m) => m !== mod))
    } else if (!allowedModules.includes(mod)) {
      setAllowedModules([...allowedModules, mod])
    }
  }

  const handleSetGlobalTemplate = (template: "full" | "view" | "none") => {
    const nextMatrix: Record<string, ModuleActionFlags> = {}
    CONFIGURABLE_MODULES.forEach((m) => {
      const config = MODULE_ACTION_CONFIG[m] || { hasAdd: true, hasEdit: true, hasDelete: true }
      const adminFlags = isCurrentSuperAdmin ? DEFAULT_FULL_ACTIONS : getUserModuleActions(currentUser, m)

      if (displayableModules.includes(m as any) && template === "full") {
        nextMatrix[m] = { 
          view: adminFlags.view, 
          add: config.hasAdd !== false && adminFlags.add, 
          edit: config.hasEdit !== false && adminFlags.edit, 
          delete: config.hasDelete !== false && adminFlags.delete 
        }
      } else if (displayableModules.includes(m as any) && template === "view") {
        nextMatrix[m] = { 
          view: adminFlags.view, 
          add: false, 
          edit: false, 
          delete: false 
        }
      } else {
        nextMatrix[m] = { view: false, add: false, edit: false, delete: false }
      }
    })
    setActionMatrix(nextMatrix)
    if (template === "none") {
      setAllowedModules([])
    } else {
      setAllowedModules([...displayableModules])
    }
  }

  // Check email uniqueness when blurring the field (only on create)
  const handleEmailBlur = async () => {
    if (editingUser) return // Only check on create
    const normEmail = email.toLowerCase().trim()
    if (!normEmail) return
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normEmail)) {
      setEmailError("Please enter a valid email address.")
      return
    }
    setIsCheckingEmail(true)
    try {
      const { getUsers } = await import("../services/userService")
      const allUsers = await getUsers("all")
      const exists = allUsers.some(u => (u.email || "").toLowerCase().trim() === normEmail)
      if (exists) {
        setEmailError(`⚠️ An account already exists with this email. Each email can only have one account.`)
      } else {
        setEmailError(null)
      }
    } catch {
      setEmailError(null)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normEmail = email.toLowerCase().trim()

    // Block if email is blank
    if (!normEmail) {
      setEmailError("Email address is required.")
      return
    }

    // Block if known error already flagged
    if (emailError) return

    // On create: check uniqueness one final time before saving
    if (!editingUser) {
      setIsCheckingEmail(true)
      try {
        const { getUsers } = await import("../services/userService")
        const allUsers = await getUsers("all")
        const duplicate = allUsers.find(u => (u.email || "").toLowerCase().trim() === normEmail)
        if (duplicate) {
          setEmailError(`⚠️ Email "${normEmail}" is already registered as a ${duplicate.role}. One email = one account only.`)
          setIsCheckingEmail(false)
          return
        }
      } catch {}
      setIsCheckingEmail(false)
    }

    const primaryCompanyId = selectedCompanyIds[0] || "tech"
    const companyNamesList = companies
      .filter((c) => selectedCompanyIds.some(sc => {
        const norm = String(sc).toLowerCase().trim()
        return norm === String(c.id).toLowerCase().trim() || norm === String(c.slug || '').toLowerCase().trim()
      }))
      .map((c) => c.name)

    const matchedBranch = branches.find((b) => String(b.id).toLowerCase() === String(selectedBranchId).toLowerCase())

    const payload: Partial<UserType> = {
      name,
      email: normEmail,
      role,
      companyId: primaryCompanyId,
      companyIds: selectedCompanyIds,
      companyName: companyNamesList.length > 1
        ? `SAAMPARK Group (${companyNamesList.length} Companies)`
        : companyNamesList[0] || (primaryCompanyId === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"),
      branchId: selectedBranchId ? selectedBranchId : undefined,
      branchName: matchedBranch?.name || (selectedBranchId ? selectedBranchId : undefined),
      department: department || "General",
      phone,
      password,
      status,
      avatarUrl: avatarUrl.trim() || editingUser?.avatarUrl || (editingUser as any)?.avatar || undefined,
      avatar: avatarUrl.trim() || editingUser?.avatarUrl || (editingUser as any)?.avatar || undefined,
    }

    if (editingUser) {
      payload.id = editingUser.id
    }

    const finalActionMatrix: Record<string, ModuleActionFlags> = {}
    CONFIGURABLE_MODULES.forEach((m) => {
      if (isCurrentSuperAdmin || displayableModules.includes(m as any)) {
        finalActionMatrix[m] = actionMatrix[m] || { view: false, add: false, edit: false, delete: false }
      } else {
        finalActionMatrix[m] = { view: false, add: false, edit: false, delete: false }
      }
    })

    // Accurately compute finalAllowedModules directly from finalActionMatrix (every module with at least one active flag)
    const finalAllowedModules = CONFIGURABLE_MODULES.filter((m) => {
      const flags = finalActionMatrix[m]
      return Boolean(flags && (flags.view || flags.add || flags.edit || flags.delete))
    })

    const userIdStr = String(editingUser?.id || payload.id || `usr_${Date.now()}`)
    const emailNorm = normEmail

    setUserPermissions(userIdStr, finalAllowedModules)
    setUserAllModuleActions(userIdStr, finalActionMatrix)

    // Sync to email key as well
    setUserPermissions(emailNorm, finalAllowedModules)
    setUserAllModuleActions(emailNorm, finalActionMatrix)

    const permissions = { actionMatrix: finalActionMatrix, allowedModules: finalAllowedModules }

    onSave({
      ...payload,
      permissions,
    } as any)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={22} />
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {editingUser ? "Edit User Account & Permissions" : "Add New User Account & Assign Multi-Company Access"}
                </h2>
                <p className="text-xs text-zinc-500">
                  {isCurrentSuperAdmin 
                    ? "Full administrative control: Assign roles, multiple companies, and custom action permissions."
                    : "Delegate team member access within your assigned companies and permission scope."}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
            {/* Avatar Upload Banner */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name || "Avatar"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm">
                      {(name ? name.substring(0, 2) : "US").toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">Profile Picture</h4>
                  <p className="text-[11px] text-zinc-500">
                    Upload an avatar for this user. Synced across team tasks, leads, and orders.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setIsUploadingAvatar(true)
                    try {
                      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
                      const res = await uploadToImgBB(file, `${name || "user"}_${Date.now()}`, 400)
                      if (res.url) setAvatarUrl(res.url)
                    } catch {}
                    finally { setIsUploadingAvatar(false) }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all"
                >
                  <span>{isUploadingAvatar ? "Uploading..." : avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <User size={14} /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Mail size={14} /> Email Address *
                  </label>
                  {editingUser && email.toLowerCase().trim() !== (editingUser.email || "").toLowerCase().trim() && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                      <span>⚠️</span> Email will transfer
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                    onBlur={handleEmailBlur}
                    placeholder="e.g. rahul@saampark.in"
                    className={`flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border text-xs focus:outline-hidden focus:ring-1 ${
                      emailError
                        ? "border-rose-400 focus:ring-rose-400"
                        : "border-zinc-200 dark:border-zinc-700 focus:ring-blue-500"
                    }`}
                  />
                  {editingUser && (
                    <button
                      type="button"
                      onClick={(e) => {
                        if (!email || !email.includes("@")) {
                          alert("Please enter a valid email address.")
                          return
                        }
                        handleSubmit(e as any)
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs flex items-center gap-1 ${
                        email.toLowerCase().trim() !== (editingUser.email || "").toLowerCase().trim()
                          ? "bg-blue-600 hover:bg-blue-700 text-white animate-pulse"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300"
                      }`}
                      title="Update email for this account now"
                    >
                      <Check size={13} />
                      <span>Update</span>
                    </button>
                  )}
                </div>
                {/* Inline duplicate / format error */}
                {isCheckingEmail && (
                  <p className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Checking email availability...
                  </p>
                )}
                {emailError && !isCheckingEmail && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800">
                    {emailError}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Shield size={14} /> User Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden font-bold"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {!isCurrentSuperAdmin && (
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Admins can only create or assign Teams and Clients roles.
                  </p>
                )}
              </div>

              {/* Scope Switcher for Admin Role */}
              {role === "Admin" && !isCurrentBranchAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Building size={14} /> Admin Assignment Scope *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdminScope("company")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        adminScope === "company"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                          : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      <Building size={13} />
                      <span>Company Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminScope("branch")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        adminScope === "branch"
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs font-bold"
                          : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      <MapPin size={13} />
                      <span>Single Branch Admin</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {adminScope === "branch" 
                      ? "📍 Single-Branch Admin will be locked exclusively to 1 branch across all billing, leads, clients & team." 
                      : "🏢 Company Admin can manage all branches under selected companies."}
                  </p>
                </div>
              )}

              {/* Multi-Company Selector for Company Admin or Non-Branch-Admin Roles */}
              {(role !== "Admin" || adminScope === "company") && !isCurrentBranchAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Building size={14} /> Assign to Companies * ({selectedCompanyIds.length} Selected)
                  </label>
                  <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {availableCompanies.map((c) => {
                      const cIdNorm = String(c.id).toLowerCase().trim()
                      const cSlugNorm = String(c.slug || "").toLowerCase().trim()
                      const isChecked = selectedCompanyIds.some(id => {
                        const norm = String(id).toLowerCase().trim()
                        return norm === cIdNorm || norm === cSlugNorm
                      })
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => handleToggleCompany(c.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                            isChecked
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-bold"
                              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                          }`}
                        >
                          <span>{c.logo || "🏢"}</span>
                          <span>{c.name}</span>
                          {isChecked && <Check size={11} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Branch Assignment Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-amber-500 shrink-0" /> Assigned Branch / Location {adminScope === "branch" || isCurrentBranchAdmin ? "*" : ""}
                  </span>
                  {isCurrentBranchAdmin ? (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      🔒 Locked to your branch
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-normal">
                      {branches.length} branches available
                    </span>
                  )}
                </label>
                
                {isCurrentBranchAdmin ? (
                  <div className="w-full px-3 py-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                    <span>📍 {branches.find(b => String(b.id) === String(currentUser?.branchId))?.name || currentUser?.branchId || "Your Assigned Branch"}</span>
                    <span className="text-[10px] text-amber-600">Fixed</span>
                  </div>
                ) : (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => {
                      const bId = e.target.value
                      setSelectedBranchId(bId)
                      if (bId) {
                        const matched = branches.find((b) => String(b.id).toLowerCase() === String(bId).toLowerCase())
                        if (matched && matched.companyId) {
                          setSelectedCompanyIds([matched.companyId])
                        }
                      }
                    }}
                    required={adminScope === "branch"}
                    className={`w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border text-xs focus:outline-hidden font-medium ${
                      adminScope === "branch" && !selectedBranchId
                        ? "border-amber-400 focus:ring-amber-500"
                        : "border-zinc-200 dark:border-zinc-700 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">{adminScope === "branch" ? "⚠️ Select Branch for Single-Branch Admin *" : "🏢 All Branches / Main Headquarters"}</option>
                    {(adminScope === "branch" ? branches : availableBranches).map((b) => {
                      const comp = companies.find(c => String(c.id) === String(b.companyId))
                      return (
                        <option key={b.id} value={b.id}>
                          📍 {b.name} {b.city ? `(${b.city})` : ""} {comp ? `— ${comp.name}` : ""}
                        </option>
                      )
                    })}
                  </select>
                )}
                {adminScope === "branch" && selectedBranchId && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <Check size={11} /> Auto-linked to parent company: {
                      companies.find(c => {
                        const matchedB = branches.find(b => String(b.id) === String(selectedBranchId))
                        return String(c.id) === String(matchedB?.companyId)
                      })?.name || "SAAMPARK Technology"
                    }
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} /> Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Department / Unit
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Sales, Billing & Operations"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Lock size={14} /> Initial Login Password *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter initial password"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <UserCheck size={14} /> Account Status
                </label>
                <div className="flex items-center gap-4 pt-2">
                  {(["Active", "Inactive", "Pending"] as UserStatus[]).map((st) => (
                    <label key={st} className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="status"
                        value={st}
                        checked={status === st}
                        onChange={() => setStatus(st)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="capitalize font-medium text-zinc-700 dark:text-zinc-300">{st}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Granular Module Action Checkboxes Section */}
            {role === "Super Admin" ? (
              /* Super Admin Master Access Banner - Exemption */
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3 text-purple-600 dark:text-purple-300">
                <Crown size={24} className="shrink-0 text-purple-500" />
                <div>
                  <div className="font-bold text-xs">👑 Super Admin Master Access Exemption</div>
                  <p className="text-[11px] opacity-90">
                    Super Admins possess unconstrained global master access across all 20 CRM modules, system configurations, and multi-tenant databases. Module restrictions cannot be applied to Super Admin accounts.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-blue-600" />
                      <span>Module Access & Action Permissions ({displayableModules.length} Available Modules)</span>
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      {isCurrentSuperAdmin 
                        ? "Select exact action rights (View, Add, Edit, Delete) for this account."
                        : "You can delegate permissions up to the maximum rights granted to your Admin account."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSetGlobalTemplate("full")}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold hover:underline cursor-pointer"
                    >
                      Grant Full Access
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetGlobalTemplate("view")}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-semibold hover:underline cursor-pointer"
                    >
                      View Only All (👁️)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetGlobalTemplate("none")}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold hover:underline cursor-pointer"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                {/* Module Action Cards Grid with Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-3 bg-zinc-50/50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60">
                  {displayableModules.map((mod) => {
                    const flags = actionMatrix[mod] || { view: false, add: false, edit: false, delete: false }
                    const config = MODULE_ACTION_CONFIG[mod] || { hasAdd: true, hasEdit: true, hasDelete: true, description: "" }
                    const adminFlags = isCurrentSuperAdmin ? DEFAULT_FULL_ACTIONS : getUserModuleActions(currentUser, mod)

                    return (
                      <div
                        key={mod}
                        className="p-3 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{mod}</span>
                            {config.description && (
                              <p className="text-[10px] text-zinc-400 leading-tight">{config.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleModuleAll(mod)}
                            className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                          >
                            {flags.view && (!config.hasAdd || flags.add) && (!config.hasEdit || flags.edit) && (!config.hasDelete || flags.delete) ? "Deselect" : "Select All"}
                          </button>
                        </div>

                        {/* Action Checkboxes with Cascading Enforcement */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          {/* View Action */}
                          <label className={`flex items-center gap-1.5 text-[11px] select-none ${adminFlags.view ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}>
                            <input
                              type="checkbox"
                              checked={flags.view}
                              disabled={!adminFlags.view}
                              onChange={(e) => handleCheckboxChange(mod, "view", e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                            />
                            <span className="text-zinc-700 dark:text-zinc-300 font-semibold">👁️ View</span>
                          </label>

                          {/* Add Action */}
                          {config.hasAdd !== false && (
                            <label className={`flex items-center gap-1.5 text-[11px] select-none ${adminFlags.add ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}>
                              <input
                                type="checkbox"
                                checked={flags.add}
                                disabled={!adminFlags.add}
                                onChange={(e) => handleCheckboxChange(mod, "add", e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                              />
                              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">➕ Add</span>
                            </label>
                          )}

                          {/* Edit Action */}
                          {config.hasEdit !== false && (
                            <label className={`flex items-center gap-1.5 text-[11px] select-none ${adminFlags.edit ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}>
                              <input
                                type="checkbox"
                                checked={flags.edit}
                                disabled={!adminFlags.edit}
                                onChange={(e) => handleCheckboxChange(mod, "edit", e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                              />
                              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">✏️ Edit</span>
                            </label>
                          )}

                          {/* Delete Action */}
                          {config.hasDelete !== false && (
                            <label className={`flex items-center gap-1.5 text-[11px] select-none ${adminFlags.delete ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}>
                              <input
                                type="checkbox"
                                checked={flags.delete}
                                disabled={!adminFlags.delete}
                                onChange={(e) => handleCheckboxChange(mod, "delete", e.target.checked)}
                                className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                              />
                              <span className="text-rose-600 dark:text-rose-400 font-semibold">🗑️ Delete</span>
                            </label>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                {editingUser ? "Save User & Permissions" : "Create Account & Permissions"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
