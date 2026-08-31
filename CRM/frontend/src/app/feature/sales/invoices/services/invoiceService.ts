import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems, getLocalDeletedIds } from "@/lib/storageSync"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"
import { sendPaymentReceiptEmailNotification, sendPaymentDueReminderEmailNotification } from "@/services/emailNotificationService"

export type InvoiceStatus = "Draft" | "Partially paid" | "Fully paid" | "Not paid" | "Credited" | "Payment Pending"

export interface InvoiceLineCharge {
  id: string
  name: string
  amount: number
}

export interface InvoiceLineItem {
  id: string
  serviceName: string
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

export interface InvoiceItem {
  id: string
  client: string
  clientEmail?: string
  clientId?: string
  project: string
  billDate: string
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
  createdByName?: string
  createdByRole?: string
  items?: InvoiceLineItem[]
  discountsList?: AppliedDiscount[]
}

export const INITIAL_INVOICES: InvoiceItem[] = []

export const generateInvoiceNumber = (
  existingInvoices: InvoiceItem[] = [], 
  dateObj: Date = new Date(),
  isNonGst: boolean = false
): string => {
  const d = String(dateObj.getDate()).padStart(2, "0")
  const m = String(dateObj.getMonth() + 1).padStart(2, "0")
  const y = String(dateObj.getFullYear())
  const prefix = isNonGst ? `NGINV-${d}${m}${y}-` : `INV-${d}${m}${y}-`

  const deletedIds = getLocalDeletedIds()

  let maxSeq = 0
  const allExisting = [...existingInvoices]

  for (const inv of allExisting) {
    if (!inv || !inv.id) continue
    const cleanId = String(inv.id).trim().toUpperCase()
    if (cleanId.startsWith(prefix)) {
      const suffix = cleanId.substring(prefix.length)
      const num = parseInt(suffix, 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    }
  }

  // Also check deleted IDs so invoice sequence never collides with a previously deleted ID
  for (const delId of deletedIds) {
    const cleanId = String(delId).trim().toUpperCase()
    if (cleanId.startsWith(prefix)) {
      const suffix = cleanId.substring(prefix.length)
      const num = parseInt(suffix, 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    }
  }

  const nextSeq = maxSeq + 1
  const seqStr = String(nextSeq).padStart(4, "0")
  return `${prefix}${seqStr}`
}

export const getInvoices = async (companyId?: string): Promise<InvoiceItem[]> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }

  if (!targetComp || targetComp === "all") {
    const knownCompanies = ["all", "tech", "infotech", "fashion", "digital", "consultancy", "jewellers"]
    const results = await Promise.all(
      knownCompanies.map(c => fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], c).catch(() => []))
    )
    const map = new Map<string, InvoiceItem>()
    for (const list of results) {
      for (const inv of (Array.isArray(list) ? list : [])) {
        if (inv && inv.id) map.set(String(inv.id).toUpperCase().trim(), inv)
      }
    }
    return filterGlobalDeletedItems(Array.from(map.values()))
  }

  const scopedData = await fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], targetComp)
  const allMaster = await fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], "all").catch(() => [])

  const map = new Map<string, InvoiceItem>()
  for (const inv of (Array.isArray(allMaster) ? allMaster : [])) {
    if (inv && inv.id) {
      const invComp = inv.companyId || (inv as any).company || "tech"
      if (invComp === targetComp || (targetComp === "tech" && !inv.companyId)) {
        map.set(String(inv.id).toUpperCase().trim(), inv)
      }
    }
  }
  for (const inv of (Array.isArray(scopedData) ? scopedData : [])) {
    if (inv && inv.id) {
      map.set(String(inv.id).toUpperCase().trim(), { ...inv, companyId: inv.companyId || targetComp })
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
    const billDateObj = invoice.billDate ? new Date(invoice.billDate) : new Date()
    nextId = generateInvoiceNumber(currentAll, isNaN(billDateObj.getTime()) ? new Date() : billDateObj, !isGst)
  }

  let activeBranch: string | undefined = undefined
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      activeBranch = useAuthStore.getState().activeBranchId || useAuthStore.getState().user?.branchId || undefined
    } catch {}
  }

  const now = new Date()
  const billTime = invoice.billTime || now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  const createdAt = invoice.createdAt || now.getTime()

  const newInvoice: InvoiceItem = { 
    ...invoice, 
    id: nextId,
    billTime,
    createdAt,
    companyId: effectiveComp,
    branchId: invoice.branchId || activeBranch || undefined
  }

  const updatedScoped = [newInvoice, ...(Array.isArray(currentScoped) ? currentScoped.filter(i => String(i.id).toUpperCase().trim() !== nextId.toUpperCase().trim()) : [])]
  const updatedAll = [newInvoice, ...(Array.isArray(currentAll) ? currentAll.filter(i => String(i.id).toUpperCase().trim() !== nextId.toUpperCase().trim()) : [])]

  // Parallel non-blocking saves across target databases
  const saveTasks: Promise<any>[] = [
    saveModuleDataToDB("invoices", updatedScoped, effectiveComp),
    saveModuleDataToDB("invoices", updatedAll, "all"),
  ]

  if (effectiveComp !== "tech") {
    saveTasks.push(
      fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], "tech").catch(() => []).then(techList => {
        const updatedTech = [newInvoice, ...(Array.isArray(techList) ? techList.filter(i => String(i.id).toUpperCase().trim() !== nextId.toUpperCase().trim()) : [])]
        return saveModuleDataToDB("invoices", updatedTech, "tech")
      })
    )
  }

  await Promise.all(saveTasks)

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_invoices_updated"))
  }

  return newInvoice
}

