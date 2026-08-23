"use client"

import * as React from "react"
import {
  Tag,
  Upload,
  Plus,
  Filter,
  Settings,
  Search,
  ArrowDown,
  Layout,
  Pencil,
  Trash2,
  X,
  Phone,
  MessageSquare,
  User as UserIcon,
  MapPin,
  Lock,
  Unlock,
  Building2,
} from "lucide-react"
import { Lead } from "../types"
import { LeadFiltersDropdown } from "./LeadFiltersDropdown"
import { LabelItem } from "./ManageLabelsModal"
import { LabelSelectorPopover } from "./LabelSelectorPopover"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { getUsers } from "@/app/feature/users/services/userService"

interface LeadListProps {
  leads: Lead[]
  availableLabels: LabelItem[]
  activeViewTab: "list" | "kanban"
  onChangeViewTab: (tab: "list" | "kanban") => void
  onOpenAddModal: () => void
  onOpenEditModal: (lead: Lead) => void
  onDeleteLead: (leadId: string) => void
  onSelectLeadDetail: (lead: Lead) => void
  onOpenManageLabelsModal: () => void
  onToggleLeadLabel: (leadId: string, labelName: string) => void
  onLeadUpdated: (updatedLead: Lead) => void
}

const statusBadgeStyles: Record<string, string> = {
  Discussion: "bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800",
  Proposal: "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
  Won: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
  "Follow Up": "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  New: "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  Lost: "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
}

