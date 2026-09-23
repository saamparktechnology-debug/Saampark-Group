"use client"

import * as React from "react"
import { Check, Plus, Tag } from "lucide-react"
import { LabelItem } from "./ManageLabelsModal"

interface LabelSelectorPopoverProps {
  isOpen: boolean
  onClose: () => void
  availableLabels: LabelItem[]
  currentLabels: string[]
  onToggleLabel: (labelName: string) => void
  onOpenManageModal?: () => void
}

export function LabelSelectorPopover({
  isOpen,
  onClose,
  availableLabels,
  currentLabels,
  onToggleLabel,
  onOpenManageModal,
}: LabelSelectorPopoverProps) {
  const popoverRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-1.5 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
        <span>Change Label</span>
        {onOpenManageModal && (
          <button
            type="button"
            onClick={() => {
              onClose()
              onOpenManageModal()
            }}
            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
          >
            <Tag size={11} /> Manage
          </button>
        )}
      </div>

      <div className="p-1.5 max-h-56 overflow-y-auto space-y-1">
        {(availableLabels || []).map((lbl) => {
          const isAssigned = (currentLabels || []).includes(lbl.name)
          return (
            <button
              key={lbl.id}
              type="button"
              onClick={() => onToggleLabel(lbl.name)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-2xs"
              style={{ backgroundColor: lbl.color || "#a855f7" }}
            >
              <span>{lbl.name}</span>
              {isAssigned && <Check size={14} className="text-white" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
