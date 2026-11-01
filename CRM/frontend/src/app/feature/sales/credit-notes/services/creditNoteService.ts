"use client"

import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { recordActivityLog } from "@/services/activityLogService"
import { normalizeCompanyId } from "@/app/feature/leads/services/leadService"

export interface CreditNoteItem {
  id: string
  creditNoteNumber: string
  invoiceNumber: string
  client: string
  clientEmail?: string
  date: string
  amount: number
  originalAmount?: number
  reason: string
  status: "Issued" | "Applied" | "Void"
  companyId?: string
  branchId?: string
  appliedToInvoice?: string
  appliedAt?: string
  isOverpayment?: boolean
  createdAt?: number
}

const DEFAULT_CREDIT_NOTES: CreditNoteItem[] = [
  {
    id: "cn_1",
    creditNoteNumber: "CN-2026-001",
    invoiceNumber: "INV-101",
    client: "Acme Global Solutions",
    clientEmail: "billing@acmeglobal.com",
    date: "12-09-2026",
    amount: 15000,
    originalAmount: 15000,
    reason: "Pre-payment adjustment for server milestone SLA rebate",
    status: "Issued",
    companyId: "tech",
    createdAt: Date.now() - 86400000 * 20
  },
  {
    id: "cn_2",
    creditNoteNumber: "CN-2026-002",
    invoiceNumber: "INV-104",
    client: "Nexus Enterprise Ltd",
    clientEmail: "accounts@nexus.com",
    date: "10-09-2026",
    amount: 8500,
    originalAmount: 8500,
    reason: "Service discount concession applied after scope optimization",
    status: "Applied",
    companyId: "tech",
    createdAt: Date.now() - 86400000 * 30
  }
]

export const generateCreditNoteNumber = (): string => {
  const d = new Date()
  const year = d.getFullYear()
  const rand = Math.floor(100 + Math.random() * 900)
  return `CN-${year}-${rand}`
}

/**
 * Fetch all credit notes for a company or all companies
 */
export const getCreditNotes = async (companyId?: string): Promise<CreditNoteItem[]> => {
  const scope = companyId || "all"
  if (scope !== "all") {
    const canonical = normalizeCompanyId(scope)
    const toFetch = [canonical]
    if (canonical === "consultancy") toFetch.push("print")
    const seed = canonical === "tech" ? DEFAULT_CREDIT_NOTES : []

    const [allData, ...scopedResults] = await Promise.all([
      fetchModuleDataFromDB<CreditNoteItem[]>("credit_notes", [], "all").catch(() => []),
      ...toFetch.map(c => fetchModuleDataFromDB<CreditNoteItem[]>("credit_notes", seed, c).catch(() => seed))
    ])

    const map = new Map<string, CreditNoteItem>()
    for (const res of scopedResults) {
      for (const item of (Array.isArray(res) ? res : [])) {
        if (item && item.id) map.set(String(item.id).toLowerCase().trim(), { ...item, companyId: canonical })
      }
    }
    for (const item of (Array.isArray(allData) ? allData : [])) {
      if (item && item.id && normalizeCompanyId(item.companyId) === canonical) {
        const id = String(item.id).toLowerCase().trim()
        if (!map.has(id)) map.set(id, { ...item, companyId: canonical })
      }
    }

    const list = Array.from(map.values())
    return filterGlobalDeletedItems(list, undefined, "credit_notes").sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }

  // All scope
  const known = ["all", "tech", "consultancy", "print"]
  const results = await Promise.all(
    known.map(c => fetchModuleDataFromDB<CreditNoteItem[]>("credit_notes", c === "tech" ? DEFAULT_CREDIT_NOTES : [], c).catch(() => []))
  )
  const map = new Map<string, CreditNoteItem>()
  for (const list of results) {
    for (const item of (Array.isArray(list) ? list : [])) {
      if (item && item.id) {
        const id = String(item.id).toLowerCase().trim()
        if (!map.has(id)) map.set(id, { ...item, companyId: normalizeCompanyId(item.companyId) })
      }
    }
  }
  return filterGlobalDeletedItems(Array.from(map.values()), undefined, "credit_notes").sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

/**
 * Create a new Credit Note and persist it to MySQL DB
 */
export const createCreditNote = async (
  data: Partial<CreditNoteItem>,
  companyId?: string
): Promise<CreditNoteItem> => {
  const effComp = normalizeCompanyId(companyId || data.companyId || "tech")
  const current = await getCreditNotes(effComp)
  
  const id = data.id || `cn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  const num = data.creditNoteNumber || generateCreditNoteNumber()
  const todayStr = new Date().toLocaleDateString("en-GB").replace(/\//g, "-")

  const newNote: CreditNoteItem = {
    id,
    creditNoteNumber: num,
    invoiceNumber: data.invoiceNumber || "N/A",
    client: data.client || "Client",
    clientEmail: data.clientEmail || "",
    date: data.date || todayStr,
    amount: Number(data.amount) || 0,
    originalAmount: Number(data.originalAmount || data.amount) || 0,
    reason: data.reason || "Credit Adjustment",
    status: data.status || "Issued",
    companyId: effComp,
    branchId: data.branchId || undefined,
    isOverpayment: Boolean(data.isOverpayment),
    appliedToInvoice: data.appliedToInvoice || undefined,
    createdAt: Date.now()
  }

  const updatedScoped = [newNote, ...current.filter(c => c.id !== id)]
  const currentAll = await fetchModuleDataFromDB<CreditNoteItem[]>("credit_notes", [], "all").catch(() => [])
  const updatedAll = [newNote, ...currentAll.filter(c => c.id !== id)]

  await Promise.all([
    saveModuleDataToDB("credit_notes", updatedScoped, effComp),
    saveModuleDataToDB("credit_notes", updatedAll, "all"),
  ]).catch(() => {})

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_credit_notes_updated"))
  }

  recordActivityLog({
    type: "invoice",
    module: "Credit Notes",
    action: "Credit Note Issued",
    description: `Credit Note #${newNote.creditNoteNumber} (₹${newNote.amount.toLocaleString("en-IN")}) issued for ${newNote.client}`,
    companyId: effComp,
    branchId: newNote.branchId,
    details: `Invoice: ${newNote.invoiceNumber} | Reason: ${newNote.reason}`
  }).catch(() => {})

  return newNote
}

