"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Calendar as CalendarIcon, MapPin, Users, Tag, Clock, Edit2, Trash2 } from "lucide-react"
import { format } from "date-fns"

import { useEventStore } from "@/store/useEventStore"
import { Button } from "@/components/ui/Button"

export function EventDrawer() {
  const { isDrawerOpen, selectedEvent, closeEventDrawer, deleteEvent, openAddModal } = useEventStore()

  if (!selectedEvent) return null

  const handleDelete = () => {
    deleteEvent(selectedEvent.id)
    closeEventDrawer()
  }

  const handleEdit = () => {
    // Basic implementation: opens modal with current event data (to be extended)
    openAddModal(new Date(selectedEvent.start))
    closeEventDrawer()
  }

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEventDrawer}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-screen w-full max-w-md glass-panel border-l border-border z-50 flex flex-col shadow-float"
          >
            {/* Header Area with Color Banner */}
            <div className={`h-24 w-full rounded-tl-xl ${selectedEvent.className} bg-opacity-20 flex items-start justify-end p-4 border-b-0`}>
              <Button variant="ghost" size="icon" onClick={closeEventDrawer} className="bg-surface/50 backdrop-blur-md rounded-full hover:bg-surface">
                <X size={18} />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 -mt-10">
              <div className="bg-surface rounded-xl p-6 shadow-soft border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${selectedEvent.className}`}>
                    {selectedEvent.category}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-foreground mb-4">{selectedEvent.title}</h2>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Clock size={18} className="mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        {format(new Date(selectedEvent.start), "EEEE, MMMM d, yyyy")}
                      </p>
                      {!selectedEvent.allDay && (
                        <p className="text-sm">
                          {format(new Date(selectedEvent.start), "h:mm a")} 
                          {selectedEvent.end ? ` - ${format(new Date(selectedEvent.end), "h:mm a")}` : ""}
                        </p>
                      )}
                      {selectedEvent.allDay && <p className="text-sm">All Day</p>}
                    </div>
                  </div>

                  {selectedEvent.location && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin size={18} />
                      <span className="text-sm">{selectedEvent.location}</span>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Tag size={16} /> Description
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Placeholders for Enterprise features */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Users size={16} /> Guests (Placeholder)
                    </h4>
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-surface bg-muted flex items-center justify-center text-xs font-medium">
                          U{i}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border/50 bg-surface/50 backdrop-blur-md flex items-center justify-between">
              <Button variant="danger" size="sm" leftIcon={<Trash2 size={16} />} onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="primary" size="sm" leftIcon={<Edit2 size={16} />} onClick={handleEdit}>
                Edit Event
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
