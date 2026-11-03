import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { recordActivityLog } from "@/services/activityLogService"
import { normalizeCompanyId } from "@/app/feature/leads/services/leadService"

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
  clientAccepted?: boolean
  acceptedBy?: string
  clientAcceptNotes?: string
  revisionNote?: string
}

export const normalizeEstimate = (raw: any): EstimateItem => {
  const num = raw.estimateNumber || raw.estimate_number || raw.number || `EST #${raw.id}`
  const clientName = raw.client || raw.customer || raw.customer_name || 'Client'
  const total = Number(raw.totalAmount || raw.total) || 0
  const sub = Number(raw.subtotal) || 0
  const rawServices = raw.services || raw.items || []
  const services: EstimateServiceItem[] = Array.isArray(rawServices) && rawServices.length > 0
    ? rawServices.map((s: any, idx: number) => ({
        id: String(s.id || `s_${idx}`),
        name: s.name || s.serviceName || s.description || 'Service',
        description: s.description || '',
        quantity: Number(s.quantity || s.qty || 1),
        unitPrice: Number(s.unitPrice || s.unit_price || s.rate || 0),
        total: Number(s.total || s.totalAmount || 0) || (Number(s.quantity || s.qty || 1) * Number(s.unitPrice || s.unit_price || s.rate || 0))
      }))
    : [{ id: 's_1', name: raw.title || 'Professional Services', quantity: 1, unitPrice: sub || total, total: sub || total }]

  return {
    id: String(raw.id),
    estimateNumber: num,
    client: clientName,
    clientEmail: raw.clientEmail || raw.customerEmail || raw.customer_email || '',
    title: raw.title || raw.project || 'Project Estimate',
    date: raw.date || new Date().toLocaleDateString('en-GB'),
    validUntil: raw.validUntil || raw.validTill || new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB'),
    services,
    subtotal: sub,
    gstRate: Number(raw.gstRate || raw.tax_percent || 18),
    gstAmount: Number(raw.gstAmount || raw.tax_amount || raw.tax || 0),
    totalAmount: total,
    formattedTotal: raw.formattedTotal || `₹${total.toLocaleString('en-IN')}`,
    status: (raw.status as EstimateStatus) || 'Draft',
    notes: raw.notes || '',
    companyId: normalizeCompanyId(raw.companyId || raw.company_id || 'tech'),
    branchId: raw.branchId || raw.branch_id,
    branchName: raw.branchName || raw.branch_name,
    acceptedAt: raw.acceptedAt,
    clientAccepted: Boolean(raw.clientAccepted || raw.status === 'Accepted'),
    acceptedBy: raw.acceptedBy,
    revisionNote: raw.revisionNote
  }
}

