import { Subscription, InstallmentItem, InstallmentScheduleItem, InstallmentStatus, SubscriptionStatus } from "../types"
import { SubscriptionService } from "@/services/apiServices"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"
import { Project } from "@/app/feature/projects/types"
import { sendGenericReminderEmail } from "@/services/emailNotificationService"

// Helper: Calculate next billing date based on cycle with safe month-end & leap year handling
export function calculateNextCycleDate(startDate: string, cycle: string, customDays?: number): string {
  const d = startDate ? new Date(startDate) : new Date()
  const valid = isNaN(d.getTime()) ? new Date() : new Date(d.getTime())

  switch (cycle) {
    case "Daily":
      valid.setDate(valid.getDate() + 1)
      break
    case "Weekly":
      valid.setDate(valid.getDate() + 7)
      break
    case "Monthly": {
      const curDay = valid.getDate()
      valid.setDate(1)
      valid.setMonth(valid.getMonth() + 1)
      const maxDaysInTarget = new Date(valid.getFullYear(), valid.getMonth() + 1, 0).getDate()
      valid.setDate(Math.min(curDay, maxDaysInTarget))
      break
    }
    case "Quarterly": {
      const curDay = valid.getDate()
      valid.setDate(1)
      valid.setMonth(valid.getMonth() + 3)
      const maxDaysInTarget = new Date(valid.getFullYear(), valid.getMonth() + 1, 0).getDate()
      valid.setDate(Math.min(curDay, maxDaysInTarget))
      break
    }
    case "Half-Yearly": {
      const curDay = valid.getDate()
      valid.setDate(1)
      valid.setMonth(valid.getMonth() + 6)
      const maxDaysInTarget = new Date(valid.getFullYear(), valid.getMonth() + 1, 0).getDate()
      valid.setDate(Math.min(curDay, maxDaysInTarget))
      break
    }
    case "Annually": {
      const curDay = valid.getDate()
      const curMonth = valid.getMonth()
      valid.setFullYear(valid.getFullYear() + 1)
      const maxDaysInTarget = new Date(valid.getFullYear(), curMonth + 1, 0).getDate()
      valid.setDate(Math.min(curDay, maxDaysInTarget))
      break
    }
    case "Custom Days":
      valid.setDate(valid.getDate() + (customDays && customDays > 0 ? customDays : 30))
      break
    default: {
      const curDay = valid.getDate()
      valid.setDate(1)
      valid.setMonth(valid.getMonth() + 1)
      const maxDaysInTarget = new Date(valid.getFullYear(), valid.getMonth() + 1, 0).getDate()
      valid.setDate(Math.min(curDay, maxDaysInTarget))
      break
    }
  }

  const y = valid.getFullYear()
  const m = String(valid.getMonth() + 1).padStart(2, "0")
  const dt = String(valid.getDate()).padStart(2, "0")
  return `${y}-${m}-${dt}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RECURRING SUBSCRIPTIONS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const getSubscriptions = async (companyId?: string): Promise<Subscription[]> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  const effectiveComp = (!targetComp || targetComp === "all") ? "tech" : targetComp

  const map = new Map<string, Subscription>()

  // 1. Load from dedicated subscriptions table
  const [scopedSubs, allSubs] = await Promise.all([
    fetchModuleDataFromDB<Subscription[]>("subscriptions", [], effectiveComp).catch(() => []),
    fetchModuleDataFromDB<Subscription[]>("subscriptions", [], "all").catch(() => []),
  ])

  const targetNorm = effectiveComp.toLowerCase().trim()

  for (const s of (Array.isArray(allSubs) ? allSubs : [])) {
    if (s && s.id) {
      const sComp = (s.companyId || (s as any).company || "tech").toLowerCase().trim()
      if (sComp === targetNorm || (targetNorm === "tech" && !s.companyId)) {
        const numAmt = s.numericAmount || parseInt(String(s.amount).replace(/[^0-9]/g, "")) || 0
        map.set(String(s.id).toLowerCase().trim(), {
          ...s,
          numericAmount: numAmt,
          amount: s.amount.startsWith("₹") ? s.amount : `₹${numAmt.toLocaleString("en-IN")}`,
          autoRenew: s.autoRenew !== undefined ? s.autoRenew : true,
          firstPaymentDate: s.firstPaymentDate || s.startDate,
        })
      }
    }
  }

  for (const s of (Array.isArray(scopedSubs) ? scopedSubs : [])) {
    if (s && s.id) {
      const sComp = (s.companyId || (s as any).company || effectiveComp).toLowerCase().trim()
      if (sComp === targetNorm || (targetNorm === "tech" && !s.companyId) || !s.companyId) {
        const numAmt = s.numericAmount || parseInt(String(s.amount).replace(/[^0-9]/g, "")) || 0
        map.set(String(s.id).toLowerCase().trim(), {
          ...s,
          numericAmount: numAmt,
          amount: s.amount.startsWith("₹") ? s.amount : `₹${numAmt.toLocaleString("en-IN")}`,
          autoRenew: s.autoRenew !== undefined ? s.autoRenew : true,
          firstPaymentDate: s.firstPaymentDate || s.startDate,
        })
      }
    }
  }

  // 2. Discover from backend REST API if available
  try {
    const liveSubs = await SubscriptionService.getSubscriptions().catch(() => [])
    if (Array.isArray(liveSubs) && liveSubs.length > 0) {
      for (const s of liveSubs) {
        const id = String(s.id || s._id)
        if (!map.has(id.toLowerCase().trim())) {
          const numAmt = parseInt(String(s.amount || "0").replace(/[^0-9]/g, "")) || 0
          map.set(id.toLowerCase().trim(), {
            id: id,
            clientName: s.customer_id ? `Customer #${s.customer_id}` : 'Customer',
            clientEmail: s.email || "",
            planName: s.package_id ? `Package 0${s.package_id}` : 'Standard Retainer',
            status: s.status ? (s.status.charAt(0).toUpperCase() + s.status.slice(1)) as SubscriptionStatus : 'Active',
            amount: `₹${numAmt.toLocaleString("en-IN")}`,
            numericAmount: numAmt,
            billingCycle: s.billing_cycle ? (s.billing_cycle.charAt(0).toUpperCase() + s.billing_cycle.slice(1)) as any : 'Monthly',
            startDate: s.start_date || new Date().toISOString().split("T")[0],
            nextBillingDate: s.next_billing_date || '-',
            autoRenew: true,
          })
        }
      }
    }
  } catch {}

  return filterGlobalDeletedItems(Array.from(map.values()))
}

