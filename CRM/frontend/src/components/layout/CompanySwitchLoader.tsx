"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, Sparkles, RefreshCw, Layers } from "lucide-react"
import { useAuthStore, getCompanyFullName } from "@/store/useAuthStore"

export function CompanySwitchLoader() {
  const { activeCompanyId, activeBranchId, companies, branches } = useAuthStore()
  const [isSwitching, setIsSwitching] = React.useState(false)
  const [switchingTarget, setSwitchingTarget] = React.useState<string>("")
  const [switchingIcon, setSwitchingIcon] = React.useState<string>("🏢")

  const prevCompanyRef = React.useRef(activeCompanyId)
  const prevBranchRef = React.useRef(activeBranchId)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  const triggerLoader = React.useCallback((targetId: string | null, targetBranchId?: string | null) => {
    let name = "SAAMPARK GROUP"
    let icon = "🏢"

    if (targetId && targetId !== "all") {
      const targetStr = String(targetId).toLowerCase().trim()
      if (targetStr.includes("consult") || targetStr === "2") {
        name = "SAAMPARK CONSULTANCY SERVICE"
        icon = "💼"
      } else {
        name = "SAAMPARK TECHNOLOGY AND RESEARCH"
        icon = "💻"
      }
    }

    if (targetBranchId) {
      const matchedBr = branches.find(b => String(b.id) === String(targetBranchId))
      if (matchedBr) {
        name = `${name} — ${matchedBr.name}`
      }
    }

    setSwitchingTarget(name)
    setSwitchingIcon(icon)
    setIsSwitching(true)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIsSwitching(false)
    }, 700)
  }, [branches])

  React.useEffect(() => {
    const handleCompanySwitched = (e: any) => {
      const target = e?.detail || activeCompanyId
      triggerLoader(target, null)
    }

    const handleBranchSwitched = (e: any) => {
      const branchId = e?.detail || activeBranchId
      triggerLoader(activeCompanyId, branchId)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("saampark_company_switched", handleCompanySwitched)
      window.addEventListener("saampark_branch_switched", handleBranchSwitched)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("saampark_company_switched", handleCompanySwitched)
        window.removeEventListener("saampark_branch_switched", handleBranchSwitched)
      }
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [activeCompanyId, activeBranchId, triggerLoader])

  // Track store state changes if switched programmatically without events
  React.useEffect(() => {
    if (prevCompanyRef.current !== undefined && prevCompanyRef.current !== activeCompanyId) {
      triggerLoader(activeCompanyId, activeBranchId)
      prevCompanyRef.current = activeCompanyId
    }
    if (prevBranchRef.current !== undefined && prevBranchRef.current !== activeBranchId) {
      triggerLoader(activeCompanyId, activeBranchId)
      prevBranchRef.current = activeBranchId
    }
  }, [activeCompanyId, activeBranchId, triggerLoader])

  return (
    <AnimatePresence>
      {isSwitching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="modal-3d-dialog p-7 max-w-md w-full mx-auto flex flex-col items-center text-center shadow-2xl border border-white/20 dark:border-white/10"
          >
            {/* Pulsing 3D Icon Container */}
            <div className="relative mb-5 flex items-center justify-center">
              <div className="absolute -inset-2 rounded-3xl bg-blue-500/20 blur-xl animate-pulse" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/30 relative">
                <span>{switchingIcon}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border-2 border-primary flex items-center justify-center text-primary">
                <RefreshCw size={12} className="animate-spin" />
              </div>
            </div>

            {/* Switching Target Text */}
            <div className="space-y-1.5 mb-5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5">
                <Sparkles size={12} />
                <span>Switching Workspace</span>
              </span>
              <h3 className="text-base font-black text-foreground max-w-sm truncate">
                {switchingTarget}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Loading scoped database records & module metrics...
              </p>
            </div>

            {/* 3D Progress Bar */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden bar-groove-3d relative">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                className="w-1/2 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full bar-fill-3d"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
