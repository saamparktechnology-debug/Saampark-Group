"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DollarSign, Plus, Search, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, X, Trash2 } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { TransactionService } from "@/services/accountService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

interface Transaction { id: string; number: string; type: string; category: string; amount: number; date: string; method: string; notes?: string }

export default function TransactionsMain() {
  const { user, activeCompanyId } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Expenses", "add")
  const canDelete = canPerformAction(user, "Expenses", "delete")

  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Transaction | null>(null)
  const [form, setForm] = React.useState({ number: "", type: "Income", category: "Sales", amount: 0, date: new Date().toISOString().split("T")[0], method: "Bank Transfer", notes: "" })

  const loadData = React.useCallback(async () => {
    try { const data = await TransactionService.getAll({}); setTransactions(Array.isArray(data) ? data : []) } catch { }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const filtered = transactions.filter(t => {
    const match = t.number?.toLowerCase().includes(searchQuery.toLowerCase()) || t.category?.toLowerCase().includes(searchQuery.toLowerCase())
    if (typeFilter !== "all" && t.type !== typeFilter) return false
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false
    return match
  })

  const totalIncome = transactions.filter(t => t.type === "Income").reduce((s, t) => s + (t.amount || 0), 0)
  const totalExpense = transactions.filter(t => t.type === "Expense").reduce((s, t) => s + (t.amount || 0), 0)
  const netProfit = totalIncome - totalExpense

  const openAddModal = () => { setForm({ number: `TXN-${Date.now().toString().slice(-6)}`, type: "Income", category: "Sales", amount: 0, date: new Date().toISOString().split("T")[0], method: "Bank Transfer", notes: "" }); setIsModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.amount <= 0) return
    await executeWithFeedback(async () => { await TransactionService.create(form) }, { actionType: "create", successTitle: "Transaction Created" })
    setIsModalOpen(false); loadData()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const second = window.confirm(`⚠️ 2nd CONFIRMATION REQUIRED:\n\nAre you ABSOLUTELY sure you want to permanently delete this transaction?\n\nThis action cannot be undone.`)
    if (!second) return
    await executeWithFeedback(async () => { await TransactionService.delete(deleteConfirm.id) }, { actionType: "delete", successTitle: "Transaction Deleted" })
    setDeleteConfirm(null); loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Transaction Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Track income, expenses and financial transactions</p>
        </div>
        {canAdd && <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"><Plus size={14} /><span>Add Transaction</span></button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div><p className="text-xs text-zinc-500 font-medium">Total Income</p><h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{totalIncome.toLocaleString("en-IN")}</h3></div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div><p className="text-xs text-zinc-500 font-medium">Total Expense</p><h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">₹{totalExpense.toLocaleString("en-IN")}</h3></div>
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-lg"><TrendingDown size={20} /></div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div><p className="text-xs text-zinc-500 font-medium">Net Profit</p><h3 className={`text-xl font-bold mt-0.5 ${netProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600"}`}>₹{netProfit.toLocaleString("en-IN")}</h3></div>
          <div className={`p-2.5 rounded-lg ${netProfit >= 0 ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600" : "bg-rose-50 dark:bg-rose-950/50 text-rose-600"}`}>₹</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search transactions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer">
            <option value="all">All Types</option><option value="Income">Income</option><option value="Expense">Expense</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer">
            <option value="all">All Categories</option><option value="Sales">Sales</option><option value="Services">Services</option><option value="Subscriptions">Subscriptions</option><option value="Operations">Operations</option><option value="Salary">Salary</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr><th className="py-3 px-4">Number</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">Category</th><th className="py-3 px-4">Amount</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Method</th><th className="py-3 px-4 text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-zinc-400">No transactions found.</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{item.number}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.type === "Income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{item.type}</span></td>
                    <td className="py-3 px-4">{item.category}</td>
                    <td className={`py-3 px-4 font-bold font-mono ${item.type === "Income" ? "text-emerald-600" : "text-rose-600"}`}>{item.type === "Income" ? "+" : "-"}₹{(item.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{item.date}</td>
                    <td className="py-3 px-4">{item.method}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {canDelete && <button onClick={() => setDeleteConfirm(item)} className="p-1 hover:text-rose-600"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">Add Transaction</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Type</label><select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option>Income</option><option>Expense</option></select></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Category</label><select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option>Sales</option><option>Services</option><option>Subscriptions</option><option>Operations</option><option>Salary</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Amount *</label><input type="number" required min="1" value={form.amount || ""} onChange={(e) => setForm({...form, amount: Number(e.target.value)})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Date</label><input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                </div>
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Payment Method</label><select value={form.method} onChange={(e) => setForm({...form, method: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option>Bank Transfer</option><option>Cash</option><option>UPI</option><option>Cheque</option><option>Credit Card</option></select></div>
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Create</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-bold text-sm">Delete Transaction</h3>
              <p className="text-xs text-zinc-500">Are you sure you want to delete <strong>{deleteConfirm.number}</strong>?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs text-zinc-500 font-semibold">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
