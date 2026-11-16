"use client"

import * as React from "react"
import { Landmark, Edit, Trash2 } from "lucide-react"
import { BankAccount } from "../types"

interface BankAccountCardProps {
  item: BankAccount
  canEdit: boolean
  canDelete: boolean
  onEdit: (item: BankAccount) => void
  onDelete: (item: BankAccount) => void
}

export function BankAccountCard({
  item,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: BankAccountCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-sm">
          <Landmark size={18} />
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
      <p className="text-[11px] text-zinc-500 mb-2">{item.bankName}</p>
      <p className="text-[11px] text-zinc-400 font-mono mb-3">
        ****{item.accountNumber?.slice(-4) || "0000"}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          ₹{(item.balance || 0).toLocaleString("en-IN")}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            item.status === "Active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {item.status}
        </span>
      </div>
    </div>
  )
}
