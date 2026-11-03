import { Lead } from "../types"
import { api } from "@/lib/api"
import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { taskService } from "../../tasks/services/taskService"
import { saveStoredClient, getClients } from "../../clients/services/clientService"
import { recordUserAccount } from "../../users/services/userService"
import { recordActivityLog } from "@/services/activityLogService"

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

export function isReminderDateOverdue(dateStr?: string, timeStr?: string): boolean {
  const parsed = parseLeadDate(dateStr)
  if (!parsed) return false
  const now = new Date()

  // If time is provided, parse time (e.g. "11:30 AM", "06:00 PM", "14:30")
  if (timeStr && timeStr !== "None" && typeof timeStr === "string") {
    const timeMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10)
      const minutes = parseInt(timeMatch[2], 10)
      const ampm = (timeMatch[3] || "").toUpperCase()
      if (ampm === "PM" && hours < 12) hours += 12
      if (ampm === "AM" && hours === 12) hours = 0
      parsed.setHours(hours, minutes, 0, 0)
      return now.getTime() > parsed.getTime()
    }
  }

  // If no time is specified, the lead remains active during the reminder day and locks once the date ends (at midnight 23:59:59.999)
  parsed.setHours(23, 59, 59, 999)
  return now.getTime() > parsed.getTime()
}

export function isLeadClientPrivate(lead?: Lead | null): boolean {
  if (!lead) return false
  const role = (lead.createdByRole || "").toLowerCase().trim()
  return (lead as any).isClientPrivate === true || role === "clients" || role === "client"
}

export function canUserUnlockLead(user: any, lead?: Lead | null): boolean {
  if (!user || !lead) return false
  const userRole = (user.role || "").trim()
  const isSuperAdmin = userRole === "Super Admin"

  // 1. If lead was added by a client:
  if (isLeadClientPrivate(lead)) {
    // Super Admin has full master governance
    if (isSuperAdmin) return true

    // The client acts as an admin for their own data:
    // ONLY the specific client who created this lead can lock/unlock it!
    if (userRole === "Clients" || userRole === "Client") {
      const uId = String(user.id || "").toLowerCase().trim()
      const uEmail = (user.email || "").toLowerCase().trim()
      const uName = (user.name || "").toLowerCase().trim()

      const cId = String(lead.createdById || "").toLowerCase().trim()
      const cEmail = (lead.createdByEmail || "").toLowerCase().trim()
      const cName = (lead.createdByName || lead.createdBy || "").toLowerCase().trim()

      if (uId && cId && uId === cId) return true
      if (uEmail && cEmail && uEmail === cEmail) return true
      if (uName && cName && uName === cName) return true
    }

    // Admins, telecallers, other clients, teams CANNOT unlock client-private leads
    return false
  }

  // 2. Standard company lead (not added by client):
  if (isSuperAdmin) return true

  // Check the explicit 'lockUnlock' sub-permission configured in the Permissions matrix
  try {
    const { usePermissionStore } = require("@/store/usePermissionStore")
    const store = usePermissionStore.getState()
    const actions = store.getUserModuleActions(user, "Leads")
    if (actions.lockUnlock !== undefined) {
      return Boolean(actions.lockUnlock)
    }
  } catch {}

  // Fallback default: Admin can unlock
  return userRole === "Admin"
}

