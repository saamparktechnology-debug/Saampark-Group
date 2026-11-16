"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Plus, Search } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { Meeting } from "./types"
import {
  useDeleteMeetingMutation,
  useMeetingsQuery,
  useSaveMeetingMutation,
} from "./hooks/useMeetings"
import { useMeetingForm } from "./hooks/useMeetingForm"
import { MeetingModal } from "./components/MeetingModal"
import { MeetingTable } from "./components/MeetingTable"

export default function MeetingsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAdd = canPerformAction(user, "Leads", "add")
  const canEdit = canPerformAction(user, "Leads", "edit")
  const canDelete = canPerformAction(user, "Leads", "delete")

  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [deleteConfirm, setDeleteConfirm] = React.useState<Meeting | null>(null)

  const { data: meetings = [] } = useMeetingsQuery()
  const saveMutation = useSaveMeetingMutation()
  const deleteMutation = useDeleteMeetingMutation()

  const form = useMeetingForm(user?.name || "", saveMutation.mutateAsync)

  const filtered = React.useMemo(() => {
    const query = searchQuery.toLowerCase()
    return meetings.filter((m) => {
      const match = m.title.toLowerCase().includes(query)
      if (statusFilter !== "all" && m.status !== statusFilter) return false
      return match
    })
  }, [meetings, searchQuery, statusFilter])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const confirmed = window.confirm(
      `⚠️ 2nd CONFIRMATION REQUIRED:\n\nAre you ABSOLUTELY sure you want to permanently delete meeting "${deleteConfirm.title}"?\n\nThis action cannot be undone.`
    )
    if (!confirmed) return
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
            <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Meeting Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Schedule and manage meetings</p>
        </div>
        {canAdd && (
          <button
            onClick={form.openAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Add Meeting</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <MeetingTable
        items={filtered}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={form.openEdit}
        onDelete={setDeleteConfirm}
      />

      <MeetingModal
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
              <h3 className="font-bold text-sm">Delete Meeting</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to delete <strong>{deleteConfirm.title}</strong>?
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
