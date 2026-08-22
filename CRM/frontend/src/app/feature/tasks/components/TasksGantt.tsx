"use client"

import * as React from "react"
import { Task } from "../types"
import { Calendar, Plus } from "lucide-react"

interface TasksGanttProps {
  tasks: Task[]
  activeViewTab: "list" | "kanban" | "gantt"
  onChangeViewTab: (tab: "list" | "kanban" | "gantt") => void
  onOpenAddModal: () => void
}

export function TasksGantt({
  tasks = [],
  activeViewTab = "gantt",
  onChangeViewTab,
  onOpenAddModal,
}: TasksGanttProps) {
  const months = ["Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"]

  const uniqueTasks = React.useMemo(() => {
    const list = tasks || []
    const seen = new Set<string>()
    return list.filter((t) => {
      if (!t || !t.id) return false
      const normId = String(t.id).toLowerCase().trim()
      if (seen.has(normId)) return false
      seen.add(normId)
      return true
    })
  }, [tasks])

  return (
    <div className="space-y-4">
      {/* Top Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-6 text-sm font-medium">
          <span className="text-zinc-400 font-semibold cursor-default">Tasks</span>
          <button
            type="button"
            onClick={() => onChangeViewTab("list")}
            className="pb-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            List
          </button>
          <button
            type="button"
            onClick={() => onChangeViewTab("kanban")}
            className="pb-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => onChangeViewTab("gantt")}
            className="pb-1 text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600 transition-colors"
          >
            Gantt
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={14} />
          <span>Add task</span>
        </button>
      </div>

      {/* Gantt Timeline View */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <Calendar size={14} className="text-blue-600" />
            <span>Interactive Task Timeline</span>
          </div>
          <div className="flex items-center gap-2">
            {months.map((m) => (
              <span key={m} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded text-xs font-medium">
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {uniqueTasks.slice(0, 10).map((t, index) => {
            const widthPct = 30 + (index * 7) % 50
            const offsetPct = (index * 12) % 40

            return (
              <div key={t.id} className="grid grid-cols-12 items-center gap-2 text-xs py-1">
                <div className="col-span-4 font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  <span className="text-zinc-400 font-mono mr-2">{t.id}</span>
                  <span>{t.title}</span>
                </div>
                <div className="col-span-8 bg-zinc-100 dark:bg-zinc-800/60 h-7 rounded-lg relative overflow-hidden flex items-center px-2">
                  <div
                    style={{ left: `${offsetPct}%`, width: `${widthPct}%` }}
                    className="absolute top-1 bottom-1 rounded bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-semibold flex items-center px-2 shadow-xs truncate"
                  >
                    {t.deadline}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
