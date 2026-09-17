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
  
  const isRootSuperAdminEmail = React.useCallback((e?: string) => {
    if (!e) return false
    const norm = e.toLowerCase().trim()
    return norm === "saampark.official@gmail.com" || norm === "saampark.official"
  }, [])

  const isCurrentSuperAdmin = 
    currentUser?.role === "Super Admin" || 
    isRootSuperAdminEmail(currentUser?.email) ||
    String(currentUser?.role || "").toLowerCase().includes("super")

  const isEditingRootSuperAdmin = Boolean(
    (editingUser?.email && isRootSuperAdminEmail(editingUser.email)) ||
    (email && isRootSuperAdminEmail(email))
  )

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

  // If user selected a specific company (not "all"), lock company selector to that company
  const isCompanyLocked = Boolean(activeCompanyId && activeCompanyId !== "all")

  // Available companies for selection:
  // If locked to a company (e.g. SAAMPARK TECHNOLOGY), strictly show only that company.
  // If switched to "all" (All Companies / Global Scope), show all companies.
  const availableCompanies = React.useMemo(() => {
    if (isCompanyLocked) {
      const filtered = companies.filter(c => isMatchingCompany(c, activeCompanyId!))
      if (filtered.length > 0) return filtered
      return [{
        id: activeCompanyId!,
        name: activeCompanyId === "tech" ? "SAAMPARK TECHNOLOGY" : activeCompanyId!,
        brand_name: "SAAMPARK",
        division_name: "TECHNOLOGY",
        logo: "💻"
      }]
    }
    return companies
  }, [companies, isCompanyLocked, activeCompanyId])

  // Role options strictly enforced:
  // Super Admin can create Super Admin, Admin, Teams, Clients.
  // Regular Admin can ONLY create Teams (Team Member) and Clients.
  const availableRoleOptions = React.useMemo(() => {
    if (isCurrentSuperAdmin) {
      return [
        { id: "Teams" as UserRole, label: "Team Member", desc: "Staff & Employee", icon: "👥", color: "blue", activeBorder: "border-blue-500/80 shadow-blue-500/25", glow: "from-blue-500/20 to-transparent" },
        { id: "Clients" as UserRole, label: "Client Account", desc: "Portal Customer", icon: "💼", color: "amber", activeBorder: "border-amber-500/80 shadow-amber-500/25", glow: "from-amber-500/20 to-transparent" },
        { id: "Admin" as UserRole, label: "Branch / Co. Admin", desc: "Operational Manager", icon: "🛡️", color: "indigo", activeBorder: "border-indigo-500/80 shadow-indigo-500/25", glow: "from-indigo-500/20 to-transparent" },
        { id: "Super Admin" as UserRole, label: "Super Admin", desc: "Full Master Access", icon: "👑", color: "purple", activeBorder: "border-purple-500/80 shadow-purple-500/25", glow: "from-purple-500/20 to-transparent" },
      ]
    }
    // Admin can ONLY add team members and client accounts
    return [
      { id: "Teams" as UserRole, label: "Team Member", desc: "Staff & Employee", icon: "👥", color: "blue", activeBorder: "border-blue-500/80 shadow-blue-500/25", glow: "from-blue-500/20 to-transparent" },
      { id: "Clients" as UserRole, label: "Client Account", desc: "Portal Customer", icon: "💼", color: "amber", activeBorder: "border-amber-500/80 shadow-amber-500/25", glow: "from-amber-500/20 to-transparent" },
    ]
  }, [isCurrentSuperAdmin])

  // Available branches for the chosen company
  const availableBranches = React.useMemo(() => {
    if (!branches || branches.length === 0) return []
    if (selectedCompanyId === "all") return branches
    return branches.filter((b) => isMatchingCompany(targetCompanyObj, b.companyId || (b as any).company_id))
  }, [branches, targetCompanyObj, selectedCompanyId])

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
      let initRole: UserRole = editingUser.role || "Teams"
      if (isRootSuperAdminEmail(editingUser.email)) {
        initRole = "Super Admin"
      } else if (!isCurrentSuperAdmin && (initRole === "Super Admin" || initRole === "Admin")) {
        initRole = "Teams"
      }
      setRole(initRole)
      
      const initComp = isCompanyLocked ? (availableCompanies[0]?.id || activeCompanyId!) : (editingUser.companyId || "tech")
      setSelectedCompanyId(initComp)

      const userBranch = editingUser.branchId || (editingUser as any).branch_id || (editingUser.branchIds && editingUser.branchIds[0])
      if (userBranch) {
        setScopeType("branch")
        setSelectedBranchId(String(userBranch))
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
      const defaultRole: UserRole = (!isCurrentSuperAdmin && (initialRole === "Super Admin" || initialRole === "Admin")) ? "Teams" : (initialRole || "Teams")
      setRole(defaultRole)
      
      const defaultComp = isCompanyLocked ? (availableCompanies[0]?.id || activeCompanyId!) : "tech"
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
  }, [isOpen, editingUser, initialRole, isCompanyLocked, availableCompanies, activeCompanyId, activeBranchId, getMatrixForRole, fetchCompanies, fetchBranches, userActionPermissions])

  // Handle Role change & apply default permission presets
  const handleRoleSelect = (newRole: UserRole) => {
    if (isEditingRootSuperAdmin) return
    if (!isCurrentSuperAdmin && (newRole === "Super Admin" || newRole === "Admin")) return
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
    const finalRoleToSave: UserRole = (isEditingRootSuperAdmin || isRootSuperAdminEmail(email)) ? "Super Admin" : role
    const isAllCompanies = selectedCompanyId === "all" || finalRoleToSave === "Super Admin"
    const canonCompId = isAllCompanies ? "all" : (targetCompanyObj?.id || targetCompanyObj?.slug || selectedCompanyId || "tech")
    const allCompIds = companies && companies.length > 0 ? companies.map(c => c.id || c.slug).filter(Boolean) as string[] : ["tech", "digital", "saampark-ai-solutions"]
    const companyIds = isAllCompanies ? allCompIds : [canonCompId]
    const companyNameToSave = isAllCompanies ? "SAAMPARK Group (All Companies)" : getCompanyFullName(targetCompanyObj)

    const effectiveBranchId = scopeType === "branch" ? (selectedBranchId || activeBranchId || undefined) : undefined
    const matchedBranch = effectiveBranchId ? branches.find(b => String(b.id) === String(effectiveBranchId) || b.name.toLowerCase() === String(effectiveBranchId).toLowerCase()) : undefined
    const branchNameToSave = matchedBranch?.name || (effectiveBranchId ? (isNaN(Number(effectiveBranchId)) ? effectiveBranchId : `Branch (${effectiveBranchId})`) : undefined)

    const userData: Partial<UserType> = {
      ...(editingUser ? { id: editingUser.id } : {}),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: finalRoleToSave,
      companyId: canonCompId,
      companyIds,
      companyName: companyNameToSave,
      branchId: effectiveBranchId || undefined,
      branchIds: effectiveBranchId ? [effectiveBranchId] : undefined,
      branchName: branchNameToSave || undefined,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 dark:bg-black/80 backdrop-blur-xl overflow-y-auto" style={{ perspective: "1400px" }}>
        {/* Subtle Ambient Background Light */}
        <div className={`fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b ${roleGlowMap[role] || roleGlowMap.Teams} blur-[120px] pointer-events-none opacity-30 dark:opacity-70`} />

        {/* 3D Elevated Main Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotateX: 6, y: 30 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, rotateX: -6, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl my-auto rounded-[32px] overflow-hidden flex flex-col max-h-[92vh] border border-slate-200/90 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.25)] bg-white/95 dark:bg-[#0f1422]/95 backdrop-blur-2xl text-slate-900 dark:text-slate-100"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Top Gloss Highlight Bevel */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/25 dark:via-white/40 to-transparent z-30" />

          {/* 3D Header */}
          <div className="relative flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] backdrop-blur-xl sticky top-0 z-20 shadow-xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            {/* Title & Badge */}
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border ${
                role === "Super Admin" ? "bg-purple-50 dark:bg-gradient-to-br dark:from-purple-500/30 dark:to-pink-600/30 border-purple-200 dark:border-purple-400/40 text-purple-700 dark:text-purple-300" :
                role === "Admin" ? "bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-500/30 dark:to-blue-600/30 border-indigo-200 dark:border-indigo-400/40 text-indigo-700 dark:text-indigo-300" :
                role === "Clients" ? "bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/30 dark:to-orange-600/30 border-amber-200 dark:border-amber-400/40 text-amber-700 dark:text-amber-300" :
                "bg-blue-50 dark:bg-gradient-to-br dark:from-blue-500/30 dark:to-cyan-600/30 border-blue-200 dark:border-blue-400/40 text-blue-700 dark:text-blue-300"
              }`}>
                {role === "Super Admin" ? "👑" : role === "Admin" ? "🛡️" : role === "Clients" ? "💼" : "👥"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 drop-shadow-xs">
                    {editingUser ? "Edit User Account" : "Create New User"}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider border shadow-xs ${
                    role === "Super Admin" ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/40" :
                    role === "Admin" ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40" :
                    role === "Clients" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40" :
                    "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/40"
                  }`}>
                    {role}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                    <span>{isTechCompany ? "💻" : "🏢"}</span>
                    <span>{companyDisplayName}</span>
                  </span>
                  <span>•</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {scopeType === "branch" && selectedBranchId ? "📍 Dedicated Branch Scope" : "🏢 Company-Wide Scope"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3D Segmented Control Tab Switcher & Close */}
            <div className="flex items-center gap-3">
              {/* Tactile Sunken 3D Switcher */}
              <div className="flex p-1.5 bg-slate-100 dark:bg-[#090d16]/80 rounded-2xl border border-slate-200 dark:border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)]">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "profile" 
                      ? "bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] -translate-y-0.5" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/[0.04]"
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
                      ? "bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] -translate-y-0.5" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/[0.04]"
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
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shadow-2xs active:translate-y-0.5 transition-all cursor-pointer"
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
              <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs dark:shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
                <div className="flex items-center justify-between mb-3.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Crown size={14} className="text-amber-500" />
                    <span>Step 1: Select Account Role *</span>
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isCurrentSuperAdmin ? "Super Admin can assign any role including Super Admin" : "Admins can add Team Members and Clients"}
                  </span>
                </div>

                {isEditingRootSuperAdmin && (
                  <div className="p-3.5 mb-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2.5">
                    <Crown size={16} className="text-amber-500 shrink-0" />
                    <span>🛡️ Primary Root Super Admin (saampark.official) — This master account is permanently Super Admin and its role cannot be modified.</span>
                  </div>
                )}

                <div className={`grid gap-3 ${availableRoleOptions.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
                  {availableRoleOptions.map((r) => {
                    const isSelected = role === r.id
                    const isLocked = isEditingRootSuperAdmin && r.id !== "Super Admin"
                    return (
                      <button
                        key={r.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          if (isEditingRootSuperAdmin) return
                          handleRoleSelect(r.id)
                        }}
                        className={`group relative p-4 rounded-2xl text-left flex flex-col justify-between transition-all duration-200 ${isLocked ? "opacity-35 cursor-not-allowed" : "cursor-pointer"} border ${
                          isSelected
                            ? `bg-gradient-to-b ${r.glow} ${r.activeBorder} shadow-[0_10px_20px_-4px_rgba(59,130,246,0.25)] dark:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] -translate-y-1 ring-2 ring-blue-500/40 dark:ring-white/20`
                            : "bg-white hover:bg-slate-50 dark:bg-[#111726]/60 dark:hover:bg-[#151c2e]/80 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 shadow-xs dark:shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-3xl filter drop-shadow-xs group-hover:scale-110 transition-transform">
                            {r.icon}
                          </span>
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xs">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-white/20" />
                          )}
                        </div>
                        <div>
                          <div className={`font-black text-xs ${isSelected ? "text-blue-700 dark:text-white font-black" : "text-slate-800 dark:text-slate-200"}`}>{r.label}</div>
                          <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">{r.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              {/* STEP 2: 3D CORE PROFILE DETAILS */}
              <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs dark:shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <User size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>Step 2: Basic Identity & Credentials</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Credentials will be emailed automatically</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#090d16]/90 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-xs dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
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
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#090d16]/90 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-xs dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#090d16]/90 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-xs dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Password & Generator */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Login Password *</span>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
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
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#090d16]/90 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-xs dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: 3D COMPANY & BRANCH SCOPE */}
              <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs dark:shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Building size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>Step 3: Company & Branch Scope Isolation</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Strict regional access boundaries</span>
                </div>

                {/* 3D Scope Selection Tiles */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Access Boundary Level *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setScopeType("company")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                        scopeType === "company"
                          ? "bg-blue-50 dark:bg-gradient-to-b dark:from-blue-500/20 dark:to-transparent border-blue-500 shadow-sm dark:shadow-[0_8px_20px_rgba(59,130,246,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] -translate-y-0.5"
                          : "bg-white hover:bg-slate-50 dark:bg-[#111726]/60 dark:hover:bg-[#151c2e]/80 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-xs dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                      }`}
                    >
                      <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-blue-500 dark:border-blue-400 flex items-center justify-center shrink-0">
                        {scopeType === "company" && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-xs" />}
                      </div>
                      <div>
                        <div className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Globe size={13} className="text-blue-600 dark:text-blue-400" />
                          <span>Company-Wide Scope</span>
                        </div>
                        <p className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          User can access and collaborate across all branches and regional offices in this company.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setScopeType("branch")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                        scopeType === "branch"
                          ? "bg-amber-50 dark:bg-gradient-to-b dark:from-amber-500/20 dark:to-transparent border-amber-500 shadow-sm dark:shadow-[0_8px_20px_rgba(245,158,11,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] -translate-y-0.5"
                          : "bg-white hover:bg-slate-50 dark:bg-[#111726]/60 dark:hover:bg-[#151c2e]/80 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-xs dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                      }`}
                    >
                      <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-amber-500 dark:border-amber-400 flex items-center justify-center shrink-0">
                        {scopeType === "branch" && <div className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400 shadow-xs" />}
                      </div>
                      <div>
                        <div className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <MapPin size={13} className="text-amber-500 dark:text-amber-400" />
                          <span>Dedicated Branch Only</span>
                        </div>
                        <p className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Target Company *</span>
                      {isCompanyLocked && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                          <Lock size={10} /> Locked to active company
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedCompanyId}
                      disabled={isCompanyLocked}
                      onChange={(e) => {
                        setSelectedCompanyId(e.target.value)
                        setSelectedBranchId("")
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#090d16]/90 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-xs dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-bold transition-all disabled:opacity-90 disabled:cursor-not-allowed"
                    >
                      {!isCompanyLocked && isCurrentSuperAdmin && (
                        <option value="all">🌐 SAAMPARK Group (All Companies / Global Scope)</option>
                      )}
                      {availableCompanies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id === "tech" ? "💻" : "🏢"} {getCompanyFullName(c)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>{scopeType === "branch" ? "Assigned Dedicated Branch *" : "Regional Branch (Optional)"}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        {availableBranches.length} branch{availableBranches.length === 1 ? "" : "es"}
                      </span>
                    </label>
                    {availableBranches.length > 0 ? (
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        required={scopeType === "branch"}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#090d16]/90 border text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-xs dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all ${
                          scopeType === "branch" && !selectedBranchId ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : "border-slate-300 dark:border-white/15"
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
                      <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#090d16]/50 border border-dashed border-slate-300 dark:border-white/15 text-xs text-slate-500 dark:text-slate-400 italic flex items-center gap-1.5">
                        <Info size={13} className="text-amber-500 dark:text-amber-400 shrink-0" />
                        <span>No branches configured for this company.</span>
                      </div>
                    )}
                  </div>

                  {/* Role Specific: Teams (Department, Designation, Commission %) */}
                  {role === "Teams" && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Department
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Sales & Marketing, Engineering, Support"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#090d16]/90 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-xs dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium mb-2 transition-all"
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
                                  : "bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              {dept}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Designation / Job Title
                        </label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Senior Branch Executive"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#090d16]/90 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-xs dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                          <Percent size={12} className="text-amber-500 dark:text-amber-400" />
                          <span>Invoice Commission Rate</span>
                        </label>
                        <input
                          type="text"
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(e.target.value)}
                          placeholder="e.g. 5% or ₹1,500/task"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#090d16]/90 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-xs dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                        />
                      </div>
                    </>
                  )}

                  {/* KYC Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      KYC Verification Status
                    </label>
                    <select
                      value={kycStatus}
                      onChange={(e) => setKycStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#090d16]/90 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-xs dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
                    >
                      <option value="Pending">⏳ Pending Verification</option>
                      <option value="Processing">🔄 In Processing</option>
                      <option value="Verified">✅ Verified Account</option>
                      <option value="Rejected">❌ Rejected / Incomplete</option>
                    </select>
                  </div>

                  {/* Account Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Account Status
                    </label>
                    <div className="flex items-center gap-3 h-10">
                      {(["Active", "Inactive", "Pending"] as UserStatus[]).map((st) => (
                        <label key={st} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                          <input
                            type="radio"
                            name="accountStatus"
                            checked={status === st}
                            onChange={() => setStatus(st)}
                            className="text-blue-600 focus:ring-blue-500"
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
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs dark:shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>3D Quick Presets:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {role === "Clients" ? (
                    <button
                      type="button"
                      onClick={() => applyPreset("clientPortal")}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500/15 dark:bg-gradient-to-b dark:from-amber-500/25 dark:to-amber-600/25 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 shadow-xs hover:bg-amber-500/25 active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      💼 Standard Client Portal
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => applyPreset("salesCRM")}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-500/15 dark:bg-gradient-to-b dark:from-blue-500/25 dark:to-blue-600/25 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40 shadow-xs hover:bg-blue-500/25 active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        🎯 Sales & CRM
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("finance")}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500/15 dark:bg-gradient-to-b dark:from-emerald-500/25 dark:to-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 shadow-xs hover:bg-emerald-500/25 active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        📊 Accounts & Finance
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("full")}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-purple-500/15 dark:bg-gradient-to-b dark:from-purple-500/25 dark:to-pink-600/25 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 shadow-xs hover:bg-purple-500/25 active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        🌟 Full Master Access
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("viewOnly")}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 shadow-xs hover:bg-slate-200 dark:hover:bg-white/[0.08] active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        👁️ View Only All
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => applyPreset("revoke")}
                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-500/15 dark:bg-gradient-to-b dark:from-rose-500/20 dark:to-rose-600/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 shadow-xs hover:bg-rose-500/25 active:translate-y-0.5 transition-all cursor-pointer"
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
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#090d16]/90 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] shadow-xs dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] outline-hidden font-medium transition-all"
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
                    <div key={cat.name} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111726]/60 shadow-xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] overflow-hidden">
                      {/* Category Header */}
                      <div 
                        onClick={() => setCollapsedCategories(prev => ({ ...prev, [cat.name]: !prev[cat.name] }))}
                        className="px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] flex items-center justify-between cursor-pointer transition-colors border-b border-slate-200 dark:border-white/5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl filter drop-shadow-xs">{cat.icon}</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white">{cat.name}</span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 font-extrabold border border-blue-200 dark:border-blue-500/30 shadow-2xs">
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
                            className="text-[10.5px] px-2.5 py-1 rounded-lg font-bold text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 border border-blue-200 dark:border-blue-500/20 transition-all cursor-pointer"
                          >
                            Toggle Suite
                          </button>
                          {isCollapsed ? <ChevronRight size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                        </div>
                      </div>

                      {/* 3D Module Action Chips */}
                      {!isCollapsed && (
                        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 dark:bg-transparent">
                          {filteredModules.map((m) => {
                            const flags = actionMatrix[m] || { view: false, add: false, edit: false, delete: false }
                            const isAnyActive = flags.view || flags.add || flags.edit || flags.delete

                            return (
                              <div
                                key={m}
                                className={`p-3.5 rounded-xl border transition-all duration-200 ${
                                  isAnyActive 
                                    ? "bg-blue-50/60 dark:bg-[#141b2e]/90 border-blue-400/60 dark:border-blue-500/40 shadow-xs dark:shadow-[0_4px_12px_rgba(59,130,246,0.15)]" 
                                    : "bg-white dark:bg-[#0c101a]/60 border-slate-200 dark:border-white/5 opacity-80 hover:opacity-100"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2.5">
                                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">{m}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextState = !flags.view
                                      handleCheckboxChange(m, "view", nextState)
                                      handleCheckboxChange(m, "add", nextState)
                                      handleCheckboxChange(m, "edit", nextState)
                                      handleCheckboxChange(m, "delete", nextState)
                                    }}
                                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-extrabold cursor-pointer"
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
                                        ? "bg-emerald-600 dark:bg-gradient-to-b dark:from-emerald-500 dark:to-emerald-600 text-white border-emerald-500 shadow-xs" 
                                        : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300 hover:text-slate-900 dark:hover:text-white",
                                      blue: isChecked 
                                        ? "bg-blue-600 dark:bg-gradient-to-b dark:from-blue-500 dark:to-blue-600 text-white border-blue-500 shadow-xs" 
                                        : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300 hover:text-slate-900 dark:hover:text-white",
                                      amber: isChecked 
                                        ? "bg-amber-500 dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 text-white border-amber-400 shadow-xs" 
                                        : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300 hover:text-slate-900 dark:hover:text-white",
                                      rose: isChecked 
                                        ? "bg-rose-600 dark:bg-gradient-to-b dark:from-rose-500 dark:to-rose-600 text-white border-rose-500 shadow-xs" 
                                        : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300 hover:text-slate-900 dark:hover:text-white",
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
            <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-white/10 sticky bottom-0 bg-white/95 dark:bg-[#0f1422]/95 backdrop-blur-xl z-20 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white shadow-xs active:translate-y-0.5 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                {activeTab === "profile" ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("permissions")}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] border border-slate-300 dark:border-white/20 text-xs font-black text-slate-800 dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:translate-y-0.5"
                  >
                    <span>Next: Configure Modules</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] border border-slate-300 dark:border-white/20 text-xs font-black text-slate-800 dark:text-white transition-all cursor-pointer shadow-xs active:translate-y-0.5"
                  >
                    Back to Profile
                  </button>
                )}

                <Button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-b from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-xs shadow-[0_8px_25px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer border border-blue-400/40"
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