export function canUserLockLead(user: any, lead?: Lead | null): boolean {
  return canUserUnlockLead(user, lead)
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

export function normalizeCompanyId(comp?: string | null): string {
  if (!comp) return "tech"
  const s = String(comp).toLowerCase().trim()
  if (s === "consultancy" || s === "print" || s.includes("consult") || s === "2" || s.includes("print space")) {
    return "consultancy"
  }
  return "tech"
}

export function isTeamMemberRole(userOrRole?: any): boolean {
  if (!userOrRole) return false
  const roleStr = typeof userOrRole === "string" ? userOrRole : String(userOrRole.role || userOrRole.role_name || "")
  const roleId = typeof userOrRole === "object" ? userOrRole.role_id : undefined
  const rLower = roleStr.toLowerCase().trim()

  if (rLower === "super admin" || rLower.includes("super")) return false
  if (rLower === "admin") return false
  if (rLower === "clients" || rLower.includes("client")) return false

  return (
    roleId === 3 ||
    rLower === "teams" ||
    rLower === "team" ||
    rLower.includes("team") ||
    rLower.includes("sales") ||
    rLower.includes("caller") ||
    rLower.includes("member") ||
    rLower.includes("representative")
  )
}

export function isLeadAssignedToUser(lead: Lead, user: any): boolean {
  if (!user || !lead) return false

  // Client-private leads are excluded for non-creators
  if ((lead as any).isClientPrivate === true || lead.createdByRole === "Clients") {
    const uId = String(user.id || "").toLowerCase().trim()
    const uEmail = String(user.email || "").toLowerCase().trim()
    const cId = String((lead as any).createdById || "").toLowerCase().trim()
    const cEmail = ((lead as any).createdByEmail || "").toLowerCase().trim()
    return Boolean((uId && cId === uId) || (uEmail && cEmail === uEmail))
  }

  const uId = String(user.id || "").toLowerCase().trim()
  const uEmail = String(user.email || "").toLowerCase().trim()
  const uName = String(user.name || (user as any).full_name || "").toLowerCase().trim()

  // 1. Check Creator (Only exact ID, email, or exact non-admin creator name)
  const cId = String((lead as any).createdById || "").toLowerCase().trim()
  const cEmail = ((lead as any).createdByEmail || "").toLowerCase().trim()
  const createdBy = (lead.createdBy || "").toLowerCase().trim()

  if (uId && cId && cId === uId) return true
  if (uEmail && ((cEmail && cEmail === uEmail) || (createdBy && createdBy === uEmail))) return true
  if (
    uName &&
    createdBy &&
    !createdBy.includes("super admin") &&
    !createdBy.includes("(super admin)") &&
    !createdBy.includes("(admin)") &&
    !createdBy.includes("admin") &&
    createdBy !== "team" &&
    createdBy !== "teams" &&
    createdBy === uName
  ) {
    return true
  }

  // 2. Check Assigned candidates (ONLY assignedTo and caller! NEVER lead.owner or lead.managers!)
  const candidateFields = [
    lead.assignedTo,
    (lead as any).assigned_to,
    lead.caller,
  ]

  for (const rawVal of candidateFields) {
    if (!rawVal) continue
    const str = String(rawVal).toLowerCase().trim()
    if (!str || str === "none" || str === "unassigned" || str === "team" || str === "teams" || str === "all") continue

    // Split multiple assignees by comma, semicolon, slash, or " & "
    const tokens = str.split(/[,;\/&]+/).map((s) => s.trim()).filter(Boolean)
    if (tokens.length === 0) tokens.push(str)

    for (const t of tokens) {
      if (
        !t ||
        t === "none" ||
        t === "unassigned" ||
        t === "team" ||
        t === "teams" ||
        t === "all" ||
        t.includes("super admin") ||
        t.includes("(super admin)") ||
        t.includes("(admin)")
      ) {
        continue
      }

      // Check ID match
      if (uId && (t === uId || t === `usr_${uId}`)) return true

      // Check Email match
      if (uEmail && t === uEmail) return true

      // Check Exact Name match
      if (uName) {
        if (t === uName) return true

        // If both have multiple words (first and last name, e.g. "Rakhi Ghosh" or "Supriya Naskar"), match full words
        const uParts = uName.split(/\s+/).filter(Boolean)
        const tParts = t.split(/\s+/).filter(Boolean)
        if (uParts.length > 1 && tParts.length > 1) {
          const matchAll = uParts.every((p) => tParts.includes(p)) && tParts.every((p) => uParts.includes(p))
          if (matchAll) return true
        }
      }
    }
  }

  return false
}

export const getLeads = async (companyId?: string): Promise<Lead[]> => {
  let targetComp = companyId
  let currentUser: any = null
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = targetComp || useAuthStore.getState().activeCompanyId || undefined
      currentUser = useAuthStore.getState().user
    } catch {}
  }

  const isTeam = isTeamMemberRole(currentUser)
  const effectiveComp = isTeam ? "all" : (targetComp || "all")
  let list: Lead[] = []

  const knownCompanies = ["tech", "consultancy", "print", "saampark"]

  if (effectiveComp === "all") {
    const allData = await fetchModuleDataFromDB<Lead[]>("leads", [], "all").catch(() => [])
    const map = new Map<string, Lead>()
    for (const l of (Array.isArray(allData) ? allData : [])) {
      if (l && l.id) {
        map.set(String(l.id).toLowerCase().trim(), l)
      }
    }
    const results = await Promise.all(
      knownCompanies.map(c => fetchModuleDataFromDB<Lead[]>("leads", [], c).catch(() => []))
    )
    for (let i = 0; i < results.length; i++) {
      const items = Array.isArray(results[i]) ? results[i] : []
      for (const l of items) {
        if (l && l.id) {
          const lId = String(l.id).toLowerCase().trim()
          if (!map.has(lId)) {
            map.set(lId, { ...l, companyId: normalizeCompanyId(l.companyId || knownCompanies[i]) })
          }
        }
      }
    }
    list = Array.from(map.values())
  } else {
    const canonicalTarget = normalizeCompanyId(effectiveComp)
    const toFetch = [canonicalTarget]
    if (canonicalTarget === "consultancy") {
      toFetch.push("print")
    }
    if (canonicalTarget === "tech") {
      toFetch.push("saampark")
    }

    const [allData, ...scopedResults] = await Promise.all([
      fetchModuleDataFromDB<Lead[]>("leads", [], "all").catch(() => []),
      ...toFetch.map(c => fetchModuleDataFromDB<Lead[]>("leads", [], c).catch(() => []))
    ])

    const map = new Map<string, Lead>()
    for (const res of scopedResults) {
      for (const l of (Array.isArray(res) ? res : [])) {
        if (l && l.id) {
          map.set(String(l.id).toLowerCase().trim(), { ...l, companyId: canonicalTarget })
        }
      }
    }

    for (const l of (Array.isArray(allData) ? allData : [])) {
      if (l && l.id && normalizeCompanyId(l.companyId) === canonicalTarget) {
        const lId = String(l.id).toLowerCase().trim()
        const existing = map.get(lId)
        if (!existing) {
          map.set(lId, { ...l, companyId: canonicalTarget })
        } else {
          map.set(lId, {
            ...existing,
            ...l,
            companyId: canonicalTarget,
            branchId: l.branchId !== undefined ? l.branchId : existing.branchId,
            branchName: l.branchName !== undefined ? l.branchName : existing.branchName,
            assignedBranchId: l.assignedBranchId !== undefined ? l.assignedBranchId : existing.assignedBranchId,
            assignedBranchName: l.assignedBranchName !== undefined ? l.assignedBranchName : existing.assignedBranchName,
            isLocked: l.isLocked !== undefined ? l.isLocked : existing.isLocked,
            lockedReason: l.lockedReason !== undefined ? l.lockedReason : existing.lockedReason,
            isExplicitlyUnlocked: (l as any).isExplicitlyUnlocked !== undefined ? (l as any).isExplicitlyUnlocked : (existing as any).isExplicitlyUnlocked,
            unlockedByAdmin: (l as any).unlockedByAdmin !== undefined ? (l as any).unlockedByAdmin : (existing as any).unlockedByAdmin,
            unlockedByClient: (l as any).unlockedByClient !== undefined ? (l as any).unlockedByClient : (existing as any).unlockedByClient,
            unlockedBy: (l as any).unlockedBy !== undefined ? (l as any).unlockedBy : (existing as any).unlockedBy,
            unlockedByRole: (l as any).unlockedByRole !== undefined ? (l as any).unlockedByRole : (existing as any).unlockedByRole,
            unlockedAt: (l as any).unlockedAt !== undefined ? (l as any).unlockedAt : (existing as any).unlockedAt,
          })
        }
      }
    }
    list = Array.from(map.values())
  }

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

    // 2. Explicitly unlocked leads: PRESERVE unlocked state unconditionally
    const isExplicitlyUnlocked =
      (lead as any).isExplicitlyUnlocked === true ||
      lead.lockedReason?.includes("Unlocked") ||
      (lead as any).unlockedByAdmin === true ||
      (lead as any).unlockedByClient === true

    if (isExplicitlyUnlocked) {
      if (lead.isLocked) {
        hasChanges = true
        return {
          ...lead,
          isLocked: false,
          lockedReason: lead.lockedReason || "Unlocked",
          isExplicitlyUnlocked: true,
        }
      }
      return lead
    }

    // 3. Active leads: check if reminder date is overdue (passed reminder time or end of date)
    const overdue = isReminderDateOverdue(lead.reminderDate, lead.reminderTime)
    if (overdue) {
      if (!lead.isLocked) {
        hasChanges = true
        return {
          ...lead,
          isLocked: true,
          lockedReason: "Overdue: Lead reminder date expired.",
          isExplicitlyUnlocked: false,
        }
      }
      return lead
    }

    // 4. Not overdue leads: release automatic lock
    if (!overdue && lead.isLocked && !lead.lockedReason?.includes("Manually locked")) {
      hasChanges = true
      return {
        ...lead,
        isLocked: false,
        lockedReason: undefined,
        isExplicitlyUnlocked: false,
      }
    }

    return lead
  })

  if (hasChanges) {
    saveModuleDataToDB("leads", processed, "all").catch(() => {})
    const comp = effectiveComp !== "all" ? normalizeCompanyId(effectiveComp) : "tech"
    saveModuleDataToDB("leads", processed, comp).catch(() => {})
  }

  // Client Isolation: If client user, strictly only return their leads.
  if (currentUser?.role === "Clients" || currentUser?.role?.toLowerCase().includes("client")) {
    const cId = String(currentUser.id || "").toLowerCase().trim()
    const cEmail = (currentUser.email || "").toLowerCase().trim()
    const cName = (currentUser.name || "").toLowerCase().trim()
    return processed.filter((l) => {
      const leadCreatorId = String(l.createdById || "").toLowerCase().trim()
      const leadCreatorEmail = (l.createdByEmail || "").toLowerCase().trim()
      const leadCreatedBy = (l.createdBy || "").toLowerCase().trim()
      return (
        (cId && leadCreatorId === cId) ||
        (cEmail && leadCreatorEmail === cEmail) ||
        (cEmail && leadCreatedBy === cEmail) ||
        (cName && leadCreatedBy === cName)
      )
    })
  }

  // Team Member Scoping: Team members only see leads assigned to them or created by them
  if (isTeam) {
    return processed.filter((l) => isLeadAssignedToUser(l, currentUser))
  }

  return processed.filter((l) => (l as any).isClientPrivate !== true && l.createdByRole !== "Clients")
}

