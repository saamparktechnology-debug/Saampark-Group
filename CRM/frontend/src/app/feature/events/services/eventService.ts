"use client"

import { CalendarEvent, EventLabel } from "../types"

const EVENTS_STORAGE_KEY = "saampark_stored_events"
const EVENT_LABELS_STORAGE_KEY = "saampark_stored_event_labels"

export function getStoredEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (err) {
    console.error("Error reading stored events:", err)
    return []
  }
}

export function saveStoredEvent(evt: CalendarEvent): CalendarEvent[] {
  if (typeof window === "undefined") return []
  try {
    const current = getStoredEvents()
    const updated = [evt, ...current.filter((e) => e.id !== evt.id)]
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error("Error saving event:", err)
    return []
  }
}

export function deleteStoredEvent(id: string): CalendarEvent[] {
  if (typeof window === "undefined") return []
  try {
    const current = getStoredEvents()
    const updated = current.filter((e) => e.id !== id)
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error("Error deleting event:", err)
    return []
  }
}

export function getStoredEventLabels(): EventLabel[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(EVENT_LABELS_STORAGE_KEY)
    if (!raw) {
      const defaultLabels: EventLabel[] = [
        { id: "lbl_1", name: "Call", color: "#ef4444" },
        { id: "lbl_2", name: "Email", color: "#3b82f6" },
        { id: "lbl_3", name: "Visit", color: "#22c55e" },
      ]
      localStorage.setItem(EVENT_LABELS_STORAGE_KEY, JSON.stringify(defaultLabels))
      return defaultLabels
    }
    return JSON.parse(raw)
  } catch (err) {
    console.error("Error reading event labels:", err)
    return []
  }
}

export function saveStoredEventLabel(label: EventLabel): EventLabel[] {
  if (typeof window === "undefined") return []
  try {
    const current = getStoredEventLabels()
    const updated = [...current, label]
    localStorage.setItem(EVENT_LABELS_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error("Error saving event label:", err)
    return []
  }
}

export function deleteStoredEventLabel(id: string): EventLabel[] {
  if (typeof window === "undefined") return []
  try {
    const current = getStoredEventLabels()
    const updated = current.filter((l) => l.id !== id)
    localStorage.setItem(EVENT_LABELS_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error("Error deleting event label:", err)
    return []
  }
}
