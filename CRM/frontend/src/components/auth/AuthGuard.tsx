"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"

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
      const state = useAuthStore.getState()
      if (state.isAuthenticated && state.user?.email) {
        try {
          const rawDeleted = localStorage.getItem("saampark_deleted_user_emails")
          const deletedEmails: string[] = rawDeleted ? JSON.parse(rawDeleted) : []
          if (deletedEmails.includes(state.user.email.toLowerCase().trim())) {
            state.logout()
            router.replace("/login")
            return
          }

          // Sync permissions from MySQL backend API across all pages
          const { getUsers } = await import("@/app/feature/users/services/userService")
          await getUsers()
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
      if (!isAuthenticated && pathname !== "/login") {
        router.replace("/login")
      } else if (isAuthenticated && pathname === "/login") {
        router.replace("/feature/dashboard")
      }
    }
  }, [isAuthenticated, pathname, router, isMounted])

  // Don't render anything until mounted to prevent hydration errors with zustand persist
  if (!isMounted) return null

  // If on login page and not authenticated, render children (the login page)
  if (pathname === "/login") return <>{children}</>

  // If not authenticated, don't render protected children
  if (!isAuthenticated) return null

  // Authenticated and not on login page, render protected children
  return <>{children}</>
}
