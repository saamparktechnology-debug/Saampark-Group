"use client"

import * as React from "react"
import { 
  Printer, X, Share2, Check, CheckSquare, Square, 
  Sparkles, Megaphone, Video, Image as ImageIcon,
  Building2, Phone, MapPin, Calendar, Layers, ShieldCheck, 
  TrendingUp, Users, Target, FileText
} from "lucide-react"
import { DigitalMarketingPackage } from "@/types/digitalMarketing"
import { useAuthStore, getCompanyLogoUrl } from "@/store/useAuthStore"
import { printDocument } from "@/lib/printUtils"

interface OfficialFormNo9DocumentProps {
  pkg: DigitalMarketingPackage
  clientInfo?: {
    name?: string
    businessName?: string
    phone?: string
    contactNo?: string
    contactPerson?: string
    address?: string
    category?: string
  }
  branchInfo?: {
    branchName?: string
    branchCode?: string
    date?: string
  }
  onClose?: () => void
  onUpdatePkg?: (updated: DigitalMarketingPackage) => void
  isEditable?: boolean
}

export function OfficialFormNo9Document({
  pkg,
  clientInfo,
  branchInfo,
  onClose,
  onUpdatePkg,
  isEditable = false,
}: OfficialFormNo9DocumentProps) {
  const { companies, activeCompanyId, branches } = useAuthStore()
  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0]

  const branchName = branchInfo?.branchName || "Balichak"
  const branchCode = branchInfo?.branchCode || "B-2501"
  const docDate = branchInfo?.date || pkg.startDate || new Date().toLocaleDateString("en-GB")

  const handleTogglePosterDone = (index: number) => {
    if (!isEditable || !onUpdatePkg) return
    const schedule = [...(pkg.posterSchedule || [])]
    if (schedule[index]) {
      schedule[index] = { ...schedule[index], done: !schedule[index].done }
      onUpdatePkg({ ...pkg, posterSchedule: schedule })
    }
  }

  const handleToggleVideoDone = (index: number) => {
    if (!isEditable || !onUpdatePkg) return
    const schedule = [...(pkg.videoSchedule || [])]
    if (schedule[index]) {
      schedule[index] = { ...schedule[index], done: !schedule[index].done }
      onUpdatePkg({ ...pkg, videoSchedule: schedule })
    }
  }

  const handlePrint = () => {
    printDocument("saampark-form-9-sheet", `Form_No_9_${pkg.planName || (pkg as any).packageName || "Campaign"}`)
  }

  // Ensure 15 rows for neat physical form alignment
  const posterRows = React.useMemo(() => {
    const list = [...(pkg.posterSchedule || [])]
    while (list.length < 15) {
      list.push({
        sl: list.length + 1,
        date: "___/___/2026",
        done: false,
        remarks: "",
        type: "poster",
      })
    }
    return list
  }, [pkg.posterSchedule])

  const videoRows = React.useMemo(() => {
    const list = [...(pkg.videoSchedule || [])]
    while (list.length < 15) {
      list.push({
        sl: list.length + 1,
        date: "___/___/2026",
        done: false,
        remarks: "",
        type: "video",
      })
    }
    return list
  }, [pkg.videoSchedule])

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto">
      <div className="bg-white text-zinc-900 w-full max-w-4xl max-h-[96vh] overflow-y-auto rounded-2xl shadow-2xl border border-zinc-200 print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none flex flex-col my-auto">
        
        {/* Top Floating Action Bar (Hidden on print) */}
        <div className="p-4 bg-zinc-900 text-white flex items-center justify-between sticky top-0 z-50 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-black uppercase tracking-wider">
              {pkg.formNumber || "FORM NO - 9"}
            </span>
            <span className="text-sm font-semibold text-zinc-200">
              Digital Marketing & Ads Campaign Sheet
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Form No - 9</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* ---------------- DOCUMENT CANVAS (Matches Form No - 9) ---------------- */}
        <div id="saampark-form-9-sheet" className="p-6 sm:p-8 space-y-4 text-xs font-sans bg-white print:p-6 print:m-0">
          
          {/* Header Row */}
          <div className="flex items-start justify-between border-b-2 border-zinc-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black text-xl tracking-tighter shrink-0 border border-zinc-700">
                SS
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 uppercase">
                  SAAMPARK
                </h1>
                <div className="text-[11px] font-bold tracking-widest text-zinc-700 uppercase">
                  CONSULTANCY SERVICE
                </div>
                <div className="text-[10px] text-zinc-500 italic">
                  Your Business&apos;s Digital Growth Partner
                </div>
              </div>
            </div>

            {/* Top Right Form Badge */}
            <div className="border-2 border-zinc-800 rounded-xl px-4 py-2 text-center bg-zinc-50">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                OFFICIAL RECORD
              </div>
              <div className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                {pkg.formNumber || "FORM NO - 9"}
              </div>
            </div>
          </div>

          {/* Sub-Header: Branch, Code & Date */}
          <div className="grid grid-cols-3 border border-zinc-400 rounded-lg p-2 text-center font-semibold bg-zinc-50/60 text-[11px]">
            <div>
              <span className="text-zinc-500">Branch : </span>
              <span className="font-bold text-zinc-900">{branchName}</span>
            </div>
            <div className="border-x border-zinc-300">
              <span className="text-zinc-500">Code : </span>
              <span className="font-bold text-zinc-900">{branchCode}</span>
            </div>
            <div>
              <span className="text-zinc-500">Date : </span>
              <span className="font-bold text-zinc-900">{docDate}</span>
            </div>
          </div>

          {/* Client Information & Package Details 2-Column Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Client Information */}
            <div className="border border-zinc-400 rounded-lg overflow-hidden">
              <div className="bg-zinc-200/80 px-3 py-1.5 font-bold text-zinc-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-zinc-300">
                <Users size={13} />
                <span>CLIENT INFORMATION</span>
              </div>
              <div className="p-3 space-y-1.5 text-[11px]">
                <div className="flex">
                  <span className="w-28 text-zinc-500 font-medium">Business Name :</span>
                  <span className="font-bold text-zinc-900 flex-1">
                    {clientInfo?.businessName || clientInfo?.name || "Mahaprabhu Enterprise"}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500 font-medium">Contact Person :</span>
                  <span className="font-semibold text-zinc-800 flex-1">
                    {clientInfo?.contactPerson || clientInfo?.name || "Asesh"}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500 font-medium">Contact No. :</span>
                  <span className="font-mono font-bold text-zinc-900 flex-1">
                    {clientInfo?.contactNo || clientInfo?.phone || "9735540209"}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500 font-medium">Address :</span>
                  <span className="text-zinc-800 flex-1">
                    {clientInfo?.address || "Krishnapalashi, Sabong"}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500 font-medium">Category :</span>
                  <span className="font-semibold text-zinc-900 flex-1">
                    {clientInfo?.category || pkg.category || "Solar & Inverter"}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Package Details */}
            <div className="border border-zinc-400 rounded-lg overflow-hidden">
              <div className="bg-zinc-200/80 px-3 py-1.5 font-bold text-zinc-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-zinc-300">
                <Layers size={13} />
                <span>PACKAGE DETAILS</span>
              </div>
              <div className="p-3 space-y-1.5 text-[11px]">
                <div className="flex">
                  <span className="w-32 text-zinc-500 font-medium">Plan Name :</span>
                  <span className="font-black text-blue-900 flex-1 uppercase">
                    {pkg.planName || "Grow - 2"}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-zinc-500 font-medium">Package Duration :</span>
                  <span className="font-bold text-zinc-900 flex-1">
                    {pkg.packageDuration || "1 month"}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-zinc-500 font-medium">Start Date :</span>
                  <span className="font-mono font-semibold text-zinc-800 flex-1">
                    {pkg.startDate}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-zinc-500 font-medium">Expire Date :</span>
                  <span className="font-mono font-bold text-rose-700 flex-1">
                    {pkg.expireDate}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-zinc-500 font-medium">Special Note :</span>
                  <span className="text-zinc-700 italic flex-1">
                    {pkg.specialNote || "Targeted lead generation with festive campaigns."}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Performance Report Section */}
          <div className="border border-zinc-400 rounded-lg overflow-hidden">
            <div className="bg-zinc-800 text-white px-3 py-1.5 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} />
                <span>PERFORMANCE REPORT</span>
              </div>
              <div className="text-[10px] font-mono font-normal">
                Date : {pkg.performance?.startDate || pkg.startDate} To : {pkg.performance?.endDate || pkg.expireDate}
              </div>
            </div>

            <div className="grid grid-cols-5 text-center divide-x divide-zinc-300 bg-zinc-50">
              <div className="p-2">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Posts</div>
                <div className="text-sm font-black text-zinc-900 mt-0.5">
                  {pkg.performance?.postsDelivered || `${pkg.postersCount || 12} poster`}
                </div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">VIDEOS</div>
                <div className="text-sm font-black text-zinc-900 mt-0.5">
                  {pkg.performance?.videosDelivered || `${pkg.videosCount || 2} AI Reels`}
                </div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Leads</div>
                <div className="text-sm font-black text-emerald-700 mt-0.5">
                  {pkg.performance?.leadsGenerated ?? 16}
                </div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">REACH</div>
                <div className="text-sm font-black text-blue-700 mt-0.5">
                  {pkg.performance?.reach ? Number(pkg.performance.reach).toLocaleString("en-IN") : "7,409"}
                </div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Followers</div>
                <div className="text-sm font-black text-purple-700 mt-0.5">
                  +{pkg.performance?.followersGained ?? 5}
                </div>
              </div>
            </div>
          </div>

          {/* Marketing Ads Details Tables (Poster vs Video side-by-side) */}
          <div className="border border-zinc-400 rounded-lg overflow-hidden">
            <div className="bg-zinc-200/90 px-3 py-1.5 font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center justify-between border-b border-zinc-300">
              <div className="flex items-center gap-1.5">
                <Megaphone size={14} className="text-zinc-700" />
                <span>MARKETING ADS DETAILS</span>
              </div>
              <span className="text-[10px] text-zinc-600 font-normal">
                Official Deliverable Verification Checklist
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-300">
              
              {/* Left Sub-Table: POSTER */}
              <div>
                <div className="bg-zinc-100 px-3 py-1 font-bold text-zinc-800 text-[10.5px] uppercase flex items-center justify-center gap-1.5 border-b border-zinc-300">
                  <ImageIcon size={12} />
                  <span>POSTER</span>
                </div>
                <table className="w-full text-left text-[10.5px]">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-300 text-zinc-600">
                      <th className="py-1 px-2 w-8 text-center font-bold">SL</th>
                      <th className="py-1 px-2 w-28 text-center font-bold">Date</th>
                      <th className="py-1 px-2 w-12 text-center font-bold">Done</th>
                      <th className="py-1 px-2 font-bold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono">
                    {posterRows.map((item, idx) => (
                      <tr key={`poster_${idx}`} className={item.done ? "bg-emerald-50/40" : ""}>
                        <td className="py-1 px-2 text-center font-bold text-zinc-500">{item.sl}</td>
                        <td className="py-1 px-2 text-center text-zinc-800">{item.date}</td>
                        <td className="py-1 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePosterDone(idx)}
                            disabled={!isEditable}
                            className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs transition-colors ${
                              item.done 
                                ? "bg-emerald-600 text-white font-bold" 
                                : "border border-zinc-400 bg-white"
                            } ${isEditable ? "cursor-pointer hover:border-emerald-500" : ""}`}
                          >
                            {item.done && <Check size={11} strokeWidth={3} />}
                          </button>
                        </td>
                        <td className="py-1 px-2 font-sans font-medium text-zinc-800">
                          {item.remarks || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Sub-Table: ADS / REEL VIDEO */}
              <div>
                <div className="bg-zinc-100 px-3 py-1 font-bold text-zinc-800 text-[10.5px] uppercase flex items-center justify-center gap-1.5 border-b border-zinc-300">
                  <Video size={12} />
                  <span>ADS / REEL VIDEO</span>
                </div>
                <table className="w-full text-left text-[10.5px]">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-300 text-zinc-600">
                      <th className="py-1 px-2 w-8 text-center font-bold">SL</th>
                      <th className="py-1 px-2 w-28 text-center font-bold">Date</th>
                      <th className="py-1 px-2 w-12 text-center font-bold">Done</th>
                      <th className="py-1 px-2 font-bold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono">
                    {videoRows.map((item, idx) => (
                      <tr key={`video_${idx}`} className={item.done ? "bg-emerald-50/40" : ""}>
                        <td className="py-1 px-2 text-center font-bold text-zinc-500">{item.sl}</td>
                        <td className="py-1 px-2 text-center text-zinc-800">{item.date}</td>
                        <td className="py-1 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleVideoDone(idx)}
                            disabled={!isEditable}
                            className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs transition-colors ${
                              item.done 
                                ? "bg-emerald-600 text-white font-bold" 
                                : "border border-zinc-400 bg-white"
                            } ${isEditable ? "cursor-pointer hover:border-emerald-500" : ""}`}
                          >
                            {item.done && <Check size={11} strokeWidth={3} />}
                          </button>
                        </td>
                        <td className="py-1 px-2 font-sans font-medium text-zinc-800">
                          {item.remarks || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* Bottom Grid: Notes + Activity & Remarks (Target Pin Codes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            
            {/* Box 1: Notes (Real Model, Toto Ads) */}
            <div className="border border-zinc-400 rounded-lg p-3 space-y-2">
              <div className="font-bold text-zinc-800 uppercase text-[11px] flex items-center gap-1.5 border-b border-zinc-200 pb-1">
                <FileText size={13} />
                <span>NOTES</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-start gap-1">
                  <span className="font-semibold text-zinc-900">• Real Model :</span>
                  <span className="text-zinc-800 flex-1">
                    {pkg.hasRealModelShoot 
                      ? `${pkg.modelShootDate || docDate} ${pkg.modelShootNotes || "Real Model Shoot extra"}` 
                      : "Not included in this plan"}
                  </span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="font-semibold text-zinc-900">• TOTO Ads :</span>
                  <span className="text-zinc-800 flex-1">
                    {pkg.hasTotoAds 
                      ? (pkg.totoAdsNotes || "Debra - Balichak route speaker & banner ads") 
                      : (pkg.totoAdsNotes || "Optional add-on for local route reach")}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Activity & Target Locations / Signatures */}
            <div className="border border-zinc-400 rounded-lg p-3 space-y-2 flex flex-col justify-between">
              <div>
                <div className="font-bold text-zinc-800 uppercase text-[11px] flex items-center gap-1.5 border-b border-zinc-200 pb-1">
                  <Target size={13} />
                  <span>ACTIVITY / TARGET LOCATIONS</span>
                </div>
                <div className="pt-1.5 text-[11px] text-zinc-800 leading-relaxed font-medium">
                  {pkg.targetLocations || "Amlagora 721121, Balichak 721124, Chandrakona 721402, Debra 721126, Garhbeta 721127, Ghatal 721146, Kharagpur 721123"}
                </div>
              </div>

              {/* Signatures Row */}
              <div className="pt-4 flex items-end justify-between border-t border-zinc-200 text-[10px]">
                <div>
                  <div className="w-24 border-b border-zinc-400 mb-1" />
                  <span className="text-zinc-500 font-semibold">Client Signature</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-zinc-900">SAAMPARK CONSULTANCY SERVICE</div>
                  <div className="text-[9.5px] text-zinc-500">Authorized Signatory & Stamp</div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer watermark */}
          <div className="pt-2 text-center text-[10px] text-zinc-400 border-t border-zinc-200 flex items-center justify-between">
            <span>Saampark Consultancy Service • Digital Marketing & Business Growth Division</span>
            <span>Document Generated via Saampark CRM</span>
          </div>

        </div>

      </div>
    </div>
  )
}

