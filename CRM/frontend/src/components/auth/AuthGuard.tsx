"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { syncGlobalDeletedIds } from "@/lib/storageSync"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()

  // Hydration state check to prevent flash of content
  const [isMounted, setIsMounted] = React.useState(false)

  // Track consecutive failures before logging out (prevents flaky-network logouts)
  const failureCountRef = React.useRef(0)
  const MAX_FAILURES = 3

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Active Session Revocation Check & Global Permission Sync
  React.useEffect(() => {
    if (!isMounted) return

    const verifyActiveSessionAndSyncPermissions = async () => {
      // Sync all deleted items from MySQL database across all browsers
      try {
        await syncGlobalDeletedIds()
      } catch {}

      const state = useAuthStore.getState()
      if (!state.isAuthenticated || !state.user?.email) {
        if (pathname !== "/login") {
          router.replace("/login")
        }
        return
      }

      // Block obsolete demo accounts
      const emailNorm = state.user.email.toLowerCase().trim()
      const demoEmails = ["superadmin@saampark.in", "admin@tech.saampark.in", "team@saampark.in", "client@acme.com", "user@saampark.in"]
      if (demoEmails.includes(emailNorm)) {
        console.warn("Revoking obsolete demo account session:", emailNorm)
        state.logout()
        if (typeof window !== "undefined") {
          localStorage.removeItem("saampark-auth")
          localStorage.removeItem("saampark-auth-v2")
        }
        router.replace("/login")
        return
      }

      // Check local deleted emails list (fast, no network)
      try {
        const rawDeleted = localStorage.getItem("saampark_deleted_user_emails")
        const deletedEmails: string[] = rawDeleted ? JSON.parse(rawDeleted) : []
        if (deletedEmails.includes(emailNorm)) {
          state.logout()
          router.replace("/login")
          return
        }
      } catch {}

      // Network check: verify user still exists in live database
      // Only force-logout after MAX_FAILURES consecutive errors (prevents transient network issues)
      try {
        const { getUsers } = await import("@/app/feature/users/services/userService")
        const liveUsers = await getUsers()

        if (Array.isArray(liveUsers) && liveUsers.length > 0) {
          const exists = liveUsers.some((u) => u.email.toLowerCase().trim() === emailNorm)
          if (!exists) {
            failureCountRef.current += 1
            if (failureCountRef.current >= MAX_FAILURES) {
              console.warn("Session revoked: User account deleted or non-existent.")
              state.logout()
              router.replace("/login")
            }
          } else {
            // Reset failure count on success
            failureCountRef.current = 0
          }
        } else {
          // Empty result — could be a transient error, don't log out
          console.warn("Session check: empty user list returned (skipping logout)")
        }
      } catch (e) {
        // Network/API error — increment but don't immediately logout
        console.warn("Session check error (will retry):", e)
      }
    }

    verifyActiveSessionAndSyncPermissions()

    // Run every 30 seconds (was 3s — too aggressive, caused logouts on slow responses)
    const interval = setInterval(verifyActiveSessionAndSyncPermissions, 30000)

    const handleStorageChange = () => {
      verifyActiveSessionAndSyncPermissions()
    }
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [isMounted, pathname, router])

  React.useEffect(() => {
    if (isMounted) {
      const state = useAuthStore.getState()
      const isAuth = Boolean(state.isAuthenticated && state.user && state.user.email)
      if (!isAuth && pathname !== "/login") {
        router.replace("/login")
      } else if (isAuth && pathname === "/login") {
        router.replace("/feature/dashboard")
      }
    }
  }, [isAuthenticated, user, pathname, router, isMounted])

  // Don't render anything until mounted to prevent hydration errors with zustand persist
  if (!isMounted) return null

  // If on login page and not authenticated, render children (the login page)
  if (pathname === "/login") return <>{children}</>

  // If not authenticated, don't render protected children
  if (!isAuthenticated || !user) return null

  // Authenticated and not on login page, render protected children
  return <>{children}</>
}
