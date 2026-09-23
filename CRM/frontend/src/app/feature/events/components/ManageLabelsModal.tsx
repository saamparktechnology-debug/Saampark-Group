"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Trash2 } from "lucide-react"
import { EventLabel } from "../types"

interface ManageLabelsModalProps {
  isOpen: boolean
  onClose: () => void
  labels: EventLabel[]
  onAddLabel: (label: EventLabel) => void
  onDeleteLabel: (id: string) => void
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

export function ManageLabelsModal({
  isOpen,
  onClose,
  labels,
  onAddLabel,
  onDeleteLabel,
}: ManageLabelsModalProps) {
  const [labelName, setLabelName] = React.useState("")
  const [selectedColor, setSelectedColor] = React.useState(COLOR_SWATCHES[0])

  if (!isOpen) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!labelName.trim()) return

    onAddLabel({
      id: `lbl_${Date.now()}`,
      name: labelName.trim(),
      color: selectedColor,
    })

    setLabelName("")
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 text-slate-800 dark:text-slate-100"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Manage labels
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Color Swatches Bar */}
          <div className="flex items-center flex-wrap gap-2 justify-center py-2">
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

          {/* Add Label Input Form */}
          <form onSubmit={handleSave} className="flex items-center gap-2">
            <input
              type="text"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              placeholder="Label"
              className="flex-1 px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Check size={14} /> Save
            </button>
          </form>

          {/* Existing Labels Chips */}
          <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 min-h-[48px]">
            {labels.length === 0 ? (
              <p className="text-xs text-slate-400">No custom labels created yet.</p>
            ) : (
              labels.map((lbl) => (
                <span
                  key={lbl.id}
                  style={{ backgroundColor: lbl.color }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm group"
                >
                  {lbl.name}
                  <button
                    type="button"
                    onClick={() => onDeleteLabel(lbl.id)}
                    className="hover:opacity-75 transition-opacity"
                    title="Delete label"
                  >
                    <Trash2 size={11} />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <X size={14} /> Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
