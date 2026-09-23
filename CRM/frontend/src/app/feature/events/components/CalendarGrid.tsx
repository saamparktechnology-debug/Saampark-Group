"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Lock } from "lucide-react"
import { CalendarEvent, CalendarViewMode, EventTypeOption } from "../types"

interface CalendarGridProps {
  events: CalendarEvent[]
  viewMode: CalendarViewMode
  onSelectViewMode: (mode: CalendarViewMode) => void
  selectedLabel: string
  selectedEventType: EventTypeOption
  onDateClick: (dateStr: string) => void
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarGrid({
  events,
  viewMode,
  onSelectViewMode,
  selectedLabel,
  selectedEventType,
  onDateClick,
  onEventClick,
}: CalendarGridProps) {
  // Navigation date state (August 2026 as per reference screenshot)
  const [currentYear, setCurrentYear] = React.useState(2026)
  const [currentMonth, setCurrentMonth] = React.useState(7) // 0-indexed (7 = August)

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleToday = () => {
    setCurrentMonth(7) // August
    setCurrentYear(2026)
  }

  // Filter events based on active dropdown filters
  const filteredEvents = React.useMemo(() => {
    return events.filter((evt) => {
      const matchesLabel =
        !selectedLabel ||
        selectedLabel === "- Event label -" ||
        (evt.label && evt.label.toLowerCase() === selectedLabel.toLowerCase())

      const matchesType =
        !selectedEventType ||
        selectedEventType === "Events" ||
        evt.eventType === selectedEventType

      return matchesLabel && matchesType
    })
  }, [events, selectedLabel, selectedEventType])

  // Build grid days array for August 2026 (Sun Aug 26 prev month to Sat Sep 5 next month)
  const gridDays = React.useMemo(() => {
    const days = []
    
    // July trailing days (26, 27, 28, 29, 30, 31)
    const prevMonthDays = [26, 27, 28, 29, 30, 31]
    prevMonthDays.forEach((d) => {
      days.push({
        dayNum: d,
        monthOffset: -1,
        dateStr: `2026-07-${d < 10 ? "0" + d : d}`,
        isToday: false,
      })
    })

    // August days (1 to 31)
    for (let d = 1; d <= 31; d++) {
      const dateStr = `2026-08-${d < 10 ? "0" + d : d}`
      days.push({
        dayNum: d,
        monthOffset: 0,
        dateStr,
        isToday: d === 15, // Highlight Sat Aug 15 as current day
      })
    }

    // September leading days (1 to 5)
    for (let d = 1; d <= 5; d++) {
      const dateStr = `2026-09-0${d}`
      days.push({
        dayNum: d,
        monthOffset: 1,
        dateStr,
        isToday: false,
      })
    }

    return days
  }, [])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Calendar Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-100 dark:border-slate-800">
        {/* Navigation buttons: Prev, Next, Today */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="ml-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            today
          </button>
        </div>

        {/* Center Title */}
        <h2 className="text-xl font-normal text-slate-800 dark:text-slate-100">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h2>

        {/* Right View Switcher */}
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
          {(["month", "week", "day", "list"] as CalendarViewMode[]).map((mode) => {
            const isSelected = viewMode === mode
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onSelectViewMode(mode)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  isSelected
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {mode}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid Header (Sun - Sat) */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-center text-xs font-medium text-slate-600 dark:text-slate-400 py-2.5">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Grid Cells */}
      {viewMode === "list" ? (
        <div className="p-4 space-y-2">
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No events found matching filter criteria.</p>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick(evt)
                }}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span
                    style={{ backgroundColor: evt.color }}
                    className="w-3 h-3 rounded-full shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{evt.title}</h4>
                    <p className="text-xs text-slate-400">{evt.startDate} • {evt.startTime || "All Day"}</p>
                  </div>
                </div>
                {evt.label && (
                  <span
                    style={{ backgroundColor: evt.color }}
                    className="px-2.5 py-0.5 rounded-full text-xs text-white font-medium"
                  >
                    {evt.label}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-7 border-collapse flex-1 auto-rows-fr min-h-[580px]">
          {gridDays.map((item, idx) => {
            const dayEvents = filteredEvents.filter((e) => e.startDate === item.dateStr)

            return (
              <div
                key={`${item.dateStr}_${idx}`}
                onClick={() => onDateClick(item.dateStr)}
                className={`border-r border-b border-slate-100 dark:border-slate-800/60 p-1.5 flex flex-col min-h-[95px] relative group cursor-pointer transition-colors ${
                  item.isToday
                    ? "bg-amber-50/60 dark:bg-amber-950/20"
                    : item.monthOffset !== 0
                    ? "bg-slate-50/30 dark:bg-slate-900/30"
                    : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                }`}
              >
                {/* Day Number */}
                <div className="flex justify-end mb-1">
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                      item.isToday
                        ? "text-slate-800 dark:text-slate-100"
                        : item.monthOffset !== 0
                        ? "text-slate-300 dark:text-slate-600"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {item.dayNum}
                  </span>
                </div>

                {/* Day Events Pill Badges */}
                <div className="space-y-1 overflow-hidden flex-1">
                  {dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(evt)
                      }}
                      style={{ backgroundColor: evt.color }}
                      className="px-1.5 py-0.5 rounded text-[11px] font-medium text-white flex items-center gap-1 truncate shadow-2xs transition-transform hover:scale-[1.02] cursor-pointer"
                      title={evt.title}
                    >
                      <Lock size={10} className="shrink-0 opacity-80" />
                      <span className="truncate">{evt.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
