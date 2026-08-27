"use client"

import * as React from "react"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { useUIStore } from "@/store/useUIStore"
import { usePathname } from "next/navigation"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useUIStore()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (pathname === "/login" || pathname?.startsWith("/public/") || pathname?.startsWith("/verify-invoice")) {
    return <>{children}</>
  }

  const leftPadding = isMobile ? 0 : (isSidebarCollapsed ? 64 : 256)

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden w-full">
      {/* Background Ambient Mesh/Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-info/5 blur-[120px]" />
      </div>

      <Sidebar />
      <Topbar />

      <main
        style={{ paddingLeft: leftPadding }}
        className="relative pt-16 min-h-screen transition-[padding-left] duration-300 ease-in-out w-full min-w-0"
      >
        <div className="p-2.5 sm:p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto w-full min-w-0 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}
