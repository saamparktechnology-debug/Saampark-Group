"use client"

import * as React from "react"
import {
  Heart,
  Upload,
  Plus,
  Filter,
  Search,
  RotateCw,
  FileSpreadsheet,
  Printer,
  Edit2,
  Trash2,
  ArrowUpCircle,
  AlertCircle,
  ArrowDownCircle,
  Columns,
} from "lucide-react"
import { Task, TaskStatus } from "../types"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

interface TaskListProps {
  tasks: Task[]
  activeViewTab: "list" | "kanban" | "gantt"
  onChangeViewTab: (tab: "list" | "kanban" | "gantt") => void
  onOpenAddModal: () => void
  onSelectTask: (task: Task) => void
  onDeleteTask: (id: string) => void
  onUpdateTaskStatus?: (id: string, newStatus: TaskStatus) => void
  onOpenManageLabels: () => void
}

const statusBadgeStyles: Record<TaskStatus, string> = {
  "To do": "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "In progress": "bg-blue-600 text-white dark:bg-blue-600 dark:text-white border-blue-600",
  "Review": "bg-fuchsia-700 text-white dark:bg-fuchsia-700 dark:text-white border-fuchsia-700",
  "Done": "bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white border-emerald-600",
}

const labelBadgeStyles: Record<string, string> = {
  Design: "bg-emerald-500 text-white dark:bg-emerald-600",
  Feedback: "bg-fuchsia-600 text-white dark:bg-fuchsia-700",
  Enhancement: "bg-blue-500 text-white dark:bg-blue-600",
  Bug: "bg-rose-500 text-white dark:bg-rose-600",
}

