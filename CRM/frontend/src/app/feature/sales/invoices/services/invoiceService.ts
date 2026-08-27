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
  project: string
  billDate: string
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
  createdByName?: string
  createdByRole?: string
  items?: InvoiceLineItem[]
  discountsList?: AppliedDiscount[]
}

export const INITIAL_INVOICES: InvoiceItem[] = []

export const generateInvoiceNumber = (existingInvoices: InvoiceItem[] = [], dateObj: Date = new Date()): string => {
  const d = String(dateObj.getDate()).padStart(2, "0")
  const m = String(dateObj.getMonth() + 1).padStart(2, "0")
  const y = String(dateObj.getFullYear()).slice(-2)
  const datePrefix = `INV${d}${m}${y}`

  const deletedIds = getLocalDeletedIds()

  let maxSeq = 0
  for (const inv of existingInvoices) {
    if (!inv || !inv.id) continue
    const cleanId = String(inv.id).replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    if (cleanId.startsWith(datePrefix)) {
      const suffix = cleanId.substring(datePrefix.length)
      const num = parseInt(suffix, 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    }
  }

  // Also check deleted IDs so invoice sequence never collides with a previously deleted ID
  for (const delId of deletedIds) {
    const cleanId = String(delId).replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    if (cleanId.startsWith(datePrefix)) {
      const suffix = cleanId.substring(datePrefix.length)
      const num = parseInt(suffix, 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    }
  }

  const nextSeq = maxSeq + 1
  const seqStr = String(nextSeq).padStart(4, "0")
  return `${datePrefix}${seqStr}`
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
      map.set(String(inv.id).toUpperCase().trim(), inv)
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

  const allCurrent = await getInvoices("all")
  const deletedIds = getLocalDeletedIds()
  let nextId = (invoice.id || "").trim()

  // If no ID provided or if requested ID already exists or is in deleted list, calculate next unique ID
  if (
    !nextId || 
    allCurrent.some(i => String(i.id).toUpperCase().trim() === nextId.toUpperCase()) ||
    deletedIds.includes(nextId.toLowerCase().trim())
  ) {
    const billDateObj = invoice.billDate ? new Date(invoice.billDate) : new Date()
    nextId = generateInvoiceNumber(allCurrent, isNaN(billDateObj.getTime()) ? new Date() : billDateObj)
  }

  const newInvoice: InvoiceItem = { 
    ...invoice, 
    id: nextId,
    companyId: effectiveComp
  }

  const currentScoped = await fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], effectiveComp)
  const currentTech = effectiveComp !== "tech" ? await fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], "tech") : []
  const currentAll = await fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], "all")

  const updatedScoped = [newInvoice, ...(Array.isArray(currentScoped) ? currentScoped.filter(i => String(i.id).toUpperCase().trim() !== nextId.toUpperCase().trim()) : [])]
  await saveModuleDataToDB("invoices", updatedScoped, effectiveComp)

  if (effectiveComp !== "tech") {
    const updatedTech = [newInvoice, ...(Array.isArray(currentTech) ? currentTech.filter(i => String(i.id).toUpperCase().trim() !== nextId.toUpperCase().trim()) : [])]
    await saveModuleDataToDB("invoices", updatedTech, "tech")
  }

  const updatedAll = [newInvoice, ...(Array.isArray(currentAll) ? currentAll.filter(i => String(i.id).toUpperCase().trim() !== nextId.toUpperCase().trim()) : [])]
  await saveModuleDataToDB("invoices", updatedAll, "all")

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_invoices_updated"))
  }

  return newInvoice
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
  const strId = String(id).toLowerCase().trim()
  const current = await getInvoices(companyId)
  const target = current.find(i => String(i.id).toLowerCase().trim() === strId)

  // 1. Mark and remove from invoices
  await markGlobalItemDeleted(strId, "invoices")
  const filtered = current.filter(i => String(i.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("invoices", filtered, companyId)

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

    // 4. Cascade delete from Subscriptions (if any part-payment subscription was created for this project/client)
    try {
      const subs = await fetchModuleDataFromDB<any[]>("subscriptions", [], companyId)
      const matchingSubs = subs.filter(s =>
        (targetProjectNorm && s.planName && s.planName.toLowerCase().includes(targetProjectNorm) && targetClientNorm && s.clientName && s.clientName.toLowerCase().trim() === targetClientNorm)
      )
      for (const ms of matchingSubs) {
        if (ms.id) await markGlobalItemDeleted(ms.id, "subscriptions")
      }
      const remainingSubs = subs.filter(s => !matchingSubs.some(ms => ms.id === s.id))
      await saveModuleDataToDB("subscriptions", remainingSubs, companyId)
    } catch (err) {
      console.warn("Cascade delete subscriptions failed:", err)
    }

    // 5. Deduct from Client Total Invoiced, Paid & Due Everywhere
    try {
      const clients = await getClients(companyId)
      const clientIdx = clients.findIndex(c => 
        (c.name && c.name.toLowerCase().trim() === targetClientNorm) ||
        (target.clientEmail && c.email && c.email.toLowerCase().trim() === target.clientEmail.toLowerCase().trim())
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

    // 6. Broadcast sync events so all active views update simultaneously
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("saampark_data_synced"))
      window.dispatchEvent(new Event("saampark_orders_updated"))
      window.dispatchEvent(new Event("saampark_payments_updated"))
      window.dispatchEvent(new Event("saampark_clients_updated"))
    }
  }

  return true
}
