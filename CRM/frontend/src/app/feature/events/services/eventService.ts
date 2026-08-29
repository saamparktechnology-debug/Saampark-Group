"use client"

import { CalendarEvent, EventLabel } from "../types"
import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { getLeads } from "@/app/feature/leads/services/leadService"
import { taskService } from "@/app/feature/tasks/services/taskService"
import { getInvoices } from "@/app/feature/sales/invoices/services/invoiceService"

// ── Default event labels seeded into DB on first load ───────────────────────
const DEFAULT_EVENT_LABELS: EventLabel[] = [
  { id: "lbl_1", name: "Call", color: "#ef4444" },
  { id: "lbl_2", name: "Email", color: "#3b82f6" },
  { id: "lbl_3", name: "Visit", color: "#22c55e" },
  { id: "lbl_4", name: "Urgent Reminder", color: "#ef4444" },
  { id: "lbl_5", name: "Recent Reminder", color: "#3b82f6" },
  { id: "lbl_6", name: "Far Reminder", color: "#10b981" },
]

/**
 * Compute urgency color and tag based on date proximity:
 * - Red (Urgent): <= 1 day (today, tomorrow, overdue) -> #ef4444
 * - Blue (Recent): 2 to 7 days (this week) -> #3b82f6
 * - Green (Far more): > 7 days (scheduled) -> #10b981
 */
export function getReminderUrgency(targetDateStr: string): { color: string; label: string; urgency: "urgent" | "recent" | "far" } {
  if (!targetDateStr) {
    return { color: "#10b981", label: "🟢 Far", urgency: "far" }
  }

  try {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(targetDateStr)
    target.setHours(0, 0, 0, 0)

    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 1) {
      return { color: "#ef4444", label: "🔴 Urgent", urgency: "urgent" }
    }
    if (diffDays <= 7) {
      return { color: "#3b82f6", label: "🔵 Recent", urgency: "recent" }
    }
    return { color: "#10b981", label: "🟢 Far", urgency: "far" }
  } catch {
    return { color: "#10b981", label: "🟢 Far", urgency: "far" }
  }
}

// ── Events ───────────────────────────────────────────────────────────────────

/** Fetch all events for a company from MySQL */
export async function getEvents(companyId?: string): Promise<CalendarEvent[]> {
  const data = await fetchModuleDataFromDB<CalendarEvent[]>("events", [], companyId)
  return filterGlobalDeletedItems(Array.isArray(data) ? data : [])
}

/**
 * Fetch all manual events AND automatically synthesized user-specific reminder events:
 * - Lead reminders (color-coded red/blue/green by proximity)
 * - Task deadlines
 * - Invoice payment due dates
 */
