"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/useAuthStore"
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"

export function CompanySwitchLoader() {
  const { activeCompanyId, activeBranchId, branches } = useAuthStore()
  const [isSwitching, setIsSwitching] = React.useState(false)
  const [switchingTarget, setSwitchingTarget] = React.useState<string>("")

  const hasMountedRef = React.useRef(false)
  const prevCompanyRef = React.useRef(activeCompanyId)
  const prevBranchRef = React.useRef(activeBranchId)
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const autoHideTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  const stopLoader = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current)
      autoHideTimerRef.current = null
    }
    setIsSwitching(false)
  }, [])

  const triggerLoader = React.useCallback((targetId: string | null, targetBranchId?: string | null) => {
    let name = "SAAMPARK GROUP"

    if (targetId && targetId !== "all") {
      const targetStr = String(targetId).toLowerCase().trim()
      if (targetStr.includes("consult") || targetStr === "2") {
        name = "Saampark Consultancy Service"
      } else {
        name = "Saampark Technology & Research"
      }
    }

    if (targetBranchId) {
      const matchedBr = branches.find(b => String(b.id) === String(targetBranchId))
      if (matchedBr) {
        name = `${name} • ${matchedBr.name}`
      }
    }

    setSwitchingTarget(name)

    // Clear any existing timers
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current)

    // 200ms debounce: if data arrives immediately, the loader never appears!
    debounceTimerRef.current = setTimeout(() => {
      setIsSwitching(true)

      // Auto-hide safety timeout so it NEVER gets stuck
      autoHideTimerRef.current = setTimeout(() => {
        setIsSwitching(false)
      }, 550)
    }, 200)
  }, [branches])

  React.useEffect(() => {
    hasMountedRef.current = true

    const handleCompanySwitched = (e: any) => {
      const target = e?.detail?.companyId !== undefined ? e.detail.companyId : (e?.detail || activeCompanyId)
      triggerLoader(target, null)
    }

    const handleBranchSwitched = (e: any) => {
      const branchId = e?.detail?.branchId !== undefined ? e.detail.branchId : (e?.detail || activeBranchId)
      triggerLoader(activeCompanyId, branchId)
    }

    const handleDataLoaded = () => {
      stopLoader()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("saampark_company_switched", handleCompanySwitched)
      window.addEventListener("saampark_branch_switched", handleBranchSwitched)
      window.addEventListener("saampark_data_loaded", handleDataLoaded)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("saampark_company_switched", handleCompanySwitched)
        window.removeEventListener("saampark_branch_switched", handleBranchSwitched)
        window.removeEventListener("saampark_data_loaded", handleDataLoaded)
      }
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current)
    }
  }, [activeCompanyId, activeBranchId, triggerLoader, stopLoader])

  // Track store state changes if switched programmatically without events (skip initial mount)
  React.useEffect(() => {
    if (!hasMountedRef.current) return

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
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/50 backdrop-blur-xs pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="p-5 rounded-2xl bg-card/95 border border-border shadow-2xl flex flex-col items-center justify-center text-center max-w-xs w-full pointer-events-none"
          >
            <ThreeDotLoader 
              text={switchingTarget ? `Switching to ${switchingTarget}...` : "Loading workspace data..."} 
              fullScreen={false} 
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
