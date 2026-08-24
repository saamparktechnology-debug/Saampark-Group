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
 * Fetch module data from MySQL DB with company isolation.
 * MySQL is the single source of truth — no localStorage fallback for business data.
 * Response shape from backend: { status: "success", message: "...", data: <payload> }
 */
export async function fetchModuleDataFromDB<T>(moduleKey: string, fallbackData: T, companyId?: string): Promise<T> {
  const localDeleted = await syncGlobalDeletedIds()
  let targetCompany = companyId

  try {
    if (!targetCompany && typeof window !== "undefined") {
      try {
        const { useAuthStore } = require("@/store/useAuthStore")
        targetCompany = useAuthStore.getState().activeCompanyId || undefined
      } catch {}
    }

    const queryStr = targetCompany && targetCompany !== "all" ? `?company_id=${encodeURIComponent(targetCompany)}` : ""
    const res = await api.get(`/store/${moduleKey}${queryStr}`)
    const isError = !res || res.status === "error" || res.error === true

    if (!isError && res?.data !== undefined && res?.data !== null) {
      const serverData = res.data
      if (Array.isArray(serverData)) {
        return filterGlobalDeletedItems(serverData as any, localDeleted) as any
      } else if (typeof serverData === "object" && Object.keys(serverData).length > 0) {
        return serverData as any
      }
    }
  } catch (err) {
    console.warn(`MySQL fetch warning for module ${moduleKey}:`, err)
  }

  // MySQL is the source of truth — return empty array if no data found
  // Only use fallbackData if explicitly provided as non-empty (e.g., seed default labels)
  if (Array.isArray(fallbackData) && (fallbackData as any[]).length === 0) {
    return [] as any
  }
  return fallbackData
}

/**
 * Save module data to MySQL DB — single source of truth, no localStorage writes.
 */
export async function saveModuleDataToDB<T>(moduleKey: string, data: T, companyId?: string): Promise<void> {
  try {
    let targetCompany = companyId
    if (!targetCompany && typeof window !== "undefined") {
      try {
        const { useAuthStore } = require("@/store/useAuthStore")
        targetCompany = useAuthStore.getState().activeCompanyId || undefined
      } catch {}
    }

    await api.post(`/store/${moduleKey}`, { 
      data, 
      company_id: targetCompany && targetCompany !== "all" ? targetCompany : undefined 
    })
  } catch (err) {
    console.warn(`MySQL save warning for module ${moduleKey}:`, err)
  }
}

