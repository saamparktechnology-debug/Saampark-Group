"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  CreditCard, 
  Building2, 
  QrCode, 
  DollarSign, 
  ShieldCheck, 
  FolderGit2,
  FileText
} from "lucide-react"
import { ProjectUserEarningsRecord, PaymentMethod, TeamPayoutRecord } from "../types"
import { recordTeamPayout, sendTeamPaymentReceiptEmail, getTeamBankingMap } from "../services/teamPaymentService"
import { Button } from "@/components/ui/Button"

interface DisburseProjectShareModalProps {
  isOpen: boolean
  earningsRecord: ProjectUserEarningsRecord | null
  onClose: () => void
  onSuccess: (payout: TeamPayoutRecord) => void
}

export function DisburseProjectShareModal({
  isOpen,
  earningsRecord,
  onClose,
  onSuccess,
}: DisburseProjectShareModalProps) {
  const [disburseAmount, setDisburseAmount] = React.useState<number>(0)
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("Bank IMPS/NEFT")
  const [transactionRef, setTransactionRef] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [sendEmailReceipt, setSendEmailReceipt] = React.useState(true)
  const [bankingDetails, setBankingDetails] = React.useState<any>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)

  React.useEffect(() => {
    if (earningsRecord) {
      setDisburseAmount(earningsRecord.memberPendingAmount || earningsRecord.memberTotalEarned || 5000)
      setTransactionRef(`TXN${Date.now().toString().slice(-8)}`)
      setNotes(`Project Milestone Share for "${earningsRecord.projectTitle}" (${earningsRecord.memberSharePercentage}% Share)`)

      getTeamBankingMap(earningsRecord.companyId).then((map) => {
        const b = map[earningsRecord.memberId.toLowerCase()] || map[earningsRecord.memberEmail.toLowerCase()]
        setBankingDetails(b || null)
      })
    }
  }, [earningsRecord])

  if (!isOpen || !earningsRecord) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disburseAmount <= 0) {
      alert("Disbursement amount must be greater than zero.")
      return
    }

    setIsProcessing(true)
    try {
      const payout = await recordTeamPayout({
        memberId: earningsRecord.memberId,
        memberName: earningsRecord.memberName,
        memberEmail: earningsRecord.memberEmail,
        role: earningsRecord.memberRole,
        companyId: earningsRecord.companyId || "tech",
        branchId: earningsRecord.branchId,
        branchName: earningsRecord.branchName,
        subBranchId: earningsRecord.subBranchId,
        subbranchName: earningsRecord.subbranchName,
        period: `Project: ${earningsRecord.projectTitle}`,
        payoutType: "Project Share / Milestone Payout",
        baseAmount: 0,
        commissionAmount: 0,
        projectAmount: disburseAmount,
        netAmount: disburseAmount,
        netAmountFormatted: `₹${disburseAmount.toLocaleString("en-IN")}`,
        paymentDate: new Date().toLocaleDateString("en-GB"),
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
        projectId: earningsRecord.projectId,
        projectTitle: earningsRecord.projectTitle,
        bankDetailsUsed: bankingDetails ? {
          bankName: bankingDetails.bankName,
          accountNumber: bankingDetails.accountNumber,
          ifscCode: bankingDetails.ifscCode,
          accountHolderName: bankingDetails.accountHolderName || earningsRecord.memberName,
          upiId: bankingDetails.upiId,
        } : undefined,
        status: "Completed",
        notes: notes.trim() || undefined,
        billedBy: "Admin",
      }, earningsRecord.companyId)

      if (sendEmailReceipt && earningsRecord.memberEmail) {
        await sendTeamPaymentReceiptEmail(payout).catch(() => null)
      }

      onSuccess(payout)
      onClose()
    } catch (err) {
      console.error("Failed to disburse project earnings:", err)
      alert("Disbursement failed. Please try again.")
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
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <FolderGit2 size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Disburse Project Earnings Share</h3>
                <p className="text-[11px] text-purple-100 truncate max-w-[300px]">
                  {earningsRecord.memberName} • {earningsRecord.projectTitle}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
            {/* Project Summary Card */}
            <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Project:</span>
                <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{earningsRecord.projectTitle}</strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Client:</span>
                <strong className="text-zinc-800 dark:text-zinc-200">{earningsRecord.clientName}</strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Member Commission Rate:</span>
                <strong className="text-purple-600 dark:text-purple-400 font-black">{earningsRecord.memberSharePercentage}% Share</strong>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-purple-200/60 dark:border-purple-800/40">
                <span className="text-zinc-500">Total Earned so far:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">₹{earningsRecord.memberTotalEarned.toLocaleString("en-IN")}</strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Already Disbursed:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">₹{earningsRecord.memberPaidAmount.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            {/* Disbursement Amount */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Disbursement Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-400 font-bold">₹</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-black text-base text-purple-600 dark:text-purple-400 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Payment Method *
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
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-bold text-[10.5px] transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-800 dark:text-purple-200 ring-2 ring-purple-500/20"
                        : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                    }`}
                  >
                    <m.icon size={14} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bank / UPI Details info */}
            {bankingDetails && paymentMethod === "Bank IMPS/NEFT" && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[11px] space-y-0.5">
                <div className="text-zinc-500">Bank: <strong>{bankingDetails.bankName}</strong> • A/C: <strong className="font-mono">{bankingDetails.accountNumber}</strong></div>
                <div className="text-zinc-500">IFSC: <strong className="font-mono">{bankingDetails.ifscCode}</strong> • Holder: <strong>{bankingDetails.accountHolderName || earningsRecord.memberName}</strong></div>
              </div>
            )}

            {bankingDetails?.upiId && paymentMethod === "UPI Transfer" && (
              <div className="p-3 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800/60 text-center space-y-1">
                <div className="text-[11px] font-bold text-teal-900 dark:text-teal-200">
                  UPI ID: <span className="font-mono">{bankingDetails.upiId}</span>
                </div>
              </div>
            )}

            {/* Transaction Ref */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Transaction Ref / Bank UTR Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UTR49281940291"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-xs focus:outline-hidden"
              />
            </div>

            {/* Email dispatch */}
            <div className="flex items-center gap-2 p-2.5 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/60">
              <input
                type="checkbox"
                id="sendProjectReceipt"
                checked={sendEmailReceipt}
                onChange={(e) => setSendEmailReceipt(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="sendProjectReceipt" className="font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer select-none text-[11px]">
                ✉️ Send project payout receipt to <strong>{earningsRecord.memberEmail}</strong>
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
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                <ShieldCheck size={14} className="mr-1.5" />
                Disburse ₹{disburseAmount.toLocaleString("en-IN")}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
