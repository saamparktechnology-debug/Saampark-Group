"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, CheckSquare, LayoutGrid, Briefcase, Monitor, Calendar, Command, CheckCircle,
  Search, Plus, Clock, Bell, Mail,
  Settings, LogOut, User, Sun, Moon, X, Building2, CreditCard
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

import { Button } from "../ui/Button"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore, COMPANIES } from "@/store/useAuthStore"

// Quick-Add Dropdown options
const QUICK_ADD_OPTIONS = [
  { label: "New Client", modal: "isAddClientModalOpen" },
  { label: "New Project", modal: "isAddProjectModalOpen" },
  { label: "New Task", modal: "isAddTaskModalOpen" },
  { label: "New Lead", modal: "isAddLeadModalOpen" },
  { label: "New Ticket", modal: "isAddTicketModalOpen" },
  { label: "New Expense", modal: "isAddExpenseModalOpen" },
]

export function Topbar() {
  const { theme, setTheme } = useTheme()
  const { isSidebarCollapsed, toggleSidebar, openModal } = useUIStore()
  const { user, activeCompanyId, switchCompany, logout } = useAuthStore()
  
  const [showProfileMenu, setShowProfileMenu] = React.useState(false)
  const [showQuickAdd, setShowQuickAdd] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [notifications, setNotifications] = React.useState<any[]>([])

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

  const activeCompany = COMPANIES.find(c => c.id === activeCompanyId)

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

        {/* Display Current Company Badge for Super Admin/Admin */}
        {activeCompany && (
          <div className="hidden xl:flex items-center gap-2 ml-4 px-3 py-1 bg-surface-pressed border border-border rounded-full text-xs font-medium text-muted-foreground">
            <span className="text-sm">{activeCompany.logo}</span>
            <span>{activeCompany.name}</span>
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
              onClick={() => { setShowQuickAdd(v => !v); setShowNotifications(false); setShowProfileMenu(false) }}
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
                  {QUICK_ADD_OPTIONS.map((opt) => (
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
            onClick={() => { setShowNotifications(v => !v); setShowQuickAdd(false); setShowProfileMenu(false) }}
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
            onClick={() => { setShowProfileMenu(v => !v); setShowQuickAdd(false); setShowNotifications(false) }}
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

                {/* Company Switcher for Super Admin */}
                {user.role === 'Super Admin' && (
                  <div className="border-t border-border/50 py-2 shrink-0">
                    <p className="px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Switch Company</p>
                    <div className="max-h-40 overflow-y-auto hide-scrollbar space-y-0.5 px-2">
                      {COMPANIES.map(comp => (
                        <button
                          key={comp.id}
                          onClick={() => { switchCompany(comp.id as any); setShowProfileMenu(false) }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                            activeCompanyId === comp.id ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                          }`}
                        >
                          <span className="text-lg">{comp.logo}</span>
                          <span className="truncate">{comp.name}</span>
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
