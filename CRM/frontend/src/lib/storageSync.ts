import { api } from "@/lib/api"

const UNIVERSAL_DELETED_KEY = "saampark_universal_deleted_ids"

// Core protected system records that can NEVER be deleted (Master Super Admin user account only)
const PROTECTED_ACCOUNTS = ["hiisupriya@gmail.com"]

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

export function saveLocalDeletedId(id: string | number, moduleName?: string): void {
  if (typeof window === "undefined" || !id) return
  const strId = String(id).toLowerCase().trim()
  if (PROTECTED_ACCOUNTS.includes(strId)) return

  const current = getLocalDeletedIds()
  const mod = moduleName ? String(moduleName).toLowerCase().trim() : ""
  const namespacedKey = mod ? `${mod}:${strId}` : ""

  const next = new Set(current)
  if (namespacedKey) next.add(namespacedKey)
  // Also add naked string ID so callers checking with or without module find it
  next.add(strId)

  const merged = Array.from(next)
  localStorage.setItem(UNIVERSAL_DELETED_KEY, JSON.stringify(merged))

  // Immediately update in-memory deleted cache so subsequent checks see it instantly
  deletedCache = merged
  lastDeletedSyncTime = 0
}

// Global function to mark any item deleted across the entire application and sync to MySQL DB
export async function markGlobalItemDeleted(id: string | number, moduleName?: string): Promise<void> {
  if (!id) return
  const strId = String(id).toLowerCase().trim()
  if (PROTECTED_ACCOUNTS.includes(strId)) return

  // Strict check: Clients can NEVER delete records assigned by Admin/Super Admin
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      const currentUser = useAuthStore.getState().user
      const roleLower = (currentUser?.role || "").toLowerCase().trim()
      if (roleLower.includes("client")) {
        console.warn("Client blocked from deleting system items:", strId, moduleName)
        return
      }
    } catch {}
  }

  saveLocalDeletedId(strId, moduleName)
  invalidateModuleCache(moduleName)

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }

  try {
    await api.post("/deleted", { id: strId, moduleName: moduleName || "global" })
  } catch (err) {
    console.warn("Backend deleted sync warning:", err)
  }
}

