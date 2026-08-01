"use client"

import * as React from "react"
import { format, isSameDay } from "date-fns"
import { Bell, Clock, Info } from "lucide-react"

import { useEventStore } from "@/store/useEventStore"

export function CalendarRightPanel() {
  const { events, openEventDrawer } = useEventStore()
  
  // Get today's events
  const today = new Date()
  const todaysEvents = events.filter(e => isSameDay(new Date(e.start), today))

  return (
    <div className="w-72 shrink-0 flex flex-col gap-6 hidden xl:flex">
      <div className="glass-panel p-5 rounded-xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock size={16} className="text-primary" />
          Today's Schedule
        </h3>
        
        {todaysEvents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-3">
              <Info size={20} />
            </div>
            <p className="text-sm">No events scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysEvents.map(event => (
              <div 
                key={event.id}
                onClick={() => openEventDrawer(event)}
                className="p-3 rounded-lg bg-surface hover:bg-surface-hover border border-border cursor-pointer transition-colors shadow-sm relative overflow-hidden"
              >
                {/* Category color accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${event.className.replace('event-', 'bg-').replace('meeting', 'blue-500').replace('holiday', 'emerald-500').replace('deadline', 'red-500').replace('training', 'purple-500')}`} style={{ backgroundColor: 'currentColor' }} />
                
                <h4 className="text-sm font-medium text-foreground truncate pl-2">{event.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 pl-2">
                  {event.allDay ? 'All Day' : format(new Date(event.start), 'h:mm a')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel p-5 rounded-xl flex-1">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bell size={16} className="text-warning" />
          Reminders
        </h3>
        
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-warning mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Review Q3 Report</p>
              <p className="text-xs text-muted-foreground">Due Tomorrow</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-info mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Submit Timesheet</p>
              <p className="text-xs text-muted-foreground">In 2 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
