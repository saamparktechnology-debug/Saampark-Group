"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Plus, Search, Edit, Trash2, X, Calendar, Phone, Mail, Video } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { FollowUpService } from "@/services/crmCoreService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

interface FollowUp { id: string; subject: string; type?: string; scheduledDate?: string; status: string; assignedTo?: string; notes?: string }

export default function FollowUpsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Leads", "add")
  const canEdit = canPerformAction(user, "Leads", "edit")
  const canDelete = canPerformAction(user, "Leads", "delete")

  const [followUps, setFollowUps] = React.useState<FollowUp[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [viewMode, setViewMode] = React.useState<"list" | "calendar">("list")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<FollowUp | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<FollowUp | null>(null)
  const [form, setForm] = React.useState({ subject: "", type: "Call", scheduledDate: "", status: "Pending", assignedTo: "", notes: "" })

  const loadData = React.useCallback(async () => {
    try { const data = await FollowUpService.getAll({}); setFollowUps(Array.isArray(data) ? data : []) } catch { }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const filtered = followUps.filter(f => {
    const match = f.subject.toLowerCase().includes(searchQuery.toLowerCase())
    if (statusFilter !== "all" && f.status !== statusFilter) return false
    return match
  })

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "Call": return <Phone size={12} className="text-blue-500" />
      case "Email": return <Mail size={12} className="text-purple-500" />
      case "Meeting": return <Video size={12} className="text-emerald-500" />
      default: return <Calendar size={12} className="text-amber-500" />
    }
  }

  const openAddModal = () => { setEditingItem(null); setForm({ subject: "", type: "Call", scheduledDate: "", status: "Pending", assignedTo: "", notes: "" }); setIsModalOpen(true) }
  const openEditModal = (item: FollowUp) => { setEditingItem(item); setForm({ subject: item.subject, type: item.type || "Call", scheduledDate: item.scheduledDate || "", status: item.status, assignedTo: item.assignedTo || "", notes: item.notes || "" }); setIsModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim()) return
    await executeWithFeedback(async () => {
      if (editingItem) { await FollowUpService.update(editingItem.id, form) } else { await FollowUpService.create(form) }
    }, { actionType: editingItem ? "update" : "create", successTitle: editingItem ? "Follow-up Updated" : "Follow-up Created" })
    setIsModalOpen(false); loadData()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await executeWithFeedback(async () => { await FollowUpService.delete(deleteConfirm.id) }, { actionType: "delete", successTitle: "Follow-up Deleted" })
    setDeleteConfirm(null); loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Follow-up Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Schedule and track follow-up activities</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode("list")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"}`}>List</button>
            <button onClick={() => setViewMode("calendar")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === "calendar" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"}`}>Calendar</button>
          </div>
          {canAdd && <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"><Plus size={14} /><span>Add Follow-up</span></button>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search follow-ups..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer">
          <option value="all">All Status</option><option value="Pending">Pending</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
                <tr><th className="py-3 px-4">Subject</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">Scheduled</th><th className="py-3 px-4">Status</th><th className="py-3 px-4">Assigned To</th><th className="py-3 px-4 text-center">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-zinc-400">No follow-ups found.</td></tr>
                ) : (
                  filtered.map(item => (
                    <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.subject}</td>
                      <td className="py-3 px-4"><div className="flex items-center gap-1.5">{getTypeIcon(item.type)}<span className="text-[11px]">{item.type || "Call"}</span></div></td>
                      <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{item.scheduledDate || "-"}</td>
                      <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${item.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : item.status === "Cancelled" ? "bg-zinc-100 text-zinc-600 border-zinc-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{item.status}</span></td>
                      <td className="py-3 px-4">{item.assignedTo || "-"}</td>
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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-6 shadow-2xs">
          <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <div key={d} className="p-2 text-center text-[10px] font-bold text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/60">{d}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - date.getDay() + i)
              const dateStr = date.toLocaleDateString("en-GB")
              const dayFollowUps = filtered.filter(f => f.scheduledDate === dateStr)
              return (
                <div key={i} className="min-h-[80px] p-2 bg-white dark:bg-zinc-900">
                  <div className="text-[10px] text-zinc-400 mb-1">{date.getDate()}</div>
                  {dayFollowUps.slice(0, 2).map(f => (
                    <div key={f.id} className="text-[9px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded px-1 py-0.5 mb-0.5 truncate">{f.subject}</div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">{editingItem ? "Edit" : "Add"} Follow-up</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Subject *</label><input type="text" required value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Type</label><select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option>Call</option><option>Email</option><option>Meeting</option><option>Visit</option></select></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Scheduled Date</label><input type="date" value={form.scheduledDate} onChange={(e) => setForm({...form, scheduledDate: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Status</label><select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option>Pending</option><option>Completed</option><option>Cancelled</option></select></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Assigned To</label><input type="text" value={form.assignedTo} onChange={(e) => setForm({...form, assignedTo: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
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
              <h3 className="font-bold text-sm">Delete Follow-up</h3>
              <p className="text-xs text-zinc-500">Are you sure you want to delete <strong>{deleteConfirm.subject}</strong>?</p>
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
