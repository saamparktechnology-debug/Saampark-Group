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

// Mock notifications
const MOCK_NOTIFICATIONS = [
  { id: 1, text: "Sara Ann updated task #1245", time: "2 min ago", unread: true },
  { id: 2, text: "New ticket from Acme Corp", time: "15 min ago", unread: true },
  { id: 3, text: "Meeting with John Smith starts in 30 min", time: "30 min ago", unread: false },
]

export function Topbar() {
  const { theme, setTheme } = useTheme()
  const { isSidebarCollapsed, toggleSidebar, openModal } = useUIStore()
  const { user, activeCompanyId, switchCompany, logout } = useAuthStore()
  
  const [showProfileMenu, setShowProfileMenu] = React.useState(false)
  const [showQuickAdd, setShowQuickAdd] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)

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

  if (!user) return null

  const activeCompany = COMPANIES.find(c => c.id === activeCompanyId)

  return (
    <header
      style={{ left: isSidebarCollapsed ? 64 : 256 }}
      className="fixed top-0 right-0 h-16 glass-panel border-b border-border/50 flex items-center justify-between px-6 z-30 transition-[left] duration-300 ease-in-out"
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

        {user.role !== 'Client' && (
          <Button
            variant="ghost" size="icon"
            onClick={(e) => { stop(e); openModal("isTodoModalOpen") }}
            className="text-muted-foreground hover:text-primary"
            title="Quick To-Do"
          >
            <CheckSquare size={20} />
          </Button>
        )}

        {/* These are NAVIGATION shortcuts — each linked to correct route */}
        {user.role !== 'Client' && (
          <>
            <Link href="/feature/dashboard" onClick={stop}>
              <Button variant="secondary" className="w-full justify-start" leftIcon={<Monitor size={16} />}>Dashboard</Button>
            </Link>
            <Link href="/feature/events" onClick={stop}>
              <Button variant="secondary" className="w-full justify-start" leftIcon={<Calendar size={16} />}>Events</Button>
            </Link>
            <Link href="/feature/clients" onClick={stop}>
              <Button variant="secondary" className="w-full justify-start" leftIcon={<Briefcase size={16} />}>Clients</Button>
            </Link>
            <Link href="/feature/subscriptions" onClick={stop}>
              <Button variant="secondary" className="w-full justify-start" leftIcon={<CreditCard size={16} />}>Subscriptions</Button>
            </Link>
            <Link href="/feature/projects" onClick={stop}>
              <Button variant="secondary" className="w-full justify-start" leftIcon={<Command size={16} />}>Projects</Button>
            </Link>
            <Link href="/feature/tasks" onClick={stop}>
              <Button variant="secondary" className="w-full justify-start" leftIcon={<CheckCircle size={16} />}>Tasks</Button>
            </Link>
            <Link href="/feature/leads" onClick={stop}>
              <Button variant="secondary" className="w-full justify-start" leftIcon={<Briefcase size={16} />}>Leads</Button>
            </Link>
          </>
        )}

        {/* Display Current Company Badge for Super Admin/Admin */}
        {activeCompany && (
          <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1 bg-surface-pressed border border-border rounded-full text-xs font-medium text-muted-foreground">
            <span className="text-sm">{activeCompany.logo}</span>
            <span>{activeCompany.name}</span>
          </div>
        )}
      </div>

      {/* ── RIGHT: Actions + Profile ────────────────────────────────────── */}
      <div className="flex items-center gap-1" onClick={stop}>

        {/* Search */}
        {user.role !== 'Client' && (
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
        {['Super Admin', 'Admin', 'Manager'].includes(user.role) && (
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
                      className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
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
        {user.role !== 'Client' && (
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
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
              {MOCK_NOTIFICATIONS.filter(n => n.unread).length}
            </span>
          </Button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.13 }}
                className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border shadow-lg rounded-xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="font-semibold text-sm">Notifications</p>
                  <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                </div>
                {MOCK_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-border/50 flex items-start gap-3 hover:bg-surface-hover cursor-pointer ${n.unread ? 'bg-primary/5' : ''}`}>
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-primary' : 'bg-transparent'}`} />
                    <div>
                      <p className="text-sm">{n.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2 text-center">
                  <button className="text-xs text-primary hover:underline">Mark all as read</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messages link */}
        <Link href="/messages" onClick={stop}>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Messages">
            <Mail size={20} />
          </Button>
        </Link>

        <div className="h-6 w-[1px] bg-border mx-2" />

        {/* Profile dropdown */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => { setShowProfileMenu(v => !v); setShowQuickAdd(false); setShowNotifications(false) }}
            className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-surface-hover/50 transition-colors pr-3 select-none"
          >
            <div className="w-8 h-8 rounded-full bg-border overflow-hidden shrink-0">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover bg-surface" />
            </div>
            <span className="text-sm text-foreground/80 hidden sm:block">{user.name}</span>
          </motion.div>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.13 }}
                className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border shadow-lg rounded-xl overflow-hidden z-50 flex flex-col max-h-[80vh]"
              >
                <div className="px-4 py-3 border-b border-border/50 shrink-0">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                    {user.role}
                  </div>
                </div>

                <div className="py-1 shrink-0">
                  <Link href="/settings">
                    <button onClick={() => setShowProfileMenu(false)} className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground flex items-center gap-2.5 transition-colors">
                      <User size={14} /> My Profile
                    </button>
                  </Link>
                  <button
                    onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setShowProfileMenu(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground flex items-center gap-2.5 transition-colors"
                  >
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>
                  {['Super Admin', 'Admin'].includes(user.role) && (
                    <Link href="/settings">
                      <button onClick={() => setShowProfileMenu(false)} className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground flex items-center gap-2.5 transition-colors">
                        <Settings size={14} /> Settings
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
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                            activeCompanyId === comp.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                          }`}
                        >
                          <span className="text-lg">{comp.logo}</span>
                          <span className="truncate">{comp.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-border/50 py-1 shrink-0 mt-auto">
                  <button 
                    onClick={() => { logout(); setShowProfileMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger/10 flex items-center gap-2.5 transition-colors"
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
