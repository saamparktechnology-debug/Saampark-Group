import * as React from "react"

export function KPICard({ icon: Icon, colorClass, value, label, subtext, subtextNode }: any) {
  return (
    <div className="card-3d rounded-2xl p-5 flex items-center justify-between group cursor-default relative overflow-hidden">
      {/* Top subtle 3D highlight sheen */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none" />
      
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${colorClass} kpi-plate-3d shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-1 relative z-10`}>
        <Icon size={24} className="drop-shadow-sm" />
      </div>
      <div className="text-right flex-1 ml-4 relative z-10">
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        {subtextNode ? subtextNode : <p className="text-xs text-muted-foreground/80 mt-1 font-medium">{subtext}</p>}
      </div>
    </div>
  )
}
