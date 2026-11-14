"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { CalendarEvent, EventLabel, EventTypeOption, CalendarViewMode } from "./types"
import { EventHeaderControls } from "./components/EventHeaderControls"
import { CalendarGrid } from "./components/CalendarGrid"
import { ManageLabelsModal } from "./components/ManageLabelsModal"
import { AddEventModal } from "./components/AddEventModal"
import { EventDetailsModal } from "./components/EventDetailsModal"
import { useAuthStore } from "@/store/useAuthStore"
import {
  getEvents,
  getMergedCalendarEvents,
  saveStoredEvent,
  deleteStoredEvent,
  getStoredEventLabels,
  saveStoredEventLabel,
  deleteStoredEventLabel,
} from "./services/eventService"

export default function EventsMain() {
  const { user, activeCompanyId } = useAuthStore()
  const targetComp = activeCompanyId || user?.companyId || "tech"

  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [labels, setLabels] = React.useState<EventLabel[]>([])

  const [selectedLabel, setSelectedLabel] = React.useState<string>("")
  const [selectedEventType, setSelectedEventType] = React.useState<EventTypeOption>("Events")
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>("month")

  // Modal Visibility States
  const [isManageLabelsOpen, setIsManageLabelsOpen] = React.useState(false)
  const [isAddEventOpen, setIsAddEventOpen] = React.useState(false)
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = React.useState<string>("2026-08-15")

  // Event Details Modal States
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false)
  const [selectedEventDetails, setSelectedEventDetails] = React.useState<CalendarEvent | null>(null)

  const loadData = React.useCallback(async () => {
    const evts = await getMergedCalendarEvents(targetComp, user ? { email: user.email, name: user.name, role: user.role } : undefined)
    setEvents(evts)
    const lbls = await getStoredEventLabels(targetComp)
    setLabels(lbls)
  }, [targetComp, user])

  React.useEffect(() => {
    loadData()
    window.addEventListener("storage", loadData)
    window.addEventListener("saampark_data_synced", loadData)
    window.addEventListener("saampark_company_switched", loadData)
    window.addEventListener("saampark_branch_switched", loadData)
    return () => {
      window.removeEventListener("storage", loadData)
      window.removeEventListener("saampark_data_synced", loadData)
      window.removeEventListener("saampark_company_switched", loadData)
      window.removeEventListener("saampark_branch_switched", loadData)
    }
  }, [loadData])

  // Strict Event Visibility & Isolation Filter:
  // 1. Super Admin: sees all events in targetComp
  // 2. Company Admin: sees all events in assigned company
  // 3. Client: sees own created events + Admin broadcast events targeted to "only_clients" or "all"
  // 4. Teams / Developer: sees own created events + Admin broadcast events targeted to "only_teams" or "all"
  const accessibleEvents = React.useMemo(() => {
    const isSuperAdmin = user?.role === "Super Admin"
    const isCompanyAdmin = user?.role === "Admin"
    if (isSuperAdmin || isCompanyAdmin) return events

    const currentUserEmail = (user?.email || "").toLowerCase().trim()
    const currentUserName = (user?.name || "").toLowerCase().trim()
    const role = (user?.role || "").toLowerCase().trim()
    const isClient = role === "clients" || role === "client"

    return events.filter((evt) => {
      const creatorEmail = (evt.creatorEmail || "").toLowerCase().trim()
      const creatorName = (evt.createdBy || (evt as any).created_by || "").toLowerCase().trim()

      // 1. Personal creator access (Always sees own created events)
      if (
        (currentUserEmail && creatorEmail === currentUserEmail) ||
        (currentUserEmail && creatorEmail.includes(currentUserEmail)) ||
        (currentUserName && creatorName === currentUserName)
      ) {
        return true
      }

      // 2. Broadcast events from Admin / Super Admin
      const aud = evt.audience
      if (aud === "all") return true
      if (isClient && aud === "only_clients") return true
      if (!isClient && aud === "only_teams") return true

      // If legacy event without audience and shareWith is set to All team members:
      if (!aud && evt.shareWith === "All team members" && !isClient) return true

      return false
    })
  }, [events, user])

  // Date Cell Click Handler -> Opens Add Event Modal with clicked date pre-filled
  const handleDateClick = (dateStr: string) => {
    setSelectedDateForNewEvent(dateStr)
    setIsAddEventOpen(true)
  }

  // Existing Event Click Handler -> Opens Event Details Modal
  const handleEventClick = (evt: CalendarEvent) => {
    setSelectedEventDetails(evt)
    setIsDetailsModalOpen(true)
  }

  const handleAddLabel = async (newLabel: EventLabel) => {
    const updated = await saveStoredEventLabel(newLabel, targetComp)
    setLabels(updated)
  }

  const handleDeleteLabel = async (id: string) => {
    const updated = await deleteStoredEventLabel(id, targetComp)
    setLabels(updated)
  }

  const handleSaveEvent = async (newEvent: Partial<CalendarEvent>) => {
    const updated = await saveStoredEvent(newEvent as CalendarEvent, targetComp)
    setEvents(updated)
  }

  const handleDeleteEvent = async (id: string) => {
    const updated = await deleteStoredEvent(id, targetComp)
    setEvents(updated)
  }

  const handleEditEvent = (evt: CalendarEvent) => {
    setSelectedDateForNewEvent(evt.startDate)
    setIsAddEventOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 max-w-[1600px] mx-auto p-2"
    >
      {/* Top Header & Dropdown Controls */}
      <EventHeaderControls
        selectedLabel={selectedLabel}
        onSelectLabel={setSelectedLabel}
        selectedEventType={selectedEventType}
        onSelectEventType={setSelectedEventType}
        labels={labels}
        onOpenManageLabels={() => setIsManageLabelsOpen(true)}
        onOpenAddEvent={() => {
          setSelectedDateForNewEvent("2026-08-15")
          setIsAddEventOpen(true)
        }}
      />

      {/* Main Calendar View Grid */}
      <CalendarGrid
        events={accessibleEvents}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        selectedLabel={selectedLabel}
        selectedEventType={selectedEventType}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />

      {/* Manage Labels Modal */}
      <ManageLabelsModal
        isOpen={isManageLabelsOpen}
        onClose={() => setIsManageLabelsOpen(false)}
        labels={labels}
        onAddLabel={handleAddLabel}
        onDeleteLabel={handleDeleteLabel}
      />

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        onSave={handleSaveEvent}
        initialDate={selectedDateForNewEvent}
        labels={labels}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        event={selectedEventDetails}
        onDelete={handleDeleteEvent}
        onEdit={handleEditEvent}
      />
    </motion.div>
  )
}
