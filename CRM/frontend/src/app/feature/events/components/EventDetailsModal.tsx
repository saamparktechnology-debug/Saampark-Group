"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Lock, Clock, Plus, Trash2, Edit3, XCircle } from "lucide-react"
import { CalendarEvent } from "../types"

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
  const [reminders, setReminders] = React.useState<string[]>([])
  const [newReminder, setNewReminder] = React.useState("")
  const [isAddingReminder, setIsAddingReminder] = React.useState(false)

  if (!isOpen || !event) return null

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 text-slate-800 dark:text-slate-100"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200">
              Event details
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
            <div className="flex items-center gap-2 text-rose-500 font-normal">
              <Lock size={20} className="shrink-0 text-rose-500" />
              <h3 className="text-2xl font-normal text-slate-800 dark:text-slate-100">
                {event.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-0.5">
              <Clock size={15} className="shrink-0 text-slate-400" />
              <span>
                Today, {event.startTime || "06:33:00 am"} – {event.endTime || "07:23:00 am"}
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
          <div className="flex items-center gap-3 pt-1">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-200 shrink-0">
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe"
                alt="John Doe"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              John Doe
            </span>
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
            <button
              type="button"
              onClick={() => {
                onDelete(event.id)
                onClose()
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={15} className="text-slate-500" /> Delete event
            </button>

            <button
              type="button"
              onClick={() => {
                onEdit(event)
                onClose()
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Edit3 size={15} className="text-slate-500" /> Edit event
            </button>

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
