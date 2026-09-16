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
    <div className={`card-3d rounded-2xl p-5 flex flex-col relative overflow-hidden ${className}`}>
      {/* Top subtle 3D highlight sheen */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50 dark:border-white/5 shrink-0 relative z-10">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
              <Icon size={16} className="drop-shadow-xs" />
            </div>
          )}
          <h3 className="font-bold text-[15px] tracking-tight text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        {children}
      </div>
    </div>
  )
}
