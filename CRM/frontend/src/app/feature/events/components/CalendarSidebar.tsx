"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Filter, Search } from "lucide-react"

import { useEventStore, EventCategory } from "@/store/useEventStore"
import { Input } from "@/components/ui/Input"

const FILTERS: { label: string; category: EventCategory; colorClass: string }[] = [
  { label: "Meetings", category: "Meeting", colorClass: "bg-blue-500" },
  { label: "Holidays", category: "Holiday", colorClass: "bg-emerald-500" },
  { label: "Deadlines", category: "Deadline", colorClass: "bg-red-500" },
  { label: "Training", category: "Training", colorClass: "bg-purple-500" },
  { label: "Other", category: "Default", colorClass: "bg-slate-500" },
]

export function CalendarSidebar() {
  const { activeFilters, toggleFilter, searchQuery, setSearchQuery } = useEventStore()

  return (
    <div className="w-64 shrink-0 flex flex-col gap-6">
      <div className="glass-panel p-4 rounded-xl">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            className="pl-9 h-9" 
            placeholder="Search events..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel p-5 rounded-xl flex-1">
        <div className="flex items-center gap-2 mb-4 text-foreground font-semibold">
          <Filter size={16} />
          <h3>Filters</h3>
        </div>
        
        <div className="space-y-3">
          {FILTERS.map((f) => {
            const isActive = activeFilters.includes(f.category)
            return (
              <button
                key={f.category}
                onClick={() => toggleFilter(f.category)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full transition-all ${isActive ? f.colorClass : 'bg-surface-hover border border-border'}`} />
                  <span className={`text-sm transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {f.label}
                  </span>
                </div>
                {/* Simulated count badge */}
                <span className="text-xs text-muted-foreground bg-surface-hover px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  {Math.floor(Math.random() * 5) + 1}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-border/50">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Saved Views</h4>
          <div className="space-y-2">
            <button className="text-sm text-foreground hover:text-primary transition-colors block w-full text-left">My Schedule</button>
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full text-left">Engineering Team</button>
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full text-left">Project Alpha</button>
          </div>
        </div>
      </div>
    </div>
  )
}
