"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "./Button"

interface RowActionsProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  extraActions?: { label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[]
}

export function RowActions({ onView, onEdit, onDelete, extraActions }: RowActionsProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
      >
        <MoreHorizontal size={15} />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border shadow-lg rounded-xl overflow-hidden z-50 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {onView && (
              <button
                onClick={() => { onView(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
              >
                <Eye size={13} /> View Details
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => { onEdit(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
              >
                <Pencil size={13} /> Edit
              </button>
            )}
            {extraActions?.map((a) => (
              <button
                key={a.label}
                onClick={() => { a.onClick(); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  a.danger
                    ? "text-danger hover:bg-danger/10"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {a.icon} {a.label}
              </button>
            ))}
            {onDelete && (
              <>
                <div className="border-t border-border/50 my-1" />
                <button
                  onClick={() => { onDelete(); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
