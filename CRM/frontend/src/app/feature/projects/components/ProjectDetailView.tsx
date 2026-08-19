"use client"

import * as React from "react"
import {
  ArrowLeft,
  Star,
  Clock,
  Settings,
  Zap,
  Play,
  Pause,
  Plus,
  Filter,
  Search,
  ChevronRight,
  Mail,
  X,
  MoreVertical,
  Layers,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Project } from "../types"

interface ProjectDetailViewProps {
  projects: Project[]
  selectedProject: Project
  onSelectProject: (project: Project) => void
  onBackToTable: () => void
  onOpenEditModal: (project: Project) => void
}

const DONUT_COLORS = {
  todo: "#F59E0B",       // Orange
  inProgress: "#06B6D4", // Teal
  review: "#8B5CF6",     // Purple
  done: "#10B981",       // Green
}

export function ProjectDetailView({
  projects,
  selectedProject,
  onSelectProject,
  onBackToTable,
  onOpenEditModal,
}: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = React.useState("Overview")
  const [isStarred, setIsStarred] = React.useState(selectedProject.starred || false)
  const [isTimerRunning, setIsTimerRunning] = React.useState(false)
  const [timerSeconds, setTimerSeconds] = React.useState(0)
  const [leftSearch, setLeftSearch] = React.useState("")
  const [leftFilter, setLeftFilter] = React.useState("All")
  const [currentPage, setCurrentPage] = React.useState(1)

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600).toString().padStart(2, "0")
    const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0")
    const secs = (totalSec % 60).toString().padStart(2, "0")
    return `${hrs}:${mins}:${secs}`
  }

  // Left sidebar filtering
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(leftSearch.toLowerCase()) ||
      p.client.toLowerCase().includes(leftSearch.toLowerCase())
    if (leftFilter === "Completed") return matchesSearch && p.status === "Completed"
    if (leftFilter === "High Priority") return matchesSearch && p.labels.includes("Urgent")
    return matchesSearch
  })

  // Chart data for task breakdown
  const taskData = [
    { name: "To do", value: selectedProject.taskBreakdown?.todo || 2, color: DONUT_COLORS.todo },
    { name: "In progress", value: selectedProject.taskBreakdown?.inProgress || 4, color: DONUT_COLORS.inProgress },
    { name: "Review", value: selectedProject.taskBreakdown?.review || 1, color: DONUT_COLORS.review },
    { name: "Done", value: selectedProject.taskBreakdown?.done || 3, color: DONUT_COLORS.done },
  ]

  const navTabs = [
    "Overview",
    "Tasks List",
    "Tasks Kanban",
    "Milestones",
    "Gantt",
    "Notes",
    "Files",
    "Comments",
    "Timesheets",
    "Expenses",
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[85vh] bg-zinc-50 dark:bg-zinc-950 p-1 rounded-xl">
      
      {/* ---------------- LEFT PANEL: Project Navigation ---------------- */}
      <div className="w-full lg:w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-sm shrink-0">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onBackToTable}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Projects</span>
          </button>
          <button type="button" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1">
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Filters & Add Bar */}
        <div className="p-3 space-y-2.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs text-zinc-700 dark:text-zinc-300 font-medium"
              >
                <span className="flex items-center gap-1.5">
                  <Filter size={13} className="text-zinc-400" />
                  Filters
                </span>
                <span className="text-[10px]">▼</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => alert("Quick add project action")}
              className="p-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            {["All", "Completed", "High Priority"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setLeftFilter(f)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  leftFilter === f
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                }`}
              >
                {f === "All" ? "All projects" : f}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search"
              value={leftSearch}
              onChange={(e) => setLeftSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder-zinc-400"
            />
          </div>
        </div>

        {/* Vertical Project List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/50">
          {filteredProjects.map((p) => {
            const isSelected = p.id === selectedProject.id
            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p)}
                className={`flex items-start gap-2 p-3 text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white font-medium shadow-sm"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <ChevronRight size={14} className={`mt-0.5 shrink-0 ${isSelected ? "text-white" : "text-zinc-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{p.title}</div>
                  {p.client !== "-" && (
                    <div className={`text-[11px] truncate ${isSelected ? "text-blue-100" : "text-zinc-400"}`}>
                      {p.client}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : p.status === "Completed"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {p.status}
                    </span>

                    {p.labels.map((lbl) => (
                      <span
                        key={lbl}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : lbl === "Urgent"
                            ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                            : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination at bottom left */}
        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="disabled:opacity-30 hover:text-zinc-600"
          >
            &lt;
          </button>
          <span>{currentPage}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="hover:text-zinc-600"
          >
            2 &gt;
          </button>
        </div>
      </div>

      {/* ---------------- RIGHT PANEL: Project Main Detail Canvas ---------------- */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-sm">
        
        {/* Top Title & Action Bar */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-zinc-500" />
            <h1 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              {selectedProject.title}
            </h1>
            <button
              type="button"
              onClick={() => setIsStarred(!isStarred)}
              className="text-amber-400 hover:scale-110 transition-transform ml-1"
            >
              <Star size={16} fill={isStarred ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Action buttons matching Image 5 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => alert("Reminders clicked")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 transition-colors"
            >
              <Clock size={13} className="text-zinc-500" />
              <span>Reminders</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenEditModal(selectedProject)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 transition-colors"
            >
              <Settings size={13} className="text-zinc-500" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={() => alert("Actions dropdown clicked")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
            >
              <Zap size={13} />
              <span>Actions</span>
              <span className="text-[10px] ml-0.5">▼</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-md transition-colors shadow-sm ${
                isTimerRunning ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {isTimerRunning ? <Pause size={13} /> : <Play size={13} />}
              <span>{isTimerRunning ? `Timer: ${formatTimer(timerSeconds)}` : "🟢 Start timer"}</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-6 px-4 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto no-scrollbar text-xs font-medium text-zinc-500">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-3 whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "border-transparent hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Canvas Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "Overview" ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left & Middle Columns (2/3 width) */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Top Row Grid: Gauge + Donut Chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Gauge Card */}
                  <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col items-center justify-between">
                    <div className="relative w-36 h-36 flex items-center justify-center my-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-zinc-100 dark:text-zinc-700 stroke-current"
                          strokeWidth="3.5"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-500 stroke-current"
                          strokeWidth="3.5"
                          strokeDasharray={`${selectedProject.progress}, 100`}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-2xl font-bold text-zinc-700 dark:text-zinc-200">
                        {selectedProject.progress}%
                      </span>
                    </div>

                    <div className="w-full space-y-1.5 pt-4 text-xs text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
                      <div><strong className="text-zinc-700 dark:text-zinc-300">Start date:</strong> {selectedProject.startDate}</div>
                      <div><strong className="text-zinc-700 dark:text-zinc-300">Deadline:</strong> {selectedProject.deadline}</div>
                      <div><strong className="text-zinc-700 dark:text-zinc-300">Status:</strong> {selectedProject.status}</div>
                    </div>
                  </div>

                  {/* Donut Chart Card */}
                  <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={taskData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {taskData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Donut Legend */}
                    <div className="flex items-center justify-center gap-3 text-[11px] pt-2 flex-wrap">
                      {taskData.map((item) => (
                        <div key={item.name} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                          <span className="text-zinc-600 dark:text-zinc-300">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Total Hours Worked Card */}
                <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500">
                      <Clock size={28} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                        {selectedProject.totalHours || 37.08}
                      </div>
                      <div className="text-xs text-zinc-400">Total hours worked</div>
                    </div>
                  </div>
                </div>

                {/* Project Members Card */}
                <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Project members</h3>
                    <button
                      type="button"
                      onClick={() => alert("Add project member clicked")}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 transition-colors"
                    >
                      <Plus size={13} />
                      <span>Add member</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(selectedProject.members || []).map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-xs">
                            {m.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <div className="font-medium text-zinc-800 dark:text-zinc-200">{m.name}</div>
                            <div className="text-[11px] text-zinc-400">{m.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <button type="button" className="hover:text-blue-500 p-1"><Mail size={14} /></button>
                          <button type="button" className="hover:text-red-500 p-1"><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Activity Timeline */}
              <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col">
                <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Activity</h3>

                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                  {(selectedProject.activityLogs || []).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-xs border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {log.user.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-[11px] text-zinc-500">
                          <strong className="text-zinc-800 dark:text-zinc-200">{log.user}</strong> {log.timestamp}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-600 text-white">
                            {log.action}
                          </span>
                          {log.badge && (
                            <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                              {log.badge} -
                            </span>
                          )}
                          <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{log.title}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-zinc-400 text-sm bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              Content for <strong className="text-zinc-700 dark:text-zinc-200">{activeTab}</strong> view will render here.
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
