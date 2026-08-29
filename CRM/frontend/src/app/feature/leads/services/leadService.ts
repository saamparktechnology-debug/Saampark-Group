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
  let clean = dateStr.trim().toLowerCase()
  if (
    clean === "none" ||
    clean === "-" ||
    clean === "" ||
    clean.includes("no reminder") ||
    clean.startsWith("00")
  ) {
    return null
  }

  // Strip anything in parentheses like "(04:00 pm)" or time suffix
  clean = clean.replace(/\(.*\)/g, "").trim()

  // 1. ISO format (e.g. "2026-08-28")
  const isoMatch = clean.match(/^(\d{4})[-\/\.,](\d{1,2})[-\/\.,](\d{1,2})/)
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10)
    const m = parseInt(isoMatch[2], 10)
    const d = parseInt(isoMatch[3], 10)
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d, 0, 0, 0, 0)
    }
  }

  // 2. Text month format (e.g. "28 Aug 2026", "28 August 2026")
  for (let i = 0; i < MONTH_NAMES_SHORT.length; i++) {
    const mName = MONTH_NAMES_SHORT[i].toLowerCase()
    if (clean.includes(mName)) {
      const nums = clean.replace(/[^\d\s]/g, " ").split(/\s+/).filter(Boolean).map(Number)
      if (nums.length >= 2) {
        let day = nums[0]
        let year = nums[1]
        if (year < 100) year += 2000
        if (day > 1000) {
          const temp = day
          day = year
          year = temp
        }
        return new Date(year, i, day, 0, 0, 0, 0)
      }
    }
  }

  // 3. Delimited formats (e.g. "28-08-2026", "28/08/2026", "28,08,2026")
  const parts = clean.split(/[\s\-\/\,\.]+/)
  if (parts.length >= 3) {
    const p0 = parseInt(parts[0], 10)
    const p1 = parseInt(parts[1], 10)
    const p2 = parseInt(parts[2], 10)

    if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
      if (parts[2].length === 4 || p2 > 1000) {
        // "DD-MM-YYYY"
        return new Date(p2, p1 - 1, p0, 0, 0, 0, 0)
      } else if (parts[0].length === 4 || p0 > 1000) {
        // "YYYY-MM-DD"
        return new Date(p0, p1 - 1, p2, 0, 0, 0, 0)
      }
    }
  }

  // 4. Fallback standard JavaScript Date parse
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
  const now = new Date()
  
  // Set parsed to the very end of that reminder date (23:59:59.999)
  // The lead remains active during the reminder day and locks once the date ends (at midnight)
  parsed.setHours(23, 59, 59, 999)
  return now.getTime() > parsed.getTime()
}

export async function syncLeadReminderTask(lead: Lead): Promise<void> {
  if (!lead || !lead.name) return
  const rDate = (lead.reminderDate || "").toString().toLowerCase().trim()
  const hasReminder = Boolean(rDate && rDate !== "none" && rDate !== "00,00,0000" && rDate !== "00-00-0000" && rDate !== "00/00/0000")

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

    const taskTitle = lead.name
    const deadlineVal = hasReminder
      ? `${lead.reminderDate}${lead.reminderTime && lead.reminderTime !== "None" ? ` (${lead.reminderTime})` : ''}`
      : "None"
    const isDone = lead.status === "Won" || lead.status === "Lost"
    const desc = `Primary Contact: ${lead.primaryContact || lead.name}. Phone: ${lead.phone || 'N/A'}. Services: ${lead.service || 'N/A'}. Notes: ${lead.reminderNotes || 'Follow up call scheduled'}`
    
    // Dynamic milestone based on lead stage
    const currentLeadStage = lead.status === "They come to our office" ? "Our Office Visit" : (lead.status || "New")

    if (found) {
      await taskService.updateTask(found.id, {
        title: taskTitle,
        assignedTo,
        deadline: deadlineVal,
        milestone: currentLeadStage,
        description: desc,
        status: isDone ? "Done" : (found.status || "To do"),
        priority: "High",
        labels: ["Follow-up"],
      })
    } else if (hasReminder) {
      if (isGlobalItemDeleted(taskId)) return

      await taskService.addTask({
        id: taskId,
        title: taskTitle,
        startDate: lead.createdAt || new Date().toISOString().split("T")[0],
        deadline: deadlineVal,
        milestone: currentLeadStage,
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
        branchId: lead.branchId,
        branchName: lead.branchName,
        companyId: lead.companyId || "tech",
      } as any)
    }
  } catch (err) {
    console.warn("Sync lead reminder task warning:", err)
  }
}

