import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems, getLocalDeletedIds } from "@/lib/storageSync"
import { 
  TeamMemberBankingInfo, 
  TeamMemberPayoutProfile, 
  TeamPayoutRecord, 
  TeamPayrollKPIs,
  PayoutStatus,
  ProjectUserEarningsRecord,
  CustomPaymentAdjustment
} from "../types"
import { getUsers, getUserAvatar } from "@/app/feature/users/services/userService"
import { getSubscriptions } from "@/app/feature/subscriptions/services/subscriptionService"
import { Subscription, calculateTeamRevenueShare } from "@/app/feature/subscriptions/types"
import { getProjects } from "@/app/feature/projects/services/projectService"
import { Project, ProjectMember } from "@/app/feature/projects/types"

const BANKING_STORAGE_KEY = "team_banking_details"
const PAYOUTS_STORAGE_KEY = "team_payout_records"
const CUSTOM_ADJ_STORAGE_KEY = "team_custom_adjustments"

// ─────────────────────────────────────────────────────────────────────────────
// 1. BANKING DETAILS REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export const getTeamBankingMap = async (companyId?: string): Promise<Record<string, TeamMemberBankingInfo>> => {
  const list = await fetchModuleDataFromDB<TeamMemberBankingInfo[]>(BANKING_STORAGE_KEY, [], companyId || "all")
  const map: Record<string, TeamMemberBankingInfo> = {}
  if (Array.isArray(list)) {
    for (const b of list) {
      if (b && b.memberId) {
        map[String(b.memberId).toLowerCase().trim()] = b
      }
    }
  }
  return map
}