export async function checkAndAutoConvertLeadToClient(lead: Lead, companyId?: string): Promise<void> {
  if (!lead || lead.status !== "Won") return

  try {
    const effLeadComp = normalizeCompanyId(lead.companyId || companyId || "tech")
    const storedClients = await getClients(effLeadComp)
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
        branchCode: (lead as any).branchCode,
        companyId: effLeadComp,
      }

      await saveStoredClient(newClient as any, effLeadComp)

      recordUserAccount({
        id: `usr_cli_${lead.id}`,
        name: lead.primaryContact || lead.name,
        email: internalEmail,
        role: "Clients",
        companyId: effLeadComp,
        companyIds: [effLeadComp],
        branchId: lead.branchId,
        branchName: lead.branchName,
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
  let authState: any = null
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      authState = useAuthStore.getState()
    } catch {}
  }
  const targetComp = normalizeCompanyId(companyId || leadData.companyId || authState?.activeCompanyId || "tech")

  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  const newId = `lead_${timestamp}_${randomSuffix}`
  
  const currentUser = authState?.user
  const isClientRole = currentUser?.role === "Clients"

  const newLead: Lead = {
    ...leadData,
    id: newId,
    companyId: targetComp,
    branchId: leadData.branchId || authState?.activeBranchId || authState?.user?.branchId || undefined,
    createdAt: leadData.createdAt || `${new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}`,
    service: leadData.service !== undefined ? leadData.service : "",
    source: leadData.source || "Social Media",
    reminderDate: leadData.reminderDate || "None",
    reminderNotes: leadData.reminderNotes || "",
    caller: leadData.caller || leadData.owner || (isClientRole ? (currentUser?.name || "Client") : "Team"),
    isLocked: false,
    isClientPrivate: isClientRole ? true : (leadData.isClientPrivate || false),
    createdById: isClientRole ? currentUser?.id : leadData.createdById,
    createdByEmail: isClientRole ? currentUser?.email : leadData.createdByEmail,
    createdByRole: isClientRole ? "Clients" : leadData.createdByRole,
  }

  const [current, allCurrent] = await Promise.all([
    fetchModuleDataFromDB<Lead[]>("leads", [], targetComp).catch(() => []),
    fetchModuleDataFromDB<Lead[]>("leads", [], "all").catch(() => []),
  ])

  const updated = [newLead, ...current.filter((l) => l.id !== newId)]
  const updatedAll = [newLead, ...allCurrent.filter((l) => l.id !== newId)]

  await Promise.all([
    saveModuleDataToDB("leads", updated, targetComp),
    saveModuleDataToDB("leads", updatedAll, "all"),
  ]).catch(() => {})

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("saampark_leads_updated"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new Event("storage"))
  }

  syncLeadReminderTask(newLead).catch(() => {})
  checkAndAutoConvertLeadToClient(newLead, targetComp).catch(() => {})

  recordActivityLog({
    type: "lead",
    module: "Leads",
    action: "New Lead Created",
    description: `New lead "${newLead.name}" registered for ${newLead.service || "General Inquiry"}`,
    companyId: newLead.companyId,
    branchId: newLead.branchId,
    details: `Source: ${newLead.source || "Direct"} | Value: ${newLead.value || "₹0"} | Caller: ${newLead.caller || "Team"}`
  }).catch(() => {})

  return newLead
}