export const addSubscription = async (sub: Omit<Subscription, "id">, companyId?: string): Promise<Subscription> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  const effectiveComp = (!targetComp || targetComp === "all") ? "tech" : targetComp

  const current = await fetchModuleDataFromDB<Subscription[]>("subscriptions", [], effectiveComp)
  const currentAll = await fetchModuleDataFromDB<Subscription[]>("subscriptions", [], "all")

  const numAmt = sub.numericAmount || parseInt(String(sub.amount).replace(/[^0-9]/g, "")) || 0
  const formattedAmt = sub.amount.startsWith("₹") ? sub.amount : `₹${numAmt.toLocaleString("en-IN")}`

  const newSub: Subscription = {
    ...sub,
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    amount: formattedAmt,
    numericAmount: numAmt,
    autoRenew: sub.autoRenew !== undefined ? sub.autoRenew : true,
    startDate: sub.startDate || sub.firstPaymentDate || new Date().toISOString().split("T")[0],
    firstPaymentDate: sub.firstPaymentDate || sub.startDate || new Date().toISOString().split("T")[0],
    companyId: effectiveComp,
  }

  const updatedScoped = [newSub, ...(Array.isArray(current) ? current.filter(s => s.id !== newSub.id) : [])]
  const updatedAll = [newSub, ...(Array.isArray(currentAll) ? currentAll.filter(s => s.id !== newSub.id) : [])]

  await Promise.all([
    saveModuleDataToDB("subscriptions", updatedScoped, effectiveComp),
    saveModuleDataToDB("subscriptions", updatedAll, "all"),
  ])

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }

  return newSub
}

