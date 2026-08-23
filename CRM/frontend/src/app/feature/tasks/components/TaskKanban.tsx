"use client"

import * as React from "react"
import {
  Plus,
  Filter,
  Search,
  RotateCw,
  ArrowUpCircle,
  AlertCircle,
  ArrowDownCircle,
} from "lucide-react"
import { Task, TaskStatus } from "../types"
import { taskService } from "../services/taskService"

interface TaskKanbanProps {
  tasks: Task[]
  activeViewTab: "list" | "kanban" | "gantt"
  onChangeViewTab: (tab: "list" | "kanban" | "gantt") => void
  onOpenAddModal: () => void
  onSelectTask: (task: Task) => void
  onTaskUpdated: (updatedTask: Task) => void
}

const KANBAN_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "To do", title: "To Do", color: "border-amber-400" },
  { id: "In progress", title: "In progress", color: "border-blue-500" },
  { id: "Review", title: "Review", color: "border-purple-500" },
  { id: "Done", title: "Done", color: "border-emerald-500" },
]

const labelBadgeStyles: Record<string, string> = {
  Design: "bg-emerald-500 text-white dark:bg-emerald-600",
  Feedback: "bg-fuchsia-600 text-white dark:bg-fuchsia-700",
  Enhancement: "bg-blue-500 text-white dark:bg-blue-600",
  Bug: "bg-rose-500 text-white dark:bg-rose-600",
}

