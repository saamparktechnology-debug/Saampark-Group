"use client"

import * as React from "react"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { useUIStore } from "@/store/useUIStore"
import { usePathname } from "next/navigation"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useUIStore()
  const pathname = usePathname()

  if (pathname === "/login") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Ambient Mesh/Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-info/5 blur-[120px]" />
      </div>

      <Sidebar />
      <Topbar />

      <main
        style={{ paddingLeft: isSidebarCollapsed ? 64 : 256 }}
        className="relative z-10 pt-16 min-h-screen transition-[padding-left] duration-300 ease-in-out"
      >
        <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
