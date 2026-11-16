"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FolderOpen, Search, Upload, AlertTriangle } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { isRecordAssignedToClient, isRecordAssignedToTeamMember } from "@/lib/clientScopeUtils"
import { DocumentItem } from "./types"
import {
  useCreateDocumentMutation,
  useDeleteDocumentMutation,
  useDocumentsQuery,
  useExpiringDocumentsQuery,
} from "./hooks/useDocuments"
import { useDocumentForm } from "./hooks/useDocumentForm"
import { UploadDocumentModal } from "./components/UploadDocumentModal"
import { DocumentTable } from "./components/DocumentTable"

export default function DocumentsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const isClientUser = user?.role === "Clients" || user?.role?.toLowerCase().includes("client")
  const isTeamUser = user?.role === "Teams" || (user?.role as string) === "Team"
  const canAdd = !isClientUser && canPerformAction(user, "Files", "add")
  const canDelete = !isClientUser && canPerformAction(user, "Files", "delete")

  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [deleteConfirm, setDeleteConfirm] = React.useState<DocumentItem | null>(null)

  const { data: documents = [] } = useDocumentsQuery()
  const { data: expiringDocs = [] } = useExpiringDocumentsQuery()
  const createMutation = useCreateDocumentMutation()
  const deleteMutation = useDeleteDocumentMutation()

  const form = useDocumentForm(user?.name || "Admin", createMutation.mutateAsync)

  const filterByRoleScope = React.useCallback(
    (list: DocumentItem[]) => {
      if (isClientUser) {
        return list.filter(
          (d) =>
            isRecordAssignedToClient(d, user) ||
            (d.uploadedBy && d.uploadedBy.toLowerCase() === (user?.name || "").toLowerCase())
        )
      }
      if (isTeamUser) {
        return list.filter(
          (d) =>
            isRecordAssignedToTeamMember(d, user) ||
            (d.uploadedBy && d.uploadedBy.toLowerCase() === (user?.name || "").toLowerCase())
        )
      }
      return list
    },
    [isClientUser, isTeamUser, user]
  )

  const filtered = React.useMemo(() => {
    const query = searchQuery.toLowerCase()
    return filterByRoleScope(documents).filter((d) => {
      const match = d.name.toLowerCase().includes(query)
      if (categoryFilter !== "all" && d.category !== categoryFilter) return false
      return match
    })
  }, [documents, filterByRoleScope, searchQuery, categoryFilter])

  const scopedExpiringDocs = React.useMemo(
    () => filterByRoleScope(expiringDocs),
    [expiringDocs, filterByRoleScope]
  )

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
            <FolderOpen className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Document Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage uploaded documents and files</p>
        </div>
        {canAdd && (
          <button
            onClick={form.openAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Upload size={14} />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {scopedExpiringDocs.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">Expiring Soon</h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
              {scopedExpiringDocs.length} document(s) expiring within 30 days
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer"
        >
          <option value="all">All Categories</option>
          <option value="General">General</option>
          <option value="Contracts">Contracts</option>
          <option value="Invoices">Invoices</option>
          <option value="Legal">Legal</option>
        </select>
      </div>

      <DocumentTable items={filtered} canDelete={canDelete} onDelete={setDeleteConfirm} />

      <UploadDocumentModal
        isOpen={form.isOpen}
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
              <h3 className="font-bold text-sm">Delete Document</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
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
