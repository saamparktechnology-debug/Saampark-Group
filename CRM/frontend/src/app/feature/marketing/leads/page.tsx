"use client"

import * as React from "react"
import { 
  Target, Plus, RefreshCw, Search, Filter, 
  TrendingUp, Download, Phone, Mail, ExternalLink,
  CheckCircle2, Clock, Users, ArrowUpRight, Megaphone
} from "lucide-react"
import { MarketingLead, MarketingCampaign } from "../types"
import { MarketingService } from "../services/marketingService"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { Button } from "@/components/ui/Button"

export default function MarketingLeadsPage() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"
  const canAdd = isAdmin || canPerformAction(user, "Digital Marketing", "add")

  const [leads, setLeads] = React.useState<MarketingLead[]>([])
  const [campaigns, setCampaigns] = React.useState<MarketingCampaign[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sourceFilter, setSourceFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // New Lead Modal
  const [isAddLeadOpen, setIsAddLeadOpen] = React.useState(false)
  const [newLeadName, setNewLeadName] = React.useState("")
  const [newLeadPhone, setNewLeadPhone] = React.useState("")
  const [newLeadEmail, setNewLeadEmail] = React.useState("")
  const [newLeadSource, setNewLeadSource] = React.useState("Meta Ads")
  const [newLeadCampaignId, setNewLeadCampaignId] = React.useState("")

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [leadsList, campList] = await Promise.all([
        MarketingService.getMarketingLeads(),
        MarketingService.getCampaigns()
      ])
      setLeads(leadsList || [])
      setCampaigns(campList || [])
      if (campList && campList.length > 0 && !newLeadCampaignId) {
        setNewLeadCampaignId(campList[0].id)
      }
    } finally {
      setIsLoading(false)
    }
  }, [newLeadCampaignId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleStatusChange = async (leadId: string, newStatus: "New" | "Contacted" | "Converted") => {
    await MarketingService.updateMarketingLeadStatus(leadId, newStatus)
    loadData()
  }

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeadName.trim() || !newLeadPhone.trim()) return

    const matchedCamp = campaigns.find(c => c.id === newLeadCampaignId)

    await MarketingService.addMarketingLead({
      campaignId: newLeadCampaignId,
      clientId: matchedCamp?.clientId || "CLT-GEN",
      name: newLeadName.trim(),
      phone: newLeadPhone.trim(),
      email: newLeadEmail.trim() || undefined,
      source: newLeadSource,
      campaignName: matchedCamp?.packageName || "Meta Ads Lead Generation",
      capturedAt: new Date().toLocaleDateString("en-GB") + ", " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      status: "New"
    })

    setNewLeadName("")
    setNewLeadPhone("")
    setNewLeadEmail("")
    setIsAddLeadOpen(false)
    loadData()
  }

  const handleExportCSV = () => {
    if (leads.length === 0) return
    const headers = ["Lead ID", "Name", "Phone", "Email", "Source", "Campaign", "Captured At", "Status"]
    const rows = leads.map(l => [
      l.id,
      `"${l.name}"`,
      `"${l.phone}"`,
      `"${l.email || ""}"`,
      `"${l.source}"`,
      `"${l.campaignName}"`,
      `"${l.capturedAt}"`,
      `"${l.status}"`
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Marketing_Leads_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredLeads = leads.filter(l => {
    if (sourceFilter !== "all" && l.source.toLowerCase() !== sourceFilter.toLowerCase()) return false
    if (statusFilter !== "all" && l.status.toLowerCase() !== statusFilter.toLowerCase()) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = l.name.toLowerCase().includes(q)
      const matchPhone = l.phone.includes(q)
      const matchEmail = l.email?.toLowerCase().includes(q)
      const matchCamp = l.campaignName?.toLowerCase().includes(q)
      if (!matchName && !matchPhone && !matchEmail && !matchCamp) return false
    }
    return true
  })

  // Metrics
  const totalLeads = leads.length
  const metaLeads = leads.filter(l => l.source.toLowerCase().includes("meta")).length
  const whatsappLeads = leads.filter(l => l.source.toLowerCase().includes("whatsapp")).length
  const convertedLeads = leads.filter(l => l.status === "Converted").length
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 font-sans space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-5 sm:px-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Marketing Leads &amp; Ads
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Paid Acquisition Pipeline
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time Meta Ads, WhatsApp and Google Ads lead capture, attribution tracking &amp; conversion pipeline.
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

          {leads.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {(isAdmin || canAdd) && (
            <Button
              onClick={() => setIsAddLeadOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Ad Lead</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Total Ad Leads</span>
            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">+{totalLeads}</span>
            <span className="text-[10px] text-zinc-400 font-medium block">Form fills &amp; DMs</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Meta Ads Leads</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">{metaLeads}</span>
            <span className="text-[10px] text-zinc-400 font-medium block">Instagram &amp; FB</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">WhatsApp Inquiries</span>
            <span className="text-xl font-black text-teal-600 dark:text-teal-400">{whatsappLeads}</span>
            <span className="text-[10px] text-zinc-400 font-medium block">Click-to-chat ads</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block">Conversion Rate</span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400">{conversionRate}%</span>
            <span className="text-[10px] text-emerald-600 font-bold block">{convertedLeads} Deals Closed</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:px-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by lead name, phone, or campaign..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="all">All Sources</option>
            <option value="meta ads">Meta Ads</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="google ads">Google Ads</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="all">All Pipeline Stages</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {filteredLeads.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">
            {searchQuery ? "No matching leads found." : "No ad campaign leads recorded yet. Click '+ Record Ad Lead' to add new inquiries."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400">
                  <th className="pb-2.5 font-bold">Prospect / Lead Name</th>
                  <th className="pb-2.5 font-bold">Contact Info</th>
                  <th className="pb-2.5 font-bold">Ad Source</th>
                  <th className="pb-2.5 font-bold">Campaign</th>
                  <th className="pb-2.5 font-bold">Captured At</th>
                  <th className="pb-2.5 font-bold">Status</th>
                  <th className="pb-2.5 font-bold text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 pr-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                        {l.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {l.id}
                      </span>
                    </td>

                    <td className="py-3 pr-2 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                        <Phone className="w-3 h-3 text-zinc-400" />
                        <span>{l.phone}</span>
                      </div>
                      {l.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          <span>{l.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 pr-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {l.source}
                      </span>
                    </td>

                    <td className="py-3 pr-2 font-medium text-zinc-600 dark:text-zinc-300">
                      {l.campaignName}
                    </td>

                    <td className="py-3 pr-2 text-zinc-500 whitespace-nowrap">
                      {l.capturedAt}
                    </td>

                    <td className="py-3 pr-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        l.status === "Converted"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
                          : l.status === "Contacted"
                            ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                            : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:border-amber-800"
                      }`}>
                        {l.status}
                      </span>
                    </td>

                    <td className="py-3 text-right">
                      <select
                        value={l.status}
                        onChange={(e) => handleStatusChange(l.id, e.target.value as any)}
                        className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Converted">Converted ✓</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                Record Ad Campaign Lead
              </h3>
              <button
                onClick={() => setIsAddLeadOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Prospect Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Ad Source
                  </label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                  >
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Google Ads">Google Ads</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Assigned Campaign
                  </label>
                  <select
                    value={newLeadCampaignId}
                    onChange={(e) => setNewLeadCampaignId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.clientName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="text-xs h-9 px-4 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4 rounded-xl shadow-xs"
                >
                  Save Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

