"use client"

import * as React from "react"
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, startOfWeek, endOfWeek, isSameDay,
  addDays, startOfDay, eachHourOfInterval, startOfHour
} from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import { MapPin } from "lucide-react"

import { useEventStore } from "@/store/useEventStore"
import { useCalendarNav } from "@/store/useCalendarNav"

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const EVENT_COLORS: Record<string, string> = {
  Meeting: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-pink-300 dark:border-pink-700",
  Holiday: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
  Deadline: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700",
  Training: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700",
  Default: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700",
}

// ── Month View ─────────────────────────────────────────────────────────────
function MonthView({ currentDate, filteredEvents, openAddModal, openEventDrawer }: any) {
  const monthStart = startOfMonth(currentDate)
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(monthStart)),
  })

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-7 border-b border-border bg-surface-hover/30">
        {DAYS_SHORT.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isCurrentDay = isToday(day)
          const dayEvents = filteredEvents.filter((ev: any) => isSameDay(new Date(ev.start), day))

          return (
            <div
              key={day.toISOString()}
              onClick={() => openAddModal(day)}
              className={`border-b border-r border-border/40 p-1.5 min-h-[80px] cursor-pointer hover:bg-surface-hover/40 transition-colors ${
                !isCurrentMonth ? "bg-surface-hover/10 opacity-60" : ""
              } ${idx % 7 === 6 ? "border-r-0" : ""}`}
            >
              <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${
                isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground"
              }`}>
                {format(day, "d")}
              </span>
              <div className="space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev: any) => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); openEventDrawer(ev) }}
                    className={`text-[11px] px-1.5 py-0.5 rounded truncate border cursor-pointer hover:scale-[1.02] transition-transform ${EVENT_COLORS[ev.category] || EVENT_COLORS.Default}`}
                  >
                    {!ev.allDay && format(new Date(ev.start), "HH:mm")} {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Week View ──────────────────────────────────────────────────────────────
function WeekView({ currentDate, filteredEvents, openAddModal, openEventDrawer }: any) {
  const weekStart = startOfWeek(currentDate)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Header */}
      <div className="grid grid-cols-8 border-b border-border bg-surface-hover/30 sticky top-0 z-10">
        <div className="py-2 px-3 text-xs text-muted-foreground" />
        {days.map(d => (
          <div key={d.toISOString()} className={`py-2 text-center ${isToday(d) ? "text-primary font-bold" : "text-muted-foreground"}`}>
            <div className="text-xs uppercase">{format(d, "EEE")}</div>
            <div className={`text-lg font-bold mx-auto w-9 h-9 flex items-center justify-center rounded-full ${isToday(d) ? "bg-primary text-white" : ""}`}>
              {format(d, "d")}
            </div>
          </div>
        ))}
      </div>
      {/* Time slots */}
      {Array.from({ length: 24 }, (_, hour) => (
        <div key={hour} className="grid grid-cols-8 border-b border-border/30 min-h-[48px]">
          <div className="px-3 text-[10px] text-muted-foreground pt-1 text-right">{hour === 0 ? "" : format(new Date().setHours(hour, 0), "h a")}</div>
          {days.map(d => {
            const slotEvents = filteredEvents.filter((ev: any) => {
              const evDate = new Date(ev.start)
              return isSameDay(evDate, d) && evDate.getHours() === hour
            })
            return (
              <div key={d.toISOString()} onClick={() => openAddModal(d)} className="border-l border-border/30 relative hover:bg-surface-hover/30 cursor-pointer p-0.5">
                {slotEvents.map((ev: any) => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); openEventDrawer(ev) }}
                    className={`text-[10px] px-1 py-0.5 rounded truncate border ${EVENT_COLORS[ev.category] || EVENT_COLORS.Default}`}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Day View ───────────────────────────────────────────────────────────────
function DayView({ currentDate, filteredEvents, openAddModal, openEventDrawer }: any) {
  const dayEvents = filteredEvents.filter((ev: any) => isSameDay(new Date(ev.start), currentDate))

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-4 border-b border-border bg-surface-hover/30">
        <p className="text-lg font-bold">{format(currentDate, "EEEE, MMMM d, yyyy")}</p>
        <p className="text-sm text-muted-foreground">{dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}</p>
      </div>
      <div>
        {Array.from({ length: 24 }, (_, hour) => {
          const slotEvents = dayEvents.filter((ev: any) => new Date(ev.start).getHours() === hour)
          return (
            <div key={hour} onClick={() => openAddModal(currentDate)} className="flex border-b border-border/30 min-h-[52px] hover:bg-surface-hover/20 cursor-pointer">
              <div className="w-20 px-4 py-2 text-xs text-muted-foreground shrink-0">{format(new Date().setHours(hour, 0), "h:mm a")}</div>
              <div className="flex-1 p-1 border-l border-border/30 space-y-1">
                {slotEvents.map((ev: any) => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); openEventDrawer(ev) }}
                    className={`text-xs px-2 py-1 rounded border ${EVENT_COLORS[ev.category] || EVENT_COLORS.Default}`}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Agenda View ────────────────────────────────────────────────────────────
function AgendaView({ currentDate, filteredEvents, openEventDrawer }: any) {
  const upcoming = filteredEvents
    .filter((ev: any) => new Date(ev.start) >= startOfDay(currentDate))
    .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 30)

  if (upcoming.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">No upcoming events</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {upcoming.map((ev: any) => (
        <div
          key={ev.id}
          onClick={() => openEventDrawer(ev)}
          className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer hover:scale-[1.005] transition-transform ${EVENT_COLORS[ev.category] || EVENT_COLORS.Default}`}
        >
          <div className="text-center shrink-0 w-12">
            <p className="text-xs font-semibold">{format(new Date(ev.start), "MMM")}</p>
            <p className="text-2xl font-bold leading-tight">{format(new Date(ev.start), "d")}</p>
          </div>
          <div className="flex-1">
            <p className="font-semibold">{ev.title}</p>
            <p className="text-xs mt-0.5">{ev.allDay ? "All day" : format(new Date(ev.start), "h:mm a")}</p>
            {ev.location && (
              <p className="text-xs mt-0.5 opacity-70 flex items-center gap-1">
                <MapPin size={11} className="text-amber-500 shrink-0" />
                <span>{ev.location}</span>
              </p>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{ev.category}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main CalendarView ──────────────────────────────────────────────────────
export function CalendarView() {
  const { events, activeFilters, searchQuery, openAddModal, openEventDrawer } = useEventStore()
  const { currentDate, view } = useCalendarNav()

  const filteredEvents = React.useMemo(() =>
    events.filter(ev => {
      const matchCat = activeFilters.length === 0 || activeFilters.includes(ev.category)
      const matchSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCat && matchSearch
    }),
    [events, activeFilters, searchQuery]
  )

  return (
    <div className="h-full w-full bg-surface rounded-xl shadow-soft border border-border flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex-1 flex flex-col min-h-0"
        >
          {view === "month" && <MonthView currentDate={currentDate} filteredEvents={filteredEvents} openAddModal={openAddModal} openEventDrawer={openEventDrawer} />}
          {view === "week" && <WeekView currentDate={currentDate} filteredEvents={filteredEvents} openAddModal={openAddModal} openEventDrawer={openEventDrawer} />}
          {view === "day" && <DayView currentDate={currentDate} filteredEvents={filteredEvents} openAddModal={openAddModal} openEventDrawer={openEventDrawer} />}
          {view === "agenda" && <AgendaView currentDate={currentDate} filteredEvents={filteredEvents} openEventDrawer={openEventDrawer} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
