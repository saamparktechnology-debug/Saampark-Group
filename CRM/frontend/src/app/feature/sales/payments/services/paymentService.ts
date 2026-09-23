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
  companyId?: string
  branchId?: string
  branchName?: string
}

export const INITIAL_PAYMENTS: PaymentItem[] = []

export const getPayments = async (companyId?: string): Promise<PaymentItem[]> => {
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
      knownCompanies.map(c => fetchModuleDataFromDB<PaymentItem[]>("payments", [], c).catch(() => []))
    )
    const map = new Map<string, PaymentItem>()
    for (const p of results.flat()) {
      if (p && p.id) map.set(String(p.id).toLowerCase().trim(), p)
    }
    return filterGlobalDeletedItems(Array.from(map.values()))
  }

  const scopedData = await fetchModuleDataFromDB<PaymentItem[]>("payments", [], targetComp)
  const allMaster = await fetchModuleDataFromDB<PaymentItem[]>("payments", [], "all").catch(() => [])

  const map = new Map<string, PaymentItem>()
  for (const p of (Array.isArray(allMaster) ? allMaster : [])) {
    if (p && p.id) {
      const pComp = p.companyId || (p as any).company || "tech"
      if (pComp === targetComp || (targetComp === "tech" && !p.companyId)) {
        map.set(String(p.id).toLowerCase().trim(), p)
      }
    }
  }
  for (const p of (Array.isArray(scopedData) ? scopedData : [])) {
    if (p && p.id) map.set(String(p.id).toLowerCase().trim(), p)
  }

  return filterGlobalDeletedItems(Array.from(map.values()))
}

