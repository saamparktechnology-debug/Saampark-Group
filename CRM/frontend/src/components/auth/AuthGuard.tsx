"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"

import { syncGlobalDeletedIds } from "@/lib/storageSync"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuthStore()
  
  // Hydration state check to prevent flash of content
  const [isMounted, setIsMounted] = React.useState(false)

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
      if (state.isAuthenticated && state.user?.email) {
        try {
          const rawDeleted = localStorage.getItem("saampark_deleted_user_emails")
          const deletedEmails: string[] = rawDeleted ? JSON.parse(rawDeleted) : []
          const emailNorm = state.user.email.toLowerCase().trim()

          if (deletedEmails.includes(emailNorm)) {
            state.logout()
            router.replace("/login")
            return
          }

          // Sync permissions and verify user exists in live database
          const { getUsers } = await import("@/app/feature/users/services/userService")
          const liveUsers = await getUsers()
          const exists = liveUsers.some((u) => u.email.toLowerCase().trim() === emailNorm)

          if (!exists) {
            console.warn("Session revoked: User account deleted or non-existent.")
            state.logout()
            router.replace("/login")
            return
          }
        } catch (e) {
          console.warn("Session verification error:", e)
        }
      }
    }



    verifyActiveSessionAndSyncPermissions()

    const handleStorageChange = () => {
      verifyActiveSessionAndSyncPermissions()
    }

    window.addEventListener("storage", handleStorageChange)
    const interval = setInterval(verifyActiveSessionAndSyncPermissions, 3000)

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