export const getEstimates = async (companyId?: string): Promise<EstimateItem[]> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }

  const map = new Map<string, EstimateItem>()

  // 1. Fetch from backend API
  try {
    const { EstimateService } = await import("@/services/salesService")
    const apiList = await EstimateService.getAll({ company_id: targetComp }).catch(() => [])
    if (Array.isArray(apiList)) {
      for (const item of apiList) {
        if (item && item.id) {
          const norm = normalizeEstimate(item)
          map.set(String(norm.id).toLowerCase().trim(), norm)
        }
      }
    }
  } catch {}

  // 2. Fetch from DB storage
  if (!targetComp || targetComp === "all") {
    const known = ["all", "tech", "consultancy", "print"]
    const results = await Promise.all(
      known.map(c => fetchModuleDataFromDB<EstimateItem[]>("estimates", [], c).catch(() => []))
    )
    for (const list of results) {
      for (const e of (Array.isArray(list) ? list : [])) {
        if (e && e.id) {
          const id = String(e.id).toLowerCase().trim()
          if (!map.has(id)) {
            map.set(id, normalizeEstimate({ ...e, companyId: normalizeCompanyId(e.companyId) }))
          }
        }
      }
    }
    return filterGlobalDeletedItems(Array.from(map.values()))
  }

  const canonicalTarget = normalizeCompanyId(targetComp)
  const toFetch = [canonicalTarget]
  if (canonicalTarget === "consultancy") toFetch.push("print")

  const [allMaster, ...scopedResults] = await Promise.all([
    fetchModuleDataFromDB<EstimateItem[]>("estimates", [], "all").catch(() => []),
    ...toFetch.map(c => fetchModuleDataFromDB<EstimateItem[]>("estimates", [], c).catch(() => []))
  ])

  for (const res of scopedResults) {
    for (const e of (Array.isArray(res) ? res : [])) {
      if (e && e.id) {
        const id = String(e.id).toLowerCase().trim()
        if (!map.has(id)) {
          map.set(id, normalizeEstimate({ ...e, companyId: canonicalTarget }))
        }
      }
    }
  }

  for (const e of (Array.isArray(allMaster) ? allMaster : [])) {
    if (e && e.id && normalizeCompanyId(e.companyId) === canonicalTarget) {
      const id = String(e.id).toLowerCase().trim()
      if (!map.has(id)) {
        map.set(id, normalizeEstimate({ ...e, companyId: canonicalTarget }))
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
  const effectiveComp = normalizeCompanyId(targetComp || "tech")

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

  // Also sync to backend API in background
  try {
    const { EstimateService } = await import("@/services/salesService")
    EstimateService.create({
      id: nextId,
      number: estimateNumber,
      estimate_number: estimateNumber,
      estimateNumber,
      customer: newEst.client,
      client: newEst.client,
      customerEmail: newEst.clientEmail,
      clientEmail: newEst.clientEmail,
      title: newEst.title,
      project: newEst.title,
      subtotal: newEst.subtotal,
      tax: newEst.gstAmount,
      total: newEst.totalAmount,
      totalAmount: newEst.totalAmount,
      formattedTotal: newEst.formattedTotal,
      date: newEst.date,
      validUntil: newEst.validUntil,
      status: newEst.status,
      items: newEst.services,
      services: newEst.services,
      companyId: effectiveComp,
      branchId: newEst.branchId,
      notes: newEst.notes,
    }).catch(() => {})
  } catch {}

  const updated = [newEst, ...current.filter(e => e.id !== nextId)]
  const currentAll = await fetchModuleDataFromDB<EstimateItem[]>("estimates", [], "all").catch(() => [])
  const updatedAll = [newEst, ...(Array.isArray(currentAll) ? currentAll.filter(e => e.id !== nextId) : [])]

  await Promise.all([
    saveModuleDataToDB("estimates", updated, effectiveComp),
    saveModuleDataToDB("estimates", updatedAll, "all"),
  ]).catch(() => {})

  recordActivityLog({
    type: "estimate",
    module: "Estimates",
    action: "Quotation Generated",
    description: `Quotation / Estimate ${newEst.estimateNumber} issued for ${newEst.client} (${newEst.formattedTotal})`,
    companyId: newEst.companyId,
    branchId: newEst.branchId,
    branchName: newEst.branchName,
    details: `Title: ${newEst.title || "Services"} | Total: ${newEst.formattedTotal}`
  }).catch(() => {})

  return newEst
}

export const updateEstimateStatus = async (
  id: string, 
  status: EstimateStatus, 
  extra?: { revisionNote?: string; acceptedAt?: string; clientAccepted?: boolean; acceptedBy?: string; clientAcceptNotes?: string }, 
  companyId?: string
): Promise<EstimateItem> => {
  const strId = String(id).toLowerCase().trim()
  const targetComp = normalizeCompanyId(companyId || "tech")
  const current = await getEstimates(targetComp)
  const idx = current.findIndex(e => String(e.id).toLowerCase().trim() === strId)
  if (idx === -1) throw new Error("Estimate not found")

  current[idx] = { 
    ...current[idx], 
    status,
    ...(status === "Accepted" ? { clientAccepted: true } : {}),
    ...(extra || {})
  }

  const currentAll = await fetchModuleDataFromDB<EstimateItem[]>("estimates", [], "all").catch(() => [])
  const allIdx = currentAll.findIndex(e => String(e.id).toLowerCase().trim() === strId)
  if (allIdx !== -1) {
    currentAll[allIdx] = { ...currentAll[allIdx], ...current[idx] }
  }

  await Promise.all([
    saveModuleDataToDB("estimates", current, targetComp),
    saveModuleDataToDB("estimates", currentAll, "all"),
  ]).catch(() => {})

  recordActivityLog({
    type: "estimate",
    module: "Estimates",
    action: `Estimate ${status}`,
    description: `Quotation / Estimate ${current[idx].estimateNumber} status changed to ${status}`,
    companyId: current[idx].companyId || companyId,
    branchId: current[idx].branchId,
    branchName: current[idx].branchName,
  }).catch(() => {})

  return { ...current[idx] }
}

export const deleteEstimate = async (id: string, companyId?: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "estimates")
  const current = await getEstimates(companyId)
  const target = current.find(e => String(e.id).toLowerCase().trim() === strId)
  const filtered = current.filter(e => String(e.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("estimates", filtered, companyId)

  recordActivityLog({
    type: "estimate",
    module: "Estimates",
    action: "Estimate Deleted",
    description: `Estimate ${target?.estimateNumber || strId} deleted from system`,
    companyId: target?.companyId || companyId,
  }).catch(() => {})

  return true
}

