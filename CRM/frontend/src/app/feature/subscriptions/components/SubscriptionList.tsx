"use client"

import * as React from "react"
import { 
  Search, RefreshCw, Send, Trash2, Calendar, 
  CheckCircle2, Clock, AlertCircle, Sparkles, Building2, User
} from "lucide-react"
import { Subscription, SubscriptionStatus } from "../types"

interface SubscriptionListProps {
  subscriptions: Subscription[]
  onDelete: (id: string) => void
  onOpenRenewModal: (sub: Subscription) => void
  onSendReminder: (id: string) => Promise<void>
  onToggleAutoRenew: (sub: Subscription) => void
}

export function SubscriptionList({
  subscriptions,
  onDelete,
  onOpenRenewModal,
  onSendReminder,
  onToggleAutoRenew,
}: SubscriptionListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [sendingReminderId, setSendingReminderId] = React.useState<string | null>(null)

  const filteredSubs = React.useMemo(() => {
    return subscriptions.filter((s) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesQuery = 
        !q ||
        s.clientName.toLowerCase().includes(q) ||
        s.planName.toLowerCase().includes(q) ||
        (s.clientEmail && s.clientEmail.toLowerCase().includes(q))

      let matchesStatus = true
      if (statusFilter === "active") {
        matchesStatus = s.status === "Active"
      } else if (statusFilter === "due") {
        matchesStatus = s.status === "Past Due" || s.status === "Expiring Soon"
      } else if (statusFilter === "canceled") {
        matchesStatus = s.status === "Canceled"
      }

      return matchesQuery && matchesStatus
    })
  }, [subscriptions, searchQuery, statusFilter])

  const handleReminder = async (id: string) => {
    setSendingReminderId(id)
    try {
      await onSendReminder(id)
    } finally {
      setSendingReminderId(null)
    }
  }

  const getStatusBadge = (status: SubscriptionStatus, nextBillingDate: string) => {
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

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by client, retainer, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs shrink-0 overflow-x-auto">
          {[
            { id: "all", label: "All Retainers" },
            { id: "active", label: "Active" },
            { id: "due", label: "Due / Expiring" },
            { id: "canceled", label: "Cancelled" },
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

      {/* Subscriptions Table */}
      {filteredSubs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
            🔄
          </div>
          <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Recurring Subscriptions Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Create recurring retainers for web maintenance, cloud hosting, SEO, or annual support contracts using the "New Subscription" button above.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-zinc-500 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Client & Plan</th>
                  <th className="py-3 px-3">Recurring Rate</th>
                  <th className="py-3 px-3">Billing Cycle</th>
                  <th className="py-3 px-3">Next Renewal</th>
                  <th className="py-3 px-3 text-center">Auto-Renew</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredSubs.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors group"
                  >
                    {/* Client & Plan */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-500/20">
                          {sub.clientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {sub.clientName}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {sub.planName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Recurring Rate */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                        {sub.amount}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        per {sub.billingCycle.toLowerCase()}
                      </div>
                    </td>

                    {/* Billing Cycle */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] border border-zinc-200/80 dark:border-zinc-700/60">
                        {sub.billingCycle === "Custom Days" ? `${sub.customDaysCount || 30} Days` : sub.billingCycle}
                      </span>
                    </td>

                    {/* Next Renewal */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                        <Calendar size={13} className="text-zinc-400 shrink-0" />
                        <span>{sub.nextBillingDate}</span>
                      </div>
                      {sub.lastRenewedDate && (
                        <div className="text-[10px] text-zinc-400">
                          Renewed: {sub.lastRenewedDate}
                        </div>
                      )}
                    </td>

                    {/* Auto-Renew Toggle */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
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
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(sub.status, sub.nextBillingDate)}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
