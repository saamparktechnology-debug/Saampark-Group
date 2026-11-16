"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Users } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { Team } from "./types"
import {
  useDeleteTeamMutation,
  useRemoveTeamMemberMutation,
  useSaveTeamMutation,
  useTeamsQuery,
} from "./hooks/useTeams"
import { useTeamForm } from "./hooks/useTeamForm"
import { TeamModal } from "./components/TeamModal"
import { TeamList } from "./components/TeamList"

export default function TeamsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAdd = canPerformAction(user, "Teams", "add")
  const canEdit = canPerformAction(user, "Teams", "edit")
  const canDelete = canPerformAction(user, "Teams", "delete")

  const [searchQuery, setSearchQuery] = React.useState("")
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Team | null>(null)

  const { data: teams = [] } = useTeamsQuery()
  const saveMutation = useSaveTeamMutation()
  const deleteMutation = useDeleteTeamMutation()
  const removeMemberMutation = useRemoveTeamMemberMutation()

  const form = useTeamForm(saveMutation.mutateAsync)

  const filteredTeams = React.useMemo(() => {
    const query = searchQuery.toLowerCase()
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.description || "").toLowerCase().includes(query)
    )
  }, [teams, searchQuery])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const confirmed = window.confirm(
      `⚠️ 2nd CONFIRMATION REQUIRED:\n\nAre you ABSOLUTELY sure you want to permanently delete team "${deleteConfirm.name}"?\n\nThis action cannot be undone.`
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const handleRemoveMember = async (teamId: string, userId: string) => {
    await removeMemberMutation.mutateAsync({ teamId, userId })
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
            <Users className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Team Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage teams and their members</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === "grid" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === "list" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"
              }`}
            >
              List
            </button>
          </div>
          {canAdd && (
            <button
              onClick={form.openAdd}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span>Add Team</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <TeamList
        items={filteredTeams}
        viewMode={viewMode}
        selectedTeam={selectedTeam}
        canEdit={canEdit}
        canDelete={canDelete}
        onSelectTeam={setSelectedTeam}
        onEdit={form.openEdit}
        onDelete={setDeleteConfirm}
        onRemoveMember={handleRemoveMember}
      />

      <TeamModal
        isOpen={form.isOpen}
        editingTeam={form.editingTeam}
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
              <h3 className="font-bold text-sm">Delete Team</h3>
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
