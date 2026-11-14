"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  BarChart3, Calendar, RefreshCw, Eye, Plus, ArrowUpRight, 
  CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, 
  Video, Image as ImageIcon, Sparkles, Share2, Layers, 
  ChevronRight, ExternalLink, Filter, Download, ArrowLeft,
  Building2, Search, CheckCircle, Target, FileText
} from "lucide-react"
import { MarketingCampaign, MarketingPost, MarketingServiceQuota } from "../types"
import { MarketingService } from "../services/marketingService"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import ViewCreativeModal from "./ViewCreativeModal"
import AddDeliverablePostModal from "./AddDeliverablePostModal"
import CreateCampaignModal from "./CreateCampaignModal"
import { Button } from "@/components/ui/Button"

export default function ClientMarketingReport() {
  const { user, activeCompanyId } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"
  const canAdd = isAdmin || canPerformAction(user, "Digital Marketing", "add")
  const canEdit = isAdmin || canPerformAction(user, "Digital Marketing", "edit")
  const canDelete = isAdmin || canPerformAction(user, "Digital Marketing", "delete")

  // Data states
  const [campaigns, setCampaigns] = React.useState<MarketingCampaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>("")
  const [posts, setPosts] = React.useState<MarketingPost[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [timeRange, setTimeRange] = React.useState<"7D" | "30D" | "90D">("30D")

  // Client Directory filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [companyFilter, setCompanyFilter] = React.useState<string>("all")

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

      // If logged-in user is a Client, auto-select their campaign
      if (user?.role === "Clients" && user?.email) {
        const clientCamp = campaignList.find(c => 
          c.clientEmail?.toLowerCase() === user.email?.toLowerCase() ||
          c.clientName?.toLowerCase().includes(user.name?.toLowerCase() || "")
        )
        if (clientCamp) {
          setSelectedCampaignId(clientCamp.id)
        } else if (campaignList.length > 0) {
          setSelectedCampaignId(campaignList[0].id)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Check URL parameters on mount to auto-open client from invoice or deep-link
  React.useEffect(() => {
    if (typeof window !== "undefined" && campaigns.length > 0) {
      const sp = new URLSearchParams(window.location.search)
      const clientParam = sp.get("client") || sp.get("clientName")
      const campaignParam = sp.get("campaign") || sp.get("campaignId") || sp.get("id")
      const invoiceParam = sp.get("invoice")
      
      if (campaignParam && campaigns.some(c => c.id === campaignParam)) {
        setSelectedCampaignId(campaignParam)
      } else if (clientParam) {
        const found = campaigns.find(c => 
          c.clientName.toLowerCase().includes(clientParam.toLowerCase()) ||
          (c.clientEmail && c.clientEmail.toLowerCase() === clientParam.toLowerCase())
        )
        if (found) setSelectedCampaignId(found.id)
      } else if (invoiceParam) {
        const found = campaigns.find(c => c.invoiceId === invoiceParam)
        if (found) setSelectedCampaignId(found.id)
      }
    }
  }, [campaigns])

  // Filtered campaigns for the Client Directory list (with company, branch, and role privacy scoping)
  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter(c => {
      // 1. Company filter
      if (companyFilter !== "all") {
        const cComp = (c.companyId || "tech").toLowerCase()
        if (companyFilter === "tech" && !cComp.includes("tech")) return false
        if (companyFilter === "digital" && !cComp.includes("digital")) return false
      }

      // 2. Client role data isolation: client only sees their own campaign
      if (user?.role === "Clients" || String(user?.role || "").toLowerCase().includes("client")) {
        const uEmail = (user?.email || "").toLowerCase().trim()
        const uName = (user?.name || "").toLowerCase().trim()
        const cEmail = (c.clientEmail || "").toLowerCase().trim()
        const cName = (c.clientName || "").toLowerCase().trim()
        const isSelf = (uEmail && cEmail === uEmail) || (uName && cName.includes(uName)) || c.clientId === user?.id
        if (!isSelf) return false
      }

      // 3. Team member data isolation: staff only sees campaigns assigned to or created by them
      if (!isAdmin && user && user.role !== "Clients" && !String(user.role || "").toLowerCase().includes("client")) {
        const uId = String(user.id || "").trim()
        const uEmail = (user.email || "").toLowerCase().trim()
        const isAssigned = c.assignedMemberId === uId || 
                           (c.assignedMemberEmail && c.assignedMemberEmail.toLowerCase().trim() === uEmail) ||
                           (c.createdBy && c.createdBy.toLowerCase().trim() === uEmail)
        if (!isAssigned) return false
      }

      // 4. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = c.clientName?.toLowerCase().includes(q)
        const matchEmail = c.clientEmail?.toLowerCase().includes(q)
        const matchPkg = c.packageName?.toLowerCase().includes(q)
        const matchBranch = c.branchName?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPkg && !matchBranch) return false
      }
      return true
    })
  }, [campaigns, companyFilter, searchQuery, user, isAdmin])

  // Aggregate stats across all campaigns
  const totalClientsCount = campaigns.length
  const activeRetainersCount = campaigns.filter(c => c.status === "Active").length
  const totalAllPosted = campaigns.reduce((acc, c) => acc + (c.totalPosted || 0), 0)
  const totalAllCommitment = campaigns.reduce((acc, c) => acc + (c.totalCommitment || 0), 0)
  const totalAllLeads = campaigns.reduce((acc, c) => acc + (c.totalLeads || 0), 0)
  const overallFulfillment = totalAllCommitment > 0 ? Math.round((totalAllPosted / totalAllCommitment) * 100) : 0

  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId)
  const campaignPosts = posts.filter(p => !activeCampaign || p.campaignId === activeCampaign.id || p.clientId === activeCampaign.clientId)

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs text-zinc-500 font-medium">Loading Client Marketing Intelligence...</p>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════
  // VIEW 1: CLIENT MARKETING DIRECTORY LIST (Shown first before clicking)
  // ═════════════════════════════════════════════════════════════════════
  if (!selectedCampaignId || !activeCampaign) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 font-sans pb-16">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-5 sm:px-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Client Marketing Report
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Client Directory
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Select a client to view their live deliverables, creative assets, and ROI analytics across SAAMPARK Technology &amp; SAAMPARK Digital Marketing.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadData}
              title="Refresh Directory"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            {(isAdmin || canAdd) && (
              <Button
                onClick={() => setIsCreateCampaignOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Marketing Retainer</span>
              </Button>
            )}
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block">Total Clients</span>
              <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{totalClientsCount}</span>
              <span className="text-[10px] text-emerald-600 font-bold block">{activeRetainersCount} Active Retainers</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block">Total Deliverables</span>
              <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{totalAllPosted} <span className="text-xs font-normal text-zinc-400">/ {totalAllCommitment}</span></span>
              <span className="text-[10px] text-zinc-400 font-semibold block">{overallFulfillment}% overall fulfillment</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block">Leads Generated</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">+{totalAllLeads}</span>
              <span className="text-[10px] text-zinc-400 font-semibold block">Across Meta &amp; Ads</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block">Creatives Live</span>
              <span className="text-xl font-black text-purple-600 dark:text-purple-400">{posts.length}</span>
              <span className="text-[10px] text-zinc-400 font-semibold block">Posters &amp; Videos</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:px-4 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, package, or branch..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto">
            <span className="text-[11px] font-semibold text-zinc-400 mr-1 hidden sm:inline">Company:</span>
            {[
              { id: "all", label: "All Companies" },
              { id: "tech", label: "SAAMPARK Technology" },
              { id: "digital", label: "SAAMPARK Digital Marketing" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCompanyFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  companyFilter === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Client Directory Grid */}
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
            <Sparkles className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              {searchQuery ? "No Matching Clients Found" : "No Marketing Retainers Active"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5">
              {searchQuery 
                ? "Try clearing your search query or company filter to view other marketing clients."
                : "Launch a digital marketing retainer contract for your clients with deliverable commitments."}
            </p>
            {(isAdmin || canAdd) && (
              <Button onClick={() => setIsCreateCampaignOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs cursor-pointer px-4 py-2">
                + Create Marketing Retainer
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((camp) => {
              const compName = (camp.companyId || "tech").includes("digital") 
                ? "SAAMPARK Digital Marketing" 
                : "SAAMPARK Technology"
              const compBadgeClass = (camp.companyId || "tech").includes("digital")
                ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"

              const campCommitment = camp.totalCommitment || 1
              const campPosted = camp.totalPosted || 0
              const progressPct = Math.min(100, Math.round((campPosted / campCommitment) * 100))
              const services = Object.values(camp.services || {})
              const currentStage = camp.stage || (campPosted >= campCommitment ? "Completed" : (campPosted > 0 ? "Action" : "Pending"))

              return (
                <div
                  key={camp.id}
                  onClick={() => setSelectedCampaignId(camp.id)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 shrink-0 shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={camp.clientAvatar || "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=150&auto=format&fit=crop&q=80"}
                            alt={camp.clientName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors">
                            {camp.clientName}
                          </h3>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold border mt-0.5 ${compBadgeClass}`}>
                            {compName}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        camp.status === "Active" 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800" 
                          : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
                      }`}>
                        {camp.status || "Active"}
                      </span>
                    </div>

                    {/* 3-Stage Lifecycle Stepper */}
                    <div className="flex items-center justify-between p-1.5 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[10px] mb-3">
                      <span className={`px-2 py-0.5 rounded-lg font-bold ${currentStage === "Pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300" : "text-zinc-400"}`}>
                        1. 🕒 Pending
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-600">→</span>
                      <span className={`px-2 py-0.5 rounded-lg font-bold ${currentStage === "Action" ? "bg-indigo-600 text-white shadow-xs" : "text-zinc-400"}`}>
                        2. ⚡ In Action
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-600">→</span>
                      <span className={`px-2 py-0.5 rounded-lg font-bold ${currentStage === "Completed" ? "bg-emerald-600 text-white shadow-xs" : "text-zinc-400"}`}>
                        3. 🏆 Completed
                      </span>
                    </div>

                    {/* Package details */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800 mb-3.5 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{camp.packageName}</span>
                        <span className="text-[10px] text-zinc-400 font-medium">{camp.packageDurationMonths || 3} Months</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                        <span>Contract Period:</span>
                        <span className="font-semibold text-zinc-600 dark:text-zinc-300">{camp.startDate || "Ongoing"} → {camp.endDate || "Active"}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mb-3.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[11px] font-semibold text-zinc-500">Deliverables Fulfilled</span>
                        <span className="font-black text-xs text-zinc-900 dark:text-zinc-100">
                          {campPosted} / {campCommitment} <span className="text-zinc-400 font-normal">({progressPct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Service Quotas preview pills */}
                    {services.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 mb-3.5 text-[10.5px]">
                        {services.slice(0, 4).map((s) => (
                          <div key={s.serviceKey} className="px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <span className="text-zinc-500 font-medium truncate">{s.serviceName}:</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 shrink-0 ml-1">
                              {s.posted}/{s.commitment}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{camp.totalLeads || 0} Leads
                    </span>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>View Overview</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
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

  // ═════════════════════════════════════════════════════════════════════
  // VIEW 2: CLIENT MARKETING REPORT OVERVIEW (Opened upon clicking client)
  // ═════════════════════════════════════════════════════════════════════

  // Calculate Aggregates for Selected Client
  const totalCommitment = activeCampaign.totalCommitment || 68
  const totalPosted = activeCampaign.totalPosted || 52
  const totalDue = Math.max(0, totalCommitment - totalPosted)
  const fulfillmentPercentage = Math.round((totalPosted / (totalCommitment || 1)) * 100)

  // Service Quotas
  const servicesList = Object.values(activeCampaign.services || {})

  return (
    <div className="space-y-5 animate-in fade-in duration-200 font-sans pb-16">
      {/* ── TOP NAV BAR WITH BACK BUTTON ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Back to Client List Button */}
          {user?.role !== "Clients" && (
            <button
              onClick={() => setSelectedCampaignId("")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
              title="Return to Client List"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Clients</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                {activeCampaign.clientName}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Marketing Overview
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live Deliverables, Quotas &amp; ROI Analytics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Switch Client Dropdown (for Admins) */}
          {user?.role !== "Clients" && campaigns.length > 1 && (
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px] text-zinc-500 font-medium">Switch Client:</span>
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
          )}

          {/* Date Range Badge */}
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 shadow-2xs text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>{activeCampaign.startDate || "01 Oct 2026"} – {activeCampaign.endDate || "Ongoing"}</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={loadData}
            title="Sync Metrics"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync Now</span>
          </button>

          {(isAdmin || canAdd) && (
            <Button
              onClick={() => setIsCreateCampaignOpen(true)}
              variant="outline"
              className="text-xs h-9 px-3 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 gap-1.5 cursor-pointer"
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
                {activeCampaign.status || "Active"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              Client ID : <span className="font-semibold text-zinc-700 dark:text-zinc-300">{activeCampaign.clientId}</span> | Package : <span className="font-semibold text-zinc-700 dark:text-zinc-300">{activeCampaign.packageName}</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              ({activeCampaign.packageDurationMonths || 3} Months Retainer, Ends {activeCampaign.endDate || "Ongoing"})
            </p>
          </div>
        </div>

        {/* 3-Stage Lifecycle Stepper Widget */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              3-Stage Marketing Lifecycle
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              (activeCampaign.stage || (totalPosted >= totalCommitment ? "Completed" : totalPosted > 0 ? "Action" : "Pending")) === "Pending"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                : (activeCampaign.stage || (totalPosted >= totalCommitment ? "Completed" : totalPosted > 0 ? "Action" : "Pending")) === "Action"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-emerald-600 text-white shadow-xs"
            }`}>
              Current Stage: {activeCampaign.stage || (totalPosted >= totalCommitment ? "Completed" : totalPosted > 0 ? "Action" : "Pending")}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2 rounded-xl border text-center transition-all ${
              (activeCampaign.stage || (totalPosted > 0 ? "Action" : "Pending")) === "Pending"
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-xs"
                : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 opacity-60"
            }`}>
              <span className="text-[10px] font-bold block text-amber-700 dark:text-amber-300">Stage 1</span>
              <span className="text-xs font-black block text-zinc-900 dark:text-zinc-100">🕒 Pending</span>
              <span className="text-[9.5px] text-zinc-400 block mt-0.5">Awaiting 1st Post</span>
            </div>

            <div className={`p-2 rounded-xl border text-center transition-all ${
              (activeCampaign.stage || (totalPosted >= totalCommitment ? "Completed" : totalPosted > 0 ? "Action" : "Pending")) === "Action"
                ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-xs ring-2 ring-indigo-500/20"
                : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 opacity-60"
            }`}>
              <span className="text-[10px] font-bold block text-indigo-700 dark:text-indigo-300">Stage 2</span>
              <span className="text-xs font-black block text-zinc-900 dark:text-zinc-100">⚡ In Action</span>
              <span className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">1st Post Delivered</span>
            </div>

            <div className={`p-2 rounded-xl border text-center transition-all ${
              (activeCampaign.stage || (totalPosted >= totalCommitment ? "Completed" : totalPosted > 0 ? "Action" : "Pending")) === "Completed"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs"
                : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 opacity-60"
            }`}>
              <span className="text-[10px] font-bold block text-emerald-700 dark:text-emerald-300">Stage 3</span>
              <span className="text-xs font-black block text-zinc-900 dark:text-zinc-100">🏆 Completed</span>
              <span className="text-[9.5px] text-zinc-400 block mt-0.5">All Posts Finished</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUMMARY METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Commitment KPI */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Total Commitment</span>
            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{totalCommitment}</span>
            <span className="text-[10px] text-zinc-400 font-semibold block">Deliverables contracted</span>
          </div>
        </div>

        {/* Total Posted KPI */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Delivered So Far</span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400">{totalPosted}</span>
            <span className="text-[10px] text-emerald-600 font-bold block">{fulfillmentPercentage}% fulfilled</span>
          </div>
        </div>

        {/* Total Leads KPI */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Total Marketing Leads</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">+{activeCampaign.totalLeads || 0}</span>
            <span className="text-[10px] text-zinc-400 font-semibold block">Across Meta &amp; Ads</span>
          </div>
        </div>
      </div>

      {/* ── FULFILLMENT PROGRESS & REPUTATION BAR ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">
              Contract Fulfillment Progress
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              {fulfillmentPercentage}% Completed
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            <strong className="text-zinc-900 dark:text-zinc-100">{totalPosted}</strong> out of{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">{totalCommitment}</strong> deliverables fulfilled ({totalDue} remaining)
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fulfillmentPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full"
          />
        </div>
      </div>

      {/* ── 4 SERVICE DELIVERABLE CARDS ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Commitment vs Delivery Breakdown</span>
            <span className="text-[11px] font-normal text-zinc-400">(Form No - 9 Service Categories)</span>
          </h3>

          {(isAdmin || canAdd) && (
            <Button
              onClick={() => setIsAddPostOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 h-8 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Deliverable</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {servicesList.map((srv) => {
            const pct = Math.min(100, Math.round(((srv.posted || 0) / (srv.commitment || 1)) * 100))
            const due = Math.max(0, (srv.commitment || 0) - (srv.posted || 0))

            return (
              <div
                key={srv.serviceKey}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                      {srv.serviceName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {pct}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{srv.posted}</span>
                      <span className="text-xs text-zinc-400 font-semibold"> / {srv.commitment}</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {due} Due
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-3">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-3 text-center text-[10px]">
                  <div>
                    <span className="text-zinc-400 block font-medium">Views</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{(srv.views || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-medium">Reach</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{(srv.reach || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-medium">Leads</span>
                    <span className="font-bold text-emerald-600">+{srv.leads || 0}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RECENT DELIVERABLES TABLE & RECENT ACTIVITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Deliverables Table */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Recent Social Media Deliverables &amp; Creatives
              </h3>
              <p className="text-[11px] text-zinc-400">
                Creatives posted across Meta, Instagram, Facebook &amp; Google
              </p>
            </div>

            {(isAdmin || canAdd) && (
              <Button
                onClick={() => setIsAddPostOpen(true)}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 px-2.5 rounded-lg cursor-pointer"
              >
                + Add Post
              </Button>
            )}
          </div>

          {campaignPosts.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              No creatives recorded yet for this client campaign.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400">
                    <th className="pb-2.5 font-bold">Creative / Post</th>
                    <th className="pb-2.5 font-bold">Category</th>
                    <th className="pb-2.5 font-bold">Platform</th>
                    <th className="pb-2.5 font-bold">Date &amp; Time</th>
                    <th className="pb-2.5 font-bold">Views / Likes</th>
                    <th className="pb-2.5 font-bold">Reach</th>
                    <th className="pb-2.5 font-bold">Status</th>
                    <th className="pb-2.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {campaignPosts.slice(0, 10).map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.contentPreview || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate max-w-[180px]">
                              {p.title}
                            </span>
                            <span className="text-[10px] text-zinc-400 block truncate">
                              ID: {p.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 pr-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {p.service}
                        </span>
                      </td>

                      <td className="py-2.5 pr-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {p.platform || "Meta"}
                        </span>
                      </td>

                      <td className="py-2.5 pr-2 text-zinc-500 font-medium whitespace-nowrap">
                        {p.publishedAt}
                      </td>

                      <td className="py-2.5 pr-2 font-bold text-zinc-800 dark:text-zinc-200">
                        <div>{(p.views || 0).toLocaleString()} 👁️</div>
                        {p.likes ? <div className="text-[10px] font-medium text-rose-600">+{p.likes} ❤️</div> : null}
                      </td>

                      <td className="py-2.5 pr-2 font-bold text-zinc-800 dark:text-zinc-200">
                        {(p.reach || 0).toLocaleString()}
                      </td>

                      <td className="py-2.5 pr-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                          {p.status || "Posted"}
                        </span>
                      </td>

                      <td className="py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {p.postUrl && (
                            <a
                              href={p.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                              title="Open live link on Meta / Social Media"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setViewingPost(p)}
                            className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Campaign Timeline / Recent Activity */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mb-3">
              Campaign Delivery Timeline
            </h3>

            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
              {campaignPosts.slice(0, 5).map((p) => (
                <div key={p.id} className="relative pl-6 text-xs">
                  <span className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-zinc-900" />
                  <span className="text-[10px] text-zinc-400 block font-medium">
                    {p.publishedAt}
                  </span>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {p.service} Delivered
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    "{p.title}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 block mb-0.5">
                Official Retainer Contract (Form 9)
              </span>
              <p className="text-[10px] text-purple-700 dark:text-purple-400">
                Commitments are locked under contract. Deliverables sync automatically upon upload.
              </p>
            </div>
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
