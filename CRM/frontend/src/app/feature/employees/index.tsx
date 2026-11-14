"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserCheck, Plus, Search, Edit, Trash2, X, Mail, Phone } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { EmployeeService, OrgService } from "@/services/hrService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

interface Employee { id: string; code: string; name: string; department: string; designation: string; email: string; phone: string; status: string }

export default function EmployeesMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Users", "add")
  const canEdit = canPerformAction(user, "Users", "edit")
  const canDelete = canPerformAction(user, "Users", "delete")

  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [departments, setDepartments] = React.useState<{ id: string; name: string }[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deptFilter, setDeptFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Employee | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Employee | null>(null)
  const [form, setForm] = React.useState({ code: "", name: "", department: "", designation: "", email: "", phone: "", status: "Active" })

  const loadData = React.useCallback(async () => {
    try {
      const [empData, deptData] = await Promise.all([EmployeeService.getAll({}), OrgService.getDepartments()])
      setEmployees(Array.isArray(empData) ? empData : [])
      setDepartments(Array.isArray(deptData) ? deptData : [])
    } catch { }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const filtered = employees.filter(e => {
    const match = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || (e.code || "").toLowerCase().includes(searchQuery.toLowerCase())
    if (deptFilter !== "all" && e.department !== deptFilter) return false
    if (statusFilter !== "all" && e.status !== statusFilter) return false
    return match
  })

  const openAddModal = () => { setEditingItem(null); setForm({ code: `EMP-${Date.now().toString().slice(-4)}`, name: "", department: "", designation: "", email: "", phone: "", status: "Active" }); setIsModalOpen(true) }
  const openEditModal = (item: Employee) => { setEditingItem(item); setForm({ code: item.code, name: item.name, department: item.department, designation: item.designation, email: item.email, phone: item.phone, status: item.status }); setIsModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    await executeWithFeedback(async () => {
      if (editingItem) { await EmployeeService.update(editingItem.id, form) } else { await EmployeeService.create(form) }
    }, { actionType: editingItem ? "update" : "create", successTitle: editingItem ? "Employee Updated" : "Employee Created" })
    setIsModalOpen(false); loadData()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await executeWithFeedback(async () => { await EmployeeService.delete(deleteConfirm.id) }, { actionType: "delete", successTitle: "Employee Deleted" })
    setDeleteConfirm(null); loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <UserCheck className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Employee Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage employee directory and details</p>
        </div>
        {canAdd && <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"><Plus size={14} /><span>Add Employee</span></button>}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer">
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer">
            <option value="all">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr><th className="py-3 px-4">Code</th><th className="py-3 px-4">Name</th><th className="py-3 px-4">Department</th><th className="py-3 px-4">Designation</th><th className="py-3 px-4">Email</th><th className="py-3 px-4">Phone</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-zinc-400">No employees found.</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-blue-600">{item.code}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                    <td className="py-3 px-4">{item.department || "-"}</td>
                    <td className="py-3 px-4">{item.designation || "-"}</td>
                    <td className="py-3 px-4 text-zinc-500">{item.email || "-"}</td>
                    <td className="py-3 px-4">{item.phone || "-"}</td>
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

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">{editingItem ? "Edit" : "Add"} Employee</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Code</label><input type="text" value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Name *</label><input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Department</label><select value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"><option value="">Select</option>{departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Designation</label><input type="text" value={form.designation} onChange={(e) => setForm({...form, designation: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Phone</label><input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
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
              <h3 className="font-bold text-sm">Delete Employee</h3>
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
