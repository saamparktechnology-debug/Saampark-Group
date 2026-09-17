"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, User, Mail, Shield, Building, Phone, Lock, UserCheck, ShieldCheck, 
  Check, Info, Crown, MapPin, Eye, EyeOff, Sparkles, RefreshCw, Search,
  Briefcase, Percent, ChevronDown, ChevronRight, CheckCircle2, Layers,
  Globe, Radio, ShieldAlert, KeyRound, ArrowRight, CheckSquare, Square
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
  const { companies, branches, user: currentUser, activeCompanyId, activeBranchId, fetchCompanies, fetchBranches } = useAuthStore()
  
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
  
  // Tabs & Search State (Preserved between tab clicks!)
  const [activeTab, setActiveTab] = React.useState<"profile" | "permissions">("profile")
  const [moduleSearch, setModuleSearch] = React.useState("")
  const [collapsedCategories, setCollapsedCategories] = React.useState<Record<string, boolean>>({})

  // Action Matrix & Allowed Modules
  const [actionMatrix, setActionMatrix] = React.useState<Record<string, ModuleActionFlags>>({})
  const [allowedModules, setAllowedModules] = React.useState<ModuleName[]>([])

  // Tracking refs to ensure form values are NEVER wiped when switching tabs
  const wasOpenRef = React.useRef(false)
  const editingUserIdRef = React.useRef<string | null>(null)

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

  // Initialize or reset form ONLY when the modal opens or when editing user target changes
  React.useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false
      editingUserIdRef.current = null
      return
    }

    const currentEditId = editingUser ? String(editingUser.id || editingUser.email) : "__new__"
    const isInitialOpen = !wasOpenRef.current
    const hasEditingUserChanged = currentEditId !== editingUserIdRef.current

    // If modal is already open and target hasn't changed, DO NOT wipe form!
    if (!isInitialOpen && !hasEditingUserChanged) {
      return
    }

    wasOpenRef.current = true
    editingUserIdRef.current = currentEditId
    setActiveTab("profile")
    setEmailError(null)

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
      if (activeBranchId && activeBranchId !== "all") {
        setScopeType("branch")
        setSelectedBranchId(activeBranchId)
      } else {
        setScopeType("company")
        setSelectedBranchId("")
      }

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
  }, [isOpen, editingUser, initialRole, activeCompanyId, activeBranchId, getMatrixForRole, fetchCompanies, fetchBranches, userActionPermissions])

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

  // Checkbox toggle for permissions
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

    const effectiveBranchId = selectedBranchId || (scopeType === "branch" ? (activeBranchId || undefined) : undefined)
    const matchedBranch = effectiveBranchId ? branches.find(b => String(b.id) === String(effectiveBranchId) || b.name.toLowerCase() === String(effectiveBranchId).toLowerCase()) : undefined
    const branchNameToSave = matchedBranch?.name || (effectiveBranchId ? (isNaN(Number(effectiveBranchId)) ? effectiveBranchId : `Branch (${effectiveBranchId})`) : undefined)

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

  // Role glow colors for 3D styling
  const roleGlowMap = {
    "Super Admin": "from-purple-600/30 via-pink-600/20 to-transparent",
    "Admin": "from-indigo-600/30 via-blue-600/20 to-transparent",
    "Clients": "from-amber-500/30 via-orange-600/20 to-transparent",
    "Teams": "from-blue-600/30 via-cyan-600/20 to-transparent"
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl overflow-y-auto" style={{ perspective: "1400px" }}>
        {/* Subtle Ambient Background Light */}
        <div className={`fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b ${roleGlowMap[role] || roleGlowMap.Teams} blur-[120px] pointer-events-none opacity-70`} />

        {/* 3D Elevated Main Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotateX: 6, y: 30 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, rotateX: -6, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl my-auto rounded-[32px] overflow-hidden flex flex-col max-h-[92vh] border border-white/20 dark:border-white/10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.25)] bg-[#0f1422]/95 backdrop-blur-2xl text-slate-100"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Top Gloss Highlight Bevel */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent z-30" />

          {/* 3D Header */}
          <div className="relative flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-xl sticky top-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            {/* Title & Badge */}
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl transition-all duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border ${
                role === "Super Admin" ? "bg-gradient-to-br from-purple-500/30 to-pink-600/30 border-purple-400/40 text-purple-300 shadow-purple-900/30" :
                role === "Admin" ? "bg-gradient-to-br from-indigo-500/30 to-blue-600/30 border-indigo-400/40 text-indigo-300 shadow-indigo-900/30" :
                role === "Clients" ? "bg-gradient-to-br from-amber-500/30 to-orange-600/30 border-amber-400/40 text-amber-300 shadow-amber-900/30" :
                "bg-gradient-to-br from-blue-500/30 to-cyan-600/30 border-blue-400/40 text-blue-300 shadow-blue-900/30"
              }`}>
                {role === "Super Admin" ? "👑" : role === "Admin" ? "🛡️" : role === "Clients" ? "💼" : "👥"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2 drop-shadow-sm">
                    {editingUser ? "Edit User Account" : "Create New User"}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider border shadow-xs ${
                    role === "Super Admin" ? "bg-purple-500/20 text-purple-300 border-purple-500/40" :
                    role === "Admin" ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" :
                    role === "Clients" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                    "bg-blue-500/20 text-blue-300 border-blue-500/40"
                  }`}>
                    {role}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-400">
                    <span>{isTechCompany ? "💻" : "🏢"}</span>
                    <span>{companyDisplayName}</span>
                  </span>
                  <span>•</span>
                  <span className="font-medium text-slate-300">
                    {scopeType === "branch" && selectedBranchId ? "📍 Dedicated Branch Scope" : "🏢 Company-Wide Scope"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3D Segmented Control Tab Switcher & Close */}
            <div className="flex items-center gap-3">
              {/* Tactile Sunken 3D Switcher */}
              <div className="flex p-1.5 bg-[#090d16]/80 rounded-2xl border border-white/10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)]">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "profile" 
                      ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_4px_14px_rgba(59,130,246,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] -translate-y-0.5" 
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <User size={13} />
                  <span>Profile & Assignment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("permissions")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "permissions" 
                      ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_4px_14px_rgba(59,130,246,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] -translate-y-0.5" 
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Lock size={13} />
                  <span>Configure Modules ({allowedModules.length})</span>
                </button>
              </div>

              {/* Close Button with 3D Bevel */}
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-400 hover:text-white shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:translate-y-0.5 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Form Content: Scrollable Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            
            {/* ========================================================================= */}
            {/* TAB 1: PROFILE & ASSIGNMENT (Kept mounted via CSS to preserve typed data) */}
            {/* ========================================================================= */}
            <div className={activeTab === "profile" ? "space-y-6 block" : "space-y-6 hidden"}>
              
              {/* STEP 1: 3D INTERACTIVE ROLE SELECTOR */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
                <div className="flex items-center justify-between mb-3.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Crown size={14} className="text-amber-400" />
                    <span>Step 1: Select Account Role *</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Determines security level and base permissions</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "Teams" as UserRole, label: "Team Member", desc: "Staff & Employee", icon: "👥", color: "blue", activeBorder: "border-blue-500/80 shadow-blue-500/25", glow: "from-blue-500/20 to-transparent" },
                    { id: "Clients" as UserRole, label: "Client Account", desc: "Portal Customer", icon: "💼", color: "amber", activeBorder: "border-amber-500/80 shadow-amber-500/25", glow: "from-amber-500/20 to-transparent" },
                    { id: "Admin" as UserRole, label: "Branch / Co. Admin", desc: "Operational Manager", icon: "🛡️", color: "indigo", activeBorder: "border-indigo-500/80 shadow-indigo-500/25", glow: "from-indigo-500/20 to-transparent" },
                    ...(isCurrentSuperAdmin ? [{ id: "Super Admin" as UserRole, label: "Super Admin", desc: "Full Master Access", icon: "👑", color: "purple", activeBorder: "border-purple-500/80 shadow-purple-500/25", glow: "from-purple-500/20 to-transparent" }] : []),
                  ].map((r) => {
                    const isSelected = role === r.id
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleSelect(r.id)}
                        className={`group relative p-4 rounded-2xl text-left flex flex-col justify-between transition-all duration-200 cursor-pointer border ${
                          isSelected
                            ? `bg-gradient-to-b ${r.glow} ${r.activeBorder} shadow-[0_12px_24px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] -translate-y-1 ring-1 ring-white/20`
                            : "bg-[#111726]/60 hover:bg-[#151c2e]/80 border-white/10 hover:border-white/25 shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">
                            {r.icon}
                          </span>
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-xs">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-white/20" />
                          )}
                        </div>
                        <div>
                          <div className={`font-black text-xs ${isSelected ? "text-white" : "text-slate-200"}`}>{r.label}</div>
                          <div className="text-[10.5px] text-slate-400 mt-0.5">{r.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* STEP 2: 3D CORE PROFILE DETAILS */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <User size={14} className="text-blue-400" />
                    <span>Step 2: Basic Identity & Credentials</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Credentials will be emailed automatically</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {role === "Clients" ? "Client / Contact Person Name *" : "Full Name *"}
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={role === "Clients" ? "e.g. Rahul Sharma" : "e.g. Supriya Adhikary"}
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/15 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(0,0,0,0.4)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Email Address (Login ID) *</span>
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@saampark.in"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/15 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(0,0,0,0.4)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/15 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(0,0,0,0.4)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Password & Generator */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Login Password *</span>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sparkles size={10} /> Generate Strong
                      </button>
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Initial account password"
                        required
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/15 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(0,0,0,0.4)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: 3D COMPANY & BRANCH SCOPE */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Building size={14} className="text-blue-400" />
                    <span>Step 3: Company & Branch Scope Isolation</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Strict regional access boundaries</span>
                </div>

                {/* 3D Scope Selection Tiles */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Access Boundary Level *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setScopeType("company")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                        scopeType === "company"
                          ? "bg-gradient-to-b from-blue-500/20 to-transparent border-blue-500/80 shadow-[0_8px_20px_rgba(59,130,246,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] -translate-y-0.5"
                          : "bg-[#111726]/60 hover:bg-[#151c2e]/80 border-white/10 hover:border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                      }`}
                    >
                      <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center shrink-0">
                        {scopeType === "company" && <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-xs" />}
                      </div>
                      <div>
                        <div className="font-black text-xs text-white flex items-center gap-1.5">
                          <Globe size={13} className="text-blue-400" />
                          <span>Company-Wide Scope</span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                          User can access and collaborate across all branches and regional offices in this company.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setScopeType("branch")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                        scopeType === "branch"
                          ? "bg-gradient-to-b from-amber-500/20 to-transparent border-amber-500/80 shadow-[0_8px_20px_rgba(245,158,11,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] -translate-y-0.5"
                          : "bg-[#111726]/60 hover:bg-[#151c2e]/80 border-white/10 hover:border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                      }`}
                    >
                      <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center shrink-0">
                        {scopeType === "branch" && <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs" />}
                      </div>
                      <div>
                        <div className="font-black text-xs text-white flex items-center gap-1.5">
                          <MapPin size={13} className="text-amber-400" />
                          <span>Dedicated Branch Only</span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                          User is strictly locked to this specific regional branch; hidden from and isolated from other branches.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company & Branch Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Company Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Target Company *
                    </label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => {
                        setSelectedCompanyId(e.target.value)
                        setSelectedBranchId("")
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/15 text-xs text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-bold transition-all"
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
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>{scopeType === "branch" ? "Assigned Dedicated Branch *" : "Regional Branch (Optional)"}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {availableBranches.length} branch{availableBranches.length === 1 ? "" : "es"}
                      </span>
                    </label>
                    {availableBranches.length > 0 ? (
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        required={scopeType === "branch"}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border text-xs text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all ${
                          scopeType === "branch" && !selectedBranchId ? "border-amber-500/80 bg-amber-950/20" : "border-white/15"
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
                      <div className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16]/50 border border-dashed border-white/15 text-xs text-slate-400 italic flex items-center gap-1.5">
                        <Info size={13} className="text-amber-400 shrink-0" />
                        <span>No branches configured for this company.</span>
                      </div>
                    )}
                  </div>

                  {/* Role Specific: Teams (Department, Designation, Commission %) */}
                  {role === "Teams" && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          Department
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Sales & Marketing, Engineering, Support"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/15 text-xs text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium mb-2 transition-all"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {DEPARTMENT_SUGGESTIONS.map((dept) => (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => setDepartment(dept)}
                              className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-semibold ${
                                department === dept 
                                  ? "bg-blue-600 text-white font-bold border-blue-400 shadow-xs" 
                                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-400 hover:text-white"
                              }`}
                            >
                              {dept}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          Designation / Job Title
                        </label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Senior Branch Executive"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/15 text-xs text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                          <Percent size={12} className="text-amber-400" />
                          <span>Invoice Commission Rate</span>
                        </label>
                        <input
                          type="text"
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(e.target.value)}
                          placeholder="e.g. 5% or ₹1,500/task"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/15 text-xs text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                        />
                      </div>
                    </>
                  )}

                  {/* KYC Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      KYC Verification Status
                    </label>
                    <select
                      value={kycStatus}
                      onChange={(e) => setKycStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/15 text-xs text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                    >
                      <option value="Pending">⏳ Pending Verification</option>
                      <option value="Processing">🔄 In Processing</option>
                      <option value="Verified">✅ Verified Account</option>
                      <option value="Rejected">❌ Rejected / Incomplete</option>
                    </select>
                  </div>

                  {/* Account Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Account Status
                    </label>
                    <div className="flex items-center gap-3 h-10">
                      {(["Active", "Inactive", "Pending"] as UserStatus[]).map((st) => (
                        <label key={st} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-300 hover:text-white">
                          <input
                            type="radio"
                            name="accountStatus"
                            checked={status === st}
                            onChange={() => setStatus(st)}
                            className="text-blue-500 focus:ring-blue-500"
                          />
                          <span>{st}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* TAB 2: PERMISSIONS & MODULE MATRIX (Kept mounted to preserve all states)  */}
            {/* ========================================================================= */}
            <div className={activeTab === "permissions" ? "space-y-4 block" : "space-y-4 hidden"}>
              
              {/* 3D Master Presets Bar */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>3D Quick Presets:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {role === "Clients" ? (
                    <button
                      type="button"
                      onClick={() => applyPreset("clientPortal")}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-b from-amber-500/25 to-amber-600/25 text-amber-300 border border-amber-500/40 shadow-[0_2px_8px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-amber-500/35 active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      💼 Standard Client Portal
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => applyPreset("salesCRM")}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-b from-blue-500/25 to-blue-600/25 text-blue-300 border border-blue-500/40 shadow-[0_2px_8px_rgba(59,130,246,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-blue-500/35 active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        🎯 Sales & CRM
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("finance")}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-b from-emerald-500/25 to-emerald-600/25 text-emerald-300 border border-emerald-500/40 shadow-[0_2px_8px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-emerald-500/35 active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        📊 Accounts & Finance
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("full")}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-b from-purple-500/25 to-pink-600/25 text-purple-300 border border-purple-500/40 shadow-[0_2px_8px_rgba(168,85,247,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-purple-500/35 active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        🌟 Full Master Access
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("viewOnly")}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white/[0.04] text-slate-300 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-white/[0.08] active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        👁️ View Only All
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => applyPreset("revoke")}
                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-b from-rose-500/20 to-rose-600/20 text-rose-400 border border-rose-500/30 shadow-[0_2px_8px_rgba(244,63,94,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-rose-500/30 active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    Revoke All
                  </button>
                </div>
              </div>

              {/* Module Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Search modules to configure..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/15 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(0,0,0,0.4)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                />
              </div>

              {/* Categorized 3D Module Cards Accordions */}
              <div className="space-y-3.5">
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
                    <div key={cat.name} className="rounded-2xl border border-white/10 bg-[#111726]/60 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
                      {/* Category Header */}
                      <div 
                        onClick={() => setCollapsedCategories(prev => ({ ...prev, [cat.name]: !prev[cat.name] }))}
                        className="px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-between cursor-pointer transition-colors border-b border-white/5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl filter drop-shadow-sm">{cat.icon}</span>
                          <span className="text-xs font-black text-white">{cat.name}</span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-extrabold border border-blue-500/30 shadow-2xs">
                            {activeCountInCat} of {cat.modules.length} active
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
                            className="text-[10.5px] px-2.5 py-1 rounded-lg font-bold text-blue-400 hover:text-white hover:bg-blue-600/30 border border-blue-500/20 transition-all cursor-pointer"
                          >
                            Toggle Suite
                          </button>
                          {isCollapsed ? <ChevronRight size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                        </div>
                      </div>

                      {/* 3D Module Action Chips */}
                      {!isCollapsed && (
                        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {filteredModules.map((m) => {
                            const flags = actionMatrix[m] || { view: false, add: false, edit: false, delete: false }
                            const isAnyActive = flags.view || flags.add || flags.edit || flags.delete

                            return (
                              <div
                                key={m}
                                className={`p-3.5 rounded-xl border transition-all duration-200 ${
                                  isAnyActive 
                                    ? "bg-[#141b2e]/90 border-blue-500/40 shadow-[0_4px_12px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]" 
                                    : "bg-[#0c101a]/60 border-white/5 opacity-70 hover:opacity-100"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2.5">
                                  <span className="text-xs font-extrabold text-white">{m}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextState = !flags.view
                                      handleCheckboxChange(m, "view", nextState)
                                      handleCheckboxChange(m, "add", nextState)
                                      handleCheckboxChange(m, "edit", nextState)
                                      handleCheckboxChange(m, "delete", nextState)
                                    }}
                                    className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline font-extrabold cursor-pointer"
                                  >
                                    {isAnyActive ? "Clear" : "Full Access"}
                                  </button>
                                </div>

                                {/* 3D Interactive Action Buttons */}
                                <div className="grid grid-cols-4 gap-1.5">
                                  {(["view", "add", "edit", "delete"] as (keyof ModuleActionFlags)[]).map((actionKey) => {
                                    const isChecked = Boolean(flags[actionKey])
                                    const colorTheme = 
                                      actionKey === "view" ? "emerald" :
                                      actionKey === "add" ? "blue" :
                                      actionKey === "edit" ? "amber" : "rose"

                                    const themeClasses = {
                                      emerald: isChecked 
                                        ? "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border-emerald-400 shadow-[0_2px_8px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]" 
                                        : "bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20 hover:text-white",
                                      blue: isChecked 
                                        ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white border-blue-400 shadow-[0_2px_8px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]" 
                                        : "bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20 hover:text-white",
                                      amber: isChecked 
                                        ? "bg-gradient-to-b from-amber-500 to-amber-600 text-white border-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]" 
                                        : "bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20 hover:text-white",
                                      rose: isChecked 
                                        ? "bg-gradient-to-b from-rose-500 to-rose-600 text-white border-rose-400 shadow-[0_2px_8px_rgba(244,63,94,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]" 
                                        : "bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20 hover:text-white",
                                    }[colorTheme]

                                    return (
                                      <button
                                        key={actionKey}
                                        type="button"
                                        onClick={() => handleCheckboxChange(m, actionKey, !isChecked)}
                                        className={`py-1 rounded-lg text-[10.5px] font-black capitalize border transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 active:translate-y-0.5 ${themeClasses}`}
                                      >
                                        {isChecked && <Check size={10} strokeWidth={3} />}
                                        <span>{actionKey}</span>
                                      </button>
                                    )
                                  })}
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

            {/* 3D FLOATING ACTION FOOTER */}
            <div className="flex items-center justify-between pt-5 border-t border-white/10 sticky bottom-0 bg-[#0f1422]/95 backdrop-blur-xl z-20 shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-slate-300 hover:text-white shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] active:translate-y-0.5 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                {activeTab === "profile" ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("permissions")}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-xs font-black text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:translate-y-0.5"
                  >
                    <span>Next: Configure Modules</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-xs font-black text-white transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:translate-y-0.5"
                  >
                    Back to Profile
                  </button>
                )}

                <Button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-b from-blue-500 via-indigo-600 to-blue-700 text-white font-black text-xs shadow-[0_8px_25px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer border border-blue-400/40"
                >
                  {editingUser ? "Save User Account" : "Create Account Now"}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
