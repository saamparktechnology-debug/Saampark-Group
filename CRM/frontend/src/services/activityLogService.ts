import { fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"

export interface ActivityLog {
  id: string
  companyId: string
  companyName?: string
  branchId?: string
  branchName?: string
  action: string
  description: string
  type: "company" | "branch" | "user" | "project" | "payment" | "task" | "general"
  timestamp: string
  userName?: string
}

export const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "act-1",
    companyId: "digital",
    companyName: "Saampark Digital",
    action: "Company Added",
    description: "New company Saampark Digital added",
    type: "company",
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    userName: "Super Admin",
  },
  {
    id: "act-2",
    companyId: "digital",
    companyName: "Saampark Digital",
    branchName: "Salt Lake (Kolkata)",
    action: "Branch Created",
    description: "Branch Salt Lake (Kolkata) added",
    type: "branch",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    userName: "Super Admin",
  },
  {
    id: "act-3",
    companyId: "tech",
    companyName: "Saampark Technology",
    action: "User Registration",
    description: "New user John Doe registered",
    type: "user",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    userName: "John Doe",
  },
  {
    id: "act-4",
    companyId: "tech",
    companyName: "Saampark Technology",
    action: "Project Created",
    description: "Project Website Development created",
    type: "project",
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    userName: "Alex Morgan",
  },
  {
    id: "act-5",
    companyId: "tech",
    companyName: "Saampark Technology",
    action: "Payment Received",
    description: "Payment received from Tech Solutions",
    type: "payment",
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    userName: "Billing Dept",
  },
]

export async function getActivityLogs(companyId?: string): Promise<ActivityLog[]> {
  try {
    const scope = !companyId || companyId === "all" ? "all" : companyId
    const stored = await fetchModuleDataFromDB<ActivityLog[]>("activity_logs", [], scope)
    
    if (Array.isArray(stored) && stored.length > 0) {
      if (scope === "all") {
        return stored.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }
      return stored
        .filter(log => !log.companyId || log.companyId === companyId || log.companyId.toLowerCase() === companyId?.toLowerCase())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }

    if (!companyId || companyId === "all") {
      return DEFAULT_ACTIVITY_LOGS
    }
    return DEFAULT_ACTIVITY_LOGS.filter(
      l => l.companyId === companyId || l.companyId.toLowerCase() === companyId.toLowerCase()
    )
  } catch (err) {
    console.warn("getActivityLogs error:", err)
    return DEFAULT_ACTIVITY_LOGS
  }
}

export async function recordActivityLog(item: Partial<ActivityLog>): Promise<ActivityLog> {
  const newLog: ActivityLog = {
    id: item.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    companyId: item.companyId || "tech",
    companyName: item.companyName || "Saampark Technology",
    branchId: item.branchId,
    branchName: item.branchName,
    action: item.action || "Activity",
    description: item.description || "Activity recorded",
    type: item.type || "general",
    timestamp: item.timestamp || new Date().toISOString(),
    userName: item.userName || "System",
  }

  try {
    const allLogs = await fetchModuleDataFromDB<ActivityLog[]>("activity_logs", [], "all").catch(() => [])
    const updated = [newLog, ...(Array.isArray(allLogs) ? allLogs : DEFAULT_ACTIVITY_LOGS)].slice(0, 500)
    await saveModuleDataToDB("activity_logs", updated, "all")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("saampark_activity_logged", { detail: newLog }))
    }
  } catch (e) {
    console.warn("recordActivityLog error:", e)
  }

  return newLog
}
