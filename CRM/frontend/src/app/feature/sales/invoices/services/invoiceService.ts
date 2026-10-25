import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems, getLocalDeletedIds } from "@/lib/storageSync"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"
import { sendPaymentReceiptEmailNotification, sendPaymentDueReminderEmailNotification } from "@/services/emailNotificationService"
import { recordActivityLog } from "@/services/activityLogService"

export type InvoiceStatus = "Draft" | "Partially paid" | "Fully paid" | "Not paid" | "Credited" | "Payment Pending" | "Pending Approval" | "Rejected"

export interface InvoiceLineCharge {
  id: string
  name: string
  amount: number
}

export interface InvoiceLineItem {
  id: string
  serviceName: string
  description?: string
  sacCode?: string
  qty: number
  unit: string
  rate: number
  charges?: InvoiceLineCharge[]
  gstRate: number
  gstAmount: number
  totalAmount: number
}

export interface AppliedDiscount {
  id: string
  name: string
  amount: number
}

export interface AssignedMemberAttribution {
  memberId: string
  memberName: string
  memberRole?: string
  memberAvatar?: string
  payoutType: "percentage" | "fixed"
  payoutValue: number
  sharePct?: number
  payoutAmount?: number
}

export interface InvoiceItem {
  id: string
  client: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  clientCity?: string
  clientState?: string
  clientGstin?: string
  clientId?: string
  project: string
  invoiceType?: "gst" | "nongst"
  companyName?: string
  notes?: string
  terms?: string
  billDate: string
  invoiceDate?: string
  billTime?: string
  createdAt?: number | string
  dueDate: string
  baseAmount?: number
  setupCharge?: number
  discount?: number
  gstRate?: number
  gstAmount?: number
  totalInvoiced: string
  paymentReceived: string
  due: string
  status: InvoiceStatus
  approvalStatus?: "pending" | "approved" | "rejected"
  rejectionReason?: string
  billedBy?: string
  lastReminderSent?: string
  companyId?: string
  branchId?: string
  branchName?: string
  branchCode?: string
  subBranchId?: string
  subBranchName?: string
  subBranchCode?: string
  subBranchSharePct?: number
  subBranchPayoutType?: "percentage" | "fixed"
  subBranchShareAmount?: number
  assignedMembers?: AssignedMemberAttribution[]
  assignedMemberId?: string
  assignedMemberName?: string
  assignedMemberRole?: string
  assignedMemberAvatar?: string
  memberPayoutType?: "percentage" | "fixed"
  memberPayoutValue?: number
  memberPayoutAmount?: number
  memberSharePct?: number
  createdByName?: string
  createdByRole?: string
  items?: InvoiceLineItem[]
  discountsList?: AppliedDiscount[]
  companyDetails?: any
  overrideBankDetails?: any
  overrideLogoUrl?: string
  overrideSignatureUrl?: string
  overrideStampUrl?: string
  logoPosition?: { x: number; y: number }
  signaturePosition?: { x: number; y: number }
  customStamps?: any[]
}

export const INITIAL_INVOICES: InvoiceItem[] = []

export const parseInvoiceDate = (val: any): Date => {
  if (!val) return new Date()
  if (val instanceof Date && !isNaN(val.getTime())) return val
  if (typeof val === "number") return new Date(val)
  if (typeof val === "string") {
    const s = val.trim()
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const parts = s.split("-")
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2].slice(0, 2)))
      if (!isNaN(d.getTime())) return d
    }
    // DD/MM/YYYY or DD-MM-YYYY
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(s)) {
      const parts = s.split(/[\/\-]/)
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
      if (!isNaN(d.getTime())) return d
    }
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d
  }
  return new Date()
}

