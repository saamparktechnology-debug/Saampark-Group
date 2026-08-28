"use client"

import * as React from "react"
import { X, Phone, Calendar, Clock, CheckCircle2, AlertCircle, User, FileText, Check } from "lucide-react"
import { Lead } from "../types"
import { updateLead } from "../services/leadService"

interface CallOutcomeModalProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead | null
  onLeadUpdated: (updatedLead: Lead) => void
}

const OUTCOMES = [
  { id: "interested", label: "Interested (Follow-up Needed)", status: "Discussion", color: "blue", nextDays: 2 },
  { id: "meeting", label: "Meeting / Office Visit Fixed", status: "Our Office Visit", color: "purple", nextDays: 1 },
  { id: "proposal", label: "Requirement Sent (Share Quote)", status: "Proposal", color: "indigo", nextDays: 1 },
  { id: "busy", label: "Busy / Call Back Later", status: "Follow Up", color: "amber", nextDays: 1 },
  { id: "rnr", label: "RNR / Not Reachable", status: "Follow Up", color: "zinc", nextDays: 1 },
  { id: "won", label: "Deal Won 🎉", status: "Won", color: "emerald", nextDays: 0 },
  { id: "lost", label: "Deal Lost / Not Interested", status: "Lost", color: "rose", nextDays: 0 },
]

export function CallOutcomeModal({ isOpen, onClose, lead, onLeadUpdated }: CallOutcomeModalProps) {
  const [selectedOutcomeId, setSelectedOutcomeId] = React.useState<string>("interested")
  const [callNotes, setCallNotes] = React.useState<string>("")
  const [nextReminderDate, setNextReminderDate] = React.useState<string>("")
  const [nextReminderTime, setNextReminderTime] = React.useState<string>("04:00 PM")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (lead && isOpen) {
      const selected = OUTCOMES.find((o) => o.id === selectedOutcomeId) || OUTCOMES[0]
      const d = new Date()
      d.setDate(d.getDate() + (selected.nextDays || 1))
      const day = String(d.getDate()).padStart(2, "0")
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const year = d.getFullYear()
      setNextReminderDate(`${day}-${month}-${year}`)
      setCallNotes("")
    }
  }, [lead, isOpen, selectedOutcomeId])

  if (!isOpen || !lead) return null

  const handleSelectOutcome = (outcomeId: string) => {
    setSelectedOutcomeId(outcomeId)
    const o = OUTCOMES.find((item) => item.id === outcomeId)
    if (o) {
      const d = new Date()
      d.setDate(d.getDate() + o.nextDays)
      const day = String(d.getDate()).padStart(2, "0")
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const year = d.getFullYear()
      setNextReminderDate(o.nextDays > 0 ? `${day}-${month}-${year}` : "None")
    }
  }

  const handleSave = async () => {
    if (!lead) return
    setIsSubmitting(true)
    try {
      const o = OUTCOMES.find((item) => item.id === selectedOutcomeId) || OUTCOMES[0]
      const newStatus = (o.status as any) || lead.status

      const timestamp = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
      const noteAppend = callNotes.trim()
        ? `[${timestamp} Call]: ${callNotes.trim()}`
        : `[${timestamp} Call]: ${o.label}`

      const updatedHistory = lead.reminderNotes
        ? `${lead.reminderNotes}\n${noteAppend}`
        : noteAppend

      const updated = await updateLead(lead.id, {
        status: newStatus,
        reminderDate: o.nextDays > 0 ? nextReminderDate : "None",
        reminderTime: o.nextDays > 0 ? nextReminderTime : "None",
        reminderNotes: updatedHistory,
        isLocked: false,
      })

      onLeadUpdated(updated)
      onClose()
    } catch (err: any) {
      alert(err.message || "Failed to log call")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Phone size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Log Telecall Result
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Contact: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{lead.primaryContact || lead.name}</span> ({lead.phone})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Outcomes Grid */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Select Call Outcome
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OUTCOMES.map((o) => {
                const isSelected = selectedOutcomeId === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleSelectOutcome(o.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs"
                    }`}
                  >
                    <span className="text-xs">{o.label}</span>
                    {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Next Reminder Date & Time */}
          {OUTCOMES.find((o) => o.id === selectedOutcomeId)?.nextDays !== 0 && (
            <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-zinc-500 flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Next Reminder Date</span>
                </label>
                <input
                  type="text"
                  placeholder="DD-MM-YYYY"
                  value={nextReminderDate}
                  onChange={(e) => setNextReminderDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-zinc-500 flex items-center gap-1">
                  <Clock size={12} />
                  <span>Reminder Time</span>
                </label>
                <input
                  type="text"
                  placeholder="04:00 PM"
                  value={nextReminderTime}
                  onChange={(e) => setNextReminderTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Call Discussion Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <FileText size={12} />
              <span>Call Discussion Notes</span>
            </label>
            <textarea
              rows={3}
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="e.g. Discussed website revamp package. Client requested quote with payment milestones..."
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            <span>{isSubmitting ? "Saving..." : "Save Call Log"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
