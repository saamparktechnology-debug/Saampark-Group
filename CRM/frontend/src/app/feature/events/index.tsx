"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { CalendarSidebar } from "./components/CalendarSidebar"
import { CalendarRightPanel } from "./components/CalendarRightPanel"
import { CalendarToolbar } from "./components/CalendarToolbar"
import { CalendarView } from "./components/CalendarView"
import { EventModal } from "./components/EventModal"
import { EventDrawer } from "./components/EventDrawer"

export default function EventsMain() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-8rem)]" // Fill available height minus topbar/padding
    >
      <div className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">Manage events, meetings, and deadlines across your organization.</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0 mt-4">
        {/* Left Filter Sidebar */}
        <CalendarSidebar />

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <CalendarToolbar />
          <div className="flex-1 min-h-0 relative z-0">
            <CalendarView />
          </div>
        </div>

        {/* Right Info Panel */}
        <CalendarRightPanel />
      </div>

      {/* Global Overlays */}
      <EventModal />
      <EventDrawer />
    </motion.div>
  )
}
