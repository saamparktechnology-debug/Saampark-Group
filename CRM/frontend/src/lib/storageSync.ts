import { api } from "@/lib/api"

const UNIVERSAL_DELETED_KEY = "saampark_universal_deleted_ids"

const PROTECTED_ACCOUNTS = ["hiisupriya@gmail.com", "1", "2", "3", "4", "tech", "digital"]

export function getLocalDeletedIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(UNIVERSAL_DELETED_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    return list.filter(id => !PROTECTED_ACCOUNTS.includes(String(id).toLowerCase().trim()))
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

// Global function to unmark/restore an item if created/re-added
export function unmarkGlobalItemDeleted(id: string | number): void {
  if (!id) return
  const strId = String(id).toLowerCase().trim()
  const local = getLocalDeletedIds().filter(d => d !== strId)
  if (typeof window !== "undefined") {
    localStorage.setItem(UNIVERSAL_DELETED_KEY, JSON.stringify(local))
  }
  deletedCache = deletedCache.filter(d => d !== strId)
  lastDeletedSyncTime = 0

  // Asynchronously purge from MySQL deleted table so it doesn't resurrect on next fetch
  api.delete(`/deleted/${encodeURIComponent(strId)}`).catch(() => {
    api.post("/deleted/restore", { id: strId }).catch(() => {})
  })
}

// In-memory deleted cache & deduplication
let deletedCache: string[] = []
let lastDeletedSyncTime = 0
let inFlightDeletedSync: Promise<string[]> | null = null
const DELETED_CACHE_TTL_MS = 15000 // 15 seconds cache

// Fetch all deleted item IDs from MySQL DB to ensure cross-browser synchronization
export async function syncGlobalDeletedIds(): Promise<string[]> {
  const now = Date.now()
  if (deletedCache.length > 0 && now - lastDeletedSyncTime < DELETED_CACHE_TTL_MS) {
    return deletedCache
  }

  if (inFlightDeletedSync) {
    return inFlightDeletedSync
  }

  const local = getLocalDeletedIds()
  inFlightDeletedSync = (async () => {
    try {
      const res = await api.get("/deleted")
      if (res && res.status !== "error" && !res.error && res.data !== undefined && res.data !== null) {
        const serverIds: string[] = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        const merged = Array.from(new Set([...local, ...serverIds.map((s) => String(s).toLowerCase().trim())]))
        deletedCache = merged
        lastDeletedSyncTime = Date.now()
        if (typeof window !== "undefined") {
          localStorage.setItem(UNIVERSAL_DELETED_KEY, JSON.stringify(merged))
        }
        return merged
      }
    } catch (err) {
      console.warn("Backend deleted sync fetch warning:", err)
    } finally {
      inFlightDeletedSync = null
    }
    deletedCache = local
    lastDeletedSyncTime = Date.now()
    return local
  })()

  return inFlightDeletedSync
}

export function isGlobalItemDeleted(id: string | number, deletedIds?: string[]): boolean {
  if (!id || !deletedIds || !Array.isArray(deletedIds) || deletedIds.length === 0) return false
  const strId = String(id).toLowerCase().trim()
  return deletedIds.includes(strId)
}

export function filterGlobalDeletedItems<T extends { id: string | number }>(items: T[], deletedIds?: string[]): T[] {
  if (!Array.isArray(items)) return []
  if (!deletedIds || !Array.isArray(deletedIds) || deletedIds.length === 0) return items
  return items.filter((item) => item?.id && !deletedIds.includes(String(item.id).toLowerCase().trim()))
}

// In-memory micro-cache & in-flight promise deduplication
const inFlightRequests = new Map<string, Promise<any>>()
const cacheStore = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL_MS = 800 // 800ms micro-cache to prevent duplicate concurrent queries

export function invalidateModuleCache(moduleKey?: string) {
  if (moduleKey) {
    for (const k of Array.from(cacheStore.keys())) {
      if (k.startsWith(moduleKey)) {
        cacheStore.delete(k)
      }
    }
    for (const k of Array.from(inFlightRequests.keys())) {
      if (k.startsWith(moduleKey)) {
        inFlightRequests.delete(k)
      }
    }
  } else {
    cacheStore.clear()
    inFlightRequests.clear()
    lastDeletedSyncTime = 0
  }
}

/**
 * Fetch module data from MySQL DB with company isolation.
 * MySQL is the single source of truth.
 */
export async function fetchModuleDataFromDB<T>(moduleKey: string, fallbackData: T, companyId?: string): Promise<T> {
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
      return cached.data as any
    }

    // Deduplicate concurrent requests
    if (inFlightRequests.has(cacheKey)) {
      const pendingRes = await inFlightRequests.get(cacheKey)
      if (pendingRes !== undefined && pendingRes !== null) {
        return pendingRes as any
      }
    }

    const queryStr = targetCompany && targetCompany !== "all" ? `?company_id=${encodeURIComponent(targetCompany)}` : ""
    
    const requestPromise = api.get(`/store/${moduleKey}${queryStr}`).then((res) => {
      const isError = !res || res.status === "error" || res.error === true
      if (!isError && res?.data !== undefined && res?.data !== null) {
        const rawData = res.data
        let finalData: any = rawData
        // If wrapped in { data: ... }
        if (typeof rawData === "object" && rawData !== null && "data" in rawData && Object.keys(rawData).length === 1) {
          finalData = rawData.data
        }
        cacheStore.set(cacheKey, { data: finalData, timestamp: Date.now() })
        return finalData
      }
      return null
    }).finally(() => {
      inFlightRequests.delete(cacheKey)
    })

    inFlightRequests.set(cacheKey, requestPromise)

    // Trigger deleted sync in parallel if not cached
    syncGlobalDeletedIds().catch(() => {})

    const serverData = await requestPromise

    if (serverData !== null && serverData !== undefined) {
      return serverData as any
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

    // Invalidate micro-cache AFTER save completes to ensure subsequent fetches retrieve fresh data
    invalidateModuleCache(moduleKey)
  } catch (err) {
    console.warn(`MySQL save warning for module ${moduleKey}:`, err)
  }
}

