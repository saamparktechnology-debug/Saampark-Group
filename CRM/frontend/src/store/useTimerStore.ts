import { create } from "zustand"
import { persist } from "zustand/middleware"

interface TimerState {
  isClockedIn: boolean
  clockInTime: number | null
  secondsElapsed: number
  clockIn: () => void
  clockOut: () => void
  tick: () => void
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isClockedIn: false,
      clockInTime: null,
      secondsElapsed: 0,
      
      clockIn: () => {
        const now = Date.now()
        set({
          isClockedIn: true,
          clockInTime: now,
          secondsElapsed: 0
        })
      },
      
      clockOut: () => {
        set({
          isClockedIn: false,
          clockInTime: null,
        })
      },
      
      tick: () => {
        const { isClockedIn, clockInTime } = get()
        if (isClockedIn && clockInTime) {
          const elapsed = Math.floor((Date.now() - clockInTime) / 1000)
          set({ secondsElapsed: Math.max(0, elapsed) })
        }
      }
    }),
    {
      name: "saampark-timer-store",
    }
  )
)
