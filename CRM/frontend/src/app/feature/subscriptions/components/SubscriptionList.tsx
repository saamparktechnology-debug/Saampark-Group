"use client"

import * as React from "react"
import { 
  Search, RefreshCw, Send, Trash2, Calendar, 
  CheckCircle2, Clock, AlertCircle, Sparkles, Building2, User,
  CreditCard, Package, Layers, ChevronDown, ChevronUp, Check, ShieldCheck,
  FileText, Receipt
} from "lucide-react"
import { Subscription, SubscriptionStatus, SubscriptionType } from "../types"
import { useAuthStore } from "@/store/useAuthStore"

interface SubscriptionListProps {
  subscriptions: Subscription[]
  onDelete: (id: string) => void
  onOpenRenewModal: (sub: Subscription) => void
  onSendReminder: (id: string) => Promise<void>
  onToggleAutoRenew: (sub: Subscription) => void
  onClientPayNow?: (sub: Subscription) => void
  onGenerateInvoice?: (sub: Subscription) => Promise<void>
  onSelectClient?: (clientName: string, sub: Subscription) => void
}

export function SubscriptionList({
  subscriptions,
  onDelete,
  onOpenRenewModal,
  onSendReminder,
  onToggleAutoRenew,
  onClientPayNow,
  onGenerateInvoice,
  onSelectClient,
}: SubscriptionListProps) {
  const { user } = useAuthStore()
  const isClient = (user?.role || "").toLowerCase().includes("client")

  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [sendingReminderId, setSendingReminderId] = React.useState<string | null>(null)
  const [expandedSubId, setExpandedSubId] = React.useState<string | null>(null)

  const filteredSubs = React.useMemo(() => {
    return subscriptions.filter((s) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesQuery = 
        !q ||
        s.clientName.toLowerCase().includes(q) ||
        s.planName.toLowerCase().includes(q) ||
        (s.clientEmail && s.clientEmail.toLowerCase().includes(q)) ||
        (s.clientCompany && s.clientCompany.toLowerCase().includes(q))

      let matchesStatus = true
      if (statusFilter === "active") {
        matchesStatus = s.status === "Active"
      } else if (statusFilter === "due") {
        matchesStatus = s.status === "Past Due" || s.status === "Expiring Soon"
      } else if (statusFilter === "canceled") {
        matchesStatus = s.status === "Canceled"
      }

      let matchesType = true
      const subType = s.subscriptionType || "regular"
      if (typeFilter !== "all") {
        matchesType = subType === typeFilter
      }

      return matchesQuery && matchesStatus && matchesType
    })
  }, [subscriptions, searchQuery, statusFilter, typeFilter])

  const handleReminder = async (id: string) => {
    setSendingReminderId(id)
    try {
      await onSendReminder(id)
    } finally {
      setSendingReminderId(null)
    }
  }

  const getStatusBadge = (status: SubscriptionStatus) => {
    let style = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
    if (status === "Past Due") {
      style = "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse"
    } else if (status === "Expiring Soon") {
      style = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800"
    } else if (status === "Canceled") {
      style = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700"
    }

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${style}`}>
        {status}
      </span>
    )
  }

  const getTypeBadge = (type?: SubscriptionType) => {
    const t = type || "regular"
    if (t === "package") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
          <Package size={11} />
          <span>Package</span>
        </span>
      )
    }
    if (t === "emi") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1">
          <CreditCard size={11} />
          <span>EMI Sub</span>
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1">
        <RefreshCw size={11} />
        <span>Regular</span>
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by client, plan, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Subscription Model & Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs shrink-0">
            {[
              { id: "all", label: "All Types" },
              { id: "package", label: "📦 Package" },
              { id: "regular", label: "🔁 Regular" },
              { id: "emi", label: "💳 EMI Sub" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                  typeFilter === tab.id
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs shrink-0">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "due", label: "Due / Expiring" },
              { id: "canceled", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap ${
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
      </div>

      {/* Subscriptions Table */}
      {filteredSubs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
            🔄
          </div>
          <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Subscriptions Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {isClient
              ? "You do not have any active subscriptions under this account."
              : "Create recurring retainers, package plans, or EMI subscriptions using the 'New Subscription' button above."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-zinc-500 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Client & Subscription</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Recurring Rate</th>
                  <th className="py-3 px-3">Billing Cycle / Tenure</th>
                  <th className="py-3 px-3">1st Payment</th>
                  <th className="py-3 px-3">Next Renewal Due</th>
                  <th className="py-3 px-3 text-center">Auto-Renew</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredSubs.map((sub) => {
                  const isExpanded = expandedSubId === sub.id
                  const hasDeliverables = Array.isArray(sub.deliverables) && sub.deliverables.length > 0

                  return (
                    <React.Fragment key={sub.id}>
                      <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors group">
                        {/* Client & Plan */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-500/20">
                              {sub.clientName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onSelectClient ? onSelectClient(sub.clientName, sub) : undefined}
                                  className="text-left font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer truncate transition-colors"
                                  title="Click to view full client subscription history & billing ledger"
                                >
                                  {sub.clientName}
                                </button>
                                {hasDeliverables && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                                    className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center shrink-0"
                                  >
                                    <span>Features</span>
                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </button>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {sub.planName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Subscription Model Type */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {getTypeBadge(sub.subscriptionType)}
                        </td>

                        {/* Recurring Rate */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                            {sub.amount}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {sub.subscriptionType === "emi"
                              ? `₹${(sub.emiPerCycle || 0).toLocaleString("en-IN")}/mo`
                              : `per ${sub.billingCycle.toLowerCase()}`}
                          </div>
                        </td>

                        {/* Billing Cycle / Tenure */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {sub.subscriptionType === "emi" ? (
                            <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-[10px] border border-teal-200 dark:border-teal-800">
                              {sub.totalTenureMonths || 12} Months Tenure
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] border border-zinc-200/80 dark:border-zinc-700/60">
                              {sub.billingCycle === "Custom Days" ? `${sub.customDaysCount || 30} Days` : sub.billingCycle}
                            </span>
                          )}
                        </td>

                        {/* 1st Payment Date */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                            <Calendar size={12} className="text-blue-500 shrink-0" />
                            <span>{sub.firstPaymentDate || sub.startDate || "Initial"}</span>
                          </div>
                        </td>

                        {/* Next Payment Date */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-bold">
                            <Calendar size={12} className="text-emerald-500 shrink-0" />
                            <span>{sub.nextBillingDate}</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {sub.lastRenewedDate ? `Renewed: ${sub.lastRenewedDate}` : "Next Due"}
                          </div>
                        </td>

                        {/* Auto-Renew Toggle */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {!isClient ? (
                            <button
                              type="button"
                              onClick={() => onToggleAutoRenew(sub)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                sub.autoRenew
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                              }`}
                              title="Toggle Auto-Renewal status"
                            >
                              {sub.autoRenew ? "ON" : "OFF"}
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-500">
                              {sub.autoRenew ? "Enabled" : "Manual"}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(sub.status)}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Client Pay / Renew button */}
                            {isClient ? (
                              <button
                                type="button"
                                onClick={() => onClientPayNow ? onClientPayNow(sub) : onOpenRenewModal(sub)}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                              >
                                <CreditCard size={12} />
                                <span>Pay / Renew</span>
                              </button>
                            ) : (
                              <>
                                {sub.clientEmail && (
                                  <button
                                    type="button"
                                    onClick={() => handleReminder(sub.id)}
                                    disabled={sendingReminderId === sub.id}
                                    className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Send Renewal Reminder Email"
                                  >
                                    <Send size={11} />
                                    <span>{sendingReminderId === sub.id ? "Sending..." : "Reminder"}</span>
                                  </button>
                                )}

                                 {onGenerateInvoice && (
                                  <button
                                    type="button"
                                    onClick={() => onGenerateInvoice(sub)}
                                    className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Generate official tax invoice against this subscription"
                                  >
                                    <Receipt size={11} />
                                    <span>Invoice</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onOpenRenewModal(sub)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                  title="Confirm & Renew Subscription"
                                >
                                  <RefreshCw size={11} />
                                  <span>Renew</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onDelete(sub.id)}
                                  className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Delete Subscription"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Deliverables Row */}
                      {isExpanded && hasDeliverables && (
                        <tr className="bg-zinc-50/70 dark:bg-zinc-800/30">
                          <td colSpan={9} className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-bold uppercase text-zinc-400">
                                Package Deliverables & Inclusions:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {sub.deliverables!.map((d, i) => (
                                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                    <span>{d}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
