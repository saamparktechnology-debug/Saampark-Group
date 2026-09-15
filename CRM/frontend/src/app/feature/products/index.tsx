"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Package, Plus, Search, Edit, Trash2, X, AlertTriangle } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { ProductService } from "@/services/inventoryService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

interface Product { id: string; name: string; sku: string; category: string; price: number; stock: number; status: string }

export default function ProductsMain() {
  const { user, activeCompanyId } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Settings", "add")
  const canEdit = canPerformAction(user, "Settings", "edit")
  const canDelete = canPerformAction(user, "Settings", "delete")

  const [products, setProducts] = React.useState<Product[]>([])
  const [lowStockProducts, setLowStockProducts] = React.useState<Product[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Product | null>(null)
  const [form, setForm] = React.useState({ name: "", sku: "", category: "", price: 0, stock: 0, status: "Active", description: "" })

  const loadData = React.useCallback(async () => {
    try {
      const [data, lowStock] = await Promise.all([ProductService.getAll({}), ProductService.getLowStock()])
      setProducts(Array.isArray(data) ? data : [])
      setLowStockProducts(Array.isArray(lowStock) ? lowStock : [])
    } catch { }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const filtered = products.filter(p => {
    const match = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase())
    if (statusFilter !== "all" && p.status !== statusFilter) return false
    return match
  })

  const openAddModal = () => { setEditingItem(null); setForm({ name: "", sku: `SKU-${Date.now().toString().slice(-6)}`, category: "", price: 0, stock: 0, status: "Active", description: "" }); setIsModalOpen(true) }
  const openEditModal = (item: Product) => { setEditingItem(item); setForm({ name: item.name, sku: item.sku, category: item.category, price: item.price, stock: item.stock, status: item.status, description: (item as any).description || "" }); setIsModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    await executeWithFeedback(async () => {
      if (editingItem) { await ProductService.update(editingItem.id, form) } else { await ProductService.create(form) }
    }, { actionType: editingItem ? "update" : "create", successTitle: editingItem ? "Product Updated" : "Product Created" })
    setIsModalOpen(false); loadData()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const second = window.confirm(`⚠️ 2nd CONFIRMATION REQUIRED:\n\nAre you ABSOLUTELY sure you want to permanently delete product "${deleteConfirm.name}"?\n\nThis action cannot be undone.`)
    if (!second) return
    await executeWithFeedback(async () => { await ProductService.delete(deleteConfirm.id) }, { actionType: "delete", successTitle: "Product Deleted" })
    setDeleteConfirm(null); loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Package className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Product Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage products, inventory and stock levels</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode("table")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === "table" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"}`}>Table</button>
            <button onClick={() => setViewMode("grid")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"}`}>Grid</button>
          </div>
          {canAdd && <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"><Plus size={14} /><span>Add Product</span></button>}
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">Low Stock Alert</h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">{lowStockProducts.length} product(s) are running low on stock: {lowStockProducts.map(p => p.name).join(", ")}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer">
          <option value="all">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
        </select>
      </div>

      {viewMode === "table" ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
                <tr><th className="py-3 px-4">Name</th><th className="py-3 px-4">SKU</th><th className="py-3 px-4">Category</th><th className="py-3 px-4">Price</th><th className="py-3 px-4">Stock</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-center">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-zinc-400">No products found.</td></tr>
                ) : (
                  filtered.map(item => (
                    <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-blue-600">{item.sku}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium">{item.category || "-"}</span></td>
                      <td className="py-3 px-4 font-bold font-mono">₹{(item.price || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4"><span className={`font-bold ${(item.stock || 0) < 10 ? "text-rose-600" : "text-zinc-900 dark:text-zinc-100"}`}>{item.stock || 0}</span></td>
                      <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${item.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>{item.status}</span></td>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-sm">{item.name.charAt(0)}</div>
                <div className="flex items-center gap-1">
                  {canEdit && <button onClick={() => openEditModal(item)} className="p-1 hover:text-blue-600"><Edit size={14} /></button>}
                  {canDelete && <button onClick={() => setDeleteConfirm(item)} className="p-1 hover:text-rose-600"><Trash2 size={14} /></button>}
                </div>
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{item.name}</h3>
              <p className="text-[11px] text-zinc-400 mb-2">{item.sku} | {item.category || "Uncategorized"}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{(item.price || 0).toLocaleString("en-IN")}</span>
                <span className={`text-[11px] font-bold ${(item.stock || 0) < 10 ? "text-rose-600" : "text-zinc-500"}`}>{item.stock || 0} in stock</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">{editingItem ? "Edit" : "Add"} Product</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Name *</label><input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">SKU</label><input type="text" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Category</label><input type="text" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Status</label><select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option>Active</option><option>Inactive</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Price</label><input type="number" min="0" value={form.price || ""} onChange={(e) => setForm({...form, price: Number(e.target.value)})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Stock</label><input type="number" min="0" value={form.stock || ""} onChange={(e) => setForm({...form, stock: Number(e.target.value)})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
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
              <h3 className="font-bold text-sm">Delete Product</h3>
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
