"use client"

import * as React from "react"
import {
  Tag,
  Upload,
  Plus,
  Filter,
  Search,
  RotateCw,
  User as UserIcon,
  Phone,
  Wrench,
  Clock,
  MessageSquare,
  Heart,
  MapPin,
  Lock,
  Unlock,
  Building2,
} from "lucide-react"
import { Lead, LeadStatus } from "../types"
import { LeadFiltersDropdown } from "./LeadFiltersDropdown"
import { updateLead } from "../services/leadService"
import { LabelItem } from "./ManageLabelsModal"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

interface LeadKanbanProps {
  leads: Lead[]
  availableLabels: LabelItem[]
  activeViewTab: "list" | "kanban"
  onChangeViewTab: (tab: "list" | "kanban") => void
  onOpenAddModal: () => void
  onSelectLeadDetail: (lead: Lead) => void
  onLeadUpdated: (updatedLead: Lead) => void
  onOpenManageLabelsModal: () => void
  onToggleLeadLabel: (leadId: string, labelName: string) => void
}

const KANBAN_COLUMNS: { id: LeadStatus; title: string; color: string }[] = [
  { id: "New", title: "New", color: "border-amber-400" },
  { id: "Qualified", title: "Qualified", color: "border-blue-500" },
  { id: "Discussion", title: "Discussion", color: "border-cyan-400" },
  { id: "Negotiation", title: "Negotiation", color: "border-purple-500" },
  { id: "Store Visit", title: "Store Visit", color: "border-indigo-500" },
  { id: "They come to our office", title: "They come to our office", color: "border-orange-500" },
  { id: "Won", title: "Won", color: "border-emerald-500" },
  { id: "Lost", title: "Lost", color: "border-rose-500" },
]

