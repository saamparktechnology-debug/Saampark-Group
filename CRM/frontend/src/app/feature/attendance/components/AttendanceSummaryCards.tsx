"use client"

import * as React from "react"
import { Users, CheckCircle2, PlaneTakeoff, Clock, AlertTriangle } from "lucide-react"

interface AttendanceSummaryCardsProps {
  totalEmployees: number
  presentToday: number
  onLeaveToday: number
  lateToday: number
  halfDayToday: number
  monthTotalHours: string
}

export default function AttendanceSummaryCards({
  totalEmployees,
  presentToday,
  onLeaveToday,
  lateToday,
  halfDayToday,
  monthTotalHours
}: AttendanceSummaryCardsProps) {
  const cards = [
    {
      label: "Total Employees",
      value: totalEmployees,
      subtext: "Tracked in active sheet",
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60"
    },
    {
      label: "Present Today",
      value: presentToday,
      subtext: "Clocked in / active",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60"
    },
    {
      label: "On Approved Leave",
      value: onLeaveToday,
      subtext: "HR leave sanctioned",
      icon: PlaneTakeoff,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60"
    },
    {
      label: "Late / Half Day",
      value: lateToday + halfDayToday,
      subtext: `${lateToday} Late, ${halfDayToday} Half Day`,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60"
    },
    {
      label: "Month Worked Hours",
      value: monthTotalHours,
      subtext: "Total team cumulative",
      icon: AlertTriangle,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60"
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {card.label}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-2xs ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {card.value}
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                {card.subtext}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

