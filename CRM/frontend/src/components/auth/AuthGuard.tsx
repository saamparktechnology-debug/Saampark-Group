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

    const isSessionActive = typeof window !== "undefined" && sessionStorage.getItem("saampark_session_active") === "true"
    const state = useAuthStore.getState()

    // If browser or tab was closed, sessionStorage is empty: invalidate authentication state
    if (!isSessionActive && state.isAuthenticated) {
      useAuthStore.setState({ isAuthenticated: false })
    }

    const isAuth = Boolean(state.isAuthenticated && state.user && state.user.email && isSessionActive)
    const isPublicPage = 
      pathname === "/login" || 
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/public") || 
      pathname?.startsWith("/verify-invoice") || 
      pathname?.startsWith("/verify-member") ||
      pathname?.startsWith("/verify")

    // If on a public verification page or login page:
    if (isPublicPage) {
      if (pathname === "/login" || pathname?.startsWith("/login")) {
        // Only navigate to dashboard if there is a genuinely active browser session
        if (isAuth && isSessionActive) {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("saampark_inactivity_logout")
            sessionStorage.removeItem("saampark_inactive_logout")
            localStorage.setItem("saampark_last_activity_time", String(Date.now()))
            if (window.location.search) {
              window.history.replaceState({}, document.title, window.location.pathname)
            }
          }
          router.replace("/feature/dashboard")
          return
        }

        // On login page when session is closed: cleanly reset flags and ensure no leftover storage
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("saampark_inactivity_logout")
          sessionStorage.removeItem("saampark_inactive_logout")
          localStorage.removeItem("saampark_session_active")
          if (window.location.search.includes("expired") || window.location.search.includes("inactivity")) {
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        }
      }
      return
    }

    // Protected page access: requires BOTH authenticated user AND an active browser session in this tab/window
    if (!isAuth || !isSessionActive) {
      router.replace("/login")
    }
  }, [isAuthenticated, user, pathname, router, isMounted])

  // Reset activity tracker immediately upon authentication
  React.useEffect(() => {
    if (!isMounted) return
    const isSessionActive = typeof window !== "undefined" && sessionStorage.getItem("saampark_session_active") === "true"
    if (isAuthenticated && isSessionActive) {
      if (typeof window !== "undefined") {
        localStorage.setItem("saampark_last_activity_time", String(Date.now()))
        sessionStorage.removeItem("saampark_inactivity_logout")
        sessionStorage.removeItem("saampark_inactive_logout")
        localStorage.removeItem("saampark_session_active")
      }
    }
  }, [isAuthenticated, isMounted])

  // 2. 30-Minute Inactivity Tracker & Auto-Logout
  React.useEffect(() => {
    if (!isMounted) return

    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000 // 30 minutes
    let lastActivityTime = Date.now()

    // Always ensure fresh last activity time upon mounting
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("saampark_last_activity_time")
      if (stored && !isNaN(Number(stored))) {
        const storedNum = Number(stored)
        if (Date.now() - storedNum < INACTIVITY_LIMIT_MS) {
          lastActivityTime = storedNum
        } else {
          lastActivityTime = Date.now()
          localStorage.setItem("saampark_last_activity_time", String(lastActivityTime))
        }
      } else {
        lastActivityTime = Date.now()
        localStorage.setItem("saampark_last_activity_time", String(lastActivityTime))
      }
    }

    let throttleTimer: any = null
    const updateActivity = () => {
      lastActivityTime = Date.now()
      if (throttleTimer) return
      throttleTimer = setTimeout(() => {
        throttleTimer = null
      }, 5000) // Throttle to write at most once every 5 seconds

      if (typeof window !== "undefined") {
        localStorage.setItem("saampark_last_activity_time", String(Date.now()))
      }
    }

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click", "focus"]
    activityEvents.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }))

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateActivity()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Check inactivity periodically every 10 seconds
    const inactivityInterval = setInterval(() => {
      const state = useAuthStore.getState()
      // If user is not authenticated, keep lastActivityTime fresh so when they log in they don't get kicked out!
      if (!state.isAuthenticated) {
        lastActivityTime = Date.now()
        if (typeof window !== "undefined") {
          localStorage.setItem("saampark_last_activity_time", String(Date.now()))
        }
        return
      }

      let effectiveLastActivity = lastActivityTime
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("saampark_last_activity_time")
        if (stored && !isNaN(Number(stored))) {
          const storedNum = Number(stored)
          effectiveLastActivity = Math.max(lastActivityTime, storedNum)
        } else {
          // If stored is missing, reset it now to prevent premature logout
          lastActivityTime = Date.now()
          localStorage.setItem("saampark_last_activity_time", String(Date.now()))
          return
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
      document.removeEventListener("visibilitychange", handleVisibilityChange)
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
      const currentRole = state.user.role

      // Super Admins should never be logged out by status checks
      if (currentRole === "Super Admin" || currentEmail === "saampark.official@gmail.com") {
        return
      }

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
  if (!isMounted) {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.toLowerCase()
      if (p === "/login" || p.startsWith("/login") || p.startsWith("/public") || p.startsWith("/verify-invoice") || p.startsWith("/verify-member") || p.startsWith("/verify")) {
        return <>{children}</>
      }
    }
    return null
  }

  // If on login or public unauthenticated verification page, render directly
  const isPublicPage = 
    pathname === "/login" || 
    pathname?.startsWith("/login") || 
    pathname?.startsWith("/public") || 
    pathname?.startsWith("/verify-invoice") || 
    pathname?.startsWith("/verify-member") ||
    pathname?.startsWith("/verify")
  if (isPublicPage) return <>{children}</>

  // If not authenticated or session not active, and not on public page, render nothing while redirecting
  const isSessionActiveNow = typeof window !== "undefined" && sessionStorage.getItem("saampark_session_active") === "true"
  if (!isAuthenticated || !user || !isSessionActiveNow) return null

  // Authenticated user on protected page: Enforce URL Route Access Permissions
  const isSuperAdmin = user.role === "Super Admin"
  const featureSubPath = pathname && pathname.includes("/feature/")
    ? pathname.substring(pathname.indexOf("/feature/"))
    : pathname

  const isPublicOrDashboard = !pathname || pathname === "/" || featureSubPath === "/feature/dashboard"

  if (!isSuperAdmin && !isPublicOrDashboard) {
    const routeModuleMap: Record<string, string> = {
      "/feature/dashboard": "Dashboard",
      "/feature/companies": "Companies",
      "/feature/branches": "Branches",
      "/feature/departments": "Departments",
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
      "/feature/proposals": "Proposals",
      "/feature/subscriptions": "Subscriptions",
      "/feature/emi": "EMI",
      "/feature/quotations": "Quotations",
      "/feature/estimates": "Estimates",
      "/feature/sales/orders": "Sales Orders",
      "/feature/sales-orders": "Sales Orders",
      "/feature/sales/invoices": "Invoices",
      "/feature/sales/payments": "Payments",
      "/feature/sales/credit-notes": "Credit Notes",
      "/feature/sales/debit-notes": "Debit Notes",
      "/feature/sales/store": "Services & Store",
      "/feature/sales": "Invoices",
      "/feature/purchase": "Invoices",
      "/feature/purchase-orders": "Sales Orders",
      "/feature/purchase-invoices": "Invoices",
      "/feature/purchase-returns": "Credit Notes",
      "/feature/transactions": "Expenses",
      "/feature/bank-accounts": "Expenses",
      "/feature/tax-rates": "Settings",
      "/feature/products": "Services & Store",
      "/feature/product-categories": "Services & Store",
      "/feature/product-brands": "Services & Store",
      "/feature/units": "Services & Store",
      "/feature/warehouses": "Services & Store",
      "/feature/team/members": "Teams",
      "/feature/team/payments": "Payroll",
      "/feature/team/leave": "Leave",
      "/feature/team/timecards": "Attendance",
      "/feature/employees": "Teams",
      "/feature/attendance": "Attendance",
      "/feature/leave-management": "Leave",
      "/feature/payroll": "Payroll",
      "/feature/performance": "Teams",
      "/feature/teams": "Teams",
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
      "/feature/activity-logs": "Activity Logs",
    }

    const matchedRoute = Object.keys(routeModuleMap).find(r => featureSubPath === r || featureSubPath?.startsWith(r + "/"))
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
