"use client"

import * as React from "react"
import { Edit, Trash2 } from "lucide-react"
import { Enquiry } from "../types"

interface EnquiryTableProps {
  items: Enquiry[]
  canEdit: boolean
  canDelete: boolean
  onEdit: (item: Enquiry) => void
  onDelete: (item: Enquiry) => void
}

export function EnquiryTable({ items, canEdit, canDelete, onEdit, onDelete }: EnquiryTableProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
            <tr>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-400">
                  No enquiries found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.subject}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium">
                      {item.source || "Direct"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.priority === "High" || item.priority === "Urgent"
                          ? "bg-rose-50 text-rose-700"
                          : item.priority === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {item.priority || "Medium"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        item.status === "New"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : item.status === "Resolved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-zinc-100 text-zinc-600 border-zinc-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{item.assignedTo || "-"}</td>
                  <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{item.createdAt || "-"}</td>
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
