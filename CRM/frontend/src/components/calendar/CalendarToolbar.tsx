"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

import { Button } from "../ui/Button"
import { useEventStore } from "@/store/useEventStore"
import { useCalendarNav } from "@/store/useCalendarNav"

const VIEWS = ["Month", "Week", "Day", "Agenda"] as const

export function CalendarToolbar() {
  const { openAddModal } = useEventStore()
  const { currentDate, view, goNext, goPrev, goToday, setView } = useCalendarNav()

  // Format header label based on view
  const headerLabel = React.useMemo(() => {
    if (view === "month") return format(currentDate, "MMMM yyyy")
    if (view === "week") {
      const start = new Date(currentDate)
      start.setDate(start.getDate() - start.getDay())
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
    }
    return format(currentDate, "EEEE, MMMM d, yyyy")
  }, [currentDate, view])

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      {/* Left: Nav controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary" size="icon"
          className="rounded-full w-8 h-8"
          onClick={goPrev}
          title="Previous"
        >
          <ChevronLeft size={16} />
        </Button>
        <Button
          variant="secondary" size="icon"
          className="rounded-full w-8 h-8"
          onClick={goNext}
          title="Next"
        >
          <ChevronRight size={16} />
        </Button>
        <Button
          variant="ghost" size="sm"
          className="font-medium"
          onClick={goToday}
        >
          Today
        </Button>
        <h2 className="text-lg font-bold ml-2 tracking-tight whitespace-nowrap">{headerLabel}</h2>
      </div>

      {/* Right: View switcher + Add */}
      <div className="flex items-center gap-3">
        <div className="glass-panel flex p-1 rounded-lg gap-0.5">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v.toLowerCase() as any)}
              className={`h-8 px-3 rounded-md text-sm font-medium transition-all ${
                view === v.toLowerCase()
                  ? "bg-surface shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <Button variant="primary" onClick={() => openAddModal()} leftIcon={<CalendarIcon size={16} />}>
          Add Event
        </Button>
      </div>
    </div>
  )
}
