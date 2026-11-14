import * as React from "react"

interface WidgetProps {
  title: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
  icon?: React.ElementType
}

export function Widget({ title, children, className = "", action, icon: Icon }: WidgetProps) {
  return (
    <div className={`card-3d rounded-2xl p-5 flex flex-col relative overflow-hidden transition-all duration-300 ${className}`}>
      {/* Top specular 3D highlight sheen */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white dark:via-white/30 to-transparent pointer-events-none z-20" />
      
      {/* Ambient background light */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/[0.02] dark:bg-blue-500/[0.04] rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5 shrink-0 relative z-10">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-700/40 shadow-xs">
              <Icon size={16} className="drop-shadow-xs" />
            </div>
          )}
          <h3 className="font-extrabold text-[15px] tracking-tight text-slate-900 dark:text-white">{title}</h3>
        </div>
        {action}
      </div>
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        {children}
      </div>
    </div>
  )
}

