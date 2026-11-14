"use client"

import { create } from "zustand"

export type FeedbackActionType = "create" | "update" | "delete" | "process" | "sync" | "payment"

export interface FeedbackState {
  isOpen: boolean
  status: "idle" | "loading" | "success" | "error"
  actionType: FeedbackActionType
  title: string
  message: string
  autoCloseTimeout?: number
  onRetry?: (() => void) | null

  // Actions
  startLoading: (opts: {
    title?: string
    message?: string
    actionType?: FeedbackActionType
  }) => void
  showSuccess: (opts: {
    title?: string
    message?: string
    actionType?: FeedbackActionType
    durationMs?: number
  }) => void
  showError: (opts: {
    title?: string
    message?: string
    actionType?: FeedbackActionType
    onRetry?: () => void
  }) => void
  close: () => void
}

// Web Audio API soft synthesis for pleasant audio-tactile feedback
function playChime(type: "success" | "error") {
  if (typeof window === "undefined") return
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    if (type === "success") {
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = "sine"
      osc1.frequency.setValueAtTime(523.25, now) // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12) // G5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25) // C6

      osc2.type = "triangle"
      osc2.frequency.setValueAtTime(261.63, now) // C4
      osc2.frequency.exponentialRampToValueAtTime(523.25, now + 0.25)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.35)
      osc2.stop(now + 0.35)
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.25)

      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    }
  } catch {
    // Ignore audio context errors if browser blocked autoplay
  }
}

export const useActionFeedbackStore = create<FeedbackState>((set, get) => ({
  isOpen: false,
  status: "idle",
  actionType: "create",
  title: "",
  message: "",
  autoCloseTimeout: undefined,
  onRetry: null,

  startLoading: ({ title = "Processing Action...", message = "Please wait while we save changes...", actionType = "create" }) => {
    set({
      isOpen: true,
      status: "loading",
      actionType,
      title,
      message,
      onRetry: null,
    })
  },

  showSuccess: ({ title = "Action Completed Successfully!", message = "Your changes have been saved to the workspace.", actionType, durationMs = 2600 }) => {
    playChime("success")
    set((state) => ({
      isOpen: true,
      status: "success",
      actionType: actionType || state.actionType,
      title,
      message,
      onRetry: null,
    }))

    if (durationMs > 0) {
      setTimeout(() => {
        if (get().status === "success") {
          set({ isOpen: false, status: "idle" })
        }
      }, durationMs)
    }
  },

  showError: ({ title = "Action Failed", message = "An error occurred while processing your request. Please try again.", actionType, onRetry }) => {
    playChime("error")
    set((state) => ({
      isOpen: true,
      status: "error",
      actionType: actionType || state.actionType,
      title,
      message,
      onRetry: onRetry || null,
    }))
  },

  close: () => {
    set({ isOpen: false, status: "idle" })
  },
}))

/**
 * Universal helper that wraps any async action with automatic loading, success, and error popups!
 */
export async function executeWithFeedback<T>(
  asyncTask: () => Promise<T>,
  options: {
    actionType?: FeedbackActionType
    loadingTitle?: string
    loadingMsg?: string
    successTitle?: string
    successMsg?: string
    errorTitle?: string
    errorMsg?: string
    minLoadingMs?: number
    autoCloseMs?: number
  } = {}
): Promise<T> {
  const store = useActionFeedbackStore.getState()
  const {
    actionType = "process",
    loadingTitle = "Processing Request...",
    loadingMsg = "Applying updates and synchronizing enterprise records...",
    successTitle = "Completed Successfully!",
    successMsg = "All changes have been successfully applied and synced.",
    errorTitle = "Operation Failed",
    errorMsg,
    minLoadingMs = 400,
    autoCloseMs = 2500,
  } = options

  store.startLoading({ title: loadingTitle, message: loadingMsg, actionType })
  const startTime = Date.now()

  try {
    const result = await asyncTask()
    const elapsed = Date.now() - startTime
    if (elapsed < minLoadingMs) {
      await new Promise((r) => setTimeout(r, minLoadingMs - elapsed))
    }
    store.showSuccess({ title: successTitle, message: successMsg, actionType, durationMs: autoCloseMs })
    return result
  } catch (err: any) {
    const elapsed = Date.now() - startTime
    if (elapsed < minLoadingMs) {
      await new Promise((r) => setTimeout(r, minLoadingMs - elapsed))
    }
    const finalErrMsg = errorMsg || err?.message || "An unexpected error occurred while executing this operation."
    store.showError({ title: errorTitle, message: finalErrMsg, actionType })
    throw err
  }
}