export const updateSubscription = async (id: string, sub: Partial<Subscription>, companyId?: string): Promise<Subscription | null> => {
  const targetComp = companyId || "all"
  const current = await fetchModuleDataFromDB<Subscription[]>("subscriptions", [], targetComp)
  const currentAll = await fetchModuleDataFromDB<Subscription[]>("subscriptions", [], "all")

  let updatedSub: Subscription | null = null
  const updateList = (list: Subscription[]) =>
    list.map(s => {
      if (String(s.id).toLowerCase().trim() === String(id).toLowerCase().trim()) {
        updatedSub = { ...s, ...sub }
        return updatedSub
      }
      return s
    })

  await Promise.all([
    saveModuleDataToDB("subscriptions", updateList(current), targetComp),
    saveModuleDataToDB("subscriptions", updateList(currentAll), "all"),
  ])

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }

  return updatedSub
}

export const renewSubscription = async (
  id: string, 
  customNextDate?: string, 
  generateInvoice: boolean = true,
  companyId?: string
): Promise<Subscription | null> => {
  const allSubs = await getSubscriptions(companyId)
  const sub = allSubs.find(s => String(s.id).toLowerCase().trim() === String(id).toLowerCase().trim())
  if (!sub) return null

  const nextDate = customNextDate || calculateNextCycleDate(sub.nextBillingDate || new Date().toISOString(), sub.billingCycle, sub.customDaysCount)

  const updated = await updateSubscription(id, {
    status: "Active",
    lastRenewedDate: new Date().toISOString().split("T")[0],
    nextBillingDate: nextDate,
  }, companyId)

  // Auto-generate invoice for next renewal cycle if requested
  if (generateInvoice) {
    try {
      const { addInvoice } = await import("@/app/feature/sales/invoices/services/invoiceService")
      const numAmt = sub.numericAmount || parseInt(String(sub.amount).replace(/[^0-9]/g, "")) || 0
      const gstAmt = Math.round(numAmt * 0.18)
      const totalInvoiced = numAmt + gstAmt

      await addInvoice({
        client: sub.clientName,
        clientEmail: sub.clientEmail,
        project: `${sub.planName} (Renewal)`,
        billDate: new Date().toISOString().split("T")[0],
        dueDate: nextDate,
        baseAmount: numAmt,
        gstRate: 18,
        gstAmount: gstAmt,
        totalInvoiced: `₹${totalInvoiced.toLocaleString("en-IN")}`,
        paymentReceived: "₹0",
        due: `₹${totalInvoiced.toLocaleString("en-IN")}`,
        status: "Not paid",
        items: [
          {
            id: `line_${Date.now()}`,
            serviceName: `${sub.planName} - ${sub.billingCycle} Retainer`,
            sacCode: "998315",
            qty: 1,
            unit: sub.billingCycle,
            rate: numAmt,
            gstRate: 18,
            gstAmount: gstAmt,
            totalAmount: totalInvoiced,
          }
        ],
      } as any, companyId || sub.companyId || "tech")
    } catch (err) {
      console.warn("Could not auto-generate renewal invoice:", err)
    }
  }

  return updated
}

