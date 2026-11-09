"use client"

import * as React from "react"
import { 
  CheckCircle2, Clock, AlertCircle, CalendarOff, 
  Sparkles, Coffee, XCircle, PlaneTakeoff, Info
} from "lucide-react"

export default function AttendanceTypeLegend() {
  const items = [
    {
      label: "Holiday",
      icon: Sparkles,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60",
      desc: "Company / Public Holiday"
    },
    {
      label: "Day Off",
      icon: Coffee,
      color: "text-slate-500 bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700",
      desc: "Sunday / Scheduled Weekend"
    },
    {
      label: "Present",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
      desc: "Full Day Completed (>=7.5 hrs)"
    },
    {
      label: "Half Day",
      icon: Clock,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60",
      desc: "Worked 3.5 - 7.5 hrs"
    },
    {
      label: "Late",
      icon: AlertCircle,
      color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60",
      desc: "Clocked In After 09:45 AM"
    },
    {
      label: "Absent",
      icon: XCircle,
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60",
      desc: "No punch and no approved leave"
    },
    {
      label: "On Leave",
      icon: PlaneTakeoff,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60",
      desc: "Approved in Leave Management"
    }
  ]

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium shrink-0">
          <Info className="w-4 h-4 text-indigo-500" />
          <span>Status Legend:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div 
                key={item.label}
                title={item.desc}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 font-medium transition-all hover:scale-105 select-none"
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border shadow-2xs ${item.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
