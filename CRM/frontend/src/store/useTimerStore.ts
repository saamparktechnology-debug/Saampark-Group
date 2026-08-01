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
        set({
          isClockedIn: true,
          clockInTime: Date.now(),
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
        if (get().isClockedIn) {
          set((state) => ({ secondsElapsed: state.secondsElapsed + 1 }))
        }
      }
    }),
    {
      name: "timer-store",
    }
  )
)
