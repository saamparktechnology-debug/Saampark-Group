"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Receipt, Eye, Send, CreditCard, Building2, Calendar, CheckCircle2 } from "lucide-react"
import { TeamMemberPayoutProfile, TeamPayoutRecord } from "../types"
import { getPayoutRecords } from "../services/teamPaymentService"
import { Button } from "@/components/ui/Button"

interface MemberPayoutLedgerModalProps {
  isOpen: boolean
  profile: TeamMemberPayoutProfile | null
  onClose: () => void
  onViewReceipt: (payout: TeamPayoutRecord) => void
  onPayNow: (profile: TeamMemberPayoutProfile) => void
}

export function MemberPayoutLedgerModal({
  isOpen,
  profile,
  onClose,
  onViewReceipt,
  onPayNow,
}: MemberPayoutLedgerModalProps) {
  const [records, setRecords] = React.useState<TeamPayoutRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (isOpen && profile) {
      setIsLoading(true)
      getPayoutRecords(profile.companyId)
        .then((all) => {
          const filtered = all.filter(
            p => String(p.memberId).toLowerCase().trim() === String(profile.id).toLowerCase().trim() ||
                 (p.memberEmail && p.memberEmail.toLowerCase().trim() === profile.email.toLowerCase().trim())
          )
          setRecords(filtered)
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, profile])

  if (!isOpen || !profile) return null

  const totalPaidHistory = records.reduce((sum, r) => sum + (r.netAmount || 0), 0)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/80"
              />
              <div>
                <h3 className="font-bold text-sm">{profile.name} — Payout Ledger</h3>
                <p className="text-[11px] text-blue-100">{profile.role} • {profile.department}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-white/70 hover:text-white rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700/80">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Total Lifetime Paid</div>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₹{totalPaidHistory.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{records.length} Disbursements</div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700/80">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Current Month Need To Pay</div>
                <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  ₹{profile.remainingNeedToPay.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Status: <strong>{profile.payoutStatus}</strong>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Monthly Structure</div>
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                    ₹{profile.baseSalary.toLocaleString("en-IN")} Base
                  </div>
                </div>
                {profile.payoutStatus !== "Paid" && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onPayNow(profile)
                    }}
                    className="mt-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                  >
                    💰 Disburse Now
                  </button>
                )}
              </div>
            </div>

            {/* Payout Records Table */}
            <div>
              <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs mb-2">
                Disbursement Vouchers & Historical Records ({records.length})
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  Loading payment history...
                </div>
              ) : records.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 text-zinc-500">
                  No payment disbursements recorded yet for this member.
                </div>
              ) : (
                <div className="border border-zinc-200 dark:border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full">
                    <thead className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Voucher #</th>
                        <th className="py-2.5 px-3 text-left">Date</th>
                        <th className="py-2.5 px-3 text-left">Period & Type</th>
                        <th className="py-2.5 px-3 text-left">Method</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700/60 text-[11px]">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {r.id}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-500 font-medium">
                            {r.paymentDate}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-zinc-800 dark:text-zinc-200">{r.period}</div>
                            <div className="text-[10px] text-zinc-400">{r.payoutType}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[10px]">
                              {r.paymentMethod}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                            ₹{r.netAmount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => onViewReceipt(r)}
                              className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Eye size={11} />
                              <span>Voucher</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
