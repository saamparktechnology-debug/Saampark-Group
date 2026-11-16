"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DollarSign, Plus, Search, TrendingDown, TrendingUp } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { Transaction } from "./types"
import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useTransactionsQuery,
} from "./hooks/useTransactions"
import { useTransactionForm } from "./hooks/useTransactionForm"
import { TransactionModal } from "./components/TransactionModal"
import { TransactionTable } from "./components/TransactionTable"

export default function TransactionsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAdd = canPerformAction(user, "Expenses", "add")
  const canDelete = canPerformAction(user, "Expenses", "delete")

  const [searchQuery, setSearchQuery] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [deleteConfirm, setDeleteConfirm] = React.useState<Transaction | null>(null)

  const { data: transactions = [] } = useTransactionsQuery()
  const createMutation = useCreateTransactionMutation()
  const deleteMutation = useDeleteTransactionMutation()

  const form = useTransactionForm(createMutation.mutateAsync)

  const filtered = React.useMemo(() => {
    const query = searchQuery.toLowerCase()
    return transactions.filter((t) => {
      const match =
        t.number?.toLowerCase().includes(query) || t.category?.toLowerCase().includes(query)
      if (typeFilter !== "all" && t.type !== typeFilter) return false
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false
      return match
    })
  }, [transactions, searchQuery, typeFilter, categoryFilter])

  const totalIncome = React.useMemo(
    () => transactions.filter((t) => t.type === "Income").reduce((s, t) => s + (t.amount || 0), 0),
    [transactions]
  )
  const totalExpense = React.useMemo(
    () => transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + (t.amount || 0), 0),
    [transactions]
  )
  const netProfit = totalIncome - totalExpense

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const confirmed = window.confirm(
      `⚠️ 2nd CONFIRMATION REQUIRED:\n\nAre you ABSOLUTELY sure you want to permanently delete this transaction?\n\nThis action cannot be undone.`
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Transaction Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Track income, expenses and financial transactions</p>
        </div>
        {canAdd && (
          <button
            onClick={form.openAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Add Transaction</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Income</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ₹{totalIncome.toLocaleString("en-IN")}
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Expense</p>
            <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              ₹{totalExpense.toLocaleString("en-IN")}
            </h3>
          </div>
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-lg">
            <TrendingDown size={20} />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Net Profit</p>
            <h3
              className={`text-xl font-bold mt-0.5 ${
                netProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600"
              }`}
            >
              ₹{netProfit.toLocaleString("en-IN")}
            </h3>
          </div>
          <div
            className={`p-2.5 rounded-lg ${
              netProfit >= 0
                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600"
                : "bg-rose-50 dark:bg-rose-950/50 text-rose-600"
            }`}
          >
            ₹
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Sales">Sales</option>
            <option value="Services">Services</option>
            <option value="Subscriptions">Subscriptions</option>
            <option value="Operations">Operations</option>
            <option value="Salary">Salary</option>
          </select>
        </div>
      </div>

      <TransactionTable items={filtered} canDelete={canDelete} onDelete={setDeleteConfirm} />

      <TransactionModal
        isOpen={form.isOpen}
        values={form.values}
        onClose={form.close}
        onChange={form.updateField}
        onSubmit={form.handleSubmit}
      />

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <h3 className="font-bold text-sm">Delete Transaction</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to delete <strong>{deleteConfirm.number}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-3 py-1.5 text-xs text-zinc-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
