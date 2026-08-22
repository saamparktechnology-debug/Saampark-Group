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
  createdAdmin?: string
  acceptedAt?: string
  revisionNote?: string
}

export const getEstimates = async (): Promise<EstimateItem[]> => {
  const data = await fetchModuleDataFromDB<EstimateItem[]>("estimates", [])
  return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
}

export const addEstimate = async (estimateData: Omit<EstimateItem, "id" | "estimateNumber"> & { id?: string; estimateNumber?: string }): Promise<EstimateItem> => {
  const current = await getEstimates()
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
    estimateNumber,
    services: estimateData.services || [],
    status: estimateData.status || "Sent",
  }

  const updated = [newEst, ...current.filter(e => e.id !== nextId)]
  await saveModuleDataToDB("estimates", updated)
  return newEst
}

export const updateEstimateStatus = async (id: string, status: EstimateStatus, extra?: { revisionNote?: string; acceptedAt?: string }): Promise<EstimateItem> => {
  const strId = String(id).toLowerCase().trim()
  const current = await getEstimates()
  const idx = current.findIndex(e => String(e.id).toLowerCase().trim() === strId)
  if (idx === -1) throw new Error("Estimate not found")

  current[idx] = { 
    ...current[idx], 
    status,
    ...(extra || {})
  }
  await saveModuleDataToDB("estimates", current)
  return { ...current[idx] }
}

export const deleteEstimate = async (id: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "estimates")
  const current = await getEstimates()
  const filtered = current.filter(e => String(e.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("estimates", filtered)
  return true
}
