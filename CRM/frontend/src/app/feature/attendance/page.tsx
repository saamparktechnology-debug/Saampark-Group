"use client"

import * as React from "react"
import { Calendar, Clock, Sparkles } from "lucide-react"
import MonthlyAttendanceMatrix from "./components/MonthlyAttendanceMatrix"
import TeamTimecardsPage from "../team/timecards/page"

export default function AttendancePage() {
  const [activeTab, setActiveTab] = React.useState<"matrix" | "daily">("matrix")

  return (
    <div className="space-y-6 max-w-[1550px] mx-auto p-4 sm:p-6 pb-24 font-sans">
      {/* Top View Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 sm:px-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <button
              onClick={() => setActiveTab("matrix")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "matrix"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly Attendance Sheet (Matrix)</span>
            </button>

            <button
              onClick={() => setActiveTab("daily")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "daily"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Daily Shift Logs & Punch Clock</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Synced with Leaves & Bio-Timecards</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "matrix" ? (
        <MonthlyAttendanceMatrix />
      ) : (
        <TeamTimecardsPage />
      )}
    </div>
  )
}
