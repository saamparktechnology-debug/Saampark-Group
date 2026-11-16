"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BankAccount } from "../types"

interface DeleteBankAccountModalProps {
  item: BankAccount | null
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteBankAccountModal({
  item,
  onCancel,
  onConfirm,
}: DeleteBankAccountModalProps) {
  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <h3 className="font-bold text-sm">Delete Account</h3>
            <p className="text-xs text-zinc-500">
              Are you sure you want to delete <strong>{item.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={onCancel} className="px-3 py-1.5 text-xs text-zinc-500 font-semibold">
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
