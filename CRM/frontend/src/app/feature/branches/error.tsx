"use client"

import React from "react"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

export default function BranchesErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("Branches Route Error Boundary Caught:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-2xl border border-rose-200 dark:border-rose-800">
            <AlertCircle size={28} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Branch View Encountered an Error
            </h2>
            <p className="text-xs text-zinc-500">
              A temporary runtime issue occurred while loading branch details.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-mono break-words overflow-auto max-h-48">
          {error?.message || "Unknown client error"}
          {error?.digest && (
            <div className="text-[10px] text-zinc-400 mt-1">Digest: {error.digest}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => window.location.href = "/"}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Home size={14} /> Back to Dashboard
          </button>
          <button
            onClick={() => reset()}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> Try Reloading
          </button>
        </div>
      </div>
    </div>
  )
}

