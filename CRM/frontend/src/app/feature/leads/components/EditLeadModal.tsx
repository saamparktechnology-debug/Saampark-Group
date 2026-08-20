"use client"

import * as React from "react"
import { X, Check, Calendar, Clock, Wrench, FileText, User as UserIcon, Trash2 } from "lucide-react"
import { Lead, LeadStatus, LeadType } from "../types"
import { updateLead, unlockLead } from "../services/leadService"
import { useAuthStore } from "@/store/useAuthStore"

// Helper to convert date string "12 Aug 2025" or ISO "YYYY-MM-DD" to "YYYY-MM-DD" for input[type="date"]
function formatDateForInput(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0]
  }
  return new Date().toISOString().split("T")[0]
}

// Helper to convert "YYYY-MM-DD" to "12 Aug 2025"
function formatDateForDisplay(yyyyMmDd: string): string {
  if (!yyyyMmDd) return "12 Aug 2025"
  const [y, m, d] = yyyyMmDd.split("-").map(Number)
  if (!y || !m || !d) return yyyyMmDd
  const dateObj = new Date(y, m - 1, d)
  return dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// Helper to convert time string "11:30 AM" or "14:30" to "HH:MM" for input[type="time"]
function formatTimeForInput(timeStr?: string): string {
  if (!timeStr) return "11:30"
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (match) {
    let hours = parseInt(match[1])
    const minutes = match[2]
    const ampm = match[3]?.toUpperCase()
    if (ampm === "PM" && hours < 12) hours += 12
    if (ampm === "AM" && hours === 12) hours = 0
    return `${hours.toString().padStart(2, "0")}:${minutes}`
  }
  return "11:30"
}

// Helper to convert "HH:MM" (e.g. "14:30") to "11:30 AM"
function formatTimeForDisplay(hhMm: string): string {
  if (!hhMm) return "11:30 AM"
  const [h, m] = hhMm.split(":").map(Number)
  if (isNaN(h) || isNaN(m)) return hhMm
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 || 12
  return `${h12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`
}

interface EditLeadModalProps {
  isOpen: boolean
  lead: Lead | null
  onClose: () => void
  onLeadUpdated: (updatedLead: Lead) => void
  onDeleteLead?: (leadId: string) => void
}

const STANDARD_SERVICES = [
  "Website Devlopment",
  "E-commers Web",
  "Web Software",
  "Android/Ios app",
  "Digital merketing",
]

const STANDARD_SOURCES = [
  "Social Media",
  "Meta Ads",
  "Google Ads",
  "Local Market",
  "My Leads",
]

import { getUsers } from "@/app/feature/users/services/userService"

export function EditLeadModal({ isOpen, lead, onClose, onLeadUpdated, onDeleteLead }: EditLeadModalProps) {
  const { user } = useAuthStore()
  const isSuperOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"
  const [teamMembers, setTeamMembers] = React.useState<{ id: string; name: string; role?: string }[]>([])
  const [type, setType] = React.useState<LeadType>("Organization")
  const [companyName, setCompanyName] = React.useState("")
  const [primaryContact, setPrimaryContact] = React.useState("")
  const [status, setStatus] = React.useState<LeadStatus>("New")
  const [service, setService] = React.useState("Website Devlopment")
  const [customService, setCustomService] = React.useState("")
  const [reminderDate, setReminderDate] = React.useState("12 Aug 2025")
  const [reminderTime, setReminderTime] = React.useState("11:30 AM")
  const [reminderNotes, setReminderNotes] = React.useState("")
  const [caller, setCaller] = React.useState("")
  const [owner, setOwner] = React.useState("")
  const [managers, setManagers] = React.useState("")
  const [source, setSource] = React.useState("Social Media")
  const [customSource, setCustomSource] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [city, setCity] = React.useState("Mumbai")
  const [state, setState] = React.useState("Maharashtra")
  const [zip, setZip] = React.useState("400001")
  const [country, setCountry] = React.useState("India")
  const [phone, setPhone] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [vatNumber, setVatNumber] = React.useState("")
  const [gstNumber, setGstNumber] = React.useState("")
  const [currency, setCurrency] = React.useState("Keep it blank to use the default (INR - ₹)")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      getUsers("all").then((list) => {
        const members = (list || []).map((u) => ({ id: u.id, name: u.name, role: u.role }))
        setTeamMembers(members)
      })
    }
  }, [isOpen])

  React.useEffect(() => {
    if (lead) {
      setType(lead.type || "Organization")
      setCompanyName(lead.name || "")
      setPrimaryContact(lead.primaryContact || "")
      setStatus(lead.status || "New")

      // Service & Custom Service initialization
      const leadSvc = lead.service || "Website Devlopment"
      if (STANDARD_SERVICES.includes(leadSvc)) {
        setService(leadSvc)
        setCustomService("")
      } else {
        setService("Others")
        setCustomService(leadSvc)
      }

      setReminderDate(lead.reminderDate || "12 Aug 2025")
      setReminderTime(lead.reminderTime || "11:30 AM")
      setReminderNotes(lead.reminderNotes || "")
      setCaller(lead.caller || lead.owner || "John Doe")
      setOwner(lead.owner || "John Doe")
      setManagers(lead.managers || "")

      // Source & Custom Source initialization
      const leadSrc = lead.source || "Social Media"
      if (STANDARD_SOURCES.includes(leadSrc)) {
        setSource(leadSrc)
        setCustomSource("")
      } else {
        setSource("Others")
        setCustomSource(leadSrc)
      }

      setAddress(lead.address || "")
      setCity(lead.city || "Mumbai")
      setState(lead.state || "Maharashtra")
      setZip(lead.zip || "400001")
      setCountry(lead.country || "India")
      setPhone(lead.phone || "")
      setWebsite(lead.website || "")
      setVatNumber(lead.vatNumber || "")
      setGstNumber(lead.gstNumber || "")
      setCurrency(lead.currency || "Keep it blank to use the default (INR - ₹)")
    }
  }, [lead])

  if (!isOpen || !lead) return null

  const handleSave = async () => {
    if (!companyName.trim()) {
      alert("Please enter a company or lead name.")
      return
    }

    const finalService = service === "Others" ? (customService.trim() || "Custom Service") : service
    const finalSource = source === "Others" ? (customSource.trim() || "Custom Source") : source

    setIsSubmitting(true)
    try {
      const updated = await updateLead(lead.id, {
        type,
        name: companyName,
        primaryContact,
        status,
        service: finalService,
        reminderDate,
        reminderTime,
        reminderNotes,
        caller,
        owner,
        managers,
        source: finalSource,
        address,
        city,
        state,
        zip,
        country,
        phone,
        website,
        vatNumber,
        gstNumber,
        currency,
      }, user?.role)

      onLeadUpdated(updated)
      onClose()
    } catch (err: any) {
      alert(err?.message || "Failed to update lead")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnlock = async () => {
    if (!lead) return
    try {
      const unlocked = await unlockLead(lead.id)
      onLeadUpdated(unlocked)
      alert("Lead unlocked successfully! Caller can now update this lead.")
    } catch (err: any) {
      alert(err?.message || "Failed to unlock lead")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Edit Lead Details</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {status}
            </span>
            {lead?.isLocked && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 flex items-center gap-1">
                🔒 LOCKED
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Locked Lead Alert Banner */}
        {lead?.isLocked && (
          <div className="bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-800 px-6 py-3 flex items-center justify-between gap-3 text-xs text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <span className="text-base">🔒</span>
              <div>
                <p className="font-bold">Lead Auto-Locked</p>
                <p className="text-[11px] opacity-90">{lead.lockedReason || "Daily status or reminder date update missed."}</p>
              </div>
            </div>
            {isSuperOrAdmin ? (
              <button
                type="button"
                onClick={handleUnlock}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md font-bold shadow-sm transition-colors text-xs whitespace-nowrap"
              >
                🔓 Unlock Lead
              </button>
            ) : (
              <span className="font-semibold italic text-[11px]">Only Admin can unlock</span>
            )}
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* Type radio buttons */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Type</label>
            <div className="col-span-3 flex items-center gap-6 text-zinc-700 dark:text-zinc-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="editLeadType"
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
                  name="editLeadType"
                  value="Person"
                  checked={type === "Person"}
                  onChange={() => setType("Person")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Person</span>
              </label>
            </div>
          </div>

          {/* Lead Name / Company */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Lead / Company</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
            />
          </div>

          {/* Move Stage / Status Selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium text-blue-600 dark:text-blue-400 font-semibold">
              Move Stage (Status)
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="col-span-3 px-3 py-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 dark:text-blue-100 font-bold"
            >
              <option value="New">New</option>
              <option value="Qualified">Qualified</option>
              <option value="Discussion">Discussion</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Store Visit">Store Visit</option>
              <option value="They come to our office">They come to our office</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Service Selector with Others option */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium flex items-center gap-1">
              <Wrench size={13} className="text-zinc-400" />
              <span>Service</span>
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-medium"
            >
              {STANDARD_SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Others">Others</option>
            </select>
          </div>

          {/* Custom Service Form Input when Others is selected */}
          {service === "Others" && (
            <div className="grid grid-cols-4 items-center gap-4 animate-in fade-in duration-150">
              <label className="text-zinc-500 font-medium text-blue-600 dark:text-blue-400 font-semibold">
                Custom Service
              </label>
              <input
                type="text"
                placeholder="Type custom service name..."
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                className="col-span-3 px-3 py-2 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-medium placeholder-zinc-400"
              />
            </div>
          )}

          {/* Remainder Date & Time */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium flex items-center gap-1">
              <Calendar size={13} className="text-amber-500" />
              <span>Reminder Date & Time</span>
            </label>
            <div className="col-span-3 flex items-center gap-2">
              {/* Date Input with Calendar icon */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="date"
                  value={formatDateForInput(reminderDate)}
                  onChange={(e) => setReminderDate(formatDateForDisplay(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-amber-600 dark:text-amber-400 font-semibold cursor-pointer text-xs"
                />
                <Calendar size={14} className="absolute left-2.5 text-amber-500 pointer-events-none" />
              </div>

              {/* Time Input with Clock icon */}
              <div className="w-36 relative flex items-center">
                <input
                  type="time"
                  value={formatTimeForInput(reminderTime)}
                  onChange={(e) => setReminderTime(formatTimeForDisplay(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-amber-600 dark:text-amber-400 font-semibold cursor-pointer text-xs"
                />
                <Clock size={14} className="absolute left-2.5 text-amber-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Remainder Notes */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium pt-2 flex items-center gap-1">
              <FileText size={13} className="text-zinc-400" />
              <span>Remainder Notes</span>
            </label>
            <textarea
              rows={3}
              placeholder="Add reminder notes regarding follow up call..."
              value={reminderNotes}
              onChange={(e) => setReminderNotes(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 resize-none"
            />
          </div>

          {/* Caller / Assigned Member */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium flex items-center gap-1">
              <UserIcon size={13} className="text-zinc-400" />
              <span>Caller</span>
            </label>
            <select
              value={caller}
              onChange={(e) => setCaller(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
            >
              {teamMembers.length === 0 ? (
                <option value="">No team members available</option>
              ) : (
                teamMembers.map((m) => (
                  <option key={m.id || m.name} value={m.name}>
                    {m.name} {m.role ? `(${m.role})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Primary contact */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Primary contact</label>
            <input
              type="text"
              value={primaryContact}
              onChange={(e) => setPrimaryContact(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            />
          </div>

          {/* Phone with India Flag */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Phone</label>
            <div className="col-span-3 flex items-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
              <span className="px-2.5 py-2 text-base border-r border-zinc-200 dark:border-zinc-700 flex items-center gap-1">🇮🇳</span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-transparent focus:outline-none text-zinc-800 dark:text-zinc-200 font-mono text-xs"
              />
            </div>
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

          {/* Custom Source Form Input when Others is selected */}
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
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            />
          </div>

          {/* City */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            />
          </div>

          {/* State */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            />
          </div>

          {/* Country */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            />
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800">
          {onDeleteLead && lead && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to delete lead "${lead.name}"?`)) {
                  onDeleteLead(lead.id)
                  onClose()
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shadow-2xs"
            >
              <Trash2 size={14} />
              <span>Delete Lead</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
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
              <span>Save Changes</span>
            </button>
          </div>
        </div>


      </div>
    </div>
  )
}
