import * as React from "react"

export function KPICard({ icon: Icon, colorClass, value, label, subtext, subtextNode }: any) {
  return (
    <div className="bg-white dark:bg-surface border border-border shadow-soft rounded-lg p-5 flex items-center justify-between">
      <div className={`w-14 h-14 rounded-md flex items-center justify-center text-white ${colorClass} shadow-sm shrink-0`}>
        <Icon size={24} />
      </div>
      <div className="text-right flex-1 ml-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subtextNode ? subtextNode : <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </div>
    </div>
  )
}
