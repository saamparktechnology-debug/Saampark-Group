"use client"

import * as React from "react"
import { 
  Megaphone, Video, Image as ImageIcon, Sparkles, 
  Calendar, Check, Plus, Trash2, Clock, MapPin, 
  Layers, Eye, ShieldCheck, HelpCircle, Percent, Gift
} from "lucide-react"
import { 
  DigitalMarketingPackage, 
  SAAMPARK_9_PACKAGES, 
  DURATION_OFFERS,
  calculatePackageTotal,
  createDefaultMarketingPackage,
  MarketingScheduleItem
} from "@/types/digitalMarketing"
import { OfficialFormNo9Document } from "./OfficialFormNo9Document"

interface DigitalMarketingPackageBuilderProps {
  value?: DigitalMarketingPackage
  onChange: (pkg: DigitalMarketingPackage) => void
  clientName?: string
  clientPhone?: string
  clientAddress?: string
}

export function DigitalMarketingPackageBuilder({
  value,
  onChange,
  clientName,
  clientPhone,
  clientAddress,
}: DigitalMarketingPackageBuilderProps) {
  const pkg = value || createDefaultMarketingPackage("Package 02 - Grow")
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)

  const handleSelectPackage = (pkgIdOrName: string) => {
    if (pkgIdOrName === "custom") {
      onChange({
        ...pkg,
        enabled: true,
        planName: "Custom Retainer Package",
        packageDuration: pkg.packageDuration || "1 month",
        postersCount: pkg.postersCount || 12,
        videosCount: pkg.videosCount || 6,
        storyCount: pkg.storyCount || 30,
        hasRealModelShoot: pkg.hasRealModelShoot || false,
        packagePrice: pkg.packagePrice || 15000,
        baseMonthlyPrice: pkg.baseMonthlyPrice || 15000,
        specialNote: "Custom tailored marketing deliverables and strategy",
        features: ["Custom tailored deliverables", "Flexible strategy"],
        expectedViews: "Custom Scope",
        expectedLeads: "Custom Scope",
        bestFor: "Tailored Client Requirements",
      })
      return
    }

    const found = SAAMPARK_9_PACKAGES.find(p => p.id === pkgIdOrName || p.name === pkgIdOrName)
    if (!found) return

    const duration = pkg.packageDuration || "1 month"
    const calc = calculatePackageTotal(found.price, duration)

    onChange({
      ...pkg,
      enabled: true,
      planName: found.name,
      packageDuration: duration,
      durationMonths: calc.months,
      baseMonthlyPrice: found.price,
      discountPercent: calc.discountPct,
      freeOfferText: calc.offer,
      postersCount: found.postersCount,
      videosCount: found.videosCount,
      storyCount: found.storyCount,
      hasRealModelShoot: found.hasRealModelShoot,
      packagePrice: calc.netPrice,
      specialNote: found.description,
      features: found.features,
      expectedViews: found.expectedViews,
      expectedLeads: found.expectedLeads,
      bestFor: found.bestFor,
    })
  }

  const handleDurationChange = (dur: string) => {
    const base = pkg.baseMonthlyPrice || pkg.packagePrice || 4999
    const calc = calculatePackageTotal(base, dur)
    onChange({
      ...pkg,
      packageDuration: dur,
      durationMonths: calc.months,
      discountPercent: calc.discountPct,
      freeOfferText: calc.offer,
      packagePrice: calc.netPrice,
    })
  }

  // Safe number input updater that allows backspacing to empty without sticking at 0
  const handleNumericChange = (field: keyof DigitalMarketingPackage, rawValue: string) => {
    if (rawValue === "") {
      onChange({
        ...pkg,
        [field]: 0,
      })
    } else {
      const parsed = Number(rawValue)
      onChange({
        ...pkg,
        [field]: isNaN(parsed) ? 0 : parsed,
      })
    }
  }

  const isCustom = !SAAMPARK_9_PACKAGES.some(p => p.name === pkg.planName)

  return (
    <div className="border border-purple-200 dark:border-purple-800/60 rounded-2xl bg-purple-50/20 dark:bg-purple-950/20 p-4 sm:p-5 space-y-4">
      
      {/* Header & Plan Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/60 dark:border-purple-800/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Megaphone size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Digital Marketing Package Configurator
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                Saampark Retainer
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Select one of the 9 official flyer packages or customize deliverables manually
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-white dark:bg-zinc-800 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Eye size={13} />
          <span>Preview Plan Form</span>
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* Dropdowns Row: Package Selector & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white dark:bg-zinc-900/60 p-3.5 rounded-xl border border-purple-200/60 dark:border-purple-800/40">
          <div>
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Select Marketing Package *
            </label>
            <select
              value={isCustom ? "custom" : (SAAMPARK_9_PACKAGES.find(p => p.name === pkg.planName)?.id || "pkg-02")}
              onChange={e => handleSelectPackage(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/50 dark:bg-zinc-800 border border-purple-300 dark:border-purple-700 rounded-xl font-bold text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <optgroup label="Official Saampark Flyer Packages">
                {SAAMPARK_9_PACKAGES.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.price.toLocaleString("en-IN")}/mo ({p.postersCount} Posts, {p.videosCount} Reels/Videos)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Custom Plan">
                <option value="custom">Custom Manual Package (Fully Editable)</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Plan Duration & Multi-Month Offer *
            </label>
            <select
              value={pkg.packageDuration || "1 month"}
              onChange={e => handleDurationChange(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/50 dark:bg-zinc-800 border border-purple-300 dark:border-purple-700 rounded-xl font-bold text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {DURATION_OFFERS.map(d => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Highlighted Flyer Badges & Offers */}
        {pkg.freeOfferText && (
          <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Gift size={16} className="text-amber-600 shrink-0" />
            <span>Special Promotional Offer Applied: <strong>{pkg.freeOfferText}</strong></span>
          </div>
        )}

        {/* Pricing & Deliverables Inputs (All with '0 can cut' fix) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div>
            <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
              Net Package Price (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">₹</span>
              <input
                type="number"
                min="0"
                value={pkg.packagePrice === 0 ? "" : pkg.packagePrice}
                onChange={e => handleNumericChange("packagePrice", e.target.value)}
                placeholder="4999"
                className="w-full pl-6 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono font-bold text-xs text-purple-700 dark:text-purple-300 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
              Social Posts Count
            </label>
            <input
              type="number"
              min="0"
              value={pkg.postersCount === 0 ? "" : pkg.postersCount}
              onChange={e => handleNumericChange("postersCount", e.target.value)}
              placeholder="12"
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
              Reels / Promo Videos
            </label>
            <input
              type="number"
              min="0"
              value={pkg.videosCount === 0 ? "" : pkg.videosCount}
              onChange={e => handleNumericChange("videosCount", e.target.value)}
              placeholder="2"
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
              Story Updates
            </label>
            <input
              type="number"
              min="0"
              value={pkg.storyCount === 0 ? "" : (pkg.storyCount || "")}
              onChange={e => handleNumericChange("storyCount", e.target.value)}
              placeholder="12"
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Deliverable Highlights & Estimates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <span className="text-[10px] font-bold text-zinc-400 block">EXPECTED REACH</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{pkg.expectedViews || "10K - 30K Views / mo"}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <span className="text-[10px] font-bold text-zinc-400 block">EXPECTED LEADS</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{pkg.expectedLeads || "8 - 15 Qualified Enquiries"}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <span className="text-[10px] font-bold text-zinc-400 block">TARGET BUSINESS PROFILE</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{pkg.bestFor || "Growing Businesses"}</span>
          </div>
        </div>

        {/* Model Shoot & Toto Ads Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(pkg.hasRealModelShoot)}
              onChange={e => onChange({ ...pkg, hasRealModelShoot: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
              Include Real Model / Product Shoot
            </span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(pkg.hasTotoAds)}
              onChange={e => onChange({ ...pkg, hasTotoAds: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
              Include Local Toto Route Branding
            </span>
          </label>
        </div>

        {/* Package Notes / Scope */}
        <div>
          <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
            Deliverables Description / Scope Included
          </label>
          <textarea
            rows={2}
            value={pkg.specialNote || ""}
            onChange={e => onChange({ ...pkg, specialNote: e.target.value })}
            placeholder="Add specific deliverable notes or client instructions..."
            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Official Form No 9 Document Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            >
              ✕
            </button>
            <OfficialFormNo9Document
              pkg={pkg}
              clientInfo={{
                name: clientName,
                phone: clientPhone,
                address: clientAddress,
              }}
              onClose={() => setIsPreviewOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
