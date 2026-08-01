"use client"

import * as React from "react"
import { create } from "zustand"

// Shared calendar nav state so Toolbar and View stay in sync
interface CalendarNavState {
  currentDate: Date
  view: "month" | "week" | "day" | "agenda"
  goNext: () => void
  goPrev: () => void
  goToday: () => void
  setView: (v: "month" | "week" | "day" | "agenda") => void
}

export const useCalendarNav = create<CalendarNavState>((set) => ({
  currentDate: new Date(),
  view: "month",
  goNext: () => set((s) => {
    const d = new Date(s.currentDate)
    if (s.view === "month") d.setMonth(d.getMonth() + 1)
    else if (s.view === "week") d.setDate(d.getDate() + 7)
    else d.setDate(d.getDate() + 1)
    return { currentDate: d }
  }),
  goPrev: () => set((s) => {
    const d = new Date(s.currentDate)
    if (s.view === "month") d.setMonth(d.getMonth() - 1)
    else if (s.view === "week") d.setDate(d.getDate() - 7)
    else d.setDate(d.getDate() - 1)
    return { currentDate: d }
  }),
  goToday: () => set({ currentDate: new Date() }),
  setView: (view) => set({ view }),
}))
