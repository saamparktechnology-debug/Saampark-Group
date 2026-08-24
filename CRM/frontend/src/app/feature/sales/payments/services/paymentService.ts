import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { getInvoices, updateInvoiceStatus, InvoiceItem } from "@/app/feature/sales/invoices/services/invoiceService"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"

export interface PaymentItem {
  id: string
  invoiceId: string
  client: string
  clientEmail?: string
  project: string
  paymentDate: string
  paymentMethod: string
  transactionRef?: string
  note: string
  amount: string
  amountNum: number
  status: "Completed" | "Pending" | "Failed"
}

export const INITIAL_PAYMENTS: PaymentItem[] = []

export const getPayments = async (): Promise<PaymentItem[]> => {
  const data = await fetchModuleDataFromDB<PaymentItem[]>("payments", [])
  return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
}

export const addPayment = async (paymentData: Omit<PaymentItem, "id"> & { id?: string }): Promise<PaymentItem> => {
  const current = await getPayments()
  const nextId = paymentData.id || `P-${Math.floor(100 + Math.random() * 900)}`
  const numAmount = typeof paymentData.amountNum === "number" ? paymentData.amountNum : (parseInt(String(paymentData.amount).replace(/[^0-9]/g, "")) || 0)
  const formattedAmount = paymentData.amount.startsWith("₹") ? paymentData.amount : `₹${paymentData.amount}`

  const newPayment: PaymentItem = {
    ...paymentData,
    id: nextId,
    amount: formattedAmount,
    amountNum: numAmount,
    status: paymentData.status || "Completed"
  }

  const updated = [newPayment, ...current]
  await saveModuleDataToDB("payments", updated)

  // 1. Sync Invoice if invoiceId is provided
  if (paymentData.invoiceId && paymentData.invoiceId !== "None") {
    try {
      const invoices = await getInvoices()
      const targetInv = invoices.find(i => i.id.toLowerCase().trim() === paymentData.invoiceId.toLowerCase().trim())
      if (targetInv) {
        const invTotalNum = parseInt(targetInv.totalInvoiced.replace(/[^0-9]/g, "")) || 0
        const prevPaidNum = parseInt(targetInv.paymentReceived.replace(/[^0-9]/g, "")) || 0
        const newPaidNum = prevPaidNum + numAmount
        const remainingDue = Math.max(0, invTotalNum - newPaidNum)

        const newStatus = remainingDue === 0 ? "Fully paid" : "Partially paid"
        await updateInvoiceStatus(
          targetInv.id,
          newStatus,
          `₹${newPaidNum.toLocaleString("en-IN")}`,
          `₹${remainingDue.toLocaleString("en-IN")}`
        )
      }
    } catch (err) {
      console.warn("Error syncing invoice from payment:", err)
    }
  }

  // 2. Notify Client
  if (typeof window !== "undefined" && paymentData.clientEmail) {
    try {
      const notifKey = `saampark_notifications_${paymentData.clientEmail.toLowerCase().trim()}`
      const prevNotifsRaw = localStorage.getItem(notifKey)
      const prevNotifs = prevNotifsRaw ? JSON.parse(prevNotifsRaw) : []
      const newNotif = {
        id: Date.now(),
        title: `Payment Receipt: ${formattedAmount}`,
        message: `We have received your payment of ${formattedAmount} via ${paymentData.paymentMethod}. Ref: ${paymentData.transactionRef || 'N/A'}. Thank you!`,
        timestamp: new Date().toLocaleString(),
        read: false,
      }
      localStorage.setItem(notifKey, JSON.stringify([newNotif, ...prevNotifs]))
    } catch {}
  }

  return newPayment
}

export const deletePayment = async (id: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "payments")
  const current = await getPayments()
  const filtered = current.filter(p => String(p.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("payments", filtered)
  return true
}

export const sendPaymentReminderNotification = async (
  recipientEmail: string,
  recipientName: string,
  title: string,
  dueAmount: string,
  dueDate: string
): Promise<{ success: boolean; message: string }> => {
  if (typeof window === "undefined" || !recipientEmail) {
    return { success: false, message: "Invalid email" }
  }

  try {
    const notifKey = `saampark_notifications_${recipientEmail.toLowerCase().trim()}`
    const prevNotifsRaw = localStorage.getItem(notifKey)
    const prevNotifs = prevNotifsRaw ? JSON.parse(prevNotifsRaw) : []
    const newNotif = {
      id: Date.now(),
      title: `Payment Reminder: ${title}`,
      message: `Dear ${recipientName}, this is a gentle reminder regarding pending payment of ${dueAmount} due on ${dueDate}. Please proceed with the payment settlement.`,
      timestamp: new Date().toLocaleString(),
      read: false,
    }
    localStorage.setItem(notifKey, JSON.stringify([newNotif, ...prevNotifs]))
    return { success: true, message: `Payment reminder sent to ${recipientName} (${recipientEmail}) for ${dueAmount}.` }
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to send reminder" }
  }
}
