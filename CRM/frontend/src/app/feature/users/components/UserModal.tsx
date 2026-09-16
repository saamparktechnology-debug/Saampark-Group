"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, User, Mail, Shield, Building, Phone, Lock, UserCheck, ShieldCheck, 
  Check, Info, Crown, MapPin, Eye, EyeOff, Sparkles, RefreshCw, Search,
  Briefcase, Percent, ChevronDown, ChevronRight, CheckCircle2, Layers
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { UserItem as UserType, UserRole, UserStatus } from "../types"
import { useAuthStore, isMatchingCompany, getCompanyFullName } from "@/store/useAuthStore"
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

// Module Suites for clean categorized display
const MODULE_CATEGORIES: { name: string; icon: string; modules: ModuleName[] }[] = [
  {
    name: "Sales & Financial Suite",
    icon: "💰",
    modules: [
      "Invoices", "Quotations", "Estimates", "Sales Orders", "Payments", 
      "Credit Notes", "Debit Notes", "Subscriptions", "EMI", "Services & Store"
    ] as ModuleName[],
  },
  {
    name: "CRM & Client Engagement",
    icon: "🤝",
    modules: [
      "Leads", "Clients", "Proposals", "Messages", "Tickets", "Events", "Notes"
    ] as ModuleName[],
  },
  {
    name: "Projects & Operations",
    icon: "🚀",
    modules: [
      "Projects", "Tasks", "Files", "Expenses", "Knowledge base"
    ] as ModuleName[],
  },
  {
    name: "HR, Analytics & Admin",
    icon: "🏢",
    modules: [
      "Teams", "Attendance", "Leave", "Payroll", "Reports", "Companies", "Branches", "Departments", "Settings", "Activity Logs"
    ] as ModuleName[],
  },
]

const DEPARTMENT_SUGGESTIONS = [
  "Sales & Marketing",
  "Software Development",
  "Accounts & Finance",
  "Customer Support",
  "Design & Creative",
  "Operations",
  "Executive Management",
  "Human Resources",
]

