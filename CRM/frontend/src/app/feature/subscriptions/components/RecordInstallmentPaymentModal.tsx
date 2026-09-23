"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { X, CheckCircle2, DollarSign, CreditCard, Calendar, Building2 } from "lucide-react"
import { InstallmentItem, InstallmentScheduleItem } from "../types"

interface RecordInstallmentPaymentModalProps {
  isOpen: boolean
  installment: InstallmentItem | null
  scheduleItem: InstallmentScheduleItem | null
  onClose: () => void
  onConfirm: (
    installmentId: string,
    installmentNumber: number,
    amount: number,
    paymentMethod: string
  ) => Promise<void>
}

export function RecordInstallmentPaymentModal({
  isOpen,
  installment,
  scheduleItem,
  onClose,
  onConfirm,
}: RecordInstallmentPaymentModalProps) {
  const [amountPaid, setAmountPaid] = React.useState<number>(scheduleItem?.amount || 0)
  const [paymentMethod, setPaymentMethod] = React.useState<string>("UPI Transfer")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (scheduleItem) {
      setAmountPaid(scheduleItem.amount)
    }
  }, [scheduleItem])

  if (!isOpen || !installment || !scheduleItem) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (amountPaid <= 0) {
      alert("Please enter a valid payment amount.")
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm(
        installment.id,
        scheduleItem.installmentNumber,
        amountPaid,
        paymentMethod
      )
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Record Installment Payment
              </h3>
              <p className="text-[11px] text-zinc-500">
                Installment #{scheduleItem.installmentNumber} • {installment.clientName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Project & Milestone Info */}
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-1">
            <div className="font-bold text-zinc-800 dark:text-zinc-200">{installment.projectTitle}</div>
            <div className="text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Original Due: {scheduleItem.dueDate}</span>
              <span className="font-semibold text-teal-600">Expected: {scheduleItem.formattedAmount}</span>
            </div>
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
              Amount Received (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">₹</span>
              <input
                type="number"
                required
                min={1}
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-bold text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-medium"
            >
              <option value="UPI / QR Transfer">UPI / QR Code Transfer</option>
              <option value="NEFT / RTGS Bank Transfer">NEFT / RTGS Bank Transfer</option>
              <option value="Debit / Credit Card">Debit / Credit Card</option>
              <option value="Cash / Cheque">Cash / Cheque</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>{isSubmitting ? "Recording..." : "Confirm & Mark Paid"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
