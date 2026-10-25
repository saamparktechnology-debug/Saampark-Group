import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"
import { createNotification } from "@/services/notificationService"

export type ApprovalType = 'invoice' | 'quotation' | 'subscription' | 'estimate' | 'other'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface ApprovalRequest {
  id: string
  type: ApprovalType
  title: string
  documentNumber: string
  documentId: string | number
  clientName: string
  clientEmail?: string
  amount: number
  formattedAmount: string
  submittedBy: {
    id?: string
    name: string
    email: string
    role: string
  }
  submittedAt: number // timestamp
  companyId: string
  branchId?: string
  branchName?: string
  subBranchId?: string
  subBranchName?: string
  status: ApprovalStatus
  reviewedBy?: {
    id?: string
    name: string
    email: string
    role: string
  }
  reviewedAt?: number
  rejectionReason?: string
  notes?: string
  dataSnapshot?: any
}

const MODULE_KEY = "approvals"

/**
 * Get all approval requests for the given company scope (or all).
 */
export async function getApprovalRequests(companyId?: string): Promise<ApprovalRequest[]> {
  const rawAll = await fetchModuleDataFromDB<ApprovalRequest[]>(MODULE_KEY, [], "all")
  let list = Array.isArray(rawAll) ? rawAll : []

  if (companyId && companyId !== "all") {
    const rawScoped = await fetchModuleDataFromDB<ApprovalRequest[]>(MODULE_KEY, [], companyId)
    if (Array.isArray(rawScoped) && rawScoped.length > 0) {
      const map = new Map<string, ApprovalRequest>()
      list.forEach(r => { if (r && r.id) map.set(r.id, r) })
      rawScoped.forEach(r => { if (r && r.id) map.set(r.id, r) })
      list = Array.from(map.values())
    }
  }

  return filterGlobalDeletedItems(list, undefined, MODULE_KEY).sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))
}

/**
 * Submit an entity (bill, quotation, subscription, etc.) for admin approval.
 * Returns the created ApprovalRequest, or null if user is already an admin.
 */
export async function submitForApproval(payload: {
  type: ApprovalType
  title: string
  documentNumber: string
  documentId: string | number
  clientName: string
  clientEmail?: string
  amount: number
  formattedAmount?: string
  submittedBy: {
    id?: string
    name: string
    email: string
    role: string
  }
  companyId: string
  branchId?: string
  branchName?: string
  subBranchId?: string
  subBranchName?: string
  notes?: string
  dataSnapshot?: any
}): Promise<ApprovalRequest> {
  const currentScoped = await fetchModuleDataFromDB<ApprovalRequest[]>(MODULE_KEY, [], payload.companyId || "tech")
  const currentAll = await fetchModuleDataFromDB<ApprovalRequest[]>(MODULE_KEY, [], "all")

  let autoBranchId = payload.branchId
  let autoBranchName = payload.branchName
  let autoSubBranchId = payload.subBranchId
  let autoSubBranchName = payload.subBranchName

  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      const st = useAuthStore.getState()
      if (!autoBranchId) {
        autoBranchId = st.activeBranchId || (st.user as any)?.branchId || (st.user as any)?.branch_id
        if (autoBranchId) {
          const foundB = st.branches?.find((b: any) => String(b.id) === String(autoBranchId))
          autoBranchName = foundB?.name || autoBranchId
        }
      }
      if (!autoSubBranchId) {
        autoSubBranchId = st.activeSubBranchId || (st.user as any)?.subBranchId || (st.user as any)?.sub_branch_id
        if (autoSubBranchId) {
          const foundSB = st.subBranches?.find((s: any) => String(s.id) === String(autoSubBranchId))
          autoSubBranchName = foundSB?.name || autoSubBranchId
        }
      }
    } catch {}
  }

  const id = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  const formattedAmount = payload.formattedAmount || `₹${(payload.amount || 0).toLocaleString("en-IN")}`

  const newRequest: ApprovalRequest = {
    id,
    type: payload.type,
    title: payload.title,
    documentNumber: payload.documentNumber,
    documentId: payload.documentId,
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    amount: payload.amount,
    formattedAmount,
    submittedBy: payload.submittedBy,
    submittedAt: Date.now(),
    companyId: payload.companyId || "tech",
    branchId: autoBranchId,
    branchName: autoBranchName,
    subBranchId: autoSubBranchId,
    subBranchName: autoSubBranchName,
    status: "pending",
    notes: payload.notes,
    dataSnapshot: payload.dataSnapshot,
  }

  const updatedScoped = [newRequest, ...(Array.isArray(currentScoped) ? currentScoped.filter(r => r.id !== id) : [])]
  const updatedAll = [newRequest, ...(Array.isArray(currentAll) ? currentAll.filter(r => r.id !== id) : [])]

  await Promise.all([
    saveModuleDataToDB(MODULE_KEY, updatedScoped, payload.companyId || "tech"),
    saveModuleDataToDB(MODULE_KEY, updatedAll, "all"),
  ])

  // Create notifications for Admins
  try {
    createNotification({
      title: `Approval Required: ${payload.type.toUpperCase()}`,
      message: `${payload.submittedBy.name} submitted ${payload.title} (${payload.documentNumber}) for ₹${(payload.amount || 0).toLocaleString("en-IN")} awaiting your approval.`,
      type: "system",
      targetRole: "Admin",
    }).catch(() => {})
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("saampark_approvals_updated"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }

  return newRequest
}

