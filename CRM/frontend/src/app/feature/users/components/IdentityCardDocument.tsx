"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Building2, MapPin, Calendar, Mail, Phone, ShieldCheck, 
  Award, QrCode, Download, Printer, Send, Sparkles, Droplets,
  CheckCircle2, RefreshCw, Check
} from "lucide-react"
import { UserItem } from "../types"
import { Company, Branch, SubBranch } from "@/app/feature/companies/types"

interface IdentityCardDocumentProps {
  user: UserItem
  company?: any
  branch?: any
  subBranch?: any
  interactive?: boolean
  layoutOrientation?: "portrait" | "landscape"
  onSendEmail?: () => void
  isSendingEmail?: boolean
}

export function IdentityCardDocument({
  user,
  company,
  branch,
  subBranch,
  interactive = false,
  layoutOrientation = "portrait",
  onSendEmail,
  isSendingEmail = false,
}: IdentityCardDocumentProps) {
  const [activeSide, setActiveSide] = React.useState<"front" | "back">("front")
  const [orientation, setOrientation] = React.useState<"portrait" | "landscape">(layoutOrientation)

  const empId = user.employeeId || `SP-EMP-${String(user.id).replace(/[^0-9]/g, "").slice(-4).padStart(4, "0") || "0041"}`
  const companyName = company?.name || user.companyName || "SAAMPARK TECHNOLOGY PRIVATE LIMITED"
  const brandName = company?.brand_name || "SAAMPARK"
  const divisionName = company?.division_name || "TECHNOLOGY"
  const logoUrl = company?.logo_url || "/logo.png"
  
  const hasBranch = Boolean(
    branch?.name || 
    (user.branchName && user.branchName.trim() && !user.branchName.toLowerCase().includes("all") && !user.branchName.toLowerCase().includes("headquarters")) || 
    user.branchId
  )
  const branchName = branch?.name || user.branchName || "Regional Operational Branch"
  const subBranchName = subBranch?.name || user.subBranchName || user.sub_branch_name
  const locationLabel = hasBranch ? "Branch:" : "Organization:"
  const locationValue = hasBranch ? branchName : companyName

  const designation = user.designation || user.role || "Executive Team Member"
  const joiningDate = user.joinedDate || "15-Jun-2024"
  const avatarSrc = user.avatarUrl || (user as any).avatar
  const signatureUrl = company?.signature_image_url || branch?.signature_image_url
  const stampUrl = company?.stamp_image_url || branch?.stamp_image_url

  // Official verification URL for QR code (passes member details so any scanned device can verify with 0 login)
  const originUrl = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://saampark.com"
  const queryParams = new URLSearchParams({
    id: String(user.id || ""),
    empId: empId,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "Teams",
    designation: designation,
    department: user.department || "",
    company: companyName,
    branch: hasBranch ? branchName : "",
    subBranch: subBranchName || "",
    joined: joiningDate,
  })
  const verificationUrl = `${originUrl}/verify-member?${queryParams.toString()}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&ecc=M&data=${encodeURIComponent(verificationUrl)}`

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Interactive Controls Bar (Hides in Print) */}
      <div className="print:hidden w-full flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-3 rounded-2xl shadow-xs">
        {/* Front / Back Side Switcher */}
        <div className="flex items-center gap-1.5 bg-surface-hover p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setActiveSide("front")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSide === "front" 
                ? "bg-primary text-white shadow-xs" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🪪 Front Badge
          </button>
          <button
            type="button"
            onClick={() => setActiveSide("back")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSide === "back" 
                ? "bg-primary text-white shadow-xs" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🔄 Back Badge &amp; QR
          </button>
        </div>

        {/* Orientation Switcher */}
        <div className="flex items-center gap-1.5 bg-surface-hover p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setOrientation("portrait")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orientation === "portrait" 
                ? "bg-surface text-foreground shadow-xs border border-border" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Portrait (Lanyard)
          </button>
          <button
            type="button"
            onClick={() => setOrientation("landscape")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orientation === "landscape" 
                ? "bg-surface text-foreground shadow-xs border border-border" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Landscape (Card)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onSendEmail && (
            <button
              type="button"
              onClick={onSendEmail}
              disabled={isSendingEmail}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send size={13} className={isSendingEmail ? "animate-spin" : ""} />
              <span>{isSendingEmail ? "Sending..." : "Email ID Card"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer size={13} />
            <span>Print ID Card</span>
          </button>
        </div>
      </div>

      {/* ID Card Graphic Container */}
      <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 py-2">
        {/* PORTRAIT FRONT BADGE */}
        {(orientation === "portrait" && activeSide === "front") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[320px] sm:w-[340px] h-[510px] rounded-3xl overflow-hidden bg-white text-zinc-900 shadow-2xl border-2 border-zinc-200/90 relative flex flex-col justify-between select-none"
          >
            {/* Lanyard Hole Cutout slot */}
            <div className="w-14 h-2.5 rounded-full bg-zinc-200/90 border border-zinc-300 mx-auto mt-2 shrink-0" />

            {/* Header Strip with Gradient & Logo */}
            <div className="bg-gradient-to-r from-[#005f69] via-[#007380] to-[#008a99] text-white p-3.5 text-center relative shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="text-left leading-tight">
                  <span className="font-black text-xs tracking-wider uppercase block">{brandName}</span>
                  <span className="text-[7.5px] font-bold text-teal-200 tracking-widest uppercase block">{divisionName}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-[7px] font-black uppercase text-teal-100">
                  <Award size={9} />
                  <span>ISO 9001:2015</span>
                </div>
              </div>
            </div>

            {/* Profile Photo with Verified Holographic Ring */}
            <div className="flex flex-col items-center text-center px-4 -mt-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-3 border-teal-600 shadow-lg bg-slate-100 p-0.5">
                  {avatarSrc && !avatarSrc.includes("dicebear") ? (
                    <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#005f69] to-[#008a99] text-white font-black text-2xl flex items-center justify-center rounded-xl">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-2 -right-2 bg-teal-600 text-white p-1 rounded-full shadow-md border-2 border-white">
                  <ShieldCheck size={14} />
                </span>
              </div>

              {/* Name & Role */}
              <div className="mt-3 space-y-0.5 w-full">
                <h3 className="text-base font-black text-zinc-950 uppercase tracking-tight truncate">{user.name}</h3>
                <p className="text-xs font-bold text-teal-700 truncate">{designation}</p>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 font-mono font-bold text-[9.5px] mt-1">
                  ID: {empId}
                </div>
              </div>
            </div>

            {/* Key Member Credentials Table */}
            <div className="px-5 py-2.5 space-y-1.5 text-[8.5px] text-zinc-600 border-t border-b border-zinc-100 bg-zinc-50/70">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-500">Email:</span>
                <span className="font-medium text-zinc-900 truncate max-w-[170px]">{user.email || "help@saampark.com"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-500">Phone:</span>
                <span className="font-medium text-zinc-900">{user.phone || "+91 90915 18567"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-500">{locationLabel}</span>
                <span className="font-bold text-zinc-900 truncate max-w-[170px]">{locationValue}</span>
              </div>
              {hasBranch && subBranchName && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-zinc-500">Sub-Branch:</span>
                  <span className="font-bold text-emerald-700 truncate max-w-[170px]">{subBranchName}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-500">Joined Date:</span>
                <span className="font-bold font-mono text-zinc-900">{joiningDate}</span>
              </div>
            </div>

            {/* Bottom Official Seal Bar */}
            <div className="bg-gradient-to-r from-[#005f69] to-[#008a99] text-white p-2.5 text-center flex items-center justify-between px-4 text-[7.5px] font-bold">
              <span>SAAMPARK GROUP ENTERPRISE</span>
              <span className="uppercase tracking-widest text-teal-200">VERIFIED MEMBER</span>
            </div>
          </motion.div>
        )}

        {/* PORTRAIT BACK BADGE (WITH QR CODE & OFFICIAL VERIFICATION NOTICE) */}
        {(orientation === "portrait" && activeSide === "back") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[320px] sm:w-[340px] h-[510px] rounded-3xl overflow-hidden bg-white text-zinc-900 shadow-2xl border-2 border-zinc-200/90 relative flex flex-col justify-between select-none"
          >
            {/* Lanyard Hole Cutout slot */}
            <div className="w-14 h-2.5 rounded-full bg-zinc-200/90 border border-zinc-300 mx-auto mt-2 shrink-0" />

            {/* Back Header Banner */}
            <div className="bg-gradient-to-r from-[#005f69] via-[#007380] to-[#008a99] text-white p-3 text-center shrink-0">
              <span className="font-black text-[10.5px] uppercase tracking-wider block">OFFICIAL IDENTITY CREDENTIAL</span>
              <span className="text-[7.5px] text-teal-100 font-semibold block">{companyName}</span>
            </div>

            {/* Central Public Scan QR Code */}
            <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
              <div className="p-2 bg-white border-2 border-teal-600 rounded-2xl shadow-md">
                <img 
                  src={qrCodeUrl} 
                  alt="Member Verification QR" 
                  className="w-32 h-32 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[8.5px] font-black uppercase text-teal-800 tracking-wider flex items-center justify-center gap-1">
                  <CheckCircle2 size={11} className="text-teal-600" />
                  <span>SCAN TO VERIFY CREDENTIALS</span>
                </span>
                <p className="text-[7.5px] text-zinc-500 max-w-[220px] leading-tight mx-auto">
                  Scan using any smartphone camera to view official certified enterprise credentials.
                </p>
              </div>
            </div>

            {/* Card Terms & Conditions */}
            <div className="px-4 py-2 text-[7.5px] text-zinc-600 space-y-1 border-t border-zinc-200 bg-zinc-50/70 leading-tight">
              <p>• This card remains the exclusive property of {brandName} Group.</p>
              <p>• If found, please return to nearest branch or mail to: <strong>help@saampark.com</strong></p>
              <p>• Emergency Support: <strong>+91 90915 18567</strong></p>
            </div>

            {/* Signatory & Corporate Seal Row */}
            <div className="px-4 py-2.5 flex items-end justify-between gap-3 border-t border-zinc-200 bg-white">
              <div className="text-left">
                <span className="text-[6.5px] font-mono text-zinc-400 block">HASH: {empId}-VERIFIED</span>
                <span className="text-[7px] font-black uppercase text-teal-800">★ OFFICIAL CERTIFICATION ★</span>
              </div>

              <div className="text-right">
                <div className="h-6 flex items-center justify-end">
                  {signatureUrl ? (
                    <img src={signatureUrl} alt="Signatory" className="max-h-6 max-w-[80px] object-contain" />
                  ) : (
                    <span className="font-serif italic font-extrabold text-[9.5px] text-zinc-800">Authorized Signatory</span>
                  )}
                </div>
                <div className="border-t border-zinc-400 pt-0.5">
                  <span className="text-[6.5px] font-black uppercase text-zinc-600 block">ISSUING AUTHORITY</span>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-[#005f69] text-white p-2 text-center text-[7px] font-bold">
              SAAMPARK CENTRAL OPERATIONS REGISTRY • WWW.SAAMPARK.COM
            </div>
          </motion.div>
        )}

        {/* LANDSCAPE CARD VIEW (DUAL SIDED IN ONE FRAME) */}
        {orientation === "landscape" && (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Front Landscape Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-[390px] sm:w-[420px] h-[260px] rounded-3xl overflow-hidden bg-white text-zinc-900 shadow-2xl border-2 border-zinc-200/90 relative flex flex-col justify-between select-none"
            >
              {/* Header Strip */}
              <div className="bg-gradient-to-r from-[#005f69] via-[#007380] to-[#008a99] text-white p-3 flex items-center justify-between gap-2 shrink-0">
                <div className="leading-tight">
                  <span className="font-black text-xs tracking-wider uppercase block">{brandName}</span>
                  <span className="text-[7.5px] font-bold text-teal-200 tracking-widest uppercase block">{divisionName}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-[7px] font-black uppercase text-teal-100">
                  <Award size={9} />
                  <span>ISO 9001:2015</span>
                </div>
              </div>

              {/* Body: Left Photo, Right Details */}
              <div className="flex items-center gap-4 px-4 py-2 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-teal-600 shadow-md bg-slate-100 p-0.5">
                    {avatarSrc && !avatarSrc.includes("dicebear") ? (
                      <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#005f69] to-[#008a99] text-white font-black text-xl flex items-center justify-center rounded-xl">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 bg-teal-600 text-white p-0.5 rounded-full shadow-xs border border-white">
                    <ShieldCheck size={11} />
                  </span>
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight truncate">{user.name}</h3>
                  <p className="text-xs font-bold text-teal-700 truncate">{designation}</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] text-zinc-600 pt-1">
                    <div>
                      <span className="text-zinc-400 block text-[7px]">ID Number:</span>
                      <strong className="font-mono text-zinc-900">{empId}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[7px]">Phone:</span>
                      <strong className="text-zinc-900 font-medium truncate block">{user.phone || "+91 90915 18567"}</strong>
                    </div>
                    <div className="col-span-2 truncate">
                      <span className="text-zinc-400 block text-[7px]">Email:</span>
                      <strong className="text-zinc-900 font-medium truncate block">{user.email}</strong>
                    </div>
                    <div className="col-span-2 truncate">
                      <span className="text-zinc-400 block text-[7px]">{locationLabel}</span>
                      <strong className="text-zinc-900 truncate block">{locationValue}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Strip */}
              <div className="bg-[#005f69] text-white px-4 py-1.5 flex items-center justify-between text-[7px] font-bold">
                <span>SAAMPARK ENTERPRISE VERIFICATION</span>
                <span className="text-teal-200 uppercase">ACTIVE TEAM MEMBER</span>
              </div>
            </motion.div>

            {/* Back Landscape Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-[390px] sm:w-[420px] h-[260px] rounded-3xl overflow-hidden bg-white text-zinc-900 shadow-2xl border-2 border-zinc-200/90 relative flex flex-col justify-between select-none"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#005f69] to-[#008a99] text-white p-2.5 text-center shrink-0">
                <span className="font-black text-[9px] uppercase tracking-wider block">OFFICIAL VERIFICATION BACK</span>
              </div>

              {/* Body: Left Terms, Right QR */}
              <div className="flex items-center justify-between gap-3 px-4 py-2 flex-1">
                <div className="space-y-1 text-[7.5px] text-zinc-600 max-w-[210px] leading-tight">
                  <p>• Property of {companyName}.</p>
                  <p>• Return to: <strong>help@saampark.com</strong></p>
                  <p>• Emergency: <strong>+91 90915 18567</strong></p>
                  <div className="pt-1 text-[7px] text-teal-800 font-bold">
                    ✓ DIGITALLY AUTHORIZED
                  </div>
                </div>

                <div className="shrink-0 text-center flex flex-col items-center">
                  <div className="p-1.5 bg-white border border-teal-600 rounded-xl shadow-xs">
                    <img src={qrCodeUrl} alt="QR" className="w-20 h-20 object-contain" />
                  </div>
                  <span className="text-[6.5px] font-black uppercase text-teal-800 mt-0.5">SCAN TO VERIFY</span>
                </div>
              </div>

              {/* Bottom Strip */}
              <div className="bg-[#005f69] text-white px-4 py-1.5 flex items-center justify-between text-[7px] font-bold">
                <span>WWW.SAAMPARK.COM</span>
                <span className="text-teal-200 uppercase">CENTRAL REGISTRY</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
