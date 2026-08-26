"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Mail, Shield, Building, Phone, Lock, UserCheck, ShieldCheck, Check, Info, Crown } from "lucide-react"
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
  DEFAULT_ROLE_PERMISSIONS 
} from "@/store/usePermissionStore"

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (user: Partial<UserType>) => void
  editingUser?: UserType | null
}

export function UserModal({ isOpen, onClose, onSave, editingUser }: UserModalProps) {
  const { 
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

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<UserRole>("Teams")
  const [selectedCompanyIds, setSelectedCompanyIds] = React.useState<string[]>(["tech"])
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>("")
  const [department, setDepartment] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [status, setStatus] = React.useState<UserStatus>("Active")

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

  React.useEffect(() => {
    fetchCompanies()
    fetchBranches()
  }, [fetchCompanies, fetchBranches, isOpen])

  React.useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || "")
      setEmail(editingUser.email || "")
      const userRole = editingUser.role || "Teams"
      setRole(userRole)
      
      const compIds = editingUser.companyIds && editingUser.companyIds.length > 0 
        ? editingUser.companyIds 
        : [editingUser.companyId || "tech"]
      setSelectedCompanyIds(compIds)
      setSelectedBranchId(editingUser.branchId || (editingUser as any).branch_id || "")

      setDepartment(editingUser.department || "")
      setPhone(editingUser.phone || "")
      setStatus(editingUser.status || "Active")
      setPassword(editingUser.password || "Password123")

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

      const norm = normalizeRole(editingUser.role || "Teams")
      const fallbackMods = DEFAULT_ROLE_PERMISSIONS[norm] || [...CONFIGURABLE_MODULES]
      const activeAllowed = existingMods && existingMods.length > 0 ? existingMods : fallbackMods

      const fullMatrix: Record<string, ModuleActionFlags> = {}
      CONFIGURABLE_MODULES.forEach((m) => {
        if (existingMatrix && existingMatrix[m]) {
          fullMatrix[m] = { ...existingMatrix[m] }
        } else if (activeAllowed.includes(m as ModuleName)) {
          fullMatrix[m] = { ...DEFAULT_FULL_ACTIONS }
        } else {
          fullMatrix[m] = { view: false, add: false, edit: false, delete: false }
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
      setRole("Teams")
      const defaultComp = (activeCompanyId && availableCompanies.some(c => c.id === activeCompanyId || c.slug === activeCompanyId))
        ? activeCompanyId
        : (availableCompanies[0]?.id || "tech")
      setSelectedCompanyIds([defaultComp])
      setSelectedBranchId("")
      setDepartment("")
      setPhone("")
      setStatus("Active")
      setPassword("")
      setAllowedModules([...CONFIGURABLE_MODULES])
      
      const init: Record<string, ModuleActionFlags> = {}
      CONFIGURABLE_MODULES.forEach((m) => {
        init[m] = { ...DEFAULT_FULL_ACTIONS }
      })
      setActionMatrix(init)
    }
  }, [editingUser?.id, isOpen, availableCompanies])

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    const norm = normalizeRole(newRole)
    const roleMods = DEFAULT_ROLE_PERMISSIONS[norm] || [...CONFIGURABLE_MODULES]

    // Admin can ONLY grant modules that the Admin himself is allowed to access
    const safeRoleMods = isCurrentSuperAdmin
      ? roleMods
      : roleMods.filter((m) => displayableModules.includes(m as any))

    setAllowedModules(safeRoleMods)

    const init: Record<string, ModuleActionFlags> = {}
    CONFIGURABLE_MODULES.forEach((m) => {
      const isAllowed = safeRoleMods.includes(m as ModuleName)
      const adminFlags = isCurrentSuperAdmin ? DEFAULT_FULL_ACTIONS : getUserModuleActions(currentUser, m)

      init[m] = isAllowed
        ? {
            view: adminFlags.view,
            add: adminFlags.add,
            edit: adminFlags.edit,
            delete: adminFlags.delete,
          }
        : { view: false, add: false, edit: false, delete: false }
    })
    setActionMatrix(init)
  }

  const handleToggleCompany = (compId: string) => {
    if (selectedCompanyIds.includes(compId)) {
      if (selectedCompanyIds.length > 1) {
        setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== compId))
      }
    } else {
      setSelectedCompanyIds([...selectedCompanyIds, compId])
    }
  }

  const handleCheckboxChange = (mod: ModuleName, actionKey: keyof ModuleActionFlags, checked: boolean) => {
    const currentFlags = actionMatrix[mod] || { ...DEFAULT_FULL_ACTIONS }
    const updatedFlags = { ...currentFlags, [actionKey]: checked }
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
    const current = actionMatrix[mod] || { ...DEFAULT_FULL_ACTIONS }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const primaryCompanyId = selectedCompanyIds[0] || "tech"
    const companyNamesList = companies
      .filter((c) => selectedCompanyIds.includes(c.id) || selectedCompanyIds.includes(c.slug || ""))
      .map((c) => c.name)

    const matchedBranch = branches.find((b) => String(b.id).toLowerCase() === String(selectedBranchId).toLowerCase())

    const payload: Partial<UserType> = {
      name,
      email: email.toLowerCase().trim(),
      role,
      companyId: primaryCompanyId,
      companyIds: selectedCompanyIds,
      companyName: companyNamesList.join(", ") || (primaryCompanyId === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"),
      branchId: selectedBranchId ? selectedBranchId : undefined,
      branchName: matchedBranch?.name || (selectedBranchId ? selectedBranchId : undefined),
      department: department || "General",
      phone,
      password,
      status,
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
    const emailNorm = email.toLowerCase().trim()

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
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Mail size={14} /> Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@saampark.in"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
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

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Building size={14} /> Assign to Companies * ({selectedCompanyIds.length} Selected)
                </label>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex flex-wrap gap-2">
                  {availableCompanies.map((c) => {
                    const isChecked = selectedCompanyIds.includes(c.id) || selectedCompanyIds.includes(c.slug || "")
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => handleToggleCompany(c.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                        }`}
                      >
                        <span>{c.logo || "🏢"}</span>
                        <span>{c.name}</span>
                        {isChecked && <Check size={12} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Sub-Branch Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>📍</span> Assigned Sub-Branch / Location
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  {availableBranches.length} branches available
                </span>
              </label>
              
              {availableBranches.length === 0 ? (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-700 text-center">
                  <p className="text-xs text-zinc-400">No sub-branches created for this company yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBranchId("")}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      !selectedBranchId
                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-700 shadow-2xs font-bold"
                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🏢</span> All Branches / Main Headquarters
                    </span>
                    {!selectedBranchId && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>

                  {availableBranches.map((b) => {
                    const isSelected = String(selectedBranchId || "").toLowerCase() === String(b.id || "").toLowerCase()
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBranchId(b.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-700 shadow-2xs font-bold"
                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                        }`}
                      >
                        <div className="text-left truncate mr-1">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{b.name}</span>
                          {b.city && <span className="text-[10px] text-zinc-400 ml-1.5 font-normal">({b.city})</span>}
                        </div>
                        {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
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
                  placeholder="e.g. Software Engineering & Delivery"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden"
                />
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
                    const flags = actionMatrix[mod] || { ...DEFAULT_FULL_ACTIONS }
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
