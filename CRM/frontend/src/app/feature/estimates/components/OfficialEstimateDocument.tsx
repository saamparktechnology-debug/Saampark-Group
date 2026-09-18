"use client"

import * as React from "react"
import { 
  Printer, Download, Check, X, ArrowRight, Building2, MapPin, 
  Phone, Mail, Globe, Shield, Calendar, Calculator, CheckCircle2,
  Clock, AlertCircle, FileText, QrCode, Landmark, Stamp, FileCheck
} from "lucide-react"
import { EstimateItem } from "../services/estimateService"
import { useAuthStore, Company, Branch, DEFAULT_COMPANIES, getCompanyLogoUrl } from "@/store/useAuthStore"

interface OfficialEstimateDocumentProps {
  estimate: EstimateItem
  onClose?: () => void
  onAccept?: () => void
  onDecline?: () => void
  onConvert?: () => void
  onConvertToClient?: () => void
  isClientRole?: boolean
}

export function formatEstimateDate(rawDate?: string | number | Date | null): string {
  if (!rawDate) return "-"
  const str = String(rawDate).trim()
  if (str === "-" || str === "") return "-"

  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (dmyMatch) {
    return `${dmyMatch[1].padStart(2, "0")}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[3]}`
  }

  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (ymdMatch) {
    return `${ymdMatch[3].padStart(2, "0")}-${ymdMatch[2].padStart(2, "0")}-${ymdMatch[1]}`
  }

  const d = new Date(str)
  if (isNaN(d.getTime())) return str

  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

export function numberToIndianWords(num: number): string {
  if (num === 0) return "Zero Rupees Only"
  
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ]
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function inWords(n: number): string {
    if (n < 20) return a[n]
    const digit = n % 10
    return b[Math.floor(n / 10)] + (digit ? " " + a[digit] : "")
  }

  const str = ("000000000" + Math.round(num)).substr(-9)
  const crore = parseInt(str.substr(0, 2), 10)
  const lakh = parseInt(str.substr(2, 2), 10)
  const thousand = parseInt(str.substr(4, 2), 10)
  const hundred = parseInt(str.substr(6, 1), 10)
  const rest = parseInt(str.substr(7, 2), 10)

  let res = ""
  if (crore > 0) res += inWords(crore) + " Crore "
  if (lakh > 0) res += inWords(lakh) + " Lakh "
  if (thousand > 0) res += inWords(thousand) + " Thousand "
  if (hundred > 0) res += inWords(hundred) + " Hundred "
  if (rest > 0) {
    if (res !== "") res += "and "
    res += inWords(rest) + " "
  }

  return res.trim() + " Rupees Only"
}

