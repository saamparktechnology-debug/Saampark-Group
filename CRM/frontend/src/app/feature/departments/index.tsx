"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Layers, Plus, Search, Edit, Trash2, Users, X } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { OrgService } from "@/services/orgService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

type Tab = "departments" | "designations"

interface Department { id: string; name: string; code?: string; head?: string; memberCount?: number; status: string }
interface Designation { id: string; name: string; level?: string; status: string }

export default function DepartmentsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Settings", "add")
  const canEdit = canPerformAction(user, "Settings", "edit")
  const canDelete = canPerformAction(user, "Settings", "delete")

  const [activeTab, setActiveTab] = React.useState<Tab>("departments")
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [designations, setDesignations] = React.useState<Designation[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Department | Designation | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ id: string; name: string } | null>(null)
  const [formName, setFormName] = React.useState("")
  const [formCode, setFormCode] = React.useState("")
  const [formHead, setFormHead] = React.useState("")
  const [formLevel, setFormLevel] = React.useState("")

  const loadData = React.useCallback(async () => {
    try {
      const [deptData, desigData] = await Promise.all([OrgService.getDepartments(), OrgService.getDesignations()])
      setDepartments(Array.isArray(deptData) ? deptData : [])
      setDesignations(Array.isArray(desigData) ? desigData : [])
    } catch { }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const filteredDepartments = departments.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.code || "").toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredDesignations = designations.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const openAddModal = () => { setEditingItem(null); setFormName(""); setFormCode(""); setFormHead(""); setFormLevel(""); setIsModalOpen(true) }
  const openEditModal = (item: Department | Designation) => { setEditingItem(item); setFormName(item.name); setFormCode((item as Department).code || ""); setFormHead((item as Department).head || ""); setFormLevel((item as Designation).level || ""); setIsModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return
    if (activeTab === "departments") {
      const data = { name: formName, code: formCode, head: formHead, status: "Active" }
      await executeWithFeedback(async () => {
        if (editingItem) { await OrgService.updateDepartment(editingItem.id, data) } else { await OrgService.createDepartment(data) }
      }, { actionType: editingItem ? "update" : "create", successTitle: editingItem ? "Department Updated" : "Department Created" })
    } else {
      const data = { name: formName, level: formLevel, status: "Active" }
      await executeWithFeedback(async () => {
        if (editingItem) { await OrgService.updateDesignation(editingItem.id, data) } else { await OrgService.createDesignation(data) }
      }, { actionType: editingItem ? "update" : "create", successTitle: editingItem ? "Designation Updated" : "Designation Created" })
    }
    setIsModalOpen(false); loadData()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await executeWithFeedback(async () => {
      if (activeTab === "departments") { await OrgService.deleteDepartment(deleteConfirm.id) } else { await OrgService.deleteDesignation(deleteConfirm.id) }
    }, { actionType: "delete", successTitle: "Deleted" })
    setDeleteConfirm(null); loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Layers className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Department & Designation Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage organizational departments and designation levels</p>
        </div>
        {canAdd && <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"><Plus size={14} /><span>Add {activeTab === "departments" ? "Department" : "Designation"}</span></button>}
      </div>

      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <button onClick={() => setActiveTab("departments")} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${activeTab === "departments" ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}>
          <Layers size={14} /><span>Departments</span><span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800">{departments.length}</span>
        </button>
        <button onClick={() => setActiveTab("designations")} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${activeTab === "designations" ? "border-emerald-600 text-emerald-600 bg-emerald-50/50" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}>
          <Users size={14} /><span>Designations</span><span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800">{designations.length}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Name</th>
                {activeTab === "departments" && <th className="py-3 px-4">Code</th>}
                {activeTab === "departments" && <th className="py-3 px-4">Head</th>}
                {activeTab === "departments" && <th className="py-3 px-4">Members</th>}
                {activeTab === "designations" && <th className="py-3 px-4">Level</th>}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {(activeTab === "departments" ? filteredDepartments : filteredDesignations).length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-zinc-400">No records found.</td></tr>
              ) : (
                (activeTab === "departments" ? filteredDepartments : filteredDesignations).map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                    {activeTab === "departments" && <td className="py-3 px-4 font-mono text-[11px] text-blue-600">{(item as Department).code || "-"}</td>}
                    {activeTab === "departments" && <td className="py-3 px-4">{(item as Department).head || "-"}</td>}
                    {activeTab === "departments" && <td className="py-3 px-4">{(item as Department).memberCount || 0}</td>}
                    {activeTab === "designations" && <td className="py-3 px-4">{(item as Designation).level || "-"}</td>}
                    <td className="py-3 px-4"><span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">{item.status}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {canEdit && <button onClick={() => openEditModal(item)} className="p-1 hover:text-blue-600 transition-colors"><Edit size={14} /></button>}
                        {canDelete && <button onClick={() => setDeleteConfirm({ id: item.id, name: item.name })} className="p-1 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>}
                      </div>
                    </td>
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">{editingItem ? "Edit" : "Add"} {activeTab === "departments" ? "Department" : "Designation"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Name *</label>
                  <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
                </div>
                {activeTab === "departments" && (
                  <>
                    <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Code</label><input type="text" value={formCode} onChange={(e) => setFormCode(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                    <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Head</label><input type="text" value={formHead} onChange={(e) => setFormHead(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                  </>
                )}
                {activeTab === "designations" && (
                  <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Level</label><input type="text" value={formLevel} onChange={(e) => setFormLevel(e.target.value)} placeholder="e.g. Senior, Junior, Lead" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                )}
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
              <h3 className="font-bold text-sm">Confirm Delete</h3>
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
