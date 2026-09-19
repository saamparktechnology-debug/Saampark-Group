import { create } from "zustand"
import { persist } from "zustand/middleware"

export type WorkMode = "Office" | "Work From Home" | "Field / Client Visit"

interface TimerState {
  isClockedIn: boolean
  isOnBreak: boolean
  clockInTime: number | null
  clockInDate: string | null
  clockInTimeString: string | null
  workMode: WorkMode
  breakStartTime: number | null
  breakSeconds: number
  shiftNotes: string
  secondsElapsed: number

  clockIn: (mode?: WorkMode, notes?: string) => void
  startBreak: () => void
  endBreak: () => void
  clockOut: () => void
  setWorkMode: (mode: WorkMode) => void
  setShiftNotes: (notes: string) => void
  tick: () => void
  reset: () => void
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isClockedIn: false,
      isOnBreak: false,
      clockInTime: null,
      clockInDate: null,
      clockInTimeString: null,
      workMode: "Office",
      breakStartTime: null,
      breakSeconds: 0,
      shiftNotes: "",
      secondsElapsed: 0,
      
      clockIn: (mode = "Office", notes = "") => {
        const now = Date.now()
        const nowDate = new Date()
        const timeString = nowDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        const dateString = nowDate.toISOString().split("T")[0]
        set({
          isClockedIn: true,
          isOnBreak: false,
          clockInTime: now,
          clockInDate: dateString,
          clockInTimeString: timeString,
          workMode: mode,
          breakStartTime: null,
          breakSeconds: 0,
          shiftNotes: notes,
          secondsElapsed: 0
        })
      },
      
      startBreak: () => {
        const { isClockedIn, isOnBreak } = get()
        if (!isClockedIn || isOnBreak) return
        set({
          isOnBreak: true,
          breakStartTime: Date.now()
        })
      },

      endBreak: () => {
        const { isOnBreak, breakStartTime, breakSeconds } = get()
        if (!isOnBreak) return
        const addedBreak = breakStartTime ? Math.floor((Date.now() - breakStartTime) / 1000) : 0
        set({
          isOnBreak: false,
          breakStartTime: null,
          breakSeconds: breakSeconds + addedBreak
        })
      },

      clockOut: () => {
        const { isOnBreak, breakStartTime, breakSeconds } = get()
        let finalBreakSeconds = breakSeconds
        if (isOnBreak && breakStartTime) {
          finalBreakSeconds += Math.floor((Date.now() - breakStartTime) / 1000)
        }
        set({
          isClockedIn: false,
          isOnBreak: false,
          clockInTime: null,
          clockInDate: null,
          clockInTimeString: null,
          breakStartTime: null,
          breakSeconds: 0,
          shiftNotes: "",
          secondsElapsed: 0
        })
      },
      
      setWorkMode: (mode: WorkMode) => set({ workMode: mode }),
      setShiftNotes: (notes: string) => set({ shiftNotes: notes }),

      tick: () => {
        const { isClockedIn, isOnBreak, clockInTime, breakStartTime, breakSeconds } = get()
        if (isClockedIn && clockInTime) {
          const rawElapsed = Math.floor((Date.now() - clockInTime) / 1000)
          let currentBreak = breakSeconds
          if (isOnBreak && breakStartTime) {
            currentBreak += Math.floor((Date.now() - breakStartTime) / 1000)
          }
          const netWorking = Math.max(0, rawElapsed - currentBreak)
          set({ secondsElapsed: netWorking })
        }
      },

      reset: () => {
        set({
          isClockedIn: false,
          isOnBreak: false,
          clockInTime: null,
          clockInDate: null,
          clockInTimeString: null,
          workMode: "Office",
          breakStartTime: null,
          breakSeconds: 0,
          shiftNotes: "",
          secondsElapsed: 0
        })
      }
    }),
    {
      name: "saampark-timer-store",
    }
  )
)
