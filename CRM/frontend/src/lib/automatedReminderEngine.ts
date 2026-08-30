"use client"

import { sendBrowserNotification } from "./notificationService"
import { getSubscriptions } from "@/app/feature/subscriptions/services/subscriptionService"
import { taskService } from "@/app/feature/tasks/services/taskService"
import { fetchModuleDataFromDB } from "./storageSync"

const REMINDER_LOGS_KEY = "saampark_automated_reminder_logs"

export interface AutomatedReminderLog {
  id: string
  module: string
  recordId: string
  title: string
  dueDate: string
  stage: "-3_days" | "day_0" | "+3_days"
  sentAt: string
}

export const getAutomatedReminderLogs = (): Record<string, boolean> => {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(REMINDER_LOGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const markReminderSent = (key: string) => {
  if (typeof window === "undefined") return
  try {
    const logs = getAutomatedReminderLogs()
    logs[key] = true
    localStorage.setItem(REMINDER_LOGS_KEY, JSON.stringify(logs))
  } catch {}
}

const parseDateToMidnight = (dateStr: string): Date | null => {
  if (!dateStr) return null
  try {
    // Check DD/MM/YYYY or YYYY-MM-DD
    let d: Date
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/")
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        } else {
          d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
        }
      } else {
        d = new Date(dateStr)
      }
    } else {
      d = new Date(dateStr)
    }

    if (isNaN(d.getTime())) return null
    d.setHours(0, 0, 0, 0)
    return d
  } catch {
    return null
  }
}

/**
 * Universal 3-Tier Automated Reminder Runner:
 * Evaluates records across Subscriptions, Invoices, EMI, Tasks, Events & Payroll
 * and sends alerts at:
 *  - 3 Days Before Due (diffDays === 3)
 *  - On Due Day (diffDays === 0)
 *  - 3 Days Overdue (diffDays === -3)
 */
export async function runAutomated3TierReminders(): Promise<{ count: number; triggered: string[] }> {
  if (typeof window === "undefined") return { count: 0, triggered: [] }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split("T")[0]

  const sentLogs = getAutomatedReminderLogs()
  const triggered: string[] = []

  try {
    // 1. Fetch data across modules
    const [subs, invoices, emiList, tasks, events] = await Promise.all([
      getSubscriptions("all").catch(() => []),
      fetchModuleDataFromDB<any[]>("invoices", [], "all").catch(() => []),
      fetchModuleDataFromDB<any[]>("emi_contracts", [], "all").catch(() => []),
      taskService.getTasks().catch(() => []),
      fetchModuleDataFromDB<any[]>("events", [], "all").catch(() => []),
    ])

    const checkAndDispatch = (
      moduleName: string,
      recordId: string,
      title: string,
      clientOrAssignee: string,
      dueDateStr: string,
      targetUrl?: string
    ) => {
      const targetDate = parseDateToMidnight(dueDateStr)
      if (!targetDate) return

      const diffTime = targetDate.getTime() - today.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      let stage: "-3_days" | "day_0" | "+3_days" | null = null
      let headerPrefix = ""
      let bodyText = ""

      if (diffDays === 3) {
        stage = "-3_days"
        headerPrefix = "⏰ Reminder: 3 Days Until Due"
        bodyText = `${moduleName}: "${title}" for ${clientOrAssignee} is due in 3 days (${dueDateStr}).`
      } else if (diffDays === 0) {
        stage = "day_0"
        headerPrefix = "🚨 Due Today"
        bodyText = `${moduleName}: "${title}" for ${clientOrAssignee} is due today (${dueDateStr})!`
      } else if (diffDays === -3) {
        stage = "+3_days"
        headerPrefix = "⚠️ Overdue Notice (+3 Days Past Due)"
        bodyText = `${moduleName}: "${title}" for ${clientOrAssignee} is now 3 days overdue (was due on ${dueDateStr}).`
      }

      if (stage) {
        const logKey = `${moduleName}_${recordId}_${stage}_${todayStr}`
        if (!sentLogs[logKey]) {
          sendBrowserNotification(headerPrefix, {
            body: bodyText,
            url: targetUrl || "/feature/dashboard",
          })

          markReminderSent(logKey)
          triggered.push(bodyText)

          // Dispatch in-app event
          window.dispatchEvent(new CustomEvent("saampark_automated_reminder_triggered", {
            detail: { module: moduleName, title, clientOrAssignee, stage, dueDate: dueDateStr }
          }))
        }
      }
    }

    // ── A. Subscriptions (nextBillingDate) ──
    for (const sub of subs || []) {
      if (sub && sub.nextBillingDate && sub.status === "Active") {
        checkAndDispatch(
          "Subscription",
          String(sub.id),
          sub.planName,
          sub.clientName,
          sub.nextBillingDate,
          "/feature/subscriptions"
        )
      }
    }

    // ── B. Invoices (dueDate) ──
    for (const inv of invoices || []) {
      if (inv && inv.dueDate && inv.status !== "Paid" && inv.status !== "Cancelled") {
        checkAndDispatch(
          "Invoice",
          String(inv.id),
          inv.invoiceNumber || inv.id,
          inv.clientName,
          inv.dueDate,
          "/feature/sales/invoices"
        )
      }
    }

    // ── C. EMI Contracts (nextDueDate) ──
    for (const emi of emiList || []) {
      if (emi && emi.nextDueDate && emi.status === "Active") {
        checkAndDispatch(
          "EMI Contract",
          String(emi.id),
          emi.productName || emi.planName || "EMI Plan",
          emi.clientName,
          emi.nextDueDate,
          "/feature/emi"
        )
      }
    }

    // ── D. Tasks (deadline) ──
    for (const t of tasks || []) {
      if (t && t.deadline && t.status !== "Done") {
        checkAndDispatch(
          "Task Deadline",
          String(t.id),
          t.title,
          t.assignedTo || "Assignee",
          t.deadline,
          "/feature/tasks"
        )
      }
    }

    // ── E. Events (startDate / date) ──
    for (const ev of events || []) {
      const evDate = ev.startDate || ev.date
      if (ev && evDate) {
        checkAndDispatch(
          "Calendar Event",
          String(ev.id),
          ev.title,
          ev.location || "Scheduled",
          evDate,
          "/feature/events"
        )
      }
    }

  } catch (err) {
    console.error("Error executing automated 3-tier reminder engine:", err)
  }

  return {
    count: triggered.length,
    triggered,
  }
}
