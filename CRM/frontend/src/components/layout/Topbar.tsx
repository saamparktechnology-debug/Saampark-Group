"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, CheckSquare, LayoutGrid, Briefcase, Monitor, Calendar, Command, CheckCircle, Check,
  Search, Plus, Clock, Bell, Mail,
  Settings, LogOut, User, Sun, Moon, X, Building2, GitBranch, CreditCard, MapPin, ChevronRight, ChevronDown
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

import { Button } from "../ui/Button"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore, COMPANIES, getCompanyLogoUrl, getCompanyFullName, isMatchingCompany, getUserEntityScope } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

export function Topbar() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { isSidebarCollapsed, toggleSidebar, openModal } = useUIStore()
  const { 
    user, 
    activeCompanyId, 
    activeBranchId, 
    activeSubBranchId,
    switchCompany, 
    switchBranch, 
    switchSubBranch,
    logout, 
    companies, 
    branches, 
    subBranches,
    fetchCompanies, 
    fetchBranches,
    fetchSubBranches 
  } = useAuthStore()

  // Real-time synchronization of company and branch from URL path
  React.useEffect(() => {
    if (!pathname || pathname === "/" || pathname.startsWith("/login")) return

    const segments = pathname.split("/").filter(Boolean)
    const featureIdx = segments.indexOf("feature")

    if (featureIdx > 0) {
      const urlCompSlug = segments[0]?.toLowerCase().trim()
      let detectedCompId = ""
      if (urlCompSlug.includes("consult")) {
        detectedCompId = "consultancy"
      } else if (urlCompSlug.includes("tech") || urlCompSlug.includes("research")) {
        detectedCompId = "tech"
      } else if (urlCompSlug === "all") {
        detectedCompId = "all"
      }

      if (detectedCompId && detectedCompId !== activeCompanyId) {
        switchCompany(detectedCompId)
      }

      if (featureIdx >= 2) {
        const urlBranchSlug = segments[1]?.toLowerCase().trim()
        const matchedBranch = branches.find(b => 
          b.name.toLowerCase().replace(/\s+/g, "-") === urlBranchSlug ||
          b.name.toLowerCase() === urlBranchSlug ||
          String(b.code || "").toLowerCase() === urlBranchSlug ||
          String(b.id).toLowerCase() === urlBranchSlug
        )
        if (matchedBranch && matchedBranch.id !== activeBranchId) {
          switchBranch(matchedBranch.id)
        }
      } else if (featureIdx === 1) {
        // Direct company view without branch: /saampark-technology/feature/dashboard
        if (activeBranchId !== null) {
          switchBranch(null)
        }
      }
    }
  }, [pathname, branches, activeCompanyId, activeBranchId, switchCompany, switchBranch])

  const handleSelectCompany = (c: any) => {
    setShowCompanyMenu(false)
    setShowBranchMenu(false)
    setShowSubBranchMenu(false)
    const featurePath = pathname && pathname.includes("/feature/")
      ? pathname.substring(pathname.indexOf("/feature/"))
      : "/feature/dashboard"

    if (!c || c === "all") {
      switchCompany("all")
      switchBranch(null)
      switchSubBranch(null)
      router.push(featurePath)
      return
    }

    const cId = c.id || c.slug
    switchCompany(cId)
    switchBranch(null)
    switchSubBranch(null)

    const cSlug = String(c.slug || cId).toLowerCase().includes("consult") ? "saampark-consultancy" : "saampark-technology"
    router.push(`/${cSlug}${featurePath}`)
  }

  const handleSelectBranch = (b: any) => {
    setShowBranchMenu(false)
    setShowSubBranchMenu(false)
    const featurePath = pathname && pathname.includes("/feature/")
      ? pathname.substring(pathname.indexOf("/feature/"))
      : "/feature/dashboard"

    const cSlug = String(activeCompanyId || "saampark-technology").toLowerCase().includes("consult") ? "saampark-consultancy" : "saampark-technology"

    if (!b) {
      switchBranch(null)
      switchSubBranch(null)
      router.push(`/${cSlug}${featurePath}`)
      return
    }

    switchBranch(b.id)
    switchSubBranch(null)
    const bSlug = b.code?.toLowerCase() || b.name.toLowerCase().replace(/\s+/g, "-")
    router.push(`/${cSlug}/${bSlug}${featurePath}`)
  }

  const [showProfileMenu, setShowProfileMenu] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [showCompanyMenu, setShowCompanyMenu] = React.useState(false)
  const [showBranchMenu, setShowBranchMenu] = React.useState(false)
  const [showSubBranchMenu, setShowSubBranchMenu] = React.useState(false)
  const [notifications, setNotifications] = React.useState<any[]>([])

  // DOM element refs for robust outside-click detection
  const companyMenuRef = React.useRef<HTMLDivElement>(null)
  const branchMenuRef = React.useRef<HTMLDivElement>(null)
  const subBranchMenuRef = React.useRef<HTMLDivElement>(null)
  const profileMenuRef = React.useRef<HTMLDivElement>(null)
  const notifRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleSync = () => {
      fetchCompanies()
      fetchBranches()
      fetchSubBranches().catch(() => {})
    }

    handleSync()
    window.addEventListener("focus", handleSync)
    window.addEventListener("storage", handleSync)
    window.addEventListener("saampark_data_synced", handleSync)
    window.addEventListener("saampark_company_switched", handleSync)
    window.addEventListener("saampark_company_updated", handleSync)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") handleSync()
    })

    return () => {
      window.removeEventListener("focus", handleSync)
      window.removeEventListener("storage", handleSync)
      window.removeEventListener("saampark_data_synced", handleSync)
      window.removeEventListener("saampark_company_switched", handleSync)
      window.removeEventListener("saampark_company_updated", handleSync)
    }
  }, [fetchCompanies, fetchBranches])

  // Real-time synchronization of current user session with latest database record
  React.useEffect(() => {
    if (!user || !user.email) return

    const syncUserSession = async () => {
      try {
        const { getStoredUserAccountsAsync } = await import("@/app/feature/users/services/userService")
        const { usePermissionStore } = await import("@/store/usePermissionStore")
        
        const accounts = await getStoredUserAccountsAsync()
        const myEmailNorm = user.email.toLowerCase().trim()
        const dbRecord = accounts.find((a) => a.email.toLowerCase().trim() === myEmailNorm)

        if (dbRecord) {
          const isSuperUser = user.role === "Super Admin"
          
          let rawCompIds = dbRecord.companyIds || (dbRecord as any).company_ids || user.companyIds
          let freshCompanyIds: string[] = []
          if (typeof rawCompIds === 'string') {
            try { freshCompanyIds = JSON.parse(rawCompIds) } catch { freshCompanyIds = [rawCompIds] }
          } else if (Array.isArray(rawCompIds)) {
            freshCompanyIds = rawCompIds
          }
          if (freshCompanyIds.length === 0) {
            freshCompanyIds = [dbRecord.companyId || (dbRecord as any).company_id || "tech"]
          }

          // Super Admin and Admin can switch between all companies
          const isSuperOrAdmin = isSuperUser || user.role === "Admin"
          const currentActive = useAuthStore.getState().activeCompanyId
          const isAllowedActive = isSuperOrAdmin || freshCompanyIds.some(id => isMatchingCompany({ id, slug: id } as any, currentActive || ""))
          const nextActive = isSuperOrAdmin
            ? (currentActive || (isSuperUser ? "all" : freshCompanyIds[0] || "tech"))
            : (isAllowedActive && currentActive ? currentActive : freshCompanyIds[0])

          const finalCompanyIds = isSuperOrAdmin
            ? Array.from(new Set([...freshCompanyIds, currentActive || "all", ...companies.map(c => c.id), ...companies.map(c => c.slug || "")].filter(Boolean)))
            : freshCompanyIds

          let rawBranchIds = dbRecord.branchIds || (dbRecord as any).branch_ids || user.branchIds
          let freshBranchIds: string[] = []
          if (typeof rawBranchIds === 'string') {
            try { freshBranchIds = JSON.parse(rawBranchIds) } catch { freshBranchIds = [rawBranchIds] }
          } else if (Array.isArray(rawBranchIds)) {
            freshBranchIds = rawBranchIds
          }
          if (freshBranchIds.length === 0 && dbRecord.branchId) {
            freshBranchIds = [dbRecord.branchId]
          }

          let freshPerms = dbRecord.permissions
          if (typeof freshPerms === "string") {
            try { freshPerms = JSON.parse(freshPerms) } catch {}
          }

          const freshAllowedMods = isSuperUser ? undefined : (dbRecord.allowedModules || (freshPerms && Array.isArray(freshPerms.allowedModules) ? freshPerms.allowedModules : undefined))

          // Update usePermissionStore in real-time
          if (freshAllowedMods) {
            usePermissionStore.getState().setUserPermissions(String(dbRecord.id), freshAllowedMods)
            usePermissionStore.getState().setUserPermissions(myEmailNorm, freshAllowedMods)
          }
          if (freshPerms?.actionMatrix) {
            usePermissionStore.getState().setUserAllModuleActions(String(dbRecord.id), freshPerms.actionMatrix)
            usePermissionStore.getState().setUserAllModuleActions(myEmailNorm, freshPerms.actionMatrix)
          }

          const freshAvatar = dbRecord.avatarUrl || (dbRecord as any).avatar || (user as any).avatarUrl || user.avatar
          const latestUser = useAuthStore.getState().user || user
          const resolvedKycStatus = dbRecord.kycStatus || (dbRecord as any).kyc_status || latestUser?.kycStatus || "Pending"
          const resolvedKycData = dbRecord.kycData || (dbRecord as any).kyc_data || latestUser?.kycData

          useAuthStore.setState({
            user: {
              ...latestUser,
              name: dbRecord.name || user.name,
              role: user.role,
              avatar: freshAvatar,
              avatarUrl: freshAvatar,
              companyId: nextActive || "tech",
              companyIds: finalCompanyIds,
              branchId: dbRecord.branchId,
              branchIds: freshBranchIds.length > 0 ? freshBranchIds : undefined,
              branchName: dbRecord.branchName,
              department: dbRecord.department,
              phone: dbRecord.phone,
              allowedModules: freshAllowedMods,
              permissions: freshPerms,
              kycStatus: resolvedKycStatus,
              kycData: resolvedKycData,
            },
            activeCompanyId: nextActive || (isSuperUser ? "all" : "tech"),
          })
        }
      } catch (err) {
        console.warn("Session sync warning:", err)
      }
    }

    syncUserSession()
    window.addEventListener("focus", syncUserSession)
    window.addEventListener("storage", syncUserSession)
    window.addEventListener("saampark_data_synced", syncUserSession)
    window.addEventListener("crm_avatar_changed", syncUserSession)
    return () => {
      window.removeEventListener("focus", syncUserSession)
      window.removeEventListener("storage", syncUserSession)
      window.removeEventListener("saampark_data_synced", syncUserSession)
      window.removeEventListener("crm_avatar_changed", syncUserSession)
    }
  }, [user?.email])

  React.useEffect(() => {
    if (!user) return
    const loadNotifs = async () => {
      try {
        const { getUserNotifications } = await import("@/services/notificationService")
        const list = await getUserNotifications(user.email, user.role)
        setNotifications(list || [])
      } catch {
        setNotifications([])
      }
    }
    loadNotifs()
    window.addEventListener("saampark_notifications_updated", loadNotifs)
    window.addEventListener("storage", loadNotifs)
    const interval = setInterval(loadNotifs, 5000)
    return () => {
      clearInterval(interval)
      window.removeEventListener("saampark_notifications_updated", loadNotifs)
      window.removeEventListener("storage", loadNotifs)
    }
  }, [user])

  // Robust outside click and touch handling using ref containment
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (!target) return

      if (companyMenuRef.current && !companyMenuRef.current.contains(target)) {
        setShowCompanyMenu(false)
      }
      if (branchMenuRef.current && !branchMenuRef.current.contains(target)) {
        setShowBranchMenu(false)
      }
      if (subBranchMenuRef.current && !subBranchMenuRef.current.contains(target)) {
        setShowSubBranchMenu(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [])

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (!user) return null

  // Resolve hierarchical user entity scope (Company -> Branch -> Sub-Branch)
  const userScope = React.useMemo(() => {
    return getUserEntityScope(user, companies, branches, subBranches)
  }, [user, companies, branches, subBranches])

  // Companies this specific user has access to
  const allowedCompanies = React.useMemo(() => {
    if (userScope.isSuperAdmin) return companies
    return companies.filter(c => userScope.allowedCompanyIds.some(id => isMatchingCompany(c, id)))
  }, [userScope, companies])

  // Branches this specific user has access to
  const allowedBranches = React.useMemo(() => {
    const validBranches = (branches || []).filter(b => Boolean(b && b.id))
    if (userScope.isSuperAdmin) return validBranches
    return validBranches.filter(b => userScope.allowedBranchIds.some(id => String(id).toLowerCase().trim() === String(b.id).toLowerCase().trim()))
  }, [userScope, branches])

  // Sub-Branches this specific user has access to
  const allowedSubBranches = React.useMemo(() => {
    const validSubs = (subBranches || []).filter(sb => Boolean(sb && sb.id))
    if (userScope.isSuperAdmin || userScope.scopeLevel === 'company' || userScope.scopeLevel === 'global') return validSubs
    return validSubs.filter(sb => userScope.allowedSubBranchIds.some(id => String(id).toLowerCase().trim() === String(sb.id).toLowerCase().trim()))
  }, [userScope, subBranches])

  const isSuperAdmin = user.role === 'Super Admin'
  const isGroupLevel = !activeCompanyId || activeCompanyId === 'all' || activeCompanyId === 'group' || activeCompanyId === 'saampark-group'
  const isAllCompanies = isGroupLevel

  const activeCompany = isGroupLevel ? null : (
    companies.find(c => isMatchingCompany(c, activeCompanyId)) ||
    companies.find(c => isMatchingCompany(c, user.companyId)) ||
    allowedCompanies[0] ||
    companies[0]
  )

  const activeCompanyName = isGroupLevel ? "SAAMPARK GROUP" : (activeCompany ? getCompanyFullName(activeCompany) : "SAAMPARK GROUP")
  const activeCompanyLogo = isGroupLevel ? null : (activeCompany ? getCompanyLogoUrl(activeCompany) : null)
  const activeBranch = isGroupLevel ? null : branches.find(b => b.id === activeBranchId)
  const activeSubBranch = isGroupLevel ? null : subBranches.find(sb => sb.id === activeSubBranchId)
  const activeEntityLogo = activeSubBranch?.logo_url || activeBranch?.logo_url || activeCompanyLogo

  const canSwitchEntities = userScope.isSuperAdmin || (userScope.scopeLevel !== 'subbranch' && (allowedCompanies.length > 1 || allowedBranches.length > 1 || allowedSubBranches.length > 0))

  // Branches belonging strictly to currently active company scope
  // If at SAAMPARK Group level, branches are strictly empty (hidden from Topbar)
  const companyBranches = React.useMemo(() => {
    if (isGroupLevel) {
      return []
    }
    return allowedBranches.filter(b => {
      const bCompId = b.companyId || (b as any).company_id
      return isMatchingCompany({ id: bCompId, slug: bCompId } as any, activeCompanyId)
    })
  }, [isGroupLevel, allowedBranches, activeCompanyId])

  // Sub-branches belonging strictly to currently active branch scope
  // If at SAAMPARK Group level or no specific branch is selected, sub-branches are strictly empty (hidden from Topbar)
  const availableSubBranches = React.useMemo(() => {
    if (isGroupLevel || !activeBranchId || activeBranchId === 'all') {
      return []
    }
    const validSubs = allowedSubBranches || []
    const targetNorm = String(activeBranchId).toLowerCase().trim()
    const bId = activeBranch ? String(activeBranch.id).toLowerCase().trim() : ""
    const bSlug = activeBranch ? String(activeBranch.slug || activeBranch.name).toLowerCase().trim() : ""

    return validSubs.filter(sb => {
      const pId = String(sb.parentBranchId || (sb as any).branch_id || (sb as any).branchId || "").toLowerCase().trim()
      const pName = String((sb as any).branchName || (sb as any).branch_name || "").toLowerCase().trim()
      return pId === targetNorm || pName === targetNorm || (bId && (pId === bId || pName === bId)) || (bSlug && (pId === bSlug || pName === bSlug))
    })
  }, [isGroupLevel, allowedSubBranches, activeBranchId, activeBranch])

  // Automatic clean state synchronization across entity hierarchy
  React.useEffect(() => {
    if (isGroupLevel) {
      if (activeBranchId !== null) switchBranch(null)
      if (activeSubBranchId !== null) switchSubBranch(null)
    } else {
      if (companyBranches.length === 0) {
        if (activeBranchId !== null) switchBranch(null)
        if (activeSubBranchId !== null) switchSubBranch(null)
      } else if (activeBranchId) {
        const branchMatches = companyBranches.some(b => String(b.id).toLowerCase().trim() === String(activeBranchId).toLowerCase().trim())
        if (!branchMatches) {
          switchBranch(null)
          switchSubBranch(null)
        }
      }
    }
  }, [isGroupLevel, activeCompanyId, companyBranches.length, activeBranchId, activeSubBranchId, switchBranch, switchSubBranch])

  // Clean sub-branch state synchronization
  React.useEffect(() => {
    if (activeSubBranchId) {
      if (availableSubBranches.length === 0) {
        switchSubBranch(null)
      } else {
        const subMatches = availableSubBranches.some(sb => String(sb.id).toLowerCase().trim() === String(activeSubBranchId).toLowerCase().trim())
        if (!subMatches) {
          switchSubBranch(null)
        }
      }
    }
  }, [availableSubBranches, activeSubBranchId, switchSubBranch])

  return (
    <>
      {/* Mobile Dimmed Backdrop Overlay */}
      {(showCompanyMenu || showBranchMenu || showSubBranchMenu || showNotifications || showProfileMenu) && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[9990] sm:hidden"
          onClick={() => {
            setShowCompanyMenu(false)
            setShowBranchMenu(false)
            setShowSubBranchMenu(false)
            setShowNotifications(false)
            setShowProfileMenu(false)
          }}
        />
      )}

      <header
        style={{ left: isMobile ? 0 : (isSidebarCollapsed ? 64 : 256) }}
        className="fixed top-0 right-0 h-16 glass-panel border-b border-border/50 flex items-center justify-between px-2 sm:px-6 z-40 transition-[left] duration-300 ease-in-out bg-surface/90 backdrop-blur-md overflow-visible"
      >
        {/* ── LEFT: Hamburger + Current Company View & Workspace Switcher ── */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 overflow-visible">
          <Button
            variant="ghost" size="icon"
            onClick={(e) => { stop(e); toggleSidebar() }}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0 cursor-pointer h-9 w-9 p-0"
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </Button>

          {/* Hierarchical Entity Selectors in Top Navbar: Company Tab, Branch Tab, Sub-Branch Tab */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto sm:overflow-visible scrollbar-hide py-1 max-w-[calc(100vw-130px)] sm:max-w-none">
            {/* 1. Company Tab */}
            <div className="relative shrink-0" ref={companyMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCompanyMenu(prev => !prev)
                  setShowBranchMenu(false)
                  setShowSubBranchMenu(false)
                  setShowNotifications(false)
                  setShowProfileMenu(false)
                }}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-xs text-slate-900 dark:text-white transition-all group cursor-pointer max-w-[140px] xs:max-w-[190px] sm:max-w-[320px] md:max-w-[460px]"
                title={`Active Company: ${activeCompanyName}`}
              >
                {isAllCompanies ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                    <Building2 size={12} className="sm:hidden" />
                    <Building2 size={13} className="hidden sm:block" />
                  </div>
                ) : activeCompanyLogo ? (
                  <img
                    src={activeCompanyLogo}
                    alt={activeCompanyName}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-md object-contain shrink-0 bg-white dark:bg-zinc-900 p-0.5 border border-slate-200 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                    <Building2 size={12} className="sm:hidden" />
                    <Building2 size={13} className="hidden sm:block" />
                  </div>
                )}
                
                <div className="text-left truncate min-w-0 flex-1">
                  <span className="truncate font-bold text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight block whitespace-pre">
                    {isAllCompanies ? "SAAMPARK GROUP (ALL)" : activeCompanyName}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block truncate leading-tight font-medium">
                    {isAllCompanies
                      ? "All Companies"
                      : (activeSubBranch
                        ? `${activeBranch?.name || 'Branch'} • ${activeSubBranch.name}`
                        : (activeBranch
                          ? activeBranch.name
                          : (companyBranches.length > 0 ? "HQ (All Branches)" : "Corporate Headquarters")))}
                  </span>
                </div>
                <ChevronDown size={12} className="text-slate-400 shrink-0 ml-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
              </button>

              {/* Company Dropdown Menu (Fixed across mobile screen, absolute below button on desktop) */}
              <AnimatePresence>
                {showCompanyMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="fixed top-16 left-2 right-2 sm:absolute sm:top-full sm:left-0 sm:right-auto mt-1 sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-1rem)] rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl z-[9999] overflow-hidden flex flex-col max-h-[80vh]"
                  >
                    <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">Select Company</p>
                        <p className="text-[10px] text-muted-foreground">Switch between registered company entities</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowCompanyMenu(false) }}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="p-2 space-y-1.5 max-h-[340px] overflow-y-auto">
                      {/* Super Admin: All Companies Option */}
                      {isSuperAdmin && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectCompany('all')
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isAllCompanies
                              ? 'bg-blue-600/10 border-blue-500/40 text-blue-700 dark:text-blue-300'
                              : 'border-transparent hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-600 flex items-center justify-center shrink-0">
                              <Building2 size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-bold leading-tight">SAAMPARK GROUP (ALL)</p>
                              <p className="text-[10px] text-muted-foreground">Consolidated Enterprise View</p>
                            </div>
                          </div>
                          {isAllCompanies && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white">Active</span>
                          )}
                        </div>
                      )}

                      {allowedCompanies.map((c) => {
                        const isActive = !isAllCompanies && isMatchingCompany(c, activeCompany?.id || activeCompanyId)
                        const cName = getCompanyFullName(c)
                        const cLogo = getCompanyLogoUrl(c)
                        return (
                          <div
                            key={c.id || c.slug}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectCompany(c)
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isActive
                                ? 'bg-blue-600/10 border-blue-500/40 text-blue-700 dark:text-blue-300'
                                : 'border-transparent hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {cLogo ? (
                                <img src={cLogo} alt={cName} className="w-7 h-7 rounded-lg object-contain shrink-0 bg-white dark:bg-zinc-800 p-0.5 border border-border" />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-600 flex items-center justify-center shrink-0">
                                  <Building2 size={14} />
                                </div>
                              )}
                              <div className="truncate">
                                <p className="text-xs font-bold leading-tight truncate">{cName}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{c.city ? `${c.city}, ` : ''}{c.state || 'India'}</p>
                              </div>
                            </div>
                            {isActive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white shrink-0 ml-2">Active</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="p-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
                      <Link
                        href="/feature/companies"
                        onClick={(e) => { e.stopPropagation(); setShowCompanyMenu(false) }}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <span>Manage Companies →</span>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowCompanyMenu(false) }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-surface-hover hover:bg-muted rounded-lg text-foreground cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Branch Tab (Beside Company Tab, visible if company branches exist) */}
            {companyBranches.length > 0 && (
              <div className="relative shrink-0" ref={branchMenuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowBranchMenu(prev => !prev)
                    setShowCompanyMenu(false)
                    setShowSubBranchMenu(false)
                    setShowNotifications(false)
                    setShowProfileMenu(false)
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border transition-all group cursor-pointer max-w-[100px] xs:max-w-[130px] sm:max-w-[220px] ${
                    activeBranch
                      ? 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300'
                      : 'border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-800 dark:text-zinc-200'
                  }`}
                  title={activeBranch ? `Active Branch: ${activeBranch.name}` : "Branch selection"}
                >
                  {activeBranch?.logo_url ? (
                    <img
                      src={activeBranch.logo_url}
                      alt={activeBranch.name}
                      className="w-4 h-4 rounded-md object-contain shrink-0 bg-white dark:bg-zinc-900 p-0.5 border border-slate-200 dark:border-zinc-700"
                    />
                  ) : (
                    <GitBranch size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                  <span className="truncate font-semibold text-[11px] sm:text-xs leading-tight">
                    {activeBranch ? activeBranch.name : "Branches"}
                  </span>
                  <ChevronDown size={11} className="text-slate-400 shrink-0 ml-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
                </button>

                {/* Branch Dropdown Menu */}
                <AnimatePresence>
                  {showBranchMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      onClick={(e) => e.stopPropagation()}
                      className="fixed top-16 left-2 right-2 sm:absolute sm:top-full sm:left-0 sm:right-auto mt-1 sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-1rem)] rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl z-[9999] overflow-hidden flex flex-col max-h-[80vh]"
                    >
                      <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-foreground">Select Branch</p>
                          <p className="text-[10px] text-muted-foreground">{activeCompanyName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setShowBranchMenu(false) }}
                          className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                        {/* All Branches / Company HQ Option */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectBranch(null)
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                            !activeBranch
                              ? 'bg-blue-600/10 border-blue-500/40 text-blue-700 dark:text-blue-300'
                              : 'border-transparent hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 size={14} className="text-blue-600 shrink-0" />
                            <div>
                              <p className="text-xs font-bold leading-tight">Company HQ (All Branches)</p>
                              <p className="text-[10px] text-muted-foreground">Corporate Headquarters view</p>
                            </div>
                          </div>
                          {!activeBranch && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white">Active</span>
                          )}
                        </div>

                        {companyBranches.map((b) => {
                          const isBranchActive = activeBranch?.id === b.id
                          return (
                            <div
                              key={b.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectBranch(b)
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                                isBranchActive
                                  ? 'bg-blue-600/10 border-blue-500/40 text-blue-700 dark:text-blue-300'
                                  : 'border-transparent hover:bg-muted/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {b.logo_url ? (
                                  <img src={b.logo_url} alt={b.name} className="w-6 h-6 rounded-lg object-contain shrink-0 bg-white dark:bg-zinc-800 p-0.5 border border-border" />
                                ) : (
                                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                                    <GitBranch size={13} />
                                  </div>
                                )}
                                <div className="truncate">
                                  <p className="text-xs font-bold leading-tight truncate">{b.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{b.code ? `${b.code} • ` : ''}{b.city || 'Branch'}</p>
                                </div>
                              </div>
                              {isBranchActive && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white shrink-0 ml-2">Active</span>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      <div className="p-2 border-t border-border bg-muted/20 flex items-center justify-between">
                        <Link
                          href="/feature/companies"
                          onClick={(e) => { e.stopPropagation(); setShowBranchMenu(false) }}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          Manage Branches →
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setShowBranchMenu(false) }}
                          className="px-2 py-0.5 text-[11px] font-semibold bg-surface-hover hover:bg-muted rounded-md text-foreground cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 3. Sub-Branch Tab (Beside Branch Tab, visible if sub-branches exist) */}
            {availableSubBranches.length > 0 && (
              <div className="relative shrink-0" ref={subBranchMenuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSubBranchMenu(prev => !prev)
                    setShowCompanyMenu(false)
                    setShowBranchMenu(false)
                    setShowNotifications(false)
                    setShowProfileMenu(false)
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border transition-all group cursor-pointer max-w-[100px] xs:max-w-[130px] sm:max-w-[220px] ${
                    activeSubBranch
                      ? 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-300'
                      : 'border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-800 dark:text-zinc-200'
                  }`}
                  title={activeSubBranch ? `Active Sub-Branch: ${activeSubBranch.name}` : "Sub-Branch selection"}
                >
                  {activeSubBranch?.logo_url ? (
                    <img
                      src={activeSubBranch.logo_url}
                      alt={activeSubBranch.name}
                      className="w-4 h-4 rounded-md object-contain shrink-0 bg-white dark:bg-zinc-900 p-0.5 border border-slate-200 dark:border-zinc-700"
                    />
                  ) : (
                    <span className="text-xs shrink-0">🤝</span>
                  )}
                  <span className="truncate font-semibold text-[11px] sm:text-xs leading-tight">
                    {activeSubBranch ? activeSubBranch.name : "Sub-Branches"}
                  </span>
                  <ChevronDown size={11} className="text-slate-400 shrink-0 ml-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
                </button>

                {/* Sub-Branch Dropdown Menu */}
                <AnimatePresence>
                  {showSubBranchMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      onClick={(e) => e.stopPropagation()}
                      className="fixed top-16 left-2 right-2 sm:absolute sm:top-full sm:left-0 sm:right-auto mt-1 sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-1rem)] rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl z-[9999] overflow-hidden flex flex-col max-h-[80vh]"
                    >
                      <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-foreground">Select Sub-Branch</p>
                          <p className="text-[10px] text-muted-foreground">{activeBranch?.name || activeCompanyName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setShowSubBranchMenu(false) }}
                          className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                        {/* All Sub-Branches / Branch HQ Option */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            switchSubBranch(null)
                            setShowSubBranchMenu(false)
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                            !activeSubBranch
                              ? 'bg-purple-600/10 border-purple-500/40 text-purple-700 dark:text-purple-300'
                              : 'border-transparent hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 size={14} className="text-purple-600 shrink-0" />
                            <div>
                              <p className="text-xs font-bold leading-tight">Branch HQ (All Sub-Branches)</p>
                              <p className="text-[10px] text-muted-foreground">Main branch operation</p>
                            </div>
                          </div>
                          {!activeSubBranch && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-600 text-white">Active</span>
                          )}
                        </div>

                        {availableSubBranches.map((sb) => {
                          const isSubActive = activeSubBranch?.id === sb.id
                          return (
                            <div
                              key={sb.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                switchSubBranch(sb.id)
                                setShowSubBranchMenu(false)
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                                isSubActive
                                  ? 'bg-purple-600/10 border-purple-500/40 text-purple-700 dark:text-purple-300'
                                  : 'border-transparent hover:bg-muted/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {sb.logo_url ? (
                                  <img src={sb.logo_url} alt={sb.name} className="w-6 h-6 rounded-lg object-contain shrink-0 bg-white dark:bg-zinc-800 p-0.5 border border-border" />
                                ) : (
                                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-600 flex items-center justify-center shrink-0 text-xs font-bold">
                                    🤝
                                  </div>
                                )}
                                <div className="truncate">
                                  <p className="text-xs font-bold leading-tight truncate">{sb.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{sb.partnerType || "Franchise Partner"}{sb.city ? ` • ${sb.city}` : ''}</p>
                                </div>
                              </div>
                              {isSubActive && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-600 text-white shrink-0 ml-2">Active</span>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      <div className="p-2 border-t border-border bg-muted/20 flex items-center justify-between">
                        <Link
                          href="/feature/companies"
                          onClick={(e) => { e.stopPropagation(); setShowSubBranchMenu(false) }}
                          className="text-[11px] font-bold text-purple-600 hover:underline"
                        >
                          Manage Sub-Branches →
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setShowSubBranchMenu(false) }}
                          className="px-2 py-0.5 text-[11px] font-semibold bg-surface-hover hover:bg-muted rounded-md text-foreground cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Actions + Profile ── */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Search icon button - no box */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              openModal("isGlobalSearchOpen")
            }}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer h-8 w-8 sm:h-9 sm:w-9 p-0"
            title="Search (Ctrl + K)"
          >
            <Search size={18} />
          </Button>

          {/* Notifications */}
          <div className="relative shrink-0" ref={notifRef}>
            <Button
              variant="ghost" size="icon"
              onClick={(e) => {
                e.stopPropagation()
                setShowNotifications(v => !v)
                setShowProfileMenu(false)
                setShowCompanyMenu(false)
                setShowBranchMenu(false)
                setShowSubBranchMenu(false)
              }}
              className="text-muted-foreground hover:text-foreground relative cursor-pointer h-8 w-8 sm:h-9 sm:w-9 p-0"
              title="Notifications"
            >
              <Bell size={18} />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger animate-pulse" />
              )}
            </Button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.13 }}
                  onClick={(e) => e.stopPropagation()}
                  className="fixed top-16 left-2 right-2 sm:absolute sm:top-full sm:left-auto sm:right-0 mt-1 sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-1rem)] bg-surface border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden z-[9999] max-h-[85vh] flex flex-col"
                >
                  <div className="p-4 border-b border-border/50 flex items-center justify-between bg-surface-hover/30">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-primary" />
                      <span className="font-bold text-sm text-foreground">Notifications</span>
                    </div>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                      {notifications.filter(n => !n.read).length} New
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-border/40 max-h-80">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-xs text-muted-foreground space-y-1">
                        <p className="text-2xl">🔔</p>
                        <p className="font-medium">No new notifications</p>
                        <p className="text-[11px] opacity-75">You're all caught up!</p>
                      </div>
                    ) : (
                      notifications.map((n, idx) => (
                        <div
                          key={n.id || idx}
                          onClick={async (e) => {
                            e.stopPropagation()
                            const { markNotificationAsRead } = await import("@/services/notificationService")
                            if (n.id) await markNotificationAsRead(n.id, user?.email)
                            if (n.linkUrl) {
                              setShowNotifications(false)
                              window.location.href = n.linkUrl
                            }
                          }}
                          className={`px-4 py-3 flex items-start gap-3 hover:bg-surface-hover cursor-pointer transition-colors ${
                            !n.read ? 'bg-primary/5' : 'opacity-80'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground leading-snug">{n.title || n.text}</p>
                            {n.message && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                              {n.timestampFormatted || n.timestamp || n.time || "Just now"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-2.5 text-center border-t border-border/50 bg-surface flex items-center justify-center">
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation()
                          const { markAllNotificationsAsRead } = await import("@/services/notificationService")
                          await markAllNotificationsAsRead(user?.email)
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                        }}
                        className="text-xs text-primary hover:underline font-bold cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-5 sm:h-6 w-[1px] bg-border mx-0.5 sm:mx-1" />

          {/* Profile chip matching screenshot */}
          <div className="relative shrink-0" ref={profileMenuRef}>
            <div
              onClick={(e) => {
                e.stopPropagation()
                setShowProfileMenu(v => !v)
                setShowNotifications(false)
                setShowCompanyMenu(false)
                setShowBranchMenu(false)
                setShowSubBranchMenu(false)
              }}
              className="flex items-center gap-2 cursor-pointer p-0.5 sm:p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors select-none"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-700 shadow-xs">
                <img
                  key={(user as any)?.avatarUrl || user?.avatar || user?.name || "topbar_avatar"}
                  src={(user as any).avatarUrl || user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden lg:block text-left leading-tight pr-1">
                <span className="text-xs text-slate-900 dark:text-white font-bold block truncate max-w-[140px]">{user.name}</span>
                <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[140px]">
                  {user.role === "Super Admin" ? "Super Administrator" : user.role}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.13 }}
                  onClick={(e) => e.stopPropagation()}
                  className="fixed top-16 left-2 right-2 sm:absolute sm:top-full sm:left-auto sm:right-0 mt-1 sm:mt-2 w-auto sm:w-64 max-w-[calc(100vw-1rem)] bg-surface border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden z-[9999] flex flex-col max-h-[85vh]"
                >
                <div className="px-4 py-3 border-b border-border/50 shrink-0 bg-surface-pressed/30">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                    {user.role}
                  </div>
                </div>

                <div className="py-1 shrink-0">
                  <Link href="/feature/settings">
                    <button onClick={() => setShowProfileMenu(false)} className="w-full text-left px-4 py-2.5 text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground flex items-center gap-2.5 transition-colors cursor-pointer font-medium">
                      <User size={14} className="text-primary" /> My Complete Profile & Avatar
                    </button>
                  </Link>
                  <button
                    onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setShowProfileMenu(false) }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                  >
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>
                  {['Super Admin', 'Admin'].includes(user.role) && (
                    <Link href="/feature/settings">
                      <button onClick={() => setShowProfileMenu(false)} className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground flex items-center gap-2.5 transition-colors cursor-pointer font-medium">
                        <Settings size={14} /> Settings & Integrations
                      </button>
                    </Link>
                  )}
                </div>

                {/* Company Switcher for Multi-Company Users */}
                {allowedCompanies.length > 1 && (
                  <div className="border-t border-border/50 py-2 shrink-0">
                    <p className="px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Switch Company</p>
                    <div className="max-h-40 overflow-y-auto hide-scrollbar space-y-0.5 px-2">
                      {allowedCompanies.map(comp => {
                        const isCurrentActive = isMatchingCompany(comp, activeCompanyId || activeCompany?.id || activeCompany?.slug)
                        const compFullName = getCompanyFullName(comp)
                        const compLogoUrl = getCompanyLogoUrl(comp)

                        return (
                          <button
                            key={comp.id}
                            onClick={() => { switchCompany(comp.id); setShowProfileMenu(false) }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                              isCurrentActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {compLogoUrl ? (
                                <img src={compLogoUrl} alt={compFullName} className="w-4 h-4 rounded-full object-contain shrink-0" />
                              ) : (
                                <span className="text-sm">{comp.logo || "🏢"}</span>
                              )}
                              <span className="truncate">{compFullName}</span>
                            </div>
                            {isCurrentActive && <Check size={12} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t border-border/50 py-1 shrink-0 mt-auto bg-surface-pressed/20">
                  <button 
                    onClick={() => { logout(); setShowProfileMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-xs text-danger hover:bg-danger/10 flex items-center gap-2.5 transition-colors font-semibold cursor-pointer"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  </>
)
}