export const sendSubscriptionReminder = async (id: string, companyId?: string): Promise<boolean> => {
  const allSubs = await getSubscriptions(companyId)
  const sub = allSubs.find(s => String(s.id).toLowerCase().trim() === String(id).toLowerCase().trim())
  if (!sub || !sub.clientEmail) return false

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #005f69; margin-top: 0;">Subscription Renewal Notice</h2>
      <p>Dear <strong>${sub.clientName}</strong>,</p>
      <p>This is a friendly reminder that your recurring subscription for <strong>${sub.planName}</strong> is scheduled for renewal on <strong>${sub.nextBillingDate}</strong>.</p>
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #005f69;">
        <p style="margin: 4px 0;"><strong>Plan:</strong> ${sub.planName}</p>
        <p style="margin: 4px 0;"><strong>Billing Interval:</strong> ${sub.billingCycle}</p>
        <p style="margin: 4px 0;"><strong>Amount Due:</strong> ${sub.amount}</p>
        <p style="margin: 4px 0;"><strong>Next Renewal Date:</strong> ${sub.nextBillingDate}</p>
      </div>
      <p>Thank you for choosing SAAMPARK Group. Please let us know if you have any questions.</p>
      <p style="color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px;">SAAMPARK Group • Automated Billing Services</p>
    </div>
  `

  const ok = await sendGenericReminderEmail(
    sub.clientEmail,
    `Subscription Renewal Reminder: ${sub.planName} - SAAMPARK Group`,
    html,
    sub.clientName
  )

  if (ok) {
    await updateSubscription(id, { lastReminderSentAt: new Date().toISOString() }, companyId)
  }
  return ok
}

export const deleteSubscription = async (id: string, companyId?: string): Promise<void> => {
  await markGlobalItemDeleted(id, "subscriptions")
  const targetComp = companyId || "all"
  const current = await fetchModuleDataFromDB<Subscription[]>("subscriptions", [], targetComp)
  const updated = current.filter(s => s.id !== id)
  await Promise.all([
    saveModuleDataToDB("subscriptions", updated, targetComp),
    saveModuleDataToDB("subscriptions", updated, "all"),
  ])
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. INSTALLMENTS & PART-PAYMENT SERVICE (EMI / MILESTONES)
// ─────────────────────────────────────────────────────────────────────────────

export const getInstallments = async (companyId?: string): Promise<InstallmentItem[]> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  const effectiveComp = (!targetComp || targetComp === "all") ? "tech" : targetComp
  const targetNorm = effectiveComp.toLowerCase().trim()

  const map = new Map<string, InstallmentItem>()

  // 1. Fetch explicitly saved installments records
  const [scopedInsts, allInsts] = await Promise.all([
    fetchModuleDataFromDB<InstallmentItem[]>("installments", [], effectiveComp).catch(() => []),
    fetchModuleDataFromDB<InstallmentItem[]>("installments", [], "all").catch(() => []),
  ])

  for (const item of (Array.isArray(allInsts) ? allInsts : [])) {
    if (item && item.id) {
      const iComp = (item.companyId || (item as any).company || "tech").toLowerCase().trim()
      if (iComp === targetNorm || (targetNorm === "tech" && !item.companyId)) {
        map.set(String(item.id).toLowerCase().trim(), item)
      }
    }
  }
  for (const item of (Array.isArray(scopedInsts) ? scopedInsts : [])) {
    if (item && item.id) {
      const iComp = (item.companyId || (item as any).company || effectiveComp).toLowerCase().trim()
      if (iComp === targetNorm || (targetNorm === "tech" && !item.companyId) || !item.companyId) {
        map.set(String(item.id).toLowerCase().trim(), item)
      }
    }
  }

  // 2. Aggregate from Projects that have Part Payments / Installments
  try {
    const [scopedProjects, allProjects] = await Promise.all([
      fetchModuleDataFromDB<Project[]>("projects", [], effectiveComp).catch(() => []),
      fetchModuleDataFromDB<Project[]>("projects", [], "all").catch(() => []),
    ])

    const combinedProjects = [
      ...(Array.isArray(allProjects) ? allProjects : []).filter(p => {
        const pComp = (p.companyId || (p as any).company || "tech").toLowerCase().trim()
        return pComp === targetNorm || (targetNorm === "tech" && !p.companyId)
      }),
      ...(Array.isArray(scopedProjects) ? scopedProjects : []).filter(p => {
        const pComp = (p.companyId || (p as any).company || effectiveComp).toLowerCase().trim()
        return pComp === targetNorm || (targetNorm === "tech" && !p.companyId) || !p.companyId
      })
    ]

    for (const p of combinedProjects) {
      if (!p || !p.id) continue
      const isPartPayment = Boolean(
        (p.installmentsCount && p.installmentsCount > 1) ||
        (p.installmentAmount && p.installmentAmount > 0) ||
        (p.paymentStructure && String(p.paymentStructure).includes("Part")) ||
        (Array.isArray(p.labels) && p.labels.some(l => String(l).toLowerCase().includes("part") || String(l).toLowerCase().includes("installment")))
      )

      if (isPartPayment) {
        const instId = `inst_proj_${p.id}`
        if (!map.has(instId.toLowerCase().trim())) {
          const totalVal = parseInt(String(p.price || "0").replace(/[^0-9]/g, "")) || 0
          const totalPaid = p.advanceAmount || 0
          const remaining = p.dueAmount !== undefined ? p.dueAmount : Math.max(0, totalVal - totalPaid)
          const totalCount = p.installmentsCount || 3
          const perInst = p.installmentAmount || (totalCount > 0 ? Math.round(remaining / totalCount) : remaining)

          // Build schedule matrix
          const schedule: InstallmentScheduleItem[] = []
          const baseDate = p.startDate ? new Date(p.startDate) : new Date()
          const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate

          let currentPendingNum = 1
          let currentDue = p.deadline || new Date().toISOString().split("T")[0]

          for (let i = 1; i <= totalCount; i++) {
            const instDueDate = new Date(validBase)
            instDueDate.setMonth(instDueDate.getMonth() + i)
            const dueDateStr = instDueDate.toISOString().split("T")[0]

            // Check if covered by advance/payments
            const isCovered = (totalPaid >= (perInst * i)) || (remaining === 0)
            const isOverdue = !isCovered && (new Date(dueDateStr).getTime() < Date.now())

            const instStatus: InstallmentStatus = isCovered ? "Paid" : isOverdue ? "Overdue" : "Pending"

            if (instStatus !== "Paid" && currentPendingNum === 1) {
              currentPendingNum = i
              currentDue = dueDateStr
            }

            schedule.push({
              installmentNumber: i,
              amount: perInst,
              formattedAmount: `₹${perInst.toLocaleString("en-IN")}`,
              dueDate: dueDateStr,
              status: instStatus,
              paidDate: isCovered ? (p.startDate || new Date().toISOString().split("T")[0]) : undefined,
              paidAmount: isCovered ? perInst : 0,
            })
          }

          const overallStatus: InstallmentStatus = remaining === 0 
            ? "Paid" 
            : schedule.some(s => s.status === "Overdue") 
              ? "Overdue" 
              : totalPaid > 0 
                ? "Partially Paid" 
                : "Pending"

          map.set(instId.toLowerCase().trim(), {
            id: instId,
            projectId: String(p.id),
            clientId: p.clientId,
            clientName: p.client || "Client",
            clientEmail: (p as any).clientEmail || (p as any).email || "",
            clientPhone: (p as any).clientPhone || (p as any).phone || "",
            clientCompany: (p as any).companyName || p.client || "Client Business",
            projectTitle: p.title,
            totalContractValue: totalVal,
            totalAdvancePaid: p.advanceAmount || 0,
            totalPaid: totalPaid,
            remainingBalance: remaining,
            totalInstallments: totalCount,
            currentInstallmentNumber: currentPendingNum,
            currentInstallmentAmount: perInst,
            currentDueDate: currentDue,
            status: overallStatus,
            schedule,
            companyId: effectiveComp,
            branchId: p.branchId,
            branchName: p.branchName,
            assignedMembers: p.members?.map(m => m.name) || [],
            assignedMemberEmails: p.members?.map(m => m.email || "").filter(Boolean) || [],
            billedBy: p.billedBy,
            createdById: p.createdById,
            createdAt: p.startDate || new Date().toISOString().split("T")[0],
          })
        }
      }
    }
  } catch (err) {
    console.warn("Could not aggregate installment projects:", err)
  }

  return filterGlobalDeletedItems(Array.from(map.values()))
}

export const saveInstallmentRecord = async (item: InstallmentItem, companyId?: string): Promise<InstallmentItem> => {
  const targetComp = companyId || item.companyId || "all"
  const current = await fetchModuleDataFromDB<InstallmentItem[]>("installments", [], targetComp)
  const currentAll = await fetchModuleDataFromDB<InstallmentItem[]>("installments", [], "all")

  const updatedScoped = [item, ...(Array.isArray(current) ? current.filter(i => i.id !== item.id) : [])]
  const updatedAll = [item, ...(Array.isArray(currentAll) ? currentAll.filter(i => i.id !== item.id) : [])]

  await Promise.all([
    saveModuleDataToDB("installments", updatedScoped, targetComp),
    saveModuleDataToDB("installments", updatedAll, "all"),
  ])

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }

  return item
}

export const recordInstallmentPayment = async (
  installmentId: string,
  installmentNumber: number,
  amountPaid: number,
  paymentMethod: string = "UPI / Bank Transfer",
  companyId?: string
): Promise<InstallmentItem | null> => {
  const allInsts = await getInstallments(companyId)
  const inst = allInsts.find(i => String(i.id).toLowerCase().trim() === String(installmentId).toLowerCase().trim())
  if (!inst) return null

  const updatedSchedule = inst.schedule.map(s => {
    if (s.installmentNumber === installmentNumber) {
      return {
        ...s,
        status: "Paid" as InstallmentStatus,
        paidDate: new Date().toISOString().split("T")[0],
        paidAmount: amountPaid,
        paymentMethod,
      }
    }
    return s
  })

  const newTotalPaid = updatedSchedule.filter(s => s.status === "Paid").reduce((sum, s) => sum + (s.paidAmount || s.amount), inst.totalAdvancePaid)
  const newRemaining = Math.max(0, inst.totalContractValue - newTotalPaid)
  const nextPending = updatedSchedule.find(s => s.status !== "Paid")

  const updatedInst: InstallmentItem = {
    ...inst,
    totalPaid: newTotalPaid,
    remainingBalance: newRemaining,
    currentInstallmentNumber: nextPending ? nextPending.installmentNumber : inst.totalInstallments,
    currentInstallmentAmount: nextPending ? nextPending.amount : 0,
    currentDueDate: nextPending ? nextPending.dueDate : "-",
    status: newRemaining === 0 ? "Paid" : updatedSchedule.some(s => s.status === "Overdue") ? "Overdue" : "Partially Paid",
    schedule: updatedSchedule,
  }

  await saveInstallmentRecord(updatedInst, companyId)

  // Also cascade update to associated Project if exists
  if (inst.projectId) {
    try {
      const { updateProject } = await import("@/app/feature/projects/services/projectService")
      await updateProject(inst.projectId, {
        advanceAmount: newTotalPaid,
        dueAmount: newRemaining,
        paymentStatus: newRemaining === 0 ? "Paid" : "Partially Paid",
      })
    } catch {}
  }

  return updatedInst
}

export const sendInstallmentReminder = async (
  installmentId: string,
  installmentNumber?: number,
  companyId?: string
): Promise<boolean> => {
  const allInsts = await getInstallments(companyId)
  const inst = allInsts.find(i => String(i.id).toLowerCase().trim() === String(installmentId).toLowerCase().trim())
  if (!inst || !inst.clientEmail) return false

  const targetInstNum = installmentNumber || inst.currentInstallmentNumber
  const targetItem = inst.schedule.find(s => s.installmentNumber === targetInstNum) || inst.schedule[0]

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #005f69; margin-top: 0;">Payment Due Reminder</h2>
      <p>Dear <strong>${inst.clientName}</strong>,</p>
      <p>This is a reminder regarding the upcoming installment payment for project <strong>"${inst.projectTitle}"</strong>.</p>
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #005f69;">
        <p style="margin: 4px 0;"><strong>Installment:</strong> #${targetInstNum} of ${inst.totalInstallments}</p>
        <p style="margin: 4px 0;"><strong>Installment Amount:</strong> ${targetItem ? targetItem.formattedAmount : `₹${inst.currentInstallmentAmount.toLocaleString("en-IN")}`}</p>
        <p style="margin: 4px 0;"><strong>Due Date:</strong> ${targetItem ? targetItem.dueDate : inst.currentDueDate}</p>
        <p style="margin: 4px 0;"><strong>Total Outstanding Balance:</strong> ₹${inst.remainingBalance.toLocaleString("en-IN")}</p>
      </div>
      <p>Please initiate the payment at your earliest convenience to maintain project delivery velocity.</p>
      <p style="color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px;">SAAMPARK Group • Accounts & Billing Department</p>
    </div>
  `

  const ok = await sendGenericReminderEmail(
    inst.clientEmail,
    `Payment Reminder: Installment #${targetInstNum} for "${inst.projectTitle}" - SAAMPARK Group`,
    html,
    inst.clientName
  )

  if (ok) {
    const updatedSchedule = inst.schedule.map(s => {
      if (s.installmentNumber === targetInstNum) {
        return { ...s, reminderSentAt: new Date().toISOString() }
      }
      return s
    })

    await saveInstallmentRecord({
      ...inst,
      lastReminderSentAt: new Date().toISOString(),
      schedule: updatedSchedule,
    }, companyId)
  }

  return ok
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GENERATE INVOICE AGAINST SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────

export const generateSubscriptionInvoice = async (
  sub: Subscription,
  companyId?: string
): Promise<any> => {
  const { addInvoice, getInvoices, generateInvoiceNumber } = await import("@/app/feature/sales/invoices/services/invoiceService")
  const { calculateOverdueDetails } = await import("../types")
  
  const isNonGst = Boolean(sub.isNonGst || sub.taxType === "nongst" || sub.gstRate === 0)
  const effectiveComp = companyId || sub.companyId || "tech"
  const allInvoices = await getInvoices("all")
  const invoiceId = generateInvoiceNumber(allInvoices, new Date(), isNonGst)
  
  const overdueInfo = calculateOverdueDetails(sub)
  const baseNum = overdueInfo.baseDue
  const lateFeeNum = overdueInfo.accumulatedLateFee

  const subtotal = baseNum + lateFeeNum
  const gstRate = isNonGst ? 0 : 18
  const gstAmount = isNonGst ? 0 : Math.round(subtotal * 0.18)
  const grandTotal = subtotal + gstAmount
  const formattedTotal = `₹${grandTotal.toLocaleString("en-IN")}`

  const items: any[] = [
    {
      id: `svc_${Date.now()}`,
      serviceName: `${sub.planName} (${sub.billingCycle} Retainer Cycle)`,
      sacCode: "998313",
      qty: 1,
      unit: sub.billingCycle || "Cycle",
      rate: baseNum,
      charges: [],
      gstRate: gstRate,
      gstAmount: isNonGst ? 0 : Math.round(baseNum * 0.18),
      totalAmount: isNonGst ? baseNum : (baseNum + Math.round(baseNum * 0.18)),
    }
  ]

  if (lateFeeNum > 0 && overdueInfo.daysOverdue > 0) {
    items.push({
      id: `late_fee_${Date.now()}`,
      serviceName: `Overdue Late Charge (${overdueInfo.daysOverdue} Days @ ₹${overdueInfo.dailyLateFee}/day)`,
      sacCode: "998319",
      qty: overdueInfo.daysOverdue,
      unit: "Day",
      rate: overdueInfo.dailyLateFee,
      charges: [],
      gstRate: gstRate,
      gstAmount: isNonGst ? 0 : Math.round(lateFeeNum * 0.18),
      totalAmount: isNonGst ? lateFeeNum : (lateFeeNum + Math.round(lateFeeNum * 0.18)),
    })
  }

  const newInv = await addInvoice({
    id: invoiceId,
    client: sub.clientName,
    clientEmail: sub.clientEmail || `${sub.clientName.toLowerCase().replace(/\s+/g, '')}@client.com`,
    project: `${sub.planName} — Subscription (${sub.billingCycle}${isNonGst ? ' • 0% Non-GST' : ''})`,
    billDate: new Date().toLocaleDateString("en-GB"),
    dueDate: sub.nextBillingDate || new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-GB"),
    baseAmount: subtotal,
    setupCharge: 0,
    discount: 0,
    gstRate: gstRate,
    gstAmount: gstAmount,
    totalInvoiced: formattedTotal,
    paymentReceived: "₹0",
    due: formattedTotal,
    status: overdueInfo.isOverdue ? "Not paid" : "Not paid",
    billedBy: sub.billedBy || "Admin",
    companyId: effectiveComp,
    branchId: sub.branchId || undefined,
    branchName: sub.branchName || undefined,
    items: items,
  }, effectiveComp)

  // Update subscription metadata
  await updateSubscription(sub.id, {
    invoicesCount: (sub.invoicesCount || 0) + 1,
    accumulatedLateFee: lateFeeNum,
    overdueDays: overdueInfo.daysOverdue,
  }, effectiveComp)

  return newInv
}