export function TaskKanban({
  tasks = [],
  activeViewTab = "kanban",
  onChangeViewTab,
  onOpenAddModal,
  onSelectTask,
  onTaskUpdated,
}: TaskKanbanProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilterPill, setActiveFilterPill] = React.useState("All tasks")
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null)

  const filteredTasks = React.useMemo(() => {
    const list = tasks || []
    const seen = new Set<string>()
    const uniqueList = list.filter((t) => {
      if (!t || !t.id) return false
      const normId = String(t.id).toLowerCase().trim()
      if (seen.has(normId)) return false
      seen.add(normId)
      return true
    })

    return uniqueList.filter((t) => {
      const titleStr = t.title || ""
      const relStr = t.relatedTo || ""
      const assignStr = t.assignedTo || ""
      const idStr = String(t.id || "")

      const matchesSearch =
        titleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        relStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idStr.includes(searchQuery)

      if (activeFilterPill === "All tasks" || activeFilterPill === "My tasks" || activeFilterPill === "Recently updated") {
        return matchesSearch
      }

      if (activeFilterPill === "Bug") {
        return matchesSearch && (t.labels || []).includes("Bug")
      }

      if (activeFilterPill === "exclamation") {
        return matchesSearch && (t.priorityIcon === "exclamation" || t.priority === "Urgent")
      }

      if (activeFilterPill === "up") {
        return matchesSearch && (t.priorityIcon === "up" || t.priority === "High")
      }

      return matchesSearch
    })
  }, [tasks, searchQuery, activeFilterPill])

  // Drag & drop handlers
  const handleDragStart = (id: string) => {
    setDraggedTaskId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (newStatus: TaskStatus) => {
    if (!draggedTaskId) return
    const idToUpdate = draggedTaskId
    setDraggedTaskId(null)

    const targetTask = tasks.find(
      (t) => String(t.id).toLowerCase().trim() === String(idToUpdate).toLowerCase().trim()
    )

    if (targetTask && targetTask.status !== newStatus) {
      // 1. Optimistically update local UI state immediately
      const optimisticTask: Task = { ...targetTask, status: newStatus }
      onTaskUpdated(optimisticTask)

      // 2. Asynchronously persist to MySQL DB & cache
      try {
        const updated = await taskService.updateTask(idToUpdate, { status: newStatus })
        onTaskUpdated(updated)
      } catch (err) {
        console.error("Error updating task status on drop:", err)
      }
    }
  }

  return (
    <div className="space-y-4">
      
      {/* ---------------- TOP VIEW TABS & HEADER ACTIONS (Screenshot 2 Match) ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        {/* Left View Tabs */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <span className="text-zinc-400 font-semibold cursor-default">Tasks</span>
          <button
            type="button"
            onClick={() => onChangeViewTab("list")}
            className={`pb-1 transition-colors ${
              activeViewTab === "list"
                ? "text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => onChangeViewTab("kanban")}
            className={`pb-1 transition-colors ${
              activeViewTab === "kanban"
                ? "text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => onChangeViewTab("gantt")}
            className={`pb-1 transition-colors ${
              activeViewTab === "gantt"
                ? "text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Gantt
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors shadow-2xs"
          >
            <Plus size={13} className="text-zinc-500" />
            <span>Add multiple tasks</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Add task</span>
          </button>
        </div>
      </div>

      {/* ---------------- SECOND CONTROL TOOLBAR (Screenshot 2 Match) ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-2.5 shadow-2xs">
        
        {/* Left Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50"
            title="Refresh"
          >
            <RotateCw size={14} />
          </button>

          {/* Filters Button */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <Filter size={13} className="text-zinc-500" />
            <span>Filters</span>
            <span className="text-[10px] ml-0.5 text-zinc-400">▼</span>
          </button>

          {/* Plus Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50"
          >
            <Plus size={14} />
          </button>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs ml-1 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFilterPill("All tasks")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilterPill === "All tasks"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              All tasks
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterPill("Bug")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilterPill === "Bug"
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              Bug
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterPill("exclamation")}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                activeFilterPill === "exclamation"
                  ? "bg-purple-100 text-purple-600"
                  : "text-zinc-400 hover:bg-zinc-100"
              }`}
              title="Urgent Priority"
            >
              <AlertCircle size={15} className="text-purple-600" />
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterPill("up")}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                activeFilterPill === "up"
                  ? "bg-amber-100 text-amber-600"
                  : "text-zinc-400 hover:bg-zinc-100"
              }`}
              title="High Priority"
            >
              <ArrowUpCircle size={15} className="text-amber-500" />
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterPill("My tasks")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilterPill === "My tasks"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              My tasks
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterPill("Recently updated")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilterPill === "Recently updated"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              Recently updated
            </button>
          </div>
        </div>

        {/* Right Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-44 sm:w-56 pl-3 pr-8 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
          />
          <Search size={13} className="absolute right-2.5 top-2 text-zinc-400" />
        </div>

      </div>

      {/* ---------------- 4 KANBAN STAGE COLUMNS (Screenshot 2 Match) ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const columnTasks = filteredTasks.filter((t) => t.status === col.id)

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
              className="bg-zinc-50/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex flex-col min-h-[620px] overflow-hidden shadow-2xs"
            >
              {/* Column Header */}
              <div className={`p-3 bg-white dark:bg-zinc-900 border-t-2 ${col.color} border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between`}>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {col.title}
                </span>
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  {columnTasks.length}
                </span>
              </div>

              {/* Cards Container (Screenshot 2 Design) */}
              <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[75vh]">
                {columnTasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => handleDragStart(t.id)}
                    onClick={() => onSelectTask(t)}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/80 rounded-xl p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2.5 relative"
                  >
                    {/* Header: User Avatar + Task ID. Title */}
                    <div className="flex items-start gap-2">
                      <img
                        src={
                          t.assignedToAvatar ||
                          `https://api.dicebear.com/7.x/notionists/svg?seed=${t.assignedTo.replace(/\s/g, "")}`
                        }
                        alt={t.assignedTo}
                        className="w-5 h-5 rounded-full border border-zinc-200 object-cover shrink-0 mt-0.5"
                      />
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 leading-snug">
                        {t.id}. {t.title}
                      </span>
                    </div>

                    {/* Bottom Row: Priority Icon & Label Badges */}
                    {(t.priorityIcon !== "none" || (t.labels && t.labels.length > 0)) && (
                      <div className="flex items-center gap-2 pt-1">
                        {/* Priority Icon */}
                        {t.priorityIcon === "up" && (
                          <ArrowUpCircle size={15} className="text-amber-500 shrink-0" />
                        )}
                        {t.priorityIcon === "exclamation" && (
                          <AlertCircle size={15} className="text-purple-600 shrink-0" />
                        )}
                        {t.priorityIcon === "down" && (
                          <ArrowDownCircle size={15} className="text-blue-400 shrink-0" />
                        )}

                        {/* Label Badge */}
                        {t.labels && t.labels.map((lbl) => (
                          <span
                            key={lbl}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              labelBadgeStyles[lbl] || "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="p-4 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    No tasks in {col.title}
                  </div>
                )}
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}
