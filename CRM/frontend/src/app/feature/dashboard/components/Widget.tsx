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
    <div className={`liquid-glass-card rounded-2xl p-5 flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/20 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Icon size={16} />
            </div>
          )}
          <h3 className="font-bold text-[15px] tracking-tight text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  )
}
