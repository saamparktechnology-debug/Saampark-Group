"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Plus, Search } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { Enquiry } from "./types"
import {
  useDeleteEnquiryMutation,
  useEnquiriesQuery,
  useSaveEnquiryMutation,
} from "./hooks/useEnquiries"
import { useEnquiryForm } from "./hooks/useEnquiryForm"
import { EnquiryModal } from "./components/EnquiryModal"
import { EnquiryTable } from "./components/EnquiryTable"

export default function EnquiriesMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAdd = canPerformAction(user, "Leads", "add")
  const canEdit = canPerformAction(user, "Leads", "edit")
  const canDelete = canPerformAction(user, "Leads", "delete")

  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [priorityFilter, setPriorityFilter] = React.useState("all")
  const [deleteConfirm, setDeleteConfirm] = React.useState<Enquiry | null>(null)

  const { data: enquiries = [] } = useEnquiriesQuery()
  const saveMutation = useSaveEnquiryMutation()
  const deleteMutation = useDeleteEnquiryMutation()

  const form = useEnquiryForm(saveMutation.mutateAsync)

  const filtered = React.useMemo(() => {
    const query = searchQuery.toLowerCase()
    return enquiries.filter((item) => {
      const match = item.subject.toLowerCase().includes(query)
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false
      return match
    })
  }, [enquiries, searchQuery, statusFilter, priorityFilter])

  const handleDelete = async () => {
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
            <MessageSquare className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Enquiry Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Track and manage customer enquiries</p>
        </div>
        {canAdd && (
          <button
            onClick={form.openAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Add Enquiry</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search enquiries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      <EnquiryTable
        items={filtered}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={form.openEdit}
        onDelete={setDeleteConfirm}
      />

      <EnquiryModal
        isOpen={form.isOpen}
        editingItem={form.editingItem}
        values={form.values}
        onClose={form.close}
        onChange={form.updateField}
        onSubmit={form.handleSubmit}
      />

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <h3 className="font-bold text-sm">Delete Enquiry</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to delete <strong>{deleteConfirm.subject}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-3 py-1.5 text-xs text-zinc-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