export function LeadList({
  leads = [],
  availableLabels = [],
  activeViewTab = "list",
  onChangeViewTab,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteLead,
  onSelectLeadDetail,
  onOpenManageLabelsModal,
  onToggleLeadLabel,
  onLeadUpdated,
}: LeadListProps) {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  
  const isSuperAdminOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"
  const canAddLead = isSuperAdminOrAdmin || canPerformAction(user, "Leads", "add")
  const canEditLead = isSuperAdminOrAdmin || canPerformAction(user, "Leads", "edit")
  const canDeleteLead = isSuperAdminOrAdmin || canPerformAction(user, "Leads", "delete")

  const [usersMap, setUsersMap] = React.useState<Record<string, { department?: string; role?: string; avatarUrl?: string }>>({})

  React.useEffect(() => {
    getUsers("all").then((list) => {
      const map: Record<string, { department?: string; role?: string; avatarUrl?: string }> = {}
      ;(list || []).forEach((u) => {
        if (u.name) map[u.name.toLowerCase().trim()] = { department: u.department, role: u.role, avatarUrl: u.avatarUrl }
        if (u.email) map[u.email.toLowerCase().trim()] = { department: u.department, role: u.role, avatarUrl: u.avatarUrl }
      })
      setUsersMap(map)
    })
  }, [])

  const [activeFilter, setActiveFilter] = React.useState("All leads")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activePopoverLeadId, setActivePopoverLeadId] = React.useState<string | null>(null)
  const [isFiltersDropdownOpen, setIsFiltersDropdownOpen] = React.useState(false)

  // Mouse horizontal click-and-drag scrolling
  const tableScrollRef = React.useRef<HTMLDivElement>(null)
  const isDraggingTableRef = React.useRef(false)
  const [isDraggingTable, setIsDraggingTable] = React.useState(false)
  const startXRef = React.useRef(0)
  const scrollLeftRef = React.useRef(0)

  const handleTableMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    // Ignore interactive controls so users can click buttons, icons, links, inputs
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("a") ||
      target.closest("label") ||
      target.closest("[role='button']")
    ) {
      return
    }

    const container = tableScrollRef.current
    if (!container) return

    isDraggingTableRef.current = true
    setIsDraggingTable(true)
    startXRef.current = e.pageX - container.offsetLeft
    scrollLeftRef.current = container.scrollLeft
  }

  const handleTableMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingTableRef.current) return
    const container = tableScrollRef.current
    if (!container) return

    e.preventDefault()
    const x = e.pageX - container.offsetLeft
    const walk = (x - startXRef.current) * 1.5
    container.scrollLeft = scrollLeftRef.current - walk
  }

  const handleTableMouseUpOrLeave = () => {
    if (isDraggingTableRef.current) {
      isDraggingTableRef.current = false
      setIsDraggingTable(false)
    }
  }

  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeFilter, pageSize])

  // Filter logic
  const filteredLeads = (leads || []).filter((l) => {
    if (!l) return false
    const q = searchQuery.trim().toLowerCase()
    const cleanQueryDigits = q.replace(/\D/g, "")

    const nameStr = (l.name || "").toLowerCase()
    const contactStr = (l.primaryContact || "").toLowerCase()
    const cityStr = (l.city || "").toLowerCase()
    const phoneStr = (l.phone || "").toLowerCase()
    const phoneDigits = (l.phone || "").replace(/\D/g, "")
    const ownerStr = (l.owner || "").toLowerCase()
    const callerStr = (l.caller || "").toLowerCase()
    const serviceStr = (l.service || "").toLowerCase()
    const sourceStr = (l.source || "").toLowerCase()

    const matchesSearch =
      !q ||
      nameStr.includes(q) ||
      contactStr.includes(q) ||
      cityStr.includes(q) ||
      phoneStr.includes(q) ||
      (cleanQueryDigits.length >= 3 && phoneDigits.includes(cleanQueryDigits)) ||
      ownerStr.includes(q) ||
      callerStr.includes(q) ||
      serviceStr.includes(q) ||
      sourceStr.includes(q)

    const leadLabels = l.labels || []
    
    if (!activeFilter || activeFilter === "All leads" || activeFilter === "All Leads") {
      return matchesSearch
    }

    if (activeFilter === "My leads") {
      const currentUserName = (user?.name || "").toLowerCase().trim()
      const currentUserEmail = (user?.email || "").toLowerCase().trim()
      const isMyLead =
        (currentUserName && (
          (l.createdBy || "").toLowerCase().includes(currentUserName) ||
          (l.caller || "").toLowerCase() === currentUserName ||
          (l.assignedTo || "").toLowerCase() === currentUserName ||
          (l.owner || "").toLowerCase() === currentUserName
        )) ||
        (currentUserEmail && (
          (l.createdBy || "").toLowerCase().includes(currentUserEmail) ||
          (l.owner || "").toLowerCase() === currentUserEmail
        ))
      return matchesSearch && Boolean(isMyLead)
    }

    // Check if activeFilter matches a source (e.g. Social Media, Meta Ads, Google Ads, Local Market)
    const leadSource = (l.source || "").toLowerCase().trim()
    const filterClean = activeFilter.toLowerCase().trim()
    if (leadSource === filterClean) {
      return matchesSearch
    }

    if (activeFilter === "50%") {
      return matchesSearch && (l.probability === 50 || leadLabels.includes("50%") || leadLabels.includes("50% Probability"))
    }

    if (activeFilter === "90%") {
      return matchesSearch && (l.probability === 90 || leadLabels.includes("90%") || leadLabels.includes("90% Probability"))
    }

    return matchesSearch && leadLabels.includes(activeFilter)
  })

  // Pagination calculation
  const totalItems = filteredLeads.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex)

  // Excel Export
  const handleExportExcel = () => {
    const headers = ["ID,Name,Primary Contact,Phone,Service,Source,City,Owner,Labels,Created At,Status"]
    const rows = filteredLeads.map(
      (l) =>
        `${l.id},"${l.name}","${l.primaryContact}","${l.phone.replace(/\n/g, " ")}","${l.service || ""}","${l.source || ""}","${l.city || "Mumbai"}","${l.owner}","${l.labels.join(";")}",${l.createdAt},${l.status}`
    )
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `leads_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      
      {/* ---------------- TOP HEADER BAR ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => onChangeViewTab("list")}
            className={`pb-2 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeViewTab === "list"
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Leads
            {activeViewTab === "list" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onChangeViewTab("kanban")}
            className={`pb-2 text-sm font-medium transition-colors relative cursor-pointer ${
              activeViewTab === "kanban"
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Kanban
            {activeViewTab === "kanban" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white rounded-full" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenManageLabelsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors shadow-2xs"
          >
            <Tag size={14} className="text-zinc-500" />
            <span>Manage labels</span>
          </button>

          {canAddLead && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors shadow-2xs"
            >
              <Plus size={14} className="text-zinc-500" />
              <span>Add lead</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- SUB-HEADER TOOLBAR ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        
        {/* Left Side Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layout Toggle Icon */}
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-200/70 transition-colors cursor-pointer"
            >
              <Filter size={13} className="text-zinc-500" />
              <span>{activeFilter || "Filters"}</span>
              <span className="text-[10px] ml-0.5">▼</span>
            </button>

            <LeadFiltersDropdown
              isOpen={isFiltersDropdownOpen}
              onClose={() => setIsFiltersDropdownOpen(false)}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              onClearFilters={() => setActiveFilter("All leads")}
              availableLabels={availableLabels}
              onOpenManageLabelsModal={onOpenManageLabelsModal}
            />
          </div>

          {/* Plus Quick Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-md bg-zinc-50/50 dark:bg-zinc-800/50"
          >
            <Plus size={14} />
          </button>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs ml-1">

            <button
              type="button"
              onClick={() => setActiveFilter("Call this week")}
              className={`p-1.5 rounded-full transition-colors ${
                activeFilter === "Call this week"
                  ? "bg-purple-100 text-purple-700 border border-purple-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
              }`}
              title="Call this week"
            >
              <Phone size={13} />
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("My leads")}
              className={`p-1.5 rounded-full transition-colors ${
                activeFilter === "My leads"
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
              }`}
              title="My leads"
            >
              <UserIcon size={13} />
            </button>
          </div>
        </div>

        {/* Right Side Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert("Settings clicked")}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Settings size={15} />
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Print
          </button>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search name, city, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 sm:w-60 pl-3 pr-8 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
            <Search size={13} className="absolute right-2.5 top-2 text-zinc-400" />
          </div>
        </div>

      </div>

      {/* ---------------- DATA TABLE (Image 1 & Screenshot 1) ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div
          ref={tableScrollRef}
          onMouseDown={handleTableMouseDown}
          onMouseMove={handleTableMouseMove}
          onMouseUp={handleTableMouseUpOrLeave}
          onMouseLeave={handleTableMouseUpOrLeave}
          className={`overflow-x-auto select-none ${
            isDraggingTable ? "cursor-grabbing active:cursor-grabbing" : "cursor-grab"
          }`}
          style={{ scrollBehavior: isDraggingTable ? "auto" : "smooth" }}
        >
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold bg-zinc-50/50 dark:bg-zinc-800/40">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Primary contact</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Assigned to</th>
                <th className="py-3 px-4">Labels</th>
                <th className="py-3 px-4">Created at</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <ArrowDown size={12} className="text-zinc-500" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
              {paginatedLeads.map((l) => {
                const isLocked = l.isLocked === true

                return (
                  <tr
                    key={l.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {/* Name (Business with Building Icon) */}
                    <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 flex items-center justify-center shrink-0">
                          <Building2 size={13} />
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectLeadDetail(l)}
                          className={`text-left hover:underline font-semibold ${
                            isLocked
                              ? "text-rose-600 dark:text-rose-400 line-through"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {l.name}
                        </button>
                      </div>
                    </td>

                    {/* Primary contact & Secondary manager */}
                    <td className={`py-3.5 px-4 ${isLocked ? "blur-[1px] opacity-60" : ""}`}>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 flex items-center justify-center text-[10px] shrink-0">
                            <UserIcon size={12} />
                          </div>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{l.primaryContact}</span>
                        </div>
                        {l.secondaryContact && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 pl-8 font-normal">
                            Mgr: {l.secondaryContact}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone & Secondary Phone with Instant Call & WhatsApp */}
                    <td className={`py-3.5 px-4 font-mono text-[11px] whitespace-pre-line leading-relaxed ${isLocked ? "blur-[1px] opacity-60" : ""}`}>
                      <div className="flex flex-col gap-1.5">
                        {/* Primary Phone */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">{l.phone}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`tel:${l.phone.replace(/[^0-9+]/g, "")}`)
                            }}
                            className="p-1 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors"
                            title={`Call Primary: ${l.primaryContact} (${l.phone})`}
                          >
                            <Phone size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`https://wa.me/${l.phone.replace(/[^0-9]/g, "")}`)
                            }}
                            className="p-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 transition-colors"
                            title={`WhatsApp Primary: ${l.primaryContact} (${l.phone})`}
                          >
                            <MessageSquare size={10} />
                          </button>
                        </div>

                        {/* Secondary Phone */}
                        {l.secondaryPhone && (
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-purple-600 dark:text-purple-400 font-medium">Mgr: {l.secondaryPhone}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`tel:${l.secondaryPhone!.replace(/[^0-9+]/g, "")}`)
                              }}
                              className="p-0.5 rounded-full bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-colors"
                              title={`Call Manager: ${l.secondaryContact || "Manager"} (${l.secondaryPhone})`}
                            >
                              <Phone size={9} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`https://wa.me/${l.secondaryPhone!.replace(/[^0-9]/g, "")}`)
                              }}
                              className="p-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 transition-colors"
                              title={`WhatsApp Manager: ${l.secondaryContact || "Manager"} (${l.secondaryPhone})`}
                            >
                              <MessageSquare size={9} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Service */}
                    <td className={`py-3.5 px-4 ${isLocked ? "blur-[1px] opacity-60" : ""}`}>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                        {l.service || "-"}
                      </span>
                    </td>

                    {/* Source */}
                    <td className={`py-3.5 px-4 ${isLocked ? "blur-[1px] opacity-60" : ""}`}>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {l.source || "Social Media"}
                      </span>
                    </td>

                    {/* City */}
                    <td className={`py-3.5 px-4 ${isLocked ? "blur-[1px] opacity-60" : ""}`}>
                      <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                        <MapPin size={12} className="text-rose-500 shrink-0" />
                        <span>{l.city || "Mumbai"}</span>
                      </div>
                    </td>

                    {/* Assigned to (with profile pic and department) */}
                    <td className={`py-3.5 px-4 ${isLocked ? "blur-[1px] opacity-60" : ""}`}>
                      {(() => {
                        const rawAssigned = (l.assignedTo && l.assignedTo !== "None" && l.assignedTo !== "Unassigned")
                          ? l.assignedTo
                          : ((l.caller && l.caller !== "None" && l.caller !== "Unassigned")
                            ? l.caller
                            : ((l.owner && l.owner !== "None" && l.owner !== "Unassigned")
                              ? l.owner
                              : "Unassigned"))
                        const isUnassigned = !rawAssigned || rawAssigned === "Unassigned" || rawAssigned === "None"
                        const assignedPerson = isUnassigned ? "Unassigned" : rawAssigned

                        const userMeta = !isUnassigned
                          ? (usersMap[assignedPerson.toLowerCase().trim()] ||
                              (user && (assignedPerson === user.name || assignedPerson === user.email)
                                ? { role: user.role, avatarUrl: user.avatar }
                                : null))
                          : null

                        const deptOrRole =
                          userMeta?.department ||
                          userMeta?.role ||
                          (assignedPerson.toLowerCase().includes("admin") ? "Administration" : "Telecaller / Sales")

                        const avatarSrc = !isUnassigned
                          ? (l.ownerAvatar ||
                              userMeta?.avatarUrl ||
                              (user?.avatar && (assignedPerson === user.name || assignedPerson === user.email)
                                ? user.avatar
                                : null) ||
                              `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(assignedPerson)}`)
                          : null

                        return (
                          <div className="flex items-center gap-2">
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={assignedPerson}
                                className="w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] shrink-0">
                                <UserIcon size={12} />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className={`font-semibold text-xs ${isUnassigned ? "text-zinc-400 dark:text-zinc-500 italic" : "text-zinc-800 dark:text-zinc-200"}`}>
                                {assignedPerson}
                              </span>
                              {!isUnassigned && (
                                <span className="text-[10px] text-zinc-400 font-medium truncate">
                                  {deptOrRole}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </td>

                    {/* Labels */}
                    <td className={`py-3.5 px-4 relative ${isLocked ? "blur-[1px] opacity-60" : ""}`}>
                      <div className="flex items-center gap-1 flex-wrap">
                        {(l.labels || []).map((lbl) => {
                          const labelObj = (availableLabels || []).find((al) => al.name === lbl)
                          const colorHex = labelObj?.color || "#a855f7"

                          return (
                            <button
                              key={lbl}
                              type="button"
                              onClick={() =>
                                !isLocked && setActivePopoverLeadId(
                                  activePopoverLeadId === l.id ? null : l.id
                                )
                              }
                              className="px-3 py-1 rounded-md text-[11px] font-semibold text-white shadow-2xs hover:scale-105 transition-transform"
                              style={{ backgroundColor: colorHex }}
                            >
                              {lbl}
                            </button>
                          )
                        })}

                        {l.labels.length === 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              !isLocked && setActivePopoverLeadId(
                                activePopoverLeadId === l.id ? null : l.id
                              )
                            }
                            className="px-2 py-0.5 rounded border border-dashed border-zinc-300 text-[11px] text-zinc-400 hover:text-zinc-700"
                          >
                            + Label
                          </button>
                        )}
                      </div>

                      <LabelSelectorPopover
                        isOpen={activePopoverLeadId === l.id && !isLocked}
                        onClose={() => setActivePopoverLeadId(null)}
                        availableLabels={availableLabels}
                        currentLabels={l.labels}
                        onToggleLabel={(labelName) => onToggleLeadLabel(l.id, labelName)}
                        onOpenManageModal={onOpenManageLabelsModal}
                      />
                    </td>

                    {/* Created at */}
                    <td className={`py-3.5 px-4 text-zinc-500 font-mono text-[11px] ${isLocked ? "blur-[1px] opacity-60" : ""}`}>
                      {l.createdAt}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {isLocked ? (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-rose-600 text-white shadow-2xs animate-pulse">
                          🔒 LOCKED
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                            statusBadgeStyles[l.status] || "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {l.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Lock / Unlock Toggle Button for Admin */}
                        {isSuperAdminOrAdmin && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (isLocked) {
                                const { unlockLead } = await import("../services/leadService")
                                const unlocked = await unlockLead(l.id)
                                onLeadUpdated(unlocked)
                              } else {
                                const { lockLead } = await import("../services/leadService")
                                const locked = await lockLead(l.id, "Manually locked by Admin")
                                onLeadUpdated(locked)
                              }
                            }}
                            className={`group/lock px-2 py-0.5 rounded text-[11px] font-semibold transition-all duration-200 shadow-2xs flex items-center gap-1 cursor-pointer ${
                              isLocked
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                            }`}
                            title={isLocked ? "Lead is Locked. Click to Unlock" : "Lead is Unlocked. Click to Lock"}
                          >
                            {isLocked ? (
                              <>
                                <Lock size={12} className="text-rose-600 dark:text-rose-400 group-hover/lock:scale-110 transition-transform duration-300" />
                                <span className="text-rose-600 dark:text-rose-400 font-bold">Lock</span>
                              </>
                            ) : (
                              <>
                                <Unlock size={12} className="text-zinc-500 group-hover/lock:rotate-[-18deg] group-hover/lock:scale-110 transition-transform duration-300" />
                                <span>Unlock</span>
                              </>
                            )}
                          </button>
                        )}

                        {!isLocked && (
                          <>
                            <button
                              type="button"
                              onClick={() => onSelectLeadDetail(l)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                              title="View lead details"
                            >
                              <Layout size={14} />
                            </button>

                            {canEditLead && (
                              <button
                                type="button"
                                onClick={() => onOpenEditModal(l)}
                                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                                title="Edit lead"
                              >
                                <Pencil size={14} />
                              </button>
                            )}

                            {canDeleteLead && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete lead "${l.name}"?`)) {
                                    onDeleteLead(l.id)
                                  }
                                }}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors"
                                title="Delete lead"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}

                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-400">
                    No leads found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="font-medium">
              {totalItems === 0 ? "0 / 0" : `${startIndex + 1}-${endIndex} / ${totalItems}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Previous Page Button */}
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors font-semibold"
              title="Previous page"
            >
              &lt;
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              if (
                totalPages > 7 &&
                pageNum !== 1 &&
                pageNum !== totalPages &&
                Math.abs(pageNum - safeCurrentPage) > 1
              ) {
                if (pageNum === 2 || pageNum === totalPages - 1) {
                  return <span key={pageNum} className="px-1 text-zinc-400">...</span>
                }
                return null
              }

              const isActive = pageNum === safeCurrentPage
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[28px] px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            {/* Next Page Button */}
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors font-semibold"
              title="Next page"
            >
              &gt;
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
