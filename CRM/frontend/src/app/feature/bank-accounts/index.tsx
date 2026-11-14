"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Landmark, Plus, Search, Edit, Trash2, X } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { BankAccountService } from "@/services/accountService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

interface BankAccount { id: string; name: string; bankName: string; accountNumber: string; ifscCode: string; balance: number; status: string }

export default function BankAccountsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Settings", "add")
  const canEdit = canPerformAction(user, "Settings", "edit")
  const canDelete = canPerformAction(user, "Settings", "delete")

  const [accounts, setAccounts] = React.useState<BankAccount[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<BankAccount | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<BankAccount | null>(null)
  const [form, setForm] = React.useState({ name: "", bankName: "", accountNumber: "", ifscCode: "", branch: "", status: "Active" })

  const loadData = React.useCallback(async () => {
    try { const data = await BankAccountService.getAll(); setAccounts(Array.isArray(data) ? data : []) } catch { }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const filtered = accounts.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.bankName.toLowerCase().includes(searchQuery.toLowerCase()))

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)

  const openAddModal = () => { setEditingItem(null); setForm({ name: "", bankName: "", accountNumber: "", ifscCode: "", branch: "", status: "Active" }); setIsModalOpen(true) }
  const openEditModal = (item: BankAccount) => { setEditingItem(item); setForm({ name: item.name, bankName: item.bankName, accountNumber: item.accountNumber, ifscCode: item.ifscCode, branch: (item as any).branch || "", status: item.status }); setIsModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    await executeWithFeedback(async () => {
      if (editingItem) { await BankAccountService.update(editingItem.id, form) } else { await BankAccountService.create(form) }
    }, { actionType: editingItem ? "update" : "create", successTitle: editingItem ? "Account Updated" : "Account Created" })
    setIsModalOpen(false); loadData()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await executeWithFeedback(async () => { await BankAccountService.delete(deleteConfirm.id) }, { actionType: "delete", successTitle: "Account Deleted" })
    setDeleteConfirm(null); loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Landmark className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Bank Account Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage bank accounts and balances</p>
        </div>
        {canAdd && <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"><Plus size={14} /><span>Add Account</span></button>}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-2xs">
        <p className="text-xs text-zinc-500 font-medium">Total Balance Across All Accounts</p>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">₹{totalBalance.toLocaleString("en-IN")}</h3>
      </div>

      <div className="relative w-full sm:w-80">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input type="text" placeholder="Search accounts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? <div className="col-span-3 py-12 text-center text-zinc-400 text-sm">No bank accounts found.</div> : filtered.map(item => (
          <div key={item.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-sm"><Landmark size={18} /></div>
              <div className="flex items-center gap-1">
                {canEdit && <button onClick={() => openEditModal(item)} className="p-1 hover:text-blue-600"><Edit size={14} /></button>}
                {canDelete && <button onClick={() => setDeleteConfirm(item)} className="p-1 hover:text-rose-600"><Trash2 size={14} /></button>}
              </div>
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{item.name}</h3>
            <p className="text-[11px] text-zinc-500 mb-2">{item.bankName}</p>
            <p className="text-[11px] text-zinc-400 font-mono mb-3">****{item.accountNumber?.slice(-4) || "0000"}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">₹{(item.balance || 0).toLocaleString("en-IN")}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{item.status}</span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">{editingItem ? "Edit" : "Add"} Bank Account</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Account Name *</label><input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Bank Name *</label><input type="text" required value={form.bankName} onChange={(e) => setForm({...form, bankName: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Account Number</label><input type="text" value={form.accountNumber} onChange={(e) => setForm({...form, accountNumber: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden font-mono" /></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">IFSC Code</label><input type="text" value={form.ifscCode} onChange={(e) => setForm({...form, ifscCode: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden font-mono" /></div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">{editingItem ? "Update" : "Create"}</button>
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
              <h3 className="font-bold text-sm">Delete Account</h3>
              <p className="text-xs text-zinc-500">Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?</p>
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
