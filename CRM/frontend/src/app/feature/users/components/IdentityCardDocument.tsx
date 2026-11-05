"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Building2, MapPin, Calendar, Mail, Phone, ShieldCheck, 
  Award, QrCode, Download, Printer, Send, Sparkles, Droplets,
  CheckCircle2, RefreshCw, Check, Camera, UploadCloud,
  Lightbulb, Rocket, Users, FileText, Globe, Landmark,
  Facebook, Instagram, Linkedin, Youtube
} from "lucide-react"
import { UserItem } from "../types"

interface IdentityCardDocumentProps {
  user: UserItem
  company?: any
  branch?: any
  subBranch?: any
  interactive?: boolean
  layoutOrientation?: "portrait" | "landscape"
  onSendEmail?: () => void
  isSendingEmail?: boolean
  onAvatarUpload?: (newAvatarUrl: string) => Promise<void> | void
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
  onAvatarUpload,
}: IdentityCardDocumentProps) {
  const [activeSide, setActiveSide] = React.useState<"front" | "back" | "both">("front")
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsUploadingPhoto(true)
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, `${user.name}_badge_avatar`)
      if (res && res.url) {
        await onAvatarUpload?.(res.url)
      }
    } catch (err) {
      console.error("Error uploading team badge photo:", err)
    } finally {
      setIsUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Format ID number in official format (e.g. STR/HR/012 or user.employeeId)
  const rawIdNum = String(user.id || "12").replace(/[^0-9]/g, "")
  const paddedNum = rawIdNum.slice(-3).padStart(3, "0") || "012"
  const deptCode = (user.department || user.role || "HR").slice(0, 2).toUpperCase()
  const empId = user.employeeId || `STR/${deptCode}/${paddedNum}`

  const companyName = company?.name || "SAAMPARK TECHNOLOGY & RESEARCH PVT. LTD."
  const brandName = "SAAMPARK"
  const designation = (user.designation || user.role || "OFFICE COORDINATOR").toUpperCase()
  const phone = user.phone || "90915 18567"
  const avatarSrc = user.avatarUrl || (user as any).avatar

  const branchCode = branch?.code || (user as any).branchCode || "B2501"
  const branchAddress = branch?.address || (user as any).branchAddress || "Balichak, Paschim Medinipur"
  const branchPhone = branch?.phone || "90915 18567 | 03222-464688"
  const supportEmail = company?.email || "service@saamparktechnologyresearch.in"
  const websiteUrl = "www.saampark.com"

  // Contact vCard QR URL for front of the card
  const vCardData = `BEGIN:VCARD\nVERSION:3.0\nN:${user.name};;;\nFN:${user.name}\nORG:${companyName}\nTITLE:${designation}\nTEL;TYPE=CELL:${phone}\nEMAIL:${user.email || ""}\nURL:https://${websiteUrl}\nEND:VCARD`
  const frontContactQR = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=0&ecc=M&data=${encodeURIComponent(vCardData)}`

  // Website QR for back of the card
  const websiteQR = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=0&ecc=M&data=${encodeURIComponent("https://www.saampark.com")}`

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Control Bar (Hides in Print) */}
      <div className="print:hidden w-full flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-3 rounded-2xl shadow-xs">
        {/* Front / Back / Both Switcher */}
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
            🪪 Front Side
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
            🔄 Back Side
          </button>
          <button
            type="button"
            onClick={() => setActiveSide("both")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSide === "both" 
                ? "bg-primary text-white shadow-xs" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📄 Both Sides (Print Ready)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onAvatarUpload && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Camera size={13} className={isUploadingPhoto ? "animate-spin" : ""} />
              <span>{isUploadingPhoto ? "Uploading Photo..." : "Upload Team Photo"}</span>
            </button>
          )}

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
      <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 py-3 w-full">
        {/* ========================================================= */}
        {/* FRONT SIDE CARD */}
        {/* ========================================================= */}
        {(activeSide === "front" || activeSide === "both") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[340px] h-[510px] rounded-[24px] overflow-hidden bg-white text-zinc-900 shadow-2xl border border-zinc-200 relative select-none shrink-0 print:border-none print:shadow-none"
            style={{
              backgroundImage: "url('/idcard/front_template_web.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Click-to-upload Trigger on Photo Area */}
            <div 
              onClick={() => onAvatarUpload ? fileInputRef.current?.click() : undefined}
              className={`absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden border-[3px] border-white shadow-md bg-white ${
                onAvatarUpload ? "cursor-pointer group/photo" : ""
              }`}
              style={{
                top: "21.2%",
                width: "28.5%",
                height: "19%",
              }}
              title={onAvatarUpload ? "Click to change employee photo" : undefined}
            >
              {avatarSrc && !avatarSrc.includes("dicebear") ? (
                <img 
                  src={avatarSrc} 
                  alt={user.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-700 via-sky-600 to-emerald-600 text-white font-black text-2xl flex items-center justify-center">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              {onAvatarUpload && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[8px] font-bold p-1 text-center">
                  <Camera size={16} className="mb-0.5" />
                  <span>{isUploadingPhoto ? "..." : "Change"}</span>
                </div>
              )}
            </div>

            {/* Employee Full Name */}
            <div 
              className="absolute left-0 right-0 text-center px-4 flex items-center justify-center"
              style={{
                top: "51.2%",
                height: "4%",
              }}
            >
              <h3 className="text-[14px] font-black text-[#0B1B36] tracking-tight uppercase truncate">
                {user.name}
              </h3>
            </div>

            {/* Green Designation Pill Text */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none"
              style={{
                top: "55.2%",
                width: "51.8%",
                height: "3.9%",
              }}
            >
              <span className="text-white font-extrabold text-[9px] uppercase tracking-wider truncate px-2">
                {designation}
              </span>
            </div>

            {/* Dynamic Data Grid Values (ID No, Phone, Designation) */}
            <div 
              className="absolute pointer-events-none flex flex-col justify-between"
              style={{
                left: "44.5%",
                top: "61.2%",
                width: "50%",
                height: "10.4%",
              }}
            >
              <div className="flex items-center text-[10px] font-bold text-[#0B1B36] truncate leading-tight">
                <span>{empId}</span>
              </div>
              <div className="flex items-center text-[10px] font-bold text-[#0B1B36] truncate leading-tight">
                <span>{phone}</span>
              </div>
              <div className="flex items-center text-[9.5px] font-extrabold text-[#0B1B36] uppercase truncate leading-tight">
                <span>{designation}</span>
              </div>
            </div>

            {/* Contact QR Code */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center bg-white p-0.5 rounded-sm"
              style={{
                top: "72.6%",
                width: "18.5%",
                height: "12.3%",
              }}
            >
              <img 
                src={frontContactQR} 
                alt="Scan for Contact QR" 
                className="w-full h-full object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* BACK SIDE CARD */}
        {/* ========================================================= */}
        {(activeSide === "back" || activeSide === "both") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[340px] h-[510px] rounded-[24px] overflow-hidden bg-white text-zinc-900 shadow-2xl border border-zinc-200 relative select-none shrink-0 flex flex-col justify-between print:border-none print:shadow-none"
          >
            {/* Top Lanyard Slot Indicator */}
            <div className="w-12 h-2 rounded-full bg-zinc-200 border border-zinc-300 mx-auto mt-2 shrink-0" />

            {/* Header Lockup */}
            <div className="px-5 pt-1 pb-2 flex items-center gap-3 shrink-0">
              <img 
                src="/saampark-logo.png" 
                alt="Saampark Logo" 
                className="w-9 h-9 object-contain"
                onError={(e) => {
                  (e.target as any).src = "/logo.png"
                }}
              />
              <div className="leading-tight">
                <div className="flex items-center gap-1">
                  <span className="font-black text-[#0B1B36] text-[13px] tracking-tight">SAAMPARK</span>
                  <span className="text-[7px] font-bold text-[#0B1B36] -mt-1">TM</span>
                </div>
                <span className="block font-bold text-[6.5px] tracking-wider text-[#0B1B36] uppercase">
                  TECHNOLOGY & RESEARCH PVT. LTD.
                </span>
                <div className="flex items-center gap-1.5 pt-0.5 text-[5.5px] font-black uppercase tracking-wider">
                  <span className="text-orange-500 font-extrabold">— INNOVATE</span>
                  <span className="text-sky-500">• DEVELOP</span>
                  <span className="text-emerald-600">• GROW —</span>
                </div>
              </div>
            </div>

            {/* Core Values Section (Vision, Mission, Values) */}
            <div className="px-5 space-y-2 shrink-0">
              {/* Vision */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Lightbulb size={12} className="stroke-[2.5]" />
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-[9.5px] text-[#0B1B36]">Our Vision</span>
                    <span className="text-orange-500 font-bold text-[9px]">—</span>
                  </div>
                  <p className="text-[7.5px] font-medium text-zinc-600 leading-tight">
                    Empowering people and businesses through technology.
                  </p>
                </div>
              </div>

              {/* Mission */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Rocket size={12} className="stroke-[2.5]" />
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-[9.5px] text-[#0B1B36]">Our Mission</span>
                    <span className="text-blue-600 font-bold text-[9px]">—</span>
                  </div>
                  <p className="text-[7.5px] font-medium text-zinc-600 leading-tight">
                    Innovate solutions, create opportunities, build a better tomorrow.
                  </p>
                </div>
              </div>

              {/* Values */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Users size={12} className="stroke-[2.5]" />
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-[9.5px] text-[#0B1B36]">Our Values</span>
                    <span className="text-emerald-600 font-bold text-[9px]">—</span>
                  </div>
                  <p className="text-[7.5px] font-medium text-zinc-600 leading-tight">
                    Integrity | Innovation | Growth
                  </p>
                  <p className="text-[7.5px] font-medium text-zinc-600 leading-tight">
                    Collaboration | Customer Success
                  </p>
                </div>
              </div>
            </div>

            {/* Employee Guidelines Box */}
            <div className="px-5 shrink-0">
              <div className="relative pt-2">
                {/* Guidelines Tab Header */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-t-md bg-[#0B1B36] text-white text-[7.5px] font-black uppercase tracking-wider">
                  <FileText size={9} />
                  <span>Employee Guidelines</span>
                </div>

                {/* Box Container */}
                <div className="bg-[#F3F7FA] border border-zinc-200/90 rounded-b-xl rounded-tr-xl p-2.5 space-y-1 text-[7px] text-zinc-700 font-medium shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0B1B36] text-white flex items-center justify-center text-[7px] font-black shrink-0">✓</span>
                    <span>Carry this ID card at all times within office premises.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0B1B36] text-white flex items-center justify-center text-[7px] font-black shrink-0">✓</span>
                    <span>This ID card is non-transferable.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0B1B36] text-white flex items-center justify-center text-[7px] font-black shrink-0">✓</span>
                    <span>Report loss or damage immediately to HR.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0B1B36] text-white flex items-center justify-center text-[7px] font-black shrink-0">✓</span>
                    <span>Use of this card is subject to company policies.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0B1B36] text-white flex items-center justify-center text-[7px] font-black shrink-0">✓</span>
                    <span>On leaving the organization, this card must be returned.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deep Navy Curved Footer Container */}
            <div className="relative bg-[#07172E] text-white px-5 pt-3.5 pb-2.5 rounded-b-[24px] shrink-0 mt-2">
              {/* Green wave accent border at top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600" />

              <div className="flex items-start justify-between gap-3">
                {/* Left: Contact Info List */}
                <div className="space-y-1 text-[7px] text-zinc-200 font-medium">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full border border-sky-400/50 flex items-center justify-center text-sky-400 shrink-0">
                      <MapPin size={8} />
                    </div>
                    <span className="truncate max-w-[150px]">{branchAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full border border-sky-400/50 flex items-center justify-center text-sky-400 shrink-0">
                      <Globe size={8} />
                    </div>
                    <span>{websiteUrl}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full border border-sky-400/50 flex items-center justify-center text-sky-400 shrink-0">
                      <Mail size={8} />
                    </div>
                    <span className="truncate max-w-[150px]">{supportEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full border border-sky-400/50 flex items-center justify-center text-sky-400 shrink-0">
                      <Phone size={8} />
                    </div>
                    <span>{branchPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full border border-sky-400/50 flex items-center justify-center text-sky-400 shrink-0">
                      <Landmark size={8} />
                    </div>
                    <span className="font-bold text-sky-300">Branch Code: {branchCode}</span>
                  </div>
                </div>

                {/* Right: Website QR Code & Tagline */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="bg-white p-1 rounded-sm shadow-md">
                    <img 
                      src={websiteQR} 
                      alt="Website QR" 
                      className="w-13 h-13 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <span className="text-[6px] font-bold text-zinc-300 uppercase tracking-wider mt-0.5">
                    Visit Our Website
                  </span>
                  <div className="text-right mt-1.5">
                    <span className="font-serif italic text-[8px] text-white leading-tight block">
                      Right Opportunity,
                    </span>
                    <span className="font-serif italic text-[8.5px] text-emerald-400 leading-tight block font-bold">
                      Bright Future.
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Social Icons Strip */}
              <div className="flex items-center gap-2 pt-2 mt-2 border-t border-white/10 text-[6.5px] text-zinc-400 font-medium">
                <div className="flex items-center gap-1 text-white">
                  <span className="w-3 h-3 rounded-full bg-blue-600 flex items-center justify-center text-[6px]">f</span>
                  <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-amber-500 to-pink-600 flex items-center justify-center text-[6px]">ig</span>
                  <span className="w-3 h-3 rounded-full bg-sky-700 flex items-center justify-center text-[6px]">in</span>
                  <span className="w-3 h-3 rounded-full bg-red-600 flex items-center justify-center text-[6px]">▶</span>
                </div>
                <span>Follow Us For More Updates</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
