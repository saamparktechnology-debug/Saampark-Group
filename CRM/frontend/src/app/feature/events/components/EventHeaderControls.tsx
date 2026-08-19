"use client"

import * as React from "react"
import { Search, ChevronDown, ChevronUp, Tag, Plus } from "lucide-react"
import { EventLabel, EventTypeOption } from "../types"

interface EventHeaderControlsProps {
  selectedLabel: string
  onSelectLabel: (label: string) => void
  selectedEventType: EventTypeOption
  onSelectEventType: (type: EventTypeOption) => void
  labels: EventLabel[]
  onOpenManageLabels: () => void
  onOpenAddEvent: () => void
}

const DEFAULT_EVENT_TYPES: EventTypeOption[] = [
  "Events",
  "Leave",
  "Task start date",
  "Task deadline",
  "Project start date",
  "Project deadline",
]

export function EventHeaderControls({
  selectedLabel,
  onSelectLabel,
  selectedEventType,
  onSelectEventType,
  labels,
  onOpenManageLabels,
  onOpenAddEvent,
}: EventHeaderControlsProps) {
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = React.useState(false)
  const [isEventTypeDropdownOpen, setIsEventTypeDropdownOpen] = React.useState(false)
  const [labelSearchText, setLabelSearchText] = React.useState("")

  const labelDropdownRef = React.useRef<HTMLDivElement>(null)
  const typeDropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (labelDropdownRef.current && !labelDropdownRef.current.contains(e.target as Node)) {
        setIsLabelDropdownOpen(false)
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setIsEventTypeDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredLabelsList = React.useMemo(() => {
    const rawList = ["- Event label -", "Call", "Email", "Visit", ...labels.map((l) => l.name)]
    const uniqueList = Array.from(new Set(rawList))
    if (!labelSearchText.trim()) return uniqueList
    return uniqueList.filter((item) =>
      item.toLowerCase().includes(labelSearchText.toLowerCase().trim())
    )
  }, [labelSearchText, labels])

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
      {/* Title */}
      <h1 className="text-2xl font-normal text-slate-700 dark:text-slate-200">
        Event calendar
      </h1>

      {/* Top Right Action Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 1. - Event label - Dropdown */}
        <div ref={labelDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsLabelDropdownOpen(!isLabelDropdownOpen)
              setIsEventTypeDropdownOpen(false)
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between gap-3 min-w-[160px] shadow-sm hover:border-slate-300 transition-colors"
          >
            <span>{selectedLabel || "- Event label -"}</span>
            {isLabelDropdownOpen ? <ChevronUp size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {isLabelDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-2 space-y-2">
              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  value={labelSearchText}
                  onChange={(e) => setLabelSearchText(e.target.value)}
                  placeholder=""
                  className="w-full pl-3 pr-8 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Items List */}
              <div className="max-h-48 overflow-y-auto scrollbar-hide divide-y divide-slate-50 dark:divide-slate-800">
                {filteredLabelsList.map((lbl, idx) => {
                  const isSelected = (selectedLabel || "- Event label -") === lbl
                  return (
                    <button
                      key={`${lbl}_${idx}`}
                      type="button"
                      onClick={() => {
                        onSelectLabel(lbl === "- Event label -" ? "" : lbl)
                        setIsLabelDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white font-medium"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {lbl}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Event type Dropdown */}
        <div ref={typeDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsEventTypeDropdownOpen(!isEventTypeDropdownOpen)
              setIsLabelDropdownOpen(false)
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 shadow-sm hover:bg-slate-200 transition-colors"
          >
            <span>{selectedEventType}</span>
            <ChevronDown size={14} className="text-slate-500" />
          </button>

          {isEventTypeDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-1.5">
              {DEFAULT_EVENT_TYPES.map((type) => {
                const isSelected = selectedEventType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onSelectEventType(type)
                      setIsEventTypeDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {type}
                  </button>
                )}
              )}
            </div>
          )}
        </div>

        {/* 3. Manage labels Button */}
        <button
          type="button"
          onClick={onOpenManageLabels}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Tag size={15} className="text-slate-500" />
          <span>Manage labels</span>
        </button>

        {/* 4. Add event Button */}
        <button
          type="button"
          onClick={onOpenAddEvent}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus size={15} className="text-slate-600" />
          <span>Add event</span>
        </button>
      </div>
    </div>
  )
}
