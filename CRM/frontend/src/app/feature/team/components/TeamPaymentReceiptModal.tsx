"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Printer, Send, CheckCircle2, Building2, CreditCard, ShieldCheck } from "lucide-react"
import { TeamPayoutRecord } from "../types"
import { sendTeamPaymentReceiptEmail } from "../services/teamPaymentService"
import { Button } from "@/components/ui/Button"

interface TeamPaymentReceiptModalProps {
  isOpen: boolean
  payout: TeamPayoutRecord | null
  onClose: () => void
}

export function TeamPaymentReceiptModal({
  isOpen,
  payout,
  onClose,
}: TeamPaymentReceiptModalProps) {
  const [isSendingEmail, setIsSendingEmail] = React.useState(false)
  const [emailStatus, setEmailStatus] = React.useState<string | null>(null)

  if (!isOpen || !payout) return null

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    setEmailStatus(null)
    try {
      const res = await sendTeamPaymentReceiptEmail(payout)
      setEmailStatus(res.success ? "✅ Receipt sent successfully!" : "❌ Failed to send receipt.")
    } catch {
      setEmailStatus("❌ Failed to send receipt.")
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 print:border-none print:shadow-none print:my-0 print:max-w-none"
        >
          {/* Header Action Bar (Hidden on Print) */}
          <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Official Payout Voucher</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                {payout.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handlePrint} leftIcon={<Printer size={13} />}>
                Print Voucher
              </Button>
              <Button 
                size="sm" 
                onClick={handleSendEmail} 
                isLoading={isSendingEmail} 
                leftIcon={<Send size={13} />}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Send to Email
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer ml-2"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {emailStatus && (
            <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold print:hidden">
              {emailStatus}
            </div>
          )}

          {/* Printable Voucher Paper */}
          <div className="p-8 space-y-6 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 print:p-6 print:text-black">
            {/* Header: Company & Voucher Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-700 pb-6">
              <div>
                <div className="text-xl font-black tracking-tight text-blue-600 dark:text-blue-400 print:text-black">
                  SAAMPARK GROUP
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  Saampark Technology Pvt. Ltd. • Corporate HR & Payroll
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Location: {payout.branchName || "HQ / Central Office"}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs uppercase tracking-wider font-bold text-zinc-400">Payment Voucher</div>
                <div className="text-lg font-black font-mono mt-0.5">{payout.id}</div>
                <div className="text-xs text-zinc-500">Date: {payout.paymentDate}</div>
                <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] uppercase">
                  ✓ {payout.status}
                </div>
              </div>
            </div>

            {/* Member & Payment Method Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 text-xs">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Beneficiary Member</div>
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{payout.memberName}</div>
                <div className="text-zinc-500">{payout.role || "Team Member"} • {payout.department || "Operations"}</div>
                <div className="text-zinc-500 font-mono text-[11px] mt-0.5">{payout.memberEmail}</div>
              </div>

              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Payment Method & Account</div>
                <div className="font-bold text-zinc-900 dark:text-zinc-100">{payout.paymentMethod}</div>
                {payout.transactionRef && (
                  <div className="text-zinc-500 font-mono text-[11px]">UTR / Ref: <strong>{payout.transactionRef}</strong></div>
                )}
                {payout.bankDetailsUsed?.accountNumber && (
                  <div className="text-zinc-500 text-[11px]">
                    {payout.bankDetailsUsed.bankName || 'Bank'} (A/C: {payout.bankDetailsUsed.accountNumber})
                  </div>
                )}
                {payout.bankDetailsUsed?.upiId && (
                  <div className="text-zinc-500 font-mono text-[11px]">UPI: {payout.bankDetailsUsed.upiId}</div>
                )}
              </div>
            </div>

            {/* Period Details */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-zinc-500">Disbursement Cycle / Period:</span>
              <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{payout.period} ({payout.payoutType})</strong>
            </div>

            {/* Itemized Table */}
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Earnings & Compensations</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
                  <tr>
                    <td className="py-2.5 px-4">Fixed Base Salary</td>
                    <td className="py-2.5 px-4 text-right font-medium">₹{payout.baseAmount.toLocaleString("en-IN")}</td>
                  </tr>
                  {payout.commissionAmount > 0 && (
                    <tr>
                      <td className="py-2.5 px-4">Subscription Portfolio Revenue Share / Commission</td>
                      <td className="py-2.5 px-4 text-right font-medium text-indigo-600 dark:text-indigo-400">
                        +₹{payout.commissionAmount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  )}
                  {Boolean(payout.bonus) && payout.bonus! > 0 && (
                    <tr>
                      <td className="py-2.5 px-4">Performance Incentive / Bonus</td>
                      <td className="py-2.5 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        +₹{payout.bonus!.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  )}
                  {Boolean(payout.deductions) && payout.deductions! > 0 && (
                    <tr>
                      <td className="py-2.5 px-4">TDS / Advance Deductions</td>
                      <td className="py-2.5 px-4 text-right font-medium text-rose-600 dark:text-rose-400">
                        -₹{payout.deductions!.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-zinc-50/80 dark:bg-zinc-800/40 font-bold text-sm">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">Total Net Amount Disbursed</td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-black">
                      ₹{payout.netAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes */}
            {payout.notes && (
              <div className="text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
                <strong>Notes:</strong> {payout.notes}
              </div>
            )}

            {/* Footer Signatures */}
            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 gap-6 text-center text-xs text-zinc-400">
              <div>
                <div className="h-10"></div>
                <div className="border-t border-zinc-300 dark:border-zinc-600 pt-1 font-semibold text-zinc-600 dark:text-zinc-300">
                  Authorized Signatory (Finance / HR)
                </div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="border-t border-zinc-300 dark:border-zinc-600 pt-1 font-semibold text-zinc-600 dark:text-zinc-300">
                  Beneficiary Acknowledgement
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
