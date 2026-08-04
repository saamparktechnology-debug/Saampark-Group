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
    <div className={`bg-surface border border-border shadow-soft rounded-lg p-5 flex flex-col bg-white dark:bg-surface ${className}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-muted-foreground" />}
          <h3 className="font-semibold text-[15px] text-foreground/90">{title}</h3>
        </div>
        {action}
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  )
}
