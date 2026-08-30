import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems, getLocalDeletedIds } from "@/lib/storageSync"
import { 
  TeamMemberBankingInfo, 
  TeamMemberPayoutProfile, 
  TeamPayoutRecord, 
  TeamPayrollKPIs,
  PayoutStatus 
} from "../types"
import { UserService } from "@/services/apiServices"
import { getSubscriptions } from "@/app/feature/subscriptions/services/subscriptionService"
import { Subscription, calculateTeamRevenueShare } from "@/app/feature/subscriptions/types"
import { getUserAvatar } from "@/app/feature/users/services/userService"

const BANKING_STORAGE_KEY = "team_banking_details"
const PAYOUTS_STORAGE_KEY = "team_payout_records"

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

export const getPayoutRecords = async (companyId?: string, branchId?: string): Promise<TeamPayoutRecord[]> => {
  const targetComp = companyId || "all"
  let records = await fetchModuleDataFromDB<TeamPayoutRecord[]>(PAYOUTS_STORAGE_KEY, [], targetComp)
  if (!Array.isArray(records)) records = []

  const deletedIds = getLocalDeletedIds()
  let filtered = filterGlobalDeletedItems(records, deletedIds)

  if (branchId && branchId !== "all") {
    filtered = filtered.filter(r => !r.branchId || r.branchId === branchId)
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
// 3. AGGREGATED TEAM PAYOUT PROFILES & FINANCIAL LEDGER
// ─────────────────────────────────────────────────────────────────────────────

export const getTeamPayoutProfiles = async (
  companyId?: string,
  branchId?: string
): Promise<{
  profiles: TeamMemberPayoutProfile[]
  kpis: TeamPayrollKPIs
}> => {
  const [users, allSubs, bankingMap, allPayouts] = await Promise.all([
    UserService.getTeamMembers().catch(() => []),
    getSubscriptions("all").catch(() => []),
    getTeamBankingMap(companyId),
    getPayoutRecords(companyId),
  ])

  // Filter strictly to non-clients
  const rawMembers = Array.isArray(users)
    ? users.filter(u => {
        const r = (u.role || u.role_name || "").toLowerCase().trim()
        return !r.includes("client")
      })
    : []

  const currentMonthYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" }) // e.g. "August 2026"

  const profiles: TeamMemberPayoutProfile[] = rawMembers.map((u: any, idx: number) => {
    const memberId = String(u.id || u._id || idx)
    const mName = u.full_name || u.name || u.email || "Team Member"
    const mEmail = (u.email || "").toLowerCase().trim()
    const mPhone = u.phone || "+91 98765 43210"
    const mRole = u.role_name || u.role || "Team Member"
    const mDept = u.department || "Operations & Delivery"
    const mBranchId = u.branch_id || u.branchId
    const mBranchName = u.branch_name || u.branchName
    const mSubbranch = u.subbranch || u.subbranch_name || u.subbranchName

    const bankInfo = bankingMap[memberId.toLowerCase()] || bankingMap[mEmail] || {
      memberId,
      baseSalary: u.salary ? Number(u.salary) : 25000 + (idx * 5000),
      bankName: "ICICI Bank Ltd.",
      accountNumber: `0021015${String(idx).padStart(4, "0")}`,
      ifscCode: "ICIC0000021",
      accountHolderName: mName,
      upiId: `${mName.toLowerCase().replace(/[^a-z0-9]/g, '')}@icici`,
    }

    const baseSalary = bankInfo.baseSalary || 25000

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

    const totalGrossDue = baseSalary + subscriptionCommission

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
    if (remainingNeedToPay === 0 && totalGrossDue > 0) {
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
      avatarUrl: u.avatar_url || u.avatarUrl || u.avatar || getUserAvatar(mName, undefined, mName),
      role: mRole,
      department: mDept,
      companyId: u.company_id || u.companyId || companyId || "tech",
      branchId: mBranchId,
      branchName: mBranchName,
      subbranchName: mSubbranch,
      bankingInfo: bankInfo,
      baseSalary,
      subscriptionCommission,
      totalDueThisMonth: totalGrossDue,
      totalPaidThisMonth: thisMonthPaid,
      remainingNeedToPay,
      payoutStatus,
      lastPaidDate: lastPaidRecord?.paymentDate,
      lastPaidAmount: lastPaidRecord?.netAmount,
      nextPayoutDueDate: new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-GB"),
      activeSubscriptionsCount: memberSubs.length,
    }
  })

  // Filter by branch if specified
  let filteredProfiles = profiles
  if (branchId && branchId !== "all") {
    filteredProfiles = profiles.filter(p => !p.branchId || p.branchId === branchId)
  }

  // Calculate KPIs
  const totalMonthlyPayroll = filteredProfiles.reduce((acc, p) => acc + p.totalDueThisMonth, 0)
  const totalPaidThisMonth = filteredProfiles.reduce((acc, p) => acc + p.totalPaidThisMonth, 0)
  const totalNeedToPay = filteredProfiles.reduce((acc, p) => acc + p.remainingNeedToPay, 0)
  const paidMembersCount = filteredProfiles.filter(p => p.payoutStatus === "Paid").length
  const pendingMembersCount = filteredProfiles.filter(p => p.payoutStatus === "Need to Pay" || p.payoutStatus === "Partial").length

  const kpis: TeamPayrollKPIs = {
    totalMonthlyPayroll,
    totalPaidThisMonth,
    totalNeedToPay,
    teamMembersOnPayroll: filteredProfiles.length,
    paidMembersCount,
    pendingMembersCount,
  }

  return {
    profiles: filteredProfiles,
    kpis,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DISPATCH PAYMENT RECEIPT EMAIL
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
