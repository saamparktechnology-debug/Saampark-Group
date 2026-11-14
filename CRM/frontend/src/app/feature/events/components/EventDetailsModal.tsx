"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Lock, Clock, Plus, Trash2, Edit3, XCircle, Users, Globe, Building2, ShieldAlert } from "lucide-react"
import { CalendarEvent } from "../types"
import { useAuthStore } from "@/store/useAuthStore"

interface EventDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  event: CalendarEvent | null
  onDelete: (id: string) => void
  onEdit: (event: CalendarEvent) => void
}

export function EventDetailsModal({
  isOpen,
  onClose,
  event,
  onDelete,
  onEdit,
}: EventDetailsModalProps) {
  const { user } = useAuthStore()
  const [reminders, setReminders] = React.useState<string[]>([])
  const [newReminder, setNewReminder] = React.useState("")
  const [isAddingReminder, setIsAddingReminder] = React.useState(false)

  if (!isOpen || !event) return null

  const isSuperAdmin = user?.role === "Super Admin"
  const isCompanyAdmin = user?.role === "Admin"
  const isCreator =
    (event.creatorEmail && event.creatorEmail.toLowerCase() === (user?.email || "").toLowerCase().trim()) ||
    (event.createdBy && event.createdBy.toLowerCase().trim() === (user?.name || "").toLowerCase().trim())

  const canModify = isSuperAdmin || isCompanyAdmin || isCreator

  const handleAddReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReminder.trim()) return
    setReminders((prev) => [...prev, newReminder.trim()])
    setNewReminder("")
    setIsAddingReminder(false)
  }

  const handleDeleteReminder = (idx: number) => {
    setReminders((prev) => prev.filter((_, i) => i !== idx))
  }

  let audienceBadge = { label: "🔒 Private Event", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300" }
  if (event.audience === "only_clients") {
    audienceBadge = { label: "🏢 Broadcast to Clients", color: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200" }
  } else if (event.audience === "only_teams") {
    audienceBadge = { label: "👥 Broadcast to Teams", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200" }
  } else if (event.audience === "all") {
    audienceBadge = { label: "🌐 Broadcast to Everyone", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200" }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 text-slate-800 dark:text-slate-100"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span>Event Details</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${audienceBadge.color}`}>
                {audienceBadge.label}
              </span>
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Title & Time Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <span
                style={{ backgroundColor: event.color || "#ef4444" }}
                className="w-3.5 h-3.5 rounded-full shrink-0"
              />
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {event.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-0.5">
              <Clock size={15} className="shrink-0 text-slate-400" />
              <span>
                {event.startDate} {event.startTime ? `(${event.startTime} – ${event.endTime || ""})` : ""}
              </span>
            </div>
          </div>

          {/* Description Block with Left Colored Bar */}
          <div
            style={{ borderLeftColor: event.color || "#ef4444" }}
            className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-r-lg border-l-4 text-sm text-slate-600 dark:text-slate-300"
          >
            {event.description || "Discussion about project development."}
          </div>

          {/* User Creator Avatar Badge */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 overflow-hidden flex items-center justify-center font-semibold text-blue-600 dark:text-blue-300 shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${event.createdBy || (event as any).created_by || "User"}`}
                  alt={event.createdBy || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {event.createdBy || (event as any).created_by || "Organizer"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {event.creatorRole || "Organizer"} {event.companyId ? `• ${event.companyId.toUpperCase()}` : ""}
                </span>
              </div>
            </div>

            {!canModify && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                <Lock size={10} /> Read-Only Broadcast
              </span>
            )}
          </div>

          {/* Reminders (Private) Section */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Reminders (Private):
            </h4>

            {reminders.length > 0 && (
              <div className="space-y-1.5 pl-1">
                {reminders.map((rem, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
                    <span>⏰ {rem}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isAddingReminder ? (
              <form onSubmit={handleAddReminderSubmit} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  required
                  value={newReminder}
                  onChange={(e) => setNewReminder(e.target.value)}
                  placeholder="e.g. 15 minutes before"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingReminder(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingReminder(true)}
                className="text-sm font-normal text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors"
              >
                <Plus size={16} /> Add reminder
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            {canModify && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove event "${event.title}"?`)) {
                      onDelete(event.id)
                      onClose()
                    }
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-sm font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={15} /> Delete event
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onEdit(event)
                    onClose()
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 size={15} /> Edit event
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <X size={15} /> Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
