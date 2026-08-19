"use client"

import * as React from "react"
import { Search, Wrench, Check } from "lucide-react"

interface ProjectFiltersDropdownProps {
  isOpen: boolean
  onClose: () => void
  activeFilter: string
  onSelectFilter: (filterId: string) => void
}

export const filterOptions = [
  { id: "All projects", label: "All projects" },
  { id: "Completed", label: "Completed" },
  { id: "High Priority", label: "High Priority" },
  { id: "Open projects", label: "Open projects" },
  { id: "Upcoming", label: "Upcoming" },
]

export function ProjectFiltersDropdown({
  isOpen,
  onClose,
  activeFilter,
  onSelectFilter,
}: ProjectFiltersDropdownProps) {
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

  const filteredOptions = filterOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1.5 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header action */}
      <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => {
            alert("Manage filters clicked")
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 w-full transition-colors font-medium"
        >
          <Wrench size={13} className="text-zinc-500" />
          <span>Manage Filters</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Filter Presets List */}
      <div className="py-1 max-h-60 overflow-y-auto">
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
                  ? "bg-blue-600 text-white font-medium"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
              }`}
            >
              <span>{opt.label}</span>
              {isSelected && <Check size={14} className="text-white ml-2" />}
            </button>
          )
        })}
        {filteredOptions.length === 0 && (
          <div className="px-4 py-3 text-xs text-zinc-400 text-center">No filters found</div>
        )}
      </div>
    </div>
  )
}