export const generateInvoiceNumber = (
  existingInvoices: InvoiceItem[] = [], 
  dateObj: Date | string = new Date(),
  isNonGst: boolean = false
): string => {
  const parsedDate = typeof dateObj === "string" ? parseInvoiceDate(dateObj) : (isNaN(dateObj.getTime()) ? new Date() : dateObj)
  const d = String(parsedDate.getDate()).padStart(2, "0")
  const m = String(parsedDate.getMonth() + 1).padStart(2, "0")
  const y = String(parsedDate.getFullYear())
  const dateStr = `${d}${m}${y}`

  // Standard serial format: inv(date)001 for GST, ng(date)001 for Non-GST
  const prefix = isNonGst ? `NG${dateStr}` : `INV${dateStr}`
  const legacyPrefix = isNonGst ? `NGINV-${dateStr}-` : `INV-${dateStr}-`
  const legacyHyphen = isNonGst ? `NG-${dateStr}-` : `INV-${dateStr}-`

  const deletedIds = getLocalDeletedIds()

  let maxSeq = 0
  const allExisting = [...existingInvoices]

  const checkCandidate = (rawId: any) => {
    if (!rawId) return
    const cleanId = String(rawId).trim().toUpperCase()
    if (cleanId.startsWith(prefix)) {
      const suffix = cleanId.substring(prefix.length).replace(/^-/, "")
      const num = parseInt(suffix, 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    } else if (cleanId.startsWith(legacyPrefix)) {
      const suffix = cleanId.substring(legacyPrefix.length)
      const num = parseInt(suffix, 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    } else if (cleanId.startsWith(legacyHyphen)) {
      const suffix = cleanId.substring(legacyHyphen.length)
      const num = parseInt(suffix, 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    }
  }

  for (const inv of allExisting) {
    if (inv && inv.id) checkCandidate(inv.id)
    if (inv && (inv as any).invoice_number) checkCandidate((inv as any).invoice_number)
  }

  // Also check deleted IDs so invoice sequence never collides with a previously deleted ID
  for (const delId of deletedIds) {
    checkCandidate(delId)
  }

  const nextSeq = maxSeq + 1
  const seqStr = String(nextSeq).padStart(3, "0")
  return `${prefix}${seqStr}`
}

export function parseCurrencyNumber(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val
  if (!val) return 0
  const cleaned = String(val).replace(/[^0-9.-]/g, "")
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : Math.round(parsed)
}

export function parseInvoiceDateTimestamp(dateStr?: string): number | null {
  if (!dateStr || dateStr === "-" || dateStr === "") return null
  const dmy = String(dateStr).trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (dmy) {
    return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])).getTime()
  }
  const ymd = String(dateStr).trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (ymd) {
    return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])).getTime()
  }
  const parsed = Date.parse(dateStr)
  return isNaN(parsed) ? null : parsed
}

export function isInvoiceOverdue(invoice: InvoiceItem): boolean {
  if (!invoice.dueDate || invoice.status === "Fully paid" || invoice.status === "Credited") {
    return false
  }
  const dueAmt = parseCurrencyNumber(invoice.due || invoice.totalInvoiced)
  if (dueAmt <= 0) return false

  const dueTime = parseInvoiceDateTimestamp(invoice.dueDate)
  if (!dueTime) return false

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  return dueTime < todayStart.getTime()
}

export function getInvoiceDaysOverdue(dueDateStr?: string): number {
  if (!dueDateStr) return 0
  const dueTime = parseInvoiceDateTimestamp(dueDateStr)
  if (!dueTime) return 0
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const diffMs = todayStart.getTime() - dueTime
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export const getInvoices = async (companyId?: string): Promise<InvoiceItem[]> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }

  const defaultCompanies = [
    "all", "tech", "infotech", "fashion", "digital", "consultancy", 
    "jewellers", "saampark-ai-solutions", "print", "print-space", "saampark-print-space"
  ]
  let dynamicCompanies: string[] = []
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      const storeComps = useAuthStore.getState().companies || []
      dynamicCompanies = storeComps.flatMap((c: any) => [c.id, c.slug]).filter(Boolean)
    } catch {}
  }
  const allKnown = Array.from(new Set([...defaultCompanies, ...dynamicCompanies]))

  if (!targetComp || targetComp === "all") {
    const results = await Promise.all(
      allKnown.map(c => fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], c).catch(() => []))
    )
    const map = new Map<string, InvoiceItem>()
    for (const list of results) {
      for (const inv of (Array.isArray(list) ? list : [])) {
        if (inv && inv.id) map.set(String(inv.id).toUpperCase().trim(), inv)
      }
    }
    return filterGlobalDeletedItems(Array.from(map.values()))
  }

  const { isMatchingCompany } = await import("@/store/useAuthStore")
  // Query all known to guarantee cross-company or alias invoices are never missed
  const results = await Promise.all(
    allKnown.map(c => fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], c).catch(() => []))
  )

  const map = new Map<string, InvoiceItem>()
  for (const list of results) {
    for (const inv of (Array.isArray(list) ? list : [])) {
      if (inv && inv.id) {
        const invComp = inv.companyId || (inv as any).company || "tech"
        if (isMatchingCompany({ id: invComp, slug: invComp } as any, targetComp)) {
          map.set(String(inv.id).toUpperCase().trim(), inv)
        }
      }
    }
  }

  return filterGlobalDeletedItems(Array.from(map.values()))
}

