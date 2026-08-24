import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"

export type InvoiceStatus = "Draft" | "Partially paid" | "Fully paid" | "Not paid" | "Credited" | "Payment Pending"

export interface InvoiceItem {
  id: string
  client: string
  clientEmail?: string
  project: string
  billDate: string
  dueDate: string
  baseAmount?: number
  gstRate?: number
  gstAmount?: number
  totalInvoiced: string
  paymentReceived: string
  due: string
  status: InvoiceStatus
  billedBy?: string
  lastReminderSent?: string
}

export const INITIAL_INVOICES: InvoiceItem[] = []

export const getInvoices = async (): Promise<InvoiceItem[]> => {
  const data = await fetchModuleDataFromDB<InvoiceItem[]>("invoices", [])
  return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
}

export const addInvoice = async (invoice: Omit<InvoiceItem, "id"> & { id?: string }): Promise<InvoiceItem> => {
  const current = await getInvoices()
  const nextId = invoice.id || `INV #${Math.floor(100 + Math.random() * 900)}`
  const newInvoice: InvoiceItem = { ...invoice, id: nextId }
  const updated = [newInvoice, ...current]
  await saveModuleDataToDB("invoices", updated)
  return newInvoice
}

export const updateInvoiceStatus = async (
  id: string, 
  status: InvoiceStatus, 
  paymentReceived?: string,
  due?: string
): Promise<InvoiceItem | null> => {
  const current = await getInvoices()
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
  await saveModuleDataToDB("invoices", current)
  return current[idx]
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

  // 1. Record completed payment entry in payments store
  try {
    const { addPayment } = await import("@/app/feature/sales/payments/services/paymentService")
    const dueAmountNum = parseInt(target.due.replace(/[^0-9]/g, "")) || parseInt(target.totalInvoiced.replace(/[^0-9]/g, "")) || 0
    await addPayment({
      invoiceId: target.id,
      client: target.client,
      clientEmail: target.clientEmail,
      project: target.project,
      paymentDate: new Date().toLocaleDateString("en-GB"),
      paymentMethod,
      transactionRef: transactionRef || `TXN${Date.now()}`,
      note: `Full clearance settlement for ${target.id}`,
      amount: target.totalInvoiced,
      amountNum: dueAmountNum,
      status: "Completed"
    })
  } catch (err) {
    console.warn("Error creating payment entry:", err)
  }

  // 2. Update Client Statistics
  try {
    const clients = await getClients()
    const cIdx = clients.findIndex(c => c.name.toLowerCase() === target.client.toLowerCase() || (target.clientEmail && c.email === target.clientEmail))
    if (cIdx !== -1) {
      const c = clients[cIdx]
      const currentPaid = parseInt((c.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
      const currentDue = parseInt((c.due || "0").replace(/[^0-9]/g, "")) || 0
      const clearedAmount = parseInt(target.totalInvoiced.replace(/[^0-9]/g, "")) || 0
      
      saveStoredClient({
        ...c,
        paymentReceived: `₹${(currentPaid + clearedAmount).toLocaleString("en-IN")}`,
        due: `₹${Math.max(0, currentDue - clearedAmount).toLocaleString("en-IN")}`
      })
    }
  } catch (err) {
    console.warn("Error updating client balance:", err)
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

export const deleteInvoice = async (id: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "invoices")
  const current = await getInvoices()
  const filtered = current.filter(i => String(i.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("invoices", filtered)
  return true
}
