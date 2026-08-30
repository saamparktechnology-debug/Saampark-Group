"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Edit, 
  Save, 
  User, 
  Percent, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  ShieldCheck,
  Building2,
  Sparkles,
  Clock
} from "lucide-react"
import { Subscription, BillingCycle, calculateTeamRevenueShare } from "../types"
import { Button } from "@/components/ui/Button"

interface EditSubscriptionModalProps {
  isOpen: boolean
  subscription: Subscription | null
  onClose: () => void
  onSave: (id: string, updates: Partial<Subscription>) => Promise<void>
  teamMembers?: { id: string; name: string; email: string; role?: string }[]
}

export function EditSubscriptionModal({
  isOpen,
  subscription,
  onClose,
  onSave,
  teamMembers = []
}: EditSubscriptionModalProps) {
  const [planName, setPlanName] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("Monthly")
  const [customDaysCount, setCustomDaysCount] = React.useState<number>(30)
  const [taxType, setTaxType] = React.useState<"gst" | "nongst">("gst")
  const [dailyLateFee, setDailyLateFee] = React.useState<number | "">(0)
  const [nextBillingDate, setNextBillingDate] = React.useState("")
  const [autoRenew, setAutoRenew] = React.useState(true)
  const [status, setStatus] = React.useState<any>("Active")
  
  // Assigned Team Member & Commission %
  const [assignedMemberEmail, setAssignedMemberEmail] = React.useState("")
  const [teamSharePercentage, setTeamSharePercentage] = React.useState<number | "">(10)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (subscription) {
      setPlanName(subscription.planName || "")
      const numAmt = subscription.numericAmount || parseInt(String(subscription.amount).replace(/[^0-9]/g, "")) || 0
      setAmount(String(numAmt))
      setBillingCycle(subscription.billingCycle || "Monthly")
      setCustomDaysCount(subscription.customDaysCount || 30)
      setTaxType(subscription.isNonGst || subscription.taxType === "nongst" || subscription.gstRate === 0 ? "nongst" : "gst")
      setDailyLateFee(subscription.dailyLateFee !== undefined ? subscription.dailyLateFee : 0)
      setNextBillingDate(subscription.nextBillingDate || "")
      setAutoRenew(subscription.autoRenew !== false)
      setStatus(subscription.status || "Active")
      
      const assigned = subscription.assignedMemberEmail || (subscription.assignedMembers && subscription.assignedMembers[0]) || ""
      setAssignedMemberEmail(assigned)
      setTeamSharePercentage(subscription.teamSharePercentage !== undefined ? subscription.teamSharePercentage : 10)
    }
  }, [subscription])

  if (!isOpen || !subscription) return null

  // Calculate live preview of team member revenue share
  const numericAmt = parseInt(amount.replace(/[^0-9]/g, "")) || 0
  const pct = typeof teamSharePercentage === "number" ? teamSharePercentage : 0
  const cycleCut = Math.round((numericAmt * pct) / 100)
  let monthlyCut = cycleCut
  const cycleStr = String(billingCycle || "").toLowerCase()
  if (cycleStr.includes("quarter")) monthlyCut = Math.round(cycleCut / 3)
  else if (cycleStr.includes("half") || cycleStr.includes("semi")) monthlyCut = Math.round(cycleCut / 6)
  else if (cycleStr.includes("annual") || cycleStr.includes("year")) monthlyCut = Math.round(cycleCut / 12)
  else if (cycleStr.includes("week")) monthlyCut = Math.round(cycleCut * 4.33)
  else if (billingCycle === "Custom Days" && customDaysCount) {
    monthlyCut = Math.round((cycleCut / Math.max(1, customDaysCount)) * 30)
  }

  const dailyCut = Math.round(monthlyCut / 30)
  const weeklyCut = Math.round(monthlyCut / 4.33)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planName.trim()) {
      alert("Plan name is required.")
      return
    }
    if (!amount.trim() || numericAmt <= 0) {
      alert("Valid subscription amount is required.")
      return
    }

    setIsSaving(true)
    try {
      const selectedMemberObj = teamMembers.find(m => m.email.toLowerCase() === assignedMemberEmail.toLowerCase())
      const isNonGst = taxType === "nongst"
      const formattedAmount = `₹${numericAmt.toLocaleString("en-IN")}`

      await onSave(subscription.id, {
        planName: planName.trim(),
        amount: formattedAmount,
        numericAmount: numericAmt,
        billingCycle,
        customDaysCount: billingCycle === "Custom Days" ? customDaysCount : undefined,
        isNonGst,
        taxType,
        gstRate: isNonGst ? 0 : 18,
        dailyLateFee: typeof dailyLateFee === "number" ? dailyLateFee : 0,
        nextBillingDate: nextBillingDate.trim(),
        autoRenew,
        status,
        assignedMemberId: selectedMemberObj?.id,
        assignedMemberName: selectedMemberObj?.name,
        assignedMemberEmail: assignedMemberEmail || undefined,
        assignedMembers: assignedMemberEmail ? [assignedMemberEmail] : [],
        teamSharePercentage: pct,
      })
      onClose()
    } catch (err) {
      console.error("Error updating subscription:", err)
      alert("Failed to update subscription. Please try again.")
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
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-8"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <Edit size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Modify Subscription Contract</h3>
                <p className="text-[11px] text-blue-100 truncate max-w-[320px]">
                  {subscription.clientName} • #{subscription.id}
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
            {/* Subscriber & Plan Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Subscriber Client (Readonly)
                </label>
                <input
                  type="text"
                  disabled
                  value={`${subscription.clientName} (${subscription.clientCompany || 'Client'})`}
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Plan / Retainer Title *
                </label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Price & Billing Cycle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Recurring Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Billing Cycle
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-medium"
                >
                  <option value="Weekly">Weekly (Every 7 Days)</option>
                  <option value="Monthly">Monthly (Every 30 Days)</option>
                  <option value="Quarterly">Quarterly (Every 3 Months)</option>
                  <option value="Semi-Annual">Semi-Annual (Every 6 Months)</option>
                  <option value="Annual">Annual (Every Year)</option>
                  <option value="Custom Days">Custom Days Interval</option>
                </select>
              </div>
            </div>

            {billingCycle === "Custom Days" && (
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Interval Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDaysCount}
                  onChange={(e) => setCustomDaysCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                />
              </div>
            )}

            {/* Tax Mode (GST vs Non-GST) */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 space-y-2">
              <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                Tax Configuration:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTaxType("gst")}
                  className={`p-2 rounded-xl border flex flex-col items-center text-center gap-0.5 transition-all cursor-pointer ${
                    taxType === "gst"
                      ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200 ring-2 ring-teal-500/20 font-bold"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <span className="text-xs">🏢 GST Tax Plan</span>
                  <span className="text-[9.5px] opacity-75">18% GST Added to Invoices</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTaxType("nongst")}
                  className={`p-2 rounded-xl border flex flex-col items-center text-center gap-0.5 transition-all cursor-pointer ${
                    taxType === "nongst"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-800 dark:text-blue-200 ring-2 ring-blue-500/20 font-bold"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <span className="text-xs">📄 Non-GST Plan</span>
                  <span className="text-[9.5px] opacity-75">0% GST / Pure Service</span>
                </button>
              </div>
            </div>

            {/* Daily Late Fee (₹/day) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-700 dark:text-zinc-300 font-semibold">
                  Overdue Daily Late Fee / Added Charge (₹/day)
                </label>
                <span className="text-[10px] text-zinc-400">Charged each day past due</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (e.g. 50 / day)"
                  value={dailyLateFee === "" ? "" : dailyLateFee}
                  onChange={(e) => setDailyLateFee(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:outline-hidden"
                />
              </div>
            </div>

            {/* ── ASSIGNED TEAM MEMBER & REVENUE SHARE % ── */}
            <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 dark:from-indigo-950/30 dark:to-blue-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                <User size={15} />
                <span>Assign Team Member & Revenue Share Commission</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Assigned Managing Team Member
                  </label>
                  <select
                    value={assignedMemberEmail}
                    onChange={(e) => setAssignedMemberEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-medium"
                  >
                    <option value="">-- No Team Member Assigned --</option>
                    {teamMembers.map(m => (
                      <option key={m.email} value={m.email}>
                        {m.name} ({m.role || 'Team Member'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Team Member Revenue Share (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="10"
                      value={teamSharePercentage === "" ? "" : teamSharePercentage}
                      onChange={(e) => setTeamSharePercentage(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3 pr-8 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold focus:outline-hidden"
                    />
                    <span className="absolute right-3 top-2.5 text-zinc-400 font-bold text-xs">%</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Revenue Share Preview Card */}
              {pct > 0 && assignedMemberEmail && (
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Sparkles size={11} />
                      <span>Calculated Member Earnings ({pct}% Share)</span>
                    </div>
                    <div className="text-sm font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                      ₹{monthlyCut.toLocaleString("en-IN")} / month
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-500">
                    <div>Daily: <strong>₹{dailyCut.toLocaleString("en-IN")}/day</strong></div>
                    <div>Weekly: <strong>₹{weeklyCut.toLocaleString("en-IN")}/wk</strong></div>
                    <div>Per Cycle: <strong>₹{cycleCut.toLocaleString("en-IN")}</strong></div>
                  </div>
                </div>
              )}
            </div>

            {/* Next Billing Date & Auto-Renew & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Next Renewal Date
                </label>
                <input
                  type="date"
                  value={nextBillingDate}
                  onChange={(e) => setNextBillingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Auto-Renewal
                </label>
                <select
                  value={autoRenew ? "yes" : "no"}
                  onChange={(e) => setAutoRenew(e.target.value === "yes")}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium"
                >
                  <option value="yes">Enabled (Automatic)</option>
                  <option value="no">Disabled (Manual)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
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
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
