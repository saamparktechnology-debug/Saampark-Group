"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Receipt, Plus, Download, Clock, AlertCircle, CheckCircle2, 
  Search, Calendar, User, Building2, ChevronRight, Send, 
  DollarSign, Sparkles, Filter, CreditCard, ArrowUpRight,
  ShieldCheck, Smartphone, QrCode, FileText, Check, X
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { InstallmentItem, InstallmentScheduleItem, InstallmentStatus, EMIKPIs } from "../subscriptions/types"
import { 
  getInstallments, 
  saveInstallmentRecord, 
  recordInstallmentPayment, 
  sendInstallmentReminder 
} from "../subscriptions/services/subscriptionService"
import { ClientInstallmentDetailModal } from "../subscriptions/components/ClientInstallmentDetailModal"
import { RecordInstallmentPaymentModal } from "../subscriptions/components/RecordInstallmentPaymentModal"
import { getClients } from "@/app/feature/clients/services/clientService"
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"
import { isRecordAssignedToClient } from "@/lib/clientScopeUtils"

export default function EMIMain() {
  const { activeCompanyId, activeBranchId, branches, user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const roleLower = (user?.role || "").toLowerCase().trim()
  const isSuperAdmin = roleLower.includes("super") || roleLower === "super admin"
  const isAdmin = !isSuperAdmin && (
    roleLower.includes("admin") || 
    roleLower.includes("owner") || 
    roleLower.includes("manager") ||
    roleLower === "admin"
  )
  const isClient = roleLower.includes("client")

  const canAddEMI = canPerformAction(user, "EMI", "add") || isSuperAdmin || isAdmin
  const canEditEMI = canPerformAction(user, "EMI", "edit") || isSuperAdmin || isAdmin
  const canDeleteEMI = canPerformAction(user, "EMI", "delete") || isSuperAdmin || isAdmin

  // Data state
  const [installments, setInstallments] = React.useState<InstallmentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [selectedForDetail, setSelectedForDetail] = React.useState<InstallmentItem | null>(null)
  
  // Record Payment Modal (Admin/Staff)
  const [recordingPayment, setRecordingPayment] = React.useState<{
    installment: InstallmentItem
    scheduleItem: InstallmentScheduleItem
  } | null>(null)

  // Client "Pay Now" Interactive Modal
  const [clientPayingInstallment, setClientPayingInstallment] = React.useState<{
    installment: InstallmentItem
    scheduleItem: InstallmentScheduleItem
  } | null>(null)
  const [clientPayMethod, setClientPayMethod] = React.useState<"upi" | "bank" | "card">("upi")
  const [isClientPayProcessing, setIsClientPayProcessing] = React.useState(false)

  // New EMI Contract Form state
  const [availableClients, setAvailableClients] = React.useState<{ name: string; email: string; phone?: string; company?: string }[]>([])
  const [newClientName, setNewClientName] = React.useState("")
  const [isCustomClient, setIsCustomClient] = React.useState(false)
  const [customClientEmail, setCustomClientEmail] = React.useState("")
  const [customClientPhone, setCustomClientPhone] = React.useState("")
  const [customClientCompany, setCustomClientCompany] = React.useState("")
  const [newProjectTitle, setNewProjectTitle] = React.useState("")
  const [newTotalValue, setNewTotalValue] = React.useState("60000")
  const [newAdvancePaid, setNewAdvancePaid] = React.useState("10000")
  const [newInstallmentsCount, setNewInstallmentsCount] = React.useState<number>(4)
  const [newInterval, setNewInterval] = React.useState<"Monthly" | "Bi-weekly" | "Quarterly">("Monthly")
  const [newFirstDueDate, setNewFirstDueDate] = React.useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [customMilestones, setCustomMilestones] = React.useState<{ num: number; amount: number; dueDate: string }[]>([])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Load installments data fresh from store
  const loadData = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const { activeCompanyId: freshCompanyId } = useAuthStore.getState()
      const data = await getInstallments(freshCompanyId || "tech")
      setInstallments(data || [])
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData(true)
    const handleReload = () => loadData(false)
    window.addEventListener("storage", handleReload)
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_branch_switched", handleReload)
    window.addEventListener("saampark_data_synced", handleReload)

    return () => {
      window.removeEventListener("storage", handleReload)
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_branch_switched", handleReload)
      window.removeEventListener("saampark_data_synced", handleReload)
    }
  }, [loadData])

  // Populate available clients on modal open
  React.useEffect(() => {
    if (isAddModalOpen) {
      getClients().then((cList) => {
        const mapped = cList.map(c => ({
          name: c.name,
          email: c.email || "",
          phone: c.phone || "",
          company: c.companyName || c.name,
        }))
        setAvailableClients(mapped)
        if (mapped.length > 0 && !newClientName) {
          setNewClientName(mapped[0].name)
        }
      }).catch(() => {})
    }
  }, [isAddModalOpen, newClientName])

  // Auto-generate milestone preview matrix when form parameters change
  React.useEffect(() => {
    const totalVal = parseInt(newTotalValue.replace(/[^0-9]/g, "")) || 0
    const advVal = parseInt(newAdvancePaid.replace(/[^0-9]/g, "")) || 0
    const remaining = Math.max(0, totalVal - advVal)
    const count = Math.max(1, newInstallmentsCount)
    const perInst = Math.round(remaining / count)

    const baseDate = newFirstDueDate ? new Date(newFirstDueDate) : new Date()
    const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate

    const generated = []
    for (let i = 1; i <= count; i++) {
      const d = new Date(validBase)
      if (newInterval === "Monthly") {
        d.setMonth(d.getMonth() + (i - 1))
      } else if (newInterval === "Bi-weekly") {
        d.setDate(d.getDate() + (i - 1) * 14)
      } else if (newInterval === "Quarterly") {
        d.setMonth(d.getMonth() + (i - 1) * 3)
      }
      generated.push({
        num: i,
        amount: perInst,
        dueDate: d.toISOString().split("T")[0],
      })
    }
    setCustomMilestones(generated)
  }, [newTotalValue, newAdvancePaid, newInstallmentsCount, newInterval, newFirstDueDate])

  // ── Role Scoped Installments ──
  const visibleInstallments = React.useMemo(() => {
    if (!user) return []

    const { activeCompanyId: freshCompId, activeBranchId: freshBranchId, branches: freshBranches, user: freshUser } = useAuthStore.getState()
    const userComp = (freshCompId || freshUser?.companyId || "").toLowerCase().trim()
    const targetBranch = freshBranchId

    const checkCompany = (item: InstallmentItem) => {
      if (!userComp || userComp === "all") return true
      const comp = (item.companyId || "tech").toLowerCase().trim()
      return comp === userComp || (userComp === "tech" && !item.companyId)
    }

    const checkBranch = (item: InstallmentItem) => {
      if (!targetBranch) return true
      const bId = String(item.branchId || "").toLowerCase().trim()
      const bName = String(item.branchName || "").toLowerCase().trim()
      const target = String(targetBranch).toLowerCase().trim()
      return bId === target || bName === target
    }

    // 1. Super Admin & Company Admin: view within company/branch
    if (isSuperAdmin || isAdmin) {
      return installments.filter(item => checkCompany(item) && checkBranch(item))
    }

    const normName = (user.name || "").toLowerCase().trim()
    const normEmail = (user.email || "").toLowerCase().trim()
    const uId = String(user.id || "").toLowerCase().trim()

    // 2. Client role: strictly their own installments
    if (isClient) {
      return installments.filter((item) => {
        if (!checkBranch(item)) return false
        return isRecordAssignedToClient(item, user)
      })
    }

    // 3. Team Member: assigned to them
    return installments.filter((item) => {
      if (!checkBranch(item)) return false
      const assigned = (item.assignedMembers || []).map(m => m.toLowerCase().trim())
      const assignedEmails = (item.assignedMemberEmails || []).map(e => e.toLowerCase().trim())
      const billedBy = (item.billedBy || "").toLowerCase().trim()
      const createdById = String(item.createdById || "").toLowerCase().trim()

      if (uId && createdById === uId) return true
      if (normName && billedBy === normName) return true
      if (assigned.some(m => m === normName || (normName && m.includes(normName)) || (normName && normName.includes(m)))) return true
      if (normEmail && assignedEmails.some(e => e === normEmail)) return true

      return false
    })
  }, [installments, user, isSuperAdmin, isAdmin, isClient, activeCompanyId, activeBranchId, branches])

  // Filtered by Search & Status
  const filteredInstallments = React.useMemo(() => {
    return visibleInstallments.filter((item) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = 
        !q ||
        item.clientName.toLowerCase().includes(q) ||
        item.projectTitle.toLowerCase().includes(q) ||
        (item.clientEmail && item.clientEmail.toLowerCase().includes(q)) ||
        (item.clientCompany && item.clientCompany.toLowerCase().includes(q)) ||
        item.id.toLowerCase().includes(q)

      let matchesStatus = true
      if (statusFilter === "pending") {
        matchesStatus = item.status === "Pending" || item.status === "Partially Paid"
      } else if (statusFilter === "overdue") {
        matchesStatus = item.status === "Overdue"
      } else if (statusFilter === "paid") {
        matchesStatus = item.status === "Paid"
      }

      return matchesSearch && matchesStatus
    })
  }, [visibleInstallments, searchQuery, statusFilter])

  // Compute EMI KPIs
  const kpis: EMIKPIs = React.useMemo(() => {
    let totalVal = 0
    let totalPaid = 0
    let totalRemaining = 0
    let upcomingCount = 0
    let upcomingAmt = 0
    let overdueCount = 0
    let overdueAmt = 0

    visibleInstallments.forEach((inst) => {
      totalVal += inst.totalContractValue
      totalPaid += inst.totalPaid
      totalRemaining += inst.remainingBalance

      inst.schedule.forEach((s) => {
        if (s.status === "Pending") {
          upcomingCount++
          upcomingAmt += s.amount
        } else if (s.status === "Overdue") {
          overdueCount++
          overdueAmt += s.amount
        }
      })
    })

    const collectionRate = totalVal > 0 ? Math.round((totalPaid / totalVal) * 100) : 0

    return {
      totalContractValue: totalVal,
      totalPaid,
      totalRemainingBalance: totalRemaining,
      activeContractsCount: visibleInstallments.length,
      upcomingInstallmentsDueCount: upcomingCount,
      upcomingInstallmentsDueAmount: upcomingAmt,
      overdueInstallmentsCount: overdueCount,
      overdueInstallmentsAmount: overdueAmt,
      collectionRatePercent: collectionRate,
    }
  }, [visibleInstallments])

  // ── Actions ──

  const handleCreateEMIContract = async (e: React.FormEvent) => {
    e.preventDefault()
    const totalVal = parseInt(newTotalValue.replace(/[^0-9]/g, "")) || 0
    const advVal = parseInt(newAdvancePaid.replace(/[^0-9]/g, "")) || 0
    const remaining = Math.max(0, totalVal - advVal)

    if (!newProjectTitle.trim() || totalVal <= 0) {
      alert("Please provide a valid contract / project title and contract value.")
      return
    }

    let clientName = newClientName
    let clientEmail = ""
    let clientPhone = ""
    let clientCompany = ""

    if (isCustomClient) {
      clientName = newClientName || "Custom Client"
      clientEmail = customClientEmail
      clientPhone = customClientPhone
      clientCompany = customClientCompany || clientName
    } else {
      const found = availableClients.find(c => c.name.toLowerCase().trim() === newClientName.toLowerCase().trim())
      clientEmail = found?.email || ""
      clientPhone = found?.phone || ""
      clientCompany = found?.company || clientName
    }

    const count = customMilestones.length
    const schedule: InstallmentScheduleItem[] = customMilestones.map((m) => ({
      installmentNumber: m.num,
      amount: m.amount,
      formattedAmount: `₹${m.amount.toLocaleString("en-IN")}`,
      dueDate: m.dueDate,
      status: "Pending" as InstallmentStatus,
    }))

    const newInst: InstallmentItem = {
      id: `emi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      projectTitle: newProjectTitle,
      totalContractValue: totalVal,
      totalAdvancePaid: advVal,
      totalPaid: advVal,
      remainingBalance: remaining,
      totalInstallments: count,
      currentInstallmentNumber: 1,
      currentInstallmentAmount: schedule[0]?.amount || Math.round(remaining / count),
      currentDueDate: schedule[0]?.dueDate || newFirstDueDate,
      status: remaining === 0 ? "Paid" : "Pending",
      schedule,
      companyId: activeCompanyId || "tech",
      branchId: activeBranchId || undefined,
      createdAt: new Date().toISOString().split("T")[0],
    }

    await saveInstallmentRecord(newInst, activeCompanyId || "tech")
    showToast(`✅ EMI Milestone Contract created for "${newProjectTitle}"!`)
    setIsAddModalOpen(false)
    loadData(false)
  }

  const handleSendReminder = async (installmentId: string, installmentNumber?: number) => {
    const ok = await sendInstallmentReminder(installmentId, installmentNumber, activeCompanyId || "tech")
    if (ok) {
      showToast("📧 Payment reminder email successfully sent to client.")
      loadData(false)
    } else {
      alert("Could not send reminder. Please verify client email address.")
    }
  }

  const handleRecordPaymentConfirm = async (
    installmentId: string,
    installmentNumber: number,
    amount: number,
    paymentMethod: string
  ) => {
    const updated = await recordInstallmentPayment(
      installmentId,
      installmentNumber,
      amount,
      paymentMethod,
      activeCompanyId || "tech"
    )
    if (updated) {
      showToast(`💰 Installment #${installmentNumber} marked as PAID!`)
      if (selectedForDetail && selectedForDetail.id === installmentId) {
        setSelectedForDetail(updated)
      }
      loadData(false)
    }
  }

  // Client Pay Now Simulation & Record
  const handleClientPayNowSubmit = async () => {
    if (!clientPayingInstallment) return
    setIsClientPayProcessing(true)
    try {
      const { installment, scheduleItem } = clientPayingInstallment
      const methodLabel = 
        clientPayMethod === "upi" ? "UPI (Instant Online)" :
        clientPayMethod === "card" ? "Debit / Credit Card" : "Bank Transfer (NEFT/RTGS)"

      const updated = await recordInstallmentPayment(
        installment.id,
        scheduleItem.installmentNumber,
        scheduleItem.amount,
        methodLabel,
        activeCompanyId || "tech"
      )

      if (updated) {
        showToast(`🎉 Payment of ${scheduleItem.formattedAmount} successful! Receipt generated.`)
        setClientPayingInstallment(null)
        loadData(false)
      }
    } catch (err) {
      alert("Payment processing error. Please try again or contact support.")
    } finally {
      setIsClientPayProcessing(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-[99999] bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 border border-zinc-700"
          >
            <Sparkles size={16} className="text-teal-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Receipt size={20} />
            </div>
            <span>{isClient ? "My EMI & Milestone Installments" : "EMI & Milestone Installment Hub"}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isClient
              ? "Track your project part payments, upcoming milestone due dates, and make instant online payments."
              : `Manage client project EMIs, milestone payment schedules, down payments, and collection tracking for ${activeCompanyId === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"}.`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={() => window.print()}>
            Print / Export
          </Button>

          {canAddEMI && !isClient && (
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAddModalOpen(true)}>
              New EMI Contract
            </Button>
          )}
        </div>
      </div>

      {/* KPI Dashboard Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Contract Value</div>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
            ₹{kpis.totalContractValue.toLocaleString("en-IN")}
          </div>
          <div className="text-[10.5px] text-zinc-500 font-medium mt-0.5">
            Across {kpis.activeContractsCount} Milestone Contracts
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Collected / Paid</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{kpis.totalPaid.toLocaleString("en-IN")}
          </div>
          <div className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
            {kpis.collectionRatePercent}% Collection Rate
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Outstanding Due</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            ₹{kpis.totalRemainingBalance.toLocaleString("en-IN")}
          </div>
          <div className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
            Remaining Balance
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Upcoming Milestones</div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            ₹{kpis.upcomingInstallmentsDueAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-[10.5px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
            {kpis.upcomingInstallmentsDueCount} Pending Installments
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Overdue Amount</div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            ₹{kpis.overdueInstallmentsAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-[10.5px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
            {kpis.overdueInstallmentsCount} Overdue Milestones
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by client, project title, or contract ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs shrink-0 overflow-x-auto">
          {[
            { id: "all", label: "All Contracts" },
            { id: "pending", label: "Pending Due" },
            { id: "overdue", label: "Overdue" },
            { id: "paid", label: "Fully Paid" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: EMI Contracts & Milestones */}
      {isLoading ? (
        <ThreeDotLoader text="Loading EMI milestone contracts..." fullScreen={false} />
      ) : filteredInstallments.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto text-xl font-bold">
            💳
          </div>
          <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No EMI Milestone Contracts Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {isClient
              ? "You do not have any active installment or EMI payment plans at this moment."
              : "Create custom part-payment contracts or milestone installments using the 'New EMI Contract' button above."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInstallments.map((item) => {
            const progress = item.totalContractValue > 0
              ? Math.min(100, Math.round((item.totalPaid / item.totalContractValue) * 100))
              : 0
            const nextPending = item.schedule.find(s => s.status !== "Paid")

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs hover:border-teal-500/30 transition-all space-y-4"
              >
                {/* Contract Summary Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-base border border-teal-500/20 shrink-0">
                      💳
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {item.projectTitle}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : item.status === "Overdue"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.clientName}</span>
                        {item.clientCompany && item.clientCompany !== item.clientName && (
                          <span>• {item.clientCompany}</span>
                        )}
                        <span>• Contract ID: {item.id}</span>
                      </p>
                    </div>
                  </div>

                  {/* Financial Stats & Progress */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase">Total Contract</div>
                      <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                        ₹{item.totalContractValue.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Total Paid</div>
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ₹{item.totalPaid.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Balance Due</div>
                      <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                        ₹{item.remainingBalance.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedForDetail(item)}
                      className="text-xs"
                    >
                      View Schedule ({item.schedule.length})
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                    <span>Payment Milestone Progress: <strong>{progress}%</strong></span>
                    <span>
                      {item.schedule.filter(s => s.status === "Paid").length} of {item.totalInstallments} Milestones Cleared
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${progress}%` }}
                      className={`h-full transition-all duration-500 rounded-full ${
                        progress === 100
                          ? "bg-emerald-500"
                          : progress > 50
                            ? "bg-teal-500"
                            : "bg-blue-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Schedule Grid Pill View */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  {item.schedule.map((sched) => {
                    const isPaid = sched.status === "Paid"
                    const isOverdue = sched.status === "Overdue"

                    return (
                      <div
                        key={sched.installmentNumber}
                        className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 transition-all ${
                          isPaid
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200"
                            : isOverdue
                              ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 animate-pulse"
                              : "bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px]">
                            Part #{sched.installmentNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                              : isOverdue
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                          }`}>
                            {sched.status}
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-black">
                            {sched.formattedAmount}
                          </div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                            <Calendar size={11} />
                            <span>Due: {sched.dueDate}</span>
                          </div>
                        </div>

                        {/* Action buttons on each milestone */}
                        {!isPaid && (
                          <div className="pt-1 border-t border-zinc-200/60 dark:border-zinc-700/40 flex items-center gap-1.5">
                            {/* Client Pay Now Button */}
                            {isClient ? (
                              <button
                                type="button"
                                onClick={() => setClientPayingInstallment({ installment: item, scheduleItem: sched })}
                                className="w-full py-1.5 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10.5px] flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-colors"
                              >
                                <CreditCard size={12} />
                                <span>Pay Now</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setRecordingPayment({ installment: item, scheduleItem: sched })}
                                  className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                >
                                  <Check size={11} />
                                  <span>Record Paid</span>
                                </button>
                                {item.clientEmail && (
                                  <button
                                    type="button"
                                    onClick={() => handleSendReminder(item.id, sched.installmentNumber)}
                                    className="p-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 text-[10px] cursor-pointer"
                                    title="Send Email Reminder"
                                  >
                                    <Send size={11} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── MODAL 1: CLIENT INSTALLMENT DETAIL MODAL ── */}
      <ClientInstallmentDetailModal
        isOpen={Boolean(selectedForDetail)}
        installment={selectedForDetail}
        onClose={() => setSelectedForDetail(null)}
        onSendReminder={handleSendReminder}
        onRecordPayment={(inst, sched) => {
          setRecordingPayment({ installment: inst, scheduleItem: sched })
        }}
      />

      {/* ── MODAL 2: RECORD PAYMENT MODAL (ADMIN / STAFF) ── */}
      <RecordInstallmentPaymentModal
        isOpen={Boolean(recordingPayment)}
        installment={recordingPayment?.installment || null}
        scheduleItem={recordingPayment?.scheduleItem || null}
        onClose={() => setRecordingPayment(null)}
        onConfirm={handleRecordPaymentConfirm}
      />

      {/* ── MODAL 3: INTERACTIVE "PAY NOW" MODAL FOR CLIENTS ── */}
      <AnimatePresence>
        {clientPayingInstallment && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-8"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                    💳
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Pay Installment Online</h3>
                    <p className="text-[11px] text-teal-100">
                      Part #{clientPayingInstallment.scheduleItem.installmentNumber} of {clientPayingInstallment.installment.projectTitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setClientPayingInstallment(null)}
                  className="p-1 text-white/80 hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs">
                {/* Amount Due Card */}
                <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 text-center">
                  <div className="text-[11px] text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider">
                    Amount Payable
                  </div>
                  <div className="text-3xl font-black text-teal-900 dark:text-teal-100 mt-1">
                    {clientPayingInstallment.scheduleItem.formattedAmount}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    Due Date: {clientPayingInstallment.scheduleItem.dueDate}
                  </div>
                </div>

                {/* Select Payment Method */}
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Select Payment Gateway / Method:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setClientPayMethod("upi")}
                      className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        clientPayMethod === "upi"
                          ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <QrCode size={18} />
                      <span className="text-[10.5px]">UPI QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientPayMethod("card")}
                      className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        clientPayMethod === "card"
                          ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <CreditCard size={18} />
                      <span className="text-[10.5px]">Card / NetBanking</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientPayMethod("bank")}
                      className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        clientPayMethod === "bank"
                          ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Building2 size={18} />
                      <span className="text-[10.5px]">Bank NEFT/IMPS</span>
                    </button>
                  </div>
                </div>

                {/* Method Specific Display */}
                {clientPayMethod === "upi" && (
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-center space-y-2">
                    <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl shadow-xs border border-zinc-200 flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=saamparktechnology@icici%26pn=SAAMPARK%20GROUP%26am=${clientPayingInstallment.scheduleItem.amount}%26cu=INR`} 
                        alt="UPI QR Code" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      Scan with any UPI App (GPay, PhonePe, Paytm)
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      UPI ID: saamparktechnology@icici
                    </div>
                  </div>
                )}

                {clientPayMethod === "bank" && (
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Bank Name:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">ICICI Bank Ltd.</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Account Name:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">SAAMPARK TECHNOLOGY PVT LTD</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Account Number:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100 font-mono">002105023910</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">IFSC Code:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100 font-mono">ICIC0000021</strong>
                    </div>
                  </div>
                )}

                {clientPayMethod === "card" && (
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <input
                      type="text"
                      placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                      defaultValue="4532 •••• •••• 8892"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        defaultValue="12/28"
                        className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        defaultValue="•••"
                        className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Confirm Pay Button */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setClientPayingInstallment(null)}
                    className="px-4 py-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleClientPayNowSubmit}
                    isLoading={isClientPayProcessing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    <ShieldCheck size={14} className="mr-1.5" />
                    Confirm Payment ({clientPayingInstallment.scheduleItem.formattedAmount})
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 4: CREATE NEW EMI CONTRACT (ADMIN / STAFF) ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-teal-900/10 to-emerald-900/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Create New EMI Milestone Contract
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Set up automated part-payment schedules & milestone installment breakdown
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateEMIContract} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                {/* Client Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-600 dark:text-zinc-400 font-semibold">
                      Contract Client *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomClient(!isCustomClient)}
                      className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline"
                    >
                      {isCustomClient ? "Select Existing Client" : "+ Custom Client Entry"}
                    </button>
                  </div>

                  {!isCustomClient ? (
                    <select
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-medium"
                    >
                      {availableClients.map(c => (
                        <option key={c.name} value={c.name}>{c.name} ({c.company || 'Client'})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <input
                        type="text"
                        required
                        placeholder="Client Full Name *"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          placeholder="Client Email"
                          value={customClientEmail}
                          onChange={(e) => setCustomClientEmail(e.target.value)}
                          className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                        />
                        <input
                          type="text"
                          placeholder="Client Phone"
                          value={customClientPhone}
                          onChange={(e) => setCustomClientPhone(e.target.value)}
                          className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Company / Business Name"
                        value={customClientCompany}
                        onChange={(e) => setCustomClientCompany(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Project / Contract Title */}
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                    Project / Milestone Contract Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Custom Multi-Vendor E-Commerce Platform"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-medium"
                  />
                </div>

                {/* Total Value & Advance Paid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      Total Contract Value (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-zinc-400 font-bold">₹</span>
                      <input
                        type="number"
                        required
                        placeholder="60000"
                        value={newTotalValue}
                        onChange={(e) => setNewTotalValue(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      Advance / Down Payment (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-zinc-400 font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="10000"
                        value={newAdvancePaid}
                        onChange={(e) => setNewAdvancePaid(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Installments Count & Frequency */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      No. of Installments
                    </label>
                    <select
                      value={newInstallmentsCount}
                      onChange={(e) => setNewInstallmentsCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-bold"
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map(n => (
                        <option key={n} value={n}>{n} Installments</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      Interval Frequency
                    </label>
                    <select
                      value={newInterval}
                      onChange={(e) => setNewInterval(e.target.value as any)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-bold"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Bi-weekly">Bi-weekly (14 Days)</option>
                      <option value="Quarterly">Quarterly (3 Months)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      1st Milestone Due Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newFirstDueDate}
                      onChange={(e) => setNewFirstDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-medium"
                    />
                  </div>
                </div>

                {/* Real-time Generated Milestone Preview Matrix */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <span>Generated Milestone Matrix:</span>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400">
                      Balance: ₹{Math.max(0, (parseInt(newTotalValue.replace(/[^0-9]/g, "")) || 0) - (parseInt(newAdvancePaid.replace(/[^0-9]/g, "")) || 0)).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    {customMilestones.map((m, idx) => (
                      <div key={m.num} className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200/80 dark:border-zinc-800 text-[11px]">
                        <span className="font-bold text-zinc-500 w-14 shrink-0">
                          Part #{m.num}
                        </span>
                        <div className="flex-1 flex items-center gap-1.5">
                          <span className="text-zinc-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={m.amount}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              setCustomMilestones(prev => prev.map((item, i) => i === idx ? { ...item, amount: val } : item))
                            }}
                            className="w-24 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded font-bold"
                          />
                        </div>
                        <input
                          type="date"
                          value={m.dueDate}
                          onChange={(e) => {
                            const val = e.target.value
                            setCustomMilestones(prev => prev.map((item, i) => i === idx ? { ...item, dueDate: val } : item))
                          }}
                          className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded font-medium"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                  >
                    <Receipt size={14} className="mr-1.5" />
                    Create EMI Contract
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
