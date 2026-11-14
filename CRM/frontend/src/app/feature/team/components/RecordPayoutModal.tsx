"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  CreditCard, 
  Building2, 
  QrCode, 
  Send, 
  CheckCircle2, 
  DollarSign, 
  Percent, 
  Sparkles, 
  ShieldCheck,
  Calendar,
  FileText
} from "lucide-react"
import { TeamMemberPayoutProfile, PaymentMethod, PayoutType, TeamPayoutRecord } from "../types"
import { recordTeamPayout, sendTeamPaymentReceiptEmail } from "../services/teamPaymentService"
import { Button } from "@/components/ui/Button"

interface RecordPayoutModalProps {
  isOpen: boolean
  profile: TeamMemberPayoutProfile | null
  initialAmount?: number
  initialProjectTitle?: string
  initialPayoutType?: PayoutType
  onClose: () => void
  onSuccess: (payout: TeamPayoutRecord) => void
}

export function RecordPayoutModal({
  isOpen,
  profile,
  initialAmount,
  initialProjectTitle,
  initialPayoutType,
  onClose,
  onSuccess,
}: RecordPayoutModalProps) {
  const currentPeriod = new Date().toLocaleString("en-US", { month: "long", year: "numeric" })
  const [period, setPeriod] = React.useState(currentPeriod)
  const [payoutType, setPayoutType] = React.useState<PayoutType>("Monthly Salary")
  
  const [baseAmount, setBaseAmount] = React.useState<number>(0)
  const [commissionAmount, setCommissionAmount] = React.useState<number>(0)
  const [bonus, setBonus] = React.useState<number | "">(0)
  const [deductions, setDeductions] = React.useState<number | "">(0)
  const [customAmount, setCustomAmount] = React.useState<number | "">("")
  
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("Bank IMPS/NEFT")
  const [transactionRef, setTransactionRef] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [sendEmailReceipt, setSendEmailReceipt] = React.useState(true)
  const [isProcessing, setIsProcessing] = React.useState(false)

  React.useEffect(() => {
    if (profile) {
      if (initialAmount && initialAmount > 0) {
        setCustomAmount(initialAmount)
        setPayoutType(initialPayoutType || (initialProjectTitle ? "Project Share / Milestone Payout" : "Custom Amount"))
        setPeriod(initialProjectTitle ? `Project: ${initialProjectTitle}` : currentPeriod)
        setNotes(initialProjectTitle ? `Project milestone share for "${initialProjectTitle}"` : `Custom payment to ${profile.name}`)
      } else {
        setBaseAmount(profile.baseSalary || 25000)
        setCommissionAmount(profile.subscriptionCommission || 0)
        setBonus(0)
        setDeductions(0)
        setCustomAmount(profile.remainingNeedToPay || "")
        setNotes(`Monthly payout for ${currentPeriod}`)
      }
      setTransactionRef(`TXN${Date.now().toString().slice(-8)}`)
    }
  }, [profile, currentPeriod, initialAmount, initialProjectTitle, initialPayoutType])

  if (!isOpen || !profile) return null

  const isDirectCustom = payoutType === "Custom Amount" || payoutType === "Project Share / Milestone Payout" || payoutType === "Custom Allowance"
  const bonusNum = typeof bonus === "number" ? bonus : 0
  const deductionsNum = typeof deductions === "number" ? deductions : 0
  const customNum = typeof customAmount === "number" ? customAmount : 0

  const netAmount = isDirectCustom 
    ? customNum 
    : Math.max(0, baseAmount + commissionAmount + bonusNum - deductionsNum)

  const b = profile.bankingInfo || {}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (netAmount <= 0) {
      alert("Net payout amount must be greater than zero.")
      return
    }

    setIsProcessing(true)
    try {
      const payoutRecord = await recordTeamPayout({
        memberId: profile.id,
        memberName: profile.name,
        memberEmail: profile.email,
        memberPhone: profile.phone,
        role: profile.role,
        department: profile.department,
        companyId: profile.companyId || "tech",
        branchId: profile.branchId,
        branchName: profile.branchName,
        subBranchId: profile.subBranchId,
        subbranchName: profile.subbranchName,
        period: period.trim(),
        payoutType,
        baseAmount: isDirectCustom ? 0 : baseAmount,
        commissionAmount: isDirectCustom ? 0 : commissionAmount,
        projectAmount: payoutType === "Project Share / Milestone Payout" ? netAmount : 0,
        projectTitle: initialProjectTitle || undefined,
        bonus: isDirectCustom ? 0 : bonusNum,
        deductions: isDirectCustom ? 0 : deductionsNum,
        netAmount,
        netAmountFormatted: `₹${netAmount.toLocaleString("en-IN")}`,
        paymentDate: new Date().toLocaleDateString("en-GB"),
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
        bankDetailsUsed: {
          bankName: b.bankName,
          accountNumber: b.accountNumber,
          ifscCode: b.ifscCode,
          accountHolderName: b.accountHolderName || profile.name,
          upiId: b.upiId,
        },
        status: "Completed",
        notes: notes.trim() || undefined,
        billedBy: "Admin",
      }, profile.companyId)

      // Send email if selected
      if (sendEmailReceipt && profile.email) {
        await sendTeamPaymentReceiptEmail(payoutRecord).catch(() => null)
      }

      onSuccess(payoutRecord)
      onClose()
    } catch (err) {
      console.error("Payout disbursement failed:", err)
      alert("Failed to record payout disbursement. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <CreditCard size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Disburse Team Member Payment</h3>
                <p className="text-[11px] text-emerald-100 truncate max-w-[320px]">
                  {profile.name} • {profile.department} ({profile.role})
                </p>
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

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
            {/* Period & Payout Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Payout Period / Cycle *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. August 2026"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Payout Category
                </label>
                <select
                  value={payoutType}
                  onChange={(e) => setPayoutType(e.target.value as PayoutType)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:outline-hidden"
                >
                  <option value="Monthly Salary">Monthly Salary + Commission</option>
                  <option value="Custom Amount">✨ Custom Payment Amount</option>
                  <option value="Project Share / Milestone Payout">🚀 Project Share / Milestone Payout</option>
                  <option value="Subscription Commission">Subscription Commission Only</option>
                  <option value="Bonus / Incentive">Bonus / Performance Incentive</option>
                  <option value="Advance">Salary Advance</option>
                  <option value="Full Settlement">Full Final Settlement</option>
                </select>
              </div>
            </div>

            {/* Direct Custom Amount Input (If Custom or Project Share) */}
            {isDirectCustom ? (
              <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <DollarSign size={14} className="text-purple-600 dark:text-purple-400" />
                    <span>Custom Payout Amount (₹) *</span>
                  </label>
                  {initialProjectTitle && (
                    <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded">
                      {initialProjectTitle}
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-base font-black text-purple-600 dark:text-purple-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Enter any custom amount, e.g. 5000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-base font-black bg-white dark:bg-zinc-900 border border-purple-300 dark:border-purple-700 rounded-xl text-purple-900 dark:text-purple-100 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <span>Official receipt voucher will be generated automatically upon submission.</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    Net: ₹{netAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ) : (
              /* Earnings Calculation Breakdown for Salary */
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 space-y-3">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs flex items-center justify-between">
                  <span>Itemized Earnings & Deductions Breakdown</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Calculated in real-time</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] text-zinc-500 font-semibold mb-1">
                      Base Salary (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={baseAmount}
                      onChange={(e) => setBaseAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] text-zinc-500 font-semibold mb-1">
                      Subscription Commission (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] text-zinc-500 font-semibold mb-1">
                      Performance Bonus (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={bonus === "" ? "" : bonus}
                      onChange={(e) => setBonus(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] text-zinc-500 font-semibold mb-1">
                      TDS / Deductions (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={deductions === "" ? "" : deductions}
                      onChange={(e) => setDeductions(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-rose-600"
                    />
                  </div>
                </div>

                {/* Net Payout Summary Card */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400">Total Net Disbursed Amount</div>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ₹{netAmount.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-400">
                    <div>Base: <strong>₹{baseAmount.toLocaleString("en-IN")}</strong></div>
                    <div>Commission: <strong>+₹{commissionAmount.toLocaleString("en-IN")}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Disbursement Payment Method *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "Bank IMPS/NEFT", label: "Bank IMPS", icon: Building2 },
                  { id: "UPI Transfer", label: "UPI / VPA", icon: QrCode },
                  { id: "Cash", label: "Cash", icon: DollarSign },
                  { id: "Cheque", label: "Cheque", icon: FileText },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold text-[11px] transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20"
                        : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                    }`}
                  >
                    <m.icon size={15} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bank / UPI Details Preview */}
            {paymentMethod === "Bank IMPS/NEFT" && (
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60 text-[11px] space-y-1">
                <div className="font-bold text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-1">
                  <Building2 size={12} />
                  <span>Target Bank Account:</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Bank: <strong>{b.bankName || "Not configured"}</strong></span>
                  <span>IFSC: <strong className="font-mono">{b.ifscCode || "N/A"}</strong></span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>A/C Number: <strong className="font-mono">{b.accountNumber || "N/A"}</strong></span>
                  <span>Holder: <strong>{b.accountHolderName || profile.name}</strong></span>
                </div>
              </div>
            )}

            {paymentMethod === "UPI Transfer" && (
              <div className="p-3.5 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800/60 text-center space-y-2">
                <div className="text-[11px] font-bold text-teal-900 dark:text-teal-200">
                  Scan UPI QR to pay ₹{netAmount.toLocaleString("en-IN")}
                </div>
                {b.upiId && (
                  <div className="w-28 h-28 mx-auto bg-white p-1.5 rounded-xl shadow-xs border border-teal-200 flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=${encodeURIComponent(b.upiId)}%26pn=${encodeURIComponent(profile.name)}%26am=${netAmount}%26cu=INR`} 
                      alt="UPI QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="font-mono text-xs font-bold text-teal-800 dark:text-teal-300">
                  UPI ID: {b.upiId || `${profile.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`}
                </div>
              </div>
            )}

            {/* Transaction Ref / UTR */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Transaction Reference / Bank UTR Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UTR49281940291 or UPI Ref #90219"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-xs focus:outline-hidden"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Payout Notes & Remarks
              </label>
              <input
                type="text"
                placeholder="Optional notes or milestone tags"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
              />
            </div>

            {/* Send Email Receipt Checkbox */}
            <div className="flex items-center gap-2 p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
              <input
                type="checkbox"
                id="sendReceiptEmail"
                checked={sendEmailReceipt}
                onChange={(e) => setSendEmailReceipt(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="sendReceiptEmail" className="font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer select-none text-[11px]">
                ✉️ Automatically dispatch official payment receipt to member's email (<strong>{profile.email}</strong>)
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="submit"
                isLoading={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <ShieldCheck size={14} className="mr-1.5" />
                Confirm & Disburse (₹{netAmount.toLocaleString("en-IN")})
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
