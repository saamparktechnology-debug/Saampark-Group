"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { syncGlobalDeletedIds } from "@/lib/storageSync"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()

  const [isMounted, setIsMounted] = React.useState(false)

  // Track when user last authenticated to avoid immediately re-verifying
  const loginTimestampRef = React.useRef<number>(0)
  // Track consecutive DB-failures before forcing logout
  const failureCountRef = React.useRef(0)
  const MAX_FAILURES = 3
  // Grace period after login: don't run session verify for 10 seconds
  const LOGIN_GRACE_MS = 10000

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Record login time whenever auth state becomes true
  React.useEffect(() => {
    if (isAuthenticated) {
      loginTimestampRef.current = Date.now()
      failureCountRef.current = 0 // reset failure count on fresh login
    }
  }, [isAuthenticated])

  // Simple redirect effect — runs immediately on auth state change
  React.useEffect(() => {
    if (!isMounted) return
    const state = useAuthStore.getState()
    const isAuth = Boolean(state.isAuthenticated && state.user && state.user.email)
    if (!isAuth && pathname !== "/login") {
      router.replace("/login")
    } else if (isAuth && pathname === "/login") {
      router.replace("/feature/dashboard")
    }
  }, [isAuthenticated, user, pathname, router, isMounted])

  // Background session verification — runs every 30s, with grace period after login
  React.useEffect(() => {
    if (!isMounted) return

    const verifySession = async () => {
      // Never verify on login page itself
      if (pathname === "/login") return

      // Don't verify during login grace period
      if (Date.now() - loginTimestampRef.current < LOGIN_GRACE_MS) return

      await syncGlobalDeletedIds().catch(() => {})

      const state = useAuthStore.getState()
      if (!state.isAuthenticated || !state.user?.email) return

      const emailNorm = state.user.email.toLowerCase().trim()

      // Block obsolete demo accounts
      const demoEmails = ["superadmin@saampark.in", "admin@tech.saampark.in", "team@saampark.in", "client@acme.com", "user@saampark.in"]
      if (demoEmails.includes(emailNorm)) {
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

      // Network check: verify user still exists — only force logout after MAX_FAILURES
      try {
        const { getUsers } = await import("@/app/feature/users/services/userService")
        const liveUsers = await getUsers()

        if (Array.isArray(liveUsers) && liveUsers.length > 0) {
          const exists = liveUsers.some((u) => u.email.toLowerCase().trim() === emailNorm)
          if (!exists) {
            failureCountRef.current += 1
            if (failureCountRef.current >= MAX_FAILURES) {
              console.warn("Session revoked: user deleted.")
              state.logout()
              router.replace("/login")
            }
          } else {
            failureCountRef.current = 0
          }
        }
        // If empty list: skip (transient error, don't log out)
      } catch (e) {
        console.warn("Session check error (will retry):", e)
      }
    }

    const storageHandler = () => verifySession()
    window.addEventListener("storage", storageHandler)
    const interval = setInterval(verifySession, 30000)

    return () => {
      window.removeEventListener("storage", storageHandler)
      clearInterval(interval)
    }
  }, [isMounted, pathname, router])

  if (!isMounted) return null
  if (pathname === "/login") return <>{children}</>
  if (!isAuthenticated || !user) return null
  return <>{children}</>
}
