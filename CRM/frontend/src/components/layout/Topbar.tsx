"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, CheckSquare, LayoutGrid, Briefcase, Monitor, Calendar, Command, CheckCircle, Check,
  Search, Plus, Clock, Bell, Mail,
  Settings, LogOut, User, Sun, Moon, X, Building2, CreditCard, MapPin
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

import { Button } from "../ui/Button"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore, COMPANIES, getCompanyLogoUrl, getCompanyFullName, isMatchingCompany } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

// Quick-Add Dropdown options with module keys
const QUICK_ADD_OPTIONS = [
  { label: "New Client", modal: "isAddClientModalOpen", module: "Clients" },
  { label: "New Project", modal: "isAddProjectModalOpen", module: "Projects" },
  { label: "New Task", modal: "isAddTaskModalOpen", module: "Tasks" },
  { label: "New Lead", modal: "isAddLeadModalOpen", module: "Leads" },
  { label: "New Ticket", modal: "isAddTicketModalOpen", module: "Tickets" },
  { label: "New Expense", modal: "isAddExpenseModalOpen", module: "Expenses" },
] as const

export function Topbar() {
  const { theme, setTheme } = useTheme()
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
  const { canPerformAction } = usePermissionStore()

  const [showProfileMenu, setShowProfileMenu] = React.useState(false)
  const [showQuickAdd, setShowQuickAdd] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [showCompanyMenu, setShowCompanyMenu] = React.useState(false)
  const [notifications, setNotifications] = React.useState<any[]>([])

  const visibleQuickAddOptions = React.useMemo(() => {
    if (!user) return []
    if (user.role === "Super Admin") return QUICK_ADD_OPTIONS
    return QUICK_ADD_OPTIONS.filter((opt) => canPerformAction(user, opt.module, "add"))
  }, [user, canPerformAction])

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
          const isSuperUser = myEmailNorm === "hiisupriya@gmail.com" || user.role === "Super Admin" || dbRecord.role === "Super Admin"
          const freshCompanyIds = dbRecord.companyIds && dbRecord.companyIds.length > 0
            ? dbRecord.companyIds
            : [dbRecord.companyId || "tech"]

          // If current user is Super Admin, they have access to all companies - do NOT reset active company
          const isSuper = isSuperUser
          const currentActive = useAuthStore.getState().activeCompanyId
          const nextActive = isSuper
            ? (currentActive || freshCompanyIds[0] || "tech")
            : (freshCompanyIds.includes(currentActive || "") ? currentActive : freshCompanyIds[0])

          const finalCompanyIds = isSuper
            ? Array.from(new Set([...freshCompanyIds, currentActive || "tech", ...companies.map(c => c.id), ...companies.map(c => c.slug || "")].filter(Boolean)))
            : freshCompanyIds

          let freshPerms = dbRecord.permissions
          if (typeof freshPerms === "string") {
            try { freshPerms = JSON.parse(freshPerms) } catch {}
          }

          const freshAllowedMods = isSuper ? undefined : (dbRecord.allowedModules || (freshPerms && Array.isArray(freshPerms.allowedModules) ? freshPerms.allowedModules : undefined))

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

          useAuthStore.setState({
            user: {
              ...user,
              name: myEmailNorm === "hiisupriya@gmail.com" ? "Supriya (Super Admin)" : (dbRecord.name || user.name),
              role: isSuper ? "Super Admin" : dbRecord.role,
              avatar: freshAvatar,
              avatarUrl: freshAvatar,
              companyId: nextActive || "tech",
              companyIds: finalCompanyIds,
              branchId: dbRecord.branchId,
              branchIds: dbRecord.branchIds,
              branchName: dbRecord.branchName,
              department: dbRecord.department,
              phone: dbRecord.phone,
              allowedModules: freshAllowedMods,
              permissions: freshPerms,
            },
            activeCompanyId: nextActive || "tech",
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

  // Close all dropdowns on outside click
  React.useEffect(() => {
    const handler = () => {
      setShowProfileMenu(false)
      setShowQuickAdd(false)
      setShowNotifications(false)
      setShowCompanyMenu(false)
    }
    window.addEventListener("click", handler)
    return () => window.removeEventListener("click", handler)
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

  // Companies this specific user has access to
  const allowedCompanies = React.useMemo(() => {
    if (user.role === 'Super Admin') return companies
    const userCompIds = user.companyIds && user.companyIds.length > 0
      ? user.companyIds
      : (user.companyId ? [user.companyId] : ['tech'])
    return companies.filter(c => {
      return userCompIds.some(id => isMatchingCompany(c, id))
    })
  }, [user.companyIds, user.companyId, user.role, companies])

  const activeCompany = companies.find(c => isMatchingCompany(c, activeCompanyId)) ||
    companies.find(c => isMatchingCompany(c, user.companyId)) ||
    allowedCompanies[0] ||
    companies[0]

  const activeCompanyName = getCompanyFullName(activeCompany)

  return (
    <header
      style={{ left: isMobile ? 0 : (isSidebarCollapsed ? 64 : 256) }}
      className="fixed top-0 right-0 h-16 glass-panel border-b border-border/50 flex items-center justify-between px-3 sm:px-6 z-30 transition-[left] duration-300 ease-in-out bg-surface/90 backdrop-blur-md"
    >
      {/* ── LEFT: Hamburger + Nav shortcuts ─────────────────────────────── */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost" size="icon"
          onClick={(e) => { stop(e); toggleSidebar() }}
          className="text-muted-foreground hover:text-primary mr-1"
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </Button>

        {user.role !== 'Clients' && (
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost" size="icon"
              onClick={(e) => { stop(e); openModal("isTodoModalOpen") }}
              className="text-muted-foreground hover:text-primary"
              title="Quick To-Do"
            >
              <CheckSquare size={20} />
            </Button>
            <Link href="/feature/dashboard" onClick={stop}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Dashboard">
                <Monitor size={20} />
              </Button>
            </Link>
            <Link href="/feature/clients" onClick={stop}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Clients">
                <Briefcase size={20} />
              </Button>
            </Link>
            <Link href="/feature/projects" onClick={stop}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Projects">
                <LayoutGrid size={20} />
              </Button>
            </Link>
          </div>
        )}

        {/* Display Current Company Badge & Switcher */}
        {activeCompany && (
          <div className="relative ml-2 sm:ml-4">
            <div className="flex items-center gap-1.5">
              {allowedCompanies.length > 1 || branches.some(b => b.companyId === activeCompany.id || b.companyId === activeCompany.slug) ? (
                <button
                  type="button"
                  onClick={(e) => { stop(e); setShowCompanyMenu(v => !v); setShowProfileMenu(false); setShowQuickAdd(false); setShowNotifications(false) }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-pressed border border-primary/30 hover:border-primary/60 rounded-full text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                  title="Click to switch active company or branch"
                >
                  {getCompanyLogoUrl(activeCompany) ? (
                    <img src={getCompanyLogoUrl(activeCompany)!} alt={activeCompanyName} className="w-5 h-5 rounded-full object-contain shrink-0 bg-white/10" />
                  ) : (
                    <span className="text-sm">{activeCompany.logo || "🏢"}</span>
                  )}
                  <span className="truncate max-w-[160px] sm:max-w-[220px] font-bold">{activeCompanyName}</span>
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">Switch ▾</span>
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-pressed border border-border rounded-full text-xs font-medium text-muted-foreground">
                  {getCompanyLogoUrl(activeCompany) ? (
                    <img src={getCompanyLogoUrl(activeCompany)!} alt={activeCompanyName} className="w-4 h-4 rounded-full object-contain shrink-0 bg-white/10" />
                  ) : (
                    <span className="text-sm">{activeCompany.logo || "🏢"}</span>
                  )}
                  <span className="truncate max-w-[180px] font-bold">{activeCompanyName}</span>
                </div>
              )}

              {/* Active Branch Badge */}
              {activeBranchId && (
                <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
                  <MapPin size={12} className="text-amber-500 shrink-0" />
                  <span className="truncate max-w-[120px]">
                    {branches.find(b => b.id === activeBranchId)?.name || 'Branch'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { stop(e); switchBranch(null) }}
                    className="hover:text-rose-500 ml-0.5 cursor-pointer text-xs leading-none"
                    title="Clear branch filter (view all branches)"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Company & Branch Dropdown Menu */}
            <AnimatePresence>
              {showCompanyMenu && (allowedCompanies.length > 1 || branches.some(b => b.companyId === activeCompany.id || b.companyId === activeCompany.slug)) && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.13 }}
                  className="absolute left-0 top-full mt-2 w-80 bg-surface border border-border shadow-2xl rounded-3xl overflow-hidden z-50 py-2.5"
                >
                  <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                    Select Active Company
                  </p>
                  <div className="space-y-1 px-2 max-h-72 overflow-y-auto">
                    {allowedCompanies.map((comp) => {
                      const isCurrentActive = isMatchingCompany(comp, activeCompanyId || activeCompany?.id || activeCompany?.slug)
                      const compBranches = branches.filter(b => isMatchingCompany(comp, b.companyId))
                      const compLogoUrl = getCompanyLogoUrl(comp)
                      const compFullName = getCompanyFullName(comp)

                      return (
                        <div key={comp.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => { switchCompany(comp.id); switchBranch(null); setShowCompanyMenu(false) }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all cursor-pointer ${
                              isCurrentActive
                                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {compLogoUrl ? (
                                <img src={compLogoUrl} alt={compFullName} className="w-5 h-5 rounded-full object-contain shrink-0 bg-white/20" />
                              ) : (
                                <span className="text-base">{comp.logo || "🏢"}</span>
                              )}
                              <div className="truncate text-left">
                                <span className="block truncate font-bold text-xs">{compFullName}</span>
                                {comp.subtitle && compFullName.toLowerCase() !== comp.subtitle.toLowerCase().trim() && !compFullName.toLowerCase().endsWith(comp.subtitle.toLowerCase().trim()) && (
                                  <span className="block text-[9.5px] opacity-75 truncate">{comp.subtitle}</span>
                                )}
                              </div>
                            </div>
                            {isCurrentActive && <Check size={14} className="shrink-0 ml-2" />}
                          </button>

                          {/* Branches for this company */}
                          {isCurrentActive && compBranches.length > 0 && (
                            <div className="pl-6 pr-2 py-1 space-y-1 border-l-2 border-primary/20 ml-4 my-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Branches
                              </p>
                              <button
                                type="button"
                                onClick={() => { switchBranch(null); setShowCompanyMenu(false) }}
                                className={`w-full text-left px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                                  !activeBranchId
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                                }`}
                              >
                                🏢 All Branches / HQ
                              </button>
                              {compBranches.map(b => {
                                const bSubBranches = (subBranches || []).filter(sb => sb.parentBranchId === b.id)
                                return (
                                  <div key={b.id} className="space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => { switchBranch(b.id); switchSubBranch(null); setShowCompanyMenu(false) }}
                                      className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                                        activeBranchId === b.id && !activeSubBranchId
                                          ? "bg-primary/10 text-primary font-bold"
                                          : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5 truncate">
                                        <MapPin size={12} className="text-primary shrink-0" />
                                        {b.name}
                                      </span>
                                      {activeBranchId === b.id && !activeSubBranchId && <Check size={12} className="shrink-0" />}
                                    </button>

                                    {/* Nested Sub-Branches with % Share Badge */}
                                    {bSubBranches.length > 0 && (
                                      <div className="pl-4 space-y-0.5 border-l border-emerald-500/30 ml-2">
                                        {bSubBranches.map(sb => (
                                          <button
                                            key={sb.id}
                                            type="button"
                                            onClick={() => { 
                                              switchBranch(b.id)
                                              switchSubBranch(sb.id)
                                              setShowCompanyMenu(false) 
                                            }}
                                            className={`w-full flex items-center justify-between px-2 py-0.5 rounded text-[10.5px] transition-colors cursor-pointer ${
                                              activeSubBranchId === sb.id
                                                ? "bg-emerald-500/15 text-emerald-600 font-bold"
                                                : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                                            }`}
                                          >
                                            <span className="flex items-center gap-1 truncate">
                                              <span>🌿</span>
                                              <span className="truncate">{sb.name}</span>
                                              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
                                                ({sb.revenueSharePct}%)
                                              </span>
                                            </span>
                                            {activeSubBranchId === sb.id && <Check size={10} className="text-emerald-600 shrink-0" />}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── RIGHT: Actions + Profile ────────────────────────────────────── */}
      <div className="flex items-center gap-1" onClick={stop}>

        {/* Search */}
        {user.role !== 'Clients' && (
          <Button
            variant="ghost" size="icon"
            onClick={() => openModal("isGlobalSearchOpen")}
            className="text-muted-foreground hover:text-foreground"
            title="Search"
          >
            <Search size={20} />
          </Button>
        )}

        {/* Quick Add dropdown */}
        {['Super Admin', 'Admin', 'Teams'].includes(user.role) && (
          <div className="relative">
            <Button
              variant="ghost" size="icon"
              onClick={() => { setShowQuickAdd(v => !v); setShowNotifications(false); setShowProfileMenu(false); setShowCompanyMenu(false) }}
              className="text-muted-foreground hover:text-foreground"
              title="Quick Add"
            >
              <Plus size={20} />
            </Button>
            <AnimatePresence>
              {showQuickAdd && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.13 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border shadow-lg rounded-xl overflow-hidden z-50 py-1"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 pt-2 pb-1">Quick Add</p>
                  {visibleQuickAddOptions.map((opt) => (
                    <button
                      key={opt.modal}
                      onClick={() => { openModal(opt.modal); setShowQuickAdd(false) }}
                      className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Clock-In Timer */}
        {user.role !== 'Clients' && (
          <Button
            variant="ghost" size="icon"
            onClick={() => openModal("isTimerModalOpen")}
            className="text-muted-foreground hover:text-foreground hidden sm:flex"
            title="Clock In / Timer"
          >
            <Clock size={20} />
          </Button>
        )}

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost" size="icon"
            onClick={() => { setShowNotifications(v => !v); setShowQuickAdd(false); setShowProfileMenu(false); setShowCompanyMenu(false) }}
            className="text-muted-foreground hover:text-foreground relative"
            title="Notifications"
          >
            <Bell size={20} />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger animate-pulse" />
            )}
          </Button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.13 }}
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-border shadow-2xl rounded-3xl overflow-hidden z-50 max-h-[85vh] flex flex-col"
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
                        onClick={async () => {
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
                      onClick={async () => {
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

        {/* Messages link */}
        <Link href="/feature/messages" onClick={stop}>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Messages">
            <Mail size={20} />
          </Button>
        </Link>

        <div className="h-6 w-[1px] bg-border mx-1" />

        {/* Profile dropdown */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => { setShowProfileMenu(v => !v); setShowQuickAdd(false); setShowNotifications(false); setShowCompanyMenu(false) }}
            className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-surface-hover/50 transition-colors pr-2 sm:pr-3 select-none"
          >
            <div className="w-8 h-8 rounded-full bg-border overflow-hidden shrink-0 border border-border">
              <img src={(user as any).avatarUrl || user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} alt={user.name} className="w-full h-full object-cover bg-surface" />
            </div>
            <span className="text-sm text-foreground/80 hidden sm:block font-medium truncate max-w-[120px]">{user.name}</span>
          </motion.div>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.13 }}
                className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-surface border border-border shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col max-h-[85vh]"
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
  )
}
