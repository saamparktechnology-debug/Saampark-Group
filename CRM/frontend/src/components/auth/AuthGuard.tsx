"use client"

import { usePermissionStore } from "@/store/usePermissionStore"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()

  // Hydration state check to prevent flash of content during client mount
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // 1. Browser-Close Session Expiry Check & Routing
  React.useEffect(() => {
    if (!isMounted) return

    const state = useAuthStore.getState()
    const isAuth = Boolean(state.isAuthenticated && state.user && state.user.email)
    const isPublicPage = pathname === "/login" || pathname?.startsWith("/public/") || pathname?.startsWith("/verify-invoice")

    if (isAuth && typeof window !== "undefined") {
      const isSessionActive = sessionStorage.getItem("saampark_session_active") === "true"
      if (!isSessionActive) {
        console.warn("Browser session closed/expired. Logging out...")
        state.logout()
        router.replace("/login?reason=session_expired")
        return
      }
    }

    if (!isAuth && !isPublicPage) {
      router.replace("/login")
    } else if (isAuth && pathname === "/login") {
      router.replace("/feature/dashboard")
    }
  }, [isAuthenticated, user, pathname, router, isMounted])

  // 2. 30-Minute Inactivity Tracker & Auto-Logout
  React.useEffect(() => {
    if (!isMounted) return

    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000 // 30 minutes
    let lastActivityTime = Date.now()

    // Initialize stored activity timestamp
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("saampark_last_activity_time")
      if (stored && !isNaN(Number(stored))) {
        lastActivityTime = Number(stored)
      } else {
        localStorage.setItem("saampark_last_activity_time", String(lastActivityTime))
      }
    }

    let throttleTimer: any = null
    const updateActivity = () => {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => {
        throttleTimer = null
      }, 5000) // Throttle to write at most once every 5 seconds

      lastActivityTime = Date.now()
      if (typeof window !== "undefined") {
        localStorage.setItem("saampark_last_activity_time", String(lastActivityTime))
      }
    }

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"]
    activityEvents.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }))

    // Check inactivity periodically every 10 seconds
    const inactivityInterval = setInterval(() => {
      const state = useAuthStore.getState()
      if (!state.isAuthenticated) return

      let effectiveLastActivity = lastActivityTime
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("saampark_last_activity_time")
        if (stored && !isNaN(Number(stored))) {
          effectiveLastActivity = Math.max(lastActivityTime, Number(stored))
        }
      }

      const elapsed = Date.now() - effectiveLastActivity
      if (elapsed >= INACTIVITY_LIMIT_MS) {
        console.warn(`User inactive for ${Math.round(elapsed / 60000)} minutes. Auto-logging out...`)
        if (typeof window !== "undefined") {
          sessionStorage.setItem("saampark_inactivity_logout", "true")
        }
        state.logout()
        router.replace("/login?reason=inactivity")
      }
    }, 10000)

    return () => {
      clearInterval(inactivityInterval)
      if (throttleTimer) clearTimeout(throttleTimer)
      activityEvents.forEach((ev) => window.removeEventListener(ev, updateActivity))
    }
  }, [isMounted, router])

  // 3. Explicit session revocation & Inactive account status listener
  React.useEffect(() => {
    if (!isMounted) return

    const forceInactiveLogout = (email: string) => {
      const state = useAuthStore.getState()
      if (state.user?.email) {
        const currentEmail = state.user.email.toLowerCase().trim()
        if (email.toLowerCase().trim().includes(currentEmail)) {
          console.warn("User account set to Inactive by Admin. Terminating session:", currentEmail)
          if (typeof window !== "undefined") {
            sessionStorage.setItem("saampark_inactive_logout", "true")
          }
          state.logout()
          router.replace("/login")
        }
      }
    }

    const checkActiveUserStatus = async () => {
      const state = useAuthStore.getState()
      if (!state.isAuthenticated || !state.user?.email) return
      const currentEmail = state.user.email.toLowerCase().trim()

      try {
        const { getStoredUserAccountsAsync } = await import("@/app/feature/users/services/userService")
        const accounts = await getStoredUserAccountsAsync()
        const myAcc = accounts.find((a) => a.email.toLowerCase().trim() === currentEmail)
        if (myAcc && myAcc.status === "Inactive") {
          forceInactiveLogout(currentEmail)
        }
      } catch {}
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "saampark_session_revoked" && e.newValue) {
        forceInactiveLogout(e.newValue)
      }
    }

    const handleCustomRevoke = (e: any) => {
      if (e.detail?.email) {
        forceInactiveLogout(e.detail.email)
      }
    }

    // Check on mount and periodically every 30 seconds
    checkActiveUserStatus()
    const interval = setInterval(checkActiveUserStatus, 30000)

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("saampark_session_revoked", handleCustomRevoke)
    window.addEventListener("saampark_user_status_changed", handleCustomRevoke)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("saampark_session_revoked", handleCustomRevoke)
      window.removeEventListener("saampark_user_status_changed", handleCustomRevoke)
    }
  }, [isMounted, router])

  // 4. Real-time individual user permissions synchronization
  React.useEffect(() => {
    if (!isMounted || !user) return
    if (user.id) {
      usePermissionStore.getState().fetchUserPermissions?.(String(user.id))
    }
    if (user.email) {
      usePermissionStore.getState().fetchUserPermissions?.(user.email.toLowerCase().trim())
    }
    usePermissionStore.getState().fetchRolePermissions?.()
  }, [isMounted, user?.id, user?.email])

  // Prevent rendering protected content before hydration completes
  if (!isMounted) return null

  // If on login or public unauthenticated verification page, render directly
  const isPublicPage = pathname === "/login" || pathname?.startsWith("/public") || pathname?.startsWith("/verify-invoice")
  if (isPublicPage) return <>{children}</>

  // If not authenticated and not on public page, render nothing while redirecting
  if (!isAuthenticated || !user) return null

  // Authenticated user on protected page: Enforce URL Route Access Permissions
  const isSuperAdmin = user.role === "Super Admin"
  const isPublicOrDashboard = !pathname || pathname === "/" || pathname === "/feature/dashboard"

  if (!isSuperAdmin && !isPublicOrDashboard) {
    const routeModuleMap: Record<string, string> = {
      "/feature/companies": "Companies",
      "/feature/permissions": "Permissions",
      "/feature/users": "Users",
      "/feature/clients": "Clients",
      "/feature/projects": "Projects",
      "/feature/tasks": "Tasks",
      "/feature/leads": "Leads",
      "/feature/enquiries": "Leads",
      "/feature/follow-ups": "Leads",
      "/feature/calls": "Leads",
      "/feature/meetings": "Leads",
      "/feature/subscriptions": "Subscriptions",
      "/feature/emi": "EMI",
      "/feature/quotations": "Sales",
      "/feature/estimates": "Estimates",
      "/feature/sales-orders": "Sales",
      "/feature/sales/invoices": "Sales",
      "/feature/sales/payments": "Sales",
      "/feature/sales": "Sales",
      "/feature/purchase": "Sales",
      "/feature/purchase-orders": "Sales",
      "/feature/purchase-invoices": "Sales",
      "/feature/purchase-returns": "Sales",
      "/feature/transactions": "Expenses",
      "/feature/bank-accounts": "Expenses",
      "/feature/tax-rates": "Settings",
      "/feature/products": "Sales",
      "/feature/product-categories": "Sales",
      "/feature/product-brands": "Sales",
      "/feature/units": "Sales",
      "/feature/warehouses": "Sales",
      "/feature/employees": "Teams",
      "/feature/attendance": "Teams",
      "/feature/leave-management": "Teams",
      "/feature/payroll": "Teams",
      "/feature/performance": "Teams",
      "/feature/tickets": "Tickets",
      "/feature/knowledge-base": "Knowledge base",
      "/feature/documents": "Files",
      "/feature/files": "Files",
      "/feature/expenses": "Expenses",
      "/feature/reports": "Reports",
      "/feature/settings": "Settings",
      "/feature/notes": "Notes",
      "/feature/messages": "Messages",
      "/feature/events": "Events",
      "/feature/branches": "Teams",
      "/feature/departments": "Teams",
      "/feature/teams": "Teams",
    }

    const matchedRoute = Object.keys(routeModuleMap).find(r => pathname === r || pathname.startsWith(r + "/"))
    if (matchedRoute) {
      const targetModule = routeModuleMap[matchedRoute]
      let isAllowed = false
      if (targetModule === "Companies" || targetModule === "Permissions") {
        isAllowed = user.role === "Admin"
      } else {
        isAllowed = usePermissionStore.getState().isModuleAllowed(user, targetModule)
      }

      if (!isAllowed) {
        return (
          <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-3xl mb-4 shadow-xs">
              🛡️
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Access Restricted</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mt-2 mb-6">
              You do not have permission to view the <strong>{targetModule}</strong> module. Please contact your administrator if you require access.
            </p>
            <a
              href="/feature/dashboard"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              Return to Dashboard
            </a>
          </div>
        )
      }
    }
  }

  return <>{children}</>
}
