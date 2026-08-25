"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, CheckSquare, LayoutGrid, Briefcase, Monitor, Calendar, Command, CheckCircle, Check,
  Search, Plus, Clock, Bell, Mail,
  Settings, LogOut, User, Sun, Moon, X, Building2, CreditCard
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

import { Button } from "../ui/Button"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore, COMPANIES } from "@/store/useAuthStore"
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
    switchCompany, 
    switchBranch, 
    logout, 
    companies, 
    branches, 
    fetchCompanies, 
    fetchBranches 
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
    fetchCompanies()
    fetchBranches()
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
          const freshCompanyIds = dbRecord.companyIds && dbRecord.companyIds.length > 0
            ? dbRecord.companyIds
            : [dbRecord.companyId || "tech"]

          // If current active company is not in the assigned companies list, auto-switch to primary company
          const currentActive = useAuthStore.getState().activeCompanyId
          const nextActive = freshCompanyIds.includes(currentActive || "")
            ? currentActive
            : freshCompanyIds[0]

          let freshPerms = dbRecord.permissions
          if (typeof freshPerms === "string") {
            try { freshPerms = JSON.parse(freshPerms) } catch {}
          }

          const freshAllowedMods = dbRecord.allowedModules || (freshPerms && Array.isArray(freshPerms.allowedModules) ? freshPerms.allowedModules : undefined)

          // Update usePermissionStore in real-time
          if (freshAllowedMods) {
            usePermissionStore.getState().setUserPermissions(String(dbRecord.id), freshAllowedMods)
            usePermissionStore.getState().setUserPermissions(myEmailNorm, freshAllowedMods)
          }
          if (freshPerms?.actionMatrix) {
            usePermissionStore.getState().setUserAllModuleActions(String(dbRecord.id), freshPerms.actionMatrix)
            usePermissionStore.getState().setUserAllModuleActions(myEmailNorm, freshPerms.actionMatrix)
          }

          useAuthStore.setState({
            user: {
              ...user,
              name: dbRecord.name,
              role: dbRecord.role,
              companyId: nextActive || "tech",
              companyIds: freshCompanyIds,
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
    return () => {
      window.removeEventListener("focus", syncUserSession)
      window.removeEventListener("storage", syncUserSession)
    }
  }, [user?.email])

  React.useEffect(() => {
    if (!user) return
    const loadNotifs = () => {
      try {
        const notifKey = `saampark_notifications_${(user.email || '').toLowerCase().trim()}`
        const raw = localStorage.getItem(notifKey)
        if (raw) {
          setNotifications(JSON.parse(raw))
        } else {
          setNotifications([])
        }
      } catch {
        setNotifications([])
      }
    }
    loadNotifs()
    const interval = setInterval(loadNotifs, 3000)
    return () => clearInterval(interval)
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
      const cId = String(c.id).toLowerCase().trim()
      const cSlug = String(c.slug || '').toLowerCase().trim()
      return userCompIds.some(id => {
        const norm = String(id).toLowerCase().trim()
        return norm === cId || norm === cSlug
      })
    })
  }, [user.companyIds, user.companyId, user.role, companies])

  const activeCompany = companies.find(c => c.id === activeCompanyId || c.slug === activeCompanyId) || allowedCompanies[0] || companies[0]

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
              {allowedCompanies.length > 1 ? (
                <button
                  type="button"
                  onClick={(e) => { stop(e); setShowCompanyMenu(v => !v); setShowProfileMenu(false); setShowQuickAdd(false); setShowNotifications(false) }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-pressed border border-primary/30 hover:border-primary/60 rounded-full text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                  title="Click to switch active company workspace"
                >
                  <span className="text-sm">{activeCompany.logo || "🏢"}</span>
                  <span className="truncate max-w-[140px] sm:max-w-[180px]">{activeCompany.name}</span>
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">Switch ▾</span>
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-pressed border border-border rounded-full text-xs font-medium text-muted-foreground">
                  <span className="text-sm">{activeCompany.logo || "🏢"}</span>
                  <span className="truncate max-w-[160px]">{activeCompany.name}</span>
                </div>
              )}

              {/* Active Branch Badge */}
              {activeBranchId && (
                <div className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <span>📍</span>
                  <span className="truncate max-w-[120px]">
                    {branches.find(b => b.id === activeBranchId)?.name || 'Branch'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { stop(e); switchBranch(null) }}
                    className="hover:text-rose-500 ml-0.5 cursor-pointer"
                    title="Clear branch filter (view all branches)"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Company & Branch Dropdown Menu */}
            <AnimatePresence>
              {showCompanyMenu && allowedCompanies.length > 1 && (
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
                      const isActive = activeCompanyId === comp.id || activeCompanyId === comp.slug
                      const compBranches = branches.filter(b => b.companyId === comp.id || b.companyId === comp.slug)

                      return (
                        <div key={comp.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => { switchCompany(comp.id); switchBranch(null); setShowCompanyMenu(false) }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all cursor-pointer ${
                              isActive
                                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="text-base">{comp.logo || "🏢"}</span>
                              <span className="truncate">{comp.name}</span>
                            </div>
                            {isActive && <Check size={14} className="shrink-0" />}
                          </button>

                          {/* Sub-branches for this company */}
                          {isActive && compBranches.length > 0 && (
                            <div className="pl-6 pr-2 py-1 space-y-1 border-l-2 border-primary/20 ml-4 my-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Sub-Branches
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
                              {compBranches.map(b => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => { switchBranch(b.id); setShowCompanyMenu(false) }}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                                    activeBranchId === b.id
                                      ? "bg-primary/10 text-primary font-bold"
                                      : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                                  }`}
                                >
                                  <span className="truncate">📍 {b.name}</span>
                                  {activeBranchId === b.id && <Check size={12} className="shrink-0" />}
                                </button>
                              ))}
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
                className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-surface border border-border shadow-xl rounded-2xl overflow-hidden z-50 max-h-[85vh] flex flex-col"
              >
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <span className="font-semibold text-sm">Notifications</span>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                    {notifications.filter(n => !n.read).length} New
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-border/40 max-h-80">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No new notifications.
                    </div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div key={n.id || idx} className={`px-4 py-3 flex items-start gap-3 hover:bg-surface-hover cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}>
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                        <div>
                          <p className="text-sm font-medium">{n.title || n.text}</p>
                          {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{n.timestamp || n.time || "Just now"}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-2 text-center border-t border-border/50 bg-surface">
                    <button 
                      onClick={() => {
                        if (user) {
                          const notifKey = `saampark_notifications_${(user.email || '').toLowerCase().trim()}`
                          const marked = notifications.map(n => ({ ...n, read: true }))
                          setNotifications(marked)
                          try { localStorage.setItem(notifKey, JSON.stringify(marked)) } catch {}
                        }
                      }}
                      className="text-xs text-primary hover:underline font-semibold cursor-pointer"
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
              <img src={user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} alt={user.name} className="w-full h-full object-cover bg-surface" />
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
                      {allowedCompanies.map(comp => (
                        <button
                          key={comp.id}
                          onClick={() => { switchCompany(comp.id); setShowProfileMenu(false) }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                            activeCompanyId === comp.id || activeCompanyId === comp.slug ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="text-base">{comp.logo || "🏢"}</span>
                            <span className="truncate">{comp.name}</span>
                          </div>
                          {(activeCompanyId === comp.id || activeCompanyId === comp.slug) && <Check size={12} />}
                        </button>
                      ))}
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
