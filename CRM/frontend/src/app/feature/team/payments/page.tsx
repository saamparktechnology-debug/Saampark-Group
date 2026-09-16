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
  Layers,
  FolderGit2,
  CheckSquare,
  HelpCircle,
  TrendingUp,
  Receipt
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { 
  TeamMemberPayoutProfile, 
  TeamPayoutRecord, 
  TeamPayrollKPIs,
  TeamMemberBankingInfo,
  ProjectUserEarningsRecord,
  CustomPaymentAdjustment,
  PayoutType
} from "../types"
import { 
  getTeamPayoutProfiles, 
  getPayoutRecords, 
  updateMemberBankingDetails, 
  deletePayoutRecord, 
  sendTeamPaymentReceiptEmail,
  getProjectWiseUserEarnings,
  getCustomAdjustments,
  updateCustomAdjustmentStatus,
  deleteCustomAdjustment,
  recordTeamPayout
} from "../services/teamPaymentService"
import { RecordPayoutModal } from "../components/RecordPayoutModal"
import { EditMemberBankingModal } from "../components/EditMemberBankingModal"
import { TeamPaymentReceiptModal } from "../components/TeamPaymentReceiptModal"
import { MemberPayoutLedgerModal } from "../components/MemberPayoutLedgerModal"
import { DisburseProjectShareModal } from "../components/DisburseProjectShareModal"
import { AddCustomAdjustmentModal } from "../components/AddCustomAdjustmentModal"
import { Button } from "@/components/ui/Button"
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"
import { exportToExcel } from "@/lib/exportUtils"

