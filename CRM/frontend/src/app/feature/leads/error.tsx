'use client'

import React from 'react'
import { RotateCw, Target } from 'lucide-react'
import Link from 'next/link'

export default function LeadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('Leads Page Runtime Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
        <Target className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        Unable to load leads
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-2">
        An error occurred while loading your leads pipeline. You can reload this view or return to the dashboard.
      </p>
      {error?.message && (
        <pre className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800 max-w-lg mb-6 overflow-x-auto text-left font-mono">
          {error.message}
        </pre>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-all"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Try again</span>
        </button>
        <Link
          href="/feature/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-xs transition-all"
        >
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  )
}
