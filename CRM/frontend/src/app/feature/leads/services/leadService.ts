import { Lead } from "../types"
import { api } from "@/lib/api"
import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { taskService } from "../../tasks/services/taskService"
import { saveStoredClient, getClients } from "../../clients/services/clientService"
import { recordUserAccount } from "../../users/services/userService"

export const initialLeads: Lead[] = []

export const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function parseLeadDate(dateStr?: string): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null
  const clean = dateStr.trim().toLowerCase()
  if (
    clean === "none" ||
    clean === "-" ||
    clean === "" ||
    clean.includes("no reminder") ||
    clean.startsWith("00")
  ) {
    return null
  }

  // 1. ISO or YYYY-MM-DD format (e.g. "2026-08-25")
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const [y, m, d] = clean.split("T")[0].split("-").map(Number)
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d, 0, 0, 0, 0)
    }
  }

  // 2. Delimited formats (e.g. "25,08,2026", "25-08-2026", "25/08/2026", "25.08.2026", "25 Aug 2026")
  const parts = clean.split(/[\s\-\/\,\.]+/)
  if (parts.length === 3) {
    // Check if middle part is month name (e.g. "25 Aug 2026")
    const monthIdx = MONTH_NAMES_SHORT.findIndex((m) => m.toLowerCase() === parts[1].toLowerCase())
    if (monthIdx !== -1) {
      const day = parseInt(parts[0], 10)
      const year = parseInt(parts[2], 10)
      if (!isNaN(day) && !isNaN(year)) {
        return new Date(year, monthIdx, day, 0, 0, 0, 0)
      }
    }

    // Check if all parts are numeric (e.g. "25,08,2026" or "2026,08,25")
    const p0 = parseInt(parts[0], 10)
    const p1 = parseInt(parts[1], 10)
    const p2 = parseInt(parts[2], 10)

    if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
      if (parts[2].length === 4) {
        // "DD-MM-YYYY" (e.g. 25,08,2026)
        return new Date(p2, p1 - 1, p0, 0, 0, 0, 0)
      } else if (parts[0].length === 4) {
        // "YYYY-MM-DD"
        return new Date(p0, p1 - 1, p2, 0, 0, 0, 0)
      }
    }
  }

  // 3. Fallback standard JavaScript Date parse
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0)
  }

  return null
}

export function formatLeadReminderDate(dateStr?: string): string {
  if (!dateStr) return "No Reminder"
  const parsed = parseLeadDate(dateStr)
  if (!parsed) return "No Reminder"
  const day = String(parsed.getDate()).padStart(2, "0")
  const month = MONTH_NAMES_SHORT[parsed.getMonth()]
  const year = parsed.getFullYear()
  return `${day} ${month} ${year}`
}

export function isReminderDateOverdue(dateStr?: string): boolean {
  const parsed = parseLeadDate(dateStr)
  if (!parsed) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // If reminder date is before today's 12:00 AM midnight, it is expired/overdue and must be locked
  return parsed.getTime() < today.getTime()
}