export function UserModal({ isOpen, onClose, onSave, editingUser, initialRole }: UserModalProps) {
  const { 
    userActionPermissions, 
    userPermissions, 
    setUserPermissions, 
    setUserAllModuleActions,
    isModuleAllowed,
    getUserModuleActions 
  } = usePermissionStore()
  const { companies, branches, user: currentUser, activeCompanyId, fetchCompanies, fetchBranches } = useAuthStore()
  
  const isCurrentSuperAdmin = currentUser?.role === "Super Admin"

  // Active Company Object
  const activeCompanyObj = React.useMemo(() => {
    return companies.find(c => isMatchingCompany(c, activeCompanyId)) || companies[0] || {
      id: "tech",
      name: "SAAMPARK TECHNOLOGY",
      brand_name: "SAAMPARK",
      division_name: "TECHNOLOGY",
      logo: "💻"
    }
  }, [companies, activeCompanyId])

  // Form Fields
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [emailError, setEmailError] = React.useState<string | null>(null)
  const [role, setRole] = React.useState<UserRole>("Teams")
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>("")
  const [department, setDepartment] = React.useState("")
  const [designation, setDesignation] = React.useState("")
  const [commissionRate, setCommissionRate] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [status, setStatus] = React.useState<UserStatus>("Active")
  const [avatarUrl, setAvatarUrl] = React.useState("")
  const [kycStatus, setKycStatus] = React.useState<"Pending" | "Processing" | "Verified" | "Rejected">("Pending")
  
  // Permissions tab & search
  const [activeTab, setActiveTab] = React.useState<"profile" | "permissions">("profile")
  const [moduleSearch, setModuleSearch] = React.useState("")
  const [collapsedCategories, setCollapsedCategories] = React.useState<Record<string, boolean>>({})

  // Action Matrix & Allowed Modules
  const [actionMatrix, setActionMatrix] = React.useState<Record<string, ModuleActionFlags>>({})
  const [allowedModules, setAllowedModules] = React.useState<ModuleName[]>([])

  // Branches filtered to active company
  const availableBranches = React.useMemo(() => {
    if (!branches || branches.length === 0) return []
    return branches.filter((b) => isMatchingCompany(activeCompanyObj, b.companyId))
  }, [branches, activeCompanyObj])

  // Helper to compute standard action matrix for a role
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

  // Initialize or reset form upon opening
  React.useEffect(() => {
    if (!isOpen) return

    fetchCompanies()
    fetchBranches()

    if (editingUser) {
      setName(editingUser.name || "")
      setEmail(editingUser.email || "")
      setRole(editingUser.role || "Teams")
      setSelectedBranchId(editingUser.branchId || "")
      setDepartment(editingUser.department || "")
      setDesignation((editingUser as any).designation || "")
      setCommissionRate((editingUser as any).commissionRate || (editingUser as any).invoiceRate || "")
      setPhone(editingUser.phone || "")
      setPassword(editingUser.password || "")
      setStatus(editingUser.status || "Active")
      setAvatarUrl(editingUser.avatarUrl || (editingUser as any)?.avatar || "")
      setKycStatus(editingUser.kycStatus || "Pending")

      const userIdStr = String(editingUser.id)
      const emailNorm = (editingUser.email || "").toLowerCase().trim()
      const existingMatrix =
        userActionPermissions[userIdStr] ||
        (emailNorm ? userActionPermissions[emailNorm] : undefined) ||
        (editingUser.permissions?.actionMatrix)

      const fallbackMatrix = getMatrixForRole(editingUser.role || "Teams")
      const finalMatrix: Record<string, ModuleActionFlags> = {}

      CONFIGURABLE_MODULES.forEach((m) => {
        if (existingMatrix && existingMatrix[m]) {
          finalMatrix[m] = existingMatrix[m]
        } else {
          finalMatrix[m] = fallbackMatrix[m] || { view: false, add: false, edit: false, delete: false }
        }
      })

      setActionMatrix(finalMatrix)
      setAllowedModules(CONFIGURABLE_MODULES.filter(m => {
        const flags = finalMatrix[m]
        return flags ? (flags.view || flags.add || flags.edit || flags.delete) : false
      }))
    } else {
      setName("")
      setEmail("")
      setEmailError(null)
      const defaultRole: UserRole = initialRole || "Teams"
      setRole(defaultRole)
      setSelectedBranchId("")
      setDepartment("")
      setDesignation("")
      setCommissionRate("")
      setPhone("")
      setPassword("Pass@" + Math.floor(100000 + Math.random() * 900000))
      setStatus("Active")
      setAvatarUrl("")
      setKycStatus("Pending")

      const matrix = getMatrixForRole(defaultRole)
      setActionMatrix(matrix)
      setAllowedModules(CONFIGURABLE_MODULES.filter(m => {
        const flags = matrix[m]
        return flags ? (flags.view || flags.add || flags.edit || flags.delete) : false
      }))
    }
  }, [isOpen, editingUser, initialRole, getMatrixForRole, fetchCompanies, fetchBranches, userActionPermissions])

  // Handle Role change & apply default permission presets
  const handleRoleSelect = (newRole: UserRole) => {
    setRole(newRole)
    const nextMatrix = getMatrixForRole(newRole)
    setActionMatrix(nextMatrix)
    setAllowedModules(CONFIGURABLE_MODULES.filter(m => {
      const flags = nextMatrix[m]
      return flags ? (flags.view || flags.add || flags.edit || flags.delete) : false
    }))
  }

  // Permission Suite Quick Presets
  const applyPreset = (presetType: "full" | "viewOnly" | "clientPortal" | "salesCRM" | "finance" | "revoke") => {
    const nextMatrix: Record<string, ModuleActionFlags> = {}

    CONFIGURABLE_MODULES.forEach((m) => {
      if (presetType === "full") {
        nextMatrix[m] = { view: true, add: true, edit: true, delete: true }
      } else if (presetType === "viewOnly") {
        nextMatrix[m] = { view: true, add: false, edit: false, delete: false }
      } else if (presetType === "revoke") {
        nextMatrix[m] = { view: false, add: false, edit: false, delete: false }
      } else if (presetType === "clientPortal") {
        const clientMods: ModuleName[] = ["Projects", "Invoices", "Subscriptions", "EMI", "Tickets", "Files", "Messages", "Proposals", "Quotations"] as ModuleName[]
        const isClientMod = clientMods.includes(m as ModuleName)
        nextMatrix[m] = isClientMod ? { view: true, add: m === "Tickets" || m === "Messages", edit: false, delete: false } : { view: false, add: false, edit: false, delete: false }
      } else if (presetType === "salesCRM") {
        const salesMods: ModuleName[] = ["Leads", "Clients", "Quotations", "Estimates", "Sales Orders", "Invoices", "Tasks", "Messages", "Events"] as ModuleName[]
        const isSalesMod = salesMods.includes(m as ModuleName)
        nextMatrix[m] = isSalesMod ? { view: true, add: true, edit: true, delete: false } : { view: false, add: false, edit: false, delete: false }
      } else if (presetType === "finance") {
        const finMods: ModuleName[] = ["Invoices", "Payments", "Estimates", "Expenses", "Subscriptions", "EMI", "Credit Notes", "Debit Notes", "Reports"] as ModuleName[]
        const isFinMod = finMods.includes(m as ModuleName)
        nextMatrix[m] = isFinMod ? { view: true, add: true, edit: true, delete: false } : { view: false, add: false, edit: false, delete: false }
      }
    })

    setActionMatrix(nextMatrix)
    setAllowedModules(CONFIGURABLE_MODULES.filter(m => {
      const flags = nextMatrix[m]
      return flags ? (flags.view || flags.add || flags.edit || flags.delete) : false
    }))
  }

  // Checkbox toggle
  const handleCheckboxChange = (mod: ModuleName, actionKey: keyof ModuleActionFlags, checked: boolean) => {
    const currentFlags = actionMatrix[mod] || { view: false, add: false, edit: false, delete: false }
    const updatedFlags = { ...currentFlags, [actionKey]: checked }

    if (actionKey === "view" && !checked) {
      updatedFlags.add = false
      updatedFlags.edit = false
      updatedFlags.delete = false
    }
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

  // Generate random strong password
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*"
    let res = ""
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(res)
  }

  // Save handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    const companyIdToSave = activeCompanyObj.id || "tech"
    const companyNameToSave = getCompanyFullName(activeCompanyObj)

    const matchedBranch = branches.find(b => String(b.id) === String(selectedBranchId))
    const branchNameToSave = matchedBranch?.name || (selectedBranchId ? `Branch (${selectedBranchId})` : undefined)

    const userData: Partial<UserType> = {
      ...(editingUser ? { id: editingUser.id } : {}),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      companyId: companyIdToSave,
      companyIds: [companyIdToSave],
      companyName: companyNameToSave,
      branchId: selectedBranchId || undefined,
      branchIds: selectedBranchId ? [selectedBranchId] : undefined,
      branchName: branchNameToSave,
      department: department.trim() || (role === "Clients" ? "Client Accounts" : "General"),
      phone: phone.trim(),
      password: password.trim() || "Password123",
      status,
      avatarUrl: avatarUrl || undefined,
      kycStatus,
      allowedModules,
      permissions: {
        allowedModules,
        actionMatrix,
      },
      ...((role === "Teams" && designation) ? { designation: designation.trim() } : {}),
      ...((role === "Teams" && commissionRate) ? { commissionRate: commissionRate.trim() } : {}),
    }

    onSave(userData)
    onClose()
  }

  if (!isOpen) return null

  const companyDisplayName = getCompanyFullName(activeCompanyObj)
  const isTechCompany = activeCompanyObj.slug === "tech" || activeCompanyObj.id === "tech"

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl my-8 bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${
                role === "Super Admin" ? "bg-purple-500/10 text-purple-400 border border-purple-500/30" :
                role === "Admin" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30" :
                role === "Clients" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                "bg-blue-500/10 text-blue-400 border border-blue-500/30"
              }`}>
                {role === "Super Admin" ? "👑" : role === "Admin" ? "🛡️" : role === "Clients" ? "💼" : "👥"}
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {editingUser ? "Edit User Account" : "Add New User Account"}
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    <span>{isTechCompany ? "💻" : "🏢"}</span>
                    <span>{companyDisplayName}</span>
                  </span>
                  <span>•</span>
                  <span>Auto-linked to active company context</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab Switcher */}
              <div className="flex p-1 bg-surface rounded-xl border border-border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "profile" 
                      ? "bg-primary text-primary-foreground shadow-xs font-bold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Profile & Role
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("permissions")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "permissions" 
                      ? "bg-primary text-primary-foreground shadow-xs font-bold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Lock size={12} />
                  <span>Permissions ({allowedModules.length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === "profile" ? (
              <>
                {/* 1. Visual Role Selector */}
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                    Select Account Role *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "Teams" as UserRole, label: "Team Member", desc: "Staff & Employees", icon: "👥", color: "blue" },
                      { id: "Clients" as UserRole, label: "Client Account", desc: "Portal Customer", icon: "💼", color: "amber" },
                      { id: "Admin" as UserRole, label: "Branch/Co. Admin", desc: "Operational Manager", icon: "🛡️", color: "indigo" },
                      ...(isCurrentSuperAdmin ? [{ id: "Super Admin" as UserRole, label: "Super Admin", desc: "Full Master Access", icon: "👑", color: "purple" }] : []),
                    ].map((r) => {
                      const isSelected = role === r.id
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleRoleSelect(r.id)}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border-primary text-foreground shadow-xs ring-2 ring-primary/20"
                              : "bg-surface/60 border-border text-muted-foreground hover:border-border/80 hover:bg-surface"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xl">{r.icon}</span>
                            {isSelected && <CheckCircle2 size={16} className="text-primary" />}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-foreground">{r.label}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Core Profile Details */}
                <div className="p-4 rounded-xl bg-surface/50 border border-border/60 space-y-4">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <User size={14} className="text-primary" />
                    <span>Basic Information & Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        {role === "Clients" ? "Client / Contact Person Name *" : "Full Name *"}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={role === "Clients" ? "e.g. Rahul Sharma (Acme Corp)" : "e.g. Supriya Adhikary"}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                        <span>Email Address (Login ID) *</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@saampark.in"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                        <span>Phone Number</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                        <span>Login Password *</span>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={10} /> Generate Strong
                        </button>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter initial password"
                          required
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Organization & Role-Specific Assignment */}
                <div className="p-4 rounded-xl bg-surface/50 border border-border/60 space-y-4">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Building size={14} className="text-primary" />
                    <span>Company & Branch Assignment</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Active Company Display */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Assigned Company
                      </label>
                      <div className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground flex items-center gap-2 shadow-2xs">
                        <span>{isTechCompany ? "💻" : "🏢"}</span>
                        <span className="truncate">{companyDisplayName}</span>
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                          Active Context
                        </span>
                      </div>
                    </div>

                    {/* Branch Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                        <span>Assigned Branch / Location</span>
                        <span className="text-[10px] text-muted-foreground">
                          {availableBranches.length} branch{availableBranches.length === 1 ? "" : "es"} in this company
                        </span>
                      </label>
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
                      >
                        <option value="">🏢 Main Headquarters / All Branches</option>
                        {availableBranches.map((b) => (
                          <option key={b.id} value={b.id}>
                            📍 {b.name} {b.city ? `(${b.city})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Role Specific: Teams (Department, Designation, Commission %) */}
                    {role === "Teams" && (
                      <>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-foreground mb-1.5">
                            Department
                          </label>
                          <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="e.g. Sales & Marketing, Engineering, Support"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium mb-2"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {DEPARTMENT_SUGGESTIONS.map((dept) => (
                              <button
                                key={dept}
                                type="button"
                                onClick={() => setDepartment(dept)}
                                className={`text-[10px] px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                                  department === dept 
                                    ? "bg-primary text-primary-foreground font-bold border-primary" 
                                    : "bg-surface hover:bg-card border-border text-muted-foreground"
                                }`}
                              >
                                {dept}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1.5">
                            Designation / Job Title
                          </label>
                          <input
                            type="text"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            placeholder="e.g. Senior Software Engineer / Sales Manager"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                            <Percent size={12} className="text-amber-500" />
                            <span>Invoice Commission % / Fixed Rate</span>
                          </label>
                          <input
                            type="text"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                            placeholder="e.g. 5% or ₹1,500/task"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
                          />
                        </div>
                      </>
                    )}

                    {/* Role Specific: KYC Status */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        KYC / Verification Status
                      </label>
                      <select
                        value={kycStatus}
                        onChange={(e) => setKycStatus(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
                      >
                        <option value="Pending">⏳ Pending Verification</option>
                        <option value="Processing">🔄 In Processing</option>
                        <option value="Verified">✅ Verified Account</option>
                        <option value="Rejected">❌ Rejected / Incomplete</option>
                      </select>
                    </div>

                    {/* Account Status */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Account Status
                      </label>
                      <div className="flex items-center gap-3 h-10">
                        {(["Active", "Inactive", "Pending"] as UserStatus[]).map((st) => (
                          <label key={st} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="accountStatus"
                              checked={status === st}
                              onChange={() => setStatus(st)}
                              className="text-primary focus:ring-primary"
                            />
                            <span>{st}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* PERMISSIONS TAB */
              <div className="space-y-4">
                {/* Master Presets Bar */}
                <div className="p-3.5 rounded-xl bg-surface/70 border border-border/80 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Quick Permission Presets:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {role === "Clients" ? (
                      <button
                        type="button"
                        onClick={() => applyPreset("clientPortal")}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        💼 Standard Client Portal
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => applyPreset("salesCRM")}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500/20 transition-colors cursor-pointer"
                        >
                          🎯 Sales & CRM
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("finance")}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                          📊 Accounts & Finance
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("full")}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-colors cursor-pointer"
                        >
                          🌟 Full Master Access
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("viewOnly")}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          👁️ View Only All
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => applyPreset("revoke")}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-500 border border-rose-500/20 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                {/* Module Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder="Search permissions by module name..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
                  />
                </div>

                {/* Categorized Module Permissions Accordions */}
                <div className="space-y-3">
                  {MODULE_CATEGORIES.map((cat) => {
                    const filteredModules = cat.modules.filter(m => 
                      m.toLowerCase().includes(moduleSearch.toLowerCase())
                    )
                    if (filteredModules.length === 0 && moduleSearch) return null

                    const isCollapsed = Boolean(collapsedCategories[cat.name])
                    const activeCountInCat = cat.modules.filter(m => {
                      const f = actionMatrix[m]
                      return f && (f.view || f.add || f.edit || f.delete)
                    }).length

                    return (
                      <div key={cat.name} className="rounded-xl border border-border/80 bg-card overflow-hidden">
                        {/* Category Header */}
                        <div 
                          onClick={() => setCollapsedCategories(prev => ({ ...prev, [cat.name]: !prev[cat.name] }))}
                          className="px-4 py-3 bg-surface/50 hover:bg-surface/80 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{cat.icon}</span>
                            <span className="text-xs font-bold text-foreground">{cat.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                              {activeCountInCat} of {cat.modules.length} enabled
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const next = { ...actionMatrix }
                                const shouldEnable = activeCountInCat < cat.modules.length
                                cat.modules.forEach(m => {
                                  next[m] = shouldEnable ? { view: true, add: true, edit: true, delete: false } : { view: false, add: false, edit: false, delete: false }
                                })
                                setActionMatrix(next)
                                setAllowedModules(CONFIGURABLE_MODULES.filter(m => {
                                  const f = next[m]
                                  return f && (f.view || f.add || f.edit || f.delete)
                                }))
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md font-bold text-primary hover:bg-primary/10 transition-colors"
                            >
                              Toggle Category
                            </button>
                            {isCollapsed ? <ChevronRight size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                          </div>
                        </div>

                        {/* Category Module Cards */}
                        {!isCollapsed && (
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {filteredModules.map((m) => {
                              const flags = actionMatrix[m] || { view: false, add: false, edit: false, delete: false }
                              const isAnyActive = flags.view || flags.add || flags.edit || flags.delete

                              return (
                                <div
                                  key={m}
                                  className={`p-3 rounded-xl border transition-all ${
                                    isAnyActive 
                                      ? "bg-surface/60 border-primary/30 shadow-2xs" 
                                      : "bg-surface/20 border-border/40 opacity-75"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-foreground">{m}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextState = !flags.view
                                        handleCheckboxChange(m, "view", nextState)
                                        handleCheckboxChange(m, "add", nextState)
                                        handleCheckboxChange(m, "edit", nextState)
                                        handleCheckboxChange(m, "delete", nextState)
                                      }}
                                      className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                                    >
                                      {isAnyActive ? "Uncheck" : "Select All"}
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs">
                                    {(["view", "add", "edit", "delete"] as (keyof ModuleActionFlags)[]).map((actionKey) => (
                                      <label key={actionKey} className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(flags[actionKey])}
                                          onChange={(e) => handleCheckboxChange(m, actionKey, e.target.checked)}
                                          className="rounded-sm border-border text-primary focus:ring-primary w-3.5 h-3.5"
                                        />
                                        <span className={`text-[11px] capitalize font-medium ${
                                          flags[actionKey] ? "text-foreground font-bold" : "text-muted-foreground"
                                        }`}>
                                          {actionKey}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60 sticky bottom-0 bg-card z-10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {activeTab === "profile" ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("permissions")}
                    className="px-4 py-2.5 rounded-xl bg-surface border border-border hover:bg-surface/80 text-xs font-bold text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Configure Permissions</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className="px-4 py-2.5 rounded-xl bg-surface border border-border hover:bg-surface/80 text-xs font-bold text-foreground transition-all cursor-pointer"
                  >
                    Back to Profile
                  </button>
                )}

                <Button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {editingUser ? "Save Changes" : "Create Account"}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
