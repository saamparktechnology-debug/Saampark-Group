"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, Download, CreditCard, RefreshCw, X, Send, 
  CheckCircle2, DollarSign, Clock, AlertCircle, Sparkles, 
  Calendar, Layers, FileText, ChevronRight
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { Subscription, InstallmentItem, InstallmentScheduleItem, BillingCycle, SubscriptionKPIs } from "./types"
import { 
  getSubscriptions, addSubscription, deleteSubscription, 
  renewSubscription, sendSubscriptionReminder, updateSubscription,
  getInstallments, recordInstallmentPayment, sendInstallmentReminder,
  calculateNextCycleDate 
} from "./services/subscriptionService"
import { SubscriptionList } from "./components/SubscriptionList"
import { InstallmentsView } from "./components/InstallmentsView"
import { ClientInstallmentDetailModal } from "./components/ClientInstallmentDetailModal"
import { RecordInstallmentPaymentModal } from "./components/RecordInstallmentPaymentModal"
import { RenewSubscriptionModal } from "./components/RenewSubscriptionModal"
import { getClients } from "@/app/feature/clients/services/clientService"
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"

export default function SubscriptionsMain() {
  const { activeCompanyId, activeBranchId, branches, user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const roleLower = (user?.role || "").toLowerCase().trim()
  const isSuperAdmin = roleLower.includes("super") || roleLower === "super admin" || roleLower === "superadmin"
  const isAdmin = !isSuperAdmin && (
    roleLower.includes("admin") || 
    roleLower.includes("owner") || 
    roleLower.includes("manager") ||
    roleLower.includes("management") ||
    roleLower === "admin"
  )
  const isClient = roleLower.includes("client")
  const isTeam = !isSuperAdmin && !isAdmin && !isClient

  const canAddSubscription = canPerformAction(user, "Subscriptions", "add")
  const canDeleteSubscription = canPerformAction(user, "Subscriptions", "delete")

  // Active Tab: "installments" | "subscriptions"
  const [activeTab, setActiveTab] = React.useState<"installments" | "subscriptions">("installments")

  // Data States
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([])
  const [installments, setInstallments] = React.useState<InstallmentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Modals
  const [isAddSubModalOpen, setIsAddSubModalOpen] = React.useState(false)
  const [selectedInstallmentForDetail, setSelectedInstallmentForDetail] = React.useState<InstallmentItem | null>(null)
  
  // Record Payment Modal State
  const [recordingInstallment, setRecordingInstallment] = React.useState<{
    installment: InstallmentItem
    scheduleItem: InstallmentScheduleItem
  } | null>(null)

  // Renew Subscription Modal State
  const [renewingSubscription, setRenewingSubscription] = React.useState<Subscription | null>(null)

  // Create Subscription Form State
  const [newClientName, setNewClientName] = React.useState("")
  const [newPlanName, setNewPlanName] = React.useState("Enterprise Cloud ERP Retainer")
  const [newAmount, setNewAmount] = React.useState("25000")
  const [newCycle, setNewCycle] = React.useState<BillingCycle>("Monthly")
  const [customDaysCount, setCustomDaysCount] = React.useState<number>(30)
  const [newStartDate, setNewStartDate] = React.useState(new Date().toISOString().split("T")[0])
  const [newNextDate, setNewNextDate] = React.useState("")
  const [availableClients, setAvailableClients] = React.useState<{ name: string; email: string; phone?: string; company?: string }[]>([])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadData = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const [subData, instData] = await Promise.all([
        getSubscriptions(activeCompanyId || "tech"),
        getInstallments(activeCompanyId || "tech"),
      ])
      setSubscriptions(subData)
      setInstallments(instData)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [activeCompanyId])

  React.useEffect(() => {
    loadData(true)
    const interval = setInterval(() => loadData(false), 4000)
    return () => clearInterval(interval)
  }, [loadData])

  React.useEffect(() => {
    if (isAddSubModalOpen) {
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
  }, [isAddSubModalOpen, newClientName])

  // Recalculate default next billing date when cycle changes
  React.useEffect(() => {
    if (newStartDate) {
      const nextD = calculateNextCycleDate(newStartDate, newCycle, customDaysCount)
      setNewNextDate(nextD)
    }
  }, [newStartDate, newCycle, customDaysCount])

  // ── Role-Based Scoped Subscriptions & Installments ──
  const visibleInstallments = React.useMemo(() => {
    if (!user) return []

    const userComp = (activeCompanyId || user?.companyId || "").toLowerCase().trim()
    const targetBranch = activeBranchId

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

    // 1. Super Admin & Company Admin: view all within company/branch
    if (isSuperAdmin || isAdmin) {
      return installments.filter(item => checkCompany(item) && checkBranch(item))
    }

    const normName = (user.name || "").toLowerCase().trim()
    const normEmail = (user.email || "").toLowerCase().trim()
    const uId = String(user.id || "").toLowerCase().trim()

    // 2. Client role: ONLY their own installments
    if (isClient) {
      return installments.filter((item) => {
        if (!checkBranch(item)) return false
        const clientName = (item.clientName || "").toLowerCase().trim()
        const clientEmail = (item.clientEmail || "").toLowerCase().trim()
        const cId = String(item.clientId || "").toLowerCase().trim()

        return (
          clientName === normName ||
          clientEmail === normEmail ||
          (normName && clientName.includes(normName)) ||
          (uId && cId === uId) ||
          (normEmail && clientEmail.includes(normEmail))
        )
      })
    }

    // 3. Team Member: ONLY installments for projects where they are assigned as a member or billed by them
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
  }, [installments, user, isSuperAdmin, isAdmin, isClient, activeCompanyId, activeBranchId])

  const visibleSubscriptions = React.useMemo(() => {
    if (!user) return []

    const userComp = (activeCompanyId || user?.companyId || "").toLowerCase().trim()
    const targetBranch = activeBranchId

    const checkCompany = (sub: Subscription) => {
      if (!userComp || userComp === "all") return true
      const comp = (sub.companyId || "tech").toLowerCase().trim()
      return comp === userComp || (userComp === "tech" && !sub.companyId)
    }

    const checkBranch = (sub: Subscription) => {
      if (!targetBranch) return true
      const bId = String(sub.branchId || "").toLowerCase().trim()
      const bName = String(sub.branchName || "").toLowerCase().trim()
      const target = String(targetBranch).toLowerCase().trim()
      return bId === target || bName === target
    }

    // 1. Super Admin & Company Admin: view all within company/branch
    if (isSuperAdmin || isAdmin) {
      return subscriptions.filter(sub => checkCompany(sub) && checkBranch(sub))
    }

    const normName = (user.name || "").toLowerCase().trim()
    const normEmail = (user.email || "").toLowerCase().trim()
    const uId = String(user.id || "").toLowerCase().trim()

    // 2. Client role: ONLY their own subscriptions
    if (isClient) {
      return subscriptions.filter((sub) => {
        if (!checkBranch(sub)) return false
        const clientName = (sub.clientName || "").toLowerCase().trim()
        const clientEmail = (sub.clientEmail || "").toLowerCase().trim()
        const cId = String(sub.clientId || "").toLowerCase().trim()

        return (
          clientName === normName ||
          clientEmail === normEmail ||
          (normName && clientName.includes(normName)) ||
          (uId && cId === uId) ||
          (normEmail && clientEmail.includes(normEmail))
        )
      })
    }

    // 3. Team Member: ONLY subscriptions assigned to them or created by them
    return subscriptions.filter((sub) => {
      if (!checkBranch(sub)) return false

      const assigned = (sub.assignedMembers || []).map(m => m.toLowerCase().trim())
      const assignedEmails = (sub.assignedMemberEmails || []).map(e => e.toLowerCase().trim())
      const billedBy = (sub.billedBy || "").toLowerCase().trim()
      const createdById = String(sub.createdById || "").toLowerCase().trim()

      if (uId && createdById === uId) return true
      if (normName && billedBy === normName) return true
      if (assigned.some(m => m === normName || (normName && m.includes(normName)) || (normName && normName.includes(m)))) return true
      if (normEmail && assignedEmails.some(e => e === normEmail)) return true

      return false
    })
  }, [subscriptions, user, isSuperAdmin, isAdmin, isClient, activeCompanyId, activeBranchId])

  // Compute KPI metrics
  const kpis: SubscriptionKPIs = React.useMemo(() => {
    const activeSubs = visibleSubscriptions.filter(s => s.status === "Active")
    const totalMRR = activeSubs.reduce((sum, s) => {
      let monthlyVal = s.numericAmount || parseInt(String(s.amount).replace(/[^0-9]/g, "")) || 0
      if (s.billingCycle === "Annually") monthlyVal = Math.round(monthlyVal / 12)
      else if (s.billingCycle === "Quarterly") monthlyVal = Math.round(monthlyVal / 3)
      else if (s.billingCycle === "Weekly") monthlyVal = Math.round(monthlyVal * 4.33)
      else if (s.billingCycle === "Daily") monthlyVal = Math.round(monthlyVal * 30)
      return sum + monthlyVal
    }, 0)

    let upcomingDueCount = 0
    let upcomingDueAmount = 0
    let overdueCount = 0
    let overdueAmount = 0

    visibleInstallments.forEach((inst) => {
      inst.schedule.forEach((s) => {
        if (s.status === "Pending") {
          upcomingDueCount++
          upcomingDueAmount += s.amount
        } else if (s.status === "Overdue") {
          overdueCount++
          overdueAmount += s.amount
        }
      })
    })

    return {
      totalMRR,
      activeSubscriptionsCount: activeSubs.length,
      upcomingInstallmentsDueCount: upcomingDueCount,
      upcomingInstallmentsDueAmount: upcomingDueAmount,
      overdueInstallmentsCount: overdueCount,
      overdueInstallmentsAmount: overdueAmount,
      totalCollectedThisMonth: visibleInstallments.reduce((sum, i) => sum + i.totalPaid, 0),
    }
  }, [visibleSubscriptions, visibleInstallments])

  // ── Actions ──

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClientName.trim() || !newPlanName.trim() || !newAmount.trim()) {
      alert("Please fill in client, plan, and recurring amount.")
      return
    }

    const matchedClient = availableClients.find(c => c.name.toLowerCase().trim() === newClientName.toLowerCase().trim())

    const numAmount = parseInt(newAmount.replace(/[^0-9]/g, "")) || 0
    const formattedAmount = `₹${numAmount.toLocaleString("en-IN")}`
    const finalNextDate = newNextDate || calculateNextCycleDate(newStartDate, newCycle, customDaysCount)

    await addSubscription({
      clientName: newClientName,
      clientEmail: matchedClient?.email || "",
      clientPhone: matchedClient?.phone || "",
      clientCompany: matchedClient?.company || newClientName,
      planName: newPlanName,
      status: "Active",
      amount: formattedAmount,
      numericAmount: numAmount,
      billingCycle: newCycle,
      customDaysCount: newCycle === "Custom Days" ? customDaysCount : undefined,
      startDate: newStartDate,
      nextBillingDate: finalNextDate,
      autoRenew: true,
    }, activeCompanyId || "tech")

    showToast(`✅ Recurring retainer created for ${newClientName}!`)
    setIsAddSubModalOpen(false)
    loadData(false)
  }

  const handleDeleteSubscription = async (id: string) => {
    if (confirm("Cancel and remove this recurring subscription?")) {
      await deleteSubscription(id, activeCompanyId || "tech")
      setSubscriptions((prev) => prev.filter((s) => s.id !== id))
      showToast("Subscription cancelled and removed.")
    }
  }

  const handleToggleAutoRenew = async (sub: Subscription) => {
    const updated = await updateSubscription(sub.id, { autoRenew: !sub.autoRenew }, activeCompanyId || "tech")
    if (updated) {
      setSubscriptions(prev => prev.map(s => s.id === sub.id ? updated : s))
      showToast(`Auto-renewal ${updated.autoRenew ? "enabled" : "disabled"} for ${sub.clientName}.`)
    }
  }

  const handleSendSubscriptionReminder = async (id: string) => {
    const ok = await sendSubscriptionReminder(id, activeCompanyId || "tech")
    if (ok) {
      showToast("📧 Renewal reminder email dispatched to client.")
      loadData(false)
    } else {
      alert("Could not send reminder. Please verify client email in settings.")
    }
  }

  const handleRenewSubscriptionConfirm = async (
    id: string,
    nextDate: string,
    generateInvoice: boolean
  ) => {
    const res = await renewSubscription(id, nextDate, generateInvoice, activeCompanyId || "tech")
    if (res) {
      showToast(`🎉 Contract renewed until ${nextDate}! ${generateInvoice ? "Tax Invoice generated." : ""}`)
      loadData(false)
    }
  }

  const handleSendInstallmentReminder = async (installmentId: string, installmentNumber?: number) => {
    const ok = await sendInstallmentReminder(installmentId, installmentNumber, activeCompanyId || "tech")
    if (ok) {
      showToast("📧 Payment reminder email successfully sent to client.")
      loadData(false)
    } else {
      alert("Could not send reminder. Please check that the client has a valid email address.")
    }
  }

  const handleRecordInstallmentPaymentConfirm = async (
    installmentId: string,
    installmentNumber: number,
    amount: number,
    paymentMethod: string
  ) => {
    const updated = await recordInstallmentPayment(installmentId, installmentNumber, amount, paymentMethod, activeCompanyId || "tech")
    if (updated) {
      showToast(`💰 Installment #${installmentNumber} marked as PAID! Balance updated.`)
      if (selectedInstallmentForDetail && selectedInstallmentForDetail.id === installmentId) {
        setSelectedInstallmentForDetail(updated)
      }
      loadData(false)
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <CreditCard size={20} />
            </div>
            <span>Subscriptions & Installment Hub</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage EMI milestone payments, recurring retainer contracts, and automated billing collection for {activeCompanyId === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={() => window.print()}>
            Print / Export
          </Button>

          {canAddSubscription && (
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAddSubModalOpen(true)}>
              New Subscription
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Monthly MRR</div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              ₹{kpis.totalMRR.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-1">
              {kpis.activeSubscriptionsCount} Active Retainers
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <RefreshCw size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Upcoming Installments</div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              ₹{kpis.upcomingInstallmentsDueAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
              {kpis.upcomingInstallmentsDueCount} Parts Pending Due
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Clock size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Overdue Collections</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              ₹{kpis.overdueInstallmentsAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
              {kpis.overdueInstallmentsCount} Overdue Milestones
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Collected Revenue</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{kpis.totalCollectedThisMonth.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              From Part Payments
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Slider */}
      <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl w-full sm:w-fit border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("installments")}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "installments"
              ? "bg-white dark:bg-zinc-900 text-teal-800 dark:text-teal-300 shadow-sm border border-teal-500/20"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <span>💳 Installments & Part-Payments</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "installments"
              ? "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
          }`}>
            {visibleInstallments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subscriptions")}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "subscriptions"
              ? "bg-white dark:bg-zinc-900 text-blue-800 dark:text-blue-300 shadow-sm border border-blue-500/20"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <span>🔄 Recurring Subscriptions & Retainers</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "subscriptions"
              ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
          }`}>
            {visibleSubscriptions.length}
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      {isLoading ? (
        <ThreeDotLoader text="Loading subscriptions & installments..." fullScreen={false} />
      ) : activeTab === "installments" ? (
        <InstallmentsView
          installments={visibleInstallments}
          onSelectInstallment={(item) => setSelectedInstallmentForDetail(item)}
          onSendReminder={handleSendInstallmentReminder}
          onOpenRecordPayment={(installment, scheduleItem) => {
            setRecordingInstallment({ installment, scheduleItem })
          }}
        />
      ) : (
        <SubscriptionList
          subscriptions={visibleSubscriptions}
          onDelete={handleDeleteSubscription}
          onOpenRenewModal={(sub) => setRenewingSubscription(sub)}
          onSendReminder={handleSendSubscriptionReminder}
          onToggleAutoRenew={handleToggleAutoRenew}
        />
      )}

      {/* ── MODAL 1: CLIENT INSTALLMENT DETAILS MODAL ── */}
      <ClientInstallmentDetailModal
        isOpen={Boolean(selectedInstallmentForDetail)}
        installment={selectedInstallmentForDetail}
        onClose={() => setSelectedInstallmentForDetail(null)}
        onSendReminder={handleSendInstallmentReminder}
        onRecordPayment={(inst, sched) => {
          setRecordingInstallment({ installment: inst, scheduleItem: sched })
        }}
      />

      {/* ── MODAL 2: RECORD INSTALLMENT PAYMENT MODAL ── */}
      <RecordInstallmentPaymentModal
        isOpen={Boolean(recordingInstallment)}
        installment={recordingInstallment?.installment || null}
        scheduleItem={recordingInstallment?.scheduleItem || null}
        onClose={() => setRecordingInstallment(null)}
        onConfirm={handleRecordInstallmentPaymentConfirm}
      />

      {/* ── MODAL 3: RENEW SUBSCRIPTION MODAL ── */}
      <RenewSubscriptionModal
        isOpen={Boolean(renewingSubscription)}
        subscription={renewingSubscription}
        onClose={() => setRenewingSubscription(null)}
        onConfirm={handleRenewSubscriptionConfirm}
      />

      {/* ── MODAL 4: CREATE RECURRING SUBSCRIPTION MODAL ── */}
      <AnimatePresence>
        {isAddSubModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-blue-900/10 to-teal-900/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Create Recurring Subscription
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Set up automated recurring retainer or maintenance contract
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddSubModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateSubscription} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                    Subscriber Client *
                  </label>
                  <select
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-medium"
                  >
                    {availableClients.map(c => (
                      <option key={c.name} value={c.name}>{c.name} ({c.company || 'Client'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                    Subscription / Plan Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cloud Server & ERP Maintenance Retainer"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      Recurring Amount (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-zinc-400 font-bold">₹</span>
                      <input
                        type="number"
                        required
                        placeholder="25000"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      Billing Interval
                    </label>
                    <select
                      value={newCycle}
                      onChange={(e) => setNewCycle(e.target.value as BillingCycle)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-bold"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly (Every 7 Days)</option>
                      <option value="Monthly">Monthly Retainer</option>
                      <option value="Quarterly">Quarterly (Every 3 Months)</option>
                      <option value="Half-Yearly">Half-Yearly (Every 6 Months)</option>
                      <option value="Annually">Annual Contract (Yearly)</option>
                      <option value="Custom Days">Custom Interval (Days)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Days Input */}
                {newCycle === "Custom Days" && (
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      Custom Interval Duration (in Days) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={customDaysCount}
                      onChange={(e) => setCustomDaysCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-bold"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      Next Billing / Renewal Date
                    </label>
                    <input
                      type="date"
                      value={newNextDate}
                      onChange={(e) => setNewNextDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddSubModalOpen(false)}
                    className="px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard size={14} />
                    <span>Create Subscription</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
