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
  Pencil,
} from "lucide-react"
import { Lead, LeadStatus } from "../types"
import { LeadFiltersDropdown } from "./LeadFiltersDropdown"
import { updateLead } from "../services/leadService"
import { LabelItem } from "./ManageLabelsModal"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { getUsers } from "@/app/feature/users/services/userService"

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

function WhatsAppIcon({ className, size = 13 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

function parseReminderTimestamp(dateStr?: string, timeStr?: string): number {
  if (!dateStr || dateStr === "None" || dateStr === "-" || dateStr.toLowerCase().includes("no reminder") || dateStr.includes("00")) {
    return Infinity // Leads with no reminder appear at the bottom
  }

  let year = new Date().getFullYear()
  let month = new Date().getMonth()
  let day = new Date().getDate()

  const trimmed = dateStr.trim()
  const textMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (textMatch) {
    day = parseInt(textMatch[1], 10)
    const mStr = textMatch[2].substring(0, 3).toLowerCase()
    month = MONTH_MAP[mStr] !== undefined ? MONTH_MAP[mStr] : month
    year = parseInt(textMatch[3], 10)
  } else if (trimmed.includes("-") || trimmed.includes("/") || trimmed.includes(",")) {
    const parts = trimmed.split(/[-/, ]+/).filter(Boolean)
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10)
        month = parseInt(parts[1], 10) - 1
        day = parseInt(parts[2], 10)
      } else {
        day = parseInt(parts[0], 10)
        month = parseInt(parts[1], 10) - 1
        year = parseInt(parts[2], 10)
      }
    }
  } else {
    const parsed = Date.parse(trimmed)
    if (!isNaN(parsed)) return parsed
  }

  let hours = 0
  let minutes = 0

  if (timeStr && timeStr !== "None") {
    const isPM = /pm/i.test(timeStr)
    const isAM = /am/i.test(timeStr)
    const cleanTime = timeStr.replace(/[^0-9:]/g, "").trim()
    const [hRaw, mRaw] = cleanTime.split(":").map((v) => parseInt(v, 10))
    if (!isNaN(hRaw)) {
      let h = hRaw
      if (isPM && h < 12) h += 12
      if (isAM && h === 12) h = 0
      hours = h
    }
    if (!isNaN(mRaw)) minutes = mRaw
  }

  const d = new Date(year, month, day, hours, minutes)
  return isNaN(d.getTime()) ? Infinity : d.getTime()
}

function getCallerAvatar(
  lead: Lead,
  allUsers: { id: string; name: string; avatar?: string }[],
  currentUser?: { name?: string; avatar?: string } | null
) {
  const callerName =
    (lead.assignedTo && lead.assignedTo !== "None" && lead.assignedTo !== "Unassigned")
      ? lead.assignedTo
      : ((lead.caller && lead.caller !== "None" && lead.caller !== "Unassigned")
        ? lead.caller
        : ((lead.owner && lead.owner !== "None" && lead.owner !== "Unassigned")
          ? lead.owner
          : null))

  if (!callerName) {
    return { type: "unassigned" as const, name: "Unassigned" }
  }

  // 1. Direct lead.ownerAvatar if it is a real profile image (not a placeholder svg string or dicebear)
  if (lead.ownerAvatar && lead.ownerAvatar.trim() && !lead.ownerAvatar.includes("dicebear")) {
    return { type: "image" as const, src: lead.ownerAvatar, name: callerName }
  }

  // 2. Current logged in user profile image
  if (currentUser && currentUser.name && currentUser.name.trim().toLowerCase() === callerName.trim().toLowerCase()) {
    if (currentUser.avatar && currentUser.avatar.trim() && !currentUser.avatar.includes("dicebear")) {
      return { type: "image" as const, src: currentUser.avatar, name: callerName }
    }
  }

  // 3. Matched user from allUsers database
  const matchedUser = allUsers.find(
    (u) => u.name && u.name.trim().toLowerCase() === callerName.trim().toLowerCase()
  )
  if (matchedUser && matchedUser.avatar && matchedUser.avatar.trim() && !matchedUser.avatar.includes("dicebear")) {
    return { type: "image" as const, src: matchedUser.avatar, name: callerName }
  }

  // 4. If user exists with name, show initials badge
  const parts = callerName.trim().split(/\s+/)
  const initials = (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : (parts[0] ? parts[0].substring(0, 2) : "")).toUpperCase()

  return { type: "initials" as const, initials, name: callerName }
}

