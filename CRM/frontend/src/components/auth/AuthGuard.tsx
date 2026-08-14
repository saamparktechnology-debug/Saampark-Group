"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()
  
  // Hydration state check to prevent flash of content
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

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
