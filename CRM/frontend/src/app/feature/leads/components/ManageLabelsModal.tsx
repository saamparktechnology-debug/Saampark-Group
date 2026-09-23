"use client"

import * as React from "react"
import { X, Check, Trash2 } from "lucide-react"

export interface LabelItem {
  id: string
  name: string
  color: string // Tailwind or hex color
}

interface ManageLabelsModalProps {
  isOpen: boolean
  onClose: () => void
  labels: LabelItem[]
  onSaveLabel: (newLabel: LabelItem) => void
  onDeleteLabel: (labelId: string) => void
}

export const COLOR_PALETTE = [
  { id: "lime", bg: "bg-lime-500", hex: "#84cc16" },
  { id: "cyan", bg: "bg-cyan-500", hex: "#06b6d4" },
  { id: "blue", bg: "bg-blue-500", hex: "#3b82f6" },
  { id: "grey", bg: "bg-zinc-400", hex: "#9ca3af" },
  { id: "yellow", bg: "bg-amber-400", hex: "#eab308" },
  { id: "orange", bg: "bg-orange-500", hex: "#f97316" },
  { id: "red", bg: "bg-red-500", hex: "#ef4444" },
  { id: "pink", bg: "bg-pink-500", hex: "#ec4899" },
  { id: "purple", bg: "bg-purple-600", hex: "#a855f7" },
  { id: "darkcyan", bg: "bg-sky-500", hex: "#0284c7" },
  { id: "slate", bg: "bg-slate-700", hex: "#334155" },
  { id: "lavender", bg: "bg-purple-300", hex: "#d8b4fe" },
  { id: "solidblue", bg: "bg-blue-600", hex: "#2563eb" },
]

export function ManageLabelsModal({
  isOpen,
  onClose,
  labels,
  onSaveLabel,
  onDeleteLabel,
}: ManageLabelsModalProps) {
  const [selectedColorHex, setSelectedColorHex] = React.useState(COLOR_PALETTE[8].hex) // default purple
  const [labelInput, setLabelInput] = React.useState("")

  if (!isOpen) return null

  const handleSave = () => {
    if (!labelInput.trim()) return
    onSaveLabel({
      id: `lbl_${Date.now()}`,
      name: labelInput.trim(),
      color: selectedColorHex,
    })
    setLabelInput("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header matching Screenshot 2 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-200">Manage labels</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs">
          
          {/* Color Palette Selection Row matching Screenshot 2 */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {COLOR_PALETTE.map((c) => {
              const isSelected = selectedColorHex === c.hex
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColorHex(c.hex)}
                  className={`w-6 h-6 rounded ${c.bg} transition-transform flex items-center justify-center ${
                    isSelected ? "ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-md" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && <Check size={12} className="text-white" />}
                </button>
              )
            })}
          </div>

          {/* Label Input & Save Button Row matching Screenshot 2 */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Label"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSave()
                }
              }}
              className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 text-xs"
            />

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors shadow-2xs shrink-0"
            >
              <Check size={14} />
              <span>Save</span>
            </button>
          </div>

          {/* Existing Labels List Pills matching Screenshot 2 */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              {labels.map((lbl) => (
                <div
                  key={lbl.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white shadow-2xs group"
                  style={{ backgroundColor: lbl.color || "#a855f7" }}
                >
                  <span>{lbl.name}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteLabel(lbl.id)}
                    className="opacity-60 hover:opacity-100 hover:text-red-200 transition-opacity ml-1"
                    title="Delete label"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer matching Screenshot 2 */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>

      </div>
    </div>
  )
}
