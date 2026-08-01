import * as React from "react"
import { ShieldCheck } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background ambient mesh */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border shadow-soft flex items-center justify-center text-primary mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 animate-pulse" />
          <ShieldCheck size={32} className="relative z-10" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight mb-2">SAAMPARK</h1>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
