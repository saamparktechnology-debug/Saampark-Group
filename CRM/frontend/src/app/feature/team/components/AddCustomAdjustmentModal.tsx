"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Sparkles, 
  DollarSign, 
  ShieldCheck, 
  User, 
  Layers,
  Save
} from "lucide-react"
import { 
  TeamMemberPayoutProfile, 
  CustomAdjustmentCategory, 
  CustomPaymentAdjustment 
} from "../types"
import { addCustomAdjustment } from "../services/teamPaymentService"
import { Button } from "@/components/ui/Button"

interface AddCustomAdjustmentModalProps {
  isOpen: boolean
  profiles: TeamMemberPayoutProfile[]
  onClose: () => void
  onSuccess: (adjustment: CustomPaymentAdjustment) => void
}

export function AddCustomAdjustmentModal({
  isOpen,
  profiles,
  onClose,
  onSuccess,
}: AddCustomAdjustmentModalProps) {
  const [selectedMemberId, setSelectedMemberId] = React.useState("")
  const [category, setCategory] = React.useState<CustomAdjustmentCategory>("Performance Bonus")
  const [type, setType] = React.useState<"Credit" | "Debit">("Credit")
  const [amount, setAmount] = React.useState<number | "">(5000)
  const [description, setDescription] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (profiles.length > 0 && !selectedMemberId) {
      setSelectedMemberId(profiles[0].id)
    }
  }, [profiles, selectedMemberId])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const member = profiles.find(p => String(p.id) === String(selectedMemberId)) || profiles[0]
    if (!member) {
      alert("Please select a team member.")
      return
    }

    const numAmt = typeof amount === "number" ? amount : 0
    if (numAmt <= 0) {
      alert("Please enter a valid amount.")
      return
    }

    setIsSaving(true)
    try {
      const adj = await addCustomAdjustment({
        memberId: member.id,
        memberName: member.name,
        memberEmail: member.email,
        role: member.role,
        department: member.department,
        category,
        type,
        amount: numAmt,
        description: description.trim() || `${category} recorded for ${member.name}`,
        status: "Approved",
        companyId: member.companyId || "tech",
        branchId: member.branchId,
        branchName: member.branchName,
      }, member.companyId)

      onSuccess(adj)
      onClose()
    } catch (err) {
      console.error("Failed to add custom adjustment:", err)
      alert("Failed to save custom compensation item.")
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
          <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Add Custom Compensation / Allowance</h3>
                <p className="text-[11px] text-amber-100">
                  Reimbursements, Bonuses, Advances & Special Allowances
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
            {/* Target Member */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Target Team Member *
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:outline-hidden text-xs"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role} • {p.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Compensation Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CustomAdjustmentCategory)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:outline-hidden text-xs"
              >
                <option value="Performance Bonus">🌟 Performance Bonus / Milestone Reward</option>
                <option value="Travel Reimbursement">🚗 Travel & Fuel Expense Reimbursement</option>
                <option value="Tech & Hardware Allowance">💻 Tech, Internet & Hardware Allowance</option>
                <option value="Salary Advance">💸 Salary Advance</option>
                <option value="Overtime & Weekend Delivery">⏱️ Overtime & Weekend Delivery Payout</option>
                <option value="Daily Calling Incentive">📞 Telecalling & Lead Conversion Bonus</option>
                <option value="Custom Credit">➕ Custom Credit Adjustment</option>
                <option value="Custom Deduction">➖ Custom Deduction / Penalty</option>
              </select>
            </div>

            {/* Type & Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Adjustment Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "Credit" | "Debit")}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold focus:outline-hidden text-xs"
                >
                  <option value="Credit">➕ Credit (Addition to Pay)</option>
                  <option value="Debit">➖ Debit (Deduction)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Reason / Description */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Description / Approval Reason *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain the milestone, project, or expense receipts verified for this adjustment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden resize-none"
              />
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
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                <Save size={14} className="mr-1.5" />
                Record Adjustment
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
