"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/useAuthStore"
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"

export function CompanySwitchLoader() {
  const { activeCompanyId, activeBranchId, branches } = useAuthStore()
  const [isSwitching, setIsSwitching] = React.useState(false)
  const [switchingTarget, setSwitchingTarget] = React.useState<string>("")

  // Strict auto-dismiss timer: whenever isSwitching becomes true, it CANNOT stay on screen > 400ms
  React.useEffect(() => {
    if (!isSwitching) return

    const dismissTimer = setTimeout(() => {
      setIsSwitching(false)
    }, 380)

    const handleDataArrived = () => {
      setIsSwitching(false)
    }

    // Dismiss immediately if user clicks, presses a key, or data finishes loading
    window.addEventListener("saampark_data_synced", handleDataArrived)
    window.addEventListener("saampark_data_loaded", handleDataArrived)
    window.addEventListener("storage", handleDataArrived)
    window.addEventListener("keydown", handleDataArrived)
    window.addEventListener("mousedown", handleDataArrived)

    return () => {
      clearTimeout(dismissTimer)
      window.removeEventListener("saampark_data_synced", handleDataArrived)
      window.removeEventListener("saampark_data_loaded", handleDataArrived)
      window.removeEventListener("storage", handleDataArrived)
      window.removeEventListener("keydown", handleDataArrived)
      window.removeEventListener("mousedown", handleDataArrived)
    }
  }, [isSwitching])

  // ONLY listen to explicit switch events dispatched by user selection
  React.useEffect(() => {
    const handleCompanySwitched = (e: any) => {
      const targetId = e?.detail?.companyId !== undefined ? e.detail.companyId : (e?.detail || activeCompanyId)
      let name = "SAAMPARK GROUP"

      if (targetId && targetId !== "all") {
        const targetStr = String(targetId).toLowerCase().trim()
        if (targetStr.includes("consult") || targetStr === "2") {
          name = "Saampark Consultancy Service"
        } else {
          name = "Saampark Technology & Research"
        }
      }

      setSwitchingTarget(name)
      setIsSwitching(true)
    }

    const handleBranchSwitched = (e: any) => {
      const branchId = e?.detail?.branchId !== undefined ? e.detail.branchId : (e?.detail || activeBranchId)
      let name = "SAAMPARK GROUP"
      if (activeCompanyId && activeCompanyId !== "all") {
        const cStr = String(activeCompanyId).toLowerCase().trim()
        name = cStr.includes("consult") || cStr === "2"
          ? "Saampark Consultancy Service"
          : "Saampark Technology & Research"
      }

      if (branchId) {
        const matchedBr = branches.find(b => String(b.id) === String(branchId))
        if (matchedBr) {
          name = `${name} • ${matchedBr.name}`
        }
      }

      setSwitchingTarget(name)
      setIsSwitching(true)
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
    }
  }, [activeCompanyId, activeBranchId, branches])

  return (
    <AnimatePresence>
      {isSwitching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/40 backdrop-blur-xs pointer-events-none select-none"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="p-5 rounded-2xl bg-card/95 border border-border/80 shadow-2xl flex flex-col items-center justify-center text-center max-w-xs w-full pointer-events-none"
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
