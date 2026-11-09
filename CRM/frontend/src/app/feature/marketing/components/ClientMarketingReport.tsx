"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  BarChart3, Calendar, RefreshCw, Eye, Plus, ArrowUpRight, 
  CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, 
  Video, Image as ImageIcon, Sparkles, Share2, Layers, 
  ChevronRight, ExternalLink, Filter, Download
} from "lucide-react"
import { MarketingCampaign, MarketingPost, MarketingServiceQuota } from "../types"
import { MarketingService } from "../services/marketingService"
import { useAuthStore } from "@/store/useAuthStore"
import ViewCreativeModal from "./ViewCreativeModal"
import AddDeliverablePostModal from "./AddDeliverablePostModal"
import CreateCampaignModal from "./CreateCampaignModal"
import { Button } from "@/components/ui/Button"

export default function ClientMarketingReport() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  // Data states
  const [campaigns, setCampaigns] = React.useState<MarketingCampaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>("")
  const [posts, setPosts] = React.useState<MarketingPost[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [timeRange, setTimeRange] = React.useState<"7D" | "30D" | "90D">("30D")

  // Modal states
  const [viewingPost, setViewingPost] = React.useState<MarketingPost | null>(null)
  const [isAddPostOpen, setIsAddPostOpen] = React.useState(false)
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = React.useState(false)

  // Load all campaigns and posts
  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [campaignList, postsList] = await Promise.all([
        MarketingService.getCampaigns(),
        MarketingService.getPosts()
      ])
      setCampaigns(campaignList || [])
      setPosts(postsList || [])

      if (campaignList && campaignList.length > 0 && !selectedCampaignId) {
        // If client is logged in, select their campaign
        if (user?.role === "Clients" && user?.email) {
          const clientCamp = campaignList.find(c => 
            c.clientEmail?.toLowerCase() === user.email?.toLowerCase() ||
            c.clientName?.toLowerCase().includes(user.name?.toLowerCase() || "")
          )
          setSelectedCampaignId(clientCamp ? clientCamp.id : campaignList[0].id)
        } else {
          setSelectedCampaignId(campaignList[0].id)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, selectedCampaignId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0]
  const campaignPosts = posts.filter(p => !activeCampaign || p.campaignId === activeCampaign.id || p.clientId === activeCampaign.clientId)

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!activeCampaign) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
        <Sparkles className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          No Marketing Retainer Active
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5">
          Launch a digital marketing retainer contract for your clients with deliverable commitments.
        </p>
        {isAdmin && (
          <Button onClick={() => setIsCreateCampaignOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs cursor-pointer px-4 py-2">
            + Create Marketing Retainer
          </Button>
        )}

        {isCreateCampaignOpen && (
          <CreateCampaignModal
            isOpen={isCreateCampaignOpen}
            onClose={() => setIsCreateCampaignOpen(false)}
            onCampaignCreated={loadData}
          />
        )}
      </div>
    )
  }

  // Calculate Aggregates
  const totalCommitment = activeCampaign.totalCommitment || 68
  const totalPosted = activeCampaign.totalPosted || 52
  const totalDue = Math.max(0, totalCommitment - totalPosted)
  const fulfillmentPercentage = Math.round((totalPosted / (totalCommitment || 1)) * 100)

  // Service Quotas
  const servicesList = Object.values(activeCampaign.services || {})

  return (
    <div className="space-y-5 animate-in fade-in duration-200 font-sans pb-16">
      {/* ── TOP NAV BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:px-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Client Marketing Report
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Live Deliverables
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Track Your Marketing Performance in Real Time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Select Client Dropdown (for Admins) */}
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] text-zinc-500 font-medium">Select Client:</span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-transparent font-bold text-xs text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer pr-2"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Badge */}
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 shadow-2xs text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>01 Oct 2026 – 31 Oct 2026</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={loadData}
            title="Sync Metrics"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync Now</span>
          </button>

          {isAdmin && (
            <Button
              onClick={() => setIsCreateCampaignOpen(true)}
              variant="outline"
              className="text-xs h-9 px-3 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Retainer</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── CLIENT META & SUMMARY KPI BAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Client Identity Card */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 shrink-0 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeCampaign.clientAvatar || "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=150&auto=format&fit=crop&q=80"}
              alt={activeCampaign.clientName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                {activeCampaign.clientName}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              Client ID : <span className="font-semibold text-zinc-700 dark:text-zinc-300">{activeCampaign.clientId}</span> | Package : <span className="font-semibold text-zinc-700 dark:text-zinc-300">{activeCampaign.packageName}</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              (3 Months Retainer, Ends Jan 2027)
            </p>
          </div>
        </div>

        {/* Total Commitment KPI */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Total Commitment</span>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {totalCommitment}
            </div>
          </div>
        </div>

        {/* Total Posted KPI */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Total Posted</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {totalPosted}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">
              {fulfillmentPercentage}% Completed
            </span>
          </div>
        </div>

        {/* Pending / Due KPI */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block">Pending / Due</span>
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400 tracking-tight">
                {totalDue}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-zinc-400 block">Viewers & Leads</span>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center justify-end gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{activeCampaign.totalLeads || 450}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 DELIVERABLE COMMITMENT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {servicesList.map((svc) => {
          const dueCount = Math.max(0, svc.commitment - svc.posted)
          const pct = Math.round((svc.posted / (svc.commitment || 1)) * 100)

          return (
            <div
              key={svc.serviceKey}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-md group"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {svc.serviceName}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddPostOpen(true)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Thumbnail & Commitments Grid */}
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-950 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={svc.thumbnailUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80"}
                    alt={svc.serviceName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="text-xs space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Commitment:</span>
                    <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{svc.commitment}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-600 font-medium">Posted:</span>
                    <strong className="text-emerald-600 font-bold">{svc.posted}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-600 font-medium">Due:</span>
                    <strong className="text-orange-600 font-bold">{dueCount}</strong>
                  </div>
                </div>
              </div>

              {/* Performance Row (Views, Reach, Leads) */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] grid grid-cols-3 text-center mb-3">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Views</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {svc.views > 1000 ? `${(svc.views / 1000).toFixed(1)}K` : svc.views}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Reach</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {svc.reach > 1000 ? `${(svc.reach / 1000).toFixed(1)}K` : svc.reach}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Leads</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">{svc.leads}</strong>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 mb-1">
                  <span>{pct}% Completed</span>
                  <span>{dueCount} Remaining</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-600"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── MIDDLE SECTION: RECENT POSTS & PENDING TASKS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Posts & Activity Table */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Recent Posts & Activity
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsAddPostOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Deliverable</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-semibold text-[11px]">
                    <th className="pb-2.5">Date & Time</th>
                    <th className="pb-2.5">Service</th>
                    <th className="pb-2.5">Content Creative</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Views</th>
                    <th className="pb-2.5 text-right">Reach</th>
                    <th className="pb-2.5 text-right">Leads</th>
                    <th className="pb-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {campaignPosts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-400">
                        No posts published yet for this campaign.
                      </td>
                    </tr>
                  ) : (
                    campaignPosts.slice(0, 5).map((post) => (
                      <tr key={post.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 text-zinc-600 dark:text-zinc-300 font-medium whitespace-nowrap">
                          {post.publishedAt}
                        </td>
                        <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {post.service}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-zinc-200 dark:border-zinc-700">
                              {post.contentPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={post.contentPreview} alt={post.title} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-zinc-500 m-2" />
                              )}
                            </div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[160px]" title={post.title}>
                              {post.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {post.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-zinc-800 dark:text-zinc-200">
                          {post.views > 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views}
                        </td>
                        <td className="py-3 text-right font-bold text-zinc-800 dark:text-zinc-200">
                          {post.reach > 1000 ? `${(post.reach / 1000).toFixed(1)}K` : post.reach}
                        </td>
                        <td className="py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {post.leads}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => setViewingPost(post)}
                            title="Preview Creative"
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending / Due Tasks Panel */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Pending / Due Tasks
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-zinc-400">This Month</span>
            </div>

            <div className="space-y-3">
              {servicesList.map((svc) => {
                const dueCount = Math.max(0, svc.commitment - svc.posted)
                return (
                  <div
                    key={svc.serviceKey}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {svc.serviceName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {dueCount} Due
                      </span>
                      <button
                        onClick={() => setIsAddPostOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs transition-colors"
                      >
                        Publish
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Red Alert Pill */}
          <div className="mt-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-center flex items-center justify-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Total Deliverables Pending: {totalDue}</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: TREND CHART, DONUT & ACTIVITY LOG ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Performance Trend Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Performance Trend
              </h3>
            </div>

            <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold">
              {(["7D", "30D", "90D"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    timeRange === r
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] font-semibold text-zinc-500 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Reach</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Leads</span>
            </div>
          </div>

          {/* SVG Multi-Line Trend Visualization */}
          <div className="h-44 w-full flex items-end">
            <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="400" y2="20" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="400" y2="100" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeDasharray="3 3" />

              {/* Blue Curve (Views) */}
              <polyline
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                points="10,95 90,75 190,60 290,45 390,30"
              />
              {/* Green Curve (Reach) */}
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                points="10,105 90,88 190,72 290,58 390,42"
              />
              {/* Orange Curve (Leads) */}
              <polyline
                fill="none"
                stroke="#F97316"
                strokeWidth="2.5"
                points="10,115 90,105 190,95 290,82 390,68"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span>Oct 01</span>
            <span>Oct 07</span>
            <span>Oct 14</span>
            <span>Oct 21</span>
            <span>Oct 31</span>
          </div>
        </div>

        {/* Service-wise Summary Donut */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Service-wise Summary
            </h3>
          </div>

          <div className="flex items-center justify-center my-auto py-2">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Circular SVG Donut */}
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path
                  className="text-blue-500"
                  strokeWidth="4"
                  strokeDasharray="30, 100"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeWidth="4"
                  strokeDasharray="25, 100"
                  strokeDashoffset="-30"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-500"
                  strokeWidth="4"
                  strokeDasharray="20, 100"
                  strokeDashoffset="-55"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-500"
                  strokeWidth="4"
                  strokeDasharray="25, 100"
                  strokeDashoffset="-75"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] text-zinc-400 font-semibold">Total</span>
                <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{totalCommitment}</span>
                <span className="text-[9px] text-zinc-400 font-medium">Commitment</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {servicesList.map((svc, idx) => {
              const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500"]
              const share = Math.round((svc.commitment / (totalCommitment || 1)) * 100)
              return (
                <div key={svc.serviceKey} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} />
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate">
                    {svc.serviceName} ({svc.commitment})
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Activity Log Timeline */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Activity Log
            </h3>
          </div>

          <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {campaignPosts.slice(0, 5).map((p) => (
              <div key={p.id} className="relative pl-6 text-xs">
                <span className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-zinc-900" />
                <span className="text-[10px] text-zinc-400 block font-medium">
                  {p.publishedAt}
                </span>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {p.service} Posted
                </p>
                <p className="text-[10px] text-zinc-400 truncate">
                  "{p.title}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewingPost && (
        <ViewCreativeModal
          isOpen={Boolean(viewingPost)}
          onClose={() => setViewingPost(null)}
          post={viewingPost}
        />
      )}

      {isAddPostOpen && (
        <AddDeliverablePostModal
          isOpen={isAddPostOpen}
          onClose={() => setIsAddPostOpen(false)}
          campaign={activeCampaign}
          onPostAdded={loadData}
        />
      )}

      {isCreateCampaignOpen && (
        <CreateCampaignModal
          isOpen={isCreateCampaignOpen}
          onClose={() => setIsCreateCampaignOpen(false)}
          onCampaignCreated={loadData}
        />
      )}
    </div>
  )
}

