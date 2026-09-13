"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Plus, Search, Edit, Trash2, X } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { PurchaseOrderService } from "@/services/purchaseService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

interface LineItem { id: string; name: string; quantity: number; unitPrice: number; total: number }
interface PurchaseOrder { id: string; number: string; vendor: string; date: string; total: number; status: string; items?: LineItem[] }

export default function PurchaseOrdersMain() {
  const { user, activeCompanyId } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Settings", "add")
  const canEdit = canPerformAction(user, "Settings", "edit")
  const canDelete = canPerformAction(user, "Settings", "delete")

  const [orders, setOrders] = React.useState<PurchaseOrder[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<PurchaseOrder | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<PurchaseOrder | null>(null)
  const [form, setForm] = React.useState({ number: "", vendor: "", date: "", status: "Draft" })
  const [items, setItems] = React.useState<LineItem[]>([{ id: "1", name: "", quantity: 1, unitPrice: 0, total: 0 }])

  const loadData = React.useCallback(async () => {
    try { const data = await PurchaseOrderService.getAll({}); setOrders(Array.isArray(data) ? data : []) } catch { }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const filtered = orders.filter(o => {
    const match = o.number?.toLowerCase().includes(searchQuery.toLowerCase()) || o.vendor?.toLowerCase().includes(searchQuery.toLowerCase())
    if (statusFilter !== "all" && o.status !== statusFilter) return false
    return match
  })

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)
  const tax = Math.round(subtotal * 0.18)
  const grandTotal = subtotal + tax

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(items.map(i => {
      if (i.id !== id) return i
      const updated = { ...i, [field]: value }
      if (field === "quantity" || field === "unitPrice") updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0)
      return updated
    }))
  }

  const addItem = () => setItems([...items, { id: String(Date.now()), name: "", quantity: 1, unitPrice: 0, total: 0 }])
  const removeItem = (id: string) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)) }

  const openAddModal = () => { setEditingItem(null); setForm({ number: `PO-${Date.now().toString().slice(-6)}`, vendor: "", date: new Date().toISOString().split("T")[0], status: "Draft" }); setItems([{ id: "1", name: "", quantity: 1, unitPrice: 0, total: 0 }]); setIsModalOpen(true) }
  const openEditModal = (item: PurchaseOrder) => { setEditingItem(item); setForm({ number: item.number, vendor: item.vendor, date: item.date, status: item.status }); setItems(item.items || [{ id: "1", name: "", quantity: 1, unitPrice: 0, total: 0 }]); setIsModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vendor.trim()) return
    const data = { ...form, items, subtotal, tax, total: grandTotal, companyId: activeCompanyId }
    await executeWithFeedback(async () => {
      if (editingItem) { await PurchaseOrderService.update(editingItem.id, data) } else { await PurchaseOrderService.create(data) }
    }, { actionType: editingItem ? "update" : "create", successTitle: editingItem ? "PO Updated" : "PO Created" })
    setIsModalOpen(false); loadData()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await executeWithFeedback(async () => { await PurchaseOrderService.delete(deleteConfirm.id) }, { actionType: "delete", successTitle: "PO Deleted" })
    setDeleteConfirm(null); loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <ShoppingCart className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Purchase Order Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Create and manage purchase orders for vendors</p>
        </div>
        {canAdd && <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"><Plus size={14} /><span>Create PO</span></button>}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search purchase orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer">
          <option value="all">All Status</option><option value="Draft">Draft</option><option value="Sent">Sent</option><option value="Received">Received</option><option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr><th className="py-3 px-4">Number</th><th className="py-3 px-4">Vendor</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Total</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-400">No purchase orders found.</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{item.number}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.vendor}</td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{item.date}</td>
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">₹{(item.total || 0).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${item.status === "Received" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : item.status === "Sent" ? "bg-blue-50 text-blue-700 border-blue-200" : item.status === "Cancelled" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>{item.status}</span></td>
                    <td className="py-3 px-4"><div className="flex items-center justify-center gap-1.5">
                      {canEdit && <button onClick={() => openEditModal(item)} className="p-1 hover:text-blue-600"><Edit size={14} /></button>}
                      {canDelete && <button onClick={() => setDeleteConfirm(item)} className="p-1 hover:text-rose-600"><Trash2 size={14} /></button>}
                    </div></td>
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">{editingItem ? "Edit" : "Create"} Purchase Order</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Number</label><input type="text" value={form.number} onChange={(e) => setForm({...form, number: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Vendor *</label><input type="text" required value={form.vendor} onChange={(e) => setForm({...form, vendor: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Date</label><input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><label className="text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider text-[11px]">Line Items</label><button type="button" onClick={addItem} className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"><Plus size={12} />Add Item</button></div>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg items-center">
                        <div className="col-span-4"><input type="text" placeholder="Item" value={item.name} onChange={(e) => handleItemChange(item.id, "name", e.target.value)} className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs" /></div>
                        <div className="col-span-2"><input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))} className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-center" /></div>
                        <div className="col-span-2"><input type="number" placeholder="Price" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, "unitPrice", Number(e.target.value))} className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-right" /></div>
                        <div className="col-span-3 text-right font-mono font-bold">₹{item.total.toLocaleString("en-IN")}</div>
                        <div className="col-span-1 text-center"><button type="button" onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-rose-600"><Trash2 size={13} /></button></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex justify-end">
                  <div className="w-56 space-y-1 text-right text-xs">
                    <div>Subtotal: <span className="font-semibold font-mono">₹{subtotal.toLocaleString("en-IN")}</span></div>
                    <div>GST (18%): <span className="font-semibold font-mono">₹{tax.toLocaleString("en-IN")}</span></div>
                    <div className="text-sm font-bold text-blue-600 pt-1 border-t border-zinc-200 dark:border-zinc-700">Total: ₹{grandTotal.toLocaleString("en-IN")}</div>
                  </div>
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
              <h3 className="font-bold text-sm">Delete Purchase Order</h3>
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
