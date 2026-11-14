"use client"

import * as React from "react"
import { 
  Sparkles, Plus, CheckCircle2, RefreshCw, Layers, 
  Calendar, Building2, TrendingUp, Users, ArrowRight,
  ShieldCheck, FileText, ExternalLink
} from "lucide-react"
import { MarketingCampaign } from "../types"
import { MarketingService } from "../services/marketingService"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import CreateCampaignModal from "../components/CreateCampaignModal"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

const STANDARD_PACKAGES = [
  {
    id: "pkg_starter",
    name: "Starter Digital Retainer",
    badge: "Popular for Small Brands",
    price: "₹15,000",
    period: "/month",
    description: "Consistent social presence with weekly creatives and basic reels.",
    deliverables: [
      { label: "12 Posters & Social Graphics", count: 12 },
      { label: "2 Short AI Reels / Videos", count: 2 },
      { label: "Meta Ad Account Setup & Management", count: 1 },
      { label: "Monthly Performance Report", count: 1 },
    ],
    bgClass: "border-zinc-200 dark:border-zinc-800",
    buttonClass: "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900",
  },
  {
    id: "pkg_growth",
    name: "Growth Scale Retainer",
    badge: "Most Recommended",
    price: "₹35,000",
    period: "/month",
    description: "Aggressive market capture with real model video shoot & multi-channel ads.",
    deliverables: [
      { label: "24 High-Impact Creative Posters", count: 24 },
      { label: "8 Motion Graphics & Video Reels", count: 8 },
      { label: "2 Real Model Video Shoots", count: 2 },
      { label: "Meta & Google Ads Campaign Management", count: 2 },
      { label: "Form No - 9 Deliverable SLA Guarantee", count: 1 },
    ],
    bgClass: "border-indigo-400 dark:border-indigo-600 shadow-md ring-1 ring-indigo-400",
    buttonClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
  },
  {
    id: "pkg_enterprise",
    name: "Enterprise Brand Retainer",
    badge: "Full Service Suite",
    price: "₹75,000",
    period: "/month",
    description: "Complete agency delegation with dedicated crew, tutors, and daily delivery.",
    deliverables: [
      { label: "40+ Custom Graphic Posters & Banners", count: 40 },
      { label: "16 High-Production Video Deliverables", count: 16 },
      { label: "4 Studio / Real Model Shoots", count: 4 },
      { label: "Dedicated Tutor / Marketing Lead", count: 1 },
      { label: "Full Funnel CRM & WhatsApp Automation", count: 1 },
    ],
    bgClass: "border-purple-300 dark:border-purple-700",
    buttonClass: "bg-purple-600 hover:bg-purple-700 text-white",
  },
]

export default function MarketingPlansPage() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"
  const canAdd = isAdmin || canPerformAction(user, "Digital Marketing", "add")

  const [campaigns, setCampaigns] = React.useState<MarketingCampaign[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [companyFilter, setCompanyFilter] = React.useState("all")

  const loadCampaigns = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await MarketingService.getCampaigns()
      setCampaigns(data || [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  const filtered = campaigns.filter(c => {
    if (companyFilter === "all") return true
    const comp = (c.companyId || "tech").toLowerCase()
    if (companyFilter === "tech") return comp.includes("tech")
    if (companyFilter === "digital") return comp.includes("digital")
    return true
  })

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 font-sans space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-5 sm:px-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Marketing Plans &amp; Retainers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              Form No - 9 Retainers
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage standardized agency packages, custom Form No. 9 retainers, commitment quotas &amp; client contracts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadCampaigns}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {(isAdmin || canAdd) && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Retainer Contract</span>
            </Button>
          )}
        </div>
      </div>

      {/* Standard Agency Retainer Packages */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              Standard Marketing Retainer Tiers
            </h2>
            <p className="text-[11px] text-zinc-400">
              Fixed commitment packages provisioned automatically for clients
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STANDARD_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-xs flex flex-col justify-between ${pkg.bgClass}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-500">{pkg.badge}</span>
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </div>

                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 mb-1">
                  {pkg.name}
                </h3>
                <p className="text-xs text-zinc-500 mb-4 min-h-[32px]">
                  {pkg.description}
                </p>

                <div className="flex items-baseline gap-1 mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{pkg.price}</span>
                  <span className="text-xs text-zinc-400 font-semibold">{pkg.period}</span>
                </div>

                <div className="space-y-2 mb-6">
                  {pkg.deliverables.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {(isAdmin || canAdd) && (
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className={`w-full text-xs font-bold py-2 rounded-xl shadow-xs cursor-pointer ${pkg.buttonClass}`}
                >
                  Provision Retainer
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Client Retainer Contracts Register */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              Active Client Retainers Portfolio ({filtered.length})
            </h2>
            <p className="text-[11px] text-zinc-400">
              Form No. 9 contracts in operation across both technology and digital marketing divisions
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
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

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">
            No active retainer contracts found for this company filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400">
                  <th className="pb-2.5 font-bold">Client / Company</th>
                  <th className="pb-2.5 font-bold">Package Name</th>
                  <th className="pb-2.5 font-bold">Duration</th>
                  <th className="pb-2.5 font-bold">Commitment</th>
                  <th className="pb-2.5 font-bold">Delivered</th>
                  <th className="pb-2.5 font-bold">Fulfillment</th>
                  <th className="pb-2.5 font-bold">Status</th>
                  <th className="pb-2.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((camp) => {
                  const compName = (camp.companyId || "tech").includes("digital") 
                    ? "SAAMPARK Digital Marketing" 
                    : "SAAMPARK Technology"
                  const total = camp.totalCommitment || 1
                  const posted = camp.totalPosted || 0
                  const pct = Math.min(100, Math.round((posted / total) * 100))

                  return (
                    <tr key={camp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 pr-2">
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                            {camp.clientName}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {compName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 pr-2 font-semibold text-zinc-800 dark:text-zinc-200">
                        {camp.packageName}
                      </td>

                      <td className="py-3 pr-2 text-zinc-500 whitespace-nowrap">
                        {camp.startDate || "Active"} → {camp.endDate || "Ongoing"}
                      </td>

                      <td className="py-3 pr-2 font-bold text-zinc-800 dark:text-zinc-200">
                        {camp.totalCommitment || 0} items
                      </td>

                      <td className="py-3 pr-2 font-bold text-indigo-600 dark:text-indigo-400">
                        {posted} items
                      </td>

                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">{pct}%</span>
                        </div>
                      </td>

                      <td className="py-3 pr-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          camp.status === "Active"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
                            : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800"
                        }`}>
                          {camp.status || "Active"}
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        <Link
                          href="/feature/marketing"
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                          <span>View Report</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CreateCampaignModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCampaignCreated={loadCampaigns}
        />
      )}
    </div>
  )
}

