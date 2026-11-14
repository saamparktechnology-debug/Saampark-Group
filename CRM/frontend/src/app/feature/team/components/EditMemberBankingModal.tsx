"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Building2, CreditCard, Save, QrCode, User, DollarSign, ShieldCheck } from "lucide-react"
import { TeamMemberPayoutProfile, TeamMemberBankingInfo } from "../types"
import { Button } from "@/components/ui/Button"

interface EditMemberBankingModalProps {
  isOpen: boolean
  profile: TeamMemberPayoutProfile | null
  onClose: () => void
  onSave: (memberId: string, data: Partial<TeamMemberBankingInfo>) => Promise<void>
}

export function EditMemberBankingModal({
  isOpen,
  profile,
  onClose,
  onSave,
}: EditMemberBankingModalProps) {
  const [bankName, setBankName] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [ifscCode, setIfscCode] = React.useState("")
  const [accountHolderName, setAccountHolderName] = React.useState("")
  const [upiId, setUpiId] = React.useState("")
  const [panNumber, setPanNumber] = React.useState("")
  const [baseSalary, setBaseSalary] = React.useState<number | "">("")
  const [notes, setNotes] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (profile) {
      const b = profile.bankingInfo || {}
      setBankName(b.bankName || "")
      setAccountNumber(b.accountNumber || "")
      setIfscCode(b.ifscCode || "")
      setAccountHolderName(b.accountHolderName || profile.name)
      setUpiId(b.upiId || "")
      setPanNumber(b.panNumber || "")
      setBaseSalary(profile.baseSalary || 0)
      setNotes(b.notes || "")
    }
  }, [profile])

  if (!isOpen || !profile) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(profile.id, {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        accountHolderName: accountHolderName.trim(),
        upiId: upiId.trim(),
        panNumber: panNumber.trim().toUpperCase(),
        baseSalary: typeof baseSalary === "number" ? baseSalary : 25000,
        notes: notes.trim(),
      })
      onClose()
    } catch (err) {
      console.error("Failed to save banking details:", err)
      alert("Could not update banking details. Please try again.")
    } finally {
      setIsSaving(false)
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
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <Building2 size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Team Member Banking & UPI Profile</h3>
                <p className="text-[11px] text-blue-100 truncate max-w-[300px]">
                  {profile.name} ({profile.role})
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
            {/* Base Salary */}
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/80 dark:border-blue-800/60">
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Fixed Monthly Base Salary (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-bold text-zinc-400">₹</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="25000"
                  className="w-full pl-7 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Fixed monthly retainer before task commissions and subscription shares.
              </p>
            </div>

            {/* Bank Account Details */}
            <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700/80">
              <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs flex items-center gap-1.5">
                <Building2 size={14} className="text-blue-600" />
                <span>Bank Account Information (NEFT / IMPS / RTGS)</span>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, ICICI Bank, State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="002105001234"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ICIC0000021"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono uppercase focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Official name matching bank records"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:outline-hidden"
                />
              </div>
            </div>

            {/* UPI & Digital Transfer */}
            <div className="space-y-3 p-4 bg-teal-50/40 dark:bg-teal-950/20 rounded-2xl border border-teal-200/80 dark:border-teal-800/60">
              <div className="font-bold text-teal-900 dark:text-teal-200 text-xs flex items-center gap-1.5">
                <QrCode size={14} className="text-teal-600" />
                <span>UPI ID & Digital VPA</span>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                  UPI ID (GPay / PhonePe / Paytm / BHIM)
                </label>
                <input
                  type="text"
                  placeholder="e.g. rahul@okhdfcbank or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                  PAN Number (Optional for TDS / Form 16)
                </label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono uppercase focus:outline-hidden"
                />
              </div>
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
                isLoading={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <Save size={14} className="mr-1.5" />
                Save Banking Profile
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
