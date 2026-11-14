"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, Filter, Send, MessageCircle, CheckCircle2, Clock, 
  AlertCircle, ChevronRight, User, Building2, Calendar, 
  CreditCard, ArrowUpRight, ShieldCheck, Download
} from "lucide-react"
import { InstallmentItem, InstallmentScheduleItem, InstallmentStatus } from "../types"

interface InstallmentsViewProps {
  installments: InstallmentItem[]
  onSelectInstallment: (item: InstallmentItem) => void
  onSendReminder: (installmentId: string, installmentNumber?: number) => Promise<void>
  onOpenRecordPayment: (installment: InstallmentItem, scheduleItem: InstallmentScheduleItem) => void
}

export function InstallmentsView({
  installments,
  onSelectInstallment,
  onSendReminder,
  onOpenRecordPayment,
}: InstallmentsViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [sendingReminderId, setSendingReminderId] = React.useState<string | null>(null)

  // Filter installments
  const filteredList = React.useMemo(() => {
    return installments.filter((item) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesQuery = 
        !q ||
        item.clientName.toLowerCase().includes(q) ||
        item.projectTitle.toLowerCase().includes(q) ||
        (item.clientCompany && item.clientCompany.toLowerCase().includes(q)) ||
        (item.clientEmail && item.clientEmail.toLowerCase().includes(q))

      let matchesStatus = true
      if (statusFilter === "pending") {
        matchesStatus = item.status === "Pending" || item.status === "Partially Paid"
      } else if (statusFilter === "overdue") {
        matchesStatus = item.status === "Overdue"
      } else if (statusFilter === "paid") {
        matchesStatus = item.status === "Paid"
      }

      return matchesQuery && matchesStatus
    })
  }, [installments, searchQuery, statusFilter])

  const handleReminderClick = async (e: React.MouseEvent, item: InstallmentItem) => {
    e.stopPropagation()
    setSendingReminderId(item.id)
    try {
      await onSendReminder(item.id)
    } finally {
      setSendingReminderId(null)
    }
  }

  const handleWhatsAppClick = (e: React.MouseEvent, item: InstallmentItem) => {
    e.stopPropagation()
    const rawPhone = (item.clientPhone || "").replace(/[^0-9]/g, "")
    const targetPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone
    const msg = `Hello ${item.clientName}, this is a reminder from SAAMPARK Group regarding Installment #${item.currentInstallmentNumber} (₹${item.currentInstallmentAmount.toLocaleString("en-IN")}) for "${item.projectTitle}", due on ${item.currentDueDate}. Thank you!`
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  const getDueBadge = (dueDateStr: string, status: InstallmentStatus) => {
    if (status === "Paid") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
          <CheckCircle2 size={11} /> Paid
        </span>
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDateStr)
    due.setHours(0, 0, 0, 0)
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 inline-flex items-center gap-1 animate-pulse">
          <AlertCircle size={11} /> Overdue by {Math.abs(diffDays)}d
        </span>
      )
    } else if (diffDays === 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
          <Clock size={11} /> Due Today
        </span>
      )
    } else if (diffDays <= 7) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800 inline-flex items-center gap-1">
          <Clock size={11} /> Due in {diffDays}d
        </span>
      )
    } else {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 inline-flex items-center gap-1">
          <Calendar size={11} /> Due: {dueDateStr}
        </span>
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by client, project, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs shrink-0 overflow-x-auto">
          {[
            { id: "all", label: "All Installments" },
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

      {/* Installments Table */}
      {filteredList.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto text-xl font-bold">
            💳
          </div>
          <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Installment Contracts Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Installments are automatically generated when client projects are created with Part-Payment or Milestone billing options in the Clients section.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-zinc-500 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Client & Project</th>
                  <th className="py-3 px-3">Contract Value</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">Next Due</th>
                  <th className="py-3 px-3">Next Installment</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredList.map((item) => {
                  const progressPct = item.totalContractValue > 0 
                    ? Math.min(100, Math.round((item.totalPaid / item.totalContractValue) * 100))
                    : 0

                  const nextPendingSchedule = item.schedule.find(s => s.status !== "Paid") || item.schedule[0]

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectInstallment(item)}
                      className="hover:bg-teal-50/30 dark:hover:bg-teal-950/10 transition-colors cursor-pointer group"
                    >
                      {/* Client & Project */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-700 dark:text-teal-400 font-bold flex items-center justify-center text-xs shrink-0 border border-teal-500/20 group-hover:scale-105 transition-transform">
                            {item.clientName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors flex items-center gap-1.5">
                              <span className="truncate">{item.clientName}</span>
                              <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-teal-600 shrink-0" />
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                              {item.projectTitle}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Total Contract Value */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          ₹{item.totalContractValue.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Total Value
                        </div>
                      </td>

                      {/* Payment Progress */}
                      <td className="py-3.5 px-3 min-w-[130px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{item.totalPaid.toLocaleString("en-IN")}
                            </span>
                            <span className="text-zinc-400">{progressPct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" 
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Next Due Tag */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getDueBadge(item.currentDueDate, item.status)}
                      </td>

                      {/* Next Installment Amount */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          ₹{item.currentInstallmentAmount.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Part #{item.currentInstallmentNumber} of {item.totalInstallments}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : item.status === "Overdue"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== "Paid" && (
                            <>
                              {item.clientPhone && (
                                <button
                                  type="button"
                                  onClick={(e) => handleWhatsAppClick(e, item)}
                                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                                  title="Send WhatsApp Reminder"
                                >
                                  <MessageCircle size={13} />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => handleReminderClick(e, item)}
                                disabled={sendingReminderId === item.id}
                                className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Send Email Reminder"
                              >
                                <Send size={12} />
                                <span>{sendingReminderId === item.id ? "Sending..." : "Reminder"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenRecordPayment(item, nextPendingSchedule)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Record Installment Payment"
                              >
                                <CheckCircle2 size={12} />
                                <span>Pay</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectInstallment(item)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="View Full Client & Installment Details"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
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
