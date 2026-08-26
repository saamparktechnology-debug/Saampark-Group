"use client"

import * as React from "react"
import {
  Tag,
  Upload,
  Plus,
  Filter,
  FileSpreadsheet,
  Printer,
  Search,
  ArrowDown,
  Layout,
  Pencil,
  X,
} from "lucide-react"
import { Project } from "../types"
import { ProjectFiltersDropdown } from "./ProjectFiltersDropdown"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"

interface ProjectListProps {
  projects: Project[]
  onOpenAddModal: () => void
  onOpenEditModal: (project: Project) => void
  onDeleteProject: (projectId: string) => void
  onSelectProjectDetail: (project: Project) => void
}

export function ProjectList({
  projects,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteProject,
  onSelectProjectDetail,
}: ProjectListProps) {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAddProject = canPerformAction(user, "Projects", "add")
  const canEditProject = canPerformAction(user, "Projects", "edit")
  const canDeleteProject = canPerformAction(user, "Projects", "delete")

  const [activeFilter, setActiveFilter] = React.useState("All projects")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isFiltersDropdownOpen, setIsFiltersDropdownOpen] = React.useState(false)

  // Filtering projects based on active filter pill / dropdown & search query
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeFilter === "Completed") return matchesSearch && p.status === "Completed"
    if (activeFilter === "High Priority") return matchesSearch && p.labels.includes("Urgent")
    if (activeFilter === "Open projects") return matchesSearch && p.status === "Open"
    if (activeFilter === "Upcoming") return matchesSearch && (p.status === "Open" || p.status === "Hold")

    return matchesSearch
  })

  // Excel Export
  const handleExportExcel = () => {
    exportToExcel({
      filename: "SAAMPARK_Projects",
      title: "Projects Report",
      subtitle: activeFilter || "All Projects",
      headers: ["#", "Project ID", "Title", "Client", "Price", "Start Date", "Deadline", "Progress", "Status"],
      rows: filteredProjects.map((p, idx) => [
        idx + 1,
        p.id,
        p.title,
        p.client,
        p.price,
        p.startDate,
        p.deadline,
        `${p.progress}%`,
        p.status,
      ]),
    })
  }

  // Print Action (PDF Report)
  const handlePrint = () => {
    printPDFReport({
      title: "Projects Report",
      subtitle: activeFilter || "All Projects",
      headers: ["#", "Project ID", "Title", "Client", "Price", "Start Date", "Deadline", "Progress", "Status"],
      rows: filteredProjects.map((p, idx) => [
        idx + 1,
        p.id,
        p.title,
        p.client,
        p.price,
        p.startDate,
        p.deadline,
        `${p.progress}%`,
        p.status,
      ]),
    })
  }

  return (
    <div className="space-y-4">
      {/* ---------------- TOP HEADER BAR (Image 1) ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Projects</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert("Manage labels clicked")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors shadow-2xs"
          >
            <Tag size={13} className="text-zinc-500" />
            <span>Manage labels</span>
          </button>

          <button
            type="button"
            onClick={() => alert("Import projects clicked")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors shadow-2xs"
          >
            <Upload size={13} className="text-zinc-500" />
            <span>Import projects</span>
          </button>

          {canAddProject && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors shadow-2xs"
            >
              <Plus size={14} className="text-zinc-500" />
              <span>Add project</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- CONTROL TOOLBAR (Image 1 & 2) ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        
        {/* Left Side Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sidebar Layout Toggle Icon */}
          <button
            type="button"
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-md bg-zinc-50/50 dark:bg-zinc-800/50"
          >
            <Layout size={15} />
          </button>

          {/* Filters Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFiltersDropdownOpen(!isFiltersDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-200/70 transition-colors"
            >
              <Filter size={13} className="text-zinc-500" />
              <span>Filters</span>
              <span className="text-[10px] ml-0.5">▼</span>
            </button>

            <ProjectFiltersDropdown
              isOpen={isFiltersDropdownOpen}
              onClose={() => setIsFiltersDropdownOpen(false)}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
            />
          </div>

          {/* Plus Quick Button */}
          {canAddProject && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-md bg-zinc-50/50 dark:bg-zinc-800/50"
            >
              <Plus size={14} />
            </button>
          )}

          {/* Filter Pills matching Image 1 */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs ml-1">
            {["All projects", "Completed", "High Priority", "Open projects", "Upcoming"].map((f) => {
              const isActive = activeFilter === f
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {f}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Side Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Excel
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Print
          </button>

          {/* Search Box */}
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

      {/* ---------------- MAIN DATA TABLE (Image 1) ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold bg-zinc-50/50 dark:bg-zinc-800/40">
                <th className="py-3 px-4 w-12">ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <ArrowDown size={12} className="text-zinc-500" />
                    <span>Client</span>
                  </div>
                </th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Start date</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4 w-32">Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
              {filteredProjects.map((p) => {
                const isOverdueOrNear = p.deadline === "08-08-2026" || p.deadline === "12-08-2026"

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 font-normal text-zinc-500">{p.id}</td>

                    {/* Title & Badges */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => onSelectProjectDetail(p)}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-left"
                        >
                          {p.title}
                        </button>
                        {p.labels.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {p.labels.map((lbl) => (
                              <span
                                key={lbl}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  lbl === "Urgent"
                                    ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                                    : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                }`}
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">{p.client}</td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{p.price}</div>
                      {p.advanceAmount !== undefined && p.advanceAmount > 0 && p.dueAmount !== undefined && p.dueAmount > 0 ? (
                        <div className="text-[10px] flex items-center gap-1 font-medium mt-0.5">
                          <span className="text-emerald-600 dark:text-emerald-400">Adv: ₹{p.advanceAmount.toLocaleString("en-IN")}</span>
                          <span className="text-zinc-400">•</span>
                          <span className="text-amber-600 dark:text-amber-400">Due: ₹{p.dueAmount.toLocaleString("en-IN")}</span>
                        </div>
                      ) : null}
                    </td>

                    {/* Start date */}
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">{p.startDate}</td>

                    {/* Deadline */}
                    <td className="py-3.5 px-4">
                      <span
                        className={
                          isOverdueOrNear
                            ? "text-red-500 dark:text-red-400 font-medium"
                            : "text-zinc-600 dark:text-zinc-400"
                        }
                      >
                        {p.deadline}
                      </span>
                    </td>

                    {/* Progress Bar & Interactive Team Completion Slider */}
                    <td className="py-3.5 px-4 min-w-[130px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          <span>{p.progress}%</span>
                          {p.status === "In Progress" && (
                            <span className="text-[10px] text-blue-600 font-normal">Team Slider</span>
                          )}
                        </div>
                        <div className="w-28 bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              p.status === "Completed" || p.status === "Finished" ? "bg-emerald-500" : "bg-blue-600"
                            }`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        {p.status === "In Progress" && (
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={p.progress || 1}
                            onChange={async (e) => {
                              const val = Number(e.target.value)
                              const { updateProject } = await import("../services/projectService")
                              await updateProject(p.id, { progress: val })
                              p.progress = val
                            }}
                            className="w-28 h-1 accent-blue-600 cursor-pointer block"
                            title="Adjust completion percentage (1% - 100%)"
                          />
                        )}
                      </div>
                    </td>

                    {/* Status & Payment Approval Controls */}
                    <td className="py-3.5 px-4">
                      {p.status === "Payment Pending" || p.paymentStatus === "Payment Pending" ? (
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                            Payment Pending
                          </span>
                          {(user?.role === "Super Admin" || user?.role === "Admin") && (
                            <button
                              type="button"
                              onClick={async () => {
                                const { updateProject } = await import("../services/projectService")
                                const { updateInvoiceStatus } = await import("@/app/feature/sales/invoices/services/invoiceService")
                                await updateProject(p.id, { status: "In Progress", paymentStatus: "Paid" })
                                await updateInvoiceStatus(p.title, "Fully paid").catch(() => {})
                                window.location.reload()
                              }}
                              className="block px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 shadow-2xs"
                              title="Approve payment and mark project active"
                            >
                              Approve Payment & Activate
                            </button>
                          )}
                        </div>
                      ) : (
                        <select
                          value={p.status}
                          disabled={!(user?.role === "Super Admin" || user?.role === "Admin")}
                          onChange={async (e) => {
                            const newStatus = e.target.value as any
                            const { updateProject } = await import("../services/projectService")
                            await updateProject(p.id, { status: newStatus })
                            p.status = newStatus
                          }}
                          className={`px-2 py-1 rounded text-xs font-semibold border bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ${
                            p.status === "Completed" || p.status === "Finished"
                              ? "text-emerald-600 border-emerald-300"
                              : p.status === "Cancelled"
                              ? "text-rose-600 border-rose-300"
                              : "text-blue-600 border-blue-300"
                          }`}
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Open">Open</option>
                          <option value="Hold">Hold</option>
                          <option value="Finished">Finished / Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      )}
                    </td>

                    {/* Row Action Icons matching Image 1 */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                        {/* View detail button */}
                        <button
                          type="button"
                          onClick={() => onSelectProjectDetail(p)}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                          title="View project details"
                        >
                          <Layout size={14} />
                        </button>

                        {canEditProject && (
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(p)}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                            title="Edit project"
                          >
                            <Pencil size={14} />
                          </button>
                        )}

                        {canDeleteProject && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete project "${p.title}"?`)) {
                                onDeleteProject(p.id)
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors"
                            title="Delete project"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center text-xl shadow-xs">
                        🚀
                      </div>
                      <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-200">No projects found</p>
                      <p className="text-xs text-zinc-400 max-w-xs">No projects match the active filters or search terms.</p>
                      {canAddProject && (
                        <button
                          type="button"
                          onClick={onOpenAddModal}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Add New Project</span>
                        </button>
                      )}
                    </div>
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
