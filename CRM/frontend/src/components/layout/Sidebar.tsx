"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calendar,
  Mail, 
  Briefcase,
  ShoppingCart,
  File,
  Book,
  Users,
  LifeBuoy,
  Folder,
  Clock,
  Settings,
  LayoutDashboard,
  KanbanSquare,
  CheckSquare,
  Target,
  FileText,
  Calculator,
  HeadphonesIcon,
  MessageSquare,
  CreditCard,
  Receipt,
  UserCheck,
  ChevronDown,
  ShoppingBag,
  X,
  Building2,
  GitBranch,
  MapPin,
  Shield,
  UserPlus,
  Handshake,
  HelpCircle,
  Phone,
  MessageCircle,
  ClipboardList,
  FileOutput,
  FileInput,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Wallet,
  PiggyBank,
  BarChart3,
  Package,
  Tag,
  Award,
  Boxes,
  Warehouse,
    QrCode,
  UserCog,
  GraduationCap,
  BadgeCheck,
  DollarSign,
  FileStack,
  Ticket,
  Bell,
  FileCheck,
  ShieldCheck,
  Zap,
  LogOut
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore, getCompanyLogoUrl, getCompanyFullName, isMatchingCompany } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

export function SaamparkVortexLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <g transform="translate(50,50)">
        {[
          { angle: 0, color: "#2563EB" },
          { angle: 45, color: "#06B6D4" },
          { angle: 90, color: "#10B981" },
          { angle: 135, color: "#84CC16" },
          { angle: 180, color: "#EAB308" },
          { angle: 225, color: "#F97316" },
          { angle: 270, color: "#EF4444" },
          { angle: 315, color: "#8B5CF6" },
        ].map((petal, i) => (
          <path
            key={i}
            d="M 0 -10 C 12 -28, 24 -34, 32 -20 C 38 -8, 28 0, 0 0 Z"
            fill={petal.color}
            transform={`rotate(${petal.angle})`}
            opacity="0.95"
          />
        ))}
        <circle cx="0" cy="0" r="8" fill="#0B132B" stroke="#ffffff" strokeWidth="2" />
      </g>
    </svg>
  )
}

export interface SubNavItem {
  name: string
  href: string
  icon: any
}

export interface NavItem {
  name: string
  href: string
  icon: any
  badge?: number
  subItems?: SubNavItem[]
}

