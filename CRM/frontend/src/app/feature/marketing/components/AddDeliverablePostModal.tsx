"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, Sparkles, Check, Image as ImageIcon, Video, UserCheck, Share2 } from "lucide-react"
import { MarketingCampaign, MarketingPost } from "../types"
import { MarketingService } from "../services/marketingService"
import { Button } from "@/components/ui/Button"

interface AddDeliverablePostModalProps {
  isOpen: boolean
  onClose: () => void
  campaign: MarketingCampaign | null
  onPostAdded: () => void
}

export default function AddDeliverablePostModal({
  isOpen,
  onClose,
  campaign,
  onPostAdded
}: AddDeliverablePostModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [service, setService] = React.useState<string>("Poster")
  const [title, setTitle] = React.useState("")
  const [contentPreview, setContentPreview] = React.useState("")
  const [views, setViews] = React.useState<number>(5000)
  const [reach, setReach] = React.useState<number>(3500)
  const [leads, setLeads] = React.useState<number>(45)
  const [status, setStatus] = React.useState<MarketingPost["status"]>("Posted")
  const [notes, setNotes] = React.useState("")

  if (!isOpen || !campaign) return null

  const availableServices = Object.values(campaign.services).map(s => s.serviceName)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert("Please enter a creative or post title.")
      return
    }

    setIsSubmitting(true)
    try {
      const now = new Date()
      const timeStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + 
        ", " + now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

      await MarketingService.addPost({
        campaignId: campaign.id,
        clientId: campaign.clientId,
        clientName: campaign.clientName,
        service,
        title,
        contentPreview: contentPreview.trim() || undefined,
        publishedAt: timeStr,
        status,
        views: Number(views) || 0,
        reach: Number(reach) || 0,
        leads: Number(leads) || 0,
        notes: notes.trim() || undefined
      })

      onPostAdded()
      onClose()
      setTitle("")
      setContentPreview("")
      setNotes("")
    } catch (err: any) {
      alert("Failed to record post: " + (err?.message || "Unknown error"))
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
              Publish / Log Deliverable Post
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              For client: <strong className="text-indigo-600 dark:text-indigo-400">{campaign.clientName}</strong>
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
          {/* Service Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Deliverable Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableServices.map((svc) => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => setService(svc)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center truncate ${
                    service === svc
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {svc}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Creative Title / Campaign Angle *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Festive Offer Poster / Brand Reel #3"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Content Image / Preview URL */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Creative Media URL (Image / Reel Link)
            </label>
            <input
              type="url"
              value={contentPreview}
              onChange={(e) => setContentPreview(e.target.value)}
              placeholder="https://... (or leave blank for placeholder)"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Metrics: Views, Reach, Leads */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 block mb-1">
                Views
              </label>
              <input
                type="number"
                min={0}
                value={views}
                onChange={(e) => setViews(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 block mb-1">
                Reach
              </label>
              <input
                type="number"
                min={0}
                value={reach}
                onChange={(e) => setReach(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 block mb-1">
                Leads Captured
              </label>
              <input
                type="number"
                min={0}
                value={leads}
                onChange={(e) => setLeads(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Status & Remarks */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 block mb-1">
                Deliverable Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
              >
                <option value="Posted">Posted (Live)</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Review">Client Review</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 block mb-1">
                Campaign Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Published on Meta & LinkedIn"
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
              {isSubmitting ? "Saving..." : "Record Deliverable Post"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