export const updateInvoice = async (
  updatedInvoice: InvoiceItem,
  companyId?: string
): Promise<InvoiceItem> => {
  const targetComp = companyId || updatedInvoice.companyId || "all"
  const current = await getInvoices(targetComp)
  const strId = String(updatedInvoice.id).toUpperCase().trim()
  const idx = current.findIndex((i) => String(i.id).toUpperCase().trim() === strId)

  let nextList: InvoiceItem[]
  if (idx !== -1) {
    const oldInv = current[idx]
    const merged = { ...oldInv, ...updatedInvoice }
    current[idx] = merged
    nextList = [...current]
  } else {
    nextList = [updatedInvoice, ...current]
  }

  await saveModuleDataToDB("invoices", nextList, targetComp)
  if (targetComp !== "all") {
    await saveModuleDataToDB("invoices", nextList, "all")
  }

  // Update client billing stats
  try {
    const clients = await getClients(targetComp)
    const clientIdx = clients.findIndex(c => 
      (c.name && c.name.toLowerCase().trim() === (updatedInvoice.client || "").toLowerCase().trim()) ||
      (updatedInvoice.clientEmail && c.email && c.email.toLowerCase().trim() === updatedInvoice.clientEmail.toLowerCase().trim())
    )
    if (clientIdx !== -1) {
      const c = clients[clientIdx]
      const clientInvoices = nextList.filter(inv => 
        (inv.client && inv.client.toLowerCase().trim() === c.name.toLowerCase().trim()) ||
        (inv.clientEmail && c.email && inv.clientEmail.toLowerCase().trim() === c.email.toLowerCase().trim())
      )
      const sumInvoiced = clientInvoices.reduce((sum, i) => sum + (parseInt((i.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0), 0)
      const sumReceived = clientInvoices.reduce((sum, i) => sum + (parseInt((i.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0), 0)
      const sumDue = clientInvoices.reduce((sum, i) => sum + (parseInt((i.due || "0").replace(/[^0-9]/g, "")) || 0), 0)

      await saveStoredClient({
        ...c,
        totalInvoiced: `₹${sumInvoiced.toLocaleString("en-IN")}`,
        paymentReceived: `₹${sumReceived.toLocaleString("en-IN")}`,
        due: `₹${sumDue.toLocaleString("en-IN")}`,
      })
    }
  } catch (err) {
    console.warn("Error updating client balance after invoice update:", err)
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("saampark_invoices_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  return updatedInvoice
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
    const targetTotal = parseInt((target.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
    const targetReceived = parseInt((target.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
    const targetDue = parseInt((target.due || "0").replace(/[^0-9]/g, "")) || 0
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
        })
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
  }

  return true
}
