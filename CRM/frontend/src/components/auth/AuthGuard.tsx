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

    if (!isAuth && pathname !== "/login") {
      router.replace("/login")
    } else if (isAuth && pathname === "/login") {
      router.replace("/feature/dashboard")
    }
  }, [isAuthenticated, user, pathname, router, isMounted])

  // Explicit session revocation listener (triggered only when an admin explicitly deletes this active user)
  React.useEffect(() => {
    if (!isMounted) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "saampark_session_revoked" && e.newValue) {
        const state = useAuthStore.getState()
        if (state.user?.email) {
          const currentEmail = state.user.email.toLowerCase().trim()
          const revokedMsg = e.newValue.toLowerCase().trim()
          if (revokedMsg.includes(currentEmail)) {
            console.warn("Session revoked by Admin for current user:", currentEmail)
            state.logout()
            router.replace("/login")
          }
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [isMounted, router])

  // Prevent rendering protected content before hydration completes
  if (!isMounted) return null

  // If on login page, allow rendering login screen
  if (pathname === "/login") return <>{children}</>

  // If not authenticated and not on login page, render nothing while redirecting
  if (!isAuthenticated || !user) return null

  // Authenticated user on protected page
  return <>{children}</>
}
