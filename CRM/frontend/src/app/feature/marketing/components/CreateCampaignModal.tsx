"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { X, Sparkles, Building2, Calendar, Target } from "lucide-react"
import { MarketingCampaign } from "../types"
import { MarketingService } from "../services/marketingService"
import { getClients } from "@/app/feature/clients/services/clientService"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/Button"

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onCampaignCreated: () => void
}

export default function CreateCampaignModal({
  isOpen,
  onClose,
  onCampaignCreated
}: CreateCampaignModalProps) {
  const { user, activeCompanyId } = useAuthStore()
  const [clients, setClients] = React.useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [selectedClientId, setSelectedClientId] = React.useState("")
  const [packageName, setPackageName] = React.useState("Premium Digital Growth Package")
  const [durationMonths, setDurationMonths] = React.useState(3)
  const [posterCommitment, setPosterCommitment] = React.useState(20)
  const [videoCommitment, setVideoCommitment] = React.useState(15)
  const [realModelCommitment, setRealModelCommitment] = React.useState(10)
  const [customServiceName, setCustomServiceName] = React.useState("Tutor Service")
  const [customCommitment, setCustomCommitment] = React.useState(15)

  React.useEffect(() => {
    if (isOpen) {
      getClients(activeCompanyId || "all").then((list) => {
        setClients(list || [])
        if (list && list.length > 0 && !selectedClientId) {
          setSelectedClientId(list[0].id)
        }
      })
    }
  }, [isOpen, activeCompanyId, selectedClientId])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const clientObj = clients.find(c => String(c.id) === String(selectedClientId))
      const clientName = clientObj?.name || clientObj?.companyName || "Marketing Client"

      await MarketingService.autoProvisionFromQuotation(
        {
          id: selectedClientId || `CLT-${Date.now().toString().slice(-4)}`,
          name: clientName,
          email: clientObj?.email || "",
          branchName: clientObj?.branchName || user?.branchName || "Main HQ"
        },
        packageName,
        {
          poster: Number(posterCommitment) || 0,
          video: Number(videoCommitment) || 0,
          real_model: Number(realModelCommitment) || 0,
          customName: customServiceName.trim() || "Custom Service",
          custom: Number(customCommitment) || 0
        },
        activeCompanyId || user?.companyId || "consultancy"
      )

      onCampaignCreated()
      onClose()
    } catch (err: any) {
      alert("Failed to provision marketing campaign: " + (err?.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
              New Digital Marketing Retainer Contract
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Assign deliverable commitment quotas to a client
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Client Selection */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Select Client *
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-medium"
            >
              {clients.length === 0 ? (
                <option value="CLT-NEW">Demo Client (Auto Provision)</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.companyName || "Unnamed Client"} ({c.email || "No email"})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Package Name & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Package Name
              </label>
              <input
                type="text"
                required
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="e.g. Premium Digital Package"
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Duration (Months)
              </label>
              <input
                type="number"
                min={1}
                max={36}
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Commitments Matrix */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 block">
              Deliverable Quota Commitments (Per Month):
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                  Posters Commitment
                </label>
                <input
                  type="number"
                  min={0}
                  value={posterCommitment}
                  onChange={(e) => setPosterCommitment(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                  Reels / Short Videos
                </label>
                <input
                  type="number"
                  min={0}
                  value={videoCommitment}
                  onChange={(e) => setVideoCommitment(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                  Real Model Shoot Videos
                </label>
                <input
                  type="number"
                  min={0}
                  value={realModelCommitment}
                  onChange={(e) => setRealModelCommitment(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                  Custom Service Quota
                </label>
                <input
                  type="number"
                  min={0}
                  value={customCommitment}
                  onChange={(e) => setCustomCommitment(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                Custom Service Label
              </label>
              <input
                type="text"
                value={customServiceName}
                onChange={(e) => setCustomServiceName(e.target.value)}
                placeholder="e.g. Tutor Service / Influencer Reel"
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-5 shadow-xs"
            >
              {isSubmitting ? "Provisioning..." : "Launch Retainer Contract"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

