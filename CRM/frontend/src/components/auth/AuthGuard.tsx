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

  // Standard client-side Auth Routing
  React.useEffect(() => {
    if (!isMounted) return

    const state = useAuthStore.getState()
    const isAuth = Boolean(state.isAuthenticated && state.user && state.user.email)
    const isPublicPage = pathname === "/login" || pathname?.startsWith("/public/") || pathname?.startsWith("/verify-invoice")

    if (!isAuth && !isPublicPage) {
      router.replace("/login")
    } else if (isAuth && pathname === "/login") {
      router.replace("/feature/dashboard")
    }
  }, [isAuthenticated, user, pathname, router, isMounted])

  // Explicit session revocation & Inactive account status listener
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
