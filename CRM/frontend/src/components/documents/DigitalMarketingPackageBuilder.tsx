"use client"

import * as React from "react"
import { 
  Megaphone, Video, Image as ImageIcon, Sparkles, 
  Calendar, Check, Plus, Trash2, Clock, MapPin, 
  Layers, Eye, ShieldCheck, HelpCircle
} from "lucide-react"
import { 
  DigitalMarketingPackage, 
  PRESET_MARKETING_PLANS, 
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
  const pkg = value || createDefaultMarketingPackage("Grow - 2")
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)

  const handleToggleEnable = (enabled: boolean) => {
    onChange({
      ...pkg,
      enabled,
    })
  }

  const handleSelectPreset = (presetName: string) => {
    const preset = PRESET_MARKETING_PLANS.find(p => p.name === presetName)
    if (!preset) return

    onChange({
      ...pkg,
      enabled: true,
      planName: preset.name,
      packageDuration: preset.duration,
      postersCount: preset.postersCount,
      videosCount: preset.videosCount,
      hasRealModelShoot: preset.modelShootIncluded,
      packagePrice: preset.price,
      specialNote: preset.description,
    })
  }

  return (
    <div className="border border-purple-200 dark:border-purple-800/60 rounded-2xl bg-purple-50/30 dark:bg-purple-950/20 p-4 sm:p-5 space-y-4">
      
      {/* Header Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/60 dark:border-purple-800/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Megaphone size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Digital Marketing & Social Media Ads Campaign
              </h4>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                Form No - 9
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Include posters, AI video reels, model shoot, target pin codes, and weekly/monthly ad tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={pkg.enabled}
              onChange={(e) => handleToggleEnable(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
            />
            <span className={pkg.enabled ? "text-purple-700 dark:text-purple-300 font-bold" : "text-zinc-500"}>
              {pkg.enabled ? "Package Active" : "Enable Package"}
            </span>
          </label>

          {pkg.enabled && (
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-white dark:bg-zinc-800 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Eye size={13} />
              <span>Preview Form 9</span>
            </button>
          )}
        </div>
      </div>

      {pkg.enabled && (
        <div className="space-y-4 animate-in fade-in duration-200 text-xs">
          
          {/* Preset Plan Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Sparkles size={12} className="text-purple-600" />
              <span>Select Preset Package</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_MARKETING_PLANS.map((p) => {
                const isSelected = pkg.planName === p.name
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-purple-300"
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] ml-1 opacity-75 font-mono">({p.duration})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Plan Name & Duration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                Plan Name
              </label>
              <input
                type="text"
                value={pkg.planName}
                onChange={(e) => onChange({ ...pkg, planName: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold text-zinc-900 dark:text-zinc-100"
                placeholder="e.g. Grow - 2"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                Package Duration
              </label>
              <select
                value={pkg.packageDuration}
                onChange={(e) => onChange({ ...pkg, packageDuration: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <option value="Weekly">Weekly (7 Days)</option>
                <option value="1 month">1 month</option>
                <option value="2 months">2 months</option>
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year (Annual)</option>
                <option value="Custom Dates">Custom Dates</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                Business Category
              </label>
              <input
                type="text"
                value={pkg.category || ""}
                onChange={(e) => onChange({ ...pkg, category: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
                placeholder="e.g. Solar, Jewellery, Retail, Education"
              />
            </div>
          </div>

          {/* Dates: Start Date & Expire Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                Campaign Start Date
              </label>
              <input
                type="text"
                value={pkg.startDate}
                onChange={(e) => onChange({ ...pkg, startDate: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-zinc-900 dark:text-zinc-100"
                placeholder="25/Sep/2026"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                Campaign Expire Date
              </label>
              <input
                type="text"
                value={pkg.expireDate}
                onChange={(e) => onChange({ ...pkg, expireDate: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-zinc-900 dark:text-zinc-100"
                placeholder="24/Oct/2026"
              />
            </div>
          </div>

          {/* Deliverables Quota Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
                <ImageIcon size={12} className="text-blue-500" />
                <span>Posters Count</span>
              </label>
              <input
                type="number"
                min="0"
                value={pkg.postersCount ?? 12}
                onChange={(e) => onChange({ ...pkg, postersCount: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-600 rounded-md font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
                <Video size={12} className="text-purple-500" />
                <span>Reels / Videos</span>
              </label>
              <input
                type="number"
                min="0"
                value={pkg.videosCount ?? 2}
                onChange={(e) => onChange({ ...pkg, videosCount: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-600 rounded-md font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
                <Layers size={12} className="text-amber-500" />
                <span>Banners</span>
              </label>
              <input
                type="number"
                min="0"
                value={pkg.bannersCount ?? 2}
                onChange={(e) => onChange({ ...pkg, bannersCount: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-600 rounded-md font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
                <Sparkles size={12} className="text-emerald-500" />
                <span>Leaflets</span>
              </label>
              <input
                type="number"
                min="0"
                value={pkg.leafletsCount ?? 1}
                onChange={(e) => onChange({ ...pkg, leafletsCount: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-600 rounded-md font-bold"
              />
            </div>
          </div>

          {/* Model Shoot & Toto Ads Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Model Shoot */}
            <div className="p-3 bg-white dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <span>📸 Real Model / Influencer Shoot</span>
                </span>
                <input
                  type="checkbox"
                  checked={pkg.hasRealModelShoot}
                  onChange={(e) => onChange({ ...pkg, hasRealModelShoot: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
              </label>
              {pkg.hasRealModelShoot && (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={pkg.modelShootDate || ""}
                    onChange={(e) => onChange({ ...pkg, modelShootDate: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-md font-mono"
                    placeholder="Shoot Date: 23/10/2026"
                  />
                  <input
                    type="text"
                    value={pkg.modelShootNotes || ""}
                    onChange={(e) => onChange({ ...pkg, modelShootNotes: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-md"
                    placeholder="Shoot Notes: Real Model Shoot extra"
                  />
                </div>
              )}
            </div>

            {/* Toto / Offline Local Ads */}
            <div className="p-3 bg-white dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <span>🛺 TOTO Ads / Local Route Speaker</span>
                </span>
                <input
                  type="checkbox"
                  checked={pkg.hasTotoAds}
                  onChange={(e) => onChange({ ...pkg, hasTotoAds: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
              </label>
              {pkg.hasTotoAds && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={pkg.totoAdsNotes || ""}
                    onChange={(e) => onChange({ ...pkg, totoAdsNotes: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-md"
                    placeholder="Route Notes: Balichak - Debra route Toto ads"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Target Locations & Pin Codes */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
              <MapPin size={12} className="text-rose-500" />
              <span>Target Pin Codes & Audience Locations (For Meta & Google Ads)</span>
            </label>
            <textarea
              rows={2}
              value={pkg.targetLocations || ""}
              onChange={(e) => onChange({ ...pkg, targetLocations: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 font-medium"
              placeholder="Amlagora 721121, Balichak 721124, Chandrakona 721402, Debra 721126, Ghatal 721146, Kharagpur 721123"
            />
          </div>

        </div>
      )}

      {/* Modal Preview */}
      {isPreviewOpen && (
        <OfficialFormNo9Document
          pkg={pkg}
          clientInfo={{
            name: clientName,
            businessName: clientName,
            phone: clientPhone,
            address: clientAddress,
            category: pkg.category,
          }}
          onClose={() => setIsPreviewOpen(false)}
          onUpdatePkg={onChange}
          isEditable={true}
        />
      )}

    </div>
  )
}

