"use client"

import * as React from "react"
import { 
  FileText, Plus, RefreshCw, Search, Eye, Filter, 
  Video, Image as ImageIcon, Sparkles, TrendingUp, 
  Layers, ExternalLink, Calendar, CheckCircle2, Clock
} from "lucide-react"
import { MarketingCampaign, MarketingPost } from "../types"
import { MarketingService } from "../services/marketingService"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import ViewCreativeModal from "../components/ViewCreativeModal"
import AddDeliverablePostModal from "../components/AddDeliverablePostModal"
import { Button } from "@/components/ui/Button"

export default function MarketingPostsPage() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"
  const canAdd = isAdmin || canPerformAction(user, "Digital Marketing", "add")

  const [posts, setPosts] = React.useState<MarketingPost[]>([])
  const [campaigns, setCampaigns] = React.useState<MarketingCampaign[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [serviceFilter, setServiceFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid")

  // Modals
  const [viewingPost, setViewingPost] = React.useState<MarketingPost | null>(null)
  const [isAddOpen, setIsAddOpen] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [pList, cList] = await Promise.all([
        MarketingService.getPosts(),
        MarketingService.getCampaigns()
      ])
      setPosts(pList || [])
      setCampaigns(cList || [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const filteredPosts = posts.filter(p => {
    if (serviceFilter !== "all" && p.service.toLowerCase() !== serviceFilter.toLowerCase()) return false
    if (statusFilter !== "all" && p.status?.toLowerCase() !== statusFilter.toLowerCase()) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchTitle = p.title?.toLowerCase().includes(q)
      const matchClient = p.clientName?.toLowerCase().includes(q)
      const matchNotes = p.notes?.toLowerCase().includes(q)
      if (!matchTitle && !matchClient && !matchNotes) return false
    }
    return true
  })

  // Metrics
  const totalPosts = posts.length
  const postersCount = posts.filter(p => p.service.toLowerCase().includes("poster")).length
  const videosCount = posts.filter(p => p.service.toLowerCase().includes("video")).length
  const realModelCount = posts.filter(p => p.service.toLowerCase().includes("model")).length
  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0)
  const totalReach = posts.reduce((acc, p) => acc + (p.reach || 0), 0)

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 font-sans space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-5 sm:px-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Posts &amp; Deliverables
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              Creative Assets Register
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track, schedule, and verify all social media posters, AI video reels, model shoots &amp; tutorial deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {(isAdmin || canAdd) && (
            <Button
              onClick={() => setIsAddOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Deliverable Post</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Posters Delivered</span>
            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{postersCount}</span>
            <span className="text-[10px] text-zinc-400 font-medium block">Static &amp; Carousels</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Video Reels</span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400">{videosCount}</span>
            <span className="text-[10px] text-zinc-400 font-medium block">Shorts &amp; Motion Graphics</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Real Model Shoots</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">{realModelCount}</span>
            <span className="text-[10px] text-zinc-400 font-medium block">Studio Production</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Total Organic Views</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalViews.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-400 font-medium block">{totalReach.toLocaleString()} Reach</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:px-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by creative title, client name, or notes..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="all">All Services</option>
            <option value="poster">Poster</option>
            <option value="video">Video</option>
            <option value="real model">Real Model Video</option>
            <option value="tutor">Tutor / Custom</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="posted">Posted</option>
            <option value="scheduled">Scheduled</option>
            <option value="in review">In Review</option>
            <option value="draft">Draft</option>
          </select>

          {/* Grid vs Table View Toggle */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs" : "text-zinc-500"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs" : "text-zinc-500"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Posts Content */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            {searchQuery ? "No Matching Deliverables Found" : "No Deliverables Recorded Yet"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5">
            {searchQuery ? "Try refining your search terms or filters." : "Upload creative posters, reels, and video deliverables for active retainers."}
          </p>
          {(isAdmin || canAdd) && (
            <Button onClick={() => setIsAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs cursor-pointer px-4 py-2">
              + Add Deliverable Post
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setViewingPost(post)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Thumbnail Preview */}
                <div className="aspect-video w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.contentPreview || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-black/70 text-white backdrop-blur-xs">
                    {post.service}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-500 text-white">
                    {post.status || "Posted"}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <div>
                    <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h3>
                    <span className="text-[11px] text-zinc-400 block font-medium">
                      Client: {post.clientName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.publishedAt}
                    </span>
                    <span className="font-bold text-emerald-600">
                      +{post.leads || 0} Leads
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                  👁️ {(post.views || 0).toLocaleString()} Views
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                  View →
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400">
                <th className="pb-2.5 font-bold">Creative Post</th>
                <th className="pb-2.5 font-bold">Client Name</th>
                <th className="pb-2.5 font-bold">Service Type</th>
                <th className="pb-2.5 font-bold">Date &amp; Time</th>
                <th className="pb-2.5 font-bold">Views</th>
                <th className="pb-2.5 font-bold">Reach</th>
                <th className="pb-2.5 font-bold">Leads</th>
                <th className="pb-2.5 font-bold">Status</th>
                <th className="pb-2.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredPosts.map((p) => (
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
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
                        {p.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2 text-zinc-600 dark:text-zinc-300 font-semibold">{p.clientName}</td>
                  <td className="py-2.5 pr-2"><span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 font-medium">{p.service}</span></td>
                  <td className="py-2.5 pr-2 text-zinc-500 whitespace-nowrap">{p.publishedAt}</td>
                  <td className="py-2.5 pr-2 font-bold text-zinc-800 dark:text-zinc-200">{(p.views || 0).toLocaleString()}</td>
                  <td className="py-2.5 pr-2 font-bold text-zinc-800 dark:text-zinc-200">{(p.reach || 0).toLocaleString()}</td>
                  <td className="py-2.5 pr-2 font-bold text-emerald-600">+{p.leads || 0}</td>
                  <td className="py-2.5 pr-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">{p.status || "Posted"}</span></td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => setViewingPost(p)}
                      className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {viewingPost && (
        <ViewCreativeModal
          isOpen={Boolean(viewingPost)}
          onClose={() => setViewingPost(null)}
          post={viewingPost}
        />
      )}

      {isAddOpen && (
        <AddDeliverablePostModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          campaign={campaigns[0]}
          onPostAdded={loadData}
        />
      )}
    </div>
  )
}

