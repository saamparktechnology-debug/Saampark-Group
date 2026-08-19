"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { CalendarEvent, EventLabel, EventTypeOption, CalendarViewMode } from "./types"
import { EventHeaderControls } from "./components/EventHeaderControls"
import { CalendarGrid } from "./components/CalendarGrid"
import { ManageLabelsModal } from "./components/ManageLabelsModal"
import { AddEventModal } from "./components/AddEventModal"
import { EventDetailsModal } from "./components/EventDetailsModal"
import {
  getStoredEvents,
  saveStoredEvent,
  deleteStoredEvent,
  getStoredEventLabels,
  saveStoredEventLabel,
  deleteStoredEventLabel,
} from "./services/eventService"

export default function EventsMain() {
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

  // Load stored persistent events on mount
  React.useEffect(() => {
    setEvents(getStoredEvents())
    setLabels(getStoredEventLabels())
  }, [])

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

  const handleAddLabel = (newLabel: EventLabel) => {
    const updated = saveStoredEventLabel(newLabel)
    setLabels(updated)
  }

  const handleDeleteLabel = (id: string) => {
    const updated = deleteStoredEventLabel(id)
    setLabels(updated)
  }

  const handleSaveEvent = (newEvent: Partial<CalendarEvent>) => {
    const updated = saveStoredEvent(newEvent as CalendarEvent)
    setEvents(updated)
  }

  const handleDeleteEvent = (id: string) => {
    const updated = deleteStoredEvent(id)
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
        events={events}
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
