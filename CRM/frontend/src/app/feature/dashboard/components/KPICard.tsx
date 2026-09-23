import * as React from "react"

export function KPICard({ icon: Icon, colorClass, value, label, subtext, subtextNode }: any) {
  return (
    <div className="card-3d rounded-2xl p-5 flex items-center justify-between group cursor-default relative overflow-hidden transition-all duration-300">
      {/* Top 3D specular highlight shine */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white dark:via-white/30 to-transparent pointer-events-none z-20" />
      
      {/* Subtle ambient light angle */}
      <div className="absolute -top-12 -left-12 w-28 h-28 bg-white/40 dark:bg-white/5 rounded-full blur-xl pointer-events-none" />

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${colorClass} kpi-plate-3d shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1 relative z-10 shadow-lg`}>
        <Icon size={24} className="drop-shadow-md" />
      </div>
      
      <div className="text-right flex-1 ml-4 relative z-10">
        <div className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 dark:text-white drop-shadow-2xs">{value}</div>
        {label && <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>}
        {subtextNode ? (
          subtextNode
        ) : subtext ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">{subtext}</p>
        ) : null}
      </div>
    </div>
  )
}

