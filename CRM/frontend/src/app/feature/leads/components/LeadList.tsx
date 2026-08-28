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
  RotateCw,
  Send,
  CheckSquare,
  Check,
  Clock,
  Layers,
} from "lucide-react"
import { Lead } from "../types"
import { LeadFiltersDropdown } from "./LeadFiltersDropdown"
import { formatLeadReminderDate, transferLeadsToBranch, parseLeadDate } from "../services/leadService"
import { LabelItem } from "./ManageLabelsModal"
import { LabelSelectorPopover } from "./LabelSelectorPopover"
import { WhatsAppTemplateModal } from "./WhatsAppTemplateModal"
import { CallOutcomeModal } from "./CallOutcomeModal"
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
  const { user, branches, activeCompanyId, activeBranchId } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  
  const isSuperAdmin = user?.role === "Super Admin"
  const isSuperAdminOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"
  const canAddLead = isSuperAdmin || canPerformAction(user, "Leads", "add")
  const canEditLead = isSuperAdmin || canPerformAction(user, "Leads", "edit")
  const canDeleteLead = isSuperAdmin || canPerformAction(user, "Leads", "delete")

  // Branches belonging to current active company (cleanly handle empty branches)
  const activeBranches = React.useMemo(() => {
    if (!branches || !Array.isArray(branches)) return []
    if (activeCompanyId && activeCompanyId !== "all") {
      return branches.filter((b) => b.companyId === activeCompanyId)
    }
    return branches
  }, [branches, activeCompanyId])

  // Bulk and Individual Lead Selection state
  const [selectedLeadIds, setSelectedLeadIds] = React.useState<string[]>([])
  const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false)
  const [selectedTargetBranchId, setSelectedTargetBranchId] = React.useState<string>("")
  const [selectedBranchFilter, setSelectedBranchFilter] = React.useState<string>(activeBranchId || "all")
  const [isTransferring, setIsTransferring] = React.useState(false)

  React.useEffect(() => {
    if (activeBranchId) {
      setSelectedBranchFilter(activeBranchId)
    } else {
      setSelectedBranchFilter("all")
    }
  }, [activeBranchId])

  const [allUsers, setAllUsers] = React.useState<{ id: string; name: string; role?: string; department?: string; email?: string; avatar?: string; avatarUrl?: string }[]>([])
  const [usersMap, setUsersMap] = React.useState<Record<string, { department?: string; role?: string; avatarUrl?: string }>>({})
  const [selectedMember, setSelectedMember] = React.useState<string>("all")
  const [selectedMemberStage, setSelectedMemberStage] = React.useState<string>("all")
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = React.useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = React.useState("")

  const [selectedStageFilter, setSelectedStageFilter] = React.useState<string>("all")
  const [isStageDropdownOpen, setIsStageDropdownOpen] = React.useState(false)
  const [selectedReminderFilter, setSelectedReminderFilter] = React.useState<string>("all")
  const [isReminderDropdownOpen, setIsReminderDropdownOpen] = React.useState(false)
  const [whatsAppModalLead, setWhatsAppModalLead] = React.useState<Lead | null>(null)
  const [callOutcomeModalLead, setCallOutcomeModalLead] = React.useState<Lead | null>(null)

  React.useEffect(() => {
    getUsers("all").then((list) => {
      setAllUsers(list || [])
      const map: Record<string, { department?: string; role?: string; avatarUrl?: string }> = {}
      ;(list || []).forEach((u) => {
        if (u.name) map[u.name.toLowerCase().trim()] = { department: u.department, role: u.role, avatarUrl: u.avatarUrl }
        if (u.email) map[u.email.toLowerCase().trim()] = { department: u.department, role: u.role, avatarUrl: u.avatarUrl }
      })
      setUsersMap(map)
    })
  }, [])

  // Only include team members who actually have assigned leads
  const assignedTeamMembers = React.useMemo(() => {
    const memberCounts: Record<string, number> = {}
    ;(leads || []).forEach((l) => {
      const candidates = [l.assignedTo, l.caller, l.owner].filter(
        (name): name is string => Boolean(name && name.trim() && name !== "None" && name !== "Unassigned")
      )
      const uniqueNames = new Set(candidates.map((n) => n.trim()))
      uniqueNames.forEach((name) => {
        memberCounts[name] = (memberCounts[name] || 0) + 1
      })
    })

    const allMembers = Object.entries(memberCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

    if (!isSuperAdminOrAdmin && user?.name) {
      const myNorm = user.name.toLowerCase().trim()
      return allMembers.filter(m => m.name.toLowerCase().trim() === myNorm || m.name.toLowerCase().includes(myNorm) || myNorm.includes(m.name.toLowerCase().trim()))
    }

    return allMembers
  }, [leads, isSuperAdminOrAdmin, user?.name])

  // Compute breakdown of stages for each assigned member
  const memberStageBreakdown = React.useMemo(() => {
    const breakdown: Record<string, Record<string, number>> = {}
    ;(leads || []).forEach((l) => {
      const candidates = [l.assignedTo, l.caller, l.owner].filter(
        (name): name is string => Boolean(name && name.trim() && name !== "None" && name !== "Unassigned")
      )
      const uniqueNames = new Set(candidates.map((n) => n.trim()))
      const rawStatus = l.status || "New"
      const status = rawStatus === "They come to our office" ? "Our Office Visit" : rawStatus
      uniqueNames.forEach((name) => {
        if (!breakdown[name]) breakdown[name] = {}
        breakdown[name][status] = (breakdown[name][status] || 0) + 1
      })
    })
    return breakdown
  }, [leads])

  const [activeFilter, setActiveFilter] = React.useState("All leads")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isFiltersDropdownOpen, setIsFiltersDropdownOpen] = React.useState(false)
  const [activePopoverLeadId, setActivePopoverLeadId] = React.useState<string | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Mouse horizontal drag-to-scroll
  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const isDraggingRef = React.useRef(false)
  const startXRef = React.useRef(0)
  const scrollLeftRef = React.useRef(0)
  const hasDraggedRef = React.useRef(false)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !tableContainerRef.current) return
    const target = e.target as HTMLElement
    // Ignore interactive elements so users can click/select normally
    if (target.closest("input, select, textarea, button, a")) return

    isDraggingRef.current = true
    hasDraggedRef.current = false
    startXRef.current = e.pageX - tableContainerRef.current.offsetLeft
    scrollLeftRef.current = tableContainerRef.current.scrollLeft
    tableContainerRef.current.style.cursor = "grabbing"
    tableContainerRef.current.style.userSelect = "none"
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !tableContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - tableContainerRef.current.offsetLeft
    const walk = (x - startXRef.current) * 1.5
    if (Math.abs(walk) > 3) {
      hasDraggedRef.current = true
    }
    tableContainerRef.current.scrollLeft = scrollLeftRef.current - walk
  }

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    if (tableContainerRef.current) {
      tableContainerRef.current.style.cursor = "grab"
      tableContainerRef.current.style.removeProperty("user-select")
    }
  }

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasDraggedRef.current) {
      e.stopPropagation()
      e.preventDefault()
      hasDraggedRef.current = false
    }
  }

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeFilter, pageSize, selectedStageFilter, selectedReminderFilter, selectedBranchFilter, selectedMember, selectedMemberStage])

  // Filter logic
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

    if (!matchesSearch) return false

    // ── STAGE / STATUS FILTER ──
    if (selectedStageFilter !== "all") {
      const normLeadStatus = (l.status === "They come to our office" ? "Our Office Visit" : (l.status || "New")).toLowerCase().trim()
      const normTargetStage = (selectedStageFilter === "They come to our office" ? "Our Office Visit" : selectedStageFilter).toLowerCase().trim()
      if (normLeadStatus !== normTargetStage) return false
    }

    // ── REMINDER DATE FILTER ──
    if (selectedReminderFilter !== "all") {
      const rawDate = l.reminderDate
      const parsedD = parseLeadDate(rawDate)
      
      if (selectedReminderFilter === "none") {
        const clean = (rawDate || "").toString().toLowerCase().trim()
        if (clean && clean !== "none" && clean !== "-" && clean !== "00,00,0000" && clean !== "00-00-0000" && !clean.includes("no reminder") && parsedD) {
          return false
        }
      } else {
        if (!parsedD) return false
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const targetTime = parsedD.getTime()

        if (selectedReminderFilter === "today") {
          const endToday = new Date(today)
          endToday.setDate(endToday.getDate() + 1)
          if (targetTime < today.getTime() || targetTime >= endToday.getTime()) return false
        } else if (selectedReminderFilter === "yesterday") {
          const startYest = new Date(today)
          startYest.setDate(startYest.getDate() - 1)
          if (targetTime < startYest.getTime() || targetTime >= today.getTime()) return false
        } else if (selectedReminderFilter === "tomorrow") {
          const startTom = new Date(today)
          startTom.setDate(startTom.getDate() + 1)
          const endTom = new Date(today)
          endTom.setDate(endTom.getDate() + 2)
          if (targetTime < startTom.getTime() || targetTime >= endTom.getTime()) return false
        } else if (selectedReminderFilter === "week") {
          // Current / next 7 days
          const startWeek = new Date(today)
          const endWeek = new Date(today)
          endWeek.setDate(endWeek.getDate() + 7)
          if (targetTime < startWeek.getTime() || targetTime > endWeek.getTime()) return false
        } else if (selectedReminderFilter === "month") {
          // Current / next 30 days
          const startMonth = new Date(today)
          const endMonth = new Date(today)
          endMonth.setDate(endMonth.getDate() + 30)
          if (targetTime < startMonth.getTime() || targetTime > endMonth.getTime()) return false
        }
      }
    }

    // ── TEAM MEMBER FILTER ──
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

        // Stage sub-filter for assigned member
        if (selectedMemberStage && selectedMemberStage !== "all") {
          const leadStatus = l.status === "They come to our office" ? "Our Office Visit" : (l.status || "New")
          const targetStage = selectedMemberStage === "They come to our office" ? "Our Office Visit" : selectedMemberStage
          if (leadStatus !== targetStage) return false
        }
      }
    }

    // ── BRANCH FILTER ──
    const effectiveBranch = selectedBranchFilter !== "all" ? selectedBranchFilter : (activeBranchId || "all")
    if (effectiveBranch !== "all") {
      if (effectiveBranch === "unassigned") {
        if (l.branchId || l.assignedBranchId || l.branchName || l.assignedBranchName) return false
      } else {
        const targetBranchObj = branches.find(b => b.id === effectiveBranch || b.name.toLowerCase() === effectiveBranch.toLowerCase())
        const targetBranchId = String(targetBranchObj?.id || effectiveBranch).toLowerCase().trim()
        const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

        const lBranch = String(l.branchId || l.assignedBranchId || (l as any).branch_id || "").toLowerCase().trim()
        const lBranchName = String(l.branchName || l.assignedBranchName || (l as any).branch_name || "").toLowerCase().trim()

        const bMatch =
          (lBranch && (lBranch === targetBranchId || (targetBranchName && lBranch === targetBranchName))) ||
          (lBranchName && (lBranchName === targetBranchName || lBranchName === targetBranchId))

        if (!bMatch) return false
      }
    }

    const leadLabels = l.labels || []
    
    if (!activeFilter || activeFilter === "All leads" || activeFilter === "All Leads") {
      return true
    }

    if (activeFilter === "My leads") {
      const currentUserName = (user?.name || "").toLowerCase().trim()
      const currentUserEmail = (user?.email || "").toLowerCase().trim()
      const currentUserId = String(user?.id || "").toLowerCase().trim()
      const cId = String((l as any).createdById || "").toLowerCase().trim()
      const cEmail = ((l as any).createdByEmail || "").toLowerCase().trim()
      const cName = ((l as any).createdByName || l.createdBy || "").toLowerCase().trim()

      const isMyLead =
        (currentUserId && cId === currentUserId) ||
        (currentUserEmail && cEmail === currentUserEmail) ||
        (currentUserName && cName === currentUserName) ||
        (currentUserName && (
          (l.caller || "").toLowerCase() === currentUserName ||
          (l.assignedTo || "").toLowerCase() === currentUserName ||
          (l.owner || "").toLowerCase() === currentUserName
        )) ||
        (currentUserEmail && (
          (l.owner || "").toLowerCase() === currentUserEmail
        ))
      return Boolean(isMyLead)
    }

    // Check if activeFilter matches a source (e.g. Social Media, Meta Ads, Google Ads, Local Market)
    const leadSource = (l.source || "").toLowerCase().trim()
    const filterClean = activeFilter.toLowerCase().trim()
    if (leadSource === filterClean) {
      return true
    }

    return leadLabels.includes(activeFilter)
  })

  // Pagination calculation
  const totalItems = filteredLeads.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex)

  // Selection handlers
  const isAllVisibleSelected =
    paginatedLeads.length > 0 && paginatedLeads.every((l) => selectedLeadIds.includes(l.id))
  const isSomeVisibleSelected =
    paginatedLeads.some((l) => selectedLeadIds.includes(l.id)) && !isAllVisibleSelected

  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      const visibleIds = new Set(paginatedLeads.map((l) => l.id))
      setSelectedLeadIds((prev) => prev.filter((id) => !visibleIds.has(id)))
    } else {
      const next = new Set([...selectedLeadIds, ...paginatedLeads.map((l) => l.id)])
      setSelectedLeadIds(Array.from(next))
    }
  }

  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleExecuteTransfer = async () => {
    if (!selectedTargetBranchId) {
      alert("Please select a destination branch.")
      return
    }
    const targetBranch = activeBranches.find((b) => b.id === selectedTargetBranchId)
    if (!targetBranch) {
      alert("Selected branch could not be found.")
      return
    }

    setIsTransferring(true)
    try {
      const updated = await transferLeadsToBranch(
        selectedLeadIds,
        targetBranch.id,
        targetBranch.name,
        user?.name || "Admin",
        user?.role || "Admin",
        activeCompanyId || undefined
      )
      setSelectedLeadIds([])
      setIsTransferModalOpen(false)
      if (updated.length > 0 && onLeadUpdated) {
        onLeadUpdated(updated[0])
      }
    } catch (err) {
      console.error("Error transferring leads to branch:", err)
      alert("Failed to transfer leads to branch.")
    } finally {
      setIsTransferring(false)
    }
  }

  // Premium Styled Excel Export
  const handleExportExcel = () => {
    let filterTitle = activeFilter || "All Leads"
    if (selectedMember === "unassigned") {
      filterTitle += ` - Unassigned Leads`
    } else if (selectedMember !== "all") {
      filterTitle += ` - Member: ${selectedMember}`
      if (selectedMemberStage !== "all") {
        filterTitle += ` (${selectedMemberStage})`
      }
    }
    const timestamp = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

    const rowsHtml = filteredLeads
      .map((l, index) => {
        const isEven = index % 2 === 0
        const rowBg = isEven ? "#FFFFFF" : "#F8FAFC"
        const statusColors: Record<string, { bg: string; color: string }> = {
          Won: { bg: "#DCFCE7", color: "#166534" },
          Lost: { bg: "#FEE2E2", color: "#991B1B" },
          Contacted: { bg: "#DBEAFE", color: "#1E40AF" },
          New: { bg: "#F1F5F9", color: "#334155" },
          Negotiation: { bg: "#F3E8FF", color: "#6B21A8" },
          "Store Visit": { bg: "#E0E7FF", color: "#3730A3" },
          "Our Office Visit": { bg: "#FFEDD5", color: "#9A3412" },
          "They come to our office": { bg: "#FFEDD5", color: "#9A3412" },
        }
        const sColor = statusColors[l.status] || { bg: "#F1F5F9", color: "#334155" }

        const assignedPerson = (l.assignedTo && l.assignedTo !== "None" && l.assignedTo !== "Unassigned")
          ? l.assignedTo
          : ((l.caller && l.caller !== "None" && l.caller !== "Unassigned")
            ? l.caller
            : ((l.owner && l.owner !== "None" && l.owner !== "Unassigned")
              ? l.owner
              : "Unassigned"))

        const phoneVal = l.secondaryPhone ? `${l.phone} (Mgr: ${l.secondaryPhone})` : l.phone
        const contactVal = l.secondaryContact ? `${l.primaryContact} (Mgr: ${l.secondaryContact})` : l.primaryContact
        const reminderVal = l.reminderDate && l.reminderDate !== "None" && formatLeadReminderDate(l.reminderDate) !== "No Reminder"
          ? `${formatLeadReminderDate(l.reminderDate)}${l.reminderTime && l.reminderTime !== "None" ? ` (${l.reminderTime})` : ""}`
          : "No Reminder"

        return `
          <tr style="background-color: ${rowBg};">
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; text-align: center;">${index + 1}</td>
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">${l.name}</td>
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; color: #334155;">${contactVal}</td>
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; mso-number-format:'\\@'; color: #0284C7;">${phoneVal}</td>
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; color: #475569;">${l.service || "-"}</td>
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; color: #475569;">${l.source || "-"}</td>
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; color: #475569;">${l.city?.trim() || l.address?.trim() || l.state?.trim() || "-"}</td>
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; color: #334155;">${assignedPerson}</td>
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; color: #D97706;">${reminderVal}</td>
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; text-align: center;">
              <span style="background-color: ${sColor.bg}; color: ${sColor.color}; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 11px;">
                ${l.status}
              </span>
            </td>
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; text-align: center; color: #64748B;">${l.createdAt || "-"}</td>
          </tr>
        `
      })
      .join("")

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Leads</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #1E3A8A; color: #FFFFFF; font-weight: bold; padding: 10px 12px; border: 1px solid #1E40AF; text-align: left; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="11" style="background-color: #1E3A8A; color: #FFFFFF; font-size: 16px; font-weight: bold; padding: 14px; text-align: center;">
              SAAMPARK GROUP • LEADS REPORT
            </td>
          </tr>
          <tr>
            <td colspan="11" style="background-color: #F1F5F9; color: #475569; font-size: 11px; padding: 8px 12px; border-bottom: 2px solid #CBD5E1;">
              <strong>Filter:</strong> ${filterTitle} &nbsp;|&nbsp; <strong>Total Leads:</strong> ${filteredLeads.length} &nbsp;|&nbsp; <strong>Generated Date:</strong> ${timestamp}
            </td>
          </tr>
          <tr>
            <th style="text-align: center; width: 50px;">#</th>
            <th>Business / Lead Name</th>
            <th>Primary Contact</th>
            <th>Phone</th>
            <th>Service</th>
            <th>Source</th>
            <th>City</th>
            <th>Assigned To</th>
            <th>Reminder</th>
            <th style="text-align: center;">Status</th>
            <th style="text-align: center;">Created Date</th>
          </tr>
          ${rowsHtml}
        </table>
      </body>
      </html>
    `

    const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `SAAMPARK_Leads_${filterTitle.replace(/\s+/g, "_")}_${Date.now()}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // PDF Print Generator
  const handlePrintPDF = () => {
    let filterTitle = activeFilter || "All Leads"
    if (selectedMember === "unassigned") {
      filterTitle += ` - Unassigned Leads`
    } else if (selectedMember !== "all") {
      filterTitle += ` - Member: ${selectedMember}`
      if (selectedMemberStage !== "all") {
        filterTitle += ` (${selectedMemberStage})`
      }
    }
    const timestamp = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

    const printWindow = window.open("", "_blank", "width=1100,height=850")
    if (!printWindow) {
      window.print()
      return
    }

    const rowsHtml = filteredLeads
      .map((l, index) => {
        const assignedPerson = (l.assignedTo && l.assignedTo !== "None" && l.assignedTo !== "Unassigned")
          ? l.assignedTo
          : ((l.caller && l.caller !== "None" && l.caller !== "Unassigned")
            ? l.caller
            : ((l.owner && l.owner !== "None" && l.owner !== "Unassigned")
              ? l.owner
              : "Unassigned"))

        const phoneVal = l.secondaryPhone ? `${l.phone}<br/><span style="color:#7C3AED;font-size:10px;">Mgr: ${l.secondaryPhone}</span>` : l.phone
        const formattedRem = formatLeadReminderDate(l.reminderDate)
        const reminderVal = formattedRem !== "No Reminder" ? `${formattedRem}<br/><span style="color:#D97706;font-size:10px;">${l.reminderTime || ""}</span>` : "-"

        return `
          <tr>
            <td style="text-align: center; color: #64748B;">${index + 1}</td>
            <td style="font-weight: 600; color: #0F172A;">${l.name}</td>
            <td>${l.primaryContact || "-"}</td>
            <td>${phoneVal}</td>
            <td>${l.service || "-"}</td>
            <td><span class="badge badge-source">${l.source || "-"}</span></td>
            <td>${l.city?.trim() || l.address?.trim() || l.state?.trim() || "-"}</td>
            <td>${assignedPerson}</td>
            <td>${reminderVal}</td>
            <td style="text-align: center;">
              <span class="badge badge-status">${l.status}</span>
            </td>
            <td style="text-align: center; color: #64748B;">${l.createdAt || "-"}</td>
          </tr>
        `
      })
      .join("")

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SAAMPARK Leads Report - ${filterTitle}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1E293B; margin: 0; padding: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1E3A8A; padding-bottom: 12px; margin-bottom: 14px; }
          .logo-area h1 { margin: 0; font-size: 18px; color: #1E3A8A; font-weight: 800; }
          .logo-area p { margin: 2px 0 0 0; font-size: 10px; color: #64748B; font-weight: 500; }
          .meta-info { text-align: right; font-size: 10px; color: #475569; }
          .meta-info strong { color: #0F172A; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background-color: #F8FAFC; color: #334155; font-weight: 700; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.5px; border: 1px solid #E2E8F0; padding: 7px 8px; text-align: left; }
          td { border: 1px solid #E2E8F0; padding: 6px 8px; font-size: 10px; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-align: center; }
          .badge-status { background-color: #E0E7FF; color: #3730A3; }
          .badge-source { background-color: #F1F5F9; color: #475569; }
          .footer { display: flex; justify-content: space-between; font-size: 9px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <h1>SAAMPARK GROUP</h1>
            <p>Leads & Opportunities Comprehensive Registry</p>
          </div>
          <div class="meta-info">
            <div><strong>Active Filter:</strong> ${filterTitle}</div>
            <div><strong>Total Leads:</strong> ${filteredLeads.length} &nbsp;|&nbsp; <strong>Printed:</strong> ${timestamp}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 35px;">#</th>
              <th>Business / Lead Name</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Service</th>
              <th>Source</th>
              <th>City</th>
              <th>Assigned To</th>
              <th>Reminder</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: center;">Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <span>Saampark CRM System • Confidential & Proprietary</span>
          <span>Page 1 of 1</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
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
            className={`pb-2 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeViewTab === "list"
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            List
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

          {/* Team Member Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsMemberDropdownOpen(!isMemberDropdownOpen)
                setIsFiltersDropdownOpen(false)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md transition-colors cursor-pointer ${
                selectedMember !== "all"
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                  : "bg-zinc-100/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/70"
              }`}
            >
              <UserIcon size={13} className={selectedMember !== "all" ? "text-blue-600" : "text-zinc-500"} />
              <span>
                {!isSuperAdminOrAdmin && selectedMember === "all"
                  ? (user?.name || "My Leads") + (selectedMemberStage !== "all" ? ` • ${selectedMemberStage}` : "")
                  : selectedMember === "all"
                  ? "All Team Members"
                  : selectedMember === "unassigned"
                  ? "Unassigned Leads"
                  : selectedMemberStage !== "all"
                  ? `${selectedMember} • ${selectedMemberStage}`
                  : selectedMember}
              </span>
              <span className="text-[10px] ml-0.5">▼</span>
            </button>

            {isMemberDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => {
                    setIsMemberDropdownOpen(false)
                    setMemberSearchQuery("")
                  }}
                />
                <div className="absolute left-0 mt-1 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-30 overflow-hidden flex flex-col max-h-96">
                  {/* Search inside Member Dropdown */}
                  <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search member..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
                        autoFocus
                      />
                      <Search size={12} className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="py-1 overflow-y-auto flex-1 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {isSuperAdminOrAdmin && (
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember("all")
                            setSelectedMemberStage("all")
                            setIsMemberDropdownOpen(false)
                            setMemberSearchQuery("")
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
                            setSelectedMemberStage("all")
                            setIsMemberDropdownOpen(false)
                            setMemberSearchQuery("")
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                            selectedMember === "unassigned" ? "font-semibold text-blue-600 bg-blue-50/50 dark:bg-blue-950/30" : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          <span className="text-zinc-500 italic">Unassigned Leads</span>
                          {selectedMember === "unassigned" && <span>✓</span>}
                        </button>
                      </div>
                    )}

                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Assigned Members ({assignedTeamMembers.length})
                      </div>

                      {(() => {
                        const filtered = assignedTeamMembers.filter((m) =>
                          m.name.toLowerCase().includes(memberSearchQuery.toLowerCase().trim())
                        )

                        if (filtered.length === 0) {
                          return (
                            <div className="px-3 py-2 text-xs text-zinc-400 text-center italic">
                              {memberSearchQuery ? "No matching member" : "No assigned members"}
                            </div>
                          )
                        }

                        return filtered.map(({ name: member, count: leadCount }) => {
                          const userObj = allUsers.find(
                            (u) => u.name && u.name.trim().toLowerCase() === member.trim().toLowerCase()
                          )
                          const avatar = userObj?.avatar || userObj?.avatarUrl || (user?.name === member ? user?.avatar : null)
                          const initials = member
                            .split(" ")
                            .map((w) => w[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()

                          const isMemberSelected = selectedMember.toLowerCase() === member.toLowerCase()
                          const stagesForMember = Object.entries(memberStageBreakdown[member] || {}).sort((a, b) => b[1] - a[1])

                          return (
                            <div
                              key={member}
                              className={`px-3 py-2 text-xs flex flex-col gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors ${
                                isMemberSelected ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                              }`}
                            >
                              {/* Member Title Row */}
                              <div
                                onClick={() => {
                                  setSelectedMember(member)
                                  setSelectedMemberStage("all")
                                  setIsMemberDropdownOpen(false)
                                  setMemberSearchQuery("")
                                }}
                                className="flex items-center justify-between cursor-pointer group/mem"
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  {avatar && !avatar.includes("dicebear") ? (
                                    <img
                                      src={avatar}
                                      alt={member}
                                      className="w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {initials}
                                    </div>
                                  )}
                                  <span className={`truncate font-medium group-hover/mem:text-blue-600 ${isMemberSelected ? "text-blue-600 font-semibold" : "text-zinc-800 dark:text-zinc-200"}`}>
                                    {member}
                                  </span>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold shrink-0">
                                  {leadCount} Leads
                                </span>
                              </div>

                              {/* Stage Sub-filters for this member */}
                              {stagesForMember.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap pl-7">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedMember(member)
                                      setSelectedMemberStage("all")
                                      setIsMemberDropdownOpen(false)
                                      setMemberSearchQuery("")
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium transition-all cursor-pointer ${
                                      isMemberSelected && selectedMemberStage === "all"
                                        ? "bg-blue-600 text-white font-bold shadow-2xs"
                                        : "bg-zinc-100/90 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    All ({leadCount})
                                  </button>
                                  {stagesForMember.map(([stageName, sCount]) => {
                                    const isStageActive = isMemberSelected && selectedMemberStage === stageName
                                    return (
                                      <button
                                        key={stageName}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedMember(member)
                                          setSelectedMemberStage(stageName)
                                          setIsMemberDropdownOpen(false)
                                          setMemberSearchQuery("")
                                        }}
                                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium transition-all cursor-pointer ${
                                          isStageActive
                                            ? "bg-blue-600 text-white font-bold shadow-2xs"
                                            : "bg-zinc-100/90 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-zinc-700"
                                        }`}
                                      >
                                        {stageName} ({sCount})
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Branch Filter Dropdown */}
          {activeBranches && activeBranches.length > 0 && (
            <div className="relative">
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium bg-zinc-100/80 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer hover:bg-zinc-200/70"
              >
                <option value="all">All Branches ({activeBranches.length})</option>
                <option value="unassigned">Unassigned Branch</option>
                {activeBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stage / Status Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsStageDropdownOpen(!isStageDropdownOpen)
                setIsReminderDropdownOpen(false)
                setIsMemberDropdownOpen(false)
                setIsFiltersDropdownOpen(false)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md transition-colors cursor-pointer ${
                selectedStageFilter !== "all"
                  ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 font-semibold"
                  : "bg-zinc-100/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/70"
              }`}
            >
              <Layers size={13} className={selectedStageFilter !== "all" ? "text-cyan-600" : "text-zinc-500"} />
              <span>{selectedStageFilter === "all" ? "All Stages" : selectedStageFilter}</span>
              <span className="text-[10px] ml-0.5">▼</span>
            </button>

            {isStageDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsStageDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-30 overflow-hidden py-1 max-h-80 overflow-y-auto">
                  <p className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Filter by Stage
                  </p>
                  {[
                    "all",
                    "New",
                    "Qualified",
                    "Discussion",
                    "Negotiation",
                    "Store Visit",
                    "Our Office Visit",
                    "They come to our office",
                    "Won",
                    "Lost",
                  ].map((st) => {
                    const isSel = selectedStageFilter === st
                    const label = st === "all" ? "All Stages" : st
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setSelectedStageFilter(st)
                          setIsStageDropdownOpen(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                          isSel ? "font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/30" : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <span>{label}</span>
                        {isSel && <Check size={13} />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Reminder Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsReminderDropdownOpen(!isReminderDropdownOpen)
                setIsStageDropdownOpen(false)
                setIsMemberDropdownOpen(false)
                setIsFiltersDropdownOpen(false)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md transition-colors cursor-pointer ${
                selectedReminderFilter !== "all"
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold"
                  : "bg-zinc-100/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/70"
              }`}
            >
              <Clock size={13} className={selectedReminderFilter !== "all" ? "text-amber-600" : "text-zinc-500"} />
              <span>
                {selectedReminderFilter === "all"
                  ? "All Reminders"
                  : selectedReminderFilter === "none"
                  ? "No Reminder / None"
                  : selectedReminderFilter === "today"
                  ? "Today"
                  : selectedReminderFilter === "yesterday"
                  ? "Yesterday"
                  : selectedReminderFilter === "tomorrow"
                  ? "Tomorrow"
                  : selectedReminderFilter === "week"
                  ? "This Week (7 Days)"
                  : "This Month (30 Days)"}
              </span>
              <span className="text-[10px] ml-0.5">▼</span>
            </button>

            {isReminderDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsReminderDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-30 overflow-hidden py-1">
                  <p className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Filter by Reminder Date
                  </p>
                  {[
                    { id: "all", label: "All Reminders" },
                    { id: "none", label: "No Reminder / None" },
                    { id: "today", label: "Today" },
                    { id: "yesterday", label: "Yesterday" },
                    { id: "tomorrow", label: "Tomorrow" },
                    { id: "week", label: "This Week (7 Days)" },
                    { id: "month", label: "This Month (30 Days)" },
                  ].map((opt) => {
                    const isSel = selectedReminderFilter === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedReminderFilter(opt.id)
                          setIsReminderDropdownOpen(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                          isSel ? "font-bold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30" : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSel && <Check size={13} />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Plus Quick Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-md bg-zinc-50/50 dark:bg-zinc-800/50 cursor-pointer"
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
            onClick={handlePrintPDF}
            className="px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Print
          </button>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search name, assigned user, phone, city..."
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
          ref={tableContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onClickCapture={handleClickCapture}
          className="overflow-x-auto select-none cursor-grab active:cursor-grabbing scrollbar-thin"
        >
          <table className="w-full text-left text-xs">
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
                const isWonOrLost = (l.status || "").toLowerCase().trim() === "won" || (l.status || "").toLowerCase().trim() === "lost"
                const isLocked = !isWonOrLost && l.isLocked === true

                return (
                  <tr
                    key={l.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {/* Name (Business with Building Icon) */}
                    <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 flex items-center justify-center shrink-0">
                            <Building2 size={13} />
                          </div>
                          <span
                            className={`font-semibold ${
                              isLocked
                                ? "text-rose-600 dark:text-rose-400 line-through"
                                : "text-zinc-900 dark:text-zinc-100"
                            }`}
                          >
                            {l.name}
                          </span>
                        </div>
                        {(l.createdByName || l.createdBy) && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 w-fit rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[9.5px] font-semibold ml-8 mt-0.5">
                            <UserIcon size={9} />
                            <span className="inline-flex items-center gap-1">
                              Added by: {l.createdByName || l.createdBy} {l.createdByRole ? `(${l.createdByRole})` : ""}
                              {(l.branchName || l.branchId) && (
                                <>
                                  <span className="opacity-50">•</span>
                                  <MapPin size={10} className="text-amber-500 inline" />
                                  <span>{l.branchName || `Branch (${l.branchId})`}</span>
                                </>
                              )}
                            </span>
                          </div>
                        )}
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
                              setCallOutcomeModalLead(l)
                            }}
                            className="w-6 h-6 min-w-[24px] min-h-[24px] rounded-md bg-blue-100/80 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                            title={`Call Primary & Log Outcome: ${l.primaryContact} (${l.phone})`}
                          >
                            <Phone size={12} className="pointer-events-none" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setWhatsAppModalLead(l)
                            }}
                            className="w-6 h-6 min-w-[24px] min-h-[24px] rounded-md bg-emerald-100/80 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                            title={`1-Click WhatsApp: ${l.primaryContact} (${l.phone})`}
                          >
                            <WhatsAppIcon size={13} className="pointer-events-none" />
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
                                setCallOutcomeModalLead(l)
                              }}
                              className="w-5 h-5 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title={`Call Manager & Log Outcome: ${l.secondaryContact || "Manager"} (${l.secondaryPhone})`}
                            >
                              <Phone size={10} className="pointer-events-none" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setWhatsAppModalLead(l)
                              }}
                              className="w-5 h-5 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title={`1-Click WhatsApp Manager: ${l.secondaryContact || "Manager"} (${l.secondaryPhone})`}
                            >
                              <WhatsAppIcon size={11} className="pointer-events-none" />
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
                        <span>{l.city?.trim() || l.address?.trim() || l.state?.trim() || "-"}</span>
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

                        const realOwnerImg = l.ownerAvatar && !l.ownerAvatar.includes("dicebear") ? l.ownerAvatar : null
                        const realUserImg = userMeta?.avatarUrl || (userMeta as any)?.avatar || 
                          ((user && (assignedPerson.toLowerCase().trim() === user.name.toLowerCase().trim() || assignedPerson.toLowerCase().trim() === user.email.toLowerCase().trim())) 
                            ? ((user as any).avatarUrl || user.avatar) 
                            : null)

                        const avatarSrc = !isUnassigned
                          ? (realOwnerImg || realUserImg || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(assignedPerson)}`)
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {l.labels.map((lbl) => {
                          const found = availableLabels.find(
                            (a) => a.name.toLowerCase() === lbl.toLowerCase()
                          )
                          const colorHex = found ? found.color : "#64748b"

                          return (
                            <button
                              key={lbl}
                              type="button"
                              onClick={() =>
                                !isLocked &&
                                setActivePopoverLeadId(
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
                              !isLocked &&
                              setActivePopoverLeadId(
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
                        {/* Send to Branch Single Action */}
                        {isSuperAdminOrAdmin && activeBranches.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeadIds([l.id])
                              setSelectedTargetBranchId(activeBranches[0].id)
                              setIsTransferModalOpen(true)
                            }}
                            className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Send / Assign to Branch"
                          >
                            <MapPin size={13} />
                          </button>
                        )}

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
                            {canEditLead && (
                              <button
                                type="button"
                                onClick={() => onOpenEditModal(l)}
                                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
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
                                className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
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
                  <td colSpan={12} className="py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center text-xl shadow-xs">
                        📋
                      </div>
                      <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">No leads found matching criteria</p>
                      <p className="text-xs text-zinc-400 max-w-xs">Try adjusting your filters or search keywords, or add a new lead.</p>
                      {canAddLead && (
                        <button
                          type="button"
                          onClick={onOpenAddModal}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Add New Lead</span>
                        </button>
                      )}
                    </div>
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

      {/* ---------------- BRANCH TRANSFER MODAL ---------------- */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Assign Leads to Branch
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {activeBranches.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  No Branches Available
                </p>
                <p className="text-xs text-zinc-500">
                  There are no branches configured for this active company. Please create a branch in Settings first.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Select destination branch to transfer{" "}
                  <strong className="text-blue-600 dark:text-blue-400">
                    {selectedLeadIds.length} lead(s)
                  </strong>
                  . Users in that branch will immediately see these assigned leads.
                </p>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Destination Branch *
                  </label>
                  <select
                    value={selectedTargetBranchId}
                    onChange={(e) => setSelectedTargetBranchId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    {activeBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city || b.code || "Branch"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300">
                  <span>ℹ️ Transferred leads will display a <strong>"Sent by {user?.name || 'Admin'}"</strong> badge on that branch.</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              {activeBranches.length > 0 && (
                <button
                  type="button"
                  disabled={isTransferring || !selectedTargetBranchId}
                  onClick={handleExecuteTransfer}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  <span>{isTransferring ? "Transferring..." : `Confirm Transfer (${selectedLeadIds.length})`}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1-Click WhatsApp Message Generator Modal */}
      <WhatsAppTemplateModal
        isOpen={Boolean(whatsAppModalLead)}
        onClose={() => setWhatsAppModalLead(null)}
        lead={whatsAppModalLead}
      />

      {/* Telecalling Log Outcome Modal */}
      <CallOutcomeModal
        isOpen={Boolean(callOutcomeModalLead)}
        onClose={() => setCallOutcomeModalLead(null)}
        lead={callOutcomeModalLead}
        onLeadUpdated={(updated) => {
          onLeadUpdated(updated)
        }}
      />

    </div>
  )
}
