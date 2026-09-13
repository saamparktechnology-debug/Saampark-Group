import * as React from "react"

export function KPICard({ icon: Icon, colorClass, value, label, subtext, subtextNode }: any) {
  return (
    <div className="liquid-glass-card rounded-2xl p-5 flex items-center justify-between group cursor-default">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${colorClass} shadow-md shrink-0 transition-transform duration-300 group-hover:scale-108 group-hover:rotate-1`}>
        <Icon size={24} />
      </div>
      <div className="text-right flex-1 ml-4">
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {subtextNode ? subtextNode : <p className="text-xs text-muted-foreground/80 mt-1">{subtext}</p>}
      </div>
    </div>
  )
}
