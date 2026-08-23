import { Lead } from "../types"
import { api } from "@/lib/api"
import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { taskService } from "../../tasks/services/taskService"
import { saveStoredClient, getStoredClients } from "../../clients/services/clientService"
import { recordUserAccount } from "../../users/services/userService"

export const initialLeads: Lead[] = []

export function isReminderDateOverdue(dateStr?: string): boolean {
  if (!dateStr || dateStr === "None" || dateStr === "-" || dateStr.toLowerCase().includes("no reminder") || dateStr === "00,00,0000" || dateStr === "00-00-0000" || dateStr === "00/00/0000") {
    return false
  }
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const parsed = new Date(dateStr)
    if (isNaN(parsed.getTime())) return false
    parsed.setHours(0, 0, 0, 0)
    return parsed.getTime() < today.getTime()
  } catch {
    return false
  }
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

export const getLeads = async (): Promise<Lead[]> => {
  const dbData = await fetchModuleDataFromDB<Lead[]>("leads", [])
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
    saveModuleDataToDB("leads", processed)
  }

  return processed
}

export async function checkAndAutoConvertLeadToClient(lead: Lead): Promise<void> {
  if (!lead || lead.status !== "Won") return

  try {
    const storedClients = getStoredClients()
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
        companyId: "tech",
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

export const addLead = async (leadData: Omit<Lead, "id">): Promise<Lead> => {
  const current = await fetchModuleDataFromDB<Lead[]>("leads", [])
  
  // Unique collision-free ID generation
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  const newId = `lead_${timestamp}_${randomSuffix}`
  
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultFutureReminderDate = tomorrow.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })

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
  await saveModuleDataToDB("leads", updated)
  syncLeadReminderTask(newLead)
  checkAndAutoConvertLeadToClient(newLead)
  return newLead
}

export const updateLead = async (id: string, updates: Partial<Lead>, userRole?: string): Promise<Lead> => {
  const current = await fetchModuleDataFromDB<Lead[]>("leads", [])
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

  await saveModuleDataToDB("leads", current)
  syncLeadReminderTask(current[idx])
  checkAndAutoConvertLeadToClient(current[idx])
  return { ...current[idx] }
}

export const deleteLead = async (id: string): Promise<boolean> => {
  await markGlobalItemDeleted(id, "leads")
  const current = await fetchModuleDataFromDB<Lead[]>("leads", [])
  const filtered = current.filter((l) => l.id !== id)
  await saveModuleDataToDB("leads", filtered)
  return true
}

export const unlockLead = async (id: string): Promise<Lead> => {
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
    "Super Admin"
  )
}

export const lockLead = async (id: string, reason?: string): Promise<Lead> => {
  return updateLead(id, { isLocked: true, lockedReason: reason || "Manually locked by Admin" }, "Super Admin")
}
