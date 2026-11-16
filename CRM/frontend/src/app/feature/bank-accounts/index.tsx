"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Landmark, Plus, Search } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { BankAccount } from "./types"
import {
  useBankAccountsQuery,
  useDeleteBankAccountMutation,
  useSaveBankAccountMutation,
} from "./hooks/useBankAccounts"
import { useBankAccountForm } from "./hooks/useBankAccountForm"
import { BankAccountModal } from "./components/BankAccountModal"
import { BankAccountCard } from "./components/BankAccountCard"
import { DeleteBankAccountModal } from "./components/DeleteBankAccountModal"

export default function BankAccountsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAdd = canPerformAction(user, "Settings", "add")
  const canEdit = canPerformAction(user, "Settings", "edit")
  const canDelete = canPerformAction(user, "Settings", "delete")

  const [searchQuery, setSearchQuery] = React.useState("")
  const [deleteConfirm, setDeleteConfirm] = React.useState<BankAccount | null>(null)

  const { data: accounts = [] } = useBankAccountsQuery()
  const saveMutation = useSaveBankAccountMutation()
  const deleteMutation = useDeleteBankAccountMutation()

  const form = useBankAccountForm(saveMutation.mutateAsync)

  const filtered = React.useMemo(() => {
    const query = searchQuery.toLowerCase()
    return accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(query) ||
        account.bankName.toLowerCase().includes(query)
    )
  }, [accounts, searchQuery])

  const totalBalance = React.useMemo(
    () => accounts.reduce((sum, account) => sum + (account.balance || 0), 0),
    [accounts]
  )

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
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
            <Landmark className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Bank Account Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage bank accounts and balances</p>
        </div>
        {canAdd && (
          <button
            onClick={form.openAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Add Account</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-2xs">
        <p className="text-xs text-zinc-500 font-medium">Total Balance Across All Accounts</p>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
          ₹{totalBalance.toLocaleString("en-IN")}
        </h3>
      </div>

      <div className="relative w-full sm:w-80">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search accounts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-zinc-400 text-sm">
            No bank accounts found.
          </div>
        ) : (
          filtered.map((item) => (
            <BankAccountCard
              key={item.id}
              item={item}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={form.openEdit}
              onDelete={setDeleteConfirm}
            />
          ))
        )}
      </div>

      <BankAccountModal
        isOpen={form.isOpen}
        editingItem={form.editingItem}
        values={form.values}
        onClose={form.close}
        onChange={form.updateField}
        onSubmit={form.handleSubmit}
      />

      <DeleteBankAccountModal
        item={deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
      />
    </motion.div>
  )
}
