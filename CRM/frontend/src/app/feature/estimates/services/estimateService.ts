import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"

export interface EstimateServiceItem {
  id: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  total: number
}

export type EstimateStatus = "Draft" | "Sent" | "Accepted" | "Declined" | "Expired"

export interface EstimateItem {
  id: string
  estimateNumber: string
  client: string
  clientEmail?: string
  title: string
  date: string
  validUntil: string
  services: EstimateServiceItem[]
  subtotal: number
  gstRate: number
  gstAmount: number
  totalAmount: number
  formattedTotal: string
  status: EstimateStatus
  notes?: string
  companyId?: string
  branchId?: string
  branchName?: string
  branchCode?: string
  createdAdmin?: string
  acceptedAt?: string
  revisionNote?: string
}

export const getEstimates = async (companyId?: string): Promise<EstimateItem[]> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  const effectiveComp = targetComp || "tech"
  const targetNorm = effectiveComp.toLowerCase().trim()

  const [scopedData, allMaster] = await Promise.all([
    fetchModuleDataFromDB<EstimateItem[]>("estimates", [], effectiveComp).catch(() => []),
    fetchModuleDataFromDB<EstimateItem[]>("estimates", [], "all").catch(() => []),
  ])

  const map = new Map<string, EstimateItem>()
  for (const e of (Array.isArray(allMaster) ? allMaster : [])) {
    if (e && e.id) {
      const eComp = (e.companyId || (e as any).company || "tech").toLowerCase().trim()
      if (eComp === targetNorm || (targetNorm === "tech" && !e.companyId)) {
        map.set(String(e.id).toLowerCase().trim(), e)
      }
    }
  }
  for (const e of (Array.isArray(scopedData) ? scopedData : [])) {
    if (e && e.id) {
      const eComp = (e.companyId || (e as any).company || effectiveComp).toLowerCase().trim()
      if (eComp === targetNorm || (targetNorm === "tech" && !e.companyId) || !e.companyId) {
        map.set(String(e.id).toLowerCase().trim(), e)
      }
    }
  }

  return filterGlobalDeletedItems(Array.from(map.values()))
}

export const addEstimate = async (estimateData: Omit<EstimateItem, "id" | "estimateNumber"> & { id?: string; estimateNumber?: string }, companyId?: string): Promise<EstimateItem> => {
  let targetComp = companyId || estimateData.companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  const effectiveComp = targetComp || "tech"

  const current = await getEstimates(effectiveComp)
  const nextId = estimateData.id || `est_${Date.now()}`
  
  let estimateNumber = estimateData.estimateNumber
  if (!estimateNumber) {
    const maxNum = current.reduce((max, e) => {
      const num = parseInt(String(e.estimateNumber || "").replace(/[^0-9]/g, "")) || 0
      return Math.max(max, num)
    }, 100)
    estimateNumber = `EST #${maxNum + 1}`
  }

  const newEst: EstimateItem = {
    ...estimateData,
    id: nextId,
    companyId: effectiveComp,
    estimateNumber,
    services: estimateData.services || [],
    status: estimateData.status || "Sent",
  }

  const updated = [newEst, ...current.filter(e => e.id !== nextId)]
  await saveModuleDataToDB("estimates", updated, effectiveComp)
  return newEst
}

export const updateEstimateStatus = async (id: string, status: EstimateStatus, extra?: { revisionNote?: string; acceptedAt?: string }, companyId?: string): Promise<EstimateItem> => {
  const strId = String(id).toLowerCase().trim()
  const current = await getEstimates(companyId)
  const idx = current.findIndex(e => String(e.id).toLowerCase().trim() === strId)
  if (idx === -1) throw new Error("Estimate not found")

  current[idx] = { 
    ...current[idx], 
    status,
    ...(extra || {})
  }
  await saveModuleDataToDB("estimates", current, companyId)
  return { ...current[idx] }
}

export const deleteEstimate = async (id: string, companyId?: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "estimates")
  const current = await getEstimates(companyId)
  const filtered = current.filter(e => String(e.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("estimates", filtered, companyId)
  return true
}
