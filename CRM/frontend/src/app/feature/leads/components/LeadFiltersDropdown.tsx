"use client"

import * as React from "react"
import { Wrench, X, Check, Globe } from "lucide-react"
import { LabelItem } from "./ManageLabelsModal"

interface LeadFiltersDropdownProps {
  isOpen: boolean
  onClose: () => void
  activeFilter: string
  onSelectFilter: (filterId: string) => void
  onClearFilters?: () => void
  availableLabels?: LabelItem[]
  sources?: string[]
  onOpenManageLabelsModal?: () => void
}

const DEFAULT_SOURCES = [
  "Social Media",
  "Meta Ads",
  "Google Ads",
  "Local Market",
  "My Leads",
]

export function LeadFiltersDropdown({
  isOpen,
  onClose,
  activeFilter,
  onSelectFilter,
  onClearFilters,
  availableLabels = [],
  sources = DEFAULT_SOURCES,
  onOpenManageLabelsModal,
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

  // Standard Filters
  const baseOptions = [
    { id: "All leads", label: "All leads", type: "system" },
    { id: "My leads", label: "My leads", type: "system" },
  ]

  // Source Options
  const sourceOptions = (sources && sources.length > 0 ? sources : DEFAULT_SOURCES).map((src) => ({
    id: src,
    label: src,
    type: "source",
  }))

  // Label Options
  const labelOptions = (availableLabels || []).map((lbl) => ({
    id: lbl.name,
    label: lbl.name,
    color: lbl.color,
    type: "label",
  }))

  // Combine and deduplicate
  const allOptions: Array<{ id: string; label: string; color?: string; type: string }> = []
  const seenIds = new Set<string>()

  const addOpt = (opt: { id: string; label: string; color?: string; type: string }) => {
    if (!seenIds.has(opt.id)) {
      seenIds.add(opt.id)
      allOptions.push(opt)
    }
  }

  baseOptions.forEach(addOpt)
  sourceOptions.forEach(addOpt)
  labelOptions.forEach(addOpt)

  const filteredOptions = allOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1.5 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Top action row */}
      <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 bg-zinc-50/50 dark:bg-zinc-800/40">
        <button
          type="button"
          onClick={() => {
            if (onOpenManageLabelsModal) onOpenManageLabelsModal()
            onClose()
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition-colors cursor-pointer"
        >
          <Wrench size={13} className="text-zinc-500" />
          <span>Manage Labels</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onClearFilters) onClearFilters()
            onClose()
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
        >
          <X size={13} />
          <span>Clear</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
        <input
          type="text"
          placeholder="Search filters & sources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
        />
      </div>

      {/* Options List with categorized sections */}
      <div className="py-1 max-h-72 overflow-y-auto">
        {filteredOptions.length === 0 ? (
          <div className="p-4 text-center text-zinc-400 text-xs">No matching filters</div>
        ) : (
          filteredOptions.map((opt, idx) => {
            const isSelected = activeFilter === opt.id
            const prevOpt = filteredOptions[idx - 1]
            const showHeader = !searchQuery && (!prevOpt || prevOpt.type !== opt.type)

            return (
              <React.Fragment key={opt.id}>
                {showHeader && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                    {opt.type === "system" ? "General" : opt.type === "source" ? "Sources" : "Labels"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onSelectFilter(opt.id)
                    onClose()
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {opt.type === "label" && opt.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    {opt.type === "source" && (
                      <Globe size={13} className={isSelected ? "text-white" : "text-blue-500 shrink-0"} />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-white ml-2 shrink-0" />}
                </button>
              </React.Fragment>
            )
          })
        )}
      </div>
    </div>
  )
}