export function TaskList({
  tasks = [],
  activeViewTab = "list",
  onChangeViewTab,
  onOpenAddModal,
  onSelectTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onOpenManageLabels,
}: TaskListProps) {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAddTask = canPerformAction(user, "Tasks", "add")
  const canEditTask = canPerformAction(user, "Tasks", "edit")
  const canDeleteTask = canPerformAction(user, "Tasks", "delete")

  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilterPill, setActiveFilterPill] = React.useState("All tasks")
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([])

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id))
    }
  }

  const toggleSelectRow = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter((item) => item !== id))
    } else {
      setSelectedTaskIds([...selectedTaskIds, id])
    }
  }

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

      if (activeFilterPill === "All tasks" || activeFilterPill === "My Tasks" || activeFilterPill === "Recently Updated") {
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

  return (
    <div className="space-y-4">
      
      {/* ---------------- TOP VIEW TABS & HEADER ACTIONS (Screenshot 1 Match) ---------------- */}
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenManageLabels}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors shadow-2xs"
          >
            <Heart size={13} className="text-zinc-500" />
            <span>Manage labels</span>
          </button>

          <button
            type="button"
            onClick={() => alert("Import tasks clicked")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors shadow-2xs"
          >
            <Upload size={13} className="text-zinc-500" />
            <span>Import tasks</span>
          </button>

          {canAddTask && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors shadow-2xs"
            >
              <Plus size={13} className="text-zinc-500" />
              <span>Add multiple tasks</span>
            </button>
          )}

          {canAddTask && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span>Add task</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- SECOND CONTROL TOOLBAR (Screenshot 1 Match) ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-2.5 shadow-2xs">
        
        {/* Left Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Columns Toggle Button */}
          <button
            type="button"
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50"
            title="Columns"
          >
            <Columns size={14} />
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
              onClick={() => setActiveFilterPill("My Tasks")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilterPill === "My Tasks"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              My Tasks
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterPill("Recently Updated")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilterPill === "Recently Updated"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              Recently Updated
            </button>
          </div>
        </div>

        {/* Right Search & Export Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert("Export to Excel")}
            className="px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
          >
            Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
          >
            Print
          </button>

          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 sm:w-52 pl-3 pr-8 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
            <Search size={13} className="absolute right-2.5 top-2 text-zinc-400" />
          </div>
        </div>

      </div>

      {/* ---------------- TABLE DATA (Screenshot 1 Match) ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Table Header */}
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-zinc-300 text-blue-600"
                  />
                </th>
                <th className="py-3 px-3 font-semibold text-zinc-600 dark:text-zinc-300">ID</th>
                <th className="py-3 px-3 font-semibold text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-1">
                    <span>↓</span>
                    <span>Title</span>
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold text-zinc-600 dark:text-zinc-300">Start date</th>
                <th className="py-3 px-3 font-semibold text-zinc-600 dark:text-zinc-300">Deadline</th>
                <th className="py-3 px-3 font-semibold text-zinc-600 dark:text-zinc-300">Milestone</th>
                <th className="py-3 px-3 font-semibold text-zinc-600 dark:text-zinc-300">Related to</th>
                <th className="py-3 px-3 font-semibold text-zinc-600 dark:text-zinc-300">Assigned to</th>
                <th className="py-3 px-3 font-semibold text-zinc-600 dark:text-zinc-300">Collaborators</th>
                <th className="py-3 px-3 font-semibold text-zinc-600 dark:text-zinc-300">Status</th>
                <th className="py-3 px-3 w-16 text-center">≡</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredTasks.map((t) => {
                const isSelected = selectedTaskIds.includes(t.id)

                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors ${
                      isSelected ? "bg-blue-50/30 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(t.id)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 text-blue-600"
                      />
                    </td>

                    {/* ID */}
                    <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">
                      {t.id}
                    </td>

                    {/* Title with priority icons & label pills */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => onSelectTask(t)}
                            className="font-medium text-zinc-800 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                          >
                            {t.title}
                          </span>

                          {/* Priority Icon Beside Title */}
                          {t.priorityIcon === "up" && (
                            <ArrowUpCircle size={14} className="text-amber-500 shrink-0" />
                          )}
                          {t.priorityIcon === "exclamation" && (
                            <AlertCircle size={14} className="text-purple-600 shrink-0" />
                          )}
                          {t.priorityIcon === "down" && (
                            <ArrowDownCircle size={14} className="text-zinc-400 shrink-0" />
                          )}
                        </div>

                        {/* Label Badges Below Title */}
                        {t.labels && t.labels.length > 0 && (
                          <div className="flex items-center gap-1">
                            {t.labels.map((lbl) => (
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
                    </td>

                    {/* Start Date */}
                    <td className="py-3 px-3 text-zinc-400 font-mono">
                      {t.startDate || "-"}
                    </td>

                    {/* Deadline (Red font text as in screenshot 1) */}
                    <td className="py-3 px-3 font-mono font-medium text-rose-500 dark:text-rose-400">
                      {t.deadline}
                    </td>

                    {/* Milestone */}
                    <td className="py-3 px-3 text-zinc-600 dark:text-zinc-300">
                      {t.milestone || "-"}
                    </td>

                    {/* Related to (Blue Clickable Link) */}
                    <td className="py-3 px-3">
                      {t.relatedTo ? (
                        <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                          {t.relatedTo}
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>

                    {/* Assigned to */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            t.assignedToAvatar ||
                            `https://api.dicebear.com/7.x/notionists/svg?seed=${t.assignedTo.replace(/\s/g, "")}`
                          }
                          alt={t.assignedTo}
                          className="w-5 h-5 rounded-full border border-zinc-200 object-cover shrink-0"
                        />
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                          {t.assignedTo}
                        </span>
                      </div>
                    </td>

                    {/* Collaborators */}
                    <td className="py-3 px-3 text-zinc-400">
                      {t.collaborators || "-"}
                    </td>

                    {/* Status Badge with Quick Status Switcher */}
                    <td className="py-3 px-3">
                      {canEditTask && onUpdateTaskStatus ? (
                        <select
                          value={t.status}
                          onChange={(e) => onUpdateTaskStatus(t.id, e.target.value as TaskStatus)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                            statusBadgeStyles[t.status] || "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          <option value="To do" className="bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">To do</option>
                          <option value="In progress" className="bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">In progress</option>
                          <option value="Review" className="bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">Review</option>
                          <option value="Done" className="bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">Done</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                            statusBadgeStyles[t.status] || "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {t.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-zinc-400">
                        {canEditTask && (
                          <button
                            type="button"
                            onClick={() => onSelectTask(t)}
                            className="hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded transition-colors"
                            title="Edit Task"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {canDeleteTask && (
                          <button
                            type="button"
                            onClick={() => onDeleteTask(t.id)}
                            className="hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-zinc-400">
                    No tasks found matching query.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  )
}
