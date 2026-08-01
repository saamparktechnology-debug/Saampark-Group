"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

import { useEventStore, EventCategory } from "@/store/useEventStore"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"

export function EventModal() {
  const { isAddModalOpen, selectedDate, closeAddModal, addEvent } = useEventStore()
  
  const [title, setTitle] = React.useState("")
  const [category, setCategory] = React.useState<EventCategory>("Meeting")

  // Reset form when modal opens
  React.useEffect(() => {
    if (isAddModalOpen) {
      setTitle("")
      setCategory("Meeting")
    }
  }, [isAddModalOpen])

  if (!isAddModalOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    addEvent({
      title,
      start: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
      category,
    })
    closeAddModal()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAddModal}
          className="absolute inset-0 bg-background/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-lg glass-panel rounded-2xl shadow-float overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-surface/50">
            <h2 className="text-xl font-semibold text-foreground">Add New Event</h2>
            <Button variant="ghost" size="icon" onClick={closeAddModal} className="rounded-full">
              <X size={18} />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Event Title</label>
              <Input 
                autoFocus
                placeholder="E.g., Quarterly Review" 
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                <Input 
                  type="date" 
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                  readOnly
                  className="bg-surface-hover/50 text-muted-foreground cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                <select 
                  className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                >
                  <option value="Meeting">Meeting (Blue)</option>
                  <option value="Holiday">Holiday (Green)</option>
                  <option value="Deadline">Deadline (Red)</option>
                  <option value="Training">Training (Purple)</option>
                  <option value="Default">Default (Gray)</option>
                </select>
              </div>
            </div>

            {/* Placeholders for Enterprise fields requested by user */}
            <div className="pt-4 mt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Extended Details (Placeholder)</p>
              <div className="flex gap-2">
                <div className="h-8 flex-1 rounded bg-surface-hover border border-border/50 animate-pulse" />
                <div className="h-8 flex-1 rounded bg-surface-hover border border-border/50 animate-pulse" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4">
              <Button type="button" variant="ghost" onClick={closeAddModal}>Cancel</Button>
              <Button type="submit" variant="primary">Save Event</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