/**
 * Update an existing Credit Note
 */
export const updateCreditNote = async (
  id: string,
  updates: Partial<CreditNoteItem>,
  companyId?: string
): Promise<CreditNoteItem | null> => {
  const effComp = companyId || "all"
  const allNotes = await getCreditNotes("all")
  const idx = allNotes.findIndex(n => n.id === id || n.creditNoteNumber === id)
  if (idx === -1) return null

  const updatedNote: CreditNoteItem = {
    ...allNotes[idx],
    ...updates
  }

  allNotes[idx] = updatedNote
  await saveModuleDataToDB("credit_notes", allNotes, "all")

  const targetComp = updatedNote.companyId || effComp
  if (targetComp !== "all") {
    const scopedNotes = await getCreditNotes(targetComp)
    const scopedIdx = scopedNotes.findIndex(n => n.id === id || n.creditNoteNumber === id)
    if (scopedIdx !== -1) {
      scopedNotes[scopedIdx] = updatedNote
    } else {
      scopedNotes.unshift(updatedNote)
    }
    await saveModuleDataToDB("credit_notes", scopedNotes, targetComp)
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_credit_notes_updated"))
  }

  return updatedNote
}

/**
 * Delete a Credit Note
 */
export const deleteCreditNote = async (id: string, companyId?: string): Promise<boolean> => {
  await markGlobalItemDeleted(id, "credit_notes")
  const allNotes = await getCreditNotes("all")
  const filteredAll = allNotes.filter(n => n.id !== id && n.creditNoteNumber !== id)
  await saveModuleDataToDB("credit_notes", filteredAll, "all")

  if (companyId && companyId !== "all") {
    const scopedNotes = await getCreditNotes(companyId)
    const filteredScoped = scopedNotes.filter(n => n.id !== id && n.creditNoteNumber !== id)
    await saveModuleDataToDB("credit_notes", filteredScoped, companyId)
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_credit_notes_updated"))
  }

  return true
}

/**
 * Query available (unapplied/issued) credit notes for a specific client
 */
