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

const STANDARD_SERVICES = [
  "Website Development",
  "Software Development",
  "Android/iOS",
  "Digital Marketing",
  "Domain & Hosting",
]

const STANDARD_SOURCES = [
  "Social Media",
  "Meta Ads",
  "Google Ads",
  "Local Market",
  "My Leads",
]

import { useAuthStore } from "@/store/useAuthStore"
import { getUsers } from "@/app/feature/users/services/userService"

export function AddLeadModal({ isOpen, onClose, onLeadAdded }: AddLeadModalProps) {
  const { user, companies, activeCompanyId, activeBranchId, branches } = useAuthStore()
  const isSuperOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const allowedCompanies = React.useMemo(() => {
    if (!companies || !Array.isArray(companies)) return []
    if (user?.role === "Super Admin") return companies
    if (user?.companyIds && user.companyIds.length > 0) {
      return companies.filter((c) => user.companyIds?.includes(c.id) || user.companyIds?.includes(c.slug || ""))
    }
    return companies.filter((c) => c.id === user?.companyId || c.slug === user?.companyId)
  }, [companies, user])

  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>(
    activeCompanyId || user?.companyId || "tech"
  )
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>(
    activeBranchId || user?.branchId || ""
  )

  const availableBranches = React.useMemo(() => {
    if (!branches || !Array.isArray(branches)) return []
    const targetComp = isSuperOrAdmin ? selectedCompanyId : (activeCompanyId || user?.companyId || "tech")
    if (targetComp && targetComp !== "all") {
      return branches.filter((b) => b.companyId === targetComp)
    }
    return branches
  }, [branches, isSuperOrAdmin, selectedCompanyId, activeCompanyId, user?.companyId])

  const handleCompanyChange = (newCompId: string) => {
    setSelectedCompanyId(newCompId)
    const validBranches = branches.filter((b) => b.companyId === newCompId)
    if (validBranches.length > 0) {
      setSelectedBranchId(validBranches[0].id)
    } else {
      setSelectedBranchId("")
    }
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
  const [city, setCity] = React.useState("")
  const [state, setState] = React.useState("")
  const [zip, setZip] = React.useState("")
  const [country, setCountry] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [vatNumber, setVatNumber] = React.useState("")
  const [gstNumber, setGstNumber] = React.useState("")
  const [currency, setCurrency] = React.useState("Keep it blank to use the default (INR - ₹)")
  const [relatedTo, setRelatedTo] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const resetForm = React.useCallback(() => {
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
    setCity("")
    setState("")
    setZip("")
    setCountry("")
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
    if (!companyName.trim()) {
      alert("Please enter a company or lead name.")
      return
    }

    const activeSvcs = selectedServices.map((s) => (s === "Others" ? (customService.trim() || "Custom Service") : s)).filter(Boolean)
    const finalService = activeSvcs.length > 0 ? activeSvcs.join(", ") : ""
    const finalSource = source === "Others" ? (customSource.trim() || "Custom Source") : source
    const effectiveCaller = (caller && caller !== "None" && caller !== "Unassigned") ? caller : "None"
    const effectiveOwner = effectiveCaller !== "None" ? effectiveCaller : "None"
    const effectiveAssignedTo = effectiveCaller !== "None" ? effectiveCaller : "None"
    const finalReminderDate = isNoReminder ? "None" : (reminderDate || "None")
    const finalReminderTime = (isNoReminder || finalReminderDate === "None") ? "None" : (reminderTime || "11:30 AM")

    const finalCompanyId = isSuperOrAdmin ? (selectedCompanyId || "tech") : (activeCompanyId || user?.companyId || "tech")
    const finalBranchId = isSuperOrAdmin ? (selectedBranchId || undefined) : (activeBranchId || user?.branchId || undefined)
    const currentBranchObj = branches.find(b => b.id === finalBranchId)
    const finalBranchName = currentBranchObj?.name || user?.branchName || undefined

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
        createdBy: user?.name || user?.email || "User",
        createdById: String(user?.id || ""),
        createdByName: user?.name || user?.email || "User",
        createdByEmail: user?.email || "",
        createdByRole: user?.role || "Teams",
        branchId: finalBranchId,
        branchName: finalBranchName,
        companyId: finalCompanyId,
        isClientPrivate: user?.role === "Clients",
        ownerAvatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${companyName}`,
        managers: secondaryContact || managers,
        source: finalSource,
        address,
        city,
        state,
        zip,
        country: country || "India",
        website,
        vatNumber,
        gstNumber,
        currency,
        relatedTo: relatedTo.trim() || undefined,
        labels: user?.role !== "Super Admin" && user?.role !== "Admin" ? ["My Leads", "Call this week"] : ["Call this week"],
        createdAt: `${new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}`,
      })

      onLeadAdded(created)
      onClose()
    } catch (err) {
      console.error(err)
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

          {/* Company & Branch Selector for Super Admin / Admin */}
          {isSuperOrAdmin && (
            <>
              {/* Company Selector */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-zinc-500 font-medium flex items-center gap-1">
                  <Building size={12} className="text-blue-500" />
                  <span>Company *</span>
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="col-span-3 px-3 py-2 bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
                >
                  {allowedCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Selector */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-zinc-500 font-medium flex items-center gap-1">
                  <MapPin size={12} className="text-amber-500" />
                  <span>Branch *</span>
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
                >
                  {availableBranches.length === 0 ? (
                    <option value="">No branch configured for this company</option>
                  ) : (
                    availableBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </>
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

          {/* Services Multi-Select Tick Boxes */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium flex items-center gap-1 pt-1">
              <Wrench size={13} className="text-zinc-400" />
              <span>Services</span>
            </label>
            <div className="col-span-3 space-y-2 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {STANDARD_SERVICES.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-blue-600">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s)}
                      onChange={() => toggleService(s)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{s}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-blue-600">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes("Others")}
                    onChange={() => toggleService("Others")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Others</span>
                </label>
              </div>
              {selectedServices.includes("Others") && (
                <input
                  type="text"
                  placeholder="Type custom service name..."
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  className="w-full mt-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 text-xs"
                />
              )}
            </div>
          </div>

          {/* Stage / Status Selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Stage (Status)</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
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
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium flex items-center gap-1 pt-1">
              <Calendar size={13} className="text-amber-500" />
              <span>Reminder Date & Time</span>
            </label>
            <div className="col-span-3 space-y-2">
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
                      className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-amber-600 dark:text-amber-400 font-semibold cursor-pointer text-xs"
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
                      <div className="flex items-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden p-1 gap-1 text-xs">
                        <Clock size={14} className="text-amber-500 shrink-0 ml-1" />
                        {/* Hour Selector */}
                        <select
                          value={hStr}
                          onChange={(e) => updateTime(e.target.value, mStr, ampmStr)}
                          className="bg-transparent text-amber-600 dark:text-amber-400 font-bold focus:outline-none cursor-pointer py-1 text-xs"
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
                          className="bg-transparent text-amber-600 dark:text-amber-400 font-bold focus:outline-none cursor-pointer py-1 text-xs"
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
                        {/* AM / PM Segmented Button */}
                        <div className="flex items-center border-l border-zinc-200 dark:border-zinc-700 ml-1 pl-1 bg-zinc-100/80 dark:bg-zinc-700/50 p-0.5 rounded text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => updateTime(hStr, mStr, "AM")}
                            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
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
                            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
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
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium pt-2 flex items-center gap-1">
              <FileText size={13} className="text-zinc-400" />
              <span>Remainder Notes</span>
            </label>
            <textarea
              rows={2}
              placeholder="Reminder note details..."
              value={reminderNotes}
              onChange={(e) => setReminderNotes(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 resize-none"
            />
          </div>

          {/* Assigned to / Caller Member */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium flex items-center gap-1">
              <UserIcon size={13} className="text-zinc-400" />
              <span>Assigned to</span>
            </label>
            <select
              value={caller}
              onChange={(e) => setCaller(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
            >
              <option value="None">None (Unassigned)</option>
              {teamMembers.map((m) => (
                <option key={m.id || m.name} value={m.name}>
                  {m.name} {m.role ? `(${m.role})` : ""}
                </option>
              ))}
            </select>
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
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* City */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">City</label>
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* State */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">State</label>
            <input
              type="text"
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Country */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Country</label>
            <input
              type="text"
              placeholder="India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
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
            className="flex items-center gap-1 px-5 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-semibold"
          >
            <Check size={14} />
            <span>Save</span>
          </button>
        </div>

      </div>
    </div>
  )
}