export const getLeads = async (companyId?: string): Promise<Lead[]> => {
  const [dbData, techData] = await Promise.all([
    fetchModuleDataFromDB<Lead[]>("leads", [], companyId || "all").catch(() => []),
    fetchModuleDataFromDB<Lead[]>("leads", [], "tech").catch(() => [])
  ])
  const map = new Map<string, Lead>()
  for (const l of (Array.isArray(dbData) ? dbData : [])) {
    if (l && l.id) map.set(String(l.id).toLowerCase().trim(), l)
  }
  for (const l of (Array.isArray(techData) ? techData : [])) {
    if (l && l.id) map.set(String(l.id).toLowerCase().trim(), l)
  }
  const list = Array.from(map.values())

  // Auto-lock leads if reminder date is overdue (locks at the end of the reminder date)
  // Leads in "Won" or "Lost" stages are NEVER locked
  let hasChanges = false
  const processed = list.map((lead) => {
    const statusLower = (lead.status || "").toLowerCase().trim()
    const isWonOrLost = statusLower === "won" || statusLower === "lost"

    // 1. Won leads are LOCKED by default (finalized deal, converted to client)
    if (statusLower === "won") {
      if (lead.isLocked !== true && !lead.lockedReason?.includes("Unlocked")) {
        hasChanges = true
        return {
          ...lead,
          isLocked: true,
          lockedReason: "Won: Lead is finalized and converted to Client.",
        }
      }
      return lead
    }

    if (statusLower === "lost") {
      if (lead.isLocked) {
        hasChanges = true
        return {
          ...lead,
          isLocked: false,
          lockedReason: undefined,
        }
      }
      return lead
    }

    // 2. Active leads: check if reminder date is overdue (passed end of date 23:59:59)
    const overdue = isReminderDateOverdue(lead.reminderDate)
    if (overdue && !lead.isLocked) {
      hasChanges = true
      return {
        ...lead,
        isLocked: true,
        lockedReason: "Overdue: Lead reminder date expired without updates.",
      }
    } else if (!overdue && lead.isLocked && !lead.lockedReason?.includes("Manually locked")) {
      // If reminder date was updated to valid/future date, automatically unlock
      hasChanges = true
      return {
        ...lead,
        isLocked: false,
        lockedReason: undefined,
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
    const rawEmail = (lead.email || "").trim()
    const internalEmail = rawEmail || `lead_${lead.id}@saampark.in`
    const clientName = lead.name || "Won Client"

    const exists = storedClients.some(
      (c) => c.name.toLowerCase().trim() === clientName.toLowerCase().trim() || (rawEmail && c.email?.toLowerCase().trim() === rawEmail.toLowerCase().trim())
    )

    if (!exists) {
      const newClient = {
        id: `cli_${lead.id}`,
        name: clientName,
        primaryContact: lead.primaryContact || lead.name,
        email: rawEmail,
        phone: lead.phone || "N/A",
        group: "VIP",
        label: lead.service || "Potential",
        labelColor: "#3b82f6",
        projectsCount: 0,
        totalInvoiced: lead.value || "₹0",
        paymentReceived: "₹0",
        due: lead.value || "₹0",
        address: `${lead.city || ""}, ${lead.state || ""}, ${lead.country || ""}`.trim(),
        branchId: lead.branchId,
        branchName: lead.branchName,
        companyId: lead.companyId || companyId || "tech",
      }

      saveStoredClient(newClient as any)

      // Register client account for login in background
      recordUserAccount({
        id: `usr_cli_${lead.id}`,
        name: lead.primaryContact || lead.name,
        email: internalEmail,
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
  
  let activeBranch: string | undefined = undefined
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      activeBranch = useAuthStore.getState().activeBranchId || useAuthStore.getState().user?.branchId || undefined
    } catch {}
  }

  // Unique collision-free ID generation
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  const newId = `lead_${timestamp}_${randomSuffix}`
  
  const newLead: Lead = {
    ...leadData,
    id: newId,
    branchId: (leadData as any).branchId || activeBranch || undefined,
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
  
  const finalStatus = updates.status !== undefined ? updates.status : target.status
  const statusLower = (finalStatus || "").toLowerCase().trim()
  const isWonOrLost = statusLower === "won" || statusLower === "lost"

  // Prevent callers/teams from updating a locked lead unless being explicitly unlocked by Admin or moving to Won/Lost
  if (target.isLocked && !isSuperOrAdmin && updates.isLocked !== false && !isWonOrLost) {
    throw new Error("This lead is locked due to missing daily updates. Only an Admin or Super Admin can unlock it.")
  }

  const finalReminderDate = updates.reminderDate !== undefined ? updates.reminderDate : target.reminderDate

  let nextIsLocked = updates.isLocked !== undefined ? updates.isLocked : target.isLocked
  let nextReason = updates.lockedReason !== undefined ? updates.lockedReason : target.lockedReason

  // 1. Won leads are LOCKED by default (finalized deal)
  if (statusLower === "won") {
    if (updates.isLocked === false) {
      nextIsLocked = false
      nextReason = "Manually unlocked by Admin"
    } else {
      nextIsLocked = true
      nextReason = "Won: Lead is finalized and converted to Client."
    }
  } else if (statusLower === "lost") {
    if (updates.isLocked !== true) {
      nextIsLocked = false
      nextReason = undefined
    }
  } else if (finalReminderDate && !isReminderDateOverdue(finalReminderDate)) {
    // 2. If reminder date is set to a future / valid date, unlock
    if (updates.isLocked !== true) {
      nextIsLocked = false
      nextReason = undefined
    }
  } else if (isReminderDateOverdue(finalReminderDate)) {
    // 3. If reminder date is expired/overdue, lock at end of date
    nextIsLocked = true
    nextReason = "Overdue: Lead reminder date expired."
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

export const transferLeadsToBranch = async (
  leadIds: string[],
  branchId: string,
  branchName: string,
  transferredBy: string,
  transferredByRole: string = "Admin",
  companyId?: string
): Promise<Lead[]> => {
  const current = await fetchModuleDataFromDB<Lead[]>("leads", [], companyId)
  const idSet = new Set(leadIds.map(id => String(id)))
  const nowFormatted = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })

  const updated = current.map(lead => {
    if (idSet.has(String(lead.id))) {
      return {
        ...lead,
        branchId,
        branchName,
        assignedBranchId: branchId,
        assignedBranchName: branchName,
        transferredBy,
        transferredByRole,
        transferredAt: nowFormatted,
      }
    }
    return lead
  })

  await saveModuleDataToDB("leads", updated, companyId)

  // Also sync in master 'all' scope
  const master = await fetchModuleDataFromDB<Lead[]>("leads", [], "all")
  const masterUpdated = master.map(lead => {
    if (idSet.has(String(lead.id))) {
      return {
        ...lead,
        branchId,
        branchName,
        assignedBranchId: branchId,
        assignedBranchName: branchName,
        transferredBy,
        transferredByRole,
        transferredAt: nowFormatted,
      }
    }
    return lead
  })
  await saveModuleDataToDB("leads", masterUpdated, "all")

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_leads_updated"))
  }

  return updated.filter(l => idSet.has(String(l.id)))
}
