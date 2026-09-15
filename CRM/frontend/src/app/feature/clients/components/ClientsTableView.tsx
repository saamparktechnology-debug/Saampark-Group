"use client"

import * as React from "react"
import { Search, ChevronDown, FileSpreadsheet, Printer, LayoutGrid, SlidersHorizontal, Edit3, X, Eye, ChevronLeft, ChevronRight, User, FolderPlus, MapPin, Info, Trash2 } from "lucide-react"
import { ClientItem } from "../types"
import { formatDisplayEmail } from "../services/clientService"

import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"
import { confirmTwoStepDelete, confirmTwoStepBulkDelete } from "@/lib/confirmDialog"

interface ClientsTableViewProps {
  clients: ClientItem[]
  onDeleteClient: (id: string) => void
  onEditClient: (client: ClientItem) => void
  onAddProjectClient?: (client: ClientItem) => void
  onViewClientHistory?: (client: ClientItem) => void
}

export function ClientsTableView({
  clients,
  onDeleteClient,
  onEditClient,
  onAddProjectClient,
  onViewClientHistory,
}: ClientsTableViewProps) {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const isSuperAdmin = user?.role === "Super Admin"
  const canEditClient = isSuperAdmin || canPerformAction(user, "Clients", "edit")
  const canDeleteClient = isSuperAdmin || canPerformAction(user, "Clients", "delete")

  const [searchText, setSearchText] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("All clients")
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false)
  const [pageSize, setPageSize] = React.useState(10)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [selectedClientIds, setSelectedClientIds] = React.useState<string[]>([])

  const filterRef = React.useRef<HTMLDivElement>(null)

  // Reset page when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchText, activeFilter, pageSize])

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

      if (activeFilter === "Has due") return c.due !== "$0.00" && c.due !== "₹0.00" && c.due !== "₹0"
      if (activeFilter === "Has open projects") return c.projectsCount > 0
      if (activeFilter === "VIP") return c.group === "VIP"

      return true
    })
  }, [clients, searchText, activeFilter])

  const totalItems = filteredClients.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedClients = filteredClients.slice(startIndex, endIndex)
  
  const isAllVisibleSelected = paginatedClients.length > 0 && paginatedClients.every((c) => selectedClientIds.includes(c.id))
  const isSomeVisibleSelected = paginatedClients.some((c) => selectedClientIds.includes(c.id)) && !isAllVisibleSelected

  const handleSelectAllVisible = () => {
    if (!canDeleteClient) return
    if (isAllVisibleSelected) {
      const visibleIds = new Set(paginatedClients.map((c) => c.id))
      setSelectedClientIds((prev) => prev.filter((id) => !visibleIds.has(id)))
    } else {
      const next = new Set([...selectedClientIds, ...paginatedClients.map((c) => c.id)])
      setSelectedClientIds(Array.from(next))
    }
  }

  const handleToggleSelectClient = (id: string) => {
    if (!canDeleteClient) return
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleDelete = async (id: string, name?: string) => {
    const target = clients.find(c => c.id === id)
    const displayName = name || target?.name || "Client"
    const confirmed = await confirmTwoStepDelete(displayName, "client")
    if (confirmed) {
      onDeleteClient(id)
    }
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
              <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                {["All clients", "Has due", "Has open projects", "VIP"].map((f) => {
                  const isSelected = activeFilter === f
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setActiveFilter(f)
                        setIsFilterDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <span>{f}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Tools (Export, Bulk Delete, Search) */}
        <div className="flex flex-wrap items-center gap-2">
          {canDeleteClient && selectedClientIds.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                const confirmed = await confirmTwoStepBulkDelete(selectedClientIds.length, "client(s)")
                if (confirmed) {
                  selectedClientIds.forEach((id) => onDeleteClient(id))
                  setSelectedClientIds([])
                }
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete Selected ({selectedClientIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              exportToExcel({
                filename: "SAAMPARK_Clients_Directory",
                title: "Clients Directory Report",
                subtitle: activeFilter || "All Clients",
                headers: ["#", "Company / Name", "Primary Contact", "Email", "Phone", "Projects", "Total Invoiced", "Received", "Due"],
                rows: filteredClients.map((c, idx) => [
                  idx + 1,
                  c.name,
                  c.primaryContact,
                  formatDisplayEmail(c.email) || "-",
                  c.phone,
                  c.projectsCount,
                  c.totalInvoiced,
                  c.paymentReceived,
                  c.due,
                ]),
              })
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" /> Excel
          </button>
          <button
            type="button"
            onClick={() => {
              printPDFReport({
                title: "Clients Directory Report",
                subtitle: activeFilter || "All Clients",
                headers: ["#", "Company / Name", "Primary Contact", "Email", "Phone", "Projects", "Total Invoiced", "Received", "Due"],
                rows: filteredClients.map((c, idx) => [
                  idx + 1,
                  c.name,
                  c.primaryContact,
                  formatDisplayEmail(c.email) || "-",
                  c.phone,
                  c.projectsCount,
                  c.totalInvoiced,
                  c.paymentReceived,
                  c.due,
                ]),
              })
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
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
              {canDeleteClient && (
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isSomeVisibleSelected
                    }}
                    onChange={handleSelectAllVisible}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                </th>
              )}
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
                <td colSpan={canDeleteClient ? 11 : 10} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl shadow-xs">
                      🏢
                    </div>
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">No clients found</p>
                    <p className="text-xs text-slate-400 max-w-xs">No client accounts match the active filter or search query.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  {canDeleteClient && (
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedClientIds.includes(client.id)}
                        onChange={() => handleToggleSelectClient(client.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="py-3 px-3">
                    <div 
                      onClick={() => onViewClientHistory && onViewClientHistory(client)}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1.5"
                      title="View client history and profile"
                    >
                      <span>{client.name}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                        <span>🏢</span>
                        <span>{client.companyId === 'digital' ? 'Digital' : 'Tech'}</span>
                      </span>
                      {client.branchName && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          <MapPin size={10} className="text-amber-500 shrink-0" />
                          <span>{client.branchName}</span>
                        </span>
                      )}
                      {(client.createdByName || client.createdBy || client.owner) && (
                        <div className="relative group/clientcreator inline-flex items-center">
                          <button
                            type="button"
                            className="w-5 h-5 rounded-full backdrop-blur-md bg-white/80 dark:bg-zinc-800/80 hover:bg-indigo-50/90 dark:hover:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/30 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-indigo-500/20 hover:scale-110 active:scale-95"
                            title="Added By Details"
                          >
                            <Info size={11} className="stroke-[2.2]" />
                          </button>
                          <div className="absolute left-0 top-full mt-2 hidden group-hover/clientcreator:block z-50 w-56 p-3 bg-zinc-900/95 dark:bg-zinc-900/95 text-white rounded-2xl shadow-2xl border border-white/10 text-[11px] pointer-events-none space-y-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                            <div className="text-[9.5px] font-bold uppercase tracking-wider text-indigo-400 border-b border-white/10 pb-1 flex items-center justify-between">
                              <span>Client Creator</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-100 font-semibold">
                              <User size={12} className="text-indigo-400 shrink-0" />
                              <span>Added by: <strong className="text-indigo-300 font-bold">{client.createdByName || client.createdBy || client.owner}</strong></span>
                            </div>
                            {client.branchName && (
                              <div className="flex items-center gap-1.5 text-zinc-300">
                                <MapPin size={12} className="text-amber-400 shrink-0" />
                                <span>Branch: <strong className="text-white font-medium">{client.branchName}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
                        onClick={() => onViewClientHistory && onViewClientHistory(client)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="View Client Project & Invoice History"
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
                          onClick={() => handleDelete(client.id, client.name)}
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
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="font-medium text-slate-600 dark:text-slate-400">
            {totalItems === 0 ? "0 / 0" : `${startIndex + 1}-${endIndex} / ${totalItems}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className={`p-1.5 rounded border border-slate-200 dark:border-slate-700 transition-colors ${
              safeCurrentPage <= 1
                ? "opacity-40 cursor-not-allowed text-slate-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            }`}
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          {(() => {
            const pages: number[] = []
            if (totalPages <= 5) {
              for (let i = 1; i <= totalPages; i++) pages.push(i)
            } else if (safeCurrentPage <= 3) {
              pages.push(1, 2, 3, 4, 5)
            } else if (safeCurrentPage >= totalPages - 2) {
              for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
            } else {
              pages.push(safeCurrentPage - 2, safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, safeCurrentPage + 2)
            }

            return pages.map((p) => {
              const isCurrent = p === safeCurrentPage
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {p}
                </button>
              )
            })
          })()}

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className={`p-1.5 rounded border border-slate-200 dark:border-slate-700 transition-colors ${
              safeCurrentPage >= totalPages
                ? "opacity-40 cursor-not-allowed text-slate-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            }`}
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
