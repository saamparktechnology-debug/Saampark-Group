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
  UserCheck
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

const ALL_NAV_ITEMS = [
  { name: "Dashboard", href: "/feature/dashboard", icon: LayoutDashboard },
  { name: "Events", href: "/feature/events", icon: Calendar },
  { name: "Clients", href: "/feature/clients", icon: Briefcase },
  { name: "Projects", href: "/feature/projects", icon: KanbanSquare },
  { name: "Tasks", href: "/feature/tasks", icon: CheckSquare },
  { name: "Leads", href: "/feature/leads", icon: Target },
  { name: "Subscriptions", href: "/feature/subscriptions", icon: CreditCard },
  { name: "Sales", href: "/feature/sales", icon: ShoppingCart },
  { name: "Estimates", href: "/feature/expenses", icon: FileText },
  { name: "Proposals", href: "/feature/proposals", icon: File },
  { name: "Notes", href: "/feature/notes", icon: Book },
  { name: "Messages", href: "/feature/messages", icon: MessageSquare },
  { name: "Team", href: "/feature/team", icon: UserCheck },
  { name: "Users", href: "/feature/users", icon: Users },
  { name: "Tickets", href: "/feature/tickets", icon: HeadphonesIcon, badge: 21 },
  { name: "Knowledge base", href: "/feature/knowledge-base", icon: LifeBuoy },
  { name: "Files", href: "/feature/files", icon: Folder },
  { name: "Expenses", href: "/feature/expenses", icon: Calculator },
  { name: "Reports", href: "/feature/reports", icon: Clock },
  { name: "Settings", href: "/feature/settings", icon: Settings },
]

import { getUsers } from "@/app/feature/users/services/userService"

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarCollapsed } = useUIStore()
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

  // Poll module data and calculate counts
  React.useEffect(() => {
    getUsers()

    const loadBadges = async () => {
      try {
        const { getLeads } = await import("@/app/feature/leads/services/leadService")
        const { getProjects } = await import("@/app/feature/projects/services/projectService")
        const { taskService } = await import("@/app/feature/tasks/services/taskService")
        const { getInvoices } = await import("@/app/feature/sales/invoices/services/invoiceService")

        const [leads, projects, tasks, invoices] = await Promise.all([
          getLeads().catch(() => []),
          getProjects().catch(() => []),
          taskService.getTasks().catch(() => []),
          getInvoices().catch(() => []),
        ])

        const pendingLeads = (leads || []).filter((l) => l.isLocked || (l.reminderDate && l.reminderDate !== "None")).length
        const pendingProjects = (projects || []).filter((p) => p.status === "Payment Pending" || p.paymentStatus === "Payment Pending").length
        const openTasks = (tasks || []).filter((t) => t.status !== "Done").length
        const unpaidInvoices = (invoices || []).filter((i) => i.status === "Not paid" || i.status === "Payment Pending" || i.status === "Draft").length

        setRawCounts({
          Leads: pendingLeads,
          Projects: pendingProjects,
          Tasks: openTasks,
          Tickets: 21,
          Sales: unpaidInvoices,
        })
      } catch (err) {
        console.warn("Sidebar badge error:", err)
      }
    }

    loadBadges()
    const interval = setInterval(loadBadges, 4000)
    return () => clearInterval(interval)
  }, [])

  // Whenever user navigates to a module page, automatically mark that module's current count as visited
  React.useEffect(() => {
    const activeItem = ALL_NAV_ITEMS.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    if (activeItem) {
      const currentRaw = rawCounts[activeItem.name] || 0
      setVisitedCounts(prev => {
        if (prev[activeItem.name] === currentRaw) return prev
        const updated = { ...prev, [activeItem.name]: currentRaw }
        try {
          localStorage.setItem("saampark_visited_badge_counts", JSON.stringify(updated))
        } catch {}
        return updated
      })
    }
  }, [pathname, rawCounts])

  // Dynamically filter navigation items based on user role & permissions configured by Super Admin / Admin
  const allowedNavItems = React.useMemo(() => {
    if (!user) return []
    return ALL_NAV_ITEMS.filter((item) => isModuleAllowed(user, item.name))
  }, [user, isModuleAllowed, userActionPermissions, userPermissions])

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isSidebarCollapsed ? 64 : 256,
        x: 0,
        opacity: 1
      }}
      className="fixed top-0 left-0 h-screen glass-panel border-r border-border flex flex-col z-40 overflow-hidden"
    >
      <div className="h-16 flex items-center justify-center border-b border-border/50 shrink-0">
        <Link href="/feature/dashboard" className="flex items-center gap-3 w-full px-4 group">
          <img 
            src="/logo.png" 
            alt="SAAMPARK Logo" 
            className="min-w-8 w-8 h-8 rounded-full object-cover shrink-0 shadow-sm border border-primary/20 group-hover:scale-105 transition-transform" 
          />
          <AnimatePresence>
            {!isSidebarCollapsed && (
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
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 scrollbar-hide">
        {allowedNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const raw = rawCounts[item.name] !== undefined ? rawCounts[item.name] : (typeof item.badge === "number" ? item.badge : 0)
          const visited = visitedCounts[item.name] || 0
          const unreadDiff = raw - visited
          const showBadge = unreadDiff > 0 && !isActive
          const itemBadge = showBadge ? unreadDiff : null

          return (
            <Link key={item.name} href={item.href} className="block px-3">
              <motion.div
                whileHover={{ x: isSidebarCollapsed ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 py-2 rounded-lg transition-colors relative group h-9",
                  isSidebarCollapsed ? "justify-center px-0" : "px-3",
                  isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover/50"
                )}
                title={isSidebarCollapsed ? item.name : undefined}
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
                  {!isSidebarCollapsed && (
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
          )
        })}
      </div>
    </motion.aside>
  )
}
