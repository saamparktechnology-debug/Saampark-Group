import { api } from "@/lib/api"

const UNIVERSAL_DELETED_KEY = "saampark_universal_deleted_ids"

export function getLocalDeletedIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(UNIVERSAL_DELETED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLocalDeletedId(id: string | number): void {
  if (typeof window === "undefined" || !id) return
  const strId = String(id).toLowerCase().trim()
  const current = getLocalDeletedIds()
  if (!current.includes(strId)) {
    const updated = [...current, strId]
    localStorage.setItem(UNIVERSAL_DELETED_KEY, JSON.stringify(updated))
  }
}

// Global function to mark any item deleted across the entire application and sync to MySQL DB!
export async function markGlobalItemDeleted(id: string | number, moduleName?: string): Promise<void> {
  if (!id) return
  const strId = String(id).toLowerCase().trim()
  saveLocalDeletedId(strId)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
  }

  try {
    await api.post("/deleted", { id: strId, moduleName })
  } catch (err) {
    console.warn("Backend deleted sync warning:", err)
  }
}

// Fetch all deleted item IDs from MySQL DB to ensure cross-browser synchronization
export async function syncGlobalDeletedIds(): Promise<string[]> {
  const local = getLocalDeletedIds()
  try {
    const res = await api.get("/deleted")
    const serverIds: string[] = Array.isArray(res) ? res : res?.data || []
    if (Array.isArray(serverIds) && serverIds.length > 0) {
      const merged = Array.from(new Set([...local, ...serverIds.map((s) => String(s).toLowerCase().trim())]))
      if (typeof window !== "undefined") {
        const hasNew = merged.length > local.length
        localStorage.setItem(UNIVERSAL_DELETED_KEY, JSON.stringify(merged))
        if (hasNew) {
          window.dispatchEvent(new Event("storage"))
        }
      }
      return merged
    }
  } catch (err) {
    console.warn("Backend deleted sync fetch warning:", err)
  }
  return local
}


export function isGlobalItemDeleted(id: string | number, deletedIds?: string[]): boolean {
  if (!id) return false
  const strId = String(id).toLowerCase().trim()
  const list = deletedIds || getLocalDeletedIds()
  return list.includes(strId)
}

export function filterGlobalDeletedItems<T extends { id: string | number }>(items: T[], deletedIds?: string[]): T[] {
  const list = deletedIds || getLocalDeletedIds()
  if (!list.length) return items
  return items.filter((item) => !list.includes(String(item.id).toLowerCase().trim()))
}

// Generic helper to fetch any module data (Projects, Events, Expenses, Tickets, Subscriptions, Proposals, Estimates, Notes, Settings) from MySQL DB
export async function fetchModuleDataFromDB<T>(moduleKey: string, fallbackData: T): Promise<T> {
  const localDeleted = await syncGlobalDeletedIds()

  try {
    const res = await api.get(`/store/${moduleKey}`)
    const serverData = res?.data !== undefined ? res.data : res
    if (serverData !== null && serverData !== undefined) {
      if (typeof window !== "undefined") {
        try { localStorage.setItem(`saampark_module_${moduleKey}`, JSON.stringify(serverData)) } catch {}
      }
      return filterGlobalDeletedItems(serverData as any, localDeleted) as any
    }
  } catch (err) {
    console.warn(`MySQL fetch warning for module ${moduleKey}:`, err)
  }

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(`saampark_module_${moduleKey}`)
      if (local) {
        try { return filterGlobalDeletedItems(JSON.parse(local), localDeleted) as any } catch {}
      }
    } catch {}
  }

  return filterGlobalDeletedItems(fallbackData as any, localDeleted) as any
}


// Generic helper to save any module data to MySQL DB persistently
export async function saveModuleDataToDB<T>(moduleKey: string, data: T): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`saampark_module_${moduleKey}`, JSON.stringify(data))
    } catch {}
  }

  try {
    await api.post(`/store/${moduleKey}`, { data })
  } catch (err) {
    console.warn(`MySQL save warning for module ${moduleKey}:`, err)
  }
}