export function LeadKanban({
  leads = [],
  availableLabels = [],
  activeViewTab = "kanban",
  onChangeViewTab,
  onOpenAddModal,
  onSelectLeadDetail,
  onLeadUpdated,
  onOpenManageLabelsModal,
  onToggleLeadLabel,
}: LeadKanbanProps) {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAddLead = canPerformAction(user, "Leads", "add")
  const isSuperAdminOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const [activeFilter, setActiveFilter] = React.useState("All leads")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isFiltersDropdownOpen, setIsFiltersDropdownOpen] = React.useState(false)
  const [draggedLeadId, setDraggedLeadId] = React.useState<string | null>(null)
  const [activeContactTarget, setActiveContactTarget] = React.useState<Record<string, "primary" | "secondary">>({})

  // Filter leads
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

    if (activeFilter === "100%" || activeFilter === "90%") {
      return matchesSearch && (l.probability === 90 || leadLabels.includes("90%") || leadLabels.includes("90% Probability"))
    }

    return matchesSearch && leadLabels.includes(activeFilter)
  })

  // Drag and drop handling
  const handleDragStart = (id: string) => {
    setDraggedLeadId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (newStatus: LeadStatus) => {
    if (!draggedLeadId) return
    const targetLead = leads.find((l) => l.id === draggedLeadId)
    if (targetLead && targetLead.status !== newStatus) {
      if (targetLead.isLocked && !isSuperAdminOrAdmin) {
        alert("🔒 This lead is locked due to missed SLA and cannot be moved.")
        setDraggedLeadId(null)
        return
      }
      const updated = await updateLead(draggedLeadId, { status: newStatus })
      onLeadUpdated(updated)
    }
    setDraggedLeadId(null)
  }

  return (
    <div className="space-y-4">
      {/* ---------------- TOP VIEW TABS & HEADER ACTIONS ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => onChangeViewTab("list")}
            className={`pb-2 text-sm font-medium transition-colors relative cursor-pointer ${
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
            className={`pb-2 text-sm font-semibold transition-colors relative cursor-pointer ${
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

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenManageLabelsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors shadow-2xs cursor-pointer"
          >
            <Tag size={14} className="text-zinc-500" />
            <span>Manage labels</span>
          </button>

          {canAddLead && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus size={14} className="text-zinc-500" />
              <span>Add lead</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- SUB-HEADER TOOLBAR (Search & Filters) ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Left Side Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh Kanban */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50 cursor-pointer"
            title="Refresh"
          >
            <RotateCw size={14} />
          </button>

          {/* All Leads Filter Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFiltersDropdownOpen(!isFiltersDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <Filter size={13} className="text-zinc-500" />
              <span>{activeFilter || "All Leads"}</span>
              <span className="text-[10px] ml-0.5 text-zinc-400">▼</span>
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

          {/* Plus Add Filter */}
          {canAddLead && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50"
            >
              <Plus size={14} />
            </button>
          )}

          {/* Filter Quick Pills */}
          <div className="flex items-center gap-2 text-xs ml-1">
            <button
              type="button"
              onClick={() => setActiveFilter("50%")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilter === "50%"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              50%
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("100%")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilter === "100%"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              100%
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("Call this week")}
              className="p-1.5 rounded-full text-zinc-500 hover:bg-zinc-100 transition-colors"
              title="Phone Leads"
            >
              <Phone size={14} />
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("My leads")}
              className="p-1.5 rounded-full text-zinc-500 hover:bg-zinc-100 transition-colors"
              title="Caller Filter"
            >
              <UserIcon size={14} />
            </button>
          </div>
        </div>

        {/* Right Search Input */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <RotateCw size={14} />
          </button>

          <div className="relative">
            <input
              type="text"
              placeholder="Search name, city, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-64 pl-3 pr-8 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
            <Search size={13} className="absolute right-3 top-2 text-zinc-400" />
          </div>
        </div>

      </div>

      {/* ---------------- KANBAN STAGE COLUMNS (Single Horizontal Scroll Track) ---------------- */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start scrollbar-thin max-w-full">
        {KANBAN_COLUMNS.map((col) => {
          const columnLeads = filteredLeads.filter((l) => l.status === col.id)

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
              className="w-72 min-w-[288px] max-w-[288px] shrink-0 bg-zinc-50/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex flex-col min-h-[620px] overflow-hidden shadow-2xs"
            >
              {/* Column Header */}
              <div className={`p-3 bg-white dark:bg-zinc-900 border-t-2 ${col.color} border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between`}>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate pr-2">
                  {col.title}
                </span>
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                  {columnLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-2 space-y-2.5 flex-1 overflow-y-auto max-h-[75vh]">
                {columnLeads.map((l) => {
                  const isLocked = !!l.isLocked

                  return (
                    <div
                      key={l.id}
                      draggable={!isLocked}
                      onDragStart={() => !isLocked && handleDragStart(l.id)}
                      onClick={() => {
                        if (isLocked && !isSuperAdminOrAdmin) {
                          alert("🔒 THIS LEAD IS LOCKED!\n\nThis lead is locked and untouchable by telecallers. Only an Admin can unlock it.")
                          return
                        }
                        onSelectLeadDetail(l)
                      }}
                      className={`border rounded-xl p-3 shadow-2xs transition-all space-y-2 relative group overflow-hidden ${
                        isLocked
                          ? "bg-rose-50/50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800"
                          : "bg-white dark:bg-zinc-800 border-zinc-200/90 dark:border-zinc-700/80 hover:shadow-md cursor-pointer"
                      }`}
                    >
                      {/* Blurred Card Content when Locked */}
                      <div className={`space-y-2 transition-all ${isLocked ? "blur-[1.5px] opacity-40 select-none pointer-events-none" : ""}`}>
                        {/* Line 1: Business Lead Title & Date */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Building2 size={13} className="text-blue-500 shrink-0" />
                            <span className={`font-semibold text-xs truncate ${isLocked ? "text-rose-700 dark:text-rose-300 line-through" : "text-blue-600 dark:text-blue-400 hover:underline"}`}>
                              {l.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 shrink-0">
                            {l.createdAt || "06 Aug 2025"}
                          </span>
                        </div>

                        {/* Line 2: Phone & Secondary Contact */}
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Phone size={12} className="text-blue-500 shrink-0" />
                              <span className="truncate">{l.phone}</span>
                            </div>
                            {l.secondaryPhone && (
                              <span className="text-[9.5px] font-sans font-medium px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                                2 Contacts
                              </span>
                            )}
                          </div>
                          {l.secondaryPhone && (
                            <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-[10px]">
                              <UserIcon size={10} className="text-purple-400 shrink-0" />
                              <span className="truncate">Mgr: {l.secondaryContact ? `${l.secondaryContact} • ` : ""}{l.secondaryPhone}</span>
                            </div>
                          )}
                        </div>

                        {/* Line 3: Service & Source */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300 gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Wrench size={12} className="text-zinc-400 shrink-0" />
                            <span className="truncate">
                              Service:{" "}
                              <strong className="font-semibold text-zinc-700 dark:text-zinc-200">
                                {l.service || "-"}
                              </strong>
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300 text-[10px] font-medium shrink-0 border border-zinc-200 dark:border-zinc-700">
                            {l.source || "Google"}
                          </span>
                        </div>

                        {/* Line 4: Remainder (Date + Time in Amber/Orange) */}
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                          <Clock size={12} className="text-amber-500 shrink-0" />
                          <span className="truncate">
                            Reminder:{" "}
                            <strong className="font-semibold text-amber-600 dark:text-amber-400">
                              {l.reminderDate || "12 Aug 2025"} {l.reminderTime || "11:30 AM"}
                            </strong>
                          </span>
                        </div>

                        {/* Line 4b: City with location icon below reminder */}
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                          <MapPin size={12} className="text-rose-500 shrink-0" />
                          <span className="truncate font-semibold text-zinc-700 dark:text-zinc-200">
                            {l.city || "Mumbai"}
                          </span>
                        </div>

                        {/* Line 5: Caller & Avatar + Quick Action Buttons */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100 dark:border-zinc-700/60 text-[11px] gap-1">
                          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 min-w-0">
                            <UserIcon size={12} className="text-zinc-400 shrink-0" />
                            <span className="truncate">
                              Caller:{" "}
                              <span className="font-medium text-zinc-700 dark:text-zinc-200">
                                {l.caller || l.owner}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Contact Switcher for Call/WhatsApp if secondary phone exists */}
                            {l.secondaryPhone && (
                              <div className="flex items-center bg-zinc-100 dark:bg-zinc-700/70 p-0.5 rounded-md text-[9px] font-bold">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveContactTarget((prev) => ({ ...prev, [l.id]: "primary" }))
                                  }}
                                  className={`px-1 py-0.5 rounded transition-all cursor-pointer ${
                                    (activeContactTarget[l.id] || "primary") === "primary"
                                      ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold"
                                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                  }`}
                                  title={`Target Primary: ${l.primaryContact} (${l.phone})`}
                                >
                                  Primary
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveContactTarget((prev) => ({ ...prev, [l.id]: "secondary" }))
                                  }}
                                  className={`px-1 py-0.5 rounded transition-all cursor-pointer ${
                                    activeContactTarget[l.id] === "secondary"
                                      ? "bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-2xs font-extrabold"
                                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                  }`}
                                  title={`Target Manager: ${l.secondaryContact || "Manager"} (${l.secondaryPhone})`}
                                >
                                  Mgr
                                </button>
                              </div>
                            )}

                            {/* Caller Avatar */}
                            <img
                              src={
                                l.ownerAvatar ||
                                (user?.avatar && (l.caller === user.name || l.owner === user.name) ? user.avatar : null) ||
                                `https://api.dicebear.com/7.x/notionists/svg?seed=${l.caller || l.name}`
                              }
                              alt={l.name}
                              className="w-5 h-5 rounded-full border border-zinc-200 object-cover shrink-0"
                            />

                            {/* Call Button */}
                            {(() => {
                              const isSec = activeContactTarget[l.id] === "secondary" && !!l.secondaryPhone
                              const targetNum = isSec ? l.secondaryPhone! : l.phone
                              const targetLabel = isSec ? `Manager (${l.secondaryContact || "Manager"})` : `Primary (${l.primaryContact})`
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`tel:${targetNum.replace(/[^0-9+]/g, "")}`)
                                  }}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                                    isSec
                                      ? "bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                      : "bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
                                  }`}
                                  title={`Call ${targetLabel}: ${targetNum}`}
                                >
                                  <Phone size={10} />
                                </button>
                              )
                            })()}

                            {/* WhatsApp Button */}
                            {(() => {
                              const isSec = activeContactTarget[l.id] === "secondary" && !!l.secondaryPhone
                              const targetNum = isSec ? l.secondaryPhone! : l.phone
                              const targetLabel = isSec ? `Manager (${l.secondaryContact || "Manager"})` : `Primary (${l.primaryContact})`
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`https://wa.me/${targetNum.replace(/[^0-9]/g, "")}`)
                                  }}
                                  className="w-5 h-5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center transition-colors shrink-0"
                                  title={`WhatsApp ${targetLabel}: ${targetNum}`}
                                >
                                  <MessageSquare size={10} />
                                </button>
                              )
                            })()}

                            {/* Admin Manual Lock Button (Shown for Unlocked Cards) */}
                            {isSuperAdminOrAdmin && !isLocked && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  const { lockLead } = await import("../services/leadService")
                                  const locked = await lockLead(l.id, "Manually locked by Admin")
                                  onLeadUpdated(locked)
                                }}
                                className="p-1 rounded bg-zinc-100 hover:bg-rose-100 text-zinc-500 hover:text-rose-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 transition-all duration-300 shrink-0 hover:scale-110 group/kblock cursor-pointer"
                                title="Admin Manual Lock Lead"
                              >
                                <Unlock size={11} className="group-hover/kblock:rotate-[-18deg] transition-transform duration-300" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Prominent Overlay Badge for Locked Cards */}
                      {isLocked && (
                        <div className="absolute inset-0 z-20 bg-rose-950/25 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-2 text-center border-2 border-rose-500/80 shadow-md">
                          <div className="bg-rose-600 text-white font-extrabold text-xs px-3 py-1 rounded-lg shadow-sm flex items-center gap-1.5 mb-1">
                            <Lock size={12} className="animate-pulse" />
                            <span>LEAD IS LOCKED</span>
                          </div>
                          <p className="text-[10px] text-rose-900 dark:text-rose-100 font-semibold px-2">
                            {l.lockedReason || "SLA Missed - Untouchable by telecaller"}
                          </p>

                          {/* Admin Unlock Button */}
                          {isSuperAdminOrAdmin && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation()
                                const { unlockLead } = await import("../services/leadService")
                                const unlocked = await unlockLead(l.id)
                                onLeadUpdated(unlocked)
                              }}
                              className="group/kunlock mt-2 bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105"
                            >
                              <Unlock size={12} className="group-hover/kunlock:rotate-[-18deg] transition-transform duration-300" />
                              <span>Admin Unlock Lead</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {columnLeads.length === 0 && (
                  <div className="p-4 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    No leads in {col.title}
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
