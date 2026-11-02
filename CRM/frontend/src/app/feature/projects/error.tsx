'use client'

import React from 'react'
import { RotateCw, LayoutGrid } from 'lucide-react'
import Link from 'next/link'

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('Projects Page Runtime Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
        <LayoutGrid className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        Unable to load projects
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
        An error occurred while loading your projects. You can reload this view or return to the dashboard.
      </p>
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
