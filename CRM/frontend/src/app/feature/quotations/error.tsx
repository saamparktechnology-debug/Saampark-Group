"use client"

import React from "react"
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"

export default function QuotationsErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("Quotations Route Error Caught:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <AlertCircle size={28} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Quotation View Restored
            </h2>
            <p className="text-xs text-zinc-500">
              A temporary issue occurred while rendering quotation details. You can reload safely.
            </p>
          </div>
        </div>

        {error?.message && (
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-rose-600 dark:text-rose-400 break-words border border-zinc-200 dark:border-zinc-700">
            <strong>Error:</strong> {error.message}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => window.location.href = "/feature/quotations"}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Quotations
          </button>
          <button
            onClick={() => reset()}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> Reload View
          </button>
        </div>
      </div>
    </div>
  )
}

