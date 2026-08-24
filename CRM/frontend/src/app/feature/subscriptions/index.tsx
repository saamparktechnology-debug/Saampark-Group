"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Download, Filter, CreditCard, X, Send, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { Subscription } from "./types"
import { getSubscriptions, addSubscription, deleteSubscription } from "./services/subscriptionService"
import { SubscriptionList } from "./components/SubscriptionList"
import { getClients } from "@/app/feature/clients/services/clientService"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"

export default function SubscriptionsMain() {
  const { activeCompanyId, user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAddSubscription = canPerformAction(user, "Subscriptions", "add")
  const canDeleteSubscription = canPerformAction(user, "Subscriptions", "delete")

  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Form State
  const [clientName, setClientName] = React.useState("")
  const [planName, setPlanName] = React.useState("Enterprise Cloud ERP Maintenance")
  const [amount, setAmount] = React.useState("25000")
  const [billingCycle, setBillingCycle] = React.useState<"Monthly" | "Quarterly" | "Annually">("Monthly")
  const [nextBillingDate, setNextBillingDate] = React.useState("")
  const [availableClients, setAvailableClients] = React.useState<{ name: string; email: string }[]>([])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadSubs = React.useCallback(async () => {
    const data = await getSubscriptions(activeCompanyId || "tech")
    setSubscriptions(data)
  }, [activeCompanyId])

  React.useEffect(() => {
    loadSubs()
    const interval = setInterval(loadSubs, 4000)
    return () => clearInterval(interval)
  }, [loadSubs])

  React.useEffect(() => {
    if (isAddModalOpen) {
      getClients().then((cList) => {
        setAvailableClients(cList.map(c => ({ name: c.name, email: c.email || "" })))
        if (cList.length > 0 && !clientName) {
          setClientName(cList[0].name)
        }
      }).catch(() => {})
    }
  }, [isAddModalOpen, clientName])

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim() || !planName.trim() || !amount.trim()) {
      alert("Please fill in client, plan, and recurring amount.")
      return
    }

    const numAmount = parseInt(amount.replace(/[^0-9]/g, "")) || 0
    const formattedAmount = `₹${numAmount.toLocaleString("en-IN")}`

    const nextDate = nextBillingDate || new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB")

    await addSubscription({
      clientName,
      planName,
      status: "Active",
      amount: formattedAmount,
      billingCycle,
      nextBillingDate: nextDate,
    })

    showToast(`✅ Recurring subscription created for ${clientName}!`)
    setIsAddModalOpen(false)
    loadSubs()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Cancel and remove this recurring subscription?")) {
      await deleteSubscription(id)
      setSubscriptions((prev) => prev.filter((s) => s.id !== id))
      showToast("Subscription removed.")
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-[99999] bg-zinc-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-zinc-700"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <CreditCard className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Recurring Subscriptions</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage recurring retainer contracts, maintenance retainers, and automated billing cycles for {activeCompanyId === "digital" ? "SAAMPARK Digital" : "SAAMPARK Technology"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Download size={14} />} onClick={() => window.print()}>Print / Export</Button>
          {canAddSubscription && (
            <Button leftIcon={<Plus size={14} />} onClick={() => setIsAddModalOpen(true)}>New Subscription</Button>
          )}
        </div>
      </div>

      <SubscriptionList subscriptions={subscriptions} onDelete={handleDelete} />

      {/* ── CREATE SUBSCRIPTION MODAL ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-600" />
                  <span>Create Recurring Subscription</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSubscription} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Subscriber Client *</label>
                  <select
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  >
                    {availableClients.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Subscription / Plan Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cloud Infrastructure Maintenance Retainer"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Recurring Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 25000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Billing Interval</label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value as any)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-semibold"
                    >
                      <option value="Monthly">Monthly Retainer</option>
                      <option value="Quarterly">Quarterly Cycle</option>
                      <option value="Annually">Annual Subscription</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Next Billing Date</label>
                  <input
                    type="date"
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1"
                  >
                    <CreditCard size={13} />
                    <span>Create Subscription</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
