import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"

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

export const getInvoices = async (companyId?: string): Promise<InvoiceItem[]> => {
  const data = await fetchModuleDataFromDB<InvoiceItem[]>("invoices", [], companyId)
  return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
}

export const addInvoice = async (invoice: Omit<InvoiceItem, "id"> & { id?: string }, companyId?: string): Promise<InvoiceItem> => {
  const current = await getInvoices(companyId)
  const nextId = invoice.id || `INV #${Math.floor(100 + Math.random() * 900)}`
  const newInvoice: InvoiceItem = { ...invoice, id: nextId }
  const updated = [newInvoice, ...current]
  await saveModuleDataToDB("invoices", updated, companyId)
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
  const strId = String(id).toLowerCase().trim()
  const idx = current.findIndex((i) => String(i.id).toLowerCase().trim() === strId)
  if (idx === -1) return null
  const target = current[idx]
  current[idx] = {
    ...target,
    status,
    paymentReceived: paymentReceived !== undefined ? paymentReceived : (status === "Fully paid" ? target.totalInvoiced : target.paymentReceived),
    due: due !== undefined ? due : (status === "Fully paid" ? "₹0" : target.due),
  }
  await saveModuleDataToDB("invoices", current, companyId)
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
  const strId = String(invoiceId).toLowerCase().trim()
  const idx = current.findIndex((i) => String(i.id).toLowerCase().trim() === strId)
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
  await saveModuleDataToDB("invoices", current, companyId)

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
  } catch (err) {
    console.warn("Error settling payment entry in markPaymentCompleted:", err)
  }

  // 3. Notify Client of payment confirmation
  if (typeof window !== "undefined" && target.clientEmail) {
    try {
      const notifKey = `saampark_notifications_${target.clientEmail.toLowerCase().trim()}`
      const prevRaw = localStorage.getItem(notifKey)
      const prevNotifs = prevRaw ? JSON.parse(prevRaw) : []
      const newNotif = {
        id: Date.now(),
        title: `Payment Received for ${target.id}`,
        message: `Your payment of ${target.totalInvoiced} for ${target.project} has been verified and marked Fully Paid. Thank you!`,
        timestamp: new Date().toLocaleString(),
        read: false,
      }
      localStorage.setItem(notifKey, JSON.stringify([newNotif, ...prevNotifs]))
    } catch {}
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
    const { sendPaymentReminderNotification } = await import("@/app/feature/sales/payments/services/paymentService")
    return await sendPaymentReminderNotification(
      target.clientEmail,
      target.client,
      target.id,
      target.due || target.totalInvoiced,
      target.dueDate
    )
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
