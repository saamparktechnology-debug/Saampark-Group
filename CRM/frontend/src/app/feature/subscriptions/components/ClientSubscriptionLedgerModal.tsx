"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  X, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Receipt,
  Eye,
  Plus,
  RefreshCw,
  CreditCard,
  AlertTriangle
} from "lucide-react"
import { Subscription, InstallmentItem, SubscriptionStatus, calculateOverdueDetails } from "../types"
import { getInvoices, InvoiceItem } from "@/app/feature/sales/invoices/services/invoiceService"
import { getInstallments } from "../services/subscriptionService"
import { useAuthStore } from "@/store/useAuthStore"

interface ClientSubscriptionLedgerModalProps {
  isOpen: boolean
  clientName: string | null
  clientEmail?: string
  subscriptions: Subscription[]
  onClose: () => void
  onGenerateInvoice: (sub: Subscription) => Promise<void>
  onRenewSubscription: (sub: Subscription) => void
  onViewInvoice?: (invoice: InvoiceItem) => void
  onOpenCreateSub?: (clientName: string) => void
}

export function ClientSubscriptionLedgerModal({
  isOpen,
  clientName,
  clientEmail,
  subscriptions,
  onClose,
  onGenerateInvoice,
  onRenewSubscription,
  onViewInvoice,
  onOpenCreateSub,
}: ClientSubscriptionLedgerModalProps) {
  const { branches } = useAuthStore()
  const [activeTab, setActiveTab] = React.useState<"subscriptions" | "invoices" | "installments">("subscriptions")
  const [clientInvoices, setClientInvoices] = React.useState<InvoiceItem[]>([])
  const [clientInstallments, setClientInstallments] = React.useState<InstallmentItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)
  const [generatingSubId, setGeneratingSubId] = React.useState<string | null>(null)

  // Filter subscriptions for this specific client
  const matchedSubs = React.useMemo(() => {
    if (!clientName) return []
    const norm = clientName.toLowerCase().trim()
    return subscriptions.filter(s => {
      const sName = (s.clientName || "").toLowerCase().trim()
      const sEmail = (s.clientEmail || "").toLowerCase().trim()
      return sName === norm || (clientEmail && sEmail === clientEmail.toLowerCase().trim())
    })
  }, [clientName, clientEmail, subscriptions])

  // Load Invoices and Installments for this client
  React.useEffect(() => {
    if (!isOpen || !clientName) return

    let isMounted = true
    setIsLoadingHistory(true)

    const fetchHistory = async () => {
      try {
        const [allInvs, allInsts] = await Promise.all([
          getInvoices("all").catch(() => []),
          getInstallments("all").catch(() => []),
        ])

        if (!isMounted) return

        const norm = clientName.toLowerCase().trim()
        const normEmail = (clientEmail || "").toLowerCase().trim()

        const filteredInvs = (allInvs || []).filter((inv: InvoiceItem) => {
          const invClient = (inv.client || "").toLowerCase().trim()
          const invEmail = (inv.clientEmail || "").toLowerCase().trim()
          return invClient === norm || (normEmail && invEmail === normEmail)
        })

        const filteredInsts = (allInsts || []).filter((inst: InstallmentItem) => {
          const instClient = (inst.clientName || "").toLowerCase().trim()
          const instEmail = (inst.clientEmail || "").toLowerCase().trim()
          return instClient === norm || (normEmail && instEmail === normEmail)
        })

        setClientInvoices(filteredInvs)
        setClientInstallments(filteredInsts)
      } finally {
        if (isMounted) setIsLoadingHistory(false)
      }
    }

    fetchHistory()

    return () => {
      isMounted = false
    }
  }, [isOpen, clientName, clientEmail])

  // Financial Metrics Computations
  const metrics = React.useMemo(() => {
    const today = new Date().toISOString().split("T")[0]

    // 1. Invoices stats
    let totalInvoiced = 0
    let totalPaid = 0
    let totalDue = 0
    let overdueInvoicesCount = 0
    let overdueInvoicesAmount = 0

    clientInvoices.forEach(inv => {
      const invTotal = parseInt(String(inv.totalInvoiced || "0").replace(/[^0-9]/g, "")) || (inv.baseAmount || 0)
      const invPaid = parseInt(String(inv.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
      const invDue = parseInt(String(inv.due || "0").replace(/[^0-9]/g, "")) || Math.max(0, invTotal - invPaid)

      totalInvoiced += invTotal
      totalPaid += invPaid
      totalDue += invDue

      // Overdue check
      if (invDue > 0 && inv.status !== "Fully paid" && inv.dueDate && inv.dueDate < today) {
        overdueInvoicesCount++
        overdueInvoicesAmount += invDue
      }
    })

    // 2. Subscriptions overdue check
    let overdueSubsCount = 0
    let overdueSubsAmount = 0
    matchedSubs.forEach(s => {
      const numAmt = s.numericAmount || parseInt(String(s.amount).replace(/[^0-9]/g, "")) || 0
      if (s.status === "Past Due" || (s.nextBillingDate && s.nextBillingDate < today && s.status !== "Canceled")) {
        overdueSubsCount++
        overdueSubsAmount += numAmt
      }
    })

    // 3. Installments overdue check
    clientInstallments.forEach(inst => {
      (inst.schedule || []).forEach(item => {
        if (item.status === "Overdue" || (item.status === "Pending" && item.dueDate < today)) {
          overdueInvoicesCount++
          overdueInvoicesAmount += item.amount
        }
      })
    })

    const activeSubsCount = matchedSubs.filter(s => s.status === "Active").length
    const primaryClientObj = matchedSubs[0] || (clientInvoices[0] as any) || {}

    return {
      totalInvoiced,
      totalPaid,
      totalDue,
      overdueInvoicesCount: overdueInvoicesCount + overdueSubsCount,
      overdueInvoicesAmount: overdueInvoicesAmount + overdueSubsAmount,
      activeSubsCount,
      totalSubsCount: matchedSubs.length,
      email: clientEmail || (primaryClientObj as any).clientEmail || "N/A",
      phone: (primaryClientObj as any).clientPhone || "N/A",
      company: (primaryClientObj as any).clientCompany || (primaryClientObj as any).companyName || clientName,
      branchId: (primaryClientObj as any).branchId,
      branchName: (primaryClientObj as any).branchName,
    }
  }, [clientInvoices, matchedSubs, clientInstallments, clientEmail, clientName])

  if (!isOpen || !clientName) return null

  const handleGenInvoice = async (sub: Subscription) => {
    setGeneratingSubId(sub.id)
    try {
      await onGenerateInvoice(sub)
      // Refresh invoices list
      const allInvs = await getInvoices("all").catch(() => [])
      const norm = clientName.toLowerCase().trim()
      setClientInvoices((allInvs || []).filter((inv: InvoiceItem) => (inv.client || "").toLowerCase().trim() === norm))
    } finally {
      setGeneratingSubId(null)
    }
  }

  const getSubStatusBadge = (status: SubscriptionStatus) => {
    let style = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
    if (status === "Past Due") {
      style = "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse"
    } else if (status === "Expiring Soon") {
      style = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800"
    } else if (status === "Canceled") {
      style = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700"
    }
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style}`}>{status}</span>
  }

  const getInvoiceStatusBadge = (status: string, dueAmount: number, dueDate?: string) => {
    const isPastDue = dueAmount > 0 && dueDate && dueDate < new Date().toISOString().split("T")[0]
    if (isPastDue || status === "Overdue") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse flex items-center gap-1">
          <AlertTriangle size={10} />
          <span>Overdue</span>
        </span>
      )
    }
    if (status === "Fully paid" || status === "Paid") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
          Paid
        </span>
      )
    }
    if (status === "Partially paid") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800">
          Partial
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700">
        Unpaid
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Modal Header & Client Profile */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-blue-900/10 via-zinc-50 to-teal-900/10 dark:from-blue-950/40 dark:via-zinc-900 dark:to-teal-950/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                {clientName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {clientName}
                  </h2>
                  {metrics.company && metrics.company !== clientName && (
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs border border-zinc-200 dark:border-zinc-700">
                      🏢 {metrics.company}
                    </span>
                  )}
                  {metrics.branchName && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-200 dark:border-amber-800">
                      📍 {metrics.branchName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex-wrap">
                  {metrics.email && metrics.email !== "N/A" && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} className="text-blue-500" />
                      <span>{metrics.email}</span>
                    </span>
                  )}
                  {metrics.phone && metrics.phone !== "N/A" && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-emerald-500" />
                      <span>{metrics.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Financial Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="p-3 bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Total Billed</div>
              <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                ₹{metrics.totalInvoiced.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">All Invoices & Retainers</div>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-800/80 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>Total Paid</span>
                <CheckCircle2 size={12} />
              </div>
              <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{metrics.totalPaid.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Settled Ledger</div>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-800/80 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span>Current Due</span>
                <Clock size={12} />
              </div>
              <div className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                ₹{metrics.totalDue.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Pending Payment</div>
            </div>

            <div className={`p-3 rounded-2xl border shadow-2xs transition-all ${
              metrics.overdueInvoicesAmount > 0
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800"
                : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80"
            }`}>
              <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
                <span>Overdue Due</span>
                <AlertTriangle size={12} />
              </div>
              <div className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                ₹{metrics.overdueInvoicesAmount.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-rose-500 font-semibold mt-0.5">
                {metrics.overdueInvoicesCount > 0 ? `${metrics.overdueInvoicesCount} Overdue Cycles` : "No Overdue"}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-b border-zinc-200 dark:border-zinc-700 pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("subscriptions")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "subscriptions"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <RefreshCw size={13} />
              <span>Subscriptions & Retainers ({matchedSubs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("invoices")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "invoices"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Receipt size={13} />
              <span>Invoices & Billing History ({clientInvoices.length})</span>
            </button>

            {clientInstallments.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("installments")}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "installments"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <CreditCard size={13} />
                <span>EMI Contracts ({clientInstallments.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoadingHistory ? (
            <div className="py-12 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw size={15} className="animate-spin text-blue-500" />
              <span>Loading complete client subscription history...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: SUBSCRIPTIONS & RETAINERS */}
              {activeTab === "subscriptions" && (
                <div className="space-y-3">
                  {matchedSubs.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="text-2xl">🔄</div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No Subscriptions Found</p>
                      <p className="text-[11px] text-zinc-500">This client does not have any active recurring plans.</p>
                      {onOpenCreateSub && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            onOpenCreateSub(clientName)
                          }}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs hover:bg-blue-700 cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Create New Subscription</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matchedSubs.map((sub) => {
                        const isGenerating = generatingSubId === sub.id
                        const overdueInfo = calculateOverdueDetails(sub)
                        const isNonGst = Boolean(sub.isNonGst || sub.taxType === "nongst" || sub.gstRate === 0)

                        return (
                          <div
                            key={sub.id}
                            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all ${
                              overdueInfo.isOverdue
                                ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
                                : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/80"
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                  {sub.planName}
                                </span>
                                {getSubStatusBadge(sub.status)}
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-200 dark:border-blue-800">
                                  {sub.billingCycle} Retainer
                                </span>
                                {isNonGst && (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-200 dark:border-blue-800">
                                    📄 0% Non-GST
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
                                <span>Recurring Rate: <strong className="text-zinc-800 dark:text-zinc-200">{sub.amount}</strong></span>
                                <span>•</span>
                                {overdueInfo.isOverdue ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                    <AlertTriangle size={11} className="animate-pulse" />
                                    <span>Overdue by {overdueInfo.daysOverdue} {overdueInfo.daysOverdue === 1 ? 'day' : 'days'} (Due: {sub.nextBillingDate})</span>
                                    {overdueInfo.dailyLateFee > 0 && (
                                      <span className="text-[10px] font-semibold text-rose-500">
                                        • +₹{overdueInfo.accumulatedLateFee} Late Fee (₹{overdueInfo.dailyLateFee}/d)
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span>Next Billing: <strong className="text-emerald-600 dark:text-emerald-400">{sub.nextBillingDate}</strong></span>
                                )}
                                {sub.startDate && (
                                  <>
                                    <span>•</span>
                                    <span>Started: {sub.startDate}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleGenInvoice(sub)}
                                disabled={isGenerating}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
                                title="Generate official tax invoice for this billing period"
                              >
                                {isGenerating ? (
                                  <>
                                    <RefreshCw size={12} className="animate-spin" />
                                    <span>Billing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Receipt size={12} />
                                    <span>Generate Invoice</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => onRenewSubscription(sub)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                                title="Renew cycle and roll over billing date"
                              >
                                <RefreshCw size={12} />
                                <span>Renew</span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INVOICES & BILLING LEDGER */}
              {activeTab === "invoices" && (
                <div className="space-y-3">
                  {clientInvoices.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="text-2xl">📄</div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No Invoices Found</p>
                      <p className="text-[11px] text-zinc-500">No invoices have been billed for this client yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase font-semibold text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                            <th className="py-2.5 px-3">Invoice #</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Due Date</th>
                            <th className="py-2.5 px-3">Invoiced</th>
                            <th className="py-2.5 px-3">Paid</th>
                            <th className="py-2.5 px-3">Balance Due</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {clientInvoices.map((inv) => {
                            const dueNum = parseInt(String(inv.due || "0").replace(/[^0-9]/g, "")) || 0
                            return (
                              <tr key={inv.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                                <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                  {inv.id}
                                </td>
                                <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                  {inv.billDate || "N/A"}
                                </td>
                                <td className="py-3 px-3 text-zinc-800 dark:text-zinc-200 font-medium whitespace-nowrap">
                                  {inv.dueDate || "N/A"}
                                </td>
                                <td className="py-3 px-3 font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                                  {inv.totalInvoiced}
                                </td>
                                <td className="py-3 px-3 font-semibold text-emerald-600 whitespace-nowrap">
                                  {inv.paymentReceived || "₹0"}
                                </td>
                                <td className="py-3 px-3 font-bold text-rose-600 whitespace-nowrap">
                                  {inv.due || "₹0"}
                                </td>
                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                  {getInvoiceStatusBadge(inv.status, dueNum, inv.dueDate)}
                                </td>
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  {onViewInvoice && (
                                    <button
                                      type="button"
                                      onClick={() => onViewInvoice(inv)}
                                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-[11px] hover:bg-blue-100 border border-blue-200 dark:border-blue-800 flex items-center gap-1 ml-auto cursor-pointer"
                                    >
                                      <Eye size={11} />
                                      <span>View</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EMI INSTALLMENTS CONTRACTS */}
              {activeTab === "installments" && (
                <div className="space-y-3">
                  {clientInstallments.map((inst) => (
                    <div
                      key={inst.id}
                      className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{inst.projectTitle}</h4>
                          <p className="text-[11px] text-zinc-500">Contract Total: ₹{inst.totalContractValue.toLocaleString("en-IN")}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          {inst.status}
                        </span>
                      </div>

                      {/* Schedule Mini-List */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {(inst.schedule || []).map((item) => (
                          <div
                            key={item.installmentNumber}
                            className={`p-2.5 rounded-xl border text-[11px] ${
                              item.status === "Paid"
                                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                : item.status === "Overdue"
                                  ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 animate-pulse"
                                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                            }`}
                          >
                            <div className="flex justify-between font-bold">
                              <span>Inst #{item.installmentNumber}</span>
                              <span>{item.formattedAmount}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">Due: {item.dueDate}</div>
                            <div className="mt-1 font-bold text-[10px] flex items-center gap-1">
                              {item.status === "Paid" ? "✅ Paid" : item.status === "Overdue" ? "⚠️ Overdue" : "⏳ Pending"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <div className="text-[11px] text-zinc-500">
            {metrics.activeSubsCount} active plans • {clientInvoices.length} invoices generated
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Close Ledger
          </button>
        </div>
      </motion.div>
    </div>
  )
}
