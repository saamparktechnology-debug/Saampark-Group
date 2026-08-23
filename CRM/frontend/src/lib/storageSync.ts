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
    localStorage.setItem(UNIVERSAL_DELETED_KEY, JSON.stringify([...current, strId]))
  }
}

// Global function to mark any item deleted across the entire application and sync to MySQL DB
export async function markGlobalItemDeleted(id: string | number, moduleName?: string): Promise<void> {
  if (!id) return
  const strId = String(id).toLowerCase().trim()
  saveLocalDeletedId(strId)

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
    if (res && res.status !== "error" && !res.error && res.data !== undefined && res.data !== null) {
      const serverIds: string[] = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
      if (serverIds.length > 0) {
        const merged = Array.from(new Set([...local, ...serverIds.map((s) => String(s).toLowerCase().trim())]))
        if (typeof window !== "undefined") {
          localStorage.setItem(UNIVERSAL_DELETED_KEY, JSON.stringify(merged))
        }
        return merged
      }
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
  if (!Array.isArray(items)) return []
  const list = deletedIds || getLocalDeletedIds()
  if (!list.length) return items
  return items.filter((item) => item?.id && !list.includes(String(item.id).toLowerCase().trim()))
}

/**
 * Fetch module data from MySQL DB.
 * Response shape from backend: { status: "success", message: "...", data: <payload> }
 */
export async function fetchModuleDataFromDB<T>(moduleKey: string, fallbackData: T): Promise<T> {
  const localDeleted = await syncGlobalDeletedIds()

  try {
    const res = await api.get(`/store/${moduleKey}`)
    const isError = !res || res.status === "error" || res.error === true

    if (!isError && res?.data !== undefined && res?.data !== null) {
      const serverData = res.data
      if (Array.isArray(serverData)) {
        if (typeof window !== "undefined") {
          try { localStorage.setItem(`saampark_db_${moduleKey}`, JSON.stringify(serverData)) } catch {}
        }
        return filterGlobalDeletedItems(serverData as any, localDeleted) as any
      } else if (typeof serverData === "object" && Object.keys(serverData).length > 0) {
        if (typeof window !== "undefined") {
          try { localStorage.setItem(`saampark_db_${moduleKey}`, JSON.stringify(serverData)) } catch {}
        }
        return serverData as any
      }
    }
  } catch (err) {
    console.warn(`MySQL fetch warning for module ${moduleKey}:`, err)
  }

  // Fallback: try local DB cache (NOT localStorage module store, which is per-device)
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(`saampark_db_${moduleKey}`)
      if (local) {
        const parsed = JSON.parse(local)
        return filterGlobalDeletedItems(parsed, localDeleted) as any
      }
    } catch {}
  }

  return filterGlobalDeletedItems(fallbackData as any, localDeleted) as any
}

/**
 * Save module data to MySQL DB and local cache.
 */
export async function saveModuleDataToDB<T>(moduleKey: string, data: T): Promise<void> {
  // Cache locally
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`saampark_db_${moduleKey}`, JSON.stringify(data))
    } catch {}
  }

  // Persist to MySQL
  try {
    await api.post(`/store/${moduleKey}`, { data })
  } catch (err) {
    console.warn(`MySQL save warning for module ${moduleKey}:`, err)
  }
}