export const addPayment = async (paymentData: Omit<PaymentItem, "id"> & { id?: string }, companyId?: string): Promise<PaymentItem> => {
  let targetComp = companyId || paymentData.companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  targetComp = targetComp || "tech"

  const current = await getPayments(targetComp)
  const nextId = paymentData.id || `P-${Math.floor(1000 + Math.random() * 9000)}`
  const numAmount = typeof paymentData.amountNum === "number" ? paymentData.amountNum : (parseInt(String(paymentData.amount).replace(/[^0-9]/g, "")) || 0)
  const formattedAmount = paymentData.amount.startsWith("₹") ? paymentData.amount : `₹${paymentData.amount}`

  let activeBranch: string | undefined = undefined
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      activeBranch = useAuthStore.getState().activeBranchId || useAuthStore.getState().user?.branchId || undefined
    } catch {}
  }

  const newPayment: PaymentItem = {
    ...paymentData,
    id: nextId,
    companyId: targetComp,
    branchId: (paymentData as any).branchId || activeBranch || undefined,
    amount: formattedAmount,
    amountNum: numAmount,
    status: paymentData.status || "Completed"
  }

  const updatedScoped = [newPayment, ...current.filter(p => String(p.id).toLowerCase().trim() !== nextId.toLowerCase().trim())]
  await saveModuleDataToDB("payments", updatedScoped, targetComp)

  if (targetComp !== "all") {
    const currentAll = await fetchModuleDataFromDB<PaymentItem[]>("payments", [], "all").catch(() => [])
    const updatedAll = [newPayment, ...(Array.isArray(currentAll) ? currentAll.filter(p => String(p.id).toLowerCase().trim() !== nextId.toLowerCase().trim()) : [])]
    await saveModuleDataToDB("payments", updatedAll, "all")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_payments_updated"))
  }


  // 1. Sync Invoice if invoiceId is provided
  if (paymentData.invoiceId && paymentData.invoiceId !== "None") {
    try {
      const invoices = await getInvoices()
      const targetInv = invoices.find(i => i.id.toLowerCase().trim() === paymentData.invoiceId.toLowerCase().trim())
      if (targetInv) {
        const invTotalNum = parseInt((targetInv.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
        
        // Aggregate all completed payments for this specific invoice
        const invPayments = updatedScoped.filter((p: PaymentItem) => 
          p.invoiceId && 
          p.invoiceId.toLowerCase().trim() === targetInv.id.toLowerCase().trim() && 
          p.status === "Completed"
        )
        const totalCompletedPaid = invPayments.reduce((sum: number, p: PaymentItem) => sum + (p.amountNum || 0), 0)
        const effectivePaid = Math.min(invTotalNum, totalCompletedPaid)
        const remainingDue = Math.max(0, invTotalNum - effectivePaid)


        const newStatus = remainingDue === 0 
          ? "Fully paid" 
          : effectivePaid > 0 
            ? "Partially paid" 
            : "Not paid"

        await updateInvoiceStatus(
          targetInv.id,
          newStatus,
          `₹${effectivePaid.toLocaleString("en-IN")}`,
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

/**
 * Record or convert an existing partial/advance payment to Completed/Full Paid in-place.
 * If an existing payment entry exists for this invoice or client/project, updates it in place (DOES NOT DUPLICATE).
 * Otherwise creates a new completed payment entry.
 */
export const settleOrUpdatePaymentToCompleted = async (params: {
  invoiceId?: string
  orderNumber?: string
  client: string
  clientEmail?: string
  project: string
  paymentDate?: string
  paymentMethod?: string
  transactionRef?: string
  note?: string
  totalAmount: string
  totalAmountNum?: number
}): Promise<PaymentItem> => {
  const current = await getPayments()
  const normClient = params.client.toLowerCase().trim()
  const normProject = params.project.toLowerCase().trim()
  const normInvId = (params.invoiceId || "").toLowerCase().trim()
  const normOrdNum = (params.orderNumber || "").toLowerCase().trim()

  // Find existing payment for this invoice or project/client
  const existingIdx = current.findIndex((p) => {
    const pInv = (p.invoiceId || "").toLowerCase().trim()
    const pClient = (p.client || "").toLowerCase().trim()
    const pProj = (p.project || "").toLowerCase().trim()

    if (normInvId && pInv && (pInv === normInvId || pInv.includes(normInvId) || normInvId.includes(pInv))) {
      return true
    }
    if (normOrdNum && pInv && (pInv === normOrdNum || pInv.includes(normOrdNum) || normOrdNum.includes(pInv))) {
      return true
    }
    if (pClient === normClient && pProj === normProject) {
      return true
    }
    return false
  })

  const numAmount = params.totalAmountNum !== undefined 
    ? params.totalAmountNum 
    : (parseInt(params.totalAmount.replace(/[^0-9]/g, "")) || 0)
  const formattedAmount = params.totalAmount.startsWith("₹") ? params.totalAmount : `₹${params.totalAmount}`

  let settledPayment: PaymentItem

  if (existingIdx !== -1) {
    // CONVERT existing partial/advance payment to FULL PAID (DO NOT GENERATE DUPLICATE)
    settledPayment = {
      ...current[existingIdx],
      amount: formattedAmount,
      amountNum: numAmount,
      status: "Completed",
      paymentMethod: params.paymentMethod || current[existingIdx].paymentMethod || "UPI / Net Banking",
      transactionRef: params.transactionRef || current[existingIdx].transactionRef || `SETTLE_${Date.now()}`,
      note: `Full payment settlement completed for ${params.project}`,
      paymentDate: new Date().toLocaleDateString("en-GB"),
    }
    current[existingIdx] = settledPayment
    await saveModuleDataToDB("payments", current)
  } else {
    // If no prior payment record existed, create one
    settledPayment = {
      id: `P-${Math.floor(100 + Math.random() * 900)}`,
      invoiceId: params.invoiceId || params.orderNumber || "INV-SETTLED",
      client: params.client,
      clientEmail: params.clientEmail,
      project: params.project,
      paymentDate: new Date().toLocaleDateString("en-GB"),
      paymentMethod: params.paymentMethod || "UPI / Net Banking",
      transactionRef: params.transactionRef || `TXN_${Date.now()}`,
      note: `Full payment settlement completed for ${params.project}`,
      amount: formattedAmount,
      amountNum: numAmount,
      status: "Completed",
    }
    const updated = [settledPayment, ...current]
    await saveModuleDataToDB("payments", updated)
  }

  // 1. Sync & update Invoices
  try {
    const invoices = await getInvoices()
    const invMatch = invoices.find(i => 
      (normInvId && i.id.toLowerCase().trim() === normInvId) ||
      (i.client.toLowerCase().trim() === normClient && i.project.toLowerCase().trim() === normProject)
    )
    if (invMatch) {
      await updateInvoiceStatus(invMatch.id, "Fully paid", formattedAmount, "₹0")
    }
  } catch (err) {
    console.warn("Error syncing invoice in settleOrUpdatePaymentToCompleted:", err)
  }

  // 2. Sync & update Orders
  try {
    const orders = await fetchModuleDataFromDB<any[]>("orders", [])
    const ordIdx = orders.findIndex(o => 
      (normOrdNum && (o.orderNumber?.toLowerCase().trim() === normOrdNum || o.id?.toLowerCase().trim() === normOrdNum)) ||
      (normInvId && o.invoiceId?.toLowerCase().trim() === normInvId) ||
      (o.client?.toLowerCase().trim() === normClient && o.project?.toLowerCase().trim() === normProject)
    )
    if (ordIdx !== -1) {
      orders[ordIdx] = {
        ...orders[ordIdx],
        paymentStatus: "Paid",
        status: "Completed"
      }
      await saveModuleDataToDB("orders", orders)
    }
  } catch (err) {
    console.warn("Error syncing order in settleOrUpdatePaymentToCompleted:", err)
  }

  // 3. Sync Client ledger
  try {
    const clients = await getClients()
    const cIdx = clients.findIndex(c => 
      c.name.toLowerCase().trim() === normClient || 
      (params.clientEmail && c.email?.toLowerCase().trim() === params.clientEmail.toLowerCase().trim())
    )
    if (cIdx !== -1) {
      const targetClient = clients[cIdx]
      const currentInvoiced = parseInt((targetClient.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
      const currentPaid = parseInt((targetClient.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
      const currentDue = parseInt((targetClient.due || "0").replace(/[^0-9]/g, "")) || 0

      const newPaid = Math.max(currentInvoiced, currentPaid + currentDue)
      const updatedClient = {
        ...targetClient,
        due: "₹0",
        paymentReceived: `₹${newPaid.toLocaleString("en-IN")}`,
      }
      await saveStoredClient(updatedClient, targetClient.companyId)
    }
  } catch (err) {
    console.warn("Error syncing client in settleOrUpdatePaymentToCompleted:", err)
  }

  // 4. Sync Project payment status
  try {
    const { getProjects, updateProject } = await import("@/app/feature/projects/services/projectService")
    const projs = await getProjects()
    const pMatch = projs.find(p => 
      p.title.toLowerCase().trim() === normProject || 
      p.client.toLowerCase().trim() === normClient
    )
    if (pMatch) {
      await updateProject(pMatch.id, {
        paymentStatus: "Paid",
        dueAmount: 0,
        advanceAmount: numAmount,
      })
    }
  } catch (err) {
    console.warn("Error syncing project in settleOrUpdatePaymentToCompleted:", err)
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_orders_updated"))
    window.dispatchEvent(new CustomEvent("saampark_invoices_updated"))
    window.dispatchEvent(new CustomEvent("saampark_projects_updated"))
  }

  return settledPayment
}

export const deletePayment = async (id: string, companyId?: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "payments")
  await markGlobalItemDeleted(String(id).toUpperCase().trim(), "payments")

  const comp = companyId || "all"
  const current = await getPayments(comp)
  const filtered = current.filter(p => String(p.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("payments", filtered, comp)

  if (comp !== "all") {
    const all = await getPayments("all")
    const allFiltered = all.filter(p => String(p.id).toLowerCase().trim() !== strId)
    await saveModuleDataToDB("payments", allFiltered, "all")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("saampark_payments_updated"))
    window.dispatchEvent(new Event("storage"))
  }

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
