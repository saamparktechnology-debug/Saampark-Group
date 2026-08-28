"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calendar, 
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
  UserCheck,
  ChevronDown,
  ShoppingBag,
  X
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

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
  { name: "Events", href: "/feature/events", icon: Calendar },
  { name: "Clients", href: "/feature/clients", icon: Briefcase },
  { name: "Projects", href: "/feature/projects", icon: KanbanSquare },
  { name: "Tasks", href: "/feature/tasks", icon: CheckSquare },
  { name: "Leads", href: "/feature/leads", icon: Target },
  { name: "Subscriptions", href: "/feature/subscriptions", icon: CreditCard },
  { 
    name: "Sales", 
    href: "/feature/sales/invoices", 
    icon: ShoppingCart,
    subItems: [
      { name: "Invoices", href: "/feature/sales/invoices", icon: FileText },
      { name: "Order list", href: "/feature/sales/orders", icon: ShoppingBag },
      { name: "Payments", href: "/feature/sales/payments", icon: CreditCard },
    ]
  },
  { name: "Estimates", href: "/feature/estimates", icon: Calculator },
  { name: "Notes", href: "/feature/notes", icon: Book },
  { name: "Messages", href: "/feature/messages", icon: MessageSquare },
  { name: "Users", href: "/feature/users", icon: Users },
  { name: "Tickets", href: "/feature/tickets", icon: HeadphonesIcon, badge: 21 },
  { name: "Knowledge base", href: "/feature/knowledge-base", icon: LifeBuoy },
  { name: "Files", href: "/feature/files", icon: Folder },
  { name: "Expenses", href: "/feature/expenses", icon: Calculator },
  { name: "Reports", href: "/feature/reports", icon: Clock },
  { name: "Settings", href: "/feature/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarCollapsed, setSidebarCollapsed } = useUIStore()
  const { user } = useAuthStore()
  const { isModuleAllowed, userActionPermissions, userPermissions } = usePermissionStore()

  const [rawCounts, setRawCounts] = React.useState<Record<string, number>>({
    Tickets: 21,
  })
  const [visitedCounts, setVisitedCounts] = React.useState<Record<string, number>>({})

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

  // Filter items by role & permissions
  const allowedNavItems = React.useMemo(() => {
    if (!user) return []
    return ALL_NAV_ITEMS.filter((item) => isModuleAllowed(user, item.name))
  }, [user, isModuleAllowed, userActionPermissions, userPermissions])

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
    Sales: true,
  })

  React.useEffect(() => {
    if (pathname.startsWith('/feature/sales')) {
      setOpenSubmenus(prev => ({ ...prev, Sales: true }))
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
          "fixed top-0 left-0 h-screen glass-panel border-r border-border flex flex-col overflow-hidden bg-surface/98 backdrop-blur-md shadow-2xl lg:shadow-none",
          isMobile ? "z-50" : "z-40"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50 shrink-0">
          <Link href="/feature/dashboard" onClick={handleLinkClick} className="flex items-center gap-3 group">
            <img 
              src="/logo.png" 
              alt="SAAMPARK Logo" 
              className="min-w-8 w-8 h-8 rounded-full object-cover shrink-0 shadow-sm border border-primary/20 group-hover:scale-105 transition-transform" 
            />
            <AnimatePresence>
              {(!isSidebarCollapsed || isMobile) && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-info whitespace-nowrap overflow-hidden"
                >
                  SAAMPARK
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Close X button on mobile */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors"
              title="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 scrollbar-hide">
          {allowedNavItems.map((item) => {
            const hasSubItems = Boolean(item.subItems && item.subItems.length > 0)
            const isSubActive = hasSubItems && item.subItems?.some(
              sub => pathname === sub.href || pathname.startsWith(sub.href + '/')
            )
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/') || isSubActive
            const isDropdownOpen = (!isSidebarCollapsed || isMobile) && Boolean(openSubmenus[item.name] ?? isActive)
            
            const raw = rawCounts[item.name] !== undefined ? rawCounts[item.name] : (typeof item.badge === "number" ? item.badge : 0)
            const visited = visitedCounts[item.name] || 0
            const unreadDiff = raw - visited
            const showBadge = unreadDiff > 0 && !isActive
            const itemBadge = showBadge ? unreadDiff : null

            return (
              <div key={item.name} className="px-3">
                {hasSubItems && (!isSidebarCollapsed || isMobile) ? (
                  <button
                    type="button"
                    onClick={(e) => toggleSubmenu(item.name, e)}
                    className="w-full block text-left"
                  >
                    <motion.div
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors relative group h-9 cursor-pointer",
                        isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover/50"
                      )}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="sidebar-active-parent"
                          className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <item.icon size={18} className="relative z-10 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                      
                      <div className="relative z-10 flex items-center justify-between w-full overflow-hidden">
                        <span className="text-sm whitespace-nowrap overflow-hidden">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1.5 ml-auto">
                          {itemBadge && (
                            <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs bg-indigo-600">
                              {itemBadge}
                            </span>
                          )}
                          <ChevronDown 
                            size={14} 
                            className={cn(
                              "text-muted-foreground transition-transform duration-200 shrink-0",
                              isDropdownOpen && "rotate-180 text-primary"
                            )} 
                          />
                        </div>
                      </div>
                    </motion.div>
                  </button>
                ) : (
                  <Link href={item.href} onClick={handleLinkClick} className="block">
                    <motion.div
                      whileHover={{ x: isSidebarCollapsed && !isMobile ? 0 : 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "flex items-center gap-3 py-2 rounded-lg transition-colors relative group h-9",
                        isSidebarCollapsed && !isMobile ? "justify-center px-0" : "px-3",
                        isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover/50"
                      )}
                      title={isSidebarCollapsed && !isMobile ? item.name : undefined}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="sidebar-active"
                          className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <item.icon size={18} className="relative z-10 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                      
                      <AnimatePresence>
                        {(!isSidebarCollapsed || isMobile) && (
                          <motion.div 
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "100%" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="relative z-10 flex items-center justify-between w-full overflow-hidden"
                          >
                            <span className="text-sm whitespace-nowrap overflow-hidden">
                              {item.name}
                            </span>
                            {itemBadge && (
                              <span className={`ml-auto text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs shrink-0 ${
                                item.name === "Projects" || item.name === "Leads" ? "bg-rose-600 animate-pulse" : "bg-indigo-600"
                              }`}>
                                {itemBadge}
                              </span>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
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
                            <motion.div
                              whileHover={{ x: 3 }}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative",
                                isSubActiveItem
                                  ? "text-primary bg-primary/10 font-semibold border-l-2 border-primary"
                                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover/50"
                              )}
                            >
                              <sub.icon size={13} className={cn("shrink-0", isSubActiveItem ? "text-primary" : "text-muted-foreground")} />
                              <span className="truncate">{sub.name}</span>
                            </motion.div>
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
      </motion.aside>
    </>
  )
}
