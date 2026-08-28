"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, User, Mail, Phone, Building2, Briefcase, Calendar, 
  CheckCircle2, Clock, AlertCircle, Send, MessageCircle, 
  CreditCard, FileText, Sparkles, ChevronRight, ArrowUpRight
} from "lucide-react"
import { InstallmentItem, InstallmentScheduleItem } from "../types"

interface ClientInstallmentDetailModalProps {
  isOpen: boolean
  installment: InstallmentItem | null
  onClose: () => void
  onSendReminder: (installmentId: string, installmentNumber?: number) => Promise<void>
  onRecordPayment: (installment: InstallmentItem, scheduleItem: InstallmentScheduleItem) => void
}

export function ClientInstallmentDetailModal({
  isOpen,
  installment,
  onClose,
  onSendReminder,
  onRecordPayment,
}: ClientInstallmentDetailModalProps) {
  const [isSendingReminder, setIsSendingReminder] = React.useState<number | "all" | null>(null)
  const [copiedLink, setCopiedLink] = React.useState(false)

  if (!isOpen || !installment) return null

  const progressPercent = installment.totalContractValue > 0
    ? Math.min(100, Math.round((installment.totalPaid / installment.totalContractValue) * 100))
    : 0

  const handleTriggerReminder = async (instNum?: number) => {
    setIsSendingReminder(instNum || "all")
    try {
      await onSendReminder(installment.id, instNum)
    } finally {
      setIsSendingReminder(null)
    }
  }

  const handleWhatsApp = (item?: InstallmentScheduleItem) => {
    const rawPhone = (installment.clientPhone || "").replace(/[^0-9]/g, "")
    const targetPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone
    const instNum = item ? item.installmentNumber : installment.currentInstallmentNumber
    const instAmt = item ? item.formattedAmount : `₹${installment.currentInstallmentAmount.toLocaleString("en-IN")}`
    const instDue = item ? item.dueDate : installment.currentDueDate

    const msg = `Hello ${installment.clientName}, this is a gentle reminder from SAAMPARK Group regarding Installment #${instNum} (${instAmt}) for "${installment.projectTitle}", due on ${instDue}. Thank you!`
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-teal-900/10 via-zinc-50 to-blue-900/10 dark:from-teal-950/40 dark:via-zinc-900 dark:to-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-lg border border-teal-500/30">
              💳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {installment.clientName}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  installment.status === "Paid"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                    : installment.status === "Overdue"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                }`}>
                  {installment.status}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Contract: <strong className="text-zinc-800 dark:text-zinc-200">{installment.projectTitle}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          
          {/* Client & Project Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client Profile Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <User size={13} className="text-teal-600" />
                <span>Client Profile</span>
              </div>
              <div className="space-y-1.5 text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <Building2 size={13} className="text-zinc-400 shrink-0" />
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{installment.clientCompany || installment.clientName}</span>
                </div>
                {installment.clientEmail && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-zinc-400 shrink-0" />
                    <span className="truncate">{installment.clientEmail}</span>
                  </div>
                )}
                {installment.clientPhone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-zinc-400 shrink-0" />
                    <span>{installment.clientPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Health Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CreditCard size={13} className="text-blue-600" />
                  <span>Payment Progress</span>
                </span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{progressPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-blue-600 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/60">
                  <div className="text-[10px] text-zinc-400">Total Contract</div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-0.5">
                    ₹{installment.totalContractValue.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Total Paid</div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-300 text-xs mt-0.5">
                    ₹{installment.totalPaid.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Remaining Due</div>
                  <div className="font-bold text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                    ₹{installment.remainingBalance.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complete Installment Breakdown Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                <Calendar size={14} className="text-teal-600" />
                <span>Installment Milestones & Schedule ({installment.schedule.length} Parts)</span>
              </h3>
              {installment.clientPhone && (
                <button
                  type="button"
                  onClick={() => handleWhatsApp()}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 font-bold flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp Reminder</span>
                </button>
              )}
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {installment.schedule.map((item) => {
                const isPaid = item.status === "Paid"
                const isOverdue = item.status === "Overdue"

                return (
                  <div
                    key={item.installmentNumber}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isPaid 
                        ? "bg-white dark:bg-zinc-900/50 opacity-90" 
                        : isOverdue 
                          ? "bg-rose-50/40 dark:bg-rose-950/20" 
                          : "bg-zinc-50/70 dark:bg-zinc-800/40"
                    }`}
                  >
                    {/* Left details */}
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isPaid
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : isOverdue
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                      }`}>
                        #{item.installmentNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                            Installment {item.installmentNumber} of {installment.totalInstallments}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                              : isOverdue
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                          <span>Due: <strong className="text-zinc-700 dark:text-zinc-300">{item.dueDate}</strong></span>
                          {item.paidDate && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              • Paid on {item.paidDate} {item.paymentMethod ? `via ${item.paymentMethod}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-11 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {item.formattedAmount}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {isPaid ? "Received" : "Pending Collection"}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isPaid && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleTriggerReminder(item.installmentNumber)}
                              disabled={isSendingReminder === item.installmentNumber}
                              className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                              title="Send Email Reminder"
                            >
                              <Send size={12} />
                              <span>{isSendingReminder === item.installmentNumber ? "Sending..." : "Reminder"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onRecordPayment(installment, item)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 text-[11px] shadow-sm cursor-pointer"
                            >
                              <CheckCircle2 size={13} />
                              <span>Mark Paid</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Notice Info */}
          <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40 flex items-start gap-2.5">
            <Sparkles size={16} className="text-teal-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-teal-900 dark:text-teal-300 leading-relaxed">
              Recording payment marks this installment as paid, updates the client's live balance, and updates the project financial status in real-time.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleTriggerReminder()}
            disabled={isSendingReminder === "all"}
            className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 text-xs shadow-md shadow-teal-500/20 cursor-pointer"
          >
            <Send size={13} />
            <span>{isSendingReminder === "all" ? "Sending Reminders..." : "Send Overall Due Statement"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
