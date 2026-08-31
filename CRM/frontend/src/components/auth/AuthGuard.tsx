"use client"

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

    // Check on mount and periodically every 3 seconds
    checkActiveUserStatus()
    const interval = setInterval(checkActiveUserStatus, 3000)

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

  // Prevent rendering protected content before hydration completes
  if (!isMounted) return null

  // If on login or public unauthenticated verification page, render directly
  const isPublicPage = pathname === "/login" || pathname?.startsWith("/public") || pathname?.startsWith("/verify-invoice")
  if (isPublicPage) return <>{children}</>

  // If not authenticated and not on public page, render nothing while redirecting
  if (!isAuthenticated || !user) return null

  // Authenticated user on protected page
  return <>{children}</>
}
