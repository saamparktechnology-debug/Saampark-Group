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

// In-memory micro-cache & in-flight promise deduplication
const inFlightRequests = new Map<string, Promise<any>>()
const cacheStore = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL_MS = 1200 // 1.2s micro-cache to prevent duplicate concurrent queries

export function invalidateModuleCache(moduleKey?: string) {
  if (moduleKey) {
    for (const k of cacheStore.keys()) {
      if (k.startsWith(moduleKey)) {
        cacheStore.delete(k)
      }
    }
    for (const k of inFlightRequests.keys()) {
      if (k.startsWith(moduleKey)) {
        inFlightRequests.delete(k)
      }
    }
  } else {
    cacheStore.clear()
    inFlightRequests.clear()
  }
}


/**
 * Fetch module data from MySQL DB with company isolation.
 * MySQL is the single source of truth.
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

    const cacheKey = `${moduleKey}_${targetCompany || "default"}`
    const now = Date.now()
    const cached = cacheStore.get(cacheKey)

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      if (Array.isArray(cached.data)) {
        return filterGlobalDeletedItems(cached.data as any, localDeleted) as any
      }
      return cached.data as any
    }

    // Deduplicate concurrent requests
    if (inFlightRequests.has(cacheKey)) {
      const pendingRes = await inFlightRequests.get(cacheKey)
      if (pendingRes !== undefined && pendingRes !== null) {
        if (Array.isArray(pendingRes)) {
          return filterGlobalDeletedItems(pendingRes as any, localDeleted) as any
        }
        return pendingRes as any
      }
    }

    const queryStr = targetCompany && targetCompany !== "all" ? `?company_id=${encodeURIComponent(targetCompany)}` : ""
    
    const requestPromise = api.get(`/store/${moduleKey}${queryStr}`).then((res) => {
      const isError = !res || res.status === "error" || res.error === true
      if (!isError && res?.data !== undefined && res?.data !== null) {
        cacheStore.set(cacheKey, { data: res.data, timestamp: Date.now() })
        return res.data
      }
      return null
    }).finally(() => {
      inFlightRequests.delete(cacheKey)
    })

    inFlightRequests.set(cacheKey, requestPromise)
    const serverData = await requestPromise

    if (serverData !== null && serverData !== undefined) {
      if (Array.isArray(serverData)) {
        return filterGlobalDeletedItems(serverData as any, localDeleted) as any
      } else if (typeof serverData === "object" && Object.keys(serverData).length > 0) {
        return serverData as any
      }
    }
  } catch (err) {
    console.warn(`MySQL fetch warning for module ${moduleKey}:`, err)
  }

  if (Array.isArray(fallbackData) && (fallbackData as any[]).length === 0) {
    return [] as any
  }
  return fallbackData
}

/**
 * Save module data to MySQL DB — single source of truth.
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

    invalidateModuleCache(moduleKey)

    await api.post(`/store/${moduleKey}`, { 
      data, 
      company_id: targetCompany && targetCompany !== "all" ? targetCompany : undefined 
    })
  } catch (err) {
    console.warn(`MySQL save warning for module ${moduleKey}:`, err)
  }
}