export const updateLead = async (id: string, updates: Partial<Lead>, userRole?: string | any, companyId?: string): Promise<Lead> => {
  let currentUserObj: any = typeof userRole === "object" && userRole !== null ? userRole : null
  const effectiveRole = typeof userRole === "string" ? userRole : (currentUserObj?.role || "Super Admin")

  if (!currentUserObj && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      currentUserObj = useAuthStore.getState().user
    } catch {}
  }
  const isSuperOrAdmin =
    effectiveRole === "Super Admin" ||
    effectiveRole === "Admin" ||
    currentUserObj?.role === "Super Admin" ||
    currentUserObj?.role === "Admin"

  const targetComp = companyId ? normalizeCompanyId(companyId) : undefined

  // Find target lead fast across DB partitions in parallel
  const [scopedList, allLeads] = await Promise.all([
    targetComp ? fetchModuleDataFromDB<Lead[]>("leads", [], targetComp).catch(() => []) : Promise.resolve([]),
    fetchModuleDataFromDB<Lead[]>("leads", [], "all").catch(() => []),
  ])

  let target: Lead | null =
    scopedList.find(l => l.id === id) ||
    allLeads.find(l => l.id === id) ||
    null

  let foundComp: string = targetComp || (target?.companyId ? normalizeCompanyId(target.companyId) : "tech")

  if (!target) {
    const fallbackComps = ["tech", "consultancy", "print"]
    const results = await Promise.all(
      fallbackComps.map(c => fetchModuleDataFromDB<Lead[]>("leads", [], c).catch(() => []))
    )
    for (let i = 0; i < fallbackComps.length; i++) {
      const found = results[i].find(l => l.id === id)
      if (found) {
        target = found
        foundComp = normalizeCompanyId(fallbackComps[i])
        break
      }
    }
  }

  if (!target) throw new Error("Lead not found")

  const finalStatus = updates.status !== undefined ? updates.status : target.status
  const statusLower = (finalStatus || "").toLowerCase().trim()
  const isWonOrLost = statusLower === "won" || statusLower === "lost"

  const isClientCreator =
    currentUserObj &&
    isLeadClientPrivate(target) &&
    canUserUnlockLead(currentUserObj, target)

  const isAllowedToEditLocked = isSuperOrAdmin || isClientCreator

  const finalReminderDate = updates.reminderDate !== undefined ? updates.reminderDate : target.reminderDate
  const finalReminderTime = updates.reminderTime !== undefined ? updates.reminderTime : target.reminderTime
  const isTargetOverdue = isReminderDateOverdue(target.reminderDate, target.reminderTime)
  const isNewReminderOverdue = isReminderDateOverdue(finalReminderDate, finalReminderTime)

  const isLeadExplicitlyUnlocked =
    (target as any).isExplicitlyUnlocked === true ||
    target.lockedReason?.includes("Unlocked") ||
    (target as any).unlockedByAdmin === true ||
    (target as any).unlockedByClient === true

  const isCurrentlyLocked = Boolean(
    target.isLocked && !isLeadExplicitlyUnlocked && !isWonOrLost
  )

  const isAdvancingOrClearingReminder = updates.reminderDate !== undefined && !isNewReminderOverdue

  // Prevent callers/teams from updating a locked lead unless being explicitly unlocked, moving to Won/Lost, or updating an expired reminder date
  if (isCurrentlyLocked && !isAllowedToEditLocked && updates.isLocked !== false && !isWonOrLost && !isAdvancingOrClearingReminder) {
    if (isLeadClientPrivate(target)) {
      throw new Error("This lead was added by a client and is locked. Only that specific client (or Super Admin) can unlock or edit it.")
    }
    throw new Error("This lead is locked because its reminder date has expired. Only an Admin or Super Admin can unlock it.")
  }

  let nextIsLocked = target.isLocked
  let nextReason = target.lockedReason
  let nextIsExplicitlyUnlocked = (target as any).isExplicitlyUnlocked

  // Priority order for lock status:
  if (updates.isLocked === false) {
    nextIsLocked = false
    nextReason = updates.lockedReason || "Unlocked"
    nextIsExplicitlyUnlocked = true
  } else if (updates.isLocked === true) {
    nextIsLocked = true
    nextReason = updates.lockedReason || (isClientCreator ? "Manually locked by Client" : "Manually locked by Admin")
    nextIsExplicitlyUnlocked = false
  } else if (statusLower === "won") {
    nextIsLocked = true
    nextReason = "Won: Lead is finalized and converted to Client."
    nextIsExplicitlyUnlocked = false
  } else if (statusLower === "lost") {
    nextIsLocked = false
    nextReason = undefined
    nextIsExplicitlyUnlocked = false
  } else if (target.isLocked && target.lockedReason?.includes("Manually locked")) {
    nextIsLocked = true
    nextReason = target.lockedReason
    nextIsExplicitlyUnlocked = false
  } else if (updates.reminderDate !== undefined && !isNewReminderOverdue) {
    // Setting a new valid future date or clearing reminder automatically unlocks the lead!
    nextIsLocked = false
    nextReason = undefined
    nextIsExplicitlyUnlocked = true
  } else if (isLeadExplicitlyUnlocked) {
    nextIsLocked = false
    nextReason = target.lockedReason || "Unlocked"
    nextIsExplicitlyUnlocked = true
  } else if (finalReminderDate && isNewReminderOverdue) {
    nextIsLocked = true
    nextReason = "Overdue: Lead reminder date expired."
    nextIsExplicitlyUnlocked = false
  } else if (!isNewReminderOverdue) {
    nextIsLocked = false
    nextReason = undefined
    nextIsExplicitlyUnlocked = false
  }

  const oldCompanyId = normalizeCompanyId(target.companyId || foundComp)
  const newCompanyId = updates.companyId ? normalizeCompanyId(updates.companyId) : oldCompanyId

  const updatedLead: Lead = {
    ...target,
    ...updates,
    companyId: newCompanyId,
    isLocked: nextIsLocked,
    lockedReason: nextReason,
    isExplicitlyUnlocked: nextIsExplicitlyUnlocked,
  }

  // Fast concurrent write to DB: save to newCompanyId and 'all' in parallel
  const updatePromises: Promise<any>[] = []

  const updatedNew = [updatedLead, ...scopedList.filter(l => l.id !== id)]
  updatePromises.push(saveModuleDataToDB("leads", updatedNew, newCompanyId))

  const updatedAll = [updatedLead, ...allLeads.filter(l => l.id !== id)]
  updatePromises.push(saveModuleDataToDB("leads", updatedAll, "all"))

  if (newCompanyId !== oldCompanyId) {
    const oldList = scopedList.filter(l => l.id !== id)
    updatePromises.push(saveModuleDataToDB("leads", oldList, oldCompanyId))
  }

  // Execute all DB partition saves concurrently
  await Promise.all(updatePromises).catch((err) => {
    console.warn("DB leads write error:", err)
  })

  // Fire UI notifications immediately
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("saampark_leads_updated"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new Event("storage"))
  }

  // Run side tasks in the background without blocking the UI response
  syncLeadReminderTask(updatedLead).catch(() => {})
  checkAndAutoConvertLeadToClient(updatedLead, newCompanyId).catch(() => {})

  // Background activity logging
  if (statusLower === "won" && (target.status || "").toLowerCase().trim() !== "won") {
    recordActivityLog({
      type: "lead",
      module: "Leads",
      action: "Lead Deal Won",
      description: `Lead deal "${updatedLead.name}" marked as WON & auto-converted to Client!`,
      companyId: updatedLead.companyId,
      branchId: updatedLead.branchId,
      branchName: updatedLead.branchName,
      details: `Deal Value: ${updatedLead.value || "₹0"}`
    }).catch(() => {})
  } else if (statusLower === "lost" && (target.status || "").toLowerCase().trim() !== "lost") {
    recordActivityLog({
      type: "lead",
      module: "Leads",
      action: "Lead Marked Lost",
      description: `Lead "${updatedLead.name}" marked as Lost`,
      companyId: updatedLead.companyId,
      branchId: updatedLead.branchId,
      branchName: updatedLead.branchName,
    }).catch(() => {})
  } else if (updates.status && updates.status !== target.status) {
    recordActivityLog({
      type: "lead",
      module: "Leads",
      action: "Lead Stage Updated",
      description: `Lead "${updatedLead.name}" moved from "${target.status || 'New'}" to "${updatedLead.status}"`,
      companyId: updatedLead.companyId,
      branchId: updatedLead.branchId,
      branchName: updatedLead.branchName,
    }).catch(() => {})
  } else if (updates.caller && updates.caller !== target.caller) {
    recordActivityLog({
      type: "lead",
      module: "Leads",
      action: "Lead Reassigned",
      description: `Lead "${updatedLead.name}" assigned to caller/owner "${updatedLead.caller}"`,
      companyId: updatedLead.companyId,
      branchId: updatedLead.branchId,
      branchName: updatedLead.branchName,
    }).catch(() => {})
  }

  return updatedLead
}

