"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Plus, Search, Edit, Trash2, X, MapPin, Clock, Users } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { MeetingService } from "@/services/crmCoreService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

interface Meeting { id: string; title: string; date?: string; duration?: string; location?: string; status: string; organizer?: string; attendees?: string[] }

export default function MeetingsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Leads", "add")
  const canEdit = canPerformAction(user, "Leads", "edit")
  const canDelete = canPerformAction(user, "Leads", "delete")

  const [meetings, setMeetings] = React.useState<Meeting[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Meeting | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Meeting | null>(null)
  const [form, setForm] = React.useState({ title: "", date: "", duration: "60", location: "", status: "Scheduled", organizer: "", attendees: "" })

  const loadData = React.useCallback(async () => {
    try { const data = await MeetingService.getAll({}); setMeetings(Array.isArray(data) ? data : []) } catch { }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const filtered = meetings.filter(m => {
    const match = m.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (statusFilter !== "all" && m.status !== statusFilter) return false
    return match
  })

  const openAddModal = () => { setEditingItem(null); setForm({ title: "", date: "", duration: "60", location: "", status: "Scheduled", organizer: user?.name || "", attendees: "" }); setIsModalOpen(true) }
  const openEditModal = (item: Meeting) => { setEditingItem(item); setForm({ title: item.title, date: item.date || "", duration: item.duration || "60", location: item.location || "", status: item.status, organizer: item.organizer || "", attendees: (item.attendees || []).join(", ") }); setIsModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const data = { ...form, attendees: form.attendees.split(",").map(a => a.trim()).filter(Boolean) }
    await executeWithFeedback(async () => {
      if (editingItem) { await MeetingService.update(editingItem.id, data) } else { await MeetingService.create(data) }
    }, { actionType: editingItem ? "update" : "create", successTitle: editingItem ? "Meeting Updated" : "Meeting Created" })
    setIsModalOpen(false); loadData()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await executeWithFeedback(async () => { await MeetingService.delete(deleteConfirm.id) }, { actionType: "delete", successTitle: "Meeting Deleted" })
    setDeleteConfirm(null); loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Meeting Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Schedule and manage meetings</p>
        </div>
        {canAdd && <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"><Plus size={14} /><span>Add Meeting</span></button>}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search meetings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer">
          <option value="all">All Status</option><option value="Scheduled">Scheduled</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr><th className="py-3 px-4">Title</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Duration</th><th className="py-3 px-4">Location</th><th className="py-3 px-4">Status</th><th className="py-3 px-4">Organizer</th><th className="py-3 px-4 text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-zinc-400">No meetings found.</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{item.date || "-"}</td>
                    <td className="py-3 px-4">{item.duration || "60"} min</td>
                    <td className="py-3 px-4"><div className="flex items-center gap-1"><MapPin size={11} className="text-zinc-400" /><span className="truncate max-w-[120px]">{item.location || "Online"}</span></div></td>
                    <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${item.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : item.status === "Cancelled" ? "bg-zinc-100 text-zinc-600 border-zinc-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>{item.status}</span></td>
                    <td className="py-3 px-4">{item.organizer || "-"}</td>
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">{editingItem ? "Edit" : "Add"} Meeting</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Title *</label><input type="text" required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Date & Time</label><input type="datetime-local" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Duration (min)</label><select value={form.duration} onChange={(e) => setForm({...form, duration: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option></select></div>
                </div>
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Location</label><input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="Office, Zoom, Google Meet..." className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Status</label><select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option></select></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Organizer</label><input type="text" value={form.organizer} onChange={(e) => setForm({...form, organizer: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                </div>
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Attendees (comma-separated)</label><input type="text" value={form.attendees} onChange={(e) => setForm({...form, attendees: e.target.value})} placeholder="name1@email.com, name2@email.com" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
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
              <h3 className="font-bold text-sm">Delete Meeting</h3>
              <p className="text-xs text-zinc-500">Are you sure you want to delete <strong>{deleteConfirm.title}</strong>?</p>
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
