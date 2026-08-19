"use client"

import * as React from "react"
import { X, Check, Trash2, Tag } from "lucide-react"

interface ManageTaskLabelsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ManageTaskLabelsModal({ isOpen, onClose }: ManageTaskLabelsModalProps) {
  const [labels, setLabels] = React.useState([
    { id: "1", title: "Design", color: "#10b981" },
    { id: "2", title: "Feedback", color: "#d946ef" },
    { id: "3", title: "Enhancement", color: "#3b82f6" },
    { id: "4", title: "Bug", color: "#ef4444" },
    { id: "5", title: "Urgent", color: "#8b5cf6" },
  ])
  const [newTitle, setNewTitle] = React.useState("")
  const [selectedColor, setSelectedColor] = React.useState("#10b981")

  if (!isOpen) return null

  const handleAdd = () => {
    if (!newTitle.trim()) return
    setLabels([...labels, { id: Date.now().toString(), title: newTitle.trim(), color: selectedColor }])
    setNewTitle("")
  }

  const handleDelete = (id: string) => {
    setLabels(labels.filter((l) => l.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Manage task labels</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600 p-1 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Label title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-9 h-9 p-0.5 rounded cursor-pointer border-0"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Add
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
            {labels.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200/60 dark:border-zinc-700">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{l.title}</span>
                </div>
                <button type="button" onClick={() => handleDelete(l.id)} className="text-zinc-400 hover:text-rose-600 p-1">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
