"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Paperclip, Mic } from "lucide-react"
import { CalendarEvent, EventLabel, EventTypeOption } from "../types"

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: Partial<CalendarEvent>) => void
  initialDate?: string
  labels: EventLabel[]
}

const COLOR_SWATCHES = [
  "#84cc16", // Lime Green
  "#06b6d4", // Turquoise / Cyan
  "#0284c7", // Sky Blue
  "#94a3b8", // Slate Gray
  "#eab308", // Yellow / Gold
  "#f97316", // Orange
  "#ef4444", // Red
  "#ec4899", // Pink
  "#a855f7", // Magenta / Purple
  "#38bdf8", // Light Cyan
  "#1e293b", // Navy
  "#d8b4fe", // Lavender / Light Purple
  "#3b82f6", // Royal Blue
]

export function AddEventModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
  labels,
}: AddEventModalProps) {
  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], [])
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [startDate, setStartDate] = React.useState(initialDate || todayStr)
  const [startTime, setStartTime] = React.useState("09:00")
  const [endDate, setEndDate] = React.useState(initialDate || todayStr)
  const [endTime, setEndTime] = React.useState("10:00")
  const [location, setLocation] = React.useState("")
  const [selectedLabel, setSelectedLabel] = React.useState("")
  const [client, setClient] = React.useState("")
  const [isPublicHoliday, setIsPublicHoliday] = React.useState(false)
  const [shareWith, setShareWith] = React.useState<"Only me" | "All team members" | "Specific members and teams">("All team members")
  const [isRepeat, setIsRepeat] = React.useState(false)
  const [selectedColor, setSelectedColor] = React.useState(COLOR_SWATCHES[12]) // Default Royal Blue

  React.useEffect(() => {
    if (initialDate) {
      setStartDate(initialDate)
      setEndDate(initialDate)
    }
  }, [initialDate, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSave({
      id: `evt_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      startDate: startDate || "2026-08-15",
      startTime,
      endDate: endDate || startDate || "2026-08-15",
      endTime,
      location,
      label: selectedLabel || "General",
      labelColor: selectedColor,
      eventType: "Events" as EventTypeOption,
      client,
      isPublicHoliday,
      shareWith,
      isRepeat,
      color: selectedColor,
      isLocked: true,
    })

    // Reset form
    setTitle("")
    setDescription("")
    setLocation("")
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto scrollbar-hide"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-medium text-slate-800 dark:text-slate-100">
              Add event
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* Title */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="md:col-span-3 px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
              <label className="text-slate-600 dark:text-slate-400 font-medium pt-2">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="md:col-span-3 px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Start date</label>
              <div className="md:col-span-3 grid grid-cols-3 gap-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="col-span-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="Start time"
                  className="col-span-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">End date</label>
              <div className="md:col-span-3 grid grid-cols-3 gap-3">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="col-span-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="End time"
                  className="col-span-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="md:col-span-3 px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Labels */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Labels</label>
              <select
                value={selectedLabel}
                onChange={(e) => setSelectedLabel(e.target.value)}
                className="md:col-span-3 px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Labels</option>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Visit">Visit</option>
                {labels.map((lbl) => (
                  <option key={lbl.id} value={lbl.name}>
                    {lbl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Client */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Client</label>
              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="md:col-span-3 px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Client</option>
                <option value="Acme Corporation">Acme Corporation</option>
                <option value="SAAMPARK Tech Client">SAAMPARK Tech Client</option>
                <option value="Global Digital Ltd">Global Digital Ltd</option>
              </select>
            </div>

            {/* Public Holiday Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Public holiday</label>
              <div className="md:col-span-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setIsPublicHoliday(!isPublicHoliday)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    isPublicHoliday ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isPublicHoliday ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Share With Options */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
              <label className="text-slate-600 dark:text-slate-400 font-medium pt-1">Share with</label>
              <div className="md:col-span-3 space-y-2">
                {(["Only me", "All team members", "Specific members and teams"] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareWith === opt}
                      onChange={() => setShareWith(opt)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Repeat Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Repeat</label>
              <div className="md:col-span-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    isRepeat ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isRepeat ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Color Swatches Selector */}
            <div className="flex items-center flex-wrap gap-2 justify-center py-2 border-t border-b border-slate-100 dark:border-slate-800">
              {COLOR_SWATCHES.map((color) => {
                const isSelected = selectedColor === color
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-sm transition-transform flex items-center justify-center ${
                      isSelected ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-105"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white drop-shadow" />}
                  </button>
                )
              })}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <Paperclip size={13} /> Upload File
                </button>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <Mic size={14} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-1.5 transition-colors"
                >
                  <X size={14} /> Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Check size={14} /> Save
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