export function OfficialEstimateDocument({
  estimate,
  onClose,
  onAccept,
  onDecline,
  onConvert,
  onConvertToClient,
  isClientRole = false,
}: OfficialEstimateDocumentProps) {
  const { 
    companies, 
    branches, 
    subBranches, 
    activeCompanyId, 
    fetchCompanies, 
    fetchBranches, 
    fetchSubBranches 
  } = useAuthStore()

  React.useEffect(() => {
    if (!companies || companies.length === 0) fetchCompanies().catch(() => {})
    if (!branches || branches.length === 0) fetchBranches().catch(() => {})
    if (!subBranches || subBranches.length === 0) fetchSubBranches().catch(() => {})
  }, [companies, branches, subBranches, fetchCompanies, fetchBranches, fetchSubBranches])

  // Resolve Company
  const activeCompany = React.useMemo(() => {
    const targetCompId = String(estimate.companyId || (estimate as any).company || activeCompanyId || "tech").toLowerCase().trim()
    const targetCompName = String((estimate as any).companyName || "").toLowerCase().trim()

    const matched = companies.find(c => {
      const cId = c.id.toLowerCase().trim()
      const cSlug = (c.slug || "").toLowerCase().trim()
      const cName = c.name.toLowerCase().trim()
      const cBrand = (c.brand_name || "").toLowerCase().trim()
      return (
        cId === targetCompId || 
        cSlug === targetCompId || 
        cName === targetCompId ||
        (targetCompName && (cName === targetCompName || cBrand === targetCompName))
      )
    })
    if (matched) return matched
    const defMatch = DEFAULT_COMPANIES.find(c => c.id.toLowerCase() === targetCompId || c.slug?.toLowerCase() === targetCompId)
    return defMatch || companies[0] || DEFAULT_COMPANIES[0]
  }, [estimate.companyId, (estimate as any).company, (estimate as any).companyName, activeCompanyId, companies])

  // Resolve Issuing Branch
  const activeBranch: Branch | null = React.useMemo(() => {
    const targetBranchId = String(estimate.branchId || (estimate as any).branch_id || "").toLowerCase().trim()
    const targetBranchName = String(estimate.branchName || (estimate as any).branch_name || "").toLowerCase().trim()

    if (!targetBranchId && !targetBranchName) return null

    const matched = (branches || []).find(b => {
      const bId = String(b.id || "").toLowerCase().trim()
      const bName = String(b.name || "").toLowerCase().trim()
      const bCode = String(b.code || "").toLowerCase().trim()
      return (targetBranchId && (bId === targetBranchId || bCode === targetBranchId)) ||
             (targetBranchName && (bName === targetBranchName || bCode === targetBranchName))
    })

    return matched || null
  }, [estimate.branchId, estimate.branchName, (estimate as any).branch_id, (estimate as any).branch_name, branches])

  // Resolve Issuing Sub-Branch (Partner)
  const activeSubBranch = React.useMemo(() => {
    const targetSbId = String((estimate as any).subBranchId || (estimate as any).sub_branch_id || "").toLowerCase().trim()
    const targetSbName = String((estimate as any).subBranchName || (estimate as any).sub_branch_name || "").toLowerCase().trim()

    if (!targetSbId && !targetSbName) return null

    return (subBranches || []).find(sb => {
      const sbId = String(sb.id || "").toLowerCase().trim()
      const sbName = String(sb.name || "").toLowerCase().trim()
      const sbCode = String(sb.code || "").toLowerCase().trim()
      return (targetSbId && (sbId === targetSbId || sbCode === targetSbId)) ||
             (targetSbName && (sbName === targetSbName || sbCode === targetSbName))
    }) || null
  }, [(estimate as any).subBranchId, (estimate as any).sub_branch_id, (estimate as any).subBranchName, (estimate as any).sub_branch_name, subBranches])

  const isSubBranchIssued = Boolean(activeSubBranch)
  const isBranchIssued = Boolean(activeBranch) && !isSubBranchIssued

  const resolvedBrandName = activeSubBranch?.brand_name || activeSubBranch?.name || activeBranch?.brand_name || activeCompany?.brand_name || activeCompany?.name || "SAAMPARK"
  const resolvedDivisionName = (activeSubBranch?.division_name && activeSubBranch.division_name.trim()) 
    ? activeSubBranch.division_name.trim() 
    : ((activeBranch?.division_name && activeBranch.division_name.trim()) 
      ? activeBranch.division_name.trim() 
      : (activeCompany?.division_name?.trim() || ""))
  const resolvedSubtitle = activeSubBranch?.subtitle || activeBranch?.subtitle || activeCompany?.subtitle || "TECHNOLOGY, DESIGN & ENTERPRISE DIGITAL SOLUTIONS"
  const resolvedLogoUrl = activeSubBranch?.logo_url || activeBranch?.logo_url || getCompanyLogoUrl(activeCompany) || activeCompany?.logo_url || ""

  const resolvedAddress = (isSubBranchIssued ? activeSubBranch?.address : isBranchIssued ? activeBranch?.address : activeCompany?.address)?.trim() || "Kolkata, West Bengal, India"
  const resolvedPhone = (isSubBranchIssued ? (activeSubBranch?.phone || (activeSubBranch as any)?.partnerPhone) : isBranchIssued ? activeBranch?.phone : activeCompany?.phone)?.trim() || "+91 99015 18567"
  const resolvedEmail = (isSubBranchIssued ? (activeSubBranch?.email || (activeSubBranch as any)?.partnerEmail) : isBranchIssued ? activeBranch?.email : activeCompany?.email)?.trim() || "info@saamparktechnology.com"
  const resolvedWebsite = (isSubBranchIssued ? activeSubBranch?.website : isBranchIssued ? activeBranch?.website : activeCompany?.website)?.trim() || "www.saamparktechnology.com"

  const resolvedGstin = (isSubBranchIssued ? activeSubBranch?.gstin : isBranchIssued ? activeBranch?.gstin : activeCompany?.gstin)?.trim() || ""
  const resolvedPan = (isSubBranchIssued ? activeSubBranch?.pan : isBranchIssued ? activeBranch?.pan : activeCompany?.pan)?.trim() || ""
  const resolvedCin = (isSubBranchIssued ? activeSubBranch?.cin : isBranchIssued ? activeBranch?.cin : activeCompany?.cin)?.trim() || ""
  const resolvedMsme = (isSubBranchIssued ? activeSubBranch?.msme_reg : (activeCompany as any)?.msme_reg)?.trim() || ""

  // Bank details
  const resolvedBankName = (isSubBranchIssued 
    ? (activeSubBranch?.bank_name || (activeSubBranch as any)?.bankDetails?.bankName) 
    : isBranchIssued 
    ? activeBranch?.bank_name 
    : activeCompany?.bank_name)?.trim() || "HDFC Bank Ltd"

  const resolvedAccountHolder = (isSubBranchIssued 
    ? (activeSubBranch?.account_holder || (activeSubBranch as any)?.bankDetails?.accountHolder) 
    : isBranchIssued 
    ? activeBranch?.account_holder 
    : activeCompany?.account_holder)?.trim() || resolvedBrandName

  const resolvedAccountNumber = (isSubBranchIssued 
    ? (activeSubBranch?.account_number || (activeSubBranch as any)?.bankDetails?.accountNumber) 
    : isBranchIssued 
    ? activeBranch?.account_number 
    : activeCompany?.account_number)?.trim() || "50200084920194"

  const resolvedIfscCode = (isSubBranchIssued 
    ? (activeSubBranch?.ifsc_code || (activeSubBranch as any)?.bankDetails?.ifscCode) 
    : isBranchIssued 
    ? activeBranch?.ifsc_code 
    : activeCompany?.ifsc_code)?.trim() || "HDFC0001234"

  const resolvedBankBranch = (isSubBranchIssued 
    ? activeSubBranch?.bank_branch 
    : isBranchIssued 
    ? activeBranch?.bank_branch 
    : activeCompany?.bank_branch)?.trim() || "Main Branch"

  const resolvedUpiId = (isSubBranchIssued 
    ? (activeSubBranch?.upi_id || (activeSubBranch as any)?.bankDetails?.upiId) 
    : isBranchIssued 
    ? activeBranch?.upi_id 
    : activeCompany?.upi_id)?.trim() || ""

  // Signatory & Stamp
  const resolvedSignatoryName = (isSubBranchIssued 
    ? activeSubBranch?.signatory_name 
    : isBranchIssued 
    ? activeBranch?.signatory_name 
    : activeCompany?.signatory_name)?.trim() || "Authorized Signatory"

  const resolvedSignatoryDesignation = (isSubBranchIssued 
    ? activeSubBranch?.signatory_designation 
    : isBranchIssued 
    ? activeBranch?.signatory_designation 
    : activeCompany?.signatory_designation)?.trim() || (isBranchIssued ? "Branch Manager" : "Managing Director")

  const resolvedSignatureUrl = (isSubBranchIssued 
    ? activeSubBranch?.signature_image_url 
    : isBranchIssued 
    ? activeBranch?.signature_image_url 
    : activeCompany?.signature_image_url)?.trim() || ""

  const resolvedStampUrl = (isSubBranchIssued 
    ? activeSubBranch?.stamp_image_url 
    : isBranchIssued 
    ? activeBranch?.stamp_image_url 
    : activeCompany?.stamp_image_url)?.trim() || ""

  // Financial Computations
  const subtotal = estimate.subtotal || 0
  const gstRate = estimate.gstRate || 18
  const gstAmount = estimate.gstAmount || Math.round(subtotal * (gstRate / 100))
  const grandTotal = estimate.totalAmount || (subtotal + gstAmount)
  const cgst = Math.round(gstAmount / 2)
  const sgst = gstAmount - cgst

  // Scannable UPI QR
  const resolvedPaymentQrUrl = activeSubBranch?.payment_qr_url || activeBranch?.payment_qr_url || activeCompany?.payment_qr_url || (
    resolvedUpiId
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&ecc=M&data=${encodeURIComponent(`upi://pay?pa=${resolvedUpiId}&pn=${encodeURIComponent(resolvedAccountHolder)}&am=${grandTotal}&cu=INR`)}`
      : null
  )

  // Document Verification QR Code
  const documentQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&ecc=M&data=${encodeURIComponent(`SAAMPARK-ESTIMATE:${estimate.estimateNumber}|CLIENT:${estimate.client}|AMOUNT:INR${grandTotal}|DATE:${estimate.date}`)}`

  const handlePrint = () => {
    window.print()
  }

  // Theme matching corporate Tax Document palette
  const theme = {
    cardHeaderGradient: "bg-gradient-to-r from-[#005f69] via-[#007380] to-[#008a99]",
    tableHeaderBg: "bg-[#005f69] text-white",
    primaryText: "text-[#005f69]",
    primaryBg: "bg-[#005f69]",
    grandTotalBg: "bg-[#005f69] text-white",
    lightBg: "bg-teal-50/70",
    lightBorder: "border-teal-200",
  }

  const hasLegalIds = Boolean(resolvedCin || resolvedGstin || resolvedPan || resolvedMsme)
  const hasContactInfo = Boolean(resolvedPhone || resolvedWebsite || resolvedEmail)

  return (
    <div className="official-estimate-modal-root relative flex flex-col w-full max-w-4xl mx-auto my-4 bg-white text-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 print:border-none print:shadow-none print:my-0 print:max-w-none print:w-full">
      {/* ── TOP ACTION BAR (Hidden in Print) ── */}
      <div className="no-print flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white border-b border-zinc-700 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-400/30">
            <Calculator size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              <span>Official Commercial Estimate</span>
              <span className="font-mono text-amber-300">#{estimate.estimateNumber}</span>
            </h3>
            <p className="text-[10px] text-zinc-400">Formal corporate estimate with itemized SAC/tax breakdown and banking certification</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Printer size={13} />
            <span>Print / PDF</span>
          </button>

          {onConvertToClient && (
            <button
              type="button"
              onClick={onConvertToClient}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all cursor-pointer"
              title="Save customer as an official CRM Client"
            >
              <Building2 size={13} />
              <span>Move to Client</span>
            </button>
          )}

          {estimate.status !== "Accepted" && onAccept && (
            <button
              type="button"
              onClick={onAccept}
              className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all cursor-pointer"
              title="Accept Estimate"
            >
              <Check size={13} />
              <span>{isClientRole ? "Accept Estimate" : "Mark Accepted"}</span>
            </button>
          )}

          {estimate.status !== "Declined" && estimate.status !== "Accepted" && onDecline && (
            <button
              type="button"
              onClick={onDecline}
              className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800 rounded-lg transition-colors cursor-pointer"
            >
              Decline
            </button>
          )}

          {estimate.status === "Accepted" && onConvert && (
            <button
              type="button"
              onClick={onConvert}
              className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <ArrowRight size={13} />
              <span>Convert to Project &amp; Invoice</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors ml-2 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── PRINTABLE DOCUMENT BODY (Standard A4 Corporate Format) ── */}
      <div id="printable-estimate" className="p-8 sm:p-10 space-y-5 text-xs leading-relaxed bg-white print:p-6 print:space-y-4">
        
        {/* 1. Top Header: Company Brand, Logo, Statutory IDs & Document Header Card */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 border-b-2 border-zinc-900 pb-4">
          {/* Left: Company Brand & Entity Info with Logo */}
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Logo Card */}
            {resolvedLogoUrl ? (
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-2xs shrink-0 border border-zinc-200 bg-white flex items-center justify-center p-2">
                <img 
                  src={resolvedLogoUrl} 
                  alt={resolvedBrandName} 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
            ) : (
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-md shrink-0 border border-teal-900/30 bg-gradient-to-b from-[#004e59] via-[#005c68] to-[#003840] flex flex-col items-center justify-center p-2 text-white text-center">
                <div className="text-2xl mb-1">🏢</div>
                <div className="font-black text-[11px] tracking-wider uppercase leading-tight">{resolvedBrandName}</div>
                <div className="text-[7.5px] font-bold text-teal-200 tracking-widest uppercase mt-0.5">{resolvedDivisionName || "ENTERPRISE"}</div>
              </div>
            )}

            {/* Title, Subtitle, Legal IDs & Coordinates */}
            <div className="space-y-1 flex-1 min-w-0 pt-0.5">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-zinc-950 uppercase">
                  <span>{resolvedBrandName}</span>{" "}
                  {resolvedDivisionName && <span className={`${theme.primaryText} font-extrabold`}>{resolvedDivisionName}</span>}
                </h1>
                {resolvedSubtitle && (
                  <h2 className="text-xs sm:text-sm font-bold text-zinc-700 tracking-wider mt-1 uppercase">
                    {resolvedSubtitle}
                  </h2>
                )}
              </div>

              {/* Legal IDs: CIN, GSTIN, PAN, MSME */}
              {hasLegalIds && (
                <p className="text-[10px] font-semibold text-zinc-600 font-mono pt-0.5 flex items-center gap-2 flex-wrap">
                  {resolvedCin && <span>CIN: <strong className="text-zinc-900 font-bold">{resolvedCin}</strong></span>}
                  {resolvedGstin && <span>{resolvedCin ? "| " : ""}GSTIN: <strong className="text-zinc-900 font-black">{resolvedGstin}</strong></span>}
                  {resolvedPan && <span>{(resolvedCin || resolvedGstin) ? "| " : ""}PAN: <strong className="text-zinc-900 font-black">{resolvedPan}</strong></span>}
                  {resolvedMsme && <span>| MSME: <strong className="text-zinc-900 font-semibold">{resolvedMsme}</strong></span>}
                </p>
              )}

              {/* Address & Contact Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[9.5px] text-zinc-700 pt-0.5">
                {resolvedAddress && (
                  <div className="flex items-start gap-1.5">
                    <span className={`w-3.5 h-3.5 rounded-full ${theme.primaryBg} text-white flex items-center justify-center text-[7.5px] shrink-0 mt-0.5`}>📍</span>
                    <div className="leading-snug">
                      <strong className="text-zinc-900 block text-[9.5px]">Corporate Office:</strong>
                      <span className="text-zinc-600 text-[9px]">{resolvedAddress}</span>
                    </div>
                  </div>
                )}

                {hasContactInfo && (
                  <div className="space-y-0.5">
                    {resolvedPhone && (
                      <p className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 rounded-full ${theme.primaryBg} text-white flex items-center justify-center text-[6.5px] shrink-0`}>📞</span>
                        <span className="font-mono text-zinc-800 font-semibold text-[9px]">{resolvedPhone}</span>
                      </p>
                    )}
                    {resolvedEmail && (
                      <p className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 rounded-full ${theme.primaryBg} text-white flex items-center justify-center text-[6.5px] shrink-0`}>✉️</span>
                        <span className="text-zinc-700 text-[9px]">{resolvedEmail}</span>
                      </p>
                    )}
                    {resolvedWebsite && (
                      <p className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 rounded-full ${theme.primaryBg} text-white flex items-center justify-center text-[6.5px] shrink-0`}>🌐</span>
                        <span className="text-zinc-700 text-[9px]">{resolvedWebsite}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Issuing Branch / Operating Unit Card */}
              {(activeBranch || activeSubBranch) && (
                <div className="mt-1 p-2 rounded-xl bg-gradient-to-r from-teal-50 to-zinc-50 border border-teal-200/80 text-[9px] text-zinc-700">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-zinc-900 flex items-center gap-1">
                      <span>🏢</span>
                      <span>Issuing Branch:</span>
                      <span className="text-teal-800 font-black">{activeBranch?.name || activeSubBranch?.name}</span>
                    </span>
                    {(activeBranch?.code || activeSubBranch?.code) && (
                      <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-bold border border-teal-200">
                        Code: {(activeBranch?.code || activeSubBranch?.code || '').toUpperCase()}
                      </span>
                    )}
                    {activeSubBranch && (
                      <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        🌿 Sub-Branch Partner ({activeSubBranch.revenueSharePct}% Share)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Header Card with Status Badge & Dates */}
          <div className={`w-full sm:w-60 rounded-2xl ${theme.cardHeaderGradient} text-white p-3.5 shadow-md shrink-0 flex flex-col self-start space-y-2.5`}>
            <div className="flex items-center justify-between border-b border-white/20 pb-2">
              <span className="font-black text-xs tracking-wider uppercase">
                OFFICIAL ESTIMATE
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                estimate.status === "Accepted" 
                  ? "bg-white text-emerald-800" 
                  : estimate.status === "Sent" 
                  ? "bg-white text-blue-800" 
                  : estimate.status === "Declined"
                  ? "bg-white text-rose-800"
                  : "bg-white text-zinc-800"
              }`}>
                {estimate.status}
              </span>
            </div>

            <div className="space-y-1.5 text-[10px]">
              <div>
                <span className="text-white/80 text-[8.5px] uppercase tracking-wider font-semibold block">ESTIMATE NO:</span>
                <strong className="font-mono text-amber-300 text-xs font-black break-all leading-tight block">
                  {estimate.estimateNumber}
                </strong>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-white/80 text-[8.5px] uppercase font-bold tracking-wider shrink-0 w-14">DATE:</span>
                <strong className="text-white font-mono text-[9.5px]">
                  {formatEstimateDate(estimate.date)}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-[8.5px] uppercase font-bold tracking-wider shrink-0 w-14">VALID TILL:</span>
                <strong className="text-amber-200 font-mono text-[9.5px]">
                  {formatEstimateDate(estimate.validUntil)}
                </strong>
              </div>
            </div>

            <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[9px] text-teal-100">
              <span>Verified Estimate</span>
              <span className="font-mono">Ref: {(estimate as any).title ? (estimate as any).title.slice(0, 18) + '...' : 'Commercial Tender'}</span>
            </div>
          </div>
        </div>

        {/* 2. Customer / Bill-To Section */}
        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70">
          <div className="text-[10px] font-bold uppercase tracking-wider text-teal-900 mb-1.5 flex items-center justify-between">
            <span>ESTIMATE PREPARED EXCLUSIVELY FOR (CLIENT):</span>
            <span className="text-zinc-500 font-normal">Currency: INR (₹) • Tax: GST (18%)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-black text-zinc-950 uppercase">{estimate.client}</h3>
              {estimate.clientEmail && (
                <p className="text-zinc-600 font-mono text-[11px] mt-0.5">{estimate.clientEmail}</p>
              )}
              {(estimate as any).clientPhone && (
                <p className="text-zinc-600 text-[11px]">{(estimate as any).clientPhone}</p>
              )}
              {(estimate as any).clientContactPerson && (
                <p className="text-zinc-600 text-[11px]">Attn: <strong>{(estimate as any).clientContactPerson}</strong></p>
              )}
            </div>
            <div className="text-[11px] text-zinc-600 space-y-0.5 sm:text-right">
              {(estimate as any).clientAddress && (
                <p className="leading-snug">{(estimate as any).clientAddress}</p>
              )}
              {(estimate as any).clientGstin && (
                <p><span className="text-zinc-500">Client GSTIN:</span> <strong className="font-mono font-bold text-zinc-900">{(estimate as any).clientGstin}</strong></p>
              )}
              <p>Place of Supply: <strong className="text-zinc-800 font-semibold">{(estimate as any).placeOfSupply || "West Bengal (Code 19)"}</strong></p>
              <p className="text-teal-800 font-semibold text-[10px]">Scope Title: {estimate.title}</p>
            </div>
          </div>
        </div>

        {/* 3. Itemized Scope of Work Table */}
        <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`${theme.tableHeaderBg} uppercase text-[10px] tracking-wider`}>
              <tr>
                <th className="py-2.5 px-3 w-10 text-center font-bold">#</th>
                <th className="py-2.5 px-4 font-bold">Service / Scope of Deliverables</th>
                <th className="py-2.5 px-3 text-center font-bold">SAC</th>
                <th className="py-2.5 px-3 text-center font-bold">Qty</th>
                <th className="py-2.5 px-3 text-right font-bold">Unit Rate (₹)</th>
                <th className="py-2.5 px-3 text-right font-bold">Taxable Amt (₹)</th>
                <th className="py-2.5 px-3 text-right font-bold">CGST (9%)</th>
                <th className="py-2.5 px-3 text-right font-bold">SGST (9%)</th>
                <th className="py-2.5 px-4 text-right font-bold">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {estimate.services && estimate.services.length > 0 ? (
                estimate.services.map((s, idx) => {
                  const itemBase = s.total || (s.unitPrice * s.quantity)
                  const itemTax = Math.round(itemBase * (gstRate / 100))
                  const itemCgst = Math.round(itemTax / 2)
                  const itemSgst = itemTax - itemCgst
                  const itemGross = itemBase + itemTax

                  return (
                    <tr key={s.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-zinc-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-950">{s.name}</div>
                        {s.description && (
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-normal">{s.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-zinc-500">
                        {(s as any).sac || "998311"}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold">{s.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{s.unitPrice.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">₹{itemBase.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-600">₹{itemCgst.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-600">₹{itemSgst.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-950">
                        ₹{itemGross.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-zinc-400">No line items configured.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-zinc-50 border-t border-zinc-200 font-semibold text-zinc-700">
              <tr>
                <td colSpan={3} className="py-2.5 px-4 font-bold uppercase text-[10px] text-zinc-600">Subtotal Scope Value</td>
                <td className="py-2.5 px-3 text-center font-mono">{estimate.services?.reduce((acc, s) => acc + s.quantity, 0) || 1}</td>
                <td></td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">₹{subtotal.toLocaleString("en-IN")}</td>
                <td className="py-2.5 px-3 text-right font-mono">₹{cgst.toLocaleString("en-IN")}</td>
                <td className="py-2.5 px-3 text-right font-mono">₹{sgst.toLocaleString("en-IN")}</td>
                <td className="py-2.5 px-4 text-right font-mono font-black text-teal-800">₹{grandTotal.toLocaleString("en-IN")}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 4. Computation, Words, Banking & Remittance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-1">
          {/* Left Column: Words & Payment Details */}
          <div className="sm:col-span-7 space-y-3.5">
            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900 block mb-0.5">
                Total Commercial Estimate in Words:
              </span>
              <p className="font-serif italic font-bold text-teal-950 text-sm">
                {numberToIndianWords(grandTotal)}
              </p>
            </div>

            {/* Bank Remittance Details Box */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-2 text-[11px]">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                  <Landmark size={13} className="text-teal-700" />
                  <span>Beneficiary Remittance &amp; Banking Details</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">NEFT / RTGS / IMPS / UPI</span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between"><span className="text-zinc-500">Bank Name:</span> <span className="font-semibold text-zinc-900">{resolvedBankName}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Account Name:</span> <span className="font-semibold text-zinc-900">{resolvedAccountHolder}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Account Number:</span> <span className="font-mono font-bold text-zinc-900">{resolvedAccountNumber}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">IFSC Code:</span> <span className="font-mono font-bold text-teal-700">{resolvedIfscCode}</span></div>
                  {resolvedBankBranch && (
                    <div className="flex justify-between"><span className="text-zinc-500">Branch:</span> <span className="font-semibold text-zinc-800">{resolvedBankBranch}</span></div>
                  )}
                  {resolvedUpiId && (
                    <div className="flex justify-between"><span className="text-zinc-500">UPI VPA:</span> <span className="font-mono font-bold text-emerald-700">{resolvedUpiId}</span></div>
                  )}
                </div>

                {resolvedPaymentQrUrl && (
                  <div className="text-center shrink-0">
                    <img 
                      src={resolvedPaymentQrUrl} 
                      alt="UPI QR" 
                      className="w-20 h-20 border border-zinc-200 rounded-lg p-1 bg-white mx-auto shadow-2xs" 
                    />
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight block mt-1">Scan to Remit</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Tax Breakdown Calculations */}
          <div className="sm:col-span-5 space-y-2 text-xs">
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
              <div className="flex justify-between text-zinc-600">
                <span>Taxable Value (Subtotal):</span>
                <span className="font-mono font-semibold text-zinc-900">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Central GST (CGST 9%):</span>
                <span className="font-mono font-semibold text-zinc-900">₹{cgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>State GST (SGST 9%):</span>
                <span className="font-mono font-semibold text-zinc-900">₹{sgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t-2 border-teal-700 pt-2 flex justify-between items-center text-sm font-black text-zinc-950">
                <span className="uppercase text-xs tracking-wide">Total Estimated Value:</span>
                <span className="text-base text-teal-800 font-mono font-black">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-snug">
              <span className="font-bold block mb-0.5">Commercial Billing Milestones:</span>
              <span>50% mobilization advance upon quote sign-off. Balance 50% upon milestone deliverables completion and UAT signoff.</span>
            </div>
          </div>
        </div>

        {/* 5. Scope of Deliverables & Commercial Notes */}
        {estimate.notes && (
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-1 text-[11px] text-zinc-600">
            <span className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider block">
              Deliverables Scope &amp; Commercial Terms:
            </span>
            <p className="whitespace-pre-line leading-relaxed">{estimate.notes}</p>
          </div>
        )}

        {/* 6. Official Dual Signatures & Acceptance Box */}
        <div className="pt-4 border-t-2 border-zinc-300 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
          {/* Customer Acceptance Sign */}
          <div className="p-4 border border-dashed border-zinc-300 rounded-xl space-y-6 bg-zinc-50/40">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Client Acceptance &amp; Purchase Order</span>
              <span>Date: ____________</span>
            </div>
            <div className="pt-6 border-t border-zinc-300 text-center">
              <p className="font-bold text-zinc-900">{estimate.client}</p>
              <p className="text-[10px] text-zinc-400">Authorized Signature &amp; Company Seal</p>
            </div>
          </div>

          {/* Issuer Signature & Official Stamp */}
          <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/60 flex flex-col items-center justify-center text-center relative">
            <div className="w-full text-left text-[10px] font-bold uppercase tracking-wider text-teal-900 mb-2">
              For {resolvedBrandName} {resolvedDivisionName}
            </div>

            <div className="flex items-center justify-center gap-6 my-2 min-h-[60px]">
              {resolvedSignatureUrl ? (
                <img src={resolvedSignatureUrl} alt="Signature" className="h-14 object-contain" />
              ) : (
                <div className="h-12 flex items-center justify-center italic font-serif text-zinc-400">
                  [Digitally Authorized]
                </div>
              )}

              {resolvedStampUrl && (
                <img src={resolvedStampUrl} alt="Stamp" className="h-16 w-16 object-contain opacity-90" />
              )}
            </div>

            <div className="w-full pt-2 border-t border-zinc-300">
              <p className="font-bold text-zinc-950">{resolvedSignatoryName}</p>
              <p className="text-[10px] font-medium text-zinc-500">{resolvedSignatoryDesignation}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">This estimate constitutes a binding commercial quote upon formal client confirmation.</p>
            </div>
          </div>
        </div>

        {/* 7. Footer Jurisdiction Notice */}
        <div className="text-center text-[10px] text-zinc-400 pt-3 border-t border-zinc-200">
          Corporate Office: {resolvedAddress} • Registered under the Companies Act • All disputes subject to local jurisdiction only.
        </div>
      </div>
    </div>
  )
}
