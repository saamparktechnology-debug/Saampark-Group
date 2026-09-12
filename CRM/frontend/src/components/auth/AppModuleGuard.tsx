"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ShieldAlert, ArrowLeft, LayoutDashboard } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { Button } from "@/components/ui/Button"

// Path prefix to module name mapping
const PATH_TO_MODULE_MAP: Array<{ prefix: string; moduleName: string }> = [
  { prefix: "/feature/dashboard", moduleName: "Dashboard" },
  { prefix: "/feature/events", moduleName: "Events" },
  { prefix: "/feature/clients", moduleName: "Clients" },
  { prefix: "/feature/projects", moduleName: "Projects" },
  { prefix: "/feature/tasks", moduleName: "Tasks" },
  { prefix: "/feature/leads", moduleName: "Leads" },
  { prefix: "/feature/subscriptions", moduleName: "Subscriptions" },
  { prefix: "/feature/emi", moduleName: "EMI" },
  { prefix: "/feature/sales", moduleName: "Sales" },
  { prefix: "/feature/estimates", moduleName: "Estimates" },
  { prefix: "/feature/notes", moduleName: "Notes" },
  { prefix: "/feature/messages", moduleName: "Messages" },
  { prefix: "/feature/team", moduleName: "Teams" },
  { prefix: "/feature/users", moduleName: "Users" },
  { prefix: "/feature/tickets", moduleName: "Tickets" },
  { prefix: "/feature/knowledge-base", moduleName: "Knowledge base" },
  { prefix: "/feature/files", moduleName: "Files" },
  { prefix: "/feature/expenses", moduleName: "Expenses" },
  { prefix: "/feature/reports", moduleName: "Reports" },
  { prefix: "/feature/settings", moduleName: "Settings" },
]

export function AppModuleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, activeCompanyId, switchCompany, isAuthenticated } = useAuthStore()
  const { isModuleAllowed } = usePermissionStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-correct unauthorized activeCompanyId for non-Super Admin users
  React.useEffect(() => {
    if (!mounted || !user) return
    const isSuper = user.role === "Super Admin"
    if (!isSuper && activeCompanyId) {
      const rawCompIds = user.companyIds || (user.companyId ? [user.companyId] : ["tech"])
      const allowedCompIds = (Array.isArray(rawCompIds) ? rawCompIds : [rawCompIds]).map((id: any) => String(id).toLowerCase().trim())
      const activeNorm = String(activeCompanyId).toLowerCase().trim()
      const isAllowed = allowedCompIds.some((id: string) => id === activeNorm)
      if (!isAllowed) {
        const fallback = allowedCompIds[0] || "tech"
        console.warn(`Unauthorized company active (${activeCompanyId}). Reverting to assigned: ${fallback}`)
        switchCompany(fallback)
      }
    }
  }, [mounted, user, activeCompanyId, switchCompany])

  if (!mounted) return <>{children}</>

  // Public routes always render without restriction
  if (!pathname || pathname === "/login" || pathname.startsWith("/public/") || pathname.startsWith("/verify-invoice")) {
    return <>{children}</>
  }

  // If unauthenticated, AuthGuard will handle redirect
  if (!isAuthenticated || !user) {
    return <>{children}</>
  }

  // Identify current module from pathname
  const matched = PATH_TO_MODULE_MAP.find((m) => pathname === m.prefix || pathname.startsWith(m.prefix + "/"))

  // If route is not mapped (e.g. unknown feature), render children
  if (!matched) {
    return <>{children}</>
  }

  // Verify user has permission to view this module
  const allowed = isModuleAllowed(user, matched.moduleName)

  if (!allowed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {user.role} Access Restricted
            </span>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              Module Permission Required
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your account does not have permission to access the{" "}
              <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{matched.moduleName}</strong> module.
              Please contact your administrator if you require access to this section.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto text-xs font-semibold gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Go Back</span>
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/feature/dashboard")}
              className="w-full sm:w-auto text-xs font-semibold gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
