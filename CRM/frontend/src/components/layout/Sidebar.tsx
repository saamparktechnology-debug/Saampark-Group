"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Monitor, 
  Calendar, 
  Briefcase, 
  Command, 
  CheckCircle,
  Layers,
  ArrowRightLeft,
  ShoppingCart,
  File,
  Coffee,
  Book,
  MessageCircle,
  Users,
  LifeBuoy,
  HelpCircle,
  Folder,
  Clock,
  Settings
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore, Role } from "@/store/useAuthStore"

const ALL_NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: Monitor, roles: ["Super Admin", "Admin", "Manager", "Employee"] },
  { name: "Events", href: "/events", icon: Calendar, roles: ["Super Admin", "Admin", "Manager", "Employee"] },
  { name: "Clients", href: "/clients", icon: Briefcase, roles: ["Super Admin", "Admin", "Manager"] },
  { name: "Projects", href: "/projects", icon: Command, roles: ["Super Admin", "Admin", "Manager", "Client"] },
  { name: "Tasks", href: "/tasks", icon: CheckCircle, roles: ["Super Admin", "Admin", "Manager", "Employee"] },
  { name: "Leads", href: "/leads", icon: Layers, roles: ["Super Admin", "Admin", "Manager"] },
  { name: "Sales", href: "/sales", icon: ArrowRightLeft, roles: ["Super Admin", "Admin", "Manager"] },
  { name: "Estimates", href: "/estimates", icon: ShoppingCart, roles: ["Super Admin", "Admin", "Manager", "Client"] },
  { name: "Proposals", href: "/proposals", icon: File, roles: ["Super Admin", "Admin", "Manager", "Client"] },
  { name: "Notes", href: "/notes", icon: Coffee, roles: ["Super Admin", "Admin", "Manager"] },
  { name: "Messages", href: "/messages", icon: Book, roles: ["Super Admin", "Admin", "Manager", "Employee", "Client"] },
  { name: "Team", href: "/team", icon: MessageCircle, roles: ["Super Admin", "Admin", "Manager"] },
  { name: "Tickets", href: "/tickets", icon: Users, roles: ["Super Admin", "Admin", "Manager", "Client"] },
  { name: "Knowledge Base", href: "/knowledge-base", icon: LifeBuoy, roles: ["Super Admin", "Admin", "Manager", "Employee", "Client"] },
  { name: "Files", href: "/files", icon: HelpCircle, roles: ["Super Admin", "Admin", "Manager", "Employee", "Client"] },
  { name: "Expenses", href: "/expenses", icon: Folder, roles: ["Super Admin", "Admin", "Manager"] },
  { name: "Reports", href: "/reports", icon: Clock, roles: ["Super Admin", "Admin", "Manager"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["Super Admin", "Admin"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarCollapsed } = useUIStore()
  const { user } = useAuthStore()

  // Filter items based on the user's role
  const allowedNavItems = React.useMemo(() => {
    if (!user) return []
    return ALL_NAV_ITEMS.filter(item => item.roles.includes(user.role))
  }, [user])

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
      <div className="h-16 flex items-center justify-center border-b border-border/50">
        <div className="flex items-center gap-3 w-full px-4">
          <div className="min-w-8 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-glow shrink-0">
            <div className="w-5 h-5 bg-background rounded-full border-2 border-transparent" style={{ borderTopColor: 'white', borderRightColor: 'white' }} />
          </div>
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 scrollbar-hide">
        {allowedNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.name} href={item.href} className="block px-3">
              <motion.div
                whileHover={{ x: isSidebarCollapsed ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 py-2.5 rounded-lg transition-colors relative group h-10",
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
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="relative z-10 text-sm whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
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