// Global function to unmark/restore an item if created/re-added
export function unmarkGlobalItemDeleted(id: string | number, moduleName?: string): void {
  if (!id) return
  const strId = String(id).toLowerCase().trim()
  const mod = moduleName ? String(moduleName).toLowerCase().trim() : ""
  const namespacedKey = mod ? `${mod}:${strId}` : ""

  const local = getLocalDeletedIds().filter(d => d !== strId && d !== namespacedKey && !d.endsWith(`:${strId}`))
  if (typeof window !== "undefined") {
    localStorage.setItem(UNIVERSAL_DELETED_KEY, JSON.stringify(local))
  }
  deletedCache = deletedCache.filter(d => d !== strId && d !== namespacedKey && !d.endsWith(`:${strId}`))
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
        const rawServer: any[] = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        const cleanServer: string[] = []

        rawServer.forEach((item: any) => {
          if (item && typeof item === "object" && item.item_id) {
            const rawId = String(item.item_id).toLowerCase().trim()
            if (PROTECTED_ACCOUNTS.includes(rawId)) return
            const mod = String(item.module_name || "global").toLowerCase().trim()
            cleanServer.push(`${mod}:${rawId}`)
            if (!/^\d+$/.test(rawId)) {
              cleanServer.push(rawId)
            }
          } else if (typeof item === "string" || typeof item === "number") {
            const rawId = String(item).toLowerCase().trim()
            if (!PROTECTED_ACCOUNTS.includes(rawId)) {
              cleanServer.push(rawId)
            }
          }
        })

        const merged = Array.from(new Set([...local, ...cleanServer]))
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

export function isGlobalItemDeleted(id: string | number, deletedIds?: string[], moduleName?: string): boolean {
  if (!id) return false
  const strId = String(id).toLowerCase().trim()
  if (PROTECTED_ACCOUNTS.includes(strId)) return false

  const list = (deletedIds && Array.isArray(deletedIds) && deletedIds.length > 0) ? deletedIds : getLocalDeletedIds()
  if (!list || list.length === 0) return false

  const mod = moduleName ? String(moduleName).toLowerCase().trim() : ""
  const namespacedKey = mod ? `${mod}:${strId}` : ""
  const isPureNumber = /^\d+$/.test(strId)

  for (const entry of list) {
    if (!entry) continue
    const strEntry = String(entry).toLowerCase().trim()

    // 1. Exact namespaced match (e.g. "branches:br-1" === "branches:br-1")
    if (namespacedKey && strEntry === namespacedKey) {
      return true
    }

    // 2. If entry has module prefix like "companies:123"
    if (strEntry.includes(":")) {
      const [entryMod, ...rest] = strEntry.split(":")
      const entryId = rest.join(":")
      if (entryId === strId) {
        if (mod && entryMod !== "global" && entryMod !== mod) {
          // Different module! Not deleted in this module.
          continue
        }
        return true
      }
    } else {
      // 3. Naked string ID
      if (strEntry === strId) {
        // Pure number naked match without module qualification is disallowed to prevent collisions
        if (isPureNumber && mod) {
          continue
        }
        return true
      }
    }
  }

  return false
}

export function filterGlobalDeletedItems<T extends { id: string | number }>(items: T[], deletedIds?: string[], moduleName?: string): T[] {
  if (!Array.isArray(items)) return []
  return items.filter((item) => item?.id && !isGlobalItemDeleted(item.id, deletedIds, moduleName))
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
    if (typeof window !== "undefined") {
      try {
        const { useAuthStore } = require("@/store/useAuthStore")
        const authState = useAuthStore.getState()
        const authUser = authState.user
        if (!targetCompany) {
          targetCompany = authState.activeCompanyId || undefined
        }
        // Strict company assignment validation for non-Super Admin
        if (authUser && authUser.role !== "Super Admin" && targetCompany && targetCompany !== "all") {
          const rawIds = authUser.companyIds || (authUser.companyId ? [authUser.companyId] : ["tech"])
          const allowedIds = (Array.isArray(rawIds) ? rawIds : [rawIds]).map((id: any) => String(id).toLowerCase().trim())
          const targetNorm = String(targetCompany).toLowerCase().trim()
          const isAllowed = allowedIds.some((id: string) => id === targetNorm)
          if (!isAllowed) {
            console.warn(`Access denied: User ${authUser.email} cannot access unassigned company ${targetCompany}`)
            return (Array.isArray(fallbackData) ? [] : fallbackData) as any
          }
        }
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
      if (Array.isArray(serverData)) {
        return filterGlobalDeletedItems(serverData, undefined, moduleKey) as any
      }
      return serverData as any
    }

  } catch (err) {
    console.warn(`MySQL fetch warning for module ${moduleKey}:`, err)
  }

  if (Array.isArray(fallbackData)) {
    return filterGlobalDeletedItems(fallbackData as any[], undefined, moduleKey) as any
  }
  return fallbackData
}

/**
 * Save module data to MySQL DB — single source of truth.
 */
export async function saveModuleDataToDB<T>(moduleKey: string, data: T, companyId?: string): Promise<void> {
  let targetCompany = companyId
  try {
    if (typeof window !== "undefined") {
      try {
        const { useAuthStore } = require("@/store/useAuthStore")
        const authState = useAuthStore.getState()
        const authUser = authState.user
        if (!targetCompany) {
          targetCompany = authState.activeCompanyId || undefined
        }
        if (authUser && authUser.role !== "Super Admin" && targetCompany && targetCompany !== "all") {
          const rawIds = authUser.companyIds || (authUser.companyId ? [authUser.companyId] : ["tech"])
          const allowedIds = (Array.isArray(rawIds) ? rawIds : [rawIds]).map((id: any) => String(id).toLowerCase().trim())
          const targetNorm = String(targetCompany).toLowerCase().trim()
          const isAllowed = allowedIds.some((id: string) => id === targetNorm)
          if (!isAllowed) {
            console.warn(`Save denied: User ${authUser.email} cannot write to unassigned company ${targetCompany}`)
            return
          }
        }
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