export const getAvailableCreditForClient = async (
  clientName: string,
  companyId?: string
): Promise<{ totalAvailableCredit: number; notes: CreditNoteItem[] }> => {
  if (!clientName || !clientName.trim()) {
    return { totalAvailableCredit: 0, notes: [] }
  }

  const cleanName = clientName.toLowerCase().trim()
  const allNotes = await getCreditNotes(companyId || "all")

  // Find all active/issued credit notes belonging to this client with positive amount
  const matchingNotes = allNotes.filter(n => {
    const matchClient = (n.client || "").toLowerCase().trim() === cleanName
    const isActive = n.status === "Issued" && Number(n.amount) > 0
    return matchClient && isActive
  })

  const total = matchingNotes.reduce((sum, n) => sum + (Number(n.amount) || 0), 0)

  return {
    totalAvailableCredit: total,
    notes: matchingNotes
  }
}

/**
 * Deduct/Apply credit amount against an invoice
 * Updates the client's credit notes in DB, marking used ones as 'Applied'
 */
export const applyCreditNoteDeduction = async (
  clientName: string,
  deductAmount: number,
  invoiceNumber: string,
  companyId?: string
): Promise<{ deducted: number; usedNotes: CreditNoteItem[] }> => {
  if (deductAmount <= 0) return { deducted: 0, usedNotes: [] }

  const { notes } = await getAvailableCreditForClient(clientName, companyId)
  if (notes.length === 0) return { deducted: 0, usedNotes: [] }

  let remainingToDeduct = deductAmount
  const usedNotes: CreditNoteItem[] = []
  const todayStr = new Date().toLocaleDateString("en-GB").replace(/\//g, "-")

  for (const note of notes) {
    if (remainingToDeduct <= 0) break
    const currentNoteAmt = Number(note.amount) || 0
    if (currentNoteAmt <= 0) continue

    if (currentNoteAmt <= remainingToDeduct) {
      // Entire credit note is consumed
      remainingToDeduct -= currentNoteAmt
      const updated = await updateCreditNote(note.id, {
        status: "Applied",
        amount: 0,
        appliedToInvoice: invoiceNumber,
        appliedAt: todayStr,
        reason: `${note.reason} (Applied ₹${currentNoteAmt.toLocaleString("en-IN")} to ${invoiceNumber})`
      }, companyId)
      if (updated) usedNotes.push(updated)
    } else {
      // Partially consumed
      const newBalance = currentNoteAmt - remainingToDeduct
      const appliedPart = remainingToDeduct
      remainingToDeduct = 0
      
      const updated = await updateCreditNote(note.id, {
        amount: newBalance,
        reason: `${note.reason} (₹${appliedPart.toLocaleString("en-IN")} applied to ${invoiceNumber}, balance ₹${newBalance.toLocaleString("en-IN")})`
      }, companyId)
      if (updated) usedNotes.push(updated)
    }
  }

  const totalDeducted = deductAmount - remainingToDeduct

  recordActivityLog({
    type: "invoice",
    module: "Credit Notes",
    action: "Credit Note Applied",
    description: `Credit of ₹${totalDeducted.toLocaleString("en-IN")} applied to Invoice #${invoiceNumber} for ${clientName}`,
    companyId: companyId || "tech",
    details: `Used Notes: ${usedNotes.map(u => u.creditNoteNumber).join(", ")}`
  }).catch(() => {})

  return {
    deducted: totalDeducted,
    usedNotes
  }
}

/**
 * Automatically create a Credit Note when a customer pays more than the due amount
 */
export const createCreditNoteFromOverpayment = async (
  invoice: {
    id: string
    client: string
    clientEmail?: string
    companyId?: string
    branchId?: string
  },
  overpaidAmount: number
): Promise<CreditNoteItem> => {
  const num = generateCreditNoteNumber()
  const todayStr = new Date().toLocaleDateString("en-GB").replace(/\//g, "-")

  const notePayload: Partial<CreditNoteItem> = {
    creditNoteNumber: num,
    invoiceNumber: invoice.id,
    client: invoice.client,
    clientEmail: invoice.clientEmail || "",
    date: todayStr,
    amount: overpaidAmount,
    originalAmount: overpaidAmount,
    reason: `Automatic Credit Note: Customer overpayment of ₹${overpaidAmount.toLocaleString("en-IN")} on Invoice #${invoice.id}`,
    status: "Issued",
    companyId: invoice.companyId || "tech",
    branchId: invoice.branchId,
    isOverpayment: true,
  }

  return await createCreditNote(notePayload, invoice.companyId)
}