interface KanbanColumnConfig {
  id: LeadStatus
  title: string
  headerBg: string
  borderTop: string
  titleColor: string
  badgeBg: string
  badgeText: string
  columnBorder: string
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: "New",
    title: "New",
    headerBg: "bg-sky-100/70 dark:bg-sky-950/60",
    borderTop: "border-t-sky-500",
    titleColor: "text-sky-900 dark:text-sky-200",
    badgeBg: "bg-sky-200/80 dark:bg-sky-900/80",
    badgeText: "text-sky-800 dark:text-sky-200",
    columnBorder: "border-sky-200/80 dark:border-sky-900/60",
  },
  {
    id: "Qualified",
    title: "Qualified",
    headerBg: "bg-teal-100/70 dark:bg-teal-950/60",
    borderTop: "border-t-teal-500",
    titleColor: "text-teal-900 dark:text-teal-200",
    badgeBg: "bg-teal-200/80 dark:bg-teal-900/80",
    badgeText: "text-teal-800 dark:text-teal-200",
    columnBorder: "border-teal-200/80 dark:border-teal-900/60",
  },
  {
    id: "Discussion",
    title: "Discussion",
    headerBg: "bg-indigo-100/70 dark:bg-indigo-950/60",
    borderTop: "border-t-indigo-500",
    titleColor: "text-indigo-900 dark:text-indigo-200",
    badgeBg: "bg-indigo-200/80 dark:bg-indigo-900/80",
    badgeText: "text-indigo-800 dark:text-indigo-200",
    columnBorder: "border-indigo-200/80 dark:border-indigo-900/60",
  },
  {
    id: "Negotiation",
    title: "Negotiation",
    headerBg: "bg-purple-100/70 dark:bg-purple-950/60",
    borderTop: "border-t-purple-500",
    titleColor: "text-purple-900 dark:text-purple-200",
    badgeBg: "bg-purple-200/80 dark:bg-purple-900/80",
    badgeText: "text-purple-800 dark:text-purple-200",
    columnBorder: "border-purple-200/80 dark:border-purple-900/60",
  },
  {
    id: "Store Visit",
    title: "Store Visit",
    headerBg: "bg-amber-100/70 dark:bg-amber-950/60",
    borderTop: "border-t-amber-500",
    titleColor: "text-amber-900 dark:text-amber-200",
    badgeBg: "bg-amber-200/80 dark:bg-amber-900/80",
    badgeText: "text-amber-800 dark:text-amber-200",
    columnBorder: "border-amber-200/80 dark:border-amber-900/60",
  },
  {
    id: "Our Office Visit",
    title: "Our Office Visit",
    headerBg: "bg-orange-100/70 dark:bg-orange-950/60",
    borderTop: "border-t-orange-500",
    titleColor: "text-orange-900 dark:text-orange-200",
    badgeBg: "bg-orange-200/80 dark:bg-orange-900/80",
    badgeText: "text-orange-800 dark:text-orange-200",
    columnBorder: "border-orange-200/80 dark:border-orange-900/60",
  },
  {
    id: "Won",
    title: "Won",
    headerBg: "bg-emerald-100/70 dark:bg-emerald-950/60",
    borderTop: "border-t-emerald-500",
    titleColor: "text-emerald-900 dark:text-emerald-200",
    badgeBg: "bg-emerald-200/80 dark:bg-emerald-900/80",
    badgeText: "text-emerald-800 dark:text-emerald-200",
    columnBorder: "border-emerald-200/80 dark:border-emerald-900/60",
  },
  {
    id: "Lost",
    title: "Lost",
    headerBg: "bg-rose-100/70 dark:bg-rose-950/60",
    borderTop: "border-t-rose-500",
    titleColor: "text-rose-900 dark:text-rose-200",
    badgeBg: "bg-rose-200/80 dark:bg-rose-900/80",
    badgeText: "text-rose-800 dark:text-rose-200",
    columnBorder: "border-rose-200/80 dark:border-rose-900/60",
  },
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

  const [allUsers, setAllUsers] = React.useState<{ id: string; name: string; role?: string; department?: string; email?: string; avatar?: string }[]>([])
  const [selectedMember, setSelectedMember] = React.useState<string>("all")
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = React.useState(false)

  React.useEffect(() => {
    getUsers("all").then((list) => {
      setAllUsers(list || [])
    })
  }, [])

  const teamMembersList = React.useMemo(() => {
    const memberNames = new Set<string>()
    allUsers.forEach((u) => {
      if (u.name && u.name.trim()) memberNames.add(u.name.trim())
    })
    ;(leads || []).forEach((l) => {
      if (l.assignedTo && l.assignedTo !== "None" && l.assignedTo !== "Unassigned") memberNames.add(l.assignedTo.trim())
      if (l.caller && l.caller !== "None" && l.caller !== "Unassigned") memberNames.add(l.caller.trim())
      if (l.owner && l.owner !== "None" && l.owner !== "Unassigned") memberNames.add(l.owner.trim())
    })
    return Array.from(memberNames).sort((a, b) => a.localeCompare(b))
  }, [allUsers, leads])

  const [activeFilter, setActiveFilter] = React.useState("All leads")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isFiltersDropdownOpen, setIsFiltersDropdownOpen] = React.useState(false)
  const [draggedLeadId, setDraggedLeadId] = React.useState<string | null>(null)
  const [activeContactTarget, setActiveContactTarget] = React.useState<Record<string, "primary" | "secondary">>({})

  // Mouse horizontal drag-to-scroll (Initiated from Column Headers only)
  const kanbanTrackRef = React.useRef<HTMLDivElement>(null)
  const isKanbanDraggingRef = React.useRef(false)
  const kanbanStartXRef = React.useRef(0)
  const kanbanScrollLeftRef = React.useRef(0)
  const hasKanbanDraggedRef = React.useRef(false)

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isKanbanDraggingRef.current || !kanbanTrackRef.current) return
      const x = e.pageX - kanbanTrackRef.current.offsetLeft
      const walk = (x - kanbanStartXRef.current) * 1.5
      if (Math.abs(walk) > 3) {
        hasKanbanDraggedRef.current = true
      }
      kanbanTrackRef.current.scrollLeft = kanbanScrollLeftRef.current - walk
    }

    const onMouseUp = () => {
      if (!isKanbanDraggingRef.current) return
      isKanbanDraggingRef.current = false
      if (kanbanTrackRef.current) {
        kanbanTrackRef.current.style.removeProperty("user-select")
      }
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  const handleHeaderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !kanbanTrackRef.current) return
    isKanbanDraggingRef.current = true
    hasKanbanDraggedRef.current = false
    kanbanStartXRef.current = e.pageX - kanbanTrackRef.current.offsetLeft
    kanbanScrollLeftRef.current = kanbanTrackRef.current.scrollLeft
    kanbanTrackRef.current.style.userSelect = "none"
  }

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasKanbanDraggedRef.current) {
      e.stopPropagation()
      e.preventDefault()
      hasKanbanDraggedRef.current = false
    }
  }

  // Filter leads
  const filteredLeads = (leads || []).filter((l) => {
    if (!l) return false
    const q = searchQuery.trim().toLowerCase()
    const cleanQueryDigits = q.replace(/\D/g, "")

    const nameStr = (l.name || "").toLowerCase()
    const contactStr = (l.primaryContact || "").toLowerCase()
    const secondaryContactStr = (l.secondaryContact || "").toLowerCase()
    const cityStr = (l.city || "").toLowerCase()
    const phoneStr = (l.phone || "").toLowerCase()
    const phoneDigits = (l.phone || "").replace(/\D/g, "")
    const secondaryPhoneStr = (l.secondaryPhone || "").toLowerCase()
    const secondaryPhoneDigits = (l.secondaryPhone || "").replace(/\D/g, "")
    const assignedToStr = (l.assignedTo || "").toLowerCase()
    const ownerStr = (l.owner || "").toLowerCase()
    const callerStr = (l.caller || "").toLowerCase()
    const managersStr = (l.managers || "").toLowerCase()
    const createdByStr = (l.createdBy || "").toLowerCase()
    const serviceStr = (l.service || "").toLowerCase()
    const sourceStr = (l.source || "").toLowerCase()

    const matchesSearch =
      !q ||
      nameStr.includes(q) ||
      contactStr.includes(q) ||
      secondaryContactStr.includes(q) ||
      cityStr.includes(q) ||
      phoneStr.includes(q) ||
      secondaryPhoneStr.includes(q) ||
      (cleanQueryDigits.length >= 3 && (phoneDigits.includes(cleanQueryDigits) || secondaryPhoneDigits.includes(cleanQueryDigits))) ||
      assignedToStr.includes(q) ||
      ownerStr.includes(q) ||
      callerStr.includes(q) ||
      managersStr.includes(q) ||
      createdByStr.includes(q) ||
      serviceStr.includes(q) ||
      sourceStr.includes(q)

    // Team member filter
    if (selectedMember !== "all") {
      if (selectedMember === "unassigned") {
        const isAssigned =
          (l.assignedTo && l.assignedTo !== "None" && l.assignedTo !== "Unassigned") ||
          (l.caller && l.caller !== "None" && l.caller !== "Unassigned") ||
          (l.owner && l.owner !== "None" && l.owner !== "Unassigned")
        if (isAssigned) return false
      } else {
        const targetMemberNorm = selectedMember.toLowerCase().trim()
        const isMatch =
          (l.assignedTo && l.assignedTo.toLowerCase().trim() === targetMemberNorm) ||
          (l.caller && l.caller.toLowerCase().trim() === targetMemberNorm) ||
          (l.owner && l.owner.toLowerCase().trim() === targetMemberNorm) ||
          (l.managers && l.managers.toLowerCase().includes(targetMemberNorm))
        if (!isMatch) return false
      }
    }

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

    return matchesSearch && leadLabels.includes(activeFilter)
  })

  // Drag and drop handling
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id)
    e.dataTransfer.effectAllowed = "move"
    setDraggedLeadId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (newStatus: LeadStatus, leadIdParam?: string) => {
    const leadId = leadIdParam || draggedLeadId
    if (!leadId) return
    const targetLead = leads.find((l) => l.id === leadId)
    if (targetLead && targetLead.status !== newStatus) {
      if (targetLead.isLocked && !isSuperAdminOrAdmin) {
        alert("🔒 This lead is locked due to missed SLA and cannot be moved.")
        setDraggedLeadId(null)
        return
      }
      try {
        const updated = await updateLead(leadId, { status: newStatus }, user?.role)
        onLeadUpdated(updated)
      } catch (err: any) {
        console.error("Error moving lead:", err)
      }
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

          {/* Team Member Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsMemberDropdownOpen(!isMemberDropdownOpen)
                setIsFiltersDropdownOpen(false)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer ${
                selectedMember !== "all"
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                  : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <UserIcon size={13} className={selectedMember !== "all" ? "text-blue-600" : "text-zinc-500"} />
              <span>{selectedMember === "all" ? "All Team Members" : selectedMember === "unassigned" ? "Unassigned Leads" : selectedMember}</span>
              <span className="text-[10px] ml-0.5 text-zinc-400">▼</span>
            </button>

            {isMemberDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMemberDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-30 py-1.5 max-h-72 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMember("all")
                      setIsMemberDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                      selectedMember === "all" ? "font-semibold text-blue-600 bg-blue-50/50 dark:bg-blue-950/30" : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <span>All Team Members</span>
                    {selectedMember === "all" && <span>✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMember("unassigned")
                      setIsMemberDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                      selectedMember === "unassigned" ? "font-semibold text-blue-600 bg-blue-50/50 dark:bg-blue-950/30" : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <span className="text-zinc-500 italic">Unassigned Leads</span>
                    {selectedMember === "unassigned" && <span>✓</span>}
                  </button>

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                  <div className="px-3 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Team Members
                  </div>

                  {teamMembersList.map((member) => {
                    const leadCount = (leads || []).filter((l) => {
                      const mNorm = member.toLowerCase().trim()
                      return (
                        (l.assignedTo && l.assignedTo.toLowerCase().trim() === mNorm) ||
                        (l.caller && l.caller.toLowerCase().trim() === mNorm) ||
                        (l.owner && l.owner.toLowerCase().trim() === mNorm) ||
                        (l.managers && l.managers.toLowerCase().includes(mNorm))
                      )
                    }).length

                    const isSelected = selectedMember === member

                    return (
                      <button
                        key={member}
                        type="button"
                        onClick={() => {
                          setSelectedMember(member)
                          setIsMemberDropdownOpen(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                          isSelected ? "font-semibold text-blue-600 bg-blue-50/50 dark:bg-blue-950/30" : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {member.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate">{member}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">
                          {leadCount}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
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
              onClick={() => setActiveFilter("Call this week")}
              className={`p-1.5 rounded-full transition-colors ${
                activeFilter === "Call this week"
                  ? "bg-purple-100 text-purple-700 border border-purple-300"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}
              title="Phone Leads"
            >
              <Phone size={14} />
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("My leads")}
              className={`p-1.5 rounded-full transition-colors ${
                activeFilter === "My leads"
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}
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
              placeholder="Search name, assigned user, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-64 pl-3 pr-8 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
            <Search size={13} className="absolute right-3 top-2 text-zinc-400" />
          </div>
        </div>

      </div>

      {/* ---------------- KANBAN STAGE COLUMNS (Single Horizontal Scroll Track) ---------------- */}
      <div
        ref={kanbanTrackRef}
        className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start scrollbar-thin max-w-full"
      >
        {KANBAN_COLUMNS.map((col) => {
          const rawColumnLeads = filteredLeads.filter((l) => {
            if (col.id === "Our Office Visit") {
              return l.status === "Our Office Visit" || l.status === "They come to our office"
            }
            return l.status === col.id
          })

          // Follow-up columns sorted chronologically by reminder date (earliest / tomorrow on top)
          // "New" column remains unorganized as added
          const columnLeads =
            col.id === "New"
              ? rawColumnLeads
              : [...rawColumnLeads].sort((a, b) => {
                  const timeA = parseReminderTimestamp(a.reminderDate, a.reminderTime)
                  const timeB = parseReminderTimestamp(b.reminderDate, b.reminderTime)
                  return timeA - timeB
                })

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDragEnter={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId
                if (leadId) {
                  await handleDrop(col.id, leadId)
                }
              }}
              className={`w-72 min-w-[288px] max-w-[288px] shrink-0 bg-zinc-50/70 dark:bg-zinc-900/60 border ${col.columnBorder} rounded-xl flex flex-col min-h-[620px] overflow-hidden shadow-2xs`}
            >
              {/* Column Header - Drag here to scroll board horizontally */}
              <div
                onMouseDown={handleHeaderMouseDown}
                className={`p-3 ${col.headerBg} border-t-2 ${col.borderTop} border-b ${col.columnBorder} flex items-center justify-between cursor-grab active:cursor-grabbing select-none transition-colors`}
                title="Press & drag column header left/right to scroll"
              >
                <span className={`text-xs font-bold ${col.titleColor} truncate pr-2 pointer-events-none tracking-tight`}>
                  {col.title}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg} ${col.badgeText} shrink-0 pointer-events-none shadow-2xs`}>
                  {columnLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div
                onDragOver={handleDragOver}
                onDragEnter={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId
                  if (leadId) {
                    await handleDrop(col.id, leadId)
                  }
                }}
                className="p-2 space-y-2.5 flex-1 overflow-y-auto max-h-[75vh]"
              >
                {columnLeads.map((l) => {
                  const isLocked = !!l.isLocked

                  return (
                    <div
                      key={l.id}
                      data-lead-card="true"
                      draggable={!isLocked}
                      onDragStart={(e) => {
                        if (isLocked) {
                          e.preventDefault()
                          return
                        }
                        e.dataTransfer.setData("text/plain", l.id)
                        e.dataTransfer.effectAllowed = "move"
                        setDraggedLeadId(l.id)
                      }}
                      onDragEnd={() => setDraggedLeadId(null)}
                      onDragOver={handleDragOver}
                      onDrop={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId
                        if (leadId) {
                          await handleDrop(col.id, leadId)
                        }
                      }}
                      className={`border rounded-xl p-3 shadow-2xs transition-all space-y-2 relative group overflow-hidden ${
                        isLocked
                          ? "bg-rose-50/50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800"
                          : "bg-white dark:bg-zinc-800 border-zinc-200/90 dark:border-zinc-700/80 hover:shadow-md cursor-grab active:cursor-grabbing"
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

                        {/* Line 4: Reminder (Date + Time in Amber/Orange) */}
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                          <Clock size={12} className="text-amber-500 shrink-0" />
                          <span className="truncate">
                            Reminder:{" "}
                            <strong className="font-semibold text-amber-600 dark:text-amber-400">
                              {l.reminderDate && l.reminderDate !== "None" ? l.reminderDate : "No Reminder"}
                              {l.reminderTime && l.reminderTime !== "None" ? ` ${l.reminderTime}` : ""}
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

                        {/* Line 5: Caller & Avatar (Prominently displayed above buttons) */}
                        <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <UserIcon size={12} className="text-zinc-400 shrink-0" />
                            <span className="truncate">
                              Caller:{" "}
                              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {(l.assignedTo && l.assignedTo !== "None" && l.assignedTo !== "Unassigned")
                                  ? l.assignedTo
                                  : ((l.caller && l.caller !== "None" && l.caller !== "Unassigned")
                                    ? l.caller
                                    : ((l.owner && l.owner !== "None" && l.owner !== "Unassigned")
                                      ? l.owner
                                      : "Unassigned"))}
                              </strong>
                            </span>
                          </div>

                          {/* Caller Avatar (Real Profile Picture if available, otherwise initials or unassigned icon) */}
                          {(() => {
                            const avatarInfo = getCallerAvatar(l, allUsers, user)
                            if (avatarInfo.type === "image") {
                              return (
                                <img
                                  src={avatarInfo.src}
                                  alt={avatarInfo.name}
                                  className="w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover shrink-0 shadow-2xs"
                                  title={avatarInfo.name}
                                />
                              )
                            }
                            if (avatarInfo.type === "initials" && avatarInfo.initials) {
                              return (
                                <div
                                  className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs"
                                  title={avatarInfo.name}
                                >
                                  {avatarInfo.initials}
                                </div>
                              )
                            }
                            return (
                              <div
                                className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0"
                                title="Unassigned"
                              >
                                <UserIcon size={10} />
                              </div>
                            )
                          })()}
                        </div>

                        {/* Line 6: Bottom Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-700/60 text-[11px] gap-1.5">
                          {/* Contact Switcher for Call/WhatsApp if secondary phone exists */}
                          {l.secondaryPhone ? (
                            <div className="flex items-center bg-zinc-100 dark:bg-zinc-700/70 p-0.5 rounded-md text-[9px] font-bold">
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveContactTarget((prev) => ({ ...prev, [l.id]: "primary" }))
                                }}
                                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
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
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveContactTarget((prev) => ({ ...prev, [l.id]: "secondary" }))
                                }}
                                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                  activeContactTarget[l.id] === "secondary"
                                    ? "bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-2xs font-extrabold"
                                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                }`}
                                title={`Target Manager: ${l.secondaryContact || "Manager"} (${l.secondaryPhone})`}
                              >
                                Mgr
                              </button>
                            </div>
                          ) : (
                            <div />
                          )}

                          <div className="flex items-center gap-1.5 shrink-0">

                            {/* Call Button */}
                            {(() => {
                              const isSec = activeContactTarget[l.id] === "secondary" && !!l.secondaryPhone
                              const targetNum = isSec ? l.secondaryPhone! : l.phone
                              const targetLabel = isSec ? `Manager (${l.secondaryContact || "Manager"})` : `Primary (${l.primaryContact})`
                              return (
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`tel:${targetNum.replace(/[^0-9+]/g, "")}`)
                                  }}
                                  className={`w-7 h-7 min-w-[28px] min-h-[28px] rounded-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs ${
                                    isSec
                                      ? "bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-300"
                                      : "bg-blue-100/80 hover:bg-blue-200 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300"
                                  }`}
                                  title={`Call ${targetLabel}: ${targetNum}`}
                                >
                                  <Phone size={13} className="pointer-events-none" />
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
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`https://wa.me/${targetNum.replace(/[^0-9]/g, "")}`)
                                  }}
                                  className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-lg bg-emerald-100/80 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                                  title={`WhatsApp ${targetLabel}: ${targetNum}`}
                                >
                                  <WhatsAppIcon size={14} className="pointer-events-none" />
                                </button>
                              )
                            })()}

                            {/* Edit Lead Button (Only via Pencil Icon) */}
                            {!isLocked && (
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectLeadDetail(l)
                                }}
                                className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                                title="Edit lead"
                              >
                                <Pencil size={13} className="pointer-events-none" />
                              </button>
                            )}

                            {/* Admin Manual Lock Button (Shown for Unlocked Cards) */}
                            {isSuperAdminOrAdmin && !isLocked && (
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  const { lockLead } = await import("../services/leadService")
                                  const locked = await lockLead(l.id, "Manually locked by Admin")
                                  onLeadUpdated(locked)
                                }}
                                className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-lg bg-zinc-100 hover:bg-rose-100 text-zinc-600 hover:text-rose-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-rose-950 dark:hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs group/kblock"
                                title="Admin Manual Lock Lead"
                              >
                                <Unlock size={13} className="group-hover/kblock:rotate-[-18deg] transition-transform duration-300 pointer-events-none" />
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
