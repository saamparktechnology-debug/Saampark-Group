"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { X, RefreshCw, Calendar, FileText, CheckCircle2, Sparkles } from "lucide-react"
import { Subscription } from "../types"
import { calculateNextCycleDate } from "../services/subscriptionService"

interface RenewSubscriptionModalProps {
  isOpen: boolean
  subscription: Subscription | null
  onClose: () => void
  onConfirm: (
    subscriptionId: string,
    nextDate: string,
    generateInvoice: boolean
  ) => Promise<void>
}

export function RenewSubscriptionModal({
  isOpen,
  subscription,
  onClose,
  onConfirm,
}: RenewSubscriptionModalProps) {
  const [nextDate, setNextDate] = React.useState("")
  const [generateInvoice, setGenerateInvoice] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (subscription) {
      const calculated = calculateNextCycleDate(
        subscription.nextBillingDate || new Date().toISOString(),
        subscription.billingCycle,
        subscription.customDaysCount
      )
      setNextDate(calculated)
      setGenerateInvoice(true)
    }
  }, [subscription])

  if (!isOpen || !subscription) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nextDate) {
      alert("Please specify the next billing date.")
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm(subscription.id, nextDate, generateInvoice)
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-blue-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <RefreshCw size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Renew Subscription Contract
              </h3>
              <p className="text-[11px] text-zinc-500">
                {subscription.clientName} • {subscription.planName}
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
          {/* Plan & Cycle Summary */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-1.5">
            <div className="font-bold text-zinc-900 dark:text-zinc-100">{subscription.planName}</div>
            <div className="flex items-center justify-between text-zinc-500 text-[11px]">
              <span>Recurring Cycle: <strong>{subscription.billingCycle}</strong></span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{subscription.amount}</span>
            </div>
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
              Next Renewal / Billing Date *
            </label>
            <input
              type="date"
              required
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-semibold text-zinc-900 dark:text-zinc-100"
            />
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Calculated automatically based on the contract's <strong>{subscription.billingCycle}</strong> period.
            </span>
          </div>

          {/* Auto-generate Invoice Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 cursor-pointer">
            <input
              type="checkbox"
              checked={generateInvoice}
              onChange={(e) => setGenerateInvoice(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                Auto-generate Tax Invoice for Renewal
              </span>
              <span className="text-[11px] text-zinc-500 block">
                Creates a new official GST / Tax Invoice in the Invoices section and marks it as pending collection.
              </span>
            </div>
          </label>

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
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} className={isSubmitting ? "animate-spin" : ""} />
              <span>{isSubmitting ? "Renewing..." : "Confirm & Renew Contract"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
