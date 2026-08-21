"use client"

import * as React from "react"
import { Search, ChevronDown, FileSpreadsheet, Printer, LayoutGrid, SlidersHorizontal, Edit3, X, Eye, ChevronLeft, ChevronRight, User, FolderPlus } from "lucide-react"
import { ClientItem } from "../types"

import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

interface ClientsTableViewProps {
  clients: ClientItem[]
  onDeleteClient: (id: string) => void
  onEditClient: (client: ClientItem) => void
  onAddProjectClient?: (client: ClientItem) => void
}

export function ClientsTableView({
  clients,
  onDeleteClient,
  onEditClient,
  onAddProjectClient,
}: ClientsTableViewProps) {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canEditClient = canPerformAction(user, "Clients", "edit")
  const canDeleteClient = canPerformAction(user, "Clients", "delete")

  const [searchText, setSearchText] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("All clients")
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false)

  const filterRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredClients = React.useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        !searchText.trim() ||
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.primaryContact.toLowerCase().includes(searchText.toLowerCase()) ||
        c.phone.includes(searchText)

      if (!matchesSearch) return false

      if (activeFilter === "Has due") return c.due !== "$0.00"
      if (activeFilter === "Has open projects") return c.projectsCount > 0
      if (activeFilter === "VIP") return c.group === "VIP"

      return true
    })
  }, [clients, searchText, activeFilter])

  const handleDelete = (id: string) => {
    onDeleteClient(id)
  }

  return (
    <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
      {/* Toolbar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sidebar icon */}
          <button
            type="button"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          >
            <LayoutGrid size={16} />
          </button>

          {/* Filters Dropdown */}
          <div ref={filterRef} className="relative">
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs hover:bg-slate-200"
            >
              <SlidersHorizontal size={14} className="text-slate-500" />
              <span>Filters</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-2 space-y-1">
                <div className="text-xs font-semibold text-slate-400 px-3 py-1">Manage Filters</div>
                {["All clients", "Has due", "Has open projects", "My clients", "VIP"].map((f) => {
                  const isSelected = activeFilter === f
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setActiveFilter(f)
                        setIsFilterDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white font-medium"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {f}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <button
            type="button"
            onClick={() => setActiveFilter("Has due")}
            className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
              activeFilter === "Has due"
                ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            }`}
          >
            Has due
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("Has open projects")}
            className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
              activeFilter === "Has open projects"
                ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            }`}
          >
            Has open projects
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("VIP")}
            className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
              activeFilter === "VIP"
                ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            }`}
          >
            My Clients
          </button>
        </div>

        {/* Right Action Controls: Excel, Print, Search */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" /> Excel
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Printer size={14} className="text-slate-500" /> Print
          </button>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search"
              className="pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
            <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="py-3 px-3">ID ↑</th>
              <th className="py-3 px-3">Name</th>
              <th className="py-3 px-3">Primary Contact</th>
              <th className="py-3 px-3">Phone</th>
              <th className="py-3 px-3">Client groups</th>
              <th className="py-3 px-3">Labels</th>
              <th className="py-3 px-3">Projects</th>
              <th className="py-3 px-3">Total invoiced</th>
              <th className="py-3 px-3">Payment Received</th>
              <th className="py-3 px-3">Due</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 text-sm">
                  No clients found.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-500">{client.id}</td>
                  <td className="py-3 px-3 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                    {client.name}
                  </td>
                  <td className="py-3 px-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                      <User size={12} />
                    </div>
                    <span>{client.primaryContact}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{client.phone}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      {client.group}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      style={{ backgroundColor: client.labelColor }}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-white shadow-2xs"
                    >
                      {client.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">{client.projectsCount}</td>
                  <td className="py-3 px-3 font-medium">{client.totalInvoiced}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{client.paymentReceived}</td>
                  <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-100">{client.due}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onAddProjectClient && (
                        <button
                          type="button"
                          onClick={() => onAddProjectClient(client)}
                          className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-semibold flex items-center gap-1 text-[11px] shadow-2xs border border-blue-200/60 dark:border-blue-800/60"
                          title="Add Project for this client"
                        >
                          <FolderPlus size={13} />
                          <span>+ Add Project</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      {canEditClient && (
                        <button
                          type="button"
                          onClick={() => onEditClient(client)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      {canDeleteClient && (
                        <button
                          type="button"
                          onClick={() => handleDelete(client.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <select className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>1-10 / 50</span>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
            <ChevronLeft size={14} />
          </button>
          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              type="button"
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                p === 1
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
          <button type="button" className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
