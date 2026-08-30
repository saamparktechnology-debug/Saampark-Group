"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  CreditCard, 
  Building2, 
  QrCode, 
  Search, 
  RefreshCw, 
  Send, 
  Trash2, 
  Eye, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  Shield, 
  Edit, 
  Plus, 
  Lock, 
  Filter,
  Download,
  Printer,
  Sparkles,
  Layers
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { 
  TeamMemberPayoutProfile, 
  TeamPayoutRecord, 
  TeamPayrollKPIs,
  TeamMemberBankingInfo 
} from "../types"
import { 
  getTeamPayoutProfiles, 
  getPayoutRecords, 
  updateMemberBankingDetails, 
  deletePayoutRecord, 
  sendTeamPaymentReceiptEmail 
} from "../services/teamPaymentService"
import { RecordPayoutModal } from "../components/RecordPayoutModal"
import { EditMemberBankingModal } from "../components/EditMemberBankingModal"
import { TeamPaymentReceiptModal } from "../components/TeamPaymentReceiptModal"
import { MemberPayoutLedgerModal } from "../components/MemberPayoutLedgerModal"
import { Button } from "@/components/ui/Button"
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"

export default function TeamPaymentsPage() {
  const { activeCompanyId, activeBranchId, branches, user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const roleLower = (user?.role || "").toLowerCase().trim()
  const isSuperAdmin = roleLower.includes("super") || roleLower === "super admin"
  const isCompanyAdmin = !isSuperAdmin && (
    roleLower.includes("admin") || 
    roleLower.includes("owner") || 
    roleLower.includes("manager") ||
    roleLower === "admin"
  )
  const isSingleBranchAdmin = Boolean(
    !isSuperAdmin &&
    user?.branchId && 
    (roleLower.includes("branch admin") || roleLower.includes("branch manager") || roleLower.includes("branch"))
  )
  const isClient = roleLower.includes("client")

  // Permissions
  const canAddPayout = canPerformAction(user, "Teams", "add") || isSuperAdmin || isCompanyAdmin
  const canEditBanking = canPerformAction(user, "Teams", "edit") || isSuperAdmin || isCompanyAdmin
  const canDeletePayout = canPerformAction(user, "Teams", "delete") || isSuperAdmin || isCompanyAdmin

  // Active View Tab: "directory" | "records"
  const [activeTab, setActiveTab] = React.useState<"directory" | "records">("directory")

  // Branch Selector Filter
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>("all")
  React.useEffect(() => {
    if (isSingleBranchAdmin && user?.branchId) {
      setSelectedBranchId(user.branchId)
    } else if (activeBranchId) {
      setSelectedBranchId(activeBranchId)
    } else {
      setSelectedBranchId("all")
    }
  }, [isSingleBranchAdmin, user?.branchId, activeBranchId])

  // Data States
  const [profiles, setProfiles] = React.useState<TeamMemberPayoutProfile[]>([])
  const [records, setRecords] = React.useState<TeamPayoutRecord[]>([])
  const [kpis, setKpis] = React.useState<TeamPayrollKPIs>({
    totalMonthlyPayroll: 0,
    totalPaidThisMonth: 0,
    totalNeedToPay: 0,
    teamMembersOnPayroll: 0,
    paidMembersCount: 0,
    pendingMembersCount: 0,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  // Modals
  const [payingProfile, setPayingProfile] = React.useState<TeamMemberPayoutProfile | null>(null)
  const [editingBankingProfile, setEditingBankingProfile] = React.useState<TeamMemberPayoutProfile | null>(null)
  const [viewingReceipt, setViewingReceipt] = React.useState<TeamPayoutRecord | null>(null)
  const [viewingLedgerProfile, setViewingLedgerProfile] = React.useState<TeamMemberPayoutProfile | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Load Data
  const loadData = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const comp = activeCompanyId || "tech"
      const branch = selectedBranchId
      const [pData, rData] = await Promise.all([
        getTeamPayoutProfiles(comp, branch),
        getPayoutRecords(comp, branch),
      ])
      setProfiles(pData.profiles)
      setKpis(pData.kpis)
      setRecords(rData)
    } catch (err) {
      console.error("Error loading team payments data:", err)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [activeCompanyId, selectedBranchId])

  React.useEffect(() => {
    loadData(true)
    const handleReload = () => loadData(false)
    window.addEventListener("storage", handleReload)
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_branch_switched", handleReload)
    window.addEventListener("saampark_team_payouts_updated", handleReload)
    window.addEventListener("saampark_team_banking_updated", handleReload)

    return () => {
      window.removeEventListener("storage", handleReload)
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_branch_switched", handleReload)
      window.removeEventListener("saampark_team_payouts_updated", handleReload)
      window.removeEventListener("saampark_team_banking_updated", handleReload)
    }
  }, [loadData])

  // Save Banking updates
  const handleSaveBanking = async (memberId: string, data: Partial<TeamMemberBankingInfo>) => {
    await updateMemberBankingDetails(memberId, data, activeCompanyId || "tech")
    showToast("✅ Banking and UPI details successfully updated!")
    loadData(false)
  }

  // Delete Voucher
  const handleDeleteVoucher = async (id: string) => {
    if (!canDeletePayout) {
      alert("You do not have permission to delete payout records.")
      return
    }
    if (confirm(`Delete disbursement voucher ${id}?`)) {
      await deletePayoutRecord(id, activeCompanyId || "tech")
      showToast(`Voucher ${id} deleted.`)
      loadData(false)
    }
  }

  // Resend Receipt Email
  const handleResendReceipt = async (record: TeamPayoutRecord) => {
    showToast(`Sending receipt voucher to ${record.memberEmail}...`)
    const res = await sendTeamPaymentReceiptEmail(record)
    showToast(res.success ? `✅ Receipt sent to ${record.memberEmail}!` : "❌ Failed to send receipt.")
  }

  // Filtered Profiles
  const filteredProfiles = React.useMemo(() => {
    return profiles.filter((p) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        (p.bankingInfo?.bankName && p.bankingInfo.bankName.toLowerCase().includes(q)) ||
        (p.bankingInfo?.upiId && p.bankingInfo.upiId.toLowerCase().includes(q))

      const matchesStatus = statusFilter === "all" || p.payoutStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [profiles, searchQuery, statusFilter])

  // Filtered Records
  const filteredRecords = React.useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim()
      return !q ||
        r.id.toLowerCase().includes(q) ||
        r.memberName.toLowerCase().includes(q) ||
        r.memberEmail.toLowerCase().includes(q) ||
        r.period.toLowerCase().includes(q) ||
        (r.transactionRef && r.transactionRef.toLowerCase().includes(q))
    })
  }, [records, searchQuery])

  // Export Excel
  const handleExportExcel = () => {
    if (activeTab === "directory") {
      exportToExcel({
        filename: `Team_Payroll_Directory_${new Date().toISOString().split("T")[0]}`,
        title: "Team Members Payroll & Banking Directory",
        subtitle: `All Team Members (${filteredProfiles.length} Records)`,
        headers: [
          "Member Name", 
          "Email", 
          "Role", 
          "Department", 
          "Branch", 
          "Base Salary", 
          "Commission", 
          "Total Gross Due", 
          "Paid This Month", 
          "Need To Pay", 
          "Status", 
          "Bank Name", 
          "Account No", 
          "IFSC", 
          "UPI ID"
        ],
        rows: filteredProfiles.map(p => [
          p.name,
          p.email,
          p.role,
          p.department,
          p.branchName || "HQ",
          p.baseSalary,
          p.subscriptionCommission,
          p.totalDueThisMonth,
          p.totalPaidThisMonth,
          p.remainingNeedToPay,
          p.payoutStatus,
          p.bankingInfo?.bankName || "-",
          p.bankingInfo?.accountNumber || "-",
          p.bankingInfo?.ifscCode || "-",
          p.bankingInfo?.upiId || "-",
        ])
      })
    } else {
      exportToExcel({
        filename: `Team_Payout_Records_${new Date().toISOString().split("T")[0]}`,
        title: "Team Payout Vouchers & Disbursement Records",
        subtitle: `Disbursement Ledger (${filteredRecords.length} Records)`,
        headers: [
          "Voucher ID", 
          "Payment Date", 
          "Member Name", 
          "Member Email", 
          "Period", 
          "Payout Type", 
          "Payment Method", 
          "Transaction UTR", 
          "Base Amount", 
          "Commission", 
          "Bonus", 
          "Deductions", 
          "Net Amount Paid"
        ],
        rows: filteredRecords.map(r => [
          r.id,
          r.paymentDate,
          r.memberName,
          r.memberEmail,
          r.period,
          r.payoutType,
          r.paymentMethod,
          r.transactionRef || "-",
          r.baseAmount,
          r.commissionAmount,
          r.bonus || 0,
          r.deductions || 0,
          r.netAmount,
        ])
      })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[999999] px-4 py-3 bg-zinc-900 text-white text-xs font-semibold rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <CreditCard size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Teams Payments & Payroll Hub</span>
              </h1>
              <p className="text-xs text-zinc-500">
                Manage team banking profiles, monitor "Need to Pay" salaries & commissions, disburse vouchers, and dispatch email receipts.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Branch Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Branch Filter Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs">
            <Building2 size={13} className="text-zinc-400 shrink-0" />
            <select
              value={selectedBranchId}
              disabled={isSingleBranchAdmin}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent font-bold text-zinc-800 dark:text-zinc-200 focus:outline-hidden cursor-pointer disabled:cursor-not-allowed text-xs"
            >
              {!isSingleBranchAdmin && (
                <>
                  <option value="all">🏢 All Branches & HQ</option>
                  <option value="hq">🏢 Central Office / HQ</option>
                </>
              )}
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  📍 {b.name} ({b.code || 'Branch'})
                </option>
              ))}
            </select>
            {isSingleBranchAdmin && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1 flex items-center gap-0.5" title="Branch is locked to your assigned branch">
                <Lock size={10} />
              </span>
            )}
          </div>

          <Button size="sm" variant="secondary" onClick={handleExportExcel} leftIcon={<Download size={13} />}>
            Export Excel
          </Button>

          <Button size="sm" variant="secondary" onClick={() => loadData(true)} leftIcon={<RefreshCw size={13} />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Liability */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Monthly Payroll</div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              ₹{kpis.totalMonthlyPayroll.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-zinc-500 font-semibold mt-1">
              {kpis.teamMembersOnPayroll} Team Members
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CreditCard size={22} />
          </div>
        </div>

        {/* Total Paid */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Paid This Month</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{kpis.totalPaidThisMonth.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {kpis.paidMembersCount} Members Settled
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Outstanding Need to Pay */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Need To Pay / Outstanding</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              ₹{kpis.totalNeedToPay.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
              {kpis.pendingMembersCount} Payouts Pending
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Team Size */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Payroll Headcount</div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {profiles.length} Staff
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
              Active Compensation Ledger
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <User size={22} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl w-fit border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "directory"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <User size={14} />
            <span>Team Members & Banking ({profiles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("records")}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "records"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <CreditCard size={14} />
            <span>Payout Vouchers & History ({records.length})</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search member, role, bank, UPI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-hidden w-60"
            />
          </div>

          {activeTab === "directory" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-hidden"
            >
              <option value="all">All Payout Statuses</option>
              <option value="Need to Pay">⚠️ Need to Pay</option>
              <option value="Paid">✅ Paid</option>
              <option value="Partial">🟡 Partial</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {isLoading ? (
        <ThreeDotLoader text="Loading team payroll profiles & records..." fullScreen={false} />
      ) : activeTab === "directory" ? (
        /* ── TAB 1: TEAM MEMBERS PAYROLL & BANKING DIRECTORY ── */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-850/70 border-b border-zinc-200/80 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Team Member</th>
                  <th className="py-3.5 px-3">Role & Dept</th>
                  <th className="py-3.5 px-3">Bank & UPI Details</th>
                  <th className="py-3.5 px-3">Base Salary</th>
                  <th className="py-3.5 px-3">Commission</th>
                  <th className="py-3.5 px-3">Total Need To Pay</th>
                  <th className="py-3.5 px-3 text-center">Payout Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400">
                      No team members match the search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((p) => {
                    const b = p.bankingInfo || {}
                    return (
                      <tr key={p.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                        {/* Member Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.avatarUrl}
                              alt={p.name}
                              className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono truncate">
                                {p.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role & Dept */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {p.role}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {p.department}
                            {p.branchName && ` • 📍 ${p.branchName}`}
                          </div>
                        </td>

                        {/* Bank & UPI Details */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            {b.accountNumber ? (
                              <div className="flex items-center gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">
                                <Building2 size={11} className="text-blue-500 shrink-0" />
                                <span>{b.bankName || "Bank"} (A/C: ••••{b.accountNumber.slice(-4)})</span>
                              </div>
                            ) : (
                              <div className="text-[10.5px] text-zinc-400 italic">No bank a/c added</div>
                            )}

                            {b.upiId && (
                              <div className="flex items-center gap-1.5 text-[10.5px] text-teal-600 dark:text-teal-400 font-mono">
                                <QrCode size={10} className="shrink-0" />
                                <span>{b.upiId}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Base Salary */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="font-bold text-zinc-800 dark:text-zinc-200">
                            ₹{p.baseSalary.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-zinc-400">Fixed Monthly</div>
                        </td>

                        {/* Subscription Commission */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="font-bold text-indigo-600 dark:text-indigo-400">
                            +₹{p.subscriptionCommission.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-indigo-500/80">
                            {p.activeSubscriptionsCount} Subscriptions
                          </div>
                        </td>

                        {/* Total Need To Pay */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                            ₹{p.remainingNeedToPay.toLocaleString("en-IN")}
                          </div>
                          {p.totalPaidThisMonth > 0 && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Paid: ₹{p.totalPaidThisMonth.toLocaleString("en-IN")}
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {p.payoutStatus === "Paid" ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              <span>Paid</span>
                            </span>
                          ) : p.payoutStatus === "Partial" ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                              <Clock size={11} />
                              <span>Partial</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-800 inline-flex items-center gap-1 animate-pulse">
                              <AlertTriangle size={11} />
                              <span>Need to Pay</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Pay Member Button */}
                            {canAddPayout && (
                              <button
                                type="button"
                                onClick={() => setPayingProfile(p)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                                title="Disburse payment to this team member"
                              >
                                <DollarSign size={12} />
                                <span>Pay</span>
                              </button>
                            )}

                            {/* Edit Banking Button */}
                            {canEditBanking && (
                              <button
                                type="button"
                                onClick={() => setEditingBankingProfile(p)}
                                className="px-2 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Edit Bank and UPI details"
                              >
                                <Building2 size={11} />
                                <span>Bank/UPI</span>
                              </button>
                            )}

                            {/* Payout History Ledger */}
                            <button
                              type="button"
                              onClick={() => setViewingLedgerProfile(p)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              title="View member payout ledger history"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── TAB 2: PAYOUT RECORDS & DISBURSEMENT HISTORY ── */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-850/70 border-b border-zinc-200/80 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Voucher ID</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3">Team Member</th>
                  <th className="py-3.5 px-3">Period & Category</th>
                  <th className="py-3.5 px-3">Payment Method</th>
                  <th className="py-3.5 px-3">Transaction UTR / Ref</th>
                  <th className="py-3.5 px-3 text-right">Net Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400">
                      No payout vouchers recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {r.id}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-500 font-medium whitespace-nowrap">
                        {r.paymentDate}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{r.memberName}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{r.memberEmail}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200">{r.period}</div>
                        <div className="text-[10px] text-zinc-400">{r.payoutType}</div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[10px] border border-zinc-200 dark:border-zinc-700">
                          {r.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                        {r.transactionRef || "-"}
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                        ₹{r.netAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Voucher */}
                          <button
                            type="button"
                            onClick={() => setViewingReceipt(r)}
                            className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="View printable voucher"
                          >
                            <Eye size={12} />
                            <span>Voucher</span>
                          </button>

                          {/* Email Receipt */}
                          <button
                            type="button"
                            onClick={() => handleResendReceipt(r)}
                            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer transition-colors"
                            title="Resend receipt email to member"
                          >
                            <Send size={12} />
                          </button>

                          {/* Delete */}
                          {canDeletePayout && (
                            <button
                              type="button"
                              onClick={() => handleDeleteVoucher(r.id)}
                              className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete voucher record"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. Record Payout Disbursement Modal */}
      <RecordPayoutModal
        isOpen={Boolean(payingProfile)}
        profile={payingProfile}
        onClose={() => setPayingProfile(null)}
        onSuccess={(payout) => {
          showToast(`🎉 Payment of ₹${payout.netAmount.toLocaleString("en-IN")} disbursed to ${payout.memberName}!`)
          loadData(false)
          setViewingReceipt(payout)
        }}
      />

      {/* 2. Edit Member Banking & UPI Modal */}
      <EditMemberBankingModal
        isOpen={Boolean(editingBankingProfile)}
        profile={editingBankingProfile}
        onClose={() => setEditingBankingProfile(null)}
        onSave={handleSaveBanking}
      />

      {/* 3. Official Payment Receipt Voucher Modal */}
      <TeamPaymentReceiptModal
        isOpen={Boolean(viewingReceipt)}
        payout={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
      />

      {/* 4. Single Member Historical Payout Ledger Modal */}
      <MemberPayoutLedgerModal
        isOpen={Boolean(viewingLedgerProfile)}
        profile={viewingLedgerProfile}
        onClose={() => setViewingLedgerProfile(null)}
        onViewReceipt={(payout) => setViewingReceipt(payout)}
        onPayNow={(p) => setPayingProfile(p)}
      />
    </motion.div>
  )
}
