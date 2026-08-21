"use client"

import * as React from "react"
import { Wrench, X, Check } from "lucide-react"
import { LabelItem } from "./ManageLabelsModal"

interface LeadFiltersDropdownProps {
  isOpen: boolean
  onClose: () => void
  activeFilter: string
  onSelectFilter: (filterId: string) => void
  onClearFilters?: () => void
  availableLabels?: LabelItem[]
}

export function LeadFiltersDropdown({
  isOpen,
  onClose,
  activeFilter,
  onSelectFilter,
  onClearFilters,
  availableLabels = [],
}: LeadFiltersDropdownProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Combine standard filters with all labels dynamically
  const baseOptions = [
    { id: "My leads", label: "My leads" },
    { id: "All leads", label: "All leads" },
  ]

  const labelOptions = (availableLabels || []).map((lbl) => ({
    id: lbl.name,
    label: lbl.name,
    color: lbl.color,
  }))

  // Deduplicate options if a label is already in base options
  const allOptionsMap = new Map<string, { id: string; label: string; color?: string }>()
  baseOptions.forEach((opt) => allOptionsMap.set(opt.id, opt))
  labelOptions.forEach((opt) => {
    if (!allOptionsMap.has(opt.id)) {
      allOptionsMap.set(opt.id, opt)
    }
  })

  const allOptions = Array.from(allOptionsMap.values())

  const filteredOptions = allOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1.5 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Top action row matching user screenshot */}
      <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium"
        >
          <Wrench size={13} className="text-zinc-500" />
          <span>Manage Filters</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onClearFilters) onClearFilters()
            onClose()
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium border border-zinc-200 dark:border-zinc-700"
        >
          <X size={13} />
          <span>Clear</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
        />
      </div>

      {/* Options List with exact blue highlight matching screenshot */}
      <div className="py-1 max-h-64 overflow-y-auto">
        {filteredOptions.map((opt) => {
          const isSelected = activeFilter === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSelectFilter(opt.id)
                onClose()
              }}
              className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
              }`}
            >
              <div className="flex items-center gap-2">
                {opt.color && (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                <span>{opt.label}</span>
              </div>
              {isSelected && <Check size={14} className="text-white ml-2 shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