export const addInvoice = async (invoice: Omit<InvoiceItem, "id"> & { id?: string }, companyId?: string): Promise<InvoiceItem> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  const effectiveComp = (!targetComp || targetComp === "all") ? "tech" : targetComp

  // Fetch scoped and all in parallel for instant execution
  const [currentScoped, currentAll] = await Promise.all([
    fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], effectiveComp).catch(() => []),
    fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], "all").catch(() => [])
  ])

  const deletedIds = getLocalDeletedIds()
  let nextId = (invoice.id || "").trim()

  // If no ID provided or if requested ID already exists or is in deleted list, calculate next unique ID
  if (
    !nextId || 
    currentAll.some(i => String(i.id).toUpperCase().trim() === nextId.toUpperCase()) ||
    deletedIds.includes(nextId.toLowerCase().trim())
  ) {
    const hasItemGst = Array.isArray(invoice.items) && invoice.items.length > 0
      ? invoice.items.some(it => (Number(it.gstRate) || 0) > 0 || (Number(it.gstAmount) || 0) > 0)
      : false
    const isGst = Boolean(
      hasItemGst ||
      (typeof invoice.gstRate === "number" && invoice.gstRate > 0) ||
      (typeof invoice.gstAmount === "number" && invoice.gstAmount > 0)
    )
    const billDateObj = parseInvoiceDate(invoice.billDate || invoice.invoiceDate)
    nextId = generateInvoiceNumber(currentAll, billDateObj, !isGst)
  }

  let activeBranch: string | undefined = undefined
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      activeBranch = useAuthStore.getState().activeBranchId || useAuthStore.getState().user?.branchId || undefined
    } catch {}
  }

  let currentUser: any = null
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      currentUser = useAuthStore.getState().user
    } catch {}
  }
  const isTeamMember = currentUser && String(currentUser.role || "").toLowerCase().trim().includes("team")
  const approvalStatus: "pending" | "approved" | "rejected" = invoice.approvalStatus || (isTeamMember ? "pending" : "approved")
  const invoiceStatus = (isTeamMember && approvalStatus === "pending") ? "Pending Approval" : (invoice.status || "Not paid")

  const newInvoice: InvoiceItem = { 
    ...invoice, 
    id: nextId,
    billTime: invoice.billTime || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    createdAt: invoice.createdAt || new Date().toISOString(),
    companyId: effectiveComp,
    branchId: invoice.branchId || activeBranch || undefined,
    status: invoiceStatus,
    approvalStatus,
  }

  if (isTeamMember && approvalStatus === "pending") {
    try {
      const { submitForApproval } = require("@/services/approvalService")
      const rawAmt = invoice.baseAmount || parseInt(String(invoice.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
      submitForApproval({
        type: "invoice",
        title: `Bill #${nextId} for ${newInvoice.client}`,
        documentNumber: nextId,
        documentId: nextId,
        clientName: newInvoice.client,
        clientEmail: newInvoice.clientEmail,
        amount: rawAmt,
        submittedBy: {
          id: String(currentUser.id || ""),
          name: currentUser.name || "Team Member",
          email: currentUser.email || "",
          role: currentUser.role || "Teams",
        },
        companyId: effectiveComp,
        branchId: newInvoice.branchId,
        branchName: newInvoice.branchName,
        dataSnapshot: newInvoice,
      }).catch(() => {})
    } catch {}
  }

  const updatedScoped = [newInvoice, ...(Array.isArray(currentScoped) ? currentScoped.filter(i => String(i.id).toUpperCase().trim() !== nextId.toUpperCase().trim()) : [])]
  const updatedAll = [newInvoice, ...(Array.isArray(currentAll) ? currentAll.filter(i => String(i.id).toUpperCase().trim() !== nextId.toUpperCase().trim()) : [])]

  // Parallel non-blocking saves across target databases
  const saveTasks: Promise<any>[] = [
    saveModuleDataToDB("invoices", updatedScoped, effectiveComp),
    saveModuleDataToDB("invoices", updatedAll, "all"),
  ]

  await Promise.all(saveTasks)

  // Automatically ensure client user account exists and sync client directory
  if (newInvoice.clientEmail) {
    try {
      const { recordUserAccountAsync } = await import("@/app/feature/users/services/userService")
      recordUserAccountAsync({
        name: newInvoice.client,
        email: newInvoice.clientEmail,
        role: "Clients",
        companyId: effectiveComp,
        companyIds: [effectiveComp],
        branchId: newInvoice.branchId,
        branchName: newInvoice.branchName,
        status: "Active",
      }, false).catch(() => {})
    } catch {}

    try {
      const allClients = await getClients()
      const existingClient = allClients.find(
        c => (c.email && c.email.toLowerCase().trim() === newInvoice.clientEmail?.toLowerCase().trim()) ||
             (c.name && c.name.toLowerCase().trim() === newInvoice.client.toLowerCase().trim())
      )
      if (existingClient) {
        const invAmt = parseCurrencyNumber(newInvoice.totalInvoiced)
        const recAmt = parseCurrencyNumber(newInvoice.paymentReceived)
        const dueAmt = parseCurrencyNumber(newInvoice.due)

        const curInv = parseCurrencyNumber(existingClient.totalInvoiced)
        const curRec = parseCurrencyNumber(existingClient.paymentReceived)
        const curDue = parseCurrencyNumber(existingClient.due)

        saveStoredClient({
          ...existingClient,
          email: newInvoice.clientEmail,
          companyId: existingClient.companyId || effectiveComp,
          branchId: existingClient.branchId || newInvoice.branchId,
          branchName: existingClient.branchName || newInvoice.branchName,
          totalInvoiced: `₹${(curInv + invAmt).toLocaleString("en-IN")}`,
          paymentReceived: `₹${(curRec + recAmt).toLocaleString("en-IN")}`,
          due: `₹${(curDue + dueAmt).toLocaleString("en-IN")}`,
        }, effectiveComp).catch(() => {})
      }
    } catch {}
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_invoices_updated"))
    window.dispatchEvent(new CustomEvent("saampark_clients_updated"))
  }

  recordActivityLog({
    type: "invoice",
    module: "Invoices",
    action: "Tax Invoice Generated",
    description: `Tax Invoice #${newInvoice.id} issued for ${newInvoice.client} (${newInvoice.totalInvoiced})`,
    companyId: newInvoice.companyId,
    branchId: newInvoice.branchId,
    branchName: newInvoice.branchName,
    details: `Project: ${newInvoice.project || "General"} | Due Date: ${newInvoice.dueDate} | Total: ${newInvoice.totalInvoiced}`
  }).catch(() => {})

  return newInvoice
}



export const updateInvoice = async (
  updatedInvoice: InvoiceItem,
  companyId?: string
): Promise<InvoiceItem> => {
  const strId = String(updatedInvoice.id).toUpperCase().trim()
  const allInvoices = await getInvoices("all")
  const existingInv = allInvoices.find(i => String(i.id).toUpperCase().trim() === strId)

  const oldCompanyId = (existingInv?.companyId || companyId || "tech").toLowerCase().trim()
  const newCompanyId = (updatedInvoice.companyId || companyId || oldCompanyId).toLowerCase().trim()

  const finalInvoice: InvoiceItem = {
    ...existingInv,
    ...updatedInvoice,
    companyId: newCompanyId,
  }

  // Cross-Company Transfer
  if (newCompanyId !== oldCompanyId && oldCompanyId !== "all") {
    const oldList = await fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], oldCompanyId).catch(() => [])
    const filteredOld = oldList.filter(i => String(i.id).toUpperCase().trim() !== strId)
    await saveModuleDataToDB("invoices", filteredOld, oldCompanyId)

    const newList = await fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], newCompanyId).catch(() => [])
    const updatedNew = [finalInvoice, ...newList.filter(i => String(i.id).toUpperCase().trim() !== strId)]
    await saveModuleDataToDB("invoices", updatedNew, newCompanyId)
  } else {
    const targetComp = companyId || newCompanyId
    const currentList = await fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], targetComp).catch(() => [])
    const updatedList = [finalInvoice, ...currentList.filter(i => String(i.id).toUpperCase().trim() !== strId)]
    await saveModuleDataToDB("invoices", updatedList, targetComp)
  }

  // Update in "all"
  const updatedAll = [finalInvoice, ...allInvoices.filter(i => String(i.id).toUpperCase().trim() !== strId)]
  await saveModuleDataToDB("invoices", updatedAll, "all")

  // Update client billing stats
  try {
    const clients = await getClients(newCompanyId)
    const clientIdx = clients.findIndex(c => 
      (c.name && c.name.toLowerCase().trim() === (updatedInvoice.client || "").toLowerCase().trim()) ||
      (updatedInvoice.clientEmail && c.email && c.email.toLowerCase().trim() === updatedInvoice.clientEmail.toLowerCase().trim())
    )
    if (clientIdx !== -1) {
      const c = clients[clientIdx]
      const clientInvoices = updatedAll.filter((inv: InvoiceItem) => 
        (inv.client && inv.client.toLowerCase().trim() === c.name.toLowerCase().trim()) ||
        (inv.clientEmail && c.email && inv.clientEmail.toLowerCase().trim() === c.email.toLowerCase().trim())
      )
      const sumInvoiced = clientInvoices.reduce((sum: number, i: InvoiceItem) => sum + parseCurrencyNumber(i.totalInvoiced), 0)
      const sumReceived = clientInvoices.reduce((sum: number, i: InvoiceItem) => sum + parseCurrencyNumber(i.paymentReceived), 0)
      const sumDue = clientInvoices.reduce((sum: number, i: InvoiceItem) => sum + parseCurrencyNumber(i.due), 0)

      await saveStoredClient({
        ...c,
        totalInvoiced: `₹${sumInvoiced.toLocaleString("en-IN")}`,
        paymentReceived: `₹${sumReceived.toLocaleString("en-IN")}`,
        due: `₹${sumDue.toLocaleString("en-IN")}`,
      }, newCompanyId)
    }
  } catch (err) {
    console.warn("Error updating client balance after invoice update:", err)
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("saampark_invoices_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  return finalInvoice
}

export const checkAndSendOverdueReminders = async (
  companyId?: string
): Promise<{ dispatchedCount: number; overdueCount: number; overdueInvoices: InvoiceItem[] }> => {
  const invoices = await getInvoices(companyId)
  const overdueList = invoices.filter(isInvoiceOverdue)
  let dispatched = 0

  for (const inv of overdueList) {
    const lastSent = (inv as any).lastOverdueReminderSent 
      ? new Date((inv as any).lastOverdueReminderSent).getTime() 
      : 0
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    if (lastSent < oneDayAgo && inv.clientEmail) {
      try {
        await sendPaymentReminder(inv.id)
        await updateInvoice({
          ...inv,
          lastOverdueReminderSent: new Date().toISOString(),
        } as any, companyId)
        dispatched++
      } catch (err) {
        console.warn(`Could not dispatch overdue reminder for ${inv.id}:`, err)
      }
    }
  }

  return { dispatchedCount: dispatched, overdueCount: overdueList.length, overdueInvoices: overdueList }
}

export const updateInvoiceStatus = async (
  id: string, 
  status: InvoiceStatus, 
  paymentReceived?: string,
  due?: string,
  companyId?: string
): Promise<InvoiceItem | null> => {
  const current = await getInvoices(companyId)
  const strId = String(id).toUpperCase().trim()
  const idx = current.findIndex((i) => String(i.id).toUpperCase().trim() === strId)
  if (idx === -1) return null
  const target = current[idx]
  current[idx] = {
    ...target,
    status,
    paymentReceived: paymentReceived !== undefined ? paymentReceived : (status === "Fully paid" ? target.totalInvoiced : target.paymentReceived),
    due: due !== undefined ? due : (status === "Fully paid" ? "₹0" : target.due),
  }
  const targetComp = companyId || target.companyId || "all"
  await saveModuleDataToDB("invoices", current, targetComp)
  if (targetComp !== "all") {
    await saveModuleDataToDB("invoices", current, "all")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("storage"))
  }

  recordActivityLog({
    type: "invoice",
    module: "Invoices",
    action: `Invoice ${status}`,
    description: `Invoice #${current[idx].id} status changed to ${status} for ${current[idx].client}`,
    companyId: targetComp,
    branchId: current[idx].branchId,
    branchName: current[idx].branchName,
    details: `Total: ${current[idx].totalInvoiced} | Paid: ${current[idx].paymentReceived} | Due: ${current[idx].due}`
  }).catch(() => {})

  return current[idx]
}


