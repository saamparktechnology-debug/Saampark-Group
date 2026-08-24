"use client"

import { CalendarEvent, EventLabel } from "../types"
import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"

// ── Default event labels seeded into DB on first load ───────────────────────
const DEFAULT_EVENT_LABELS: EventLabel[] = [
  { id: "lbl_1", name: "Call", color: "#ef4444" },
  { id: "lbl_2", name: "Email", color: "#3b82f6" },
  { id: "lbl_3", name: "Visit", color: "#22c55e" },
]

// ── Events ───────────────────────────────────────────────────────────────────

/** Fetch all events for a company from MySQL */
export async function getEvents(companyId?: string): Promise<CalendarEvent[]> {
  const data = await fetchModuleDataFromDB<CalendarEvent[]>("events", [], companyId)
  return filterGlobalDeletedItems(Array.isArray(data) ? data : [])
}

/** Alias for backward compatibility (async) */
export async function getStoredEventsAsync(companyId?: string): Promise<CalendarEvent[]> {
  return getEvents(companyId)
}

/** Save (add or update) a single event to MySQL */
export async function saveStoredEvent(evt: CalendarEvent, companyId?: string): Promise<CalendarEvent[]> {
  const current = await getEvents(companyId)
  const updated = [evt, ...current.filter((e) => e.id !== evt.id)]
  await saveModuleDataToDB("events", updated, companyId)
  return updated
}

/** Delete an event from MySQL */
export async function deleteStoredEvent(id: string, companyId?: string): Promise<CalendarEvent[]> {
  await markGlobalItemDeleted(id, "events")
  const current = await getEvents(companyId)
  const updated = current.filter((e) => e.id !== id)
  await saveModuleDataToDB("events", updated, companyId)
  return updated
}

// ── Event Labels ─────────────────────────────────────────────────────────────

/** Fetch event labels from MySQL, seeding defaults if none exist */
export async function getStoredEventLabels(companyId?: string): Promise<EventLabel[]> {
  const data = await fetchModuleDataFromDB<EventLabel[]>("event_labels", DEFAULT_EVENT_LABELS, companyId)
  if (!Array.isArray(data) || data.length === 0) {
    await saveModuleDataToDB("event_labels", DEFAULT_EVENT_LABELS, companyId)
    return DEFAULT_EVENT_LABELS
  }
  return data
}

/** Add a new event label to MySQL */
export async function saveStoredEventLabel(label: EventLabel, companyId?: string): Promise<EventLabel[]> {
  const current = await getStoredEventLabels(companyId)
  const updated = [...current.filter((l) => l.id !== label.id), label]
  await saveModuleDataToDB("event_labels", updated, companyId)
  return updated
}

/** Delete an event label from MySQL */
export async function deleteStoredEventLabel(id: string, companyId?: string): Promise<EventLabel[]> {
  const current = await getStoredEventLabels(companyId)
  const updated = current.filter((l) => l.id !== id)
  await saveModuleDataToDB("event_labels", updated, companyId)
  return updated
}

/** @deprecated Use getEvents() instead */
export function getStoredEvents(): CalendarEvent[] {
  console.warn("[eventService] getStoredEvents() is deprecated — use getEvents() (async).")
  return []
}