export const deleteLead = async (id: string, companyId?: string): Promise<boolean> => {
  await markGlobalItemDeleted(id, "leads")
  const targetComp = normalizeCompanyId(companyId)
  
  const [currentScoped, allCurrent] = await Promise.all([
    fetchModuleDataFromDB<Lead[]>("leads", [], targetComp).catch(() => []),
    fetchModuleDataFromDB<Lead[]>("leads", [], "all").catch(() => []),
  ])

  const target = currentScoped.find(l => l.id === id) || allCurrent.find(l => l.id === id)
  const filteredScoped = currentScoped.filter((l) => l.id !== id)
  const filteredAll = allCurrent.filter((l) => l.id !== id)

  await Promise.all([
    saveModuleDataToDB("leads", filteredScoped, targetComp),
    saveModuleDataToDB("leads", filteredAll, "all"),
  ]).catch(() => {})

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("saampark_leads_updated"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new Event("storage"))
  }

  recordActivityLog({
    type: "lead",
    module: "Leads",
    action: "Lead Deleted",
    description: `Lead "${target?.name || id}" removed from the system`,
    companyId: target?.companyId || targetComp,
    branchId: target?.branchId,
    branchName: target?.branchName,
  }).catch(() => {})

  return true
}

export const unlockLead = async (
  id: string,
  userOrCompanyId?: any,
  companyIdParam?: string
): Promise<Lead> => {
  let currentUser: any = null
  let targetComp: string | undefined = undefined

  if (typeof userOrCompanyId === "object" && userOrCompanyId !== null) {
    currentUser = userOrCompanyId
    targetComp = companyIdParam
  } else if (typeof userOrCompanyId === "string") {
    if (userOrCompanyId === "Super Admin" || userOrCompanyId === "Admin") {
      currentUser = { role: userOrCompanyId }
      targetComp = companyIdParam
    } else {
      targetComp = userOrCompanyId
    }
  }

  if (!currentUser && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      currentUser = useAuthStore.getState().user
    } catch {}
  }

  const canonComp = targetComp ? normalizeCompanyId(targetComp) : undefined

  // Concurrently fetch DB partitions for fastest response
  const [allLeads, compLeads] = await Promise.all([
    fetchModuleDataFromDB<Lead[]>("leads", [], "all").catch(() => []),
    canonComp ? fetchModuleDataFromDB<Lead[]>("leads", [], canonComp).catch(() => []) : Promise.resolve([]),
  ])

  const lead =
    compLeads.find(l => String(l.id).toLowerCase().trim() === String(id).toLowerCase().trim()) ||
    allLeads.find(l => String(l.id).toLowerCase().trim() === String(id).toLowerCase().trim())

  const resolvedComp = normalizeCompanyId(lead?.companyId || targetComp)

  if (currentUser && lead && !canUserUnlockLead(currentUser, lead)) {
    if (isLeadClientPrivate(lead)) {
      throw new Error("This lead was created by a client. Only that specific client (or Super Admin) can unlock it.")
    }
    throw new Error("Only Administrators can unlock this lead.")
  }

  const isClient = (currentUser?.role || "").toLowerCase().includes("client")
  const unlockReason = isClient ? "Unlocked by Client" : "Unlocked by Admin"

  // Advance reminder date to tomorrow in DD MMM YYYY format
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const d = String(tomorrow.getDate()).padStart(2, "0")
  const m = MONTH_NAMES_SHORT[tomorrow.getMonth()]
  const y = tomorrow.getFullYear()
  const futureReminderDate = `${d} ${m} ${y}`

  const updates: Partial<Lead> & Record<string, any> = {
    isLocked: false,
    lockedReason: unlockReason,
    isExplicitlyUnlocked: true,
    unlockedByAdmin: !isClient,
    unlockedByClient: isClient,
    unlockedBy: currentUser?.name || currentUser?.email || (isClient ? "Client" : "Admin"),
    unlockedByRole: currentUser?.role || (isClient ? "Clients" : "Admin"),
    unlockedById: currentUser?.id ? String(currentUser.id) : undefined,
    unlockedAt: new Date().toISOString(),
  }

  if (!lead?.reminderDate || isReminderDateOverdue(lead.reminderDate)) {
    updates.reminderDate = futureReminderDate
  }

  return updateLead(id, updates as any, currentUser || "Super Admin", resolvedComp)
}