export const recordPartialPayment = async (
  invoiceId: string,
  paidAmountNum: number,
  paymentMethod: string = "UPI / Net Banking",
  transactionRef: string = "",
  companyId?: string
): Promise<InvoiceItem | null> => {
  const current = await getInvoices(companyId)
  const strId = String(invoiceId).toUpperCase().trim()
  const idx = current.findIndex((i) => String(i.id).toUpperCase().trim() === strId)
  if (idx === -1) return null

  const target = current[idx]
  const prevReceivedNum = parseInt((target.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
  const totalInvoicedNum = parseInt((target.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
  
  const newReceivedNum = prevReceivedNum + paidAmountNum
  const newDueNum = Math.max(0, totalInvoicedNum - newReceivedNum)
  const isFullySettled = newDueNum <= 0

  const updated: InvoiceItem = {
    ...target,
    status: isFullySettled ? "Fully paid" : "Partially paid",
    paymentReceived: `₹${newReceivedNum.toLocaleString("en-IN")}`,
    due: `₹${newDueNum.toLocaleString("en-IN")}`,
  }

  current[idx] = updated
  const targetComp = companyId || target.companyId || "all"
  await saveModuleDataToDB("invoices", current, targetComp)
  if (targetComp !== "all") {
    await saveModuleDataToDB("invoices", current, "all")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("saampark_team_payouts_updated"))
    window.dispatchEvent(new Event("saampark_invoices_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  // Record or update payment entry
  try {
    const { getPayments, settleOrUpdatePaymentToCompleted } = await import("@/app/feature/sales/payments/services/paymentService")
    if (isFullySettled) {
      await settleOrUpdatePaymentToCompleted({
        invoiceId: target.id,
        client: target.client,
        clientEmail: target.clientEmail,
        project: target.project,
        paymentMethod,
        transactionRef,
        totalAmount: target.totalInvoiced,
        totalAmountNum: totalInvoicedNum,
      })
    } else {
      // Update existing payment in place or add new
      const payments = await getPayments()
      const pIdx = payments.findIndex(p => 
        (p.invoiceId && p.invoiceId.toLowerCase().trim() === target.id.toLowerCase().trim()) ||
        (p.client.toLowerCase().trim() === target.client.toLowerCase().trim() && p.project.toLowerCase().trim() === target.project.toLowerCase().trim())
      )
      if (pIdx !== -1) {
        payments[pIdx] = {
          ...payments[pIdx],
          amount: `₹${newReceivedNum.toLocaleString("en-IN")}`,
          amountNum: newReceivedNum,
          note: `Installment payment updated: ₹${newReceivedNum.toLocaleString("en-IN")} received for ${target.project}`,
          paymentDate: new Date().toLocaleDateString("en-GB"),
        }
        await saveModuleDataToDB("payments", payments)
      } else {
        const { addPayment } = await import("@/app/feature/sales/payments/services/paymentService")
        await addPayment({
          invoiceId: target.id,
          client: target.client,
          clientEmail: target.clientEmail,
          project: target.project,
          paymentDate: new Date().toLocaleDateString("en-GB"),
          paymentMethod,
          transactionRef: transactionRef || `PART_TXN${Date.now()}`,
          note: `Partial payment of ₹${paidAmountNum.toLocaleString("en-IN")} for ${target.id}`,
          amount: `₹${paidAmountNum.toLocaleString("en-IN")}`,
          amountNum: paidAmountNum,
          status: "Completed"
        })
      }
    }

    // Dispatch real email payment receipt
    sendPaymentReceiptEmailNotification({
      invoice: updated,
      paidAmount: `₹${paidAmountNum.toLocaleString("en-IN")}`,
      remainingDue: `₹${newDueNum.toLocaleString("en-IN")}`,
      paymentMethod,
      txnRef: transactionRef,
    }).catch(() => null)
  } catch (err) {
    console.warn("Error updating payment entry in recordPartialPayment:", err)
  }

  recordActivityLog({
    type: "payment",
    module: "Billing",
    action: isFullySettled ? "Invoice Fully Paid" : "Partial Payment Received",
    description: `Payment of ₹${paidAmountNum.toLocaleString("en-IN")} received for Invoice #${target.id} (${target.client})`,
    companyId: target.companyId,
    branchId: target.branchId,
    branchName: target.branchName,
    details: `Method: ${paymentMethod} | Remaining Due: ₹${newDueNum.toLocaleString("en-IN")}`
  }).catch(() => {})

  return updated
}

export const markPaymentCompleted = async (
  invoiceId: string, 
  paymentMethod: string = "UPI / Net Banking",
  transactionRef: string = ""
): Promise<InvoiceItem | null> => {
  const current = await getInvoices()
  const strId = String(invoiceId).toLowerCase().trim()
  const idx = current.findIndex((i) => String(i.id).toLowerCase().trim() === strId)
  if (idx === -1) return null

  const target = current[idx]
  const updated: InvoiceItem = {
    ...target,
    status: "Fully paid",
    paymentReceived: target.totalInvoiced,
    due: "₹0",
  }
  current[idx] = updated
  await saveModuleDataToDB("invoices", current)

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("saampark_team_payouts_updated"))
    window.dispatchEvent(new Event("saampark_invoices_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  // Settle or update existing payment record in-place
  try {
    const { settleOrUpdatePaymentToCompleted } = await import("@/app/feature/sales/payments/services/paymentService")
    const totalAmountNum = parseInt(target.totalInvoiced.replace(/[^0-9]/g, "")) || 0
    await settleOrUpdatePaymentToCompleted({
      invoiceId: target.id,
      client: target.client,
      clientEmail: target.clientEmail,
      project: target.project,
      paymentMethod,
      transactionRef,
      totalAmount: target.totalInvoiced,
      totalAmountNum,
    })

    // Dispatch full settlement email
    sendPaymentReceiptEmailNotification({
      invoice: updated,
      paidAmount: target.totalInvoiced,
      remainingDue: "₹0",
      paymentMethod,
      txnRef: transactionRef,
    }).catch(() => null)
  } catch (err) {
    console.warn("Error settling payment entry in markPaymentCompleted:", err)
  }

  recordActivityLog({
    type: "payment",
    module: "Billing",
    action: "Invoice Settled",
    description: `Invoice #${target.id} marked as fully paid (${target.totalInvoiced}) for ${target.client}`,
    companyId: target.companyId,
    branchId: target.branchId,
    branchName: target.branchName,
    details: `Method: ${paymentMethod} | Txn: ${transactionRef || "N/A"}`
  }).catch(() => {})

  return updated
}


export const sendPaymentReminder = async (invoiceId: string): Promise<{ success: boolean; message: string }> => {
  const current = await getInvoices()
  const strId = String(invoiceId).toLowerCase().trim()
  const idx = current.findIndex((i) => String(i.id).toLowerCase().trim() === strId)
  if (idx === -1) return { success: false, message: "Invoice not found" }

  const target = current[idx]
  const now = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
  target.lastReminderSent = now
  current[idx] = target
  await saveModuleDataToDB("invoices", current)

  if (target.clientEmail) {
    return await sendPaymentDueReminderEmailNotification(target)
  }

  return { success: true, message: `Payment reminder logged for ${target.client}.` }
}


export const deleteInvoice = async (id: string, companyId?: string): Promise<boolean> => {
  const strId = String(id).trim()
  const lowerId = strId.toLowerCase()
  const upperId = strId.toUpperCase()

  // 1. Mark as globally deleted across all case variations
  await markGlobalItemDeleted(strId, "invoices")
  await markGlobalItemDeleted(lowerId, "invoices")
  await markGlobalItemDeleted(upperId, "invoices")

  // 2. Remove from all company DB keys and "all" key
  const knownCompanies = ["all", "tech", "infotech", "fashion", "digital", "consultancy", "jewellers"]
  if (companyId && !knownCompanies.includes(companyId)) knownCompanies.push(companyId)

  let target: InvoiceItem | undefined

  await Promise.all(
    knownCompanies.map(async (c) => {
      try {
        const list = await fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], c)
        if (Array.isArray(list)) {
          if (!target) {
            target = list.find(i => String(i.id).toLowerCase().trim() === lowerId)
          }
          const filtered = list.filter(i => String(i.id).toLowerCase().trim() !== lowerId)
          if (filtered.length !== list.length) {
            await saveModuleDataToDB("invoices", filtered, c)
          }
        }
      } catch {}
    })
  )

  if (target) {
    const targetTotal = parseCurrencyNumber(target.totalInvoiced)
    const targetReceived = parseCurrencyNumber(target.paymentReceived)
    const targetDue = parseCurrencyNumber(target.due)
    const targetProjectNorm = (target.project || "").toLowerCase().trim()
    const targetClientNorm = (target.client || "").toLowerCase().trim()

    // 2. Cascade delete from Sales Orders
    try {
      const orders = await fetchModuleDataFromDB<any[]>("orders", [], companyId)
      const matchingOrders = orders.filter(o => 
        (o.invoiceId && String(o.invoiceId).toLowerCase().trim() === strId) ||
        (targetProjectNorm && o.project && o.project.toLowerCase().trim() === targetProjectNorm && targetClientNorm && o.client && o.client.toLowerCase().trim() === targetClientNorm)
      )
      for (const mo of matchingOrders) {
        if (mo.id) await markGlobalItemDeleted(mo.id, "orders")
      }
      const remainingOrders = orders.filter(o => !matchingOrders.some(mo => mo.id === o.id))
      await saveModuleDataToDB("orders", remainingOrders, companyId)
    } catch (err) {
      console.warn("Cascade delete orders failed:", err)
    }

    // 3. Cascade delete from Payments
    try {
      const payments = await fetchModuleDataFromDB<any[]>("payments", [], companyId)
      const matchingPayments = payments.filter(p =>
        (p.invoiceId && String(p.invoiceId).toLowerCase().trim() === strId) ||
        (targetProjectNorm && p.project && p.project.toLowerCase().trim() === targetProjectNorm && targetClientNorm && p.client && p.client.toLowerCase().trim() === targetClientNorm)
      )
      for (const mp of matchingPayments) {
        if (mp.id) await markGlobalItemDeleted(mp.id, "payments")
      }
      const remainingPayments = payments.filter(p => !matchingPayments.some(mp => mp.id === p.id))
      await saveModuleDataToDB("payments", remainingPayments, companyId)
    } catch (err) {
      console.warn("Cascade delete payments failed:", err)
    }

    // 4. Cascade delete from Subscriptions & Installments
    try {
      const subs = await fetchModuleDataFromDB<any[]>("subscriptions", [], companyId)
      const targetSubId = (target as any)?.subscriptionId
      const targetInvId = target?.id
      const matchingSubs = subs.filter(s =>
        (targetProjectNorm && s.planName && s.planName.toLowerCase().includes(targetProjectNorm) && targetClientNorm && s.clientName && s.clientName.toLowerCase().trim() === targetClientNorm) ||
        (s.id && ((targetSubId && s.id === targetSubId) || (targetInvId && s.id === targetInvId)))
      )
      for (const ms of matchingSubs) {
        if (ms.id) await markGlobalItemDeleted(ms.id, "subscriptions")
      }
      const remainingSubs = subs.filter(s => !matchingSubs.some(ms => ms.id === s.id))
      await saveModuleDataToDB("subscriptions", remainingSubs, companyId)
    } catch (err) {
      console.warn("Cascade delete subscriptions failed:", err)
    }

    // 5. Cascade delete from Installments / EMI Contracts
    try {
      const insts = await fetchModuleDataFromDB<any[]>("installments", [], companyId)
      const targetEmiId = (target as any)?.emiContractId
      const targetOrderId = (target as any)?.orderId
      const targetInvId = target?.id
      const matchingInsts = insts.filter(i =>
        (targetProjectNorm && i.projectTitle && i.projectTitle.toLowerCase().includes(targetProjectNorm) && targetClientNorm && i.clientName && i.clientName.toLowerCase().trim() === targetClientNorm) ||
        (i.id && ((targetEmiId && i.id === targetEmiId) || (targetOrderId && i.id === targetOrderId) || (targetInvId && i.id === targetInvId)))
      )
      for (const mi of matchingInsts) {
        if (mi.id) await markGlobalItemDeleted(mi.id, "installments")
      }
      const remainingInsts = insts.filter(i => !matchingInsts.some(mi => mi.id === i.id))
      await saveModuleDataToDB("installments", remainingInsts, companyId)
      if (companyId !== "all") {
        await saveModuleDataToDB("installments", remainingInsts, "all")
      }
    } catch (err) {
      console.warn("Cascade delete installments failed:", err)
    }

    // 6. Deduct from Client Total Invoiced, Paid & Due Everywhere
    try {
      const clients = await getClients(companyId)
      const clientIdx = clients.findIndex(c => 
        (c.name && c.name.toLowerCase().trim() === targetClientNorm) ||
        (target?.clientEmail && c.email && c.email.toLowerCase().trim() === target.clientEmail.toLowerCase().trim())
      )
      if (clientIdx !== -1) {
        const c = clients[clientIdx]
        const currInvoiced = parseInt((c.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
        const currReceived = parseInt((c.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
        const currDue = parseInt((c.due || "0").replace(/[^0-9]/g, "")) || 0

        const newInvoiced = Math.max(0, currInvoiced - targetTotal)
        const newReceived = Math.max(0, currReceived - targetReceived)
        const newDue = Math.max(0, currDue - targetDue)

        await saveStoredClient({
          ...c,
          totalInvoiced: `₹${newInvoiced.toLocaleString("en-IN")}`,
          paymentReceived: `₹${newReceived.toLocaleString("en-IN")}`,
          due: `₹${newDue.toLocaleString("en-IN")}`,
        }, companyId)
      }
    } catch (err) {
      console.warn("Cascade deduct client balance failed:", err)
    }

    // 7. Broadcast sync events so all active views update simultaneously
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("saampark_data_synced"))
      window.dispatchEvent(new Event("saampark_invoices_updated"))
      window.dispatchEvent(new Event("saampark_orders_updated"))
      window.dispatchEvent(new Event("saampark_payments_updated"))
      window.dispatchEvent(new Event("saampark_clients_updated"))
      window.dispatchEvent(new Event("saampark_subscriptions_updated"))
      window.dispatchEvent(new Event("saampark_installments_updated"))
      window.dispatchEvent(new Event("storage"))
    }

    recordActivityLog({
      type: "invoice",
      module: "Invoices",
      action: "Invoice Deleted",
      description: `Invoice #${strId} ${target?.client ? `for "${target.client}"` : ""} deleted from the system`,
      companyId: target?.companyId || companyId,
      branchId: target?.branchId,
      branchName: target?.branchName,
    }).catch(() => {})
  }

  return true
}

