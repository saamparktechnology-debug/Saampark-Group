"use client"

import * as React from "react"
import { Edit, Trash2 } from "lucide-react"
import { Department, DepartmentTab, Designation } from "../types"

interface DepartmentTableProps {
  activeTab: DepartmentTab
  items: (Department | Designation)[]
  canEdit: boolean
  canDelete: boolean
  onEdit: (item: Department | Designation) => void
  onDelete: (item: { id: string; name: string }) => void
}

export function DepartmentTable({
  activeTab,
  items,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: DepartmentTableProps) {
  return (
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
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-400">
                  No records found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                  {activeTab === "departments" && (
                    <td className="py-3 px-4 font-mono text-[11px] text-blue-600">
                      {(item as Department).code || "-"}
                    </td>
                  )}
                  {activeTab === "departments" && (
                    <td className="py-3 px-4">{(item as Department).head || "-"}</td>
                  )}
                  {activeTab === "departments" && (
                    <td className="py-3 px-4">{(item as Department).memberCount || 0}</td>
                  )}
                  {activeTab === "designations" && (
                    <td className="py-3 px-4">{(item as Designation).level || "-"}</td>
                  )}
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {canEdit && (
                        <button onClick={() => onEdit(item)} className="p-1 hover:text-blue-600 transition-colors">
                          <Edit size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => onDelete({ id: item.id, name: item.name })}
                          className="p-1 hover:text-rose-600 transition-colors"
                        >
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
