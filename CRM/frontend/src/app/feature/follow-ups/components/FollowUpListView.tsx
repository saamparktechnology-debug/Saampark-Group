"use client"

import * as React from "react"
import { Calendar, Edit, Mail, Phone, Trash2, Video } from "lucide-react"
import { FollowUp } from "../types"

interface FollowUpListViewProps {
  items: FollowUp[]
  canEdit: boolean
  canDelete: boolean
  onEdit: (item: FollowUp) => void
  onDelete: (item: FollowUp) => void
}

function getTypeIcon(type?: string) {
  switch (type) {
    case "Call":
      return <Phone size={12} className="text-blue-500" />
    case "Email":
      return <Mail size={12} className="text-purple-500" />
    case "Meeting":
      return <Video size={12} className="text-emerald-500" />
    default:
      return <Calendar size={12} className="text-amber-500" />
  }
}

export function FollowUpListView({
  items,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: FollowUpListViewProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
            <tr>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Scheduled</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-400">
                  No follow-ups found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.subject}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {getTypeIcon(item.type)}
                      <span className="text-[11px]">{item.type || "Call"}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{item.scheduledDate || "-"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        item.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "Cancelled"
                          ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{item.assignedTo || "-"}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {canEdit && (
                        <button onClick={() => onEdit(item)} className="p-1 hover:text-blue-600">
                          <Edit size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => onDelete(item)} className="p-1 hover:text-rose-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
