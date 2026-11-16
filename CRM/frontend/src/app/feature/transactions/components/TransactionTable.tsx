"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import { formatDisplayDate } from "@/lib/utils"
import { Transaction } from "../types"

interface TransactionTableProps {
  items: Transaction[]
  canDelete: boolean
  onDelete: (item: Transaction) => void
}

export function TransactionTable({ items, canDelete, onDelete }: TransactionTableProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
            <tr>
              <th className="py-3 px-4">Number</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Method</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-400">
                  No transactions found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{item.number}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.type === "Income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">{item.category}</td>
                  <td
                    className={`py-3 px-4 font-bold font-mono ${
                      item.type === "Income" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {item.type === "Income" ? "+" : "-"}₹{(item.amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{formatDisplayDate(item.date)}</td>
                  <td className="py-3 px-4">{item.method}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
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