/**
 * Approve a pending approval request and update the underlying entity.
 */
export async function approveApprovalRequest(
  approvalId: string,
  adminUser: { id?: string; name: string; email: string; role: string }
): Promise<ApprovalRequest | null> {
  const allRequests = await getApprovalRequests("all")
  const req = allRequests.find(r => r.id === approvalId)
  if (!req) return null

  const reviewedAt = Date.now()
  const updatedReq: ApprovalRequest = {
    ...req,
    status: "approved",
    reviewedBy: adminUser,
    reviewedAt,
  }

  const updateList = (list: ApprovalRequest[]) =>
    list.map(r => (r.id === approvalId ? updatedReq : r))

  await Promise.all([
    saveModuleDataToDB(MODULE_KEY, updateList(await fetchModuleDataFromDB<ApprovalRequest[]>(MODULE_KEY, [], req.companyId)), req.companyId),
    saveModuleDataToDB(MODULE_KEY, updateList(await fetchModuleDataFromDB<ApprovalRequest[]>(MODULE_KEY, [], "all")), "all"),
  ])

  // Update underlying module entity
  try {
    if (req.type === "invoice") {
      const { fetchModuleDataFromDB, saveModuleDataToDB } = await import("@/lib/storageSync")
      const invoices = await fetchModuleDataFromDB<any[]>("invoices", [], req.companyId)
      const invoicesAll = await fetchModuleDataFromDB<any[]>("invoices", [], "all")
      
      const updateInv = (list: any[]) =>
        list.map(inv => {
          if (String(inv.id).toUpperCase().trim() === String(req.documentId).toUpperCase().trim()) {
            return { ...inv, approvalStatus: "approved", status: inv.status === "Pending Approval" ? "Not paid" : inv.status }
          }
          return inv
        })

      await Promise.all([
        saveModuleDataToDB("invoices", updateInv(invoices), req.companyId),
        saveModuleDataToDB("invoices", updateInv(invoicesAll), "all"),
      ])
    } else if (req.type === "quotation") {
      const { QuotationService } = await import("@/services/salesService")
      const quotes = await QuotationService.getAll({}).catch(() => [])
      const matched = quotes.find((q: any) => String(q.id) === String(req.documentId) || String(q.number) === String(req.documentNumber))
      if (matched) {
        await QuotationService.update(matched.id, {
          ...matched,
          approvalStatus: "approved",
          status: matched.status === "Pending Approval" ? "Sent" : matched.status,
        }).catch(() => {})
      }
    } else if (req.type === "subscription") {
      const { getSubscriptions, updateSubscription } = await import("@/app/feature/subscriptions/services/subscriptionService")
      const subs = await getSubscriptions(req.companyId)
      const matched = subs.find(s => String(s.id) === String(req.documentId))
      if (matched) {
        await updateSubscription(matched.id, {
          approvalStatus: "approved",
          status: (matched.status === ("Pending Approval" as any) ? "Active" : matched.status) as any,
        }, req.companyId)
      }
    }
  } catch (err) {
    console.warn("Underlying approval entity update notice:", err)
  }

  // Notify team member
  try {
    createNotification({
      title: `Approved: ${req.title}`,
      message: `Your ${req.type} (${req.documentNumber}) was approved by ${adminUser.name}.`,
      type: "system",
      targetEmail: req.submittedBy.email,
    }).catch(() => {})
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("saampark_approvals_updated"))
    window.dispatchEvent(new CustomEvent("saampark_invoices_updated"))
    window.dispatchEvent(new CustomEvent("saampark_quotations_updated"))
    window.dispatchEvent(new CustomEvent("saampark_subscriptions_updated"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }

  return updatedReq
}

/**
 * Reject a pending approval request with reason and update the underlying entity.
 */
export async function rejectApprovalRequest(
  approvalId: string,
  adminUser: { id?: string; name: string; email: string; role: string },
  rejectionReason: string
): Promise<ApprovalRequest | null> {
  const allRequests = await getApprovalRequests("all")
  const req = allRequests.find(r => r.id === approvalId)
  if (!req) return null

  const reviewedAt = Date.now()
  const updatedReq: ApprovalRequest = {
    ...req,
    status: "rejected",
    reviewedBy: adminUser,
    reviewedAt,
    rejectionReason: rejectionReason || "Rejected by administrator without specific comment.",
  }

  const updateList = (list: ApprovalRequest[]) =>
    list.map(r => (r.id === approvalId ? updatedReq : r))

  await Promise.all([
    saveModuleDataToDB(MODULE_KEY, updateList(await fetchModuleDataFromDB<ApprovalRequest[]>(MODULE_KEY, [], req.companyId)), req.companyId),
    saveModuleDataToDB(MODULE_KEY, updateList(await fetchModuleDataFromDB<ApprovalRequest[]>(MODULE_KEY, [], "all")), "all"),
  ])

  // Update underlying module entity
  try {
    if (req.type === "invoice") {
      const { fetchModuleDataFromDB, saveModuleDataToDB } = await import("@/lib/storageSync")
      const invoices = await fetchModuleDataFromDB<any[]>("invoices", [], req.companyId)
      const invoicesAll = await fetchModuleDataFromDB<any[]>("invoices", [], "all")
      
      const updateInv = (list: any[]) =>
        list.map(inv => {
          if (String(inv.id).toUpperCase().trim() === String(req.documentId).toUpperCase().trim()) {
            return { ...inv, approvalStatus: "rejected", status: "Rejected" }
          }
          return inv
        })

      await Promise.all([
        saveModuleDataToDB("invoices", updateInv(invoices), req.companyId),
        saveModuleDataToDB("invoices", updateInv(invoicesAll), "all"),
      ])
    } else if (req.type === "quotation") {
      const { QuotationService } = await import("@/services/salesService")
      const quotes = await QuotationService.getAll({}).catch(() => [])
      const matched = quotes.find((q: any) => String(q.id) === String(req.documentId) || String(q.number) === String(req.documentNumber))
      if (matched) {
        await QuotationService.update(matched.id, {
          ...matched,
          approvalStatus: "rejected",
          status: "Declined",
        }).catch(() => {})
      }
    } else if (req.type === "subscription") {
      const { getSubscriptions, updateSubscription } = await import("@/app/feature/subscriptions/services/subscriptionService")
      const subs = await getSubscriptions(req.companyId)
      const matched = subs.find(s => String(s.id) === String(req.documentId))
      if (matched) {
        await updateSubscription(matched.id, {
          approvalStatus: "rejected",
          status: "Canceled",
        }, req.companyId)
      }
    }
  } catch (err) {
    console.warn("Underlying rejection entity update notice:", err)
  }

  // Notify team member
  try {
    createNotification({
      title: `Rejected: ${req.title}`,
      message: `Your ${req.type} (${req.documentNumber}) was rejected by ${adminUser.name}. Reason: ${rejectionReason}`,
      type: "system",
      targetEmail: req.submittedBy.email,
    }).catch(() => {})
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("saampark_approvals_updated"))
    window.dispatchEvent(new CustomEvent("saampark_invoices_updated"))
    window.dispatchEvent(new CustomEvent("saampark_quotations_updated"))
    window.dispatchEvent(new CustomEvent("saampark_subscriptions_updated"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }

  return updatedReq
}

/**
 * Delete an approval record (Admins only).
 */
export async function deleteApprovalRequest(approvalId: string): Promise<boolean> {
  await markGlobalItemDeleted(approvalId, MODULE_KEY)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("saampark_approvals_updated"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }
  return true
}

/**
 * Returns the count of pending approval requests for badges.
 */
export async function getPendingApprovalsCount(companyId?: string): Promise<number> {
  const list = await getApprovalRequests(companyId)
  return list.filter(r => r.status === "pending").length
}
