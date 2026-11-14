"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Eye, ExternalLink, Calendar, Users, TrendingUp, Sparkles, Share2 } from "lucide-react"
import { MarketingPost } from "../types"
import { Button } from "@/components/ui/Button"

interface ViewCreativeModalProps {
  isOpen: boolean
  onClose: () => void
  post: MarketingPost | null
}

export default function ViewCreativeModal({ isOpen, onClose, post }: ViewCreativeModalProps) {
  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {post.service}
            </span>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base truncate max-w-xs">
              {post.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Creative Media Preview */}
          <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 flex items-center justify-center max-h-72 aspect-video">
            {post.contentPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.contentPreview}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-zinc-500 text-xs flex flex-col items-center gap-2">
                <Share2 className="w-8 h-8 text-zinc-600" />
                <span>No direct preview attached</span>
              </div>
            )}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{post.status}</span>
            </div>
          </div>

          {/* Performance KPIs */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-center">
              <span className="text-[10px] text-zinc-500 font-medium block">Total Views</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                {(post.views || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-center">
              <span className="text-[10px] text-zinc-500 font-medium block">Likes / Reactions</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
                {(post.likes || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-center">
              <span className="text-[10px] text-zinc-500 font-medium block">Audience Reach</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {(post.reach || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-center">
              <span className="text-[10px] text-zinc-500 font-medium block">Leads Captured</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                {post.leads || 0}
              </span>
            </div>
          </div>

          {/* Live Post Meta Link Button */}
          {post.postUrl && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                  {post.platform || "Meta"}
                </span>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Published Live on {post.platform || "Meta / Social Media"}
                </span>
              </div>
              <a
                href={post.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>View Live Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Meta details */}
          <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-400">Client Account:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{post.clientName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-400">Publishing Channel:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{post.platform || "Meta Ads / Instagram"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-400">Published Timestamp:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{post.publishedAt}</span>
            </div>
            {post.notes && (
              <div className="py-1.5">
                <span className="text-zinc-400 block mb-1">Campaign Remarks:</span>
                <p className="italic bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200">
                  "{post.notes}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Saampark Marketing Verification
          </span>
          <Button variant="outline" onClick={onClose} className="text-xs h-8 px-4">
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