export default function TeamPaymentsPage() {
  const { activeCompanyId, activeBranchId, branches, subBranches, user } = useAuthStore()
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

  // Active View Tab: "directory" | "projects" | "history" | "custom"
  const [activeTab, setActiveTab] = React.useState<"directory" | "projects" | "history" | "custom">("directory")

  // Branch & Sub-Branch Selector Filters
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>("all")
  const [selectedSubBranchId, setSelectedSubBranchId] = React.useState<string>("all")

  React.useEffect(() => {
    if (isSingleBranchAdmin && user?.branchId) {
      setSelectedBranchId(user.branchId)
    } else if (activeBranchId) {
      setSelectedBranchId(activeBranchId)
    } else {
      setSelectedBranchId("all")
    }
  }, [isSingleBranchAdmin, user?.branchId, activeBranchId])

  // Filter available sub-branches based on selected branch
  const availableSubBranches = React.useMemo(() => {
    if (selectedBranchId === "all") return subBranches
    return subBranches.filter(sb => sb.parentBranchId === selectedBranchId)
  }, [subBranches, selectedBranchId])

  // Data States
  const [profiles, setProfiles] = React.useState<TeamMemberPayoutProfile[]>([])
  const [records, setRecords] = React.useState<TeamPayoutRecord[]>([])
  const [projectEarnings, setProjectEarnings] = React.useState<ProjectUserEarningsRecord[]>([])
  const [customAdjustments, setCustomAdjustments] = React.useState<CustomPaymentAdjustment[]>([])
  
  const [kpis, setKpis] = React.useState<TeamPayrollKPIs>({
    totalMonthlyPayroll: 0,
    totalPaidThisMonth: 0,
    totalNeedToPay: 0,
    teamMembersOnPayroll: 0,
    paidMembersCount: 0,
    pendingMembersCount: 0,
    totalProjectDisbursements: 0,
    totalCustomAdjustments: 0,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")

  // Modals
  const [payingProfile, setPayingProfile] = React.useState<TeamMemberPayoutProfile | null>(null)
  const [editingBankingProfile, setEditingBankingProfile] = React.useState<TeamMemberPayoutProfile | null>(null)
  const [viewingReceipt, setViewingReceipt] = React.useState<TeamPayoutRecord | null>(null)
  const [viewingLedgerProfile, setViewingLedgerProfile] = React.useState<TeamMemberPayoutProfile | null>(null)
  const [disbursingProject, setDisbursingProject] = React.useState<ProjectUserEarningsRecord | null>(null)
  const [isAddAdjustmentOpen, setIsAddAdjustmentOpen] = React.useState(false)

  // Custom Amount Payout State
  const [customPayInitialAmount, setCustomPayInitialAmount] = React.useState<number | undefined>(undefined)
  const [customPayProjectTitle, setCustomPayProjectTitle] = React.useState<string | undefined>(undefined)
  const [customPayType, setCustomPayType] = React.useState<PayoutType | undefined>(undefined)

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
      const subBranch = selectedSubBranchId
      const [pData, rData, projData, adjData] = await Promise.all([
        getTeamPayoutProfiles(comp, branch, subBranch),
        getPayoutRecords(comp, branch, subBranch),
        getProjectWiseUserEarnings(comp, branch, subBranch),
        getCustomAdjustments(comp, branch, subBranch),
      ])
      setProfiles(pData.profiles)
      setKpis(pData.kpis)
      setRecords(rData)
      setProjectEarnings(projData)
      setCustomAdjustments(adjData)
    } catch (err) {
      console.error("Error loading team payments data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [activeCompanyId, selectedBranchId, selectedSubBranchId])

  React.useEffect(() => {
    loadData(true)
    const handleReload = () => loadData(false)
    window.addEventListener("storage", handleReload)
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_branch_switched", handleReload)
    window.addEventListener("saampark_subbranches_updated", handleReload)
    window.addEventListener("saampark_team_payouts_updated", handleReload)
    window.addEventListener("saampark_team_banking_updated", handleReload)
    window.addEventListener("saampark_team_adjustments_updated", handleReload)

    return () => {
      window.removeEventListener("storage", handleReload)
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_branch_switched", handleReload)
      window.removeEventListener("saampark_subbranches_updated", handleReload)
      window.removeEventListener("saampark_team_payouts_updated", handleReload)
      window.removeEventListener("saampark_team_banking_updated", handleReload)
      window.removeEventListener("saampark_team_adjustments_updated", handleReload)
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

  // Disburse Custom Adjustment Directly
  const handleDisburseCustomItem = async (adj: CustomPaymentAdjustment) => {
    if (!canAddPayout) {
      alert("Permission required to disburse payouts.")
      return
    }

    try {
      const payout = await recordTeamPayout({
        memberId: adj.memberId,
        memberName: adj.memberName,
        memberEmail: adj.memberEmail,
        role: adj.role,
        department: adj.department,
        companyId: adj.companyId || "tech",
        branchId: adj.branchId,
        branchName: adj.branchName,
        period: `Custom: ${adj.category}`,
        payoutType: "Custom Allowance",
        baseAmount: 0,
        commissionAmount: 0,
        bonus: adj.type === "Credit" ? adj.amount : 0,
        deductions: adj.type === "Debit" ? adj.amount : 0,
        netAmount: adj.amount,
        netAmountFormatted: `₹${adj.amount.toLocaleString("en-IN")}`,
        paymentDate: new Date().toLocaleDateString("en-GB"),
        paymentMethod: "Bank IMPS/NEFT",
        transactionRef: `ADJTXN${Date.now().toString().slice(-6)}`,
        status: "Completed",
        notes: adj.description,
        billedBy: "Admin",
      }, adj.companyId)

      await updateCustomAdjustmentStatus(adj.id, "Disbursed", adj.companyId, payout.id)
      showToast(`🎉 Disbursed ₹${adj.amount.toLocaleString("en-IN")} for ${adj.category} to ${adj.memberName}!`)
      loadData(false)
      setViewingReceipt(payout)
    } catch (err) {
      console.error("Disbursement of adjustment failed:", err)
      alert("Failed to disburse adjustment.")
    }
  }

  // Delete Custom Adjustment
  const handleDeleteCustomItem = async (id: string) => {
    if (confirm("Delete this custom adjustment item?")) {
      await deleteCustomAdjustment(id, activeCompanyId || "tech")
      showToast("Custom adjustment deleted.")
      loadData(false)
    }
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

  // Filtered Records (Universal History)
  const filteredRecords = React.useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q ||
        r.id.toLowerCase().includes(q) ||
        r.memberName.toLowerCase().includes(q) ||
        r.memberEmail.toLowerCase().includes(q) ||
        r.period.toLowerCase().includes(q) ||
        r.payoutType.toLowerCase().includes(q) ||
        (r.transactionRef && r.transactionRef.toLowerCase().includes(q))

      const matchesCategory = categoryFilter === "all" || r.payoutType.toLowerCase().includes(categoryFilter.toLowerCase())
      return matchesSearch && matchesCategory
    })
  }, [records, searchQuery, categoryFilter])

  // Filtered Projects
  const filteredProjectEarnings = React.useMemo(() => {
    return projectEarnings.filter((pe) => {
      const q = searchQuery.toLowerCase().trim()
      return !q ||
        pe.projectTitle.toLowerCase().includes(q) ||
        pe.clientName.toLowerCase().includes(q) ||
        pe.memberName.toLowerCase().includes(q) ||
        pe.memberEmail.toLowerCase().includes(q)
    })
  }, [projectEarnings, searchQuery])

  // Filtered Custom Adjustments
  const filteredCustomAdjustments = React.useMemo(() => {
    return customAdjustments.filter((ca) => {
      const q = searchQuery.toLowerCase().trim()
      return !q ||
        ca.memberName.toLowerCase().includes(q) ||
        ca.category.toLowerCase().includes(q) ||
        ca.description.toLowerCase().includes(q)
    })
  }, [customAdjustments, searchQuery])

  // Export Excel
  const handleExportExcel = () => {
    if (activeTab === "directory") {
      exportToExcel({
        filename: `Team_Payroll_Directory_${new Date().toISOString().split("T")[0]}`,
        title: "Team Members Payroll & Banking Directory",
        subtitle: `All Team Members (${filteredProfiles.length} Records)`,
        headers: ["Member Name", "Email", "Role", "Department", "Branch", "Base Salary", "Commission", "Project Earnings", "Total Gross Due", "Paid This Month", "Need To Pay", "Status", "Bank Name", "Account No", "IFSC", "UPI ID"],
        rows: filteredProfiles.map(p => [
          p.name,
          p.email,
          p.role,
          p.department,
          p.branchName || "HQ",
          p.baseSalary,
          p.subscriptionCommission,
          p.projectEarnings,
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
    } else if (activeTab === "projects") {
      exportToExcel({
        filename: `Project_Wise_Earnings_${new Date().toISOString().split("T")[0]}`,
        title: "Project-Wise User Earnings & Milestone Shares",
        subtitle: `Project Shares (${filteredProjectEarnings.length} Records)`,
        headers: ["Project Title", "Client Name", "Team Member", "Member Role", "Project Total Value", "Client Paid", "Share %", "Member Earned", "Member Disbursed", "Pending Share"],
        rows: filteredProjectEarnings.map(pe => [
          pe.projectTitle,
          pe.clientName,
          pe.memberName,
          pe.memberRole,
          pe.projectTotalValue,
          pe.clientPaymentReceived,
          `${pe.memberSharePercentage}%`,
          pe.memberTotalEarned,
          pe.memberPaidAmount,
          pe.memberPendingAmount,
        ])
      })
    } else if (activeTab === "custom") {
      exportToExcel({
        filename: `Custom_Adjustments_${new Date().toISOString().split("T")[0]}`,
        title: "Custom Allowances & Reimbursements",
        subtitle: `Custom Items (${filteredCustomAdjustments.length} Records)`,
        headers: ["Voucher/ID", "Date", "Team Member", "Category", "Type", "Amount", "Description", "Status"],
        rows: filteredCustomAdjustments.map(ca => [
          ca.id,
          ca.createdDate,
          ca.memberName,
          ca.category,
          ca.type,
          ca.amount,
          ca.description,
          ca.status,
        ])
      })
    } else {
      exportToExcel({
        filename: `All_Payment_History_${new Date().toISOString().split("T")[0]}`,
        title: "Universal Team Payment Disbursement History",
        subtitle: `Disbursement Ledger (${filteredRecords.length} Records)`,
        headers: ["Voucher ID", "Payment Date", "Member Name", "Member Email", "Period / Project", "Payout Category", "Payment Method", "Transaction UTR", "Amount Paid"],
        rows: filteredRecords.map(r => [
          r.id,
          r.paymentDate,
          r.memberName,
          r.memberEmail,
          r.period,
          r.payoutType,
          r.paymentMethod,
          r.transactionRef || "-",
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
                Staff compensation, project milestone shares, banking/UPI details, universal payout history & custom allowances.
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

          {/* Sub-Branch Filter Selector */}
          {availableSubBranches.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs">
              <Layers size={13} className="text-purple-500 shrink-0" />
              <select
                value={selectedSubBranchId}
                onChange={(e) => setSelectedSubBranchId(e.target.value)}
                className="bg-transparent font-bold text-purple-900 dark:text-purple-200 focus:outline-hidden cursor-pointer text-xs"
              >
                <option value="all">🌐 All Sub-Branches</option>
                {availableSubBranches.map(sb => (
                  <option key={sb.id} value={sb.id}>
                    🏢 {sb.name} ({sb.code || 'Sub-Branch'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button size="sm" variant="secondary" onClick={handleExportExcel} leftIcon={<Download size={13} />}>
            Export Excel
          </Button>

          {canAddPayout && (
            <Button size="sm" onClick={() => setIsAddAdjustmentOpen(true)} leftIcon={<Sparkles size={13} />} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              + Custom Allowance
            </Button>
          )}

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
              {kpis.teamMembersOnPayroll} Active Staff
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

        {/* Project Shares Disbursed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Project Shares Disbursed</div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              ₹{kpis.totalProjectDisbursements.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
              {projectEarnings.length} Project Milestone Links
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <FolderGit2 size={22} />
          </div>
        </div>
      </div>

      {/* 4-Tab Navigation Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl w-full sm:w-fit border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs overflow-x-auto">
          {/* Tab 1 */}
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "directory"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <User size={14} />
            <span>Team Members & Banking ({profiles.length})</span>
          </button>

          {/* Tab 2 */}
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "projects"
                ? "bg-white dark:bg-zinc-900 text-purple-800 dark:text-purple-300 shadow-sm border border-purple-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <FolderGit2 size={14} />
            <span>Project-Wise Payments ({projectEarnings.length})</span>
          </button>

          {/* Tab 3 */}
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "history"
                ? "bg-white dark:bg-zinc-900 text-blue-800 dark:text-blue-300 shadow-sm border border-blue-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Receipt size={14} />
            <span>All Payment History ({records.length})</span>
          </button>

          {/* Tab 4 */}
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "custom"
                ? "bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 shadow-sm border border-amber-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Sparkles size={14} />
            <span>Custom Section ({customAdjustments.length})</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder={
                activeTab === "projects" ? "Search project, client, member..." :
                activeTab === "custom" ? "Search category, member..." :
                "Search member, role, bank, UPI..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-hidden w-64"
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

          {activeTab === "history" && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-hidden"
            >
              <option value="all">All Payout Categories</option>
              <option value="Salary">Monthly Salary</option>
              <option value="Subscription">Subscription Commission</option>
              <option value="Project">Project Share</option>
              <option value="Allowance">Custom Allowance / Bonus</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {isLoading ? (
        <ThreeDotLoader text="Loading team payroll, project shares & payout history..." fullScreen={false} />
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
                  <th className="py-3.5 px-3">Subscription Share</th>
                  <th className="py-3.5 px-3">Assigned Projects & Earnings</th>
                  <th className="py-3.5 px-3">Total Need To Pay</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400">
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
                                <span>{b.bankName || "Bank"} (••••{b.accountNumber.slice(-4)})</span>
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

                        {/* Assigned Projects & Share Earnings */}
                        <td className="py-3.5 px-3 min-w-[230px]">
                          {(() => {
                            const memberProjects = projectEarnings.filter(
                              (pe) =>
                                pe.memberId === p.id ||
                                (pe.memberEmail && p.email && pe.memberEmail.toLowerCase() === p.email.toLowerCase())
                            )

                            return (
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <div className="font-bold text-purple-600 dark:text-purple-400">
                                    +₹{p.projectEarnings.toLocaleString("en-IN")}
                                  </div>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    {memberProjects.length} Projects
                                  </span>
                                </div>

                                {memberProjects.length === 0 ? (
                                  <div className="text-[10.5px] text-zinc-400 italic">No assigned projects</div>
                                ) : (
                                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {memberProjects.map((proj) => (
                                      <div
                                        key={proj.id}
                                        className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60 text-[10.5px]"
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <span
                                            className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]"
                                            title={proj.projectTitle}
                                          >
                                            {proj.projectTitle}
                                          </span>
                                          <span className="text-purple-600 dark:text-purple-400 font-bold shrink-0">
                                            ₹{proj.memberTotalEarned.toLocaleString("en-IN")}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[9.5px] text-zinc-500 mt-0.5">
                                          <span>Share: {proj.memberSharePercentage}%</span>
                                          <span>
                                            Due:{" "}
                                            <strong
                                              className={
                                                proj.memberPendingAmount > 0
                                                  ? "text-amber-600 dark:text-amber-400 font-semibold"
                                                  : "text-emerald-600 dark:text-emerald-400 font-normal"
                                              }
                                            >
                                              ₹{proj.memberPendingAmount.toLocaleString("en-IN")}
                                            </strong>
                                          </span>
                                        </div>
                                        {canAddPayout && proj.memberPendingAmount > 0 && (
                                          <div className="mt-1 pt-1 border-t border-zinc-200/40 dark:border-zinc-700/40 flex justify-end">
                                            <button
                                              type="button"
                                              onClick={() => setDisbursingProject(proj)}
                                              className="text-[9.5px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-0.5"
                                            >
                                              Pay Share →
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
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
                                onClick={() => {
                                  setCustomPayInitialAmount(undefined)
                                  setCustomPayProjectTitle(undefined)
                                  setCustomPayType(undefined)
                                  setPayingProfile(p)
                                }}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                                title="Disburse salary and commission payout"
                              >
                                <DollarSign size={12} />
                                <span>Pay</span>
                              </button>
                            )}

                            {/* Pay Custom Amount Button */}
                            {canAddPayout && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomPayInitialAmount(p.remainingNeedToPay > 0 ? p.remainingNeedToPay : undefined)
                                  setCustomPayProjectTitle(undefined)
                                  setCustomPayType("Custom Amount")
                                  setPayingProfile(p)
                                }}
                                className="px-2 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Pay custom amount and generate receipt"
                              >
                                <Receipt size={11} />
                                <span>Pay Custom</span>
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
      ) : activeTab === "projects" ? (
        /* ── TAB 2: PROJECT-WISE USER EARNINGS & PAYOUTS ── */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-850/70 border-b border-zinc-200/80 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Project & Client</th>
                  <th className="py-3.5 px-3">Team Member</th>
                  <th className="py-3.5 px-3">Project Value</th>
                  <th className="py-3.5 px-3">Client Payment</th>
                  <th className="py-3.5 px-3">Member Share %</th>
                  <th className="py-3.5 px-3">Total Earned</th>
                  <th className="py-3.5 px-3">Disbursed to Member</th>
                  <th className="py-3.5 px-3">Pending Share</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                {filteredProjectEarnings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400">
                      No project earnings records found matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredProjectEarnings.map((pe) => (
                    <tr key={pe.id} className="hover:bg-purple-50/20 dark:hover:bg-purple-950/10 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{pe.projectTitle}</div>
                        <div className="text-[11px] text-zinc-400">Client: <strong className="text-zinc-600 dark:text-zinc-300">{pe.clientName}</strong></div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">{pe.memberName}</div>
                        <div className="text-[10px] text-zinc-400">{pe.memberRole}</div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-zinc-800 dark:text-zinc-200">
                        ₹{pe.projectTotalValue.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{pe.clientPaymentReceived.toLocaleString("en-IN")}
                        </span>
                        <div className="text-[9.5px] text-zinc-400">{pe.clientPaymentStatus}</div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold text-[10.5px]">
                          {pe.memberSharePercentage}% Share
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-purple-700 dark:text-purple-300">
                        ₹{pe.memberTotalEarned.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{pe.memberPaidAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`text-sm font-black ${pe.memberPendingAmount > 0 ? "text-amber-600 dark:text-amber-400" : "text-zinc-400"}`}>
                          ₹{pe.memberPendingAmount.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {canAddPayout && pe.memberPendingAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setDisbursingProject(pe)}
                            className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                          >
                            <DollarSign size={12} />
                            <span>Pay Share</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 size={12} /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "history" ? (
        /* ── TAB 3: UNIVERSAL PAYMENT HISTORY ── */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-850/70 border-b border-zinc-200/80 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Voucher ID</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3">Beneficiary Member</th>
                  <th className="py-3.5 px-3">Period / Project</th>
                  <th className="py-3.5 px-3">Payout Category</th>
                  <th className="py-3.5 px-3">Payment Method</th>
                  <th className="py-3.5 px-3">Transaction UTR</th>
                  <th className="py-3.5 px-3 text-right">Net Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400">
                      No payment vouchers found matching search criteria.
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
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[10px]">
                          {r.payoutType}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-medium text-zinc-600 dark:text-zinc-300">{r.paymentMethod}</span>
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
      ) : (
        /* ── TAB 4: CUSTOM SECTION (ADJUSTMENTS & ALLOWANCES) ── */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-850/70 border-b border-zinc-200/80 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Adjustment ID</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3">Team Member</th>
                  <th className="py-3.5 px-3">Compensation Category</th>
                  <th className="py-3.5 px-3">Type</th>
                  <th className="py-3.5 px-3">Amount</th>
                  <th className="py-3.5 px-3">Description / Reason</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                {filteredCustomAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400">
                      No custom allowances, reimbursements, or bonuses recorded yet. Click "+ Custom Allowance" to add one!
                    </td>
                  </tr>
                ) : (
                  filteredCustomAdjustments.map((ca) => (
                    <tr key={ca.id} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {ca.id}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-500 font-medium whitespace-nowrap">
                        {ca.createdDate}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{ca.memberName}</div>
                        <div className="text-[10px] text-zinc-400">{ca.role}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{ca.category}</span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          ca.type === "Credit" 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}>
                          {ca.type === "Credit" ? "+ Addition" : "- Deduction"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-black text-sm text-zinc-900 dark:text-zinc-100">
                        ₹{ca.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-600 dark:text-zinc-400 max-w-[240px] truncate" title={ca.description}>
                        {ca.description}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ca.status === "Disbursed" 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}>
                          {ca.status === "Disbursed" ? "✓ Disbursed" : "Approved / Pending"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {canAddPayout && ca.status !== "Disbursed" && (
                            <button
                              type="button"
                              onClick={() => handleDisburseCustomItem(ca)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] cursor-pointer"
                            >
                              Disburse
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomItem(ca.id)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
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

      {/* 1. Record Salary & Commission Payout Modal */}
      <RecordPayoutModal
        isOpen={Boolean(payingProfile)}
        profile={payingProfile}
        initialAmount={customPayInitialAmount}
        initialProjectTitle={customPayProjectTitle}
        initialPayoutType={customPayType}
        onClose={() => {
          setPayingProfile(null)
          setCustomPayInitialAmount(undefined)
          setCustomPayProjectTitle(undefined)
          setCustomPayType(undefined)
        }}
        onSuccess={(payout) => {
          showToast(`🎉 Payment of ₹${payout.netAmount.toLocaleString("en-IN")} disbursed to ${payout.memberName}!`)
          loadData(false)
          setViewingReceipt(payout)
        }}
      />

      {/* 2. Disburse Project Share Modal */}
      <DisburseProjectShareModal
        isOpen={Boolean(disbursingProject)}
        earningsRecord={disbursingProject}
        onClose={() => setDisbursingProject(null)}
        onSuccess={(payout) => {
          showToast(`🎉 Project Share of ₹${payout.netAmount.toLocaleString("en-IN")} disbursed to ${payout.memberName}!`)
          loadData(false)
          setViewingReceipt(payout)
        }}
      />

      {/* 3. Add Custom Adjustment Modal */}
      <AddCustomAdjustmentModal
        isOpen={isAddAdjustmentOpen}
        profiles={profiles}
        onClose={() => setIsAddAdjustmentOpen(false)}
        onSuccess={(adj) => {
          showToast(`✅ Custom ${adj.category} of ₹${adj.amount.toLocaleString("en-IN")} added for ${adj.memberName}!`)
          loadData(false)
        }}
      />

      {/* 4. Edit Member Banking & UPI Modal */}
      <EditMemberBankingModal
        isOpen={Boolean(editingBankingProfile)}
        profile={editingBankingProfile}
        onClose={() => setEditingBankingProfile(null)}
        onSave={handleSaveBanking}
      />

      {/* 5. Official Payment Receipt Voucher Modal */}
      <TeamPaymentReceiptModal
        isOpen={Boolean(viewingReceipt)}
        payout={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
      />

      {/* 6. Single Member Historical Payout Ledger Modal */}
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
