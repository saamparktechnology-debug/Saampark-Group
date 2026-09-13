"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Plus, Search, Edit, Trash2, X, Check, XCircle, Clock } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { LeaveService } from "@/services/hrService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

type Tab = "requests" | "types"
interface LeaveRequest { id: string; employee: string; type: string; from: string; to: string; days: number; status: string; reason?: string }
interface LeaveType { id: string; name: string; daysAllowed: number; status: string }

export default function LeaveManagementMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Users", "add")

  const [activeTab, setActiveTab] = React.useState<Tab>("requests")
  const [requests, setRequests] = React.useState<LeaveRequest[]>([])
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isTypeModalOpen, setIsTypeModalOpen] = React.useState(false)
  const [editingType, setEditingType] = React.useState<LeaveType | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ id: string; name: string } | null>(null)
  const [form, setForm] = React.useState({ employee: "", type: "Casual Leave", from: "", to: "", days: 1, reason: "" })
  const [typeForm, setTypeForm] = React.useState({ name: "", daysAllowed: 12 })

  const loadData = React.useCallback(async () => {
    try {
      const [reqData, typeData] = await Promise.all([LeaveService.getRequests({}), LeaveService.getTypes()])
      setRequests(Array.isArray(reqData) ? reqData : [])
      setLeaveTypes(Array.isArray(typeData) ? typeData : [])
    } catch { }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const filteredRequests = requests.filter(r => {
    const match = r.employee.toLowerCase().includes(searchQuery.toLowerCase())
    if (statusFilter !== "all" && r.status !== statusFilter) return false
    return match
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employee.trim()) return
    await executeWithFeedback(async () => { await LeaveService.requestLeave(form) }, { actionType: "create", successTitle: "Leave Requested" })
    setIsModalOpen(false); loadData()
  }

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typeForm.name.trim()) return
    await executeWithFeedback(async () => {
      if (editingType) { await LeaveService.createType(typeForm) } else { await LeaveService.createType(typeForm) }
    }, { actionType: editingType ? "update" : "create", successTitle: editingType ? "Type Updated" : "Type Created" })
    setIsTypeModalOpen(false); loadData()
  }

  const handleApprove = async (id: string) => {
    await executeWithFeedback(async () => { await LeaveService.approve(id) }, { actionType: "update", successTitle: "Leave Approved" })
    loadData()
  }

  const handleReject = async (id: string) => {
    await executeWithFeedback(async () => { await LeaveService.reject(id) }, { actionType: "update", successTitle: "Leave Rejected" })
    loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Leave Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage employee leave requests and leave types</p>
        </div>
        {canAdd && <button onClick={() => { if (activeTab === "types") { setEditingType(null); setTypeForm({ name: "", daysAllowed: 12 }); setIsTypeModalOpen(true) } else { setIsModalOpen(true) } }} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"><Plus size={14} /><span>Add {activeTab === "types" ? "Leave Type" : "Request"}</span></button>}
      </div>

      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <button onClick={() => setActiveTab("requests")} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${activeTab === "requests" ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}>
          <Calendar size={14} /><span>Leave Requests</span><span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800">{requests.length}</span>
        </button>
        <button onClick={() => setActiveTab("types")} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${activeTab === "types" ? "border-emerald-600 text-emerald-600 bg-emerald-50/50" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}>
          <Clock size={14} /><span>Leave Types</span>
        </button>
      </div>

      {activeTab === "requests" && (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer">
              <option value="all">All Status</option><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
                <tr><th className="py-3 px-4">Employee</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">From</th><th className="py-3 px-4">To</th><th className="py-3 px-4">Days</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-center">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                {filteredRequests.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-zinc-400">No leave requests.</td></tr> : filteredRequests.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.employee}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium">{item.type}</span></td>
                    <td className="py-3 px-4 font-mono text-[11px]">{item.from}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{item.to}</td>
                    <td className="py-3 px-4 font-bold">{item.days}</td>
                    <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${item.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : item.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{item.status}</span></td>
                    <td className="py-3 px-4"><div className="flex items-center justify-center gap-1.5">
                      {item.status === "Pending" && canAdd && (<>
                        <button onClick={() => handleApprove(item.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Approve"><Check size={14} /></button>
                        <button onClick={() => handleReject(item.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded" title="Reject"><XCircle size={14} /></button>
                      </>)}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "types" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr><th className="py-3 px-4">Name</th><th className="py-3 px-4">Days Allowed</th><th className="py-3 px-4">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {leaveTypes.length === 0 ? <tr><td colSpan={3} className="py-8 text-center text-zinc-400">No leave types configured.</td></tr> : leaveTypes.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                  <td className="py-3 px-4">{item.daysAllowed} days</td>
                  <td className="py-3 px-4"><span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">Request Leave</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Employee Name *</label><input type="text" required value={form.employee} onChange={(e) => setForm({...form, employee: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Leave Type</label><select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option>Casual Leave</option><option>Sick Leave</option><option>Earned Leave</option><option>Unpaid Leave</option></select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">From *</label><input type="date" required value={form.from} onChange={(e) => setForm({...form, from: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">To *</label><input type="date" required value={form.to} onChange={(e) => setForm({...form, to: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Submit</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTypeModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">Add Leave Type</h3>
                <button onClick={() => setIsTypeModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleTypeSubmit} className="p-6 space-y-4 text-xs">
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Name *</label><input type="text" required value={typeForm.name} onChange={(e) => setTypeForm({...typeForm, name: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Days Allowed</label><input type="number" min="1" value={typeForm.daysAllowed} onChange={(e) => setTypeForm({...typeForm, daysAllowed: Number(e.target.value)})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setIsTypeModalOpen(false)} className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Create</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