export const lockLead = async (
  id: string,
  reason?: string,
  userOrCompanyId?: any,
  companyIdParam?: string
): Promise<Lead> => {
  let currentUser: any = null
  let targetComp: string | undefined = undefined

  if (typeof userOrCompanyId === "object" && userOrCompanyId !== null) {
    currentUser = userOrCompanyId
    targetComp = companyIdParam
  } else if (typeof userOrCompanyId === "string") {
    if (userOrCompanyId === "Super Admin" || userOrCompanyId === "Admin") {
      currentUser = { role: userOrCompanyId }
      targetComp = companyIdParam
    } else {
      targetComp = userOrCompanyId
    }
  }

  if (!currentUser && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      currentUser = useAuthStore.getState().user
    } catch {}
  }

  const canonComp = targetComp ? normalizeCompanyId(targetComp) : undefined

  const [allLeads, compLeads] = await Promise.all([
    fetchModuleDataFromDB<Lead[]>("leads", [], "all").catch(() => []),
    canonComp ? fetchModuleDataFromDB<Lead[]>("leads", [], canonComp).catch(() => []) : Promise.resolve([]),
  ])

  const lead =
    compLeads.find(l => String(l.id).toLowerCase().trim() === String(id).toLowerCase().trim()) ||
    allLeads.find(l => String(l.id).toLowerCase().trim() === String(id).toLowerCase().trim())

  const resolvedComp = normalizeCompanyId(lead?.companyId || targetComp)

  if (currentUser && lead && !canUserLockLead(currentUser, lead)) {
    if (isLeadClientPrivate(lead)) {
      throw new Error("This lead was created by a client. Only that specific client (or Super Admin) can lock it.")
    }
    throw new Error("You do not have permission to lock this lead.")
  }

  const isClient = (currentUser?.role || "").toLowerCase().includes("client")
  const defaultReason = reason || (isClient ? "Manually locked by Client" : "Manually locked by Admin")

  const updates: Partial<Lead> & Record<string, any> = {
    isLocked: true,
    lockedReason: defaultReason,
    isExplicitlyUnlocked: false,
    unlockedByAdmin: false,
    unlockedByClient: false,
    lockedBy: currentUser?.name || currentUser?.email || (isClient ? "Client" : "Admin"),
    lockedByRole: currentUser?.role || (isClient ? "Clients" : "Admin"),
    lockedById: currentUser?.id ? String(currentUser.id) : undefined,
    lockedAt: new Date().toISOString(),
  }

  return updateLead(
    id,
    updates as any,
    currentUser || "Super Admin",
    resolvedComp
  )
}

