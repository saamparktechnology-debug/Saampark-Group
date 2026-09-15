"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Plus, Search, Edit, Trash2, X, UserPlus, UserMinus } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { OrgService } from "@/services/orgService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

interface TeamMember { id: string; name: string; role?: string; avatar?: string }
interface Team { id: string; name: string; description?: string; lead?: string; memberCount?: number; members?: TeamMember[]; status?: string }

export default function TeamsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Teams", "add")
  const canEdit = canPerformAction(user, "Teams", "edit")
  const canDelete = canPerformAction(user, "Teams", "delete")

  const [teams, setTeams] = React.useState<Team[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingTeam, setEditingTeam] = React.useState<Team | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Team | null>(null)
  const [formName, setFormName] = React.useState("")
  const [formDescription, setFormDescription] = React.useState("")
  const [formLead, setFormLead] = React.useState("")

  const loadData = React.useCallback(async () => {
    try { const data = await OrgService.getTeams(); setTeams(Array.isArray(data) ? data : []) } catch { }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()))

  const openAddModal = () => { setEditingTeam(null); setFormName(""); setFormDescription(""); setFormLead(""); setIsModalOpen(true) }
  const openEditModal = (team: Team) => { setEditingTeam(team); setFormName(team.name); setFormDescription(team.description || ""); setFormLead(team.lead || ""); setIsModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return
    const data = { name: formName, description: formDescription, lead: formLead, status: "Active" }
    await executeWithFeedback(async () => {
      if (editingTeam) { await OrgService.updateTeam(editingTeam.id, data) } else { await OrgService.createTeam(data) }
    }, { actionType: editingTeam ? "update" : "create", successTitle: editingTeam ? "Team Updated" : "Team Created" })
    setIsModalOpen(false); loadData()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const second = window.confirm(`⚠️ 2nd CONFIRMATION REQUIRED:\n\nAre you ABSOLUTELY sure you want to permanently delete team "${deleteConfirm.name}"?\n\nThis action cannot be undone.`)
    if (!second) return
    await executeWithFeedback(async () => { await OrgService.deleteTeam(deleteConfirm.id) }, { actionType: "delete", successTitle: "Team Deleted" })
    setDeleteConfirm(null); loadData()
  }

  const handleRemoveMember = async (teamId: string, userId: string) => {
    await executeWithFeedback(async () => { await OrgService.removeTeamMember(teamId, userId) }, { actionType: "delete", successTitle: "Member Removed" })
    loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
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
            <button onClick={() => setViewMode("grid")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"}`}>Grid</button>
            <button onClick={() => setViewMode("list")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"}`}>List</button>
          </div>
          {canAdd && <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"><Plus size={14} /><span>Add Team</span></button>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search teams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.length === 0 ? (
            <div className="col-span-3 py-12 text-center text-zinc-400 text-sm">No teams found.</div>
          ) : (
            filteredTeams.map((team) => (
              <motion.div key={team.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-sm">{team.name.charAt(0)}</div>
                  <div className="flex items-center gap-1">
                    {canEdit && <button onClick={() => openEditModal(team)} className="p-1 hover:text-blue-600 transition-colors"><Edit size={14} /></button>}
                    {canDelete && <button onClick={() => setDeleteConfirm(team)} className="p-1 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>}
                  </div>
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{team.name}</h3>
                <p className="text-[11px] text-zinc-500 mb-3 line-clamp-2">{team.description || "No description"}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">{team.memberCount || team.members?.length || 0} members</span>
                  {team.lead && <span className="text-[11px] text-blue-600 font-semibold">Lead: {team.lead}</span>}
                </div>
                {selectedTeam?.id === team.id && selectedTeam.members && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    {selectedTeam.members.map(m => (
                      <div key={m.id} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2"><img src={m.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${m.name}`} className="w-6 h-6 rounded-full" alt="" /><span>{m.name}</span></div>
                        {canEdit && <button onClick={() => handleRemoveMember(team.id, m.id)} className="text-rose-500 hover:text-rose-700"><UserMinus size={12} /></button>}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setSelectedTeam(selectedTeam?.id === team.id ? null : team)} className="mt-2 text-[11px] text-blue-600 font-semibold hover:underline">{selectedTeam?.id === team.id ? "Hide Members" : "View Members"}</button>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr><th className="py-3 px-4">Name</th><th className="py-3 px-4">Description</th><th className="py-3 px-4">Lead</th><th className="py-3 px-4">Members</th><th className="py-3 px-4 text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {filteredTeams.map(team => (
                <tr key={team.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{team.name}</td>
                  <td className="py-3 px-4 text-zinc-500">{team.description || "-"}</td>
                  <td className="py-3 px-4">{team.lead || "-"}</td>
                  <td className="py-3 px-4">{team.memberCount || team.members?.length || 0}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {canEdit && <button onClick={() => openEditModal(team)} className="p-1 hover:text-blue-600"><Edit size={14} /></button>}
                      {canDelete && <button onClick={() => setDeleteConfirm(team)} className="p-1 hover:text-rose-600"><Trash2 size={14} /></button>}
                    </div>
                  </td>
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
                <h3 className="font-bold text-sm">{editingTeam ? "Edit" : "Add"} Team</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Team Name *</label><input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Description</label><textarea rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                <div><label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Team Lead</label><input type="text" value={formLead} onChange={(e) => setFormLead(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" /></div>
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">{editingTeam ? "Update" : "Create"}</button>
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
              <h3 className="font-bold text-sm">Delete Team</h3>
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
