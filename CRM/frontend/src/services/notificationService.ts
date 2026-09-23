"use client"

import { fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"
import { sendGenericReminderEmail } from "./emailNotificationService"

export type NotificationType = "lead" | "project" | "task" | "invoice" | "payment" | "system"

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  linkUrl?: string
  targetEmail?: string
  targetRole?: string
  targetUserId?: string
  createdAt: number
  timestampFormatted: string
  read: boolean
}

export async function createNotification(params: {
  title: string
  message: string
  type: NotificationType
  linkUrl?: string
  targetEmail?: string
  targetRole?: string
  targetUserId?: string
  sendEmailNotification?: boolean
}): Promise<AppNotification> {
  const now = new Date()
  const timestampFormatted = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) + ", " + now.toLocaleDateString("en-GB")

  const newNotif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: params.title,
    message: params.message,
    type: params.type,
    linkUrl: params.linkUrl,
    targetEmail: params.targetEmail ? params.targetEmail.toLowerCase().trim() : undefined,
    targetRole: params.targetRole,
    targetUserId: params.targetUserId,
    createdAt: Date.now(),
    timestampFormatted,
    read: false,
  }

  // 1. Save to database / sync storage
  try {
    const all = await fetchModuleDataFromDB<AppNotification[]>("app_notifications", [], "all").catch(() => [])
    const updated = [newNotif, ...(Array.isArray(all) ? all.slice(0, 100) : [])]
    await saveModuleDataToDB("app_notifications", updated, "all")
  } catch (err) {
    console.warn("Error saving notification to DB:", err)
  }

  // 2. Also save to user specific key in localStorage for immediate offline/local access
  if (typeof window !== "undefined") {
    if (params.targetEmail) {
      const userKey = `saampark_notifications_${params.targetEmail.toLowerCase().trim()}`
      try {
        const stored = JSON.parse(localStorage.getItem(userKey) || "[]")
        const next = [newNotif, ...(Array.isArray(stored) ? stored.slice(0, 50) : [])]
        localStorage.setItem(userKey, JSON.stringify(next))
      } catch {}
    }

    // Broadcast globally to update Topbar bell in real time
    window.dispatchEvent(new Event("saampark_notifications_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  // 3. Optional: Dispatch Email notification if requested and target email provided
  if (params.sendEmailNotification !== false && params.targetEmail && !params.targetEmail.includes("@crm.saampark") && !params.targetEmail.includes("lead_")) {
    try {
      sendGenericReminderEmail(
        params.targetEmail,
        `[SAAMPARK Alert] ${params.title}`,
        `<div style="font-family: sans-serif; padding: 20px;"><h2>${params.title}</h2><p>${params.message}</p></div>`,
        params.title.split(":")[0] || "Team Member"
      ).catch(() => null)
    } catch {}
  }

  return newNotif
}

export async function getUserNotifications(userEmail?: string, userRole?: string): Promise<AppNotification[]> {
  const emailNorm = (userEmail || "").toLowerCase().trim()
  const roleNorm = (userRole || "").toLowerCase().trim()

  const all = await fetchModuleDataFromDB<AppNotification[]>("app_notifications", [], "all").catch(() => [])
  if (!Array.isArray(all)) return []

  return all.filter(n => {
    // If targeted to specific email
    if (n.targetEmail && emailNorm) {
      if (n.targetEmail === emailNorm) return true
    }
    // If targeted to role
    if (n.targetRole && roleNorm) {
      if (n.targetRole.toLowerCase().trim() === roleNorm) return true
    }
    // Global notification (no specific email or role)
    if (!n.targetEmail && !n.targetRole) return true
    return false
  })
}

export async function markNotificationAsRead(id: string, userEmail?: string): Promise<void> {
  const all = await fetchModuleDataFromDB<AppNotification[]>("app_notifications", [], "all").catch(() => [])
  if (!Array.isArray(all)) return

  const updated = all.map(n => n.id === id ? { ...n, read: true } : n)
  await saveModuleDataToDB("app_notifications", updated, "all")

  if (typeof window !== "undefined") {
    if (userEmail) {
      const userKey = `saampark_notifications_${userEmail.toLowerCase().trim()}`
      try {
        const stored = JSON.parse(localStorage.getItem(userKey) || "[]")
        const next = stored.map((n: any) => n.id === id ? { ...n, read: true } : n)
        localStorage.setItem(userKey, JSON.stringify(next))
      } catch {}
    }
    window.dispatchEvent(new Event("saampark_notifications_updated"))
    window.dispatchEvent(new Event("storage"))
  }
}

export async function markAllNotificationsAsRead(userEmail?: string): Promise<void> {
  const emailNorm = (userEmail || "").toLowerCase().trim()
  const all = await fetchModuleDataFromDB<AppNotification[]>("app_notifications", [], "all").catch(() => [])
  if (!Array.isArray(all)) return

  const updated = all.map(n => {
    if (!emailNorm || !n.targetEmail || n.targetEmail === emailNorm) {
      return { ...n, read: true }
    }
    return n
  })
  await saveModuleDataToDB("app_notifications", updated, "all")

  if (typeof window !== "undefined") {
    if (userEmail) {
      const userKey = `saampark_notifications_${emailNorm}`
      try {
        const stored = JSON.parse(localStorage.getItem(userKey) || "[]")
        const next = stored.map((n: any) => ({ ...n, read: true }))
        localStorage.setItem(userKey, JSON.stringify(next))
      } catch {}
    }
    window.dispatchEvent(new Event("saampark_notifications_updated"))
    window.dispatchEvent(new Event("storage"))
  }
}
