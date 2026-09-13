"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FolderOpen, Plus, Search, Trash2, X, Upload, AlertTriangle } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { DocumentService } from "@/services/supportService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

interface Document { id: string; name: string; category: string; type: string; size: string; expiry?: string; uploadedBy: string; uploadedAt: string }

export default function DocumentsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Files", "add")
  const canDelete = canPerformAction(user, "Files", "delete")

  const [documents, setDocuments] = React.useState<Document[]>([])
  const [expiringDocs, setExpiringDocs] = React.useState<Document[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Document | null>(null)
  const [form, setForm] = React.useState({ name: "", category: "General", type: "PDF", size: "1 MB", expiry: "", uploadedBy: user?.name || "Admin" })

  const loadData = React.useCallback(async () => {
    try {
      const [data, expiring] = await Promise.all([DocumentService.getAll({}), DocumentService.getExpiring(30)])
      setDocuments(Array.isArray(data) ? data : [])
      setExpiringDocs(Array.isArray(expiring) ? expiring : [])
    } catch { }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const filtered = documents.filter(d => {
    const match = d.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (categoryFilter !== "all" && d.category !== categoryFilter) return false
    return match
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    await executeWithFeedback(async () => { await DocumentService.create(form) }, { actionType: "create", successTitle: "Document Uploaded" })
    setIsModalOpen(false); loadData()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await executeWithFeedback(async () => { await DocumentService.delete(deleteConfirm.id) }, { actionType: "delete", successTitle: "Document Deleted" })
    setDeleteConfirm(null); loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <FolderOpen className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Document Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage uploaded documents and files</p>
        </div>
        {canAdd && <button onClick={() => { setForm({ name: "", category: "General", type: "PDF", size: "1 MB", expiry: "", uploadedBy: user?.name || "Admin" }); setIsModalOpen(true) }} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"><Upload size={14} /><span>Upload Document</span></button>}
      </div>

      {expiringDocs.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">Expiring Soon</h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">{expiringDocs.length} document(s) expiring within 30 days</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer">
          <option value="all">All Categories</option><option value="General">General</option><option value="Contracts">Contracts</option><option value="Invoices">Invoices</option><option value="Legal">Legal</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr><th className="py-3 px-4">Name</th><th className="py-3 px-4">Category</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">Size</th><th className="py-3 px-4">Expiry</th><th className="py-3 px-4">Uploaded By</th><th className="py-3 px-4 text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {filtered.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-zinc-400">No documents found.</td></tr> : filtered.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium">{item.category}</span></td>
                  <td className="py-3 px-4 text-[11px]">{item.type}</td>
                  <td className="py-3 px-4 text-[11px]">{item.size}</td>
                  <td className="py-3 px-4 text-[11px] font-mono">{item.expiry || "N/A"}</td>
                  <td className="py-3 px-4">{item.uploadedBy}</td>
                  <td className="py-3 px-4"><div className="flex items-center justify-center gap-1.5">
                    {canDelete && <button onClick={() => setDeleteConfirm(item)} className="p-1 hover:text-rose-600"><Trash2 size={14} /></button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">Upload Document</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Document Name *</label><input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Category</label><select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option>General</option><option>Contracts</option><option>Invoices</option><option>Legal</option></select></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Type</label><select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option>PDF</option><option>DOC</option><option>XLS</option><option>Image</option><option>Other</option></select></div>
                </div>
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Expiry Date</label><input type="date" value={form.expiry} onChange={(e) => setForm({...form, expiry: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Upload</button>
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
              <h3 className="font-bold text-sm">Delete Document</h3>
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
