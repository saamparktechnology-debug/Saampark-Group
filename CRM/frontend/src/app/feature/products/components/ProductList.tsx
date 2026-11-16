"use client"

import * as React from "react"
import { Edit, Trash2 } from "lucide-react"
import { Product } from "../types"

interface ProductListProps {
  items: Product[]
  viewMode: "table" | "grid"
  canEdit: boolean
  canDelete: boolean
  onEdit: (item: Product) => void
  onDelete: (item: Product) => void
}

export function ProductList({
  items,
  viewMode,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: ProductListProps) {
  if (viewMode === "table") {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-blue-600">{item.sku}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium">
                        {item.category || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold font-mono">
                      ₹{(item.price || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          (item.stock || 0) < 10 ? "text-rose-600" : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {item.stock || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          item.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-100 text-zinc-600 border-zinc-200"
                        }`}
                      >
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-sm">
              {item.name.charAt(0)}
            </div>
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
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{item.name}</h3>
          <p className="text-[11px] text-zinc-400 mb-2">
            {item.sku} | {item.category || "Uncategorized"}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              ₹{(item.price || 0).toLocaleString("en-IN")}
            </span>
            <span
              className={`text-[11px] font-bold ${
                (item.stock || 0) < 10 ? "text-rose-600" : "text-zinc-500"
              }`}
            >
              {item.stock || 0} in stock
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
