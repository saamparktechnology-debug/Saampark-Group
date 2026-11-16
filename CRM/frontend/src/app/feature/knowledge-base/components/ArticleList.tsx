"use client"

import * as React from "react"
import { Edit, Eye, Trash2 } from "lucide-react"
import { KnowledgeArticle } from "../types"

interface ArticleListProps {
  items: KnowledgeArticle[]
  viewMode: "grid" | "list"
  canEdit: boolean
  canDelete: boolean
  onEdit: (item: KnowledgeArticle) => void
  onDelete: (item: KnowledgeArticle) => void
}

export function ArticleList({
  items,
  viewMode,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: ArticleListProps) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-zinc-400 text-sm">No articles found.</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  {item.category}
                </span>
                <div className="flex items-center gap-1">
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
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2">
                {item.title}
              </h3>
              <p className="text-[11px] text-zinc-500 mb-3 line-clamp-3">
                {item.content || "No content"}
              </p>
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>{item.author || "Admin"}</span>
                <span className="flex items-center gap-1">
                  <Eye size={11} />
                  {item.views || 0} views
                </span>
              </div>
            </div>
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
            <th className="py-3 px-4">Title</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Views</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
              <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium">
                  {item.category}
                </span>
              </td>
              <td className="py-3 px-4">{item.views || 0}</td>
              <td className="py-3 px-4">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                  {item.status}
                </span>
              </td>
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
          ))}
        </tbody>
      </table>
    </div>
  )
}
