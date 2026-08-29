"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Check, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Trash2, 
  PlusCircle, 
  Edit3, 
  Zap, 
  CreditCard,
  CheckCircle2,
  Sparkles
} from "lucide-react"
import { useActionFeedbackStore, FeedbackActionType } from "@/store/useActionFeedbackStore"

export function ActionFeedbackModal() {
  const { isOpen, status, actionType, title, message, onRetry, close } = useActionFeedbackStore()

  // Prevent background interactions while loading
  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "loading") {
        close()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, status, close])

  const getActionTheme = (type: FeedbackActionType) => {
    switch (type) {
      case "create":
        return {
          icon: PlusCircle,
          colorText: "text-emerald-500",
          ringColor: "border-emerald-500",
          glowColor: "shadow-emerald-500/20",
          gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
          badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          label: "Create Operation",
        }
      case "delete":
        return {
          icon: Trash2,
          colorText: "text-rose-500",
          ringColor: "border-rose-500",
          glowColor: "shadow-rose-500/20",
          gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
          badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          label: "Delete Operation",
        }
      case "update":
        return {
          icon: Edit3,
          colorText: "text-blue-500",
          ringColor: "border-blue-500",
          glowColor: "shadow-blue-500/20",
          gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
          badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          label: "Update Operation",
        }
      case "payment":
        return {
          icon: CreditCard,
          colorText: "text-amber-500",
          ringColor: "border-amber-500",
          glowColor: "shadow-amber-500/20",
          gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
          badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          label: "Financial Settlement",
        }
      case "sync":
        return {
          icon: RefreshCw,
          colorText: "text-cyan-500",
          ringColor: "border-cyan-500",
          glowColor: "shadow-cyan-500/20",
          gradient: "from-cyan-500/20 via-sky-500/10 to-transparent",
          badgeBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
          label: "Database Sync",
        }
      default:
        return {
          icon: Zap,
          colorText: "text-purple-500",
          ringColor: "border-purple-500",
          glowColor: "shadow-purple-500/20",
          gradient: "from-purple-500/20 via-indigo-500/10 to-transparent",
          badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          label: "Processing Action",
        }
    }
  }

  const currentTheme = getActionTheme(actionType)
  const ActionIcon = currentTheme.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          {/* Backdrop with subtle blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (status !== "loading") close()
            }}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-center z-10"
          >
            {/* Top Atmospheric Gradient Glow */}
            <div className={`absolute top-0 left-0 right-0 h-28 bg-gradient-to-b ${currentTheme.gradient} pointer-events-none`} />

            {/* Top Close Button for result states */}
            {status !== "loading" && (
              <button
                type="button"
                onClick={close}
                className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}

            {/* ── 1. LOADING STATE ── */}
            {status === "loading" && (
              <div className="space-y-4 py-2">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  {/* Outer Orbital Rotating Ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-3 border-transparent border-t-blue-500 border-r-teal-400 border-b-purple-500"
                  />
                  {/* Inner Counter-Rotating Ring */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                    className="absolute inset-2.5 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700"
                  />
                  {/* Pulsing Central Icon Halo */}
                  <motion.div
                    animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className={`w-12 h-12 rounded-2xl ${currentTheme.badgeBg} border flex items-center justify-center shadow-lg ${currentTheme.glowColor}`}
                  >
                    <ActionIcon className={`w-6 h-6 ${currentTheme.colorText}`} />
                  </motion.div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${currentTheme.badgeBg}`}>
                    <Sparkles size={11} className="animate-spin-slow" />
                    <span>{currentTheme.label}</span>
                  </span>
                  <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {title || "Processing..."}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    {message || "Synchronizing with workspace database..."}
                  </p>
                </div>

                {/* Animated micro-dots */}
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {[0, 0.2, 0.4].map((delay, idx) => (
                    <motion.div
                      key={idx}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay, ease: "easeInOut" }}
                      className="w-1.5 h-1.5 rounded-full bg-blue-500"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── 2. SUCCESS STATE ── */}
            {status === "success" && (
              <div className="space-y-4 py-2">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  {/* Expanding Ripple Ring */}
                  <motion.div
                    initial={{ scale: 0.6, opacity: 1 }}
                    animate={{ scale: 1.35, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-emerald-500/30"
                  />
                  {/* Outer Glowing Circle */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 border border-emerald-300/40"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 450, damping: 18 }}
                    >
                      <Check size={32} strokeWidth={3.5} />
                    </motion.div>
                  </motion.div>
                </div>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={11} />
                    <span>Completed</span>
                  </span>
                  <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {title || "Success!"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    {message || "The operation finished successfully."}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={close}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* ── 3. ERROR STATE ── */}
            {status === "error" && (
              <div className="space-y-4 py-2">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-xl shadow-rose-500/30 border border-rose-300/40"
                  >
                    <AlertTriangle size={30} strokeWidth={2.5} />
                  </motion.div>
                </div>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <span>Operation Error</span>
                  </span>
                  <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {title || "Action Failed"}
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 max-w-xs mx-auto leading-relaxed">
                    {message || "Could not complete the action. Please check your connection and try again."}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {onRetry && (
                    <button
                      type="button"
                      onClick={() => {
                        close()
                        onRetry()
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      Try Again
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
