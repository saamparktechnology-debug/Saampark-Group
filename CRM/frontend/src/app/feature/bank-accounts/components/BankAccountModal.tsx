"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { BankAccount, BankAccountFormValues } from "../types"

interface BankAccountModalProps {
  isOpen: boolean
  editingItem: BankAccount | null
  values: BankAccountFormValues
  onClose: () => void
  onChange: <K extends keyof BankAccountFormValues>(key: K, value: BankAccountFormValues[K]) => void
  onSubmit: (e: React.FormEvent) => void
}

export function BankAccountModal({
  isOpen,
  editingItem,
  values,
  onClose,
  onChange,
  onSubmit,
}: BankAccountModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm">{editingItem ? "Edit" : "Add"} Bank Account</h3>
              <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  value={values.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  value={values.bankName}
                  onChange={(e) => onChange("bankName", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Account Number</label>
                  <input
                    type="text"
                    value={values.accountNumber}
                    onChange={(e) => onChange("accountNumber", e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={values.ifscCode}
                    onChange={(e) => onChange("ifscCode", e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {editingItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