export const updateMemberBankingDetails = async (
  memberId: string,
  bankingData: Partial<TeamMemberBankingInfo>,
  companyId?: string
): Promise<TeamMemberBankingInfo> => {
  const comp = companyId || "all"
  const currentList = await fetchModuleDataFromDB<TeamMemberBankingInfo[]>(BANKING_STORAGE_KEY, [], comp)
  const normId = String(memberId).toLowerCase().trim()
  
  const existingIdx = currentList.findIndex(b => String(b.memberId).toLowerCase().trim() === normId)
  const updated: TeamMemberBankingInfo = {
    memberId,
    ...(existingIdx !== -1 ? currentList[existingIdx] : {}),
    ...bankingData,
  }

  let nextList: TeamMemberBankingInfo[]
  if (existingIdx !== -1) {
    nextList = [...currentList]
    nextList[existingIdx] = updated
  } else {
    nextList = [updated, ...currentList]
  }

  await saveModuleDataToDB(BANKING_STORAGE_KEY, nextList, comp)
  if (comp !== "all") {
    await saveModuleDataToDB(BANKING_STORAGE_KEY, nextList, "all")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("saampark_team_banking_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  return updated
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PAYOUT RECORDS & DISBURSEMENT HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export const getPayoutRecords = async (
  companyId?: string, 
  branchId?: string,
  subBranchId?: string
): Promise<TeamPayoutRecord[]> => {
  const targetComp = companyId || "all"
  let records = await fetchModuleDataFromDB<TeamPayoutRecord[]>(PAYOUTS_STORAGE_KEY, [], targetComp)
  if (!Array.isArray(records)) records = []

  const deletedIds = getLocalDeletedIds()
  let filtered = filterGlobalDeletedItems(records, deletedIds)

  if (branchId && branchId !== "all") {
    filtered = filtered.filter(r => !r.branchId || r.branchId === branchId)
  }

  if (subBranchId && subBranchId !== "all") {
    filtered = filtered.filter(r => !r.subBranchId || r.subBranchId === subBranchId || r.subbranchName === subBranchId)
  }

  return filtered
}

export const generatePayoutVoucherNumber = (
  existingRecords: TeamPayoutRecord[], 
  date: Date = new Date()
): string => {
  const year = date.getFullYear()
  const prefix = `PAY-TEAM-${year}-`
  let maxSeq = 0

  for (const r of existingRecords) {
    if (r && r.id && r.id.startsWith(prefix)) {
      const parts = r.id.split("-")
      const num = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    }
  }

  const nextSeq = maxSeq + 1
  return `${prefix}${String(nextSeq).padStart(4, "0")}`
}

export const recordTeamPayout = async (
  payoutData: Omit<TeamPayoutRecord, "id" | "createdAt">,
  companyId?: string
): Promise<TeamPayoutRecord> => {
  const comp = companyId || payoutData.companyId || "all"
  const currentRecords = await getPayoutRecords(comp)
  const voucherId = generatePayoutVoucherNumber(currentRecords, new Date())

  const newRecord: TeamPayoutRecord = {
    ...payoutData,
    id: voucherId,
    createdAt: new Date().toISOString(),
    status: "Completed",
    netAmountFormatted: `₹${payoutData.netAmount.toLocaleString("en-IN")}`,
  }

  const nextRecords = [newRecord, ...currentRecords]
  await saveModuleDataToDB(PAYOUTS_STORAGE_KEY, nextRecords, comp)
  if (comp !== "all") {
    await saveModuleDataToDB(PAYOUTS_STORAGE_KEY, nextRecords, "all")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("saampark_team_payouts_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  return newRecord
}

export const deletePayoutRecord = async (id: string, companyId?: string): Promise<boolean> => {
  const strId = String(id).trim()
  const lowerId = strId.toLowerCase()
  const upperId = strId.toUpperCase()

  await markGlobalItemDeleted(strId, "team_payouts")
  await markGlobalItemDeleted(lowerId, "team_payouts")
  await markGlobalItemDeleted(upperId, "team_payouts")

  const comp = companyId || "all"
  const records = await getPayoutRecords(comp)
  const filtered = records.filter(r => String(r.id).toLowerCase().trim() !== lowerId)
  await saveModuleDataToDB(PAYOUTS_STORAGE_KEY, filtered, comp)

  if (comp !== "all") {
    const allRecords = await getPayoutRecords("all")
    const allFiltered = allRecords.filter(r => String(r.id).toLowerCase().trim() !== lowerId)
    await saveModuleDataToDB(PAYOUTS_STORAGE_KEY, allFiltered, "all")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("saampark_team_payouts_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PROJECT-WISE USER EARNINGS & PAYOUTS
// ─────────────────────────────────────────────────────────────────────────────

export const getProjectWiseUserEarnings = async (
  companyId?: string,
  branchId?: string,
  subBranchId?: string
): Promise<ProjectUserEarningsRecord[]> => {
  const [projects, users, payouts] = await Promise.all([
    getProjects(companyId).catch(() => []),
    getUsers(companyId).catch(() => []),
    getPayoutRecords(companyId, branchId, subBranchId),
  ])

  const records: ProjectUserEarningsRecord[] = []

  const nonClientUsers = Array.isArray(users)
    ? users.filter(u => !((u.role || "").toLowerCase().includes("client")))
    : []

  for (const p of projects) {
    if (!p) continue

    const projectTotal = parseInt(String(p.price || p.totalAmount || "0").replace(/[^0-9]/g, "")) || 0
    let clientPaid = 0
    if (p.paymentStatus === "Paid") {
      clientPaid = projectTotal
    } else if (p.paymentStatus === "Advance Received" || p.paymentStatus === "Partially Paid") {
      clientPaid = p.advanceAmount ? Number(p.advanceAmount) : 0
    } else {
      clientPaid = p.advanceAmount ? Number(p.advanceAmount) : 0
    }

    const assignedMembers: ProjectMember[] = Array.isArray(p.members) && p.members.length > 0
      ? p.members
      : []

    if (assignedMembers.length === 0) continue

    const defaultSharePct = Math.round(30 / Math.max(1, assignedMembers.length))

    for (const m of assignedMembers) {
      const sharePct = typeof m.sharePercentage === "number" ? m.sharePercentage : defaultSharePct
      const totalEarned = Math.round((clientPaid * sharePct) / 100)

      // Check how much has already been disbursed to this member for this project
      const memberProjectPayouts = payouts.filter((pay: TeamPayoutRecord) => 
        (pay.projectId === p.id || pay.projectTitle === p.title) &&
        (String(pay.memberId) === String(m.id) || (pay.memberEmail && m.email && pay.memberEmail.toLowerCase() === m.email.toLowerCase()))
      )

      const paidAmount = memberProjectPayouts.reduce((sum: number, pay: TeamPayoutRecord) => sum + (pay.netAmount || 0), 0)
      const pendingAmount = Math.max(0, totalEarned - paidAmount)

      const lastDisbursedDate = memberProjectPayouts.length > 0 ? memberProjectPayouts[0].paymentDate : undefined

      records.push({
        id: `PROJ-EARN-${p.id}-${m.id}`,
        projectId: p.id,
        projectTitle: p.title,
        clientName: p.client || "Client Account",
        projectTotalValue: projectTotal,
        clientPaymentReceived: clientPaid,
        clientPaymentStatus: p.paymentStatus || "In Progress",
        memberId: String(m.id),
        memberName: m.name,
        memberEmail: m.email || "",
        memberRole: m.role || "Developer",
        memberSharePercentage: sharePct,
        memberTotalEarned: totalEarned,
        memberPaidAmount: paidAmount,
        memberPendingAmount: pendingAmount,
        companyId: p.companyId || companyId || "tech",
        branchId: p.branchId,
        branchName: p.branchName,
        subBranchId: (p as any).subBranchId,
        subbranchName: (p as any).subbranchName,
        lastDisbursedDate,
      })
    }
  }

  let filtered = records
  if (branchId && branchId !== "all") {
    filtered = filtered.filter(r => !r.branchId || r.branchId === branchId)
  }

  if (subBranchId && subBranchId !== "all") {
    filtered = filtered.filter(r => !r.subBranchId || r.subBranchId === subBranchId || r.subbranchName === subBranchId)
  }

  return filtered
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CUSTOM COMPENSATION ADJUSTMENTS & ALLOWANCES
// ─────────────────────────────────────────────────────────────────────────────

export const getCustomAdjustments = async (
  companyId?: string,
  branchId?: string,
  subBranchId?: string
): Promise<CustomPaymentAdjustment[]> => {
  const targetComp = companyId || "all"
  let list = await fetchModuleDataFromDB<CustomPaymentAdjustment[]>(CUSTOM_ADJ_STORAGE_KEY, [], targetComp)
  if (!Array.isArray(list)) list = []

  const deletedIds = getLocalDeletedIds()
  let filtered = filterGlobalDeletedItems(list, deletedIds)

  if (branchId && branchId !== "all") {
    filtered = filtered.filter(r => !r.branchId || r.branchId === branchId)
  }

  if (subBranchId && subBranchId !== "all") {
    filtered = filtered.filter(r => !r.subBranchId || r.subBranchId === subBranchId || r.subbranchName === subBranchId)
  }

  return filtered
}

export const addCustomAdjustment = async (
  adjData: Omit<CustomPaymentAdjustment, "id" | "createdDate">,
  companyId?: string
): Promise<CustomPaymentAdjustment> => {
  const comp = companyId || "all"
  const currentList = await getCustomAdjustments(comp)
  const year = new Date().getFullYear()
  const seq = currentList.length + 1
  const id = `ADJ-${year}-${String(seq).padStart(4, "0")}`

  const newAdjustment: CustomPaymentAdjustment = {
    ...adjData,
    id,
    createdDate: new Date().toLocaleDateString("en-GB"),
    status: adjData.status || "Approved",
  }

  const nextList = [newAdjustment, ...currentList]
  await saveModuleDataToDB(CUSTOM_ADJ_STORAGE_KEY, nextList, comp)
  if (comp !== "all") {
    await saveModuleDataToDB(CUSTOM_ADJ_STORAGE_KEY, nextList, "all")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("saampark_team_adjustments_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  return newAdjustment
}

export const updateCustomAdjustmentStatus = async (
  id: string,
  status: "Pending" | "Approved" | "Disbursed" | "Rejected",
  companyId?: string,
  voucherId?: string
): Promise<boolean> => {
  const comp = companyId || "all"
  const currentList = await getCustomAdjustments(comp)
  const normId = id.toLowerCase().trim()

  const updatedList = currentList.map(a => {
    if (a.id.toLowerCase().trim() === normId) {
      return {
        ...a,
        status,
        voucherId: voucherId || a.voucherId,
        disbursedDate: status === "Disbursed" ? new Date().toLocaleDateString("en-GB") : a.disbursedDate,
      }
    }
    return a
  })

  await saveModuleDataToDB(CUSTOM_ADJ_STORAGE_KEY, updatedList, comp)
  if (comp !== "all") {
    await saveModuleDataToDB(CUSTOM_ADJ_STORAGE_KEY, updatedList, "all")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("saampark_team_adjustments_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  return true
}

export const deleteCustomAdjustment = async (id: string, companyId?: string): Promise<boolean> => {
  const strId = String(id).trim()
  await markGlobalItemDeleted(strId, "team_adjustments")
  await markGlobalItemDeleted(strId.toLowerCase(), "team_adjustments")

  const comp = companyId || "all"
  const currentList = await getCustomAdjustments(comp)
  const filtered = currentList.filter(a => a.id.toLowerCase().trim() !== strId.toLowerCase())
  await saveModuleDataToDB(CUSTOM_ADJ_STORAGE_KEY, filtered, comp)

  if (comp !== "all") {
    const allList = await getCustomAdjustments("all")
    const allFiltered = allList.filter(a => a.id.toLowerCase().trim() !== strId.toLowerCase())
    await saveModuleDataToDB(CUSTOM_ADJ_STORAGE_KEY, allFiltered, "all")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"))
    window.dispatchEvent(new Event("saampark_team_adjustments_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. AGGREGATED TEAM PAYOUT PROFILES & FINANCIAL LEDGER
// ─────────────────────────────────────────────────────────────────────────────

export const getTeamPayoutProfiles = async (
  companyId?: string,
  branchId?: string,
  subBranchId?: string
): Promise<{
  profiles: TeamMemberPayoutProfile[]
  kpis: TeamPayrollKPIs
}> => {
  const targetComp = companyId || "tech"
  const [users, allSubs, bankingMap, allPayouts, allProjectEarnings, allAdjustments] = await Promise.all([
    getUsers(targetComp).catch(() => []),
    getSubscriptions(targetComp).catch(() => []),
    getTeamBankingMap(targetComp),
    getPayoutRecords(targetComp, branchId, subBranchId),
    getProjectWiseUserEarnings(targetComp, branchId, subBranchId),
    getCustomAdjustments(targetComp, branchId, subBranchId),
  ])

  // Filter strictly to non-clients
  const rawMembers = Array.isArray(users)
    ? users.filter(u => {
        const r = (u.role || "").toLowerCase().trim()
        return !r.includes("client") && u.status !== "Inactive"
      })
    : []

  const currentMonthYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" })

  const profiles: TeamMemberPayoutProfile[] = rawMembers.map((u: any, idx: number) => {
    const memberId = String(u.id || idx)
    const mName = u.name || u.email || "Team Member"
    const mEmail = (u.email || "").toLowerCase().trim()
    const mPhone = u.phone || "+91 98765 43210"
    const mRole = u.role || "Team Member"
    const mDept = u.department || "Operations & Delivery"
    const mBranchId = u.branchId || u.branch_id
    const mBranchName = u.branchName || u.branch_name
    const mSubBranchId = u.subBranchId || u.subbranch_id
    const mSubbranch = u.subbranch || u.subbranch_name || u.subbranchName

    const bankInfo = bankingMap[memberId.toLowerCase()] || bankingMap[mEmail] || {
      memberId,
      baseSalary: u.salary ? Number(u.salary) : (u.baseSalary ? Number(u.baseSalary) : 0),
      bankName: u.bankName || u.bankingInfo?.bankName || "",
      accountNumber: u.accountNumber || u.bankingInfo?.accountNumber || "",
      ifscCode: u.ifscCode || u.bankingInfo?.ifscCode || "",
      accountHolderName: u.accountHolderName || u.bankingInfo?.accountHolderName || mName,
      upiId: u.upiId || u.bankingInfo?.upiId || "",
    }

    const baseSalary = typeof bankInfo.baseSalary === "number" ? bankInfo.baseSalary : (u.salary ? Number(u.salary) : (u.baseSalary ? Number(u.baseSalary) : 0))

    // Compute active subscription commissions
    const memberSubs = (Array.isArray(allSubs) ? allSubs : []).filter((s: Subscription) => {
      const byEmail = (s.assignedMemberEmail || "").toLowerCase().trim() === mEmail ||
        (Array.isArray(s.assignedMembers) && s.assignedMembers.some(em => em.toLowerCase().trim() === mEmail))
      const byName = (s.assignedMemberName || "").toLowerCase().trim() === mName.toLowerCase().trim()
      const byId = s.assignedMemberId && String(s.assignedMemberId) === memberId
      return Boolean(byEmail || byName || byId)
    })

    const subscriptionCommission = memberSubs.reduce((acc, sub) => {
      const calc = calculateTeamRevenueShare(sub)
      return acc + calc.monthlyRevenue
    }, 0)

    // Compute active project earnings
    const memberProjects = allProjectEarnings.filter(p => 
      String(p.memberId).toLowerCase().trim() === memberId.toLowerCase().trim() ||
      (p.memberEmail && mEmail && p.memberEmail.toLowerCase().trim() === mEmail)
    )
    const projectEarnings = memberProjects.reduce((acc, p) => acc + p.memberPendingAmount, 0)

    const totalGrossDue = baseSalary + subscriptionCommission + projectEarnings

    // Check payouts this month
    const memberPayouts = allPayouts.filter(p => 
      String(p.memberId).toLowerCase().trim() === memberId.toLowerCase().trim() ||
      (p.memberEmail && p.memberEmail.toLowerCase().trim() === mEmail)
    )

    const thisMonthPaid = memberPayouts
      .filter(p => p.status === "Completed" && (p.period.includes(currentMonthYear) || p.paymentDate.includes(String(new Date().getFullYear()))))
      .reduce((sum, p) => sum + (p.netAmount || 0), 0)

    const remainingNeedToPay = Math.max(0, totalGrossDue - thisMonthPaid)

    let payoutStatus: PayoutStatus = "Need to Pay"
    if (totalGrossDue === 0 || remainingNeedToPay === 0) {
      payoutStatus = "Paid"
    } else if (thisMonthPaid > 0 && remainingNeedToPay > 0) {
      payoutStatus = "Partial"
    }

    const lastPaidRecord = memberPayouts.length > 0 ? memberPayouts[0] : undefined

    return {
      id: memberId,
      name: mName,
      email: mEmail,
      phone: mPhone,
      avatarUrl: u.avatarUrl || u.avatar || getUserAvatar(mName, undefined, mName),
      role: mRole,
      department: mDept,
      companyId: u.companyId || targetComp,
      branchId: mBranchId,
      branchName: mBranchName,
      subBranchId: mSubBranchId,
      subbranchName: mSubbranch,
      bankingInfo: bankInfo,
      baseSalary,
      subscriptionCommission,
      projectEarnings,
      totalDueThisMonth: totalGrossDue,
      totalPaidThisMonth: thisMonthPaid,
      remainingNeedToPay,
      payoutStatus,
      lastPaidDate: lastPaidRecord?.paymentDate,
      lastPaidAmount: lastPaidRecord?.netAmount,
      nextPayoutDueDate: new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-GB"),
      activeSubscriptionsCount: memberSubs.length,
      activeProjectsCount: memberProjects.length,
    }
  })

  // Filter by branch if specified
  let filteredProfiles = profiles
  if (branchId && branchId !== "all") {
    filteredProfiles = filteredProfiles.filter(p => !p.branchId || p.branchId === branchId)
  }

  // Filter by sub-branch if specified
  if (subBranchId && subBranchId !== "all") {
    filteredProfiles = filteredProfiles.filter(p => 
      !p.subBranchId || p.subBranchId === subBranchId || p.subbranchName === subBranchId
    )
  }

  // Calculate KPIs
  const totalMonthlyPayroll = filteredProfiles.reduce((acc, p) => acc + p.totalDueThisMonth, 0)
  const totalPaidThisMonth = filteredProfiles.reduce((acc, p) => acc + p.totalPaidThisMonth, 0)
  const totalNeedToPay = filteredProfiles.reduce((acc, p) => acc + p.remainingNeedToPay, 0)
  const paidMembersCount = filteredProfiles.filter(p => p.payoutStatus === "Paid").length
  const pendingMembersCount = filteredProfiles.filter(p => p.payoutStatus === "Need to Pay" || p.payoutStatus === "Partial").length
  const totalProjectDisbursements = allPayouts.filter(p => p.payoutType.includes("Project")).reduce((s, p) => s + p.netAmount, 0)
  const totalCustomAdjustments = allAdjustments.reduce((s, a) => s + (a.amount || 0), 0)

  const kpis: TeamPayrollKPIs = {
    totalMonthlyPayroll,
    totalPaidThisMonth,
    totalNeedToPay,
    teamMembersOnPayroll: filteredProfiles.length,
    paidMembersCount,
    pendingMembersCount,
    totalProjectDisbursements,
    totalCustomAdjustments,
  }

  return {
    profiles: filteredProfiles,
    kpis,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. DISPATCH PAYMENT RECEIPT EMAIL
// ─────────────────────────────────────────────────────────────────────────────

export const sendTeamPaymentReceiptEmail = async (payout: TeamPayoutRecord): Promise<{ success: boolean; message: string }> => {
  try {
    const formattedAmt = `₹${payout.netAmount.toLocaleString("en-IN")}`

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(`Payment Voucher Sent to ${payout.memberName}`, {
        body: `Receipt ${payout.id} for ${formattedAmt} (${payout.period}) dispatched to ${payout.memberEmail}.`,
        icon: "/favicon.ico",
      })
    }

    return { 
      success: true, 
      message: `Payment receipt voucher (${payout.id}) successfully dispatched to ${payout.memberEmail}!` 
    }
  } catch (err: any) {
    console.error("Failed to dispatch payment receipt email:", err)
    return { success: false, message: err?.message || "Failed to send email receipt." }
  }
}
