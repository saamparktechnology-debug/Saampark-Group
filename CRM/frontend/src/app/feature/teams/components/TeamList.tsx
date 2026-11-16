"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Edit, Trash2, UserMinus } from "lucide-react"
import { Team } from "../types"

interface TeamListProps {
  items: Team[]
  viewMode: "grid" | "list"
  selectedTeam: Team | null
  canEdit: boolean
  canDelete: boolean
  onSelectTeam: (team: Team | null) => void
  onEdit: (team: Team) => void
  onDelete: (team: Team) => void
  onRemoveMember: (teamId: string, userId: string) => void
}

export function TeamList({
  items,
  viewMode,
  selectedTeam,
  canEdit,
  canDelete,
  onSelectTeam,
  onEdit,
  onDelete,
  onRemoveMember,
}: TeamListProps) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-zinc-400 text-sm">No teams found.</div>
        ) : (
          items.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {team.name.charAt(0)}
                </div>
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button onClick={() => onEdit(team)} className="p-1 hover:text-blue-600 transition-colors">
                      <Edit size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => onDelete(team)} className="p-1 hover:text-rose-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{team.name}</h3>
              <p className="text-[11px] text-zinc-500 mb-3 line-clamp-2">{team.description || "No description"}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">
                  {team.memberCount || team.members?.length || 0} members
                </span>
                {team.lead && <span className="text-[11px] text-blue-600 font-semibold">Lead: {team.lead}</span>}
              </div>
              {selectedTeam?.id === team.id && selectedTeam.members && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  {selectedTeam.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <img
                          src={m.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${m.name}`}
                          className="w-6 h-6 rounded-full"
                          alt=""
                        />
                        <span>{m.name}</span>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => onRemoveMember(team.id, m.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <UserMinus size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => onSelectTeam(selectedTeam?.id === team.id ? null : team)}
                className="mt-2 text-[11px] text-blue-600 font-semibold hover:underline"
              >
                {selectedTeam?.id === team.id ? "Hide Members" : "View Members"}
              </button>
            </motion.div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
          <tr>
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4">Description</th>
            <th className="py-3 px-4">Lead</th>
            <th className="py-3 px-4">Members</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
          {items.map((team) => (
            <tr key={team.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
              <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{team.name}</td>
              <td className="py-3 px-4 text-zinc-500">{team.description || "-"}</td>
              <td className="py-3 px-4">{team.lead || "-"}</td>
              <td className="py-3 px-4">{team.memberCount || team.members?.length || 0}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-center gap-1.5">
                  {canEdit && (
                    <button onClick={() => onEdit(team)} className="p-1 hover:text-blue-600">
                      <Edit size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => onDelete(team)} className="p-1 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
