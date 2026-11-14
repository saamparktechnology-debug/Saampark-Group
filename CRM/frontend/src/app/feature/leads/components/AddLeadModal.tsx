"use client"

import * as React from "react"
import { X, Plus, Check, Calendar, Clock, Wrench, FileText, User as UserIcon, Tag, Building, MapPin } from "lucide-react"
import { Lead, LeadStatus, LeadType } from "../types"
import { addLead, parseLeadDate, formatLeadReminderDate, MONTH_NAMES_SHORT } from "../services/leadService"

// Helper to convert date string to "YYYY-MM-DD" for input[type="date"] (Zero UTC Timezone Shift)
function formatDateForInput(dateStr?: string): string {
  const parsed = parseLeadDate(dateStr) || new Date()
  const y = parsed.getFullYear()
  const m = String(parsed.getMonth() + 1).padStart(2, "0")
  const d = String(parsed.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Helper to convert "YYYY-MM-DD" to "25 Aug 2026"
function formatDateForDisplay(yyyyMmDd: string): string {
  return formatLeadReminderDate(yyyyMmDd)
}

// Helper to convert time string "11:30 AM" or "14:30" to "HH:MM" for input[type="time"]
function formatTimeForInput(timeStr?: string): string {
  if (!timeStr || timeStr.toLowerCase() === "none") return "11:30"
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (match) {
    let hours = parseInt(match[1], 10)
    const minutes = match[2]
    const ampm = match[3]?.toUpperCase()
    if (ampm === "PM" && hours < 12) hours += 12
    if (ampm === "AM" && hours === 12) hours = 0
    return `${hours.toString().padStart(2, "0")}:${minutes}`
  }
  return "11:30"
}

// Helper to convert "HH:MM" (e.g. "14:30") to "02:30 PM"
function formatTimeForDisplay(hhMm: string): string {
  if (!hhMm || hhMm.toLowerCase() === "none") return "11:30 AM"
  const [h, m] = hhMm.split(":").map(Number)
  if (isNaN(h) || isNaN(m)) return hhMm
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 || 12
  return `${h12.toString().padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`
}

interface AddLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onLeadAdded: (newLead: Lead) => void
}

// Pure custom service input for client leads without hardcoded presets

const STANDARD_SOURCES = [
  "Social Media",
  "Meta Ads",
  "Google Ads",
  "Local Market",
  "Store Visit",
  "My Leads",
]

import { useAuthStore, isMatchingCompany, getSelectableCompanies } from "@/store/useAuthStore"
import { getUsers } from "@/app/feature/users/services/userService"
import { getClients, ClientItem } from "@/app/feature/clients/services/clientService"
import {
  SearchableSelect,
  ALL_COUNTRIES,
  INDIAN_STATES,
  DISTRICTS_BY_STATE,
  CITIES_BY_DISTRICT,
  getDistrictsForState,
  getCitiesForDistrict,
} from "./SearchableLocationSelect"

export function AddLeadModal({ isOpen, onClose, onLeadAdded }: AddLeadModalProps) {
  const { user, companies, activeCompanyId, activeBranchId, activeSubBranchId, branches, subBranches } = useAuthStore()
  const isSuperOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const selectableCompanies = React.useMemo(() => {
    return getSelectableCompanies(companies, activeCompanyId, user, branches, subBranches)
  }, [companies, activeCompanyId, user, branches, subBranches])

  const isBranchLocked = Boolean(user?.branchId && user?.role !== "Super Admin")

  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>(() => {
    if (activeCompanyId && activeCompanyId !== "all") return activeCompanyId
    return user?.companyId || "tech"
  })
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>(
    user?.branchId || activeBranchId || ""
  )
  const [selectedSubBranchId, setSelectedSubBranchId] = React.useState<string>(
    user?.subBranchId || activeSubBranchId || ""
  )

  const hasInitializedRef = React.useRef(false)

  React.useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false
      return
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true

      useAuthStore.getState().fetchCompanies?.().catch(() => {})
      useAuthStore.getState().fetchBranches?.().catch(() => {})
      useAuthStore.getState().fetchSubBranches?.().catch(() => {})

      const currentComp = activeCompanyId && activeCompanyId !== "all" 
        ? activeCompanyId 
        : (user?.companyId || selectableCompanies[0]?.id || "tech")
      const matchedCompObj = selectableCompanies.find(c => isMatchingCompany(c, currentComp)) || selectableCompanies[0]
      const finalCompId = matchedCompObj?.id || currentComp
      setSelectedCompanyId(finalCompId)

      if (user?.branchId && user?.role !== "Super Admin") {
        setSelectedBranchId(user.branchId)
      } else {
        setSelectedBranchId(activeBranchId || "")
      }
    }
  }, [isOpen])

  const availableBranches = React.useMemo(() => {
    if (!branches || !Array.isArray(branches)) return []
    const targetComp = selectedCompanyId || activeCompanyId || user?.companyId || "tech"
    if (targetComp && targetComp !== "all") {
      return branches.filter((b) =>
        isMatchingCompany({ id: b.companyId || (b as any).company_id, slug: b.companyId } as any, targetComp)
      )
    }
    return branches
  }, [branches, selectedCompanyId, activeCompanyId, user?.companyId])

  const availableSubBranchesForBranch = React.useMemo(() => {
    if (!selectedBranchId || !subBranches || !Array.isArray(subBranches)) return []
    const bId = String(selectedBranchId).toLowerCase().trim()
    const targetBranch = branches.find(b => String(b.id).toLowerCase().trim() === bId)
    const bCode = targetBranch?.code ? String(targetBranch.code).toLowerCase().trim() : ""
    const bName = targetBranch?.name ? String(targetBranch.name).toLowerCase().trim() : ""

    return subBranches.filter(sb => {
      const pId = String(sb.parentBranchId || (sb as any).branch_id || (sb as any).branchId || "").toLowerCase().trim()
      const pName = String((sb as any).branchName || (sb as any).branch_name || "").toLowerCase().trim()
      return pId === bId || (bCode && pId === bCode) || (bName && pName === bName)
    })
  }, [subBranches, selectedBranchId, branches])

  const handleCompanyChange = (newCompId: string) => {
    setSelectedCompanyId(newCompId)
    if (!isBranchLocked) {
      setSelectedBranchId("")
      setSelectedSubBranchId("")
    }
  }

  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId)
    setSelectedSubBranchId("")
  }

  const [teamMembers, setTeamMembers] = React.useState<{ id: string; name: string; role?: string }[]>([])
  const [type, setType] = React.useState<LeadType>("Organization")
  const [companyName, setCompanyName] = React.useState("")
  const [primaryContact, setPrimaryContact] = React.useState("")
  const [hasSecondaryContact, setHasSecondaryContact] = React.useState(false)
  const [secondaryContact, setSecondaryContact] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [secondaryPhone, setSecondaryPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<LeadStatus>("New")
  const [selectedServices, setSelectedServices] = React.useState<string[]>([])
  const [customService, setCustomService] = React.useState("")
  const [isNoReminder, setIsNoReminder] = React.useState(true)
  const [reminderDate, setReminderDate] = React.useState(() => {
    const today = new Date()
    const d = String(today.getDate()).padStart(2, "0")
    const m = MONTH_NAMES_SHORT[today.getMonth()]
    const y = today.getFullYear()
    return `${d} ${m} ${y}`
  })
  const [reminderTime, setReminderTime] = React.useState("11:30 AM")
  const [reminderNotes, setReminderNotes] = React.useState("")
  const [caller, setCaller] = React.useState("")
  const [owner, setOwner] = React.useState("")
  const [managers, setManagers] = React.useState("")
  const [source, setSource] = React.useState("Social Media")
  const [customSource, setCustomSource] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [country, setCountry] = React.useState("India")
  const [state, setState] = React.useState("West Bengal")
  const [district, setDistrict] = React.useState("Paschim Medinipur")
  const [city, setCity] = React.useState("Midnapore")
  const [zip, setZip] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [vatNumber, setVatNumber] = React.useState("")
  const [gstNumber, setGstNumber] = React.useState("")
  const [currency, setCurrency] = React.useState("Keep it blank to use the default (INR - ₹)")
  const [relatedTo, setRelatedTo] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Existing Client & Future Project Timeline
  const [leadMode, setLeadMode] = React.useState<"new" | "existing_client">("new")
  const [availableClients, setAvailableClients] = React.useState<ClientItem[]>([])
  const [selectedClientId, setSelectedClientId] = React.useState<string>("")
  const [clientSearchQuery, setClientSearchQuery] = React.useState<string>("")
  const [isClientDropdownOpen, setIsClientDropdownOpen] = React.useState(false)
  const [selectedClient, setSelectedClient] = React.useState<ClientItem | null>(null)
  const [expectedTimeline, setExpectedTimeline] = React.useState<string>("")
  const [expectedStartDate, setExpectedStartDate] = React.useState<string>("")
  const [projectRequirement, setProjectRequirement] = React.useState<string>("")

  const applyTimelinePreset = (preset: "this_month" | "next_month" | "after_2_months" | "next_quarter") => {
    const now = new Date()
    let targetMonthIndex: number
    let targetYear: number = now.getFullYear()

    if (preset === "this_month") {
      targetMonthIndex = now.getMonth()
    } else if (preset === "next_month") {
      targetMonthIndex = now.getMonth() + 1
    } else if (preset === "after_2_months") {
      targetMonthIndex = now.getMonth() + 2
    } else {
      targetMonthIndex = now.getMonth() + 3
    }

    const d = new Date(targetYear, targetMonthIndex, 1)
    const monthName = d.toLocaleString("en-US", { month: "long" })
    const monthShort = MONTH_NAMES_SHORT[d.getMonth()]
    const yr = d.getFullYear()

    let timelineLabel = ""
    if (preset === "this_month") timelineLabel = `This Month (${monthShort} ${yr})`
    else if (preset === "next_month") timelineLabel = `Next Month (${monthShort} ${yr})`
    else if (preset === "after_2_months") timelineLabel = `After 2 Months (${monthShort} ${yr})`
    else timelineLabel = `Next Quarter (${monthShort} ${yr})`

    setExpectedTimeline(timelineLabel)
    setExpectedStartDate(`${yr}-${String(d.getMonth() + 1).padStart(2, "0")}-01`)

    // Follow-up reminder auto-scheduled 3 days before that month starts, or in 2 days if this month
    let reminderTarget: Date
    if (preset === "this_month") {
      reminderTarget = new Date(now.getTime() + 2 * 86400000)
    } else {
      reminderTarget = new Date(d.getTime() - 3 * 86400000)
      if (reminderTarget.getTime() <= now.getTime()) {
        reminderTarget = new Date(now.getTime() + 86400000)
      }
    }

    const remD = String(reminderTarget.getDate()).padStart(2, "0")
    const remM = MONTH_NAMES_SHORT[reminderTarget.getMonth()]
    const remY = reminderTarget.getFullYear()

    setIsNoReminder(false)
    setReminderDate(`${remD} ${remM} ${remY}`)
    setReminderTime("11:30 AM")

    const clientNameStr = selectedClient?.name || companyName || "Client"
    const scopeStr = projectRequirement.trim() || "repeat project"
    setReminderNotes(`Follow up with ${clientNameStr} regarding ${scopeStr} planned for ${monthName} ${yr}`)
  }

  const handleSelectExistingClient = (c: ClientItem) => {
    setSelectedClient(c)
    setSelectedClientId(c.id)
    setCompanyName(c.name || "")
    setPrimaryContact(c.primaryContact || c.name || "")
    setPhone(c.phone || "")
    setEmail(c.email || "")
    if (c.address) setAddress(c.address)
    if (c.city) setCity(c.city)
    if (c.district) setDistrict(c.district)
    if (c.state) setState(c.state)
    if (c.zip) setZip(c.zip)
    if (c.country) setCountry(c.country)
    if (c.gstNumber || c.vatNumber) setGstNumber(c.gstNumber || c.vatNumber || "")
    setSource("Existing Client")
    if (c.type) setType(c.type)
    if (c.companyId) setSelectedCompanyId(c.companyId)
    if (c.branchId) setSelectedBranchId(c.branchId)
    setIsClientDropdownOpen(false)
  }

  const resetForm = React.useCallback(() => {
    setLeadMode("new")
    setSelectedClientId("")
    setSelectedClient(null)
    setClientSearchQuery("")
    setIsClientDropdownOpen(false)
    setExpectedTimeline("")
    setExpectedStartDate("")
    setProjectRequirement("")
    setType("Organization")
    setCompanyName("")
    setPrimaryContact("")
    setHasSecondaryContact(false)
    setSecondaryContact("")
    setPhone("")
    setSecondaryPhone("")
    setEmail("")
    setStatus("New")
    setSelectedServices([])
    setCustomService("")
    setIsNoReminder(true)
    const today = new Date()
    const d = String(today.getDate()).padStart(2, "0")
    const m = MONTH_NAMES_SHORT[today.getMonth()]
    const y = today.getFullYear()
    setReminderDate(`${d} ${m} ${y}`)
    setReminderTime("11:30 AM")
    setReminderNotes("")
    setManagers("")
    setSource("Social Media")
    setCustomSource("")
    setAddress("")
    setCountry("India")
    setState("West Bengal")
    setDistrict("Paschim Medinipur")
    setCity("Midnapore")
    setZip("")
    setWebsite("")
    setVatNumber("")
    setGstNumber("")
    setCurrency("Keep it blank to use the default (INR - ₹)")
  }, [])

  const toggleService = (svc: string) => {
    setSelectedServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    )
  }

  React.useEffect(() => {
    if (isOpen) {
      resetForm()

      getClients("all").then((cList) => {
        setAvailableClients(cList || [])
      }).catch(() => {})

      if (user?.role === "Clients") {
        setTeamMembers([])
        setCaller("None")
        setOwner("None")
        return
      }

      getUsers("all").then((list) => {
        const isSuperAdmin = user?.role === "Super Admin"
        const userCompIds = user?.companyIds || (user?.companyId ? [user?.companyId] : ["tech"])

        const filteredByCompany = isSuperAdmin
          ? (list || [])
          : (list || []).filter((u) => {
              const uComps = u.companyIds || (u.companyId ? [u.companyId] : [])
              return uComps.some((c) => userCompIds.includes(c))
            })

        // Strictly team members / employees only — Super Admin and Admin cannot be assigned as team members
        const members = filteredByCompany
          .filter((u) => {
            const r = (u.role || "").toLowerCase().trim()
            return !r.includes("admin") && !r.includes("super") && !r.includes("client") && r !== "owner" && u.status !== "Inactive"
          })
          .map((u) => ({ id: u.id, name: u.name, role: u.role }))

        setTeamMembers(members)

        setCaller("None")
        setOwner("None")
      })
    }
  }, [isOpen, user, resetForm])

  if (!isOpen) return null

  const handleSave = async () => {
    if (leadMode === "existing_client" && !selectedClientId && !companyName.trim()) {
      alert("Please select an existing client from the list.")
      return
    }
    if (!companyName.trim()) {
      alert("Please enter a company or lead name.")
      return
    }

    const allEnteredServices = [...selectedServices, customService.trim()].filter(Boolean)
    const finalService = allEnteredServices.length > 0 ? Array.from(new Set(allEnteredServices)).join(", ") : ""
    const finalSource = source === "Others" ? (customSource.trim() || "Custom Source") : source
    const effectiveCaller = (caller && caller !== "None" && caller !== "Unassigned") ? caller : "None"
    const effectiveOwner = effectiveCaller !== "None" ? effectiveCaller : "None"
    const effectiveAssignedTo = effectiveCaller !== "None" ? effectiveCaller : "None"
    const finalReminderDate = isNoReminder ? "None" : (reminderDate || "None")
    const finalReminderTime = (isNoReminder || finalReminderDate === "None") ? "None" : (reminderTime || "11:30 AM")

    const cleanBranchId = selectedBranchId.trim()
    const targetBranchObj = cleanBranchId ? (branches || []).find((b: any) => 
      String(b.id || "").toLowerCase().trim() === cleanBranchId.toLowerCase() ||
      String(b.code || "").toLowerCase().trim() === cleanBranchId.toLowerCase() ||
      String(b.name || b.branch_name || "").toLowerCase().trim() === cleanBranchId.toLowerCase()
    ) : undefined

    const finalBranchId = targetBranchObj ? String(targetBranchObj.id) : (cleanBranchId || undefined)
    const finalBranchName = targetBranchObj?.name || (finalBranchId ? user?.branchName : undefined)
    const branchCompId = targetBranchObj?.companyId || (targetBranchObj as any)?.company_id
    const finalCompanyId = selectedCompanyId || branchCompId || (isSuperOrAdmin ? (activeCompanyId || "tech") : (activeCompanyId || user?.companyId || "tech"))

    const finalSubBranchId = selectedSubBranchId || (activeSubBranchId && activeSubBranchId !== "all" ? activeSubBranchId : (user?.subBranchId || undefined))
    const targetSubBranchObj = finalSubBranchId ? subBranches?.find(sb => String(sb.id).toLowerCase().trim() === String(finalSubBranchId).toLowerCase().trim()) : undefined
    const finalSubBranchName = targetSubBranchObj?.name || user?.subBranchName || undefined

    const currentFreshUser = useAuthStore.getState().user || user
    const finalCreatorName = currentFreshUser?.name || currentFreshUser?.email || "User"
    const finalCreatorId = String(currentFreshUser?.id || "")
    const finalCreatorEmail = currentFreshUser?.email || ""
    const finalCreatorRole = currentFreshUser?.role || "Teams"

    setIsSubmitting(true)
    try {
      const created = await addLead({
        type,
        name: companyName,
        primaryContact: primaryContact || companyName,
        secondaryContact: secondaryContact || undefined,
        phone: phone || "+91 XXXXXXXX",
        secondaryPhone: secondaryPhone || undefined,
        email: email || undefined,
        status,
        service: finalService,
        reminderDate: finalReminderDate,
        reminderTime: finalReminderTime,
        reminderNotes,
        caller: effectiveCaller,
        owner: effectiveOwner,
        assignedTo: effectiveAssignedTo,
        createdBy: finalCreatorName,
        createdById: finalCreatorId,
        createdByName: finalCreatorName,
        createdByEmail: finalCreatorEmail,
        createdByRole: finalCreatorRole,
        branchId: finalBranchId,
        branchName: finalBranchName,
        subBranchId: finalSubBranchId,
        subBranchName: finalSubBranchName,
        companyId: finalCompanyId,
        isClientPrivate: currentFreshUser?.role === "Clients",
        ownerAvatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${companyName}`,
        managers: secondaryContact || managers,
        source: finalSource,
        address,
        district,
        city,
        state,
        zip,
        country: country || "India",
        website,
        vatNumber,
        gstNumber,
        currency,
        relatedTo: relatedTo.trim() || undefined,
        labels: (() => {
          const l = user?.role !== "Super Admin" && user?.role !== "Admin" ? ["My Leads", "Call this week"] : ["Call this week"]
          if (leadMode === "existing_client" || selectedClientId) {
            l.push("Existing Client", "Repeat Project")
            if (expectedTimeline) l.push(expectedTimeline)
          }
          return l
        })(),
        clientId: selectedClientId || undefined,
        clientName: selectedClient?.name || (leadMode === "existing_client" ? companyName : undefined),
        isExistingClient: leadMode === "existing_client" || Boolean(selectedClientId),
        expectedTimeline: expectedTimeline.trim() || undefined,
        expectedStartDate: expectedStartDate.trim() || undefined,
        projectRequirement: projectRequirement.trim() || undefined,
        createdAt: `${new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}`,
      }, finalCompanyId)

      onLeadAdded(created)
      onClose()
    } catch (err: any) {
      console.error("Failed to create lead:", err)
      alert(err?.message || "Failed to create lead. Please check network or required fields.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Add lead</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* Mode Switcher: New Lead vs Existing Client */}
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                setLeadMode("new")
                setSelectedClientId("")
                setSelectedClient(null)
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                leadMode === "new"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs border border-zinc-200/60 dark:border-zinc-700"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Building size={14} />
              <span>New Lead / Prospect</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLeadMode("existing_client")
                setSource("Existing Client")
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                leadMode === "existing_client"
                  ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs border border-purple-200/60 dark:border-purple-800/60"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <UserIcon size={14} />
              <span>Existing Client (Repeat Project)</span>
            </button>
          </div>

          {/* Existing Client Search & Selection Box */}
          {leadMode === "existing_client" && (
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <span>👥 Select Existing CRM Client</span>
                </span>
                {selectedClient && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    ✓ Client Details Autofilled
                  </span>
                )}
              </div>

              {/* Searchable input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search client by name, phone, or email..."
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value)
                    setIsClientDropdownOpen(true)
                  }}
                  onFocus={() => setIsClientDropdownOpen(true)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-800 border border-purple-300 dark:border-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                />

                {/* Dropdown list */}
                {isClientDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 divide-y divide-zinc-100 dark:divide-zinc-700/60">
                    {availableClients
                      .filter((c) => {
                        if (!clientSearchQuery.trim()) return true
                        const q = clientSearchQuery.toLowerCase()
                        return (
                          (c.name || "").toLowerCase().includes(q) ||
                          (c.primaryContact || "").toLowerCase().includes(q) ||
                          (c.phone || "").toLowerCase().includes(q) ||
                          (c.email || "").toLowerCase().includes(q)
                        )
                      })
                      .slice(0, 30)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            handleSelectExistingClient(c)
                            setClientSearchQuery("")
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors flex items-center justify-between text-xs cursor-pointer"
                        >
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">{c.name}</div>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                              {c.primaryContact && <span>Contact: {c.primaryContact}</span>}
                              {c.phone && <span>• {c.phone}</span>}
                              {c.city && <span>• {c.city}</span>}
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                            {c.companyName || c.branchName || "Client"}
                          </span>
                        </button>
                      ))}
                    {availableClients.length === 0 && (
                      <div className="p-3 text-center text-xs text-zinc-400">No registered clients found.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Client Card */}
              {selectedClient && (
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900/80 rounded-lg border border-purple-200 dark:border-purple-800/80 text-xs">
                  <div>
                    <div className="font-bold text-zinc-800 dark:text-zinc-100">{selectedClient.name}</div>
                    <div className="text-[11px] text-zinc-500">
                      {selectedClient.primaryContact} • {selectedClient.phone || "No phone"} {selectedClient.email ? `• ${selectedClient.email}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(null)
                      setSelectedClientId("")
                      setCompanyName("")
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Future Project Timeline & Scope Scheduler */}
              <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/40 space-y-2">
                <label className="font-bold text-[11px] text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                  <Clock size={13} className="text-purple-600" />
                  <span>Project Timeline (e.g. Client plans after this month)</span>
                </label>
                
                {/* Quick Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "this_month", label: "This Month" },
                    { id: "next_month", label: "Next Month" },
                    { id: "after_2_months", label: "After 2 Months" },
                    { id: "next_quarter", label: "Next Quarter" },
                  ].map((p) => {
                    const isSelected = expectedTimeline.toLowerCase().includes(p.label.toLowerCase())
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyTimelinePreset(p.id as any)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-600 text-white shadow-xs"
                            : "bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                        }`}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>

                {/* Scope / Requirement description */}
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Project Requirement / Future Scope (e.g. Signage renovation, Annual reports, Branding)"
                    value={projectRequirement}
                    onChange={(e) => {
                      setProjectRequirement(e.target.value)
                      if (expectedTimeline) {
                        setReminderNotes(`Follow up with ${selectedClient?.name || companyName || "Client"} regarding ${e.target.value.trim() || "repeat project"} planned for ${expectedTimeline}`)
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {expectedTimeline && (
                  <div className="p-2 rounded bg-purple-100/60 dark:bg-purple-950/60 text-[10.5px] text-purple-800 dark:text-purple-300 font-medium flex items-center justify-between">
                    <span>🎯 Target: <strong>{expectedTimeline}</strong></span>
                    <span>📅 Follow-up reminder set to: <strong>{reminderDate}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Type radio buttons */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Type</label>
            <div className="col-span-3 flex items-center gap-6 text-zinc-700 dark:text-zinc-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="leadType"
                  value="Organization"
                  checked={type === "Organization"}
                  onChange={() => setType("Organization")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Organization</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="leadType"
                  value="Person"
                  checked={type === "Person"}
                  onChange={() => setType("Person")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Person</span>
              </label>
            </div>
          </div>

          {/* Company, Branch & Sub-Branch Selector for Super Admin / Admin */}
          {isSuperOrAdmin && (
            <div className={`grid grid-cols-1 ${availableSubBranchesForBranch.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3 p-3 bg-zinc-50/80 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60`}>
              {/* Company */}
              <div className="space-y-1">
                <label className="text-zinc-600 dark:text-zinc-300 font-semibold flex items-center gap-1.5 text-[11px]">
                  <Building size={13} className="text-blue-500" />
                  <span>Company *</span>
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold cursor-pointer shadow-2xs"
                >
                  {selectableCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div className="space-y-1">
                <label className="text-zinc-600 dark:text-zinc-300 font-semibold flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-amber-500" />
                    <span>Assigned Branch</span>
                  </span>
                  {isBranchLocked && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      🔒 Locked
                    </span>
                  )}
                </label>
                {isBranchLocked ? (
                  <div className="w-full px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-between">
                    <span>📍 {branches.find(b => b.id === user?.branchId)?.name || user?.branchId || "Assigned Branch"}</span>
                    <span className="text-[10px] text-amber-600 font-normal">Fixed to your branch</span>
                  </div>
                ) : (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold cursor-pointer shadow-2xs"
                  >
                    <option value="">-- No Branch (Company Wide) --</option>
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name || (b as any).branch_name || b.code || "Branch"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sub-Branch Selector (Visible when selected branch has sub-branches) */}
              {availableSubBranchesForBranch.length > 0 && (
                <div className="space-y-1">
                  <label className="text-zinc-600 dark:text-zinc-300 font-semibold flex items-center gap-1.5 text-[11px]">
                    <span className="text-purple-500">🤝</span>
                    <span>Sub-Branch (Partner)</span>
                  </label>
                  <select
                    value={selectedSubBranchId}
                    onChange={(e) => setSelectedSubBranchId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-zinc-800 dark:text-zinc-200 font-semibold cursor-pointer shadow-2xs"
                  >
                    <option value="">-- No Sub-Branch (Branch HQ) --</option>
                    {availableSubBranchesForBranch.map((sb) => (
                      <option key={sb.id} value={sb.id}>
                        {sb.name} {sb.partnerType ? `(${sb.partnerType})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Lead / Company name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Lead / Company</label>
            <input
              type="text"
              placeholder="e.g. Sarah Cole / Gibson PLC"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Related to */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Related to</label>
            <input
              type="text"
              placeholder="e.g. Project / Campaign / Website / Referral"
              value={relatedTo}
              onChange={(e) => setRelatedTo(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Custom Services Tag Input (No preset examples) */}
          <div className="grid grid-cols-4 items-start gap-3">
            <label className="text-zinc-500 font-medium flex items-center gap-1 pt-1">
              <Wrench size={13} className="text-zinc-400" />
              <span>Services</span>
            </label>
            <div className="col-span-3 space-y-2 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Type custom service (e.g. ERP Development) & press Enter or Add..."
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      const val = customService.trim().replace(/^,+|,+$/g, '')
                      if (val && !selectedServices.includes(val)) {
                        setSelectedServices((prev) => [...prev, val])
                        setCustomService("")
                      }
                    }
                  }}
                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = customService.trim().replace(/^,+|,+$/g, '')
                    if (val && !selectedServices.includes(val)) {
                      setSelectedServices((prev) => [...prev, val])
                      setCustomService("")
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </div>

              {selectedServices.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedServices.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedServices((prev) => prev.filter((item) => item !== s))}
                        className="hover:text-rose-600 ml-0.5 text-zinc-400 font-bold cursor-pointer"
                        title="Remove service"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stage / Status Selector */}
          <div className="grid grid-cols-4 items-center gap-3">
            <label className="text-zinc-500 font-medium">Stage (Status)</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="col-span-3 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold text-xs"
            >
              <option value="New">New</option>
              <option value="Qualified">Qualified</option>
              <option value="Discussion">Discussion</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Store Visit">Store Visit</option>
              <option value="Our Office Visit">Our Office Visit</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Reminder Date & Time with None / 00,00,0000 and AM/PM format */}
          <div className="grid grid-cols-4 items-start gap-3">
            <label className="text-zinc-500 font-medium flex items-center gap-1 pt-1">
              <Calendar size={13} className="text-amber-500" />
              <span>Reminder Date & Time</span>
            </label>
            <div className="col-span-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isNoReminder}
                    onChange={(e) => setIsNoReminder(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-amber-600 dark:text-amber-400 font-medium">No Reminder (No Auto-Lock)</span>
                </label>
              </div>

              {!isNoReminder && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="date"
                      value={formatDateForInput(reminderDate)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setReminderDate(formatDateForDisplay(e.target.value))
                        }
                      }}
                      className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-amber-600 dark:text-amber-400 font-semibold cursor-pointer text-xs"
                    />
                    <Calendar size={14} className="absolute left-2.5 text-amber-500 pointer-events-none" />
                  </div>

                  {(() => {
                    const match = (reminderTime || "11:30 AM").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
                    let hStr = "11"
                    let mStr = "30"
                    let ampmStr = "AM"
                    if (match) {
                      const rawH = parseInt(match[1], 10)
                      ampmStr = (match[3] || (rawH >= 12 ? "PM" : "AM")).toUpperCase()
                      const h12 = rawH > 12 ? rawH - 12 : (rawH === 0 ? 12 : rawH)
                      hStr = String(h12).padStart(2, "0")
                      mStr = match[2]
                    }

                    const updateTime = (newH: string, newM: string, newAmpm: string) => {
                      setReminderTime(`${newH}:${newM} ${newAmpm}`)
                    }

                    return (
                      <div className="flex items-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden p-0.5 gap-1 text-xs">
                        <Clock size={13} className="text-amber-500 shrink-0 ml-1" />
                        {/* Hour Selector */}
                        <select
                          value={hStr}
                          onChange={(e) => updateTime(e.target.value, mStr, ampmStr)}
                          className="bg-transparent text-amber-600 dark:text-amber-400 font-bold focus:outline-none cursor-pointer py-0.5 text-xs"
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                            <option key={h} value={h} className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                              {h}
                            </option>
                          ))}
                        </select>
                        <span className="font-bold text-amber-600 dark:text-amber-400">:</span>
                        {/* Minute Selector */}
                        <select
                          value={mStr}
                          onChange={(e) => updateTime(hStr, e.target.value, ampmStr)}
                          className="bg-transparent text-amber-600 dark:text-amber-400 font-bold focus:outline-none cursor-pointer py-0.5 text-xs"
                        >
                          {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                            <option key={m} value={m} className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                              {m}
                            </option>
                          ))}
                          {!["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].includes(mStr) && (
                            <option value={mStr} className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                              {mStr}
                            </option>
                          )}
                        </select>
                        {/* AM/PM Switcher Buttons */}
                        <div className="flex items-center bg-zinc-200/70 dark:bg-zinc-700/60 rounded p-0.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => updateTime(hStr, mStr, "AM")}
                            className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                              ampmStr === "AM"
                                ? "bg-amber-500 text-white font-extrabold shadow-2xs"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            onClick={() => updateTime(hStr, mStr, "PM")}
                            className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                              ampmStr === "PM"
                                ? "bg-amber-500 text-white font-extrabold shadow-2xs"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Remainder Notes */}
          <div className="grid grid-cols-4 items-start gap-3">
            <label className="text-zinc-500 font-medium pt-1.5 flex items-center gap-1">
              <FileText size={13} className="text-zinc-400" />
              <span>Remainder Notes</span>
            </label>
            <textarea
              rows={1}
              placeholder="Reminder note details..."
              value={reminderNotes}
              onChange={(e) => setReminderNotes(e.target.value)}
              className="col-span-3 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 resize-none text-xs"
            />
          </div>

          {/* Assigned to / Caller Member */}
          <div className="grid grid-cols-4 items-center gap-3">
            <label className="text-zinc-500 font-medium flex items-center gap-1">
              <UserIcon size={13} className="text-zinc-400" />
              <span>Assigned to</span>
            </label>
            {user?.role === "Clients" ? (
              <input
                type="text"
                placeholder="Type assigned member name (Optional)..."
                value={caller === "None" ? "" : caller}
                onChange={(e) => {
                  const val = e.target.value
                  setCaller(val.trim() ? val : "None")
                  setOwner(val.trim() ? val : "None")
                }}
                className="col-span-3 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 text-xs placeholder:text-zinc-400"
              />
            ) : (
              <select
                value={caller}
                onChange={(e) => {
                  setCaller(e.target.value)
                  setOwner(e.target.value)
                }}
                className="col-span-3 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-medium text-xs"
              >
                <option value="None">None (Unassigned)</option>
                {teamMembers.map((m) => (
                  <option key={m.id || m.name} value={m.name}>
                    {m.name} {m.role ? `(${m.role})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Primary contact */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Primary contact</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={primaryContact}
              onChange={(e) => setPrimaryContact(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Phone with India Flag & +91 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Phone</label>
            <div className="col-span-3 flex items-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
              <span className="px-2.5 py-2 text-base border-r border-zinc-200 dark:border-zinc-700 flex items-center gap-1">🇮🇳</span>
              <input
                type="text"
                placeholder="+91 XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-transparent focus:outline-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 text-xs"
              />
            </div>
          </div>

          {/* Secondary Contact / Manager Option Toggle */}
          {!hasSecondaryContact ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <div />
              <div className="col-span-3">
                <button
                  type="button"
                  onClick={() => setHasSecondaryContact(true)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>+ Add Secondary Contact / Manager (Optional)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/40 pb-2">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                  Secondary Contact / Manager Details (Optional)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setHasSecondaryContact(false)
                    setSecondaryContact("")
                    setSecondaryPhone("")
                  }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 px-2 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <X size={12} />
                  <span>Remove</span>
                </button>
              </div>

              {/* Secondary Contact Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-zinc-600 dark:text-zinc-300 font-medium">Manager Name</label>
                <input
                  type="text"
                  placeholder="Secondary contact or manager name"
                  value={secondaryContact}
                  onChange={(e) => setSecondaryContact(e.target.value)}
                  className="col-span-3 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
                />
              </div>

              {/* Secondary Phone */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-zinc-600 dark:text-zinc-300 font-medium">Manager Phone</label>
                <div className="col-span-3 flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
                  <span className="px-2.5 py-2 text-base border-r border-zinc-200 dark:border-zinc-700 flex items-center gap-1">🇮🇳</span>
                  <input
                    type="text"
                    placeholder="+91 XXXXXXXX"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent focus:outline-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Email</label>
            <input
              type="email"
              placeholder="example@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Source Selector with Others option */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            >
              {STANDARD_SOURCES.map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
              <option value="Others">Others</option>
            </select>
          </div>

          {/* Custom Source Input Form when Others is selected */}
          {source === "Others" && (
            <div className="grid grid-cols-4 items-center gap-4 animate-in fade-in duration-150">
              <label className="text-zinc-500 font-medium text-blue-600 dark:text-blue-400 font-semibold">
                Custom Source
              </label>
              <input
                type="text"
                placeholder="Type custom lead source..."
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                className="col-span-3 px-3 py-2 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-medium placeholder-zinc-400"
              />
            </div>
          )}

          {/* Address */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium pt-2">Address</label>
            <textarea
              rows={2}
              placeholder="Building / Street address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* 1st: Country with Search (Default: India) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Country</label>
            <div className="col-span-3">
              <SearchableSelect
                value={country}
                onChange={(val) => {
                  setCountry(val)
                  if (val === "India") {
                    setState("West Bengal")
                    setDistrict("Paschim Medinipur")
                    setCity("Midnapore")
                  }
                }}
                options={ALL_COUNTRIES}
                placeholder="Select or search country..."
                searchPlaceholder="Search country or type custom..."
              />
            </div>
          </div>

          {/* 2nd: State with Search (Default: West Bengal) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">State</label>
            <div className="col-span-3">
              <SearchableSelect
                value={state}
                onChange={(val) => {
                  setState(val)
                  const dists = getDistrictsForState(val)
                  const defaultDist = val.toLowerCase().includes("bengal") ? "Paschim Medinipur" : (dists[0] || "")
                  setDistrict(defaultDist)
                  const c = getCitiesForDistrict(val, defaultDist)
                  setCity(c && c.length > 0 ? c[0] : "")
                }}
                options={country === "India" ? INDIAN_STATES : []}
                placeholder="Select or search state..."
                searchPlaceholder="Search state or type custom..."
              />
            </div>
          </div>

          {/* 3rd: District (Dist) with Search (Default: Paschim Medinipur) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Dist (District)</label>
            <div className="col-span-3">
              <SearchableSelect
                value={district}
                onChange={(val) => {
                  setDistrict(val)
                  const c = getCitiesForDistrict(state, val)
                  if (c && c.length > 0) {
                    setCity(c[0])
                  }
                }}
                options={getDistrictsForState(state)}
                placeholder="Select or search district..."
                searchPlaceholder="Search district or type custom..."
              />
            </div>
          </div>

          {/* 4th: City with Search (Default: Midnapore) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">City</label>
            <div className="col-span-3">
              <SearchableSelect
                value={city}
                onChange={(val) => setCity(val)}
                options={getCitiesForDistrict(state, district)}
                placeholder="Select or search city..."
                searchPlaceholder="Search city or type custom..."
              />
            </div>
          </div>

          {/* Postal / Zip Code (Optional) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Zip / PIN</label>
            <input
              type="text"
              placeholder="e.g. 721101"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 text-xs"
            />
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
          >
            <X size={14} />
            <span>Close</span>
          </button>
          
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm ${
              isSubmitting ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
