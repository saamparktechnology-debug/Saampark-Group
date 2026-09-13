import { fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"

export type ActivityType =
  | "permission"
  | "lead"
  | "client"
  | "invoice"
  | "quotation"
  | "estimate"
  | "payment"
  | "project"
  | "task"
  | "user"
  | "company"
  | "branch"
  | "general"

export interface ActivityLog {
  id: string
  companyId: string
  companyName?: string
  branchId?: string
  branchName?: string
  module?: string
  action: string
  description: string
  type: ActivityType
  timestamp: string
  userName?: string
  userEmail?: string
  userRole?: string
  details?: string
}

const LOCAL_STORAGE_KEY = "saampark_activity_logs_cache"

function getLocalLogs(): ActivityLog[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalLogs(logs: ActivityLog[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs.slice(0, 500)))
  } catch {}
}

export const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "act-init-1",
    companyId: "tech",
    companyName: "Saampark Technology",
    module: "Permissions",
    action: "Permissions Initialized",
    description: "System RBAC access matrix and 4 core action controls (View, Add, Edit, Delete) configured",
    type: "permission",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    userName: "System Security",
    userRole: "Super Admin",
  },
  {
    id: "act-init-2",
    companyId: "tech",
    companyName: "Saampark Technology",
    module: "Leads",
    action: "Lead Pipeline Ready",
    description: "Lead management and automated conversion workflows online",
    type: "lead",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    userName: "CRM Core",
    userRole: "System",
  },
  {
    id: "act-init-3",
    companyId: "tech",
    companyName: "Saampark Technology",
    module: "Invoices",
    action: "Billing Service Active",
    description: "Digital GST tax invoicing and automated milestone billing active",
    type: "invoice",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    userName: "Billing System",
    userRole: "System",
  },
]

export async function getActivityLogs(companyId?: string): Promise<ActivityLog[]> {
  try {
    const scope = !companyId || companyId === "all" ? "all" : companyId
    const stored = await fetchModuleDataFromDB<ActivityLog[]>("activity_logs", [], scope)
    const local = getLocalLogs()

    // Merge DB logs and local cached logs
    const map = new Map<string, ActivityLog>()
    
    // Add default logs if empty
    if ((!stored || stored.length === 0) && local.length === 0) {
      DEFAULT_ACTIVITY_LOGS.forEach(l => map.set(l.id, l))
    }

    if (Array.isArray(stored)) {
      stored.forEach(l => { if (l?.id) map.set(l.id, l) })
    }
    local.forEach(l => { if (l?.id) map.set(l.id, l) })

    let list = Array.from(map.values())

    if (companyId && companyId !== "all") {
      const cNorm = companyId.toLowerCase().trim()
      list = list.filter(l => !l.companyId || l.companyId.toLowerCase().trim() === cNorm)
    }

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (err) {
    console.warn("getActivityLogs error:", err)
    return getLocalLogs().length > 0 ? getLocalLogs() : DEFAULT_ACTIVITY_LOGS
  }
}

export async function recordActivityLog(item: Partial<ActivityLog>): Promise<ActivityLog> {
  let uName = item.userName
  let uEmail = item.userEmail
  let uRole = item.userRole
  let cId = item.companyId
  let cName = item.companyName
  let bId = item.branchId
  let bName = item.branchName

  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      const auth = useAuthStore.getState()
      const u = auth.user
      if (u) {
        if (!uName) uName = u.name || u.email || "Administrator"
        if (!uEmail) uEmail = u.email || ""
        if (!uRole) uRole = u.role || "Admin"
      }
      if (!cId) cId = auth.activeCompanyId || u?.companyId || "tech"
      if (!bId) bId = auth.activeBranchId || u?.branchId
      
      const comp = auth.companies?.find((c: any) => c.id === cId || c.slug === cId)
      if (comp && !cName) cName = comp.name
      const branch = auth.branches?.find((b: any) => b.id === bId)
      if (branch && !bName) bName = branch.name
    } catch {}
  }

  const newLog: ActivityLog = {
    id: item.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    companyId: cId || "tech",
    companyName: cName || "Saampark Group",
    branchId: bId,
    branchName: bName,
    module: item.module || "General",
    action: item.action || "System Action",
    description: item.description || "Activity recorded",
    type: item.type || "general",
    timestamp: item.timestamp || new Date().toISOString(),
    userName: uName || "Administrator",
    userEmail: uEmail,
    userRole: uRole,
    details: item.details,
  }

  try {
    // 1. Save to local storage for immediate zero-latency feedback
    const local = getLocalLogs()
    const updatedLocal = [newLog, ...local.filter(l => l.id !== newLog.id)].slice(0, 500)
    saveLocalLogs(updatedLocal)

    // 2. Dispatch custom event for real-time reactivity in open UI tabs
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("saampark_activity_logged", { detail: newLog }))
      window.dispatchEvent(new Event("storage"))
    }

    // 3. Persist to MySQL database via app_data / store API
    const allDb = await fetchModuleDataFromDB<ActivityLog[]>("activity_logs", [], "all").catch(() => [])
    const updatedDb = [newLog, ...(Array.isArray(allDb) ? allDb.filter(l => l.id !== newLog.id) : [])].slice(0, 500)
    await saveModuleDataToDB("activity_logs", updatedDb, "all")
  } catch (e) {
    console.warn("recordActivityLog error:", e)
  }

  return newLog
}

export async function clearAllActivityLogs(): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      window.dispatchEvent(new CustomEvent("saampark_activity_logged"))
    }
    await saveModuleDataToDB("activity_logs", [], "all")
    return true
  } catch {
    return false
  }
}
