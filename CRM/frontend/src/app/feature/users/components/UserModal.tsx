"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, User, Mail, Shield, Building, Phone, Lock, UserCheck, ShieldCheck, 
  Check, Info, Crown, MapPin, Eye, EyeOff, Sparkles, RefreshCw, Search,
  Briefcase, Percent, ChevronDown, ChevronRight, CheckCircle2, Layers,
  Globe, Radio
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { UserItem as UserType, UserRole, UserStatus } from "../types"
import { useAuthStore, isMatchingCompany, getCompanyFullName, getCanonicalCompanyId } from "@/store/useAuthStore"
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

  // Company Selection State (allows Super Admin to pick target company)
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("tech")
  // Access Scope Type: "company" (Entire company) or "branch" (Dedicated branch only)
  const [scopeType, setScopeType] = React.useState<"company" | "branch">("company")

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

  // Resolve selected company object
  const targetCompanyObj = React.useMemo(() => {
    return companies.find(c => isMatchingCompany(c, selectedCompanyId)) || companies[0] || {
      id: "tech",
      name: "SAAMPARK TECHNOLOGY",
      brand_name: "SAAMPARK",
      division_name: "TECHNOLOGY",
      logo: "💻"
    }
  }, [companies, selectedCompanyId])

  // Available branches for the chosen company
  const availableBranches = React.useMemo(() => {
    if (!branches || branches.length === 0) return []
    return branches.filter((b) => isMatchingCompany(targetCompanyObj, b.companyId || (b as any).company_id))
  }, [branches, targetCompanyObj])

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
      
      const initComp = editingUser.companyId || activeCompanyId || "tech"
      setSelectedCompanyId(initComp)

      if (editingUser.branchId) {
        setScopeType("branch")
        setSelectedBranchId(editingUser.branchId)
      } else {
        setScopeType("company")
        setSelectedBranchId("")
      }

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
      
      const defaultComp = (activeCompanyId && activeCompanyId !== "all") ? activeCompanyId : "tech"
      setSelectedCompanyId(defaultComp)
      setScopeType("company")
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
  }, [isOpen, editingUser, initialRole, activeCompanyId, getMatrixForRole, fetchCompanies, fetchBranches, userActionPermissions])

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

    const isAllCompanies = selectedCompanyId === "all" || role === "Super Admin"
    const canonCompId = isAllCompanies ? "all" : (targetCompanyObj?.id || targetCompanyObj?.slug || selectedCompanyId || "tech")
    const allCompIds = companies && companies.length > 0 ? companies.map(c => c.id || c.slug).filter(Boolean) as string[] : ["tech", "digital", "saampark-ai-solutions"]
    const companyIds = isAllCompanies ? allCompIds : [canonCompId]
    const companyNameToSave = isAllCompanies ? "SAAMPARK Group (All Companies)" : getCompanyFullName(targetCompanyObj)

    const effectiveBranchId = scopeType === "branch" ? (selectedBranchId || undefined) : undefined
    const matchedBranch = effectiveBranchId ? branches.find(b => String(b.id) === String(effectiveBranchId)) : undefined
    const branchNameToSave = matchedBranch?.name || (effectiveBranchId ? `Branch (${effectiveBranchId})` : undefined)

    const userData: Partial<UserType> = {
      ...(editingUser ? { id: editingUser.id } : {}),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      companyId: canonCompId,
      companyIds,
      companyName: companyNameToSave,
      branchId: effectiveBranchId,
      branchIds: effectiveBranchId ? [effectiveBranchId] : undefined,
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

  const companyDisplayName = getCompanyFullName(targetCompanyObj)
  const isTechCompany = targetCompanyObj.slug === "tech" || targetCompanyObj.id === "tech"

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl my-6 bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-surface/70 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs border ${
                role === "Super Admin" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" :
                role === "Admin" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" :
                role === "Clients" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                "bg-blue-500/10 text-blue-400 border-blue-500/30"
              }`}>
                {role === "Super Admin" ? "👑" : role === "Admin" ? "🛡️" : role === "Clients" ? "💼" : "👥"}
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
                  <span>{editingUser ? "Edit User Account" : "Add New User Account"}</span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="inline-flex items-center gap-1 font-bold text-primary">
                    <span>{isTechCompany ? "💻" : "🏢"}</span>
                    <span>{companyDisplayName}</span>
                  </span>
                  <span>•</span>
                  <span>{scopeType === "branch" && selectedBranchId ? "📍 Branch-Restricted Access" : "🏢 Company-Wide Scope"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab Switcher */}
              <div className="flex p-1 bg-surface rounded-xl border border-border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "profile" 
                      ? "bg-primary text-primary-foreground shadow-xs font-bold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Profile & Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("permissions")}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "permissions" 
                      ? "bg-primary text-primary-foreground shadow-xs font-bold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Lock size={13} />
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
                          className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border-primary text-foreground shadow-xs ring-2 ring-primary/20"
                              : "bg-surface/60 border-border text-muted-foreground hover:border-border/80 hover:bg-surface"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{r.icon}</span>
                            {isSelected && <CheckCircle2 size={16} className="text-primary" />}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-foreground">{r.label}</div>
                            <div className="text-[10.5px] text-muted-foreground mt-0.5">{r.desc}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Core Profile Details */}
                <div className="p-4 sm:p-5 rounded-2xl bg-surface/50 border border-border/70 space-y-4 shadow-xs">
                  <div className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                    <User size={14} className="text-primary" />
                    <span>Basic Information & Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
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
                      <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
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
                      <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
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
                      <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
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

                {/* 3. Company & Branch Assignment (Enhanced with Dedicated Branch Scope) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-surface/50 border border-border/70 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Building size={14} className="text-primary" />
                      <span>Company & Regional Branch Assignment</span>
                    </div>
                  </div>

                  {/* Access Scope Selector: Company-Wide vs Dedicated Branch Only */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-foreground">
                      User Access Scope Level *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setScopeType("company")}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                          scopeType === "company"
                            ? "bg-primary/10 border-primary shadow-xs ring-2 ring-primary/20"
                            : "bg-card border-border hover:border-border/80"
                        }`}
                      >
                        <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
                          {scopeType === "company" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <Globe size={13} className="text-primary" />
                            <span>Company-Wide Access</span>
                          </div>
                          <p className="text-[10.5px] text-muted-foreground mt-0.5">
                            User can access and work across all regional branches and headquarters in this company.
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => setScopeType("branch")}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                          scopeType === "branch"
                            ? "bg-primary/10 border-primary shadow-xs ring-2 ring-primary/20"
                            : "bg-card border-border hover:border-border/80"
                        }`}
                      >
                        <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
                          {scopeType === "branch" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <MapPin size={13} className="text-amber-500" />
                            <span>Dedicated Branch Only</span>
                          </div>
                          <p className="text-[10.5px] text-muted-foreground mt-0.5">
                            User is locked strictly to a dedicated branch; they cannot access other branches or global data.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company & Branch Pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Company Picker */}
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        Target Company
                      </label>
                      <select
                        value={selectedCompanyId}
                        onChange={(e) => {
                          setSelectedCompanyId(e.target.value)
                          setSelectedBranchId("")
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-bold text-foreground shadow-2xs"
                      >
                        {isCurrentSuperAdmin && (
                          <option value="all">🌐 SAAMPARK Group (All Companies / Global Scope)</option>
                        )}
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.id === "tech" ? "💻" : "🏢"} {getCompanyFullName(c)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Branch Picker */}
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
                        <span>{scopeType === "branch" ? "Assigned Dedicated Branch *" : "Default Regional Branch (Optional)"}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {availableBranches.length} branch{availableBranches.length === 1 ? "" : "es"} available
                        </span>
                      </label>
                      {availableBranches.length > 0 ? (
                        <select
                          value={selectedBranchId}
                          onChange={(e) => setSelectedBranchId(e.target.value)}
                          required={scopeType === "branch"}
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-card border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium ${
                            scopeType === "branch" && !selectedBranchId ? "border-amber-500/80 bg-amber-50/20 dark:bg-amber-950/20" : "border-border"
                          }`}
                        >
                          <option value="">{scopeType === "branch" ? "-- Select Assigned Branch --" : "🏢 Main Headquarters / All Branches"}</option>
                          {availableBranches.map((b) => (
                            <option key={b.id} value={b.id}>
                              📍 {b.name} {b.city ? `(${b.city})` : ""} {b.code ? `[${b.code}]` : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-dashed border-border text-xs text-muted-foreground italic flex items-center gap-1.5">
                          <Info size={13} className="text-amber-500 shrink-0" />
                          <span>No branches configured for this company yet. Defaults to Main HQ.</span>
                        </div>
                      )}
                    </div>

                    {/* Role Specific: Teams (Department, Designation, Commission %) */}
                    {role === "Teams" && (
                      <>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-foreground mb-1.5">
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
                                className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer font-medium ${
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
                          <label className="block text-xs font-bold text-foreground mb-1.5">
                            Designation / Job Title
                          </label>
                          <input
                            type="text"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            placeholder="e.g. Senior Branch Executive / Sales Manager"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                            <Percent size={12} className="text-amber-500" />
                            <span>Invoice Commission % / Rate</span>
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
                      <label className="block text-xs font-bold text-foreground mb-1.5">
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
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        Account Status
                      </label>
                      <div className="flex items-center gap-3 h-10">
                        {(["Active", "Inactive", "Pending"] as UserStatus[]).map((st) => (
                          <label key={st} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
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
                <div className="p-3.5 rounded-2xl bg-surface/70 border border-border/80 flex flex-wrap items-center justify-between gap-2.5">
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
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
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
                      <div key={cat.name} className="rounded-2xl border border-border/80 bg-card overflow-hidden">
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
                className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5">
                {activeTab === "profile" ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("permissions")}
                    className="px-5 py-2.5 rounded-xl bg-surface border border-border hover:bg-surface/80 text-xs font-bold text-foreground transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Configure Permissions</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className="px-5 py-2.5 rounded-xl bg-surface border border-border hover:bg-surface/80 text-xs font-bold text-foreground transition-all cursor-pointer shadow-xs"
                  >
                    Back to Profile
                  </button>
                )}

                <Button
                  type="submit"
                  className="px-7 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
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