export async function syncLeadReminderTask(lead: Lead): Promise<void> {
  if (!lead || !lead.name) return
  const rDate = (lead.reminderDate || "").toString().toLowerCase().trim()
  if (!rDate || rDate === "none" || rDate === "00,00,0000" || rDate === "00-00-0000" || rDate === "00/00/0000") {
    return
  }

  const assignedTo = lead.caller || lead.owner || "Team"
  const taskId = `lead_task_${lead.id}`

  // If this task was ever explicitly deleted by the user, DO NOT recreate it!
  const { isGlobalItemDeleted } = await import("@/lib/storageSync")
  if (isGlobalItemDeleted(taskId) || isGlobalItemDeleted(`task_${lead.id}`)) {
    return
  }

  try {
    const existingTasks = await taskService.getTasks()
    const found = existingTasks.find((t) => t.id === taskId || t.id === `task_${lead.id}` || t.relatedTo === `Lead: ${lead.name}`)

    const taskTitle = `Follow-up Call: ${lead.name}`
    const deadlineVal = `${lead.reminderDate}${lead.reminderTime ? ` (${lead.reminderTime})` : ''}`
    const isDone = lead.status === "Won" || lead.status === "Lost"
    const desc = `Primary Contact: ${lead.primaryContact || lead.name}. Phone: ${lead.phone || 'N/A'}. Services: ${lead.service || 'N/A'}. Notes: ${lead.reminderNotes || 'Follow up call scheduled'}`

    if (found) {
      await taskService.updateTask(found.id, {
        title: taskTitle,
        assignedTo,
        deadline: deadlineVal,
        description: desc,
        status: isDone ? "Done" : (found.status || "To do"),
        priority: "High",
      })
    } else {
      // Check again to avoid recreating deleted tasks
      if (isGlobalItemDeleted(taskId)) return

      await taskService.addTask({
        id: taskId,
        title: taskTitle,
        startDate: lead.createdAt || new Date().toISOString().split("T")[0],
        deadline: deadlineVal,
        milestone: "Lead Follow-up",
        relatedTo: `Lead: ${lead.name}`,
        assignedTo,
        assignedToAvatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${assignedTo}`,
        collaborators: "-",
        status: isDone ? "Done" : "To do",
        priority: "High",
        priorityIcon: "up",
        labels: ["Follow-up"],
        points: "2 Points",
        description: desc,
      } as any)
    }
  } catch (err) {
    console.warn("Sync lead reminder task warning:", err)
  }
}

export const getLeads = async (companyId?: string): Promise<Lead[]> => {
  const dbData = await fetchModuleDataFromDB<Lead[]>("leads", [], companyId)
  const list = Array.isArray(dbData) ? filterGlobalDeletedItems(dbData) : []

  // Auto-lock leads if daily update or reminder date was missed (overdue)
  let hasChanges = false
  const processed = list.map((lead) => {
    if (
      !lead.isLocked &&
      lead.status !== "Won" &&
      lead.status !== "Lost" &&
      isReminderDateOverdue(lead.reminderDate)
    ) {
      hasChanges = true
      return {
        ...lead,
        isLocked: true,
        lockedReason: "Overdue: Lead status or reminder date was not updated daily by caller.",
      }
    }
    return lead
  })

  if (hasChanges) {
    saveModuleDataToDB("leads", processed, companyId)
  }

  return processed
}

export async function checkAndAutoConvertLeadToClient(lead: Lead, companyId?: string): Promise<void> {
  if (!lead || lead.status !== "Won") return

  try {
    const storedClients = await getClients()
    const emailNorm = (lead.email || `lead_${lead.id}@saampark.in`).toLowerCase().trim()
    const clientName = lead.name || "Won Client"

    const exists = storedClients.some(
      (c) => c.name.toLowerCase().trim() === clientName.toLowerCase().trim() || c.email?.toLowerCase().trim() === emailNorm
    )

    if (!exists) {
      const newClient = {
        id: `cli_${lead.id}`,
        name: clientName,
        primaryContact: lead.primaryContact || lead.name,
        email: emailNorm,
        phone: lead.phone || "N/A",
        group: "VIP",
        label: lead.service || "Potential",
        labelColor: "#3b82f6",
        projectsCount: 0,
        totalInvoiced: lead.value || "₹0",
        paymentReceived: "₹0",
        due: lead.value || "₹0",
        address: `${lead.city || ""}, ${lead.state || ""}, ${lead.country || ""}`.trim(),
      }

      saveStoredClient(newClient as any)

      // Register client account for login
      recordUserAccount({
        id: `usr_cli_${lead.id}`,
        name: lead.primaryContact || lead.name,
        email: emailNorm,
        role: "Clients",
        companyId: companyId || "tech",
        companyName: clientName,
        phone: lead.phone,
        password: "Password123",
        status: "Active",
      }, true)
    }
  } catch (err) {
    console.warn("Auto-convert lead to client error:", err)
  }
}

export const addLead = async (leadData: Omit<Lead, "id">, companyId?: string): Promise<Lead> => {
  const current = await fetchModuleDataFromDB<Lead[]>("leads", [], companyId)
  
  // Unique collision-free ID generation
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  const newId = `lead_${timestamp}_${randomSuffix}`
  
  const newLead: Lead = {
    ...leadData,
    id: newId,
    createdAt: leadData.createdAt || `${new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}`,
    service: leadData.service !== undefined ? leadData.service : "",
    source: leadData.source || "Social Media",
    reminderDate: leadData.reminderDate || "None",
    reminderNotes: leadData.reminderNotes || "",
    caller: leadData.caller || leadData.owner || "Team",
    isLocked: false,
  }
  const updated = [newLead, ...current.filter((l) => l.id !== newId)]
  await saveModuleDataToDB("leads", updated, companyId)
  syncLeadReminderTask(newLead)
  checkAndAutoConvertLeadToClient(newLead, companyId)
  return newLead
}

export const updateLead = async (id: string, updates: Partial<Lead>, userRole?: string, companyId?: string): Promise<Lead> => {
  const current = await fetchModuleDataFromDB<Lead[]>("leads", [], companyId)
  const idx = current.findIndex((l) => l.id === id)
  if (idx === -1) throw new Error("Lead not found")

  const target = current[idx]
  const isSuperOrAdmin = userRole === "Super Admin" || userRole === "Admin"

  // Prevent callers/teams from updating a locked lead unless being explicitly unlocked by Admin
  if (target.isLocked && !isSuperOrAdmin && updates.isLocked !== false) {
    throw new Error("This lead is locked due to missing daily updates. Only an Admin or Super Admin can unlock it.")
  }

  // If status or reminderDate is updated to future, clear auto-lock
  let nextIsLocked = updates.isLocked !== undefined ? updates.isLocked : target.isLocked
  let nextReason = updates.lockedReason !== undefined ? updates.lockedReason : target.lockedReason

  if (updates.reminderDate && !isReminderDateOverdue(updates.reminderDate)) {
    nextIsLocked = false
    nextReason = undefined
  }

  current[idx] = {
    ...target,
    ...updates,
    isLocked: nextIsLocked,
    lockedReason: nextReason,
  }

  await saveModuleDataToDB("leads", current, companyId)
  syncLeadReminderTask(current[idx])
  checkAndAutoConvertLeadToClient(current[idx], companyId)
  return { ...current[idx] }
}

export const deleteLead = async (id: string, companyId?: string): Promise<boolean> => {
  await markGlobalItemDeleted(id, "leads")
  const current = await fetchModuleDataFromDB<Lead[]>("leads", [], companyId)
  const filtered = current.filter((l) => l.id !== id)
  await saveModuleDataToDB("leads", filtered, companyId)
  return true
}

export const unlockLead = async (id: string, companyId?: string): Promise<Lead> => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const formattedTomorrow = tomorrow.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })

  return updateLead(
    id,
    {
      isLocked: false,
      lockedReason: undefined,
      reminderDate: formattedTomorrow,
    },
    "Super Admin",
    companyId
  )
}

export const lockLead = async (id: string, reason?: string, companyId?: string): Promise<Lead> => {
  return updateLead(id, { isLocked: true, lockedReason: reason || "Manually locked by Admin" }, "Super Admin", companyId)
}