export async function getMergedCalendarEvents(
  companyId?: string,
  currentUser?: { email?: string; name?: string; role?: string }
): Promise<CalendarEvent[]> {
  const targetComp = companyId || "tech"
  const userEmail = (currentUser?.email || "").toLowerCase().trim()
  const userName = (currentUser?.name || "").toLowerCase().trim()
  const userRole = (currentUser?.role || "Teams").toLowerCase().trim()
  const isSuperOrAdmin = userRole.includes("admin") || userRole.includes("super")
  const isClient = userRole.includes("client")

  const [rawEvents, leads, tasks, invoices] = await Promise.all([
    getEvents(targetComp).catch(() => []),
    getLeads(targetComp).catch(() => []),
    taskService.getTasks(targetComp).catch(() => []),
    getInvoices(targetComp).catch(() => []),
  ])

  const autoEvents: CalendarEvent[] = []

  // 1. Synthesize Lead Reminders
  leads.forEach((lead) => {
    if (!lead) return
    const rawDate = lead.reminderDate || (lead as any).nextFollowUp || (lead as any).reminder_date
    if (!rawDate) return

    // User-specific filter for team members & clients
    if (!isSuperOrAdmin) {
      const assigned = String(lead.assignedTo || lead.owner || (lead as any).assigned_to || "").toLowerCase().trim()
      const creator = String(lead.createdBy || (lead as any).creatorEmail || "").toLowerCase().trim()
      const clientName = String((lead as any).client || lead.name || "").toLowerCase().trim()

      if (isClient) {
        if (clientName !== userName && !clientName.includes(userName)) return
      } else {
        // Teams role: check assignment or creation
        if (assigned !== userName && assigned !== userEmail && !assigned.includes(userName) && creator !== userEmail) {
          return
        }
      }
    }

    const { color, label } = getReminderUrgency(rawDate)
    const formattedDate = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate

    autoEvents.push({
      id: `auto_lead_${lead.id}`,
      title: `🎯 Lead Reminder: ${lead.name || (lead as any).title || "Client Lead"}`,
      description: `Lead Stage: ${lead.status || "New"} | Phone: ${lead.phone || "-"} | Assigned: ${lead.assignedTo || "Unassigned"}`,
      startDate: formattedDate,
      startTime: (lead as any).reminderTime || "10:00",
      endDate: formattedDate,
      endTime: "10:30",
      color,
      label,
      labelColor: color,
      eventType: "Events",
      client: (lead as any).client || lead.name,
      companyId: lead.companyId || targetComp,
      isLocked: true,
      audience: "all",
    })
  })

  // 2. Synthesize Task Deadlines
  tasks.forEach((task) => {
    if (!task) return
    const rawDate = (task as any).dueDate || (task as any).deadline || (task as any).due_date
    if (!rawDate) return

    // User-specific filter
    if (!isSuperOrAdmin) {
      const assigned = String(task.assignedTo || (task as any).assignedToEmail || "").toLowerCase().trim()
      const clientName = String((task as any).client || (task as any).clientName || "").toLowerCase().trim()
      if (isClient) {
        if (clientName !== userName && !clientName.includes(userName)) return
      } else {
        if (assigned !== userName && assigned !== userEmail && !assigned.includes(userName) && !assigned.includes(userEmail)) {
          return
        }
      }
    }

    const { color, label } = getReminderUrgency(rawDate)
    const formattedDate = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate

    autoEvents.push({
      id: `auto_task_${task.id}`,
      title: `📋 Task Due: ${task.title}`,
      description: `Task Status: ${task.status} | Priority: ${task.priority || "Normal"} | Assignee: ${task.assignedTo || "Team"}`,
      startDate: formattedDate,
      startTime: "18:00",
      endDate: formattedDate,
      endTime: "18:30",
      color,
      label,
      labelColor: color,
      eventType: "Task deadline",
      client: (task as any).client,
      companyId: targetComp,
      isLocked: true,
      audience: "all",
    })
  })

  // 3. Synthesize Invoice Payment Due Dates
  invoices.forEach((inv) => {
    if (!inv || !inv.dueDate) return
    const isPaid = String(inv.status).toLowerCase() === "paid" || String((inv as any).paymentStatus).toLowerCase() === "paid"
    if (isPaid) return

    if (!isSuperOrAdmin && isClient) {
      const clientName = String(inv.client || "").toLowerCase().trim()
      if (clientName !== userName && !clientName.includes(userName)) return
    }

    const { color, label } = getReminderUrgency(inv.dueDate)
    const formattedDate = inv.dueDate.includes("T") ? inv.dueDate.split("T")[0] : inv.dueDate

    autoEvents.push({
      id: `auto_inv_${inv.id}`,
      title: `💰 Invoice Due: ${inv.id} (${inv.client})`,
      description: `Invoice Amount: ₹${inv.totalInvoiced || inv.baseAmount || 0} | Client: ${inv.client}`,
      startDate: formattedDate,
      startTime: "17:00",
      endDate: formattedDate,
      endTime: "17:30",
      color,
      label,
      labelColor: color,
      eventType: "Project deadline",
      client: inv.client,
      companyId: inv.companyId || targetComp,
      isLocked: true,
      audience: "all",
    })
  })

  // Merge manual calendar events and automatic reminder events
  const mergedMap = new Map<string, CalendarEvent>()
  for (const e of rawEvents) {
    if (e && e.id) mergedMap.set(String(e.id), e)
  }
  for (const e of autoEvents) {
    if (e && e.id) mergedMap.set(String(e.id), e)
  }

  return Array.from(mergedMap.values())
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
