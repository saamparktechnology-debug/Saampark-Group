"use client"

import * as React from "react"
import { ShieldAlert, RefreshCw } from "lucide-react"

export default function ApprovalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("Approvals page error:", error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl bg-surface border border-border shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-black text-foreground">Approvals Center Loading Issue</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          There was an unexpected issue loading the approvals list. Please click below to reload your approvals.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer"
        >
          <RefreshCw size={16} />
          Reload Approvals
        </button>
      </div>
    </div>
  )
}