export const transferLeadsToBranch = async (
  leadIds: string[],
  branchId: string,
  branchName: string,
  transferredBy: string,
  transferredByRole: string = "Admin",
  companyId?: string
): Promise<Lead[]> => {
  const idSet = new Set(leadIds.map(id => String(id).toLowerCase().trim()))
  const nowFormatted = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })

  // Find destination branch details flexibly by ID, code, or name
  let branches: any[] = []
  try {
    const { useAuthStore } = require("@/store/useAuthStore")
    branches = useAuthStore.getState().branches || []
  } catch {}

  const targetBranch = branches.find(b => 
    String(b.id).toLowerCase().trim() === String(branchId).toLowerCase().trim() ||
    String(b.code || "").toLowerCase().trim() === String(branchId).toLowerCase().trim() ||
    (b.name && b.name.toLowerCase().trim() === branchName.toLowerCase().trim())
  )

  const effectiveBranchId = String(targetBranch?.id || branchId)
  const effectiveBranchName = targetBranch?.name || branchName
  const targetBranchCompanyId = (targetBranch?.companyId || targetBranch?.company_id || "").toLowerCase().trim()

  // Load all master leads
  const master = await fetchModuleDataFromDB<Lead[]>("leads", [], "all").catch(() => [])
  const updatedLeads: Lead[] = []

  const masterUpdated = master.map(lead => {
    if (idSet.has(String(lead.id).toLowerCase().trim())) {
      const finalComp = targetBranchCompanyId || lead.companyId || (companyId && companyId !== "all" ? companyId : "tech")
      const updatedItem: Lead = {
        ...lead,
        branchId: effectiveBranchId,
        branchName: effectiveBranchName,
        assignedBranchId: effectiveBranchId,
        assignedBranchName: effectiveBranchName,
        companyId: finalComp,
        transferredBy,
        transferredByRole,
        transferredAt: nowFormatted,
      }
      updatedLeads.push(updatedItem)
      return updatedItem
    }
    return lead
  })

  await saveModuleDataToDB("leads", masterUpdated, "all")

  // Also sync per-company stores for all touched companies
  const touchedCompanies = new Set<string>()
  if (companyId && companyId !== "all") touchedCompanies.add(String(companyId).toLowerCase().trim())
  if (targetBranchCompanyId && targetBranchCompanyId !== "all") touchedCompanies.add(String(targetBranchCompanyId).toLowerCase().trim())
  updatedLeads.forEach(l => {
    if (l.companyId && l.companyId !== "all") touchedCompanies.add(String(l.companyId).toLowerCase().trim())
  })
  touchedCompanies.add("tech")

  for (const c of Array.from(touchedCompanies)) {
    const cList = await fetchModuleDataFromDB<Lead[]>("leads", [], c).catch(() => [])
    const cMap = new Map<string, Lead>()
    for (const l of cList) {
      if (l && l.id) cMap.set(String(l.id).toLowerCase().trim(), l)
    }
    for (const ul of updatedLeads) {
      const ulId = String(ul.id).toLowerCase().trim()
      const ulComp = (ul.companyId || "tech").toLowerCase().trim()
      if (ulComp === c) {
        cMap.set(ulId, ul)
      } else {
        // If moved to a different company, remove from old company
        cMap.delete(ulId)
      }
    }
    await saveModuleDataToDB("leads", Array.from(cMap.values()), c).catch(() => {})
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_leads_updated"))
  }

  recordActivityLog({
    type: "lead",
    module: "Leads",
    action: "Leads Transferred to Branch",
    description: `${leadIds.length} lead(s) transferred to branch "${effectiveBranchName}" by ${transferredBy}`,
    companyId: targetBranchCompanyId || companyId,
    branchId: effectiveBranchId,
    branchName: effectiveBranchName,
  }).catch(() => {})

  return updatedLeads
}