const ALL_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/feature/dashboard", icon: LayoutDashboard },
  {
    name: "Organisation",
    href: "/feature/companies",
    icon: Building2,
    subItems: [
      { name: "Companies", href: "/feature/companies", icon: Building2 },
      { name: "Branches", href: "/feature/branches", icon: GitBranch },
      { name: "Departments", href: "/feature/team/members", icon: Users },
      { name: "Teams", href: "/feature/teams", icon: UserCheck },
    ]
  },
  { name: "Users", href: "/feature/users", icon: Users },
  { name: "Permissions", href: "/feature/permissions", icon: Shield },
  {
    name: "CRM",
    href: "/feature/leads",
    icon: Target,
    subItems: [
      { name: "Leads", href: "/feature/leads", icon: Target },
      { name: "Clients", href: "/feature/clients", icon: Briefcase },
      { name: "Proposals", href: "/feature/proposals", icon: FileOutput },
    ]
  },
  { name: "Projects", href: "/feature/projects", icon: KanbanSquare },
  { name: "Tasks", href: "/feature/tasks", icon: CheckSquare },
  {
    name: "Sales",
    href: "/feature/sales/invoices",
    icon: ShoppingCart,
    subItems: [
      { name: "Quotations", href: "/feature/quotations", icon: FileOutput },
      { name: "Estimates", href: "/feature/estimates", icon: Calculator },
      { name: "Sales Orders", href: "/feature/sales/orders", icon: ShoppingBag },
      { name: "Invoices", href: "/feature/sales/invoices", icon: FileText },
      { name: "Payments", href: "/feature/sales/payments", icon: CreditCard },
      { name: "Credit Notes", href: "/feature/sales/credit-notes", icon: ArrowUpCircle },
      { name: "Debit Notes", href: "/feature/sales/debit-notes", icon: ArrowDownCircle },
      { name: "Services & Store", href: "/feature/sales/store", icon: Package },
    ]
  },
  {
    name: "Subscriptions",
    href: "/feature/subscriptions",
    icon: CreditCard,
    subItems: [
      { name: "Packages & Retainers", href: "/feature/subscriptions", icon: CreditCard },
      { name: "EMI Milestone Plans", href: "/feature/emi", icon: Receipt },
    ]
  },
  {
    name: "HR & Employees",
    href: "/feature/team/members",
    icon: UserCheck,
    subItems: [
      { name: "Team Members", href: "/feature/team/members", icon: UserCheck },
      { name: "Payments & Payroll", href: "/feature/team/payments", icon: DollarSign },
      { name: "Leave Management", href: "/feature/team/leave", icon: Calendar },
      { name: "Attendance & Timecards", href: "/feature/team/timecards", icon: Clock },
    ]
  },
  {
    name: "Support",
    href: "/feature/tickets",
    icon: HeadphonesIcon,
    subItems: [
      { name: "Tickets", href: "/feature/tickets", icon: HeadphonesIcon },
      { name: "Knowledge Base", href: "/feature/knowledge-base", icon: LifeBuoy },
    ]
  },
  { name: "Events", href: "/feature/events", icon: Calendar },
  { name: "Notes", href: "/feature/notes", icon: Book },
  { name: "Messages", href: "/feature/messages", icon: MessageSquare },
  { name: "Files", href: "/feature/files", icon: Folder },
  { name: "Expenses", href: "/feature/expenses", icon: Calculator },
  { name: "Reports", href: "/feature/reports", icon: BarChart3 },
  { name: "Settings", href: "/feature/settings", icon: Settings },
  { name: "Activity Logs", href: "/feature/activity-logs", icon: ClipboardList },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarCollapsed, setSidebarCollapsed } = useUIStore()
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

  React.useEffect(() => {
    fetchCompanies?.().catch(() => {})
    fetchBranches?.().catch(() => {})
    fetchSubBranches?.().catch(() => {})
  }, [fetchCompanies, fetchBranches, fetchSubBranches])

  const allowedCompanies = React.useMemo(() => {
    if (!user) return []
    if (user.role === 'Super Admin') return companies
    let rawCompIds = user.companyIds || (user as any).company_ids
    let userCompIds: string[] = []
    if (typeof rawCompIds === 'string') {
      try { userCompIds = JSON.parse(rawCompIds) } catch { userCompIds = [rawCompIds] }
    } else if (Array.isArray(rawCompIds)) {
      userCompIds = rawCompIds
    }
    if (userCompIds.length === 0) {
      userCompIds = [user.companyId || 'tech']
    }
    return companies.filter(c => userCompIds.some(id => isMatchingCompany(c, id)))
  }, [user, companies])

  const allowedBranches = React.useMemo(() => {
    if (!user) return []
    if (user.role === 'Super Admin') return branches
    let rawBranchIds = user.branchIds || (user as any).branch_ids
    let userBranchIds: string[] = []
    if (typeof rawBranchIds === 'string') {
      try { userBranchIds = JSON.parse(rawBranchIds) } catch { userBranchIds = [rawBranchIds] }
    } else if (Array.isArray(rawBranchIds)) {
      userBranchIds = rawBranchIds
    }
    if (userBranchIds.length === 0 && user.branchId) {
      userBranchIds = [user.branchId]
    }
    if (userBranchIds.length === 0) return branches
    return branches.filter(b => userBranchIds.some(id => String(id).toLowerCase().trim() === String(b.id).toLowerCase().trim()))
  }, [user, branches])

  const isAllCompanies = !activeCompanyId || activeCompanyId === "all"

  const activeCompany = React.useMemo(() => {
    if (isAllCompanies) {
      return null
    }
    return companies.find(c => isMatchingCompany(c, activeCompanyId)) || companies.find(c => isMatchingCompany(c, user?.companyId)) || allowedCompanies[0] || companies[0] || null
  }, [isAllCompanies, activeCompanyId, user?.companyId, companies, allowedCompanies])

  const activeCompanyName = isAllCompanies ? "SAAMPARK GROUP" : (activeCompany ? getCompanyFullName(activeCompany) : "SAAMPARK GROUP")
  const activeCompanyLogo = isAllCompanies ? null : (activeCompany ? getCompanyLogoUrl(activeCompany) : null)
  const { isModuleAllowed, userActionPermissions, userPermissions } = usePermissionStore()

  const [rawCounts, setRawCounts] = React.useState<Record<string, number>>({})
  const [visitedCounts, setVisitedCounts] = React.useState<Record<string, number>>({})

  // Request browser notification permission and run 3-tier automated reminders on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        import("@/lib/notificationService").then(({ requestNotificationPermission }) => {
          requestNotificationPermission().catch(() => {})
        })
      }

      // Run automated 3-tier reminder engine (-3 days, Day 0, +3 days overdue)
      import("@/lib/automatedReminderEngine").then(({ runAutomated3TierReminders }) => {
        runAutomated3TierReminders().catch(() => {})
      })

      const interval = setInterval(() => {
        import("@/lib/automatedReminderEngine").then(({ runAutomated3TierReminders }) => {
          runAutomated3TierReminders().catch(() => {})
        })
      }, 30 * 60 * 1000) // every 30 minutes

      return () => clearInterval(interval)
    }
  }, [])

  const [, setAvatarUpdateTick] = React.useState(0)
  React.useEffect(() => {
    const handleAvatarChange = () => setAvatarUpdateTick(t => t + 1)
    window.addEventListener("crm_avatar_changed", handleAvatarChange)
    window.addEventListener("storage", handleAvatarChange)
    return () => {
      window.removeEventListener("crm_avatar_changed", handleAvatarChange)
      window.removeEventListener("storage", handleAvatarChange)
    }
  }, [])

  // Load dynamic module badges in real time
  const loadDynamicBadges = React.useCallback(async () => {
    if (!user || !user.email) return
    const userEmail = user.email.toLowerCase().trim()
    const targetComp = activeCompanyId || user.companyId || "tech"

    try {
      const { fetchModuleDataFromDB } = await import("@/lib/storageSync")
      
      const [allMessages, allTickets, allTasks, allLeads] = await Promise.all([
        fetchModuleDataFromDB<any[]>("chat_messages", [], targetComp).catch(() => []),
        fetchModuleDataFromDB<any[]>("tickets", [], targetComp).catch(() => []),
        fetchModuleDataFromDB<any[]>("tasks", [], targetComp).catch(() => []),
        fetchModuleDataFromDB<any[]>("leads", [], targetComp).catch(() => []),
      ])

      // 1. Unread messages for this user
      const unreadMessagesCount = Array.isArray(allMessages)
        ? allMessages.filter((m) => m && m.recipientEmail && m.recipientEmail.toLowerCase().trim() === userEmail && !m.read).length
        : 0

      // 2. Open tickets
      const openTicketsCount = Array.isArray(allTickets)
        ? allTickets.filter((t) => t && t.status && t.status !== "Resolved" && t.status !== "Closed").length
        : 0

      // 3. Pending tasks assigned to user
      const pendingTasksCount = Array.isArray(allTasks)
        ? allTasks.filter((t) => {
            if (!t) return false
            const isAssigned = String(t.assignedTo || t.assignedToEmail || "").toLowerCase().includes(userEmail)
            const isOpen = t.status !== "Completed" && t.status !== "Done"
            return isAssigned && isOpen
          }).length
        : 0

      // 4. New leads
      const newLeadsCount = Array.isArray(allLeads)
        ? allLeads.filter((l) => l && (l.status === "New" || (l as any).isNew === true)).length
        : 0

      setRawCounts({
        Messages: unreadMessagesCount,
        Tickets: openTicketsCount,
        Tasks: pendingTasksCount,
        Leads: newLeadsCount,
      })
    } catch {}
  }, [user, activeCompanyId])

  React.useEffect(() => {
    loadDynamicBadges()
    const interval = setInterval(loadDynamicBadges, 30000)
    const handleCompSync = () => {
      loadDynamicBadges()
      fetchCompanies?.().catch(() => {})
    }
    window.addEventListener("storage", handleCompSync)
    window.addEventListener("saampark_data_synced", handleCompSync)
    window.addEventListener("saampark_company_switched", handleCompSync)
    window.addEventListener("saampark_company_updated", handleCompSync)
    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleCompSync)
      window.removeEventListener("saampark_data_synced", handleCompSync)
      window.removeEventListener("saampark_company_switched", handleCompSync)
      window.removeEventListener("saampark_company_updated", handleCompSync)
    }
  }, [loadDynamicBadges, fetchCompanies])

  // Load visited counts from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("saampark_visited_badge_counts")
      if (stored) setVisitedCounts(JSON.parse(stored))
    } catch {}
  }, [])

  // Auto clear badges on visit
  React.useEffect(() => {
    const activeItem = ALL_NAV_ITEMS.find(i => pathname === i.href || pathname.startsWith(i.href + '/'))
    if (activeItem) {
      const currentRaw = rawCounts[activeItem.name] !== undefined ? rawCounts[activeItem.name] : (activeItem.badge || 0)
      setVisitedCounts((prev) => {
        if (prev[activeItem.name] === currentRaw) return prev
        const updated = { ...prev, [activeItem.name]: currentRaw }
        try {
          localStorage.setItem("saampark_visited_badge_counts", JSON.stringify(updated))
        } catch {}
        return updated
      })
    }
  }, [pathname, rawCounts])

  // Precise mapping between sidebar navigation item titles and CRM module keys
  const NAV_TO_MODULE_MAP: Record<string, string> = {
    "Dashboard": "Dashboard",
    "Organisation": "Companies",
    "Companies": "Companies",
    "Branches": "Branches",
    "Departments": "Departments",
    "Teams": "Teams",
    "Users": "Users",
    "Permissions": "Permissions",
    "CRM": "Leads",
    "Leads": "Leads",
    "Clients": "Clients",
    "Proposals": "Proposals",
    "Projects": "Projects",
    "Tasks": "Tasks",
    "Sales": "Invoices",
    "Quotations": "Quotations",
    "Estimates": "Estimates",
    "Sales Orders": "Sales Orders",
    "Invoices": "Invoices",
    "Payments": "Payments",
    "Credit Notes": "Credit Notes",
    "Debit Notes": "Debit Notes",
    "Services & Store": "Services & Store",
    "Subscriptions": "Subscriptions",
    "Packages & Retainers": "Subscriptions",
    "EMI Milestone Plans": "EMI",
    "EMI": "EMI",
    "HR & Employees": "Teams",
    "Team Members": "Teams",
    "Payments & Payroll": "Payroll",
    "Leave Management": "Leave",
    "Attendance & Timecards": "Attendance",
    "Support": "Tickets",
    "Tickets": "Tickets",
    "Knowledge Base": "Knowledge base",
    "Files": "Files",
    "Expenses": "Expenses",
    "Reports": "Reports",
    "Settings": "Settings",
    "Activity Logs": "Activity Logs",
  }

  // Check permission for any nav or sub-nav item strictly and individually
  const checkNavAllowed = React.useCallback((u: any, name: string): boolean => {
    if (!u) return false
    if (name === "Dashboard") return true
    if (name === "Activity Logs") {
      return u.role === "Super Admin" || u.role === "Admin"
    }
    if (u.role === "Super Admin") return true

    const targetModule = NAV_TO_MODULE_MAP[name] || name
    return isModuleAllowed(u, targetModule)
  }, [isModuleAllowed])


  // Filter items strictly by individual module permissions
  const allowedNavItems = React.useMemo(() => {
    if (!user) return []
    return ALL_NAV_ITEMS.map((item) => {
      if (item.subItems && item.subItems.length > 0) {
        // Filter every sub-item individually against the user's permissions
        const filteredSubs = item.subItems.filter((sub) => checkNavAllowed(user, sub.name))
        // Parent menu header is ONLY visible if at least one sub-item is granted to this user!
        if (filteredSubs.length === 0) return null
        return {
          ...item,
          subItems: filteredSubs,
        }
      }
      return checkNavAllowed(user, item.name) ? item : null
    }).filter(Boolean) as NavItem[]
  }, [user, checkNavAllowed, userActionPermissions, userPermissions])

  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Automatically collapse sidebar on initial mobile load
      if (mobile) {
        setSidebarCollapsed(true)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [setSidebarCollapsed])

  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({
    Organisation: false,
    CRM: false,
    Sales: true,
    Subscriptions: false,
    "HR & Employees": false,
    Support: false,
  })

  React.useEffect(() => {
    if (pathname.startsWith('/feature/branches') || pathname.startsWith('/feature/companies')) {
      setOpenSubmenus(prev => ({ ...prev, Organisation: true }))
    }
    if (pathname.startsWith('/feature/leads') || pathname.startsWith('/feature/clients')) {
      setOpenSubmenus(prev => ({ ...prev, CRM: true }))
    }
    if (pathname.startsWith('/feature/sales') || pathname.startsWith('/feature/quotations') || pathname.startsWith('/feature/estimates') || pathname.startsWith('/feature/credit-notes') || pathname.startsWith('/feature/debit-notes')) {
      setOpenSubmenus(prev => ({ ...prev, Sales: true }))
    }
    if (pathname.startsWith('/feature/subscriptions') || pathname.startsWith('/feature/emi')) {
      setOpenSubmenus(prev => ({ ...prev, Subscriptions: true }))
    }
    if (pathname.startsWith('/feature/team')) {
      setOpenSubmenus(prev => ({ ...prev, "HR & Employees": true }))
    }
    if (pathname.startsWith('/feature/tickets') || pathname.startsWith('/feature/knowledge-base')) {
      setOpenSubmenus(prev => ({ ...prev, Support: true }))
    }
  }, [pathname])

  const toggleSubmenu = (name: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenSubmenus(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }

  // Sidebar visibility on mobile
  const isDrawerOpen = !isSidebarCollapsed

  return (
    <>
      {/* ── MOBILE BACKDROP OVERLAY ── */}
      <AnimatePresence>
        {isMobile && isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarCollapsed(true)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR DRAWER ── */}
      <motion.aside
        initial={false}
        animate={
          isMobile
            ? {
                x: isDrawerOpen ? 0 : -320,
                width: 280,
                opacity: isDrawerOpen ? 1 : 0,
              }
            : {
                x: 0,
                width: isSidebarCollapsed ? 64 : 256,
                opacity: 1,
              }
        }
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className={cn(
          "fixed top-0 left-0 h-screen bg-[#0A1128] text-slate-300 border-r border-slate-800/80 flex flex-col overflow-hidden shadow-2xl z-40",
          isMobile ? "z-50" : "z-40"
        )}
      >
        {/* Header - Selected Active Company Name & Logo */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800/80 shrink-0">
          <Link href="/feature/dashboard" onClick={handleLinkClick} className="flex items-center gap-2.5 group min-w-0 flex-1">
            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-slate-800/80 border border-slate-700/60 p-1 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              {isAllCompanies ? (
                <SaamparkVortexLogo className="w-8 h-8" />
              ) : activeCompanyLogo ? (
                <img
                  key={activeCompanyLogo || activeCompany?.id}
                  src={activeCompanyLogo}
                  alt={activeCompanyName}
                  className="w-full h-full object-contain"
                />
              ) : activeCompany?.logo ? (
                <span className="text-xl">{activeCompany.logo}</span>
              ) : (
                <SaamparkVortexLogo className="w-8 h-8" />
              )}
            </div>

            <AnimatePresence mode="wait">
              {(!isSidebarCollapsed || isMobile) && (
                <motion.div 
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0 flex-1 overflow-hidden text-left"
                >
                  {isAllCompanies ? (
                    <div>
                      <span 
                        className="font-black text-xs sm:text-sm tracking-wide text-white block truncate uppercase"
                        title="SAAMPARK GROUP"
                      >
                        SAAMPARK
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block truncate -mt-0.5">
                        GROUP
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span 
                        className="font-black text-xs sm:text-sm tracking-wide text-white block truncate uppercase"
                        title={activeCompanyName}
                      >
                        {activeCompanyName}
                      </span>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block truncate -mt-0.5">
                        {activeCompany?.subtitle 
                          ? activeCompany.subtitle.replace(/\s+(pvt\.?\s*ltd\.?|private\s+limited)$/i, "") 
                          : (activeCompany?.brand_name || "COMPANY")}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Close X button on mobile */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 scrollbar-hide px-2">
          {allowedNavItems.map((item) => {
            const hasSubItems = Boolean(item.subItems && item.subItems.length > 0)
            const isSubActive = hasSubItems && item.subItems?.some(
              sub => pathname === sub.href || pathname.startsWith(sub.href + '/')
            )
            const isActive = pathname === item.href || (item.href !== "/feature/dashboard" && pathname.startsWith(item.href + '/')) || isSubActive
            const isDropdownOpen = Boolean(openSubmenus[item.name])
            const getItemBadge = (name: string) => {
              const raw = rawCounts[name] !== undefined ? rawCounts[name] : (typeof item.badge === "number" ? item.badge : 0)
              const visited = visitedCounts[name] || 0
              const unread = raw - visited
              return unread > 0 ? unread : null
            }
            const itemBadge = getItemBadge(item.name)

            return (
              <div key={item.name}>
                {hasSubItems && (!isSidebarCollapsed || isMobile) ? (
                  <button
                    type="button"
                    onClick={(e) => toggleSubmenu(item.name, e)}
                    className="w-full block text-left"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all relative group cursor-pointer text-xs font-semibold",
                        isActive 
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-600/30 ring-1 ring-white/20" 
                          : "text-slate-100 hover:text-white hover:bg-slate-800/90 font-bold hover:translate-x-0.5"
                      )}
                    >
                      <item.icon 
                        size={17} 
                        className={cn("shrink-0 transition-colors", isActive ? "text-white drop-shadow-xs" : "text-slate-200 group-hover:text-white")} 
                        strokeWidth={isActive ? 2.5 : 2} 
                      />
                      
                      <div className="flex items-center justify-between w-full overflow-hidden">
                        <span className="whitespace-nowrap overflow-hidden text-[12.5px] tracking-wide">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1.5 ml-auto">
                          {itemBadge && (
                            <span className="text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs bg-indigo-500 ring-1 ring-white/20">
                              {itemBadge}
                            </span>
                          )}
                          <ChevronDown 
                            size={14} 
                            className={cn(
                              "text-slate-300 transition-transform duration-200 shrink-0",
                              isDropdownOpen && "rotate-180 text-white font-bold"
                            )} 
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                ) : (
                  <Link href={item.href} onClick={handleLinkClick} className="block">
                    <div
                      className={cn(
                        "flex items-center gap-3 py-2.5 rounded-xl transition-all relative group text-xs font-semibold",
                        isSidebarCollapsed && !isMobile ? "justify-center px-0" : "px-3",
                        isActive 
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-600/30 ring-1 ring-white/20" 
                          : "text-slate-100 hover:text-white hover:bg-slate-800/90 font-bold hover:translate-x-0.5"
                      )}
                      title={isSidebarCollapsed && !isMobile ? item.name : undefined}
                    >
                      <item.icon 
                        size={17} 
                        className={cn("shrink-0 transition-colors", isActive ? "text-white drop-shadow-xs" : "text-slate-200 group-hover:text-white")} 
                        strokeWidth={isActive ? 2.5 : 2} 
                      />
                      
                      <AnimatePresence>
                        {(!isSidebarCollapsed || isMobile) && (
                          <div className="flex items-center justify-between w-full overflow-hidden">
                            <span className="whitespace-nowrap overflow-hidden text-[12.5px] tracking-wide">
                              {item.name}
                            </span>
                            {itemBadge && (
                              <span className={`ml-auto text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs shrink-0 ring-1 ring-white/20 ${
                                item.name === "Projects" || item.name === "Leads" ? "bg-rose-600 animate-pulse" : "bg-blue-600"
                              }`}>
                                {itemBadge}
                              </span>
                            )}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                )}

                {/* Sub-items dropdown */}
                <AnimatePresence>
                  {hasSubItems && isDropdownOpen && (!isSidebarCollapsed || isMobile) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: "easeInOut" }}
                      className="space-y-1 mt-1 pl-4 pr-1 overflow-hidden"
                    >
                      {item.subItems?.map((sub) => {
                        const isSubActiveItem = pathname === sub.href || pathname.startsWith(sub.href + '/')

                        return (
                          <Link key={sub.name} href={sub.href} onClick={handleLinkClick} className="block">
                            <div
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                isSubActiveItem
                                  ? "text-white bg-blue-600/35 border-l-2 border-blue-400 font-bold shadow-xs pl-2.5"
                                  : "text-slate-200 hover:text-white hover:bg-slate-800/80 hover:translate-x-0.5"
                              )}
                            >
                              <sub.icon size={13} className={cn("shrink-0 transition-colors", isSubActiveItem ? "text-blue-300" : "text-slate-300 group-hover:text-white")} />
                              <span className="truncate">{sub.name}</span>
                            </div>
                          </Link>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* User Profile Section in Sidebar */}
        {user && (
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/feature/settings"
                onClick={handleLinkClick}
                className="flex items-center gap-2.5 min-w-0 flex-1 p-1 rounded-xl hover:bg-slate-800/60 transition-colors"
                title="View Profile & Settings"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-700 shadow-xs">
                  <img
                    key={(user as any)?.avatarUrl || user?.avatar || user?.name || "sidebar_avatar"}
                    src={(user as any).avatarUrl || user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-full h-full object-cover bg-slate-800"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0A1128]" />
                </div>
                {(!isSidebarCollapsed || isMobile) && (
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Online
                    </p>
                  </div>
                )}
              </Link>
              {(!isSidebarCollapsed || isMobile) && (
                <Link
                  href="/feature/settings"
                  onClick={handleLinkClick}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Settings"
                >
                  <Settings size={15} />
                </Link>
              )}
            </div>
          </div>
        )}
      </motion.aside>
    </>
  )
}
