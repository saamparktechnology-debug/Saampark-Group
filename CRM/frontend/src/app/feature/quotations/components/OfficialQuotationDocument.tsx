"use client"

import * as React from "react"
import { 
  Printer, Send, X, Building2, MapPin, Phone, Mail, Globe, 
  Shield, Calendar, Calculator, CheckCircle2, Clock, Landmark, 
  Stamp, FileCheck, ArrowRight, QrCode, FileText, UserCheck, Sparkles,
  Check, ChevronRight, Layers, Award, ShieldCheck, BadgeCheck, FileCode, CheckSquare
} from "lucide-react"
import { useAuthStore, Company, Branch, DEFAULT_COMPANIES, getCompanyLogoUrl } from "@/store/useAuthStore"

export interface QuotationLineItem {
  id: string
  name: string
  serviceName?: string
  description?: string
  deliverableTime?: string
  sac?: string
  sacCode?: string
  quantity: number
  unit?: string
  unitPrice: number
  rate?: number
  gstRate?: number
  gstAmount?: number
  total: number
}

export interface QuotationData {
  id: string
  number: string
  customer: string
  client?: string
  customerEmail?: string
  clientEmail?: string
  customerPhone?: string
  clientPhone?: string
  customerAddress?: string
  clientAddress?: string
  clientGstin?: string
  placeOfSupply?: string
  date: string
  validTill?: string
  notes?: string
  terms?: string
  subtotal?: number
  tax?: number
  total: number
  status: string
  clientAccepted?: boolean
  acceptedAt?: number | string
  acceptedBy?: string
  approvalStatus?: "pending" | "approved" | "rejected"
  items?: QuotationLineItem[]
  services?: any[]
  companyId?: string
  companyName?: string
  branchId?: string
  branchName?: string
  subBranchId?: string
  subBranchName?: string
  preparedBy?: string
  // Project Scope Details
  project?: string
  projectTitle?: string
  primaryCategory?: string
  category?: string
  overview?: string
  timeline?: string
  turnaroundTime?: string
  scopeInclusions?: string
  scopeExclusions?: string
  paymentMilestones?: Array<{ milestone: string; percentage: number; stage: string }>
  deliverables?: Array<{ id: string; title: string; description: string; duration: string }>
  // Client & Owner details
  contactPersonName?: string
  primaryContact?: string
  clientContactPerson?: string
  clientDesignation?: string
  clientPincode?: string
  clientCity?: string
  clientDistrict?: string
  clientState?: string
  // Payment structure details
  paymentPlan?: string
  paymentStructure?: string
  emiMonths?: number
  emiAdvanceAmount?: number
  emiMonthlyAmount?: number
  subscriptionCycle?: string
  subscriptionDurationMonths?: number
  subscriptionRate?: number
}

interface OfficialQuotationDocumentProps {
  quotation: QuotationData
  onClose?: () => void
  onAccept?: () => void
  onSendEmail?: () => void
  onConvertToInvoice?: () => void
  onConvertToClient?: () => void
  onSendEstimate?: () => void
  isClientRole?: boolean
}

export function formatQuotationDate(rawDate?: string | number | Date | null): string {
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

export function OfficialQuotationDocument({
  quotation,
  onClose,
  onAccept,
  onSendEmail,
  onConvertToInvoice,
  onConvertToClient,
  onSendEstimate,
  isClientRole = false,
}: OfficialQuotationDocumentProps) {
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

  // Resolve Parent Company
  const activeCompany = React.useMemo(() => {
    const targetCompId = String(quotation.companyId || (quotation as any).company || activeCompanyId || "tech").toLowerCase().trim()
    const targetCompName = String(quotation.companyName || "").toLowerCase().trim()

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
  }, [quotation.companyId, (quotation as any).company, quotation.companyName, activeCompanyId, companies])

  // Resolve Issuing Branch
  const activeBranch: Branch | null = React.useMemo(() => {
    const targetBranchId = String(quotation.branchId || (quotation as any).branch_id || "").toLowerCase().trim()
    const targetBranchName = String(quotation.branchName || (quotation as any).branch_name || "").toLowerCase().trim()

    if (!targetBranchId && !targetBranchName) return null

    const matched = (branches || []).find(b => {
      const bId = String(b.id || "").toLowerCase().trim()
      const bName = String(b.name || "").toLowerCase().trim()
      const bCode = String(b.code || "").toLowerCase().trim()
      return (targetBranchId && (bId === targetBranchId || bCode === targetBranchId)) ||
             (targetBranchName && (bName === targetBranchName || bCode === targetBranchName))
    })

    return matched || null
  }, [quotation.branchId, (quotation as any).branch_id, quotation.branchName, (quotation as any).branch_name, branches])

  // Resolve Issuing Sub-Branch (Partner)
  const activeSubBranch = React.useMemo(() => {
    const targetSbId = String(quotation.subBranchId || (quotation as any).sub_branch_id || "").toLowerCase().trim()
    const targetSbName = String(quotation.subBranchName || (quotation as any).sub_branch_name || "").toLowerCase().trim()

    if (!targetSbId && !targetSbName) return null

    return (subBranches || []).find(sb => {
      const sbId = String(sb.id || "").toLowerCase().trim()
      const sbName = String(sb.name || "").toLowerCase().trim()
      const sbCode = String(sb.code || "").toLowerCase().trim()
      return (targetSbId && (sbId === targetSbId || sbCode === targetSbId)) ||
             (targetSbName && (sbName === targetSbName || sbCode === targetSbName))
    }) || null
  }, [quotation.subBranchId, (quotation as any).sub_branch_id, quotation.subBranchName, (quotation as any).sub_branch_name, subBranches])

  const isSubBranchIssued = Boolean(activeSubBranch)
  const isBranchIssued = Boolean(activeBranch) && !isSubBranchIssued

  // Parent Company Corporate Details
  const resolvedBrandName = activeCompany?.brand_name || activeCompany?.name || "SAAMPARK"
  const resolvedDivisionName = activeCompany?.division_name !== undefined ? activeCompany.division_name : ""
  const resolvedSubtitle = activeCompany?.subtitle || ""
  const resolvedTrademarkSymbol = (activeCompany?.trademark_symbol || (activeCompany as any)?.invoice_customization?.trademark_symbol || "®").trim()
  const resolvedLogoUrl = getCompanyLogoUrl(activeCompany) || activeCompany?.logo_url || ""

  const resolvedAddress = activeCompany?.address?.trim() || ""
  const resolvedPhone = activeCompany?.phone?.trim() || ""
  const resolvedEmail = activeCompany?.email?.trim() || ""
  const resolvedWebsite = activeCompany?.website?.trim() || ""

  const resolvedCin = activeCompany?.cin?.trim() || ""
  const resolvedGstin = activeCompany?.gstin?.trim() || ""
  const resolvedPan = activeCompany?.pan?.trim() || ""
  const resolvedMsme = ((activeCompany as any)?.msme_reg || (activeCompany as any)?.msme || (activeCompany as any)?.udyam)?.trim() || ""

  // Banking details
  const resolvedBankName = (isSubBranchIssued 
    ? (activeSubBranch?.bank_name || (activeSubBranch as any)?.bankDetails?.bankName) 
    : isBranchIssued 
    ? activeBranch?.bank_name 
    : activeCompany?.bank_name)?.trim() || ""

  const resolvedAccountHolder = (isSubBranchIssued 
    ? (activeSubBranch?.account_holder || (activeSubBranch as any)?.bankDetails?.accountHolder) 
    : isBranchIssued 
    ? activeBranch?.account_holder 
    : activeCompany?.account_holder)?.trim() || ""

  const resolvedAccountNumber = (isSubBranchIssued 
    ? (activeSubBranch?.account_number || (activeSubBranch as any)?.bankDetails?.accountNumber) 
    : isBranchIssued 
    ? activeBranch?.account_number 
    : activeCompany?.account_number)?.trim() || ""

  const resolvedIfscCode = (isSubBranchIssued 
    ? (activeSubBranch?.ifsc_code || (activeSubBranch as any)?.bankDetails?.ifscCode) 
    : isBranchIssued 
    ? activeBranch?.ifsc_code 
    : activeCompany?.ifsc_code)?.trim() || ""

  const resolvedBankBranch = (isSubBranchIssued 
    ? activeSubBranch?.bank_branch 
    : isBranchIssued 
    ? activeBranch?.bank_branch 
    : activeCompany?.bank_branch)?.trim() || ""

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
  const isNonGst = Boolean(
    (quotation as any).isNonGst || 
    (quotation as any).taxType === "nongst" || 
    ((quotation.tax === 0 || (quotation as any).taxType === "nongst") && quotation.subtotal && quotation.subtotal === quotation.total)
  )
  const grandTotal = quotation.total || 0
  const subtotal = quotation.subtotal !== undefined ? quotation.subtotal : (isNonGst ? grandTotal : Math.round(grandTotal / 1.18))
  const gstAmount = isNonGst ? 0 : (quotation.tax !== undefined ? quotation.tax : (grandTotal - subtotal))
  const cgst = Math.round(gstAmount / 2)
  const sgst = gstAmount - cgst

  // Resolved line items / modules
  const rawItems: QuotationLineItem[] = (quotation.items && quotation.items.length > 0)
    ? quotation.items
    : (quotation.services && quotation.services.length > 0)
      ? quotation.services.map((s: any, idx: number) => ({
          id: s.id || `mod_${idx + 1}`,
          name: s.name || s.serviceName || `Module ${idx + 1}`,
          serviceName: s.serviceName || s.name,
          description: s.description || "",
          deliverableTime: s.deliverableTime || "1-2 Weeks",
          sac: s.sac || s.sacCode || "998311",
          quantity: s.quantity || s.qty || 1,
          unitPrice: s.unitPrice || s.rate || 0,
          total: s.total || s.totalAmount || 0,
        }))
      : [
          {
            id: "mod_1",
            name: quotation.project || "Enterprise Software Engineering & Cloud Infrastructure",
            description: quotation.overview || "Complete end-to-end custom application architecture, database engineering, deployment & maintenance support.",
            deliverableTime: quotation.timeline || "4-6 Weeks",
            sac: "998311",
            quantity: 1,
            unitPrice: subtotal,
            total: subtotal
          }
        ]

  // Scannable UPI QR
  const resolvedPaymentQrUrl = activeSubBranch?.payment_qr_url || activeBranch?.payment_qr_url || activeCompany?.payment_qr_url || (
    resolvedUpiId
      ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=1&ecc=M&data=${encodeURIComponent(`upi://pay?pa=${resolvedUpiId}&pn=${encodeURIComponent(resolvedAccountHolder || resolvedBrandName)}&am=${grandTotal}&cu=INR`)}`
      : null
  )

  const handlePrint = () => {
    window.print()
  }

  // Theme matching corporate palette (GST Teal vs Non-GST Sky Blue)
  const theme = isNonGst
    ? {
        cardHeaderGradient: "bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]",
        tableHeaderBg: "bg-[#0284c7] text-white",
        primaryText: "text-[#0284c7]",
        primaryBg: "bg-[#0ea5e9]",
        grandTotalBg: "bg-[#0284c7] text-white",
        lightBg: "bg-sky-50/80",
        lightBorder: "border-sky-200",
      }
    : {
        cardHeaderGradient: "bg-gradient-to-r from-[#005f69] via-[#007380] to-[#008a99]",
        tableHeaderBg: "bg-[#005f69] text-white",
        primaryText: "text-[#005f69]",
        primaryBg: "bg-[#005f69]",
        grandTotalBg: "bg-[#005f69] text-white",
        lightBg: "bg-teal-50/70",
        lightBorder: "border-teal-200",
      }

  // Helper to validate non-empty string fields
  const isValidField = (val?: string | null): boolean => {
    if (!val) return false
    const s = String(val).trim().toLowerCase()
    return s !== "" && s !== "none" && s !== "-" && s !== "null" && s !== "undefined"
  }

  const hasBankName = isValidField(resolvedBankName)
  const hasAccountNum = isValidField(resolvedAccountNumber)
  const hasIfsc = isValidField(resolvedIfscCode)
  const hasAccountHolder = isValidField(resolvedAccountHolder)
  const hasBankBranch = isValidField(resolvedBankBranch)
  const hasUpi = isValidField(resolvedUpiId)
  const hasQr = Boolean(resolvedPaymentQrUrl)
  const hasAnyBankInfo = Boolean(hasBankName || hasAccountNum || hasIfsc || hasAccountHolder)
  const hasAnyPaymentInfo = Boolean(hasAnyBankInfo || hasUpi || hasQr)

  const hasCin = isValidField(resolvedCin)
  const hasGstin = isValidField(resolvedGstin)
  const hasPan = isValidField(resolvedPan)
  const hasMsme = isValidField(resolvedMsme)
  const hasLegalIds = Boolean(hasCin || hasGstin || hasPan || hasMsme)

  const hasPhone = isValidField(resolvedPhone)
  const hasWebsite = isValidField(resolvedWebsite)
  const hasEmail = isValidField(resolvedEmail)
  const hasContactInfo = Boolean(hasPhone || hasWebsite || hasEmail)

  // Client Details & Owner Details Resolution
  const clientOwnerName = quotation.contactPersonName || quotation.primaryContact || quotation.clientContactPerson || quotation.customer || "Authorized Client Representative"
  const clientDesignation = quotation.clientDesignation || "Proprietor / Director"
  const clientBusinessName = quotation.customer || quotation.client || "Client Enterprise"
  const clientEmailAddr = quotation.customerEmail || quotation.clientEmail || ""
  const clientPhoneNum = quotation.customerPhone || quotation.clientPhone || ""
  const clientFullAddress = quotation.customerAddress || quotation.clientAddress || ""
  const clientPlaceOfSupply = quotation.placeOfSupply || "West Bengal (Code 19)"

  // Project Details Resolution
  const projectTitle = quotation.project || quotation.projectTitle || ""
  const projectCategory = quotation.primaryCategory || quotation.category || ""
  const projectScopeOverview = quotation.overview || ""
  const projectOverallTimeline = quotation.timeline || ""
  const projectTurnaroundTime = quotation.turnaroundTime || ""

  return (
    <div className="official-quotation-modal-root relative flex flex-col w-full max-w-5xl mx-auto my-2 sm:my-4 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-3xl shadow-2xl overflow-hidden border border-zinc-300 dark:border-zinc-800 print:border-none print:shadow-none print:my-0 print:max-w-none print:w-full print:bg-white print:text-zinc-900">
      
      {/* ── CSS PRINT RULES (Ensures clean multi-page document pagination for 10+ pages) ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          body {
            background: #ffffff !important;
            color: #18181b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-after-always {
            page-break-after: always !important;
            break-after: page !important;
          }
          .page-break-before-always {
            page-break-before: always !important;
            break-before: page !important;
          }
          .avoid-break-inside {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .quotation-a4-card {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
          }
        }
      `}} />

      {/* ── TOP ACTION BAR (Hidden during printing) ── */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 sm:px-6 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white border-b border-zinc-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              <span>Enterprise Quotation &amp; Specification Document</span>
              <span className="font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">#{quotation.number}</span>
            </h3>
            <p className="text-[10.5px] text-zinc-400">
              Multi-page format: Cover Page (Project &amp; Owner) • Modules Roadmap • Settlement &amp; Signatures
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-100 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer size={14} className="text-teal-700" />
            <span>Print / PDF Document</span>
          </button>

          {quotation.status !== "Accepted" && onAccept && (
            <button
              type="button"
              onClick={onAccept}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>{isClientRole ? "Accept Quotation" : "Mark Accepted"}</span>
            </button>
          )}

          {(quotation.status === "Accepted" || quotation.clientAccepted) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-800 rounded-xl">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Client Accepted</span>
            </div>
          )}

          {onConvertToClient && (
            <button
              type="button"
              onClick={onConvertToClient}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer"
              title="Save this prospect as an official CRM Client"
            >
              <UserCheck size={13} />
              <span>Save Client</span>
            </button>
          )}

          {onSendEstimate && (
            <button
              type="button"
              onClick={onSendEstimate}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Create Estimate</span>
            </button>
          )}

          {onSendEmail && (
            <button
              type="button"
              onClick={onSendEmail}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-zinc-100 bg-zinc-700 hover:bg-zinc-600 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Send size={13} />
              <span>Send Email</span>
            </button>
          )}

          {onConvertToInvoice && (
            <button
              type="button"
              onClick={onConvertToInvoice}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <ArrowRight size={14} />
              <span>Convert to Invoice</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors ml-auto sm:ml-2 cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── PRINTABLE DOCUMENT BODY (Structured into Dedicated Multi-Page Flow) ── */}
      <div id="printable-quotation" className="w-full flex flex-col items-center gap-8 py-6 px-3 sm:px-6 bg-zinc-200/60 dark:bg-zinc-950/80 print:bg-white print:p-0 print:gap-0 print:m-0">
        
        {/* ══════════════════════════════════════════════════════════════════════════════
            PAGE 1: DEDICATED EXECUTIVE COVER & PROJECT DETAILS PAGE
            Rule: The first page belongs ONLY to Project Details, Owner Details, Company Header & Document Meta
            ══════════════════════════════════════════════════════════════════════════════ */}
        <section className="quotation-a4-card page-break-after-always a4-page bg-white text-zinc-900 font-sans p-6 sm:p-8 text-xs shadow-2xl border border-zinc-300 rounded-2xl w-full max-w-[820px] min-h-[1120px] mx-auto relative flex flex-col justify-between print:w-[210mm] print:max-w-[210mm] print:min-h-[297mm] print:h-[297mm] print:overflow-hidden print:p-[10mm_12mm] print:shadow-none print:border-none print:rounded-none">
          
          <div className="space-y-4">
            {/* 1. Official Corporate Header: Logo, Big Saampark, Registered Trademark, Legal IDs */}
            <div className="flex flex-col gap-2.5 border-b-2 border-zinc-900 pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                {/* Logo */}
                {resolvedLogoUrl ? (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-xs shrink-0 border border-zinc-200 bg-white flex items-center justify-center p-1.5">
                    <img 
                      src={resolvedLogoUrl} 
                      alt={resolvedBrandName} 
                      className="max-w-full max-h-full object-contain" 
                    />
                  </div>
                ) : (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-md shrink-0 border border-teal-900/30 bg-gradient-to-b from-[#004e59] via-[#005c68] to-[#003840] flex flex-col items-center justify-center p-2 text-white text-center">
                    <Sparkles className="w-5 h-5 mb-1 text-teal-200 drop-shadow-sm" />
                    <div className="font-black text-[11px] tracking-wider uppercase leading-tight font-sans">{resolvedBrandName}</div>
                    <div className="text-[7px] font-bold text-teal-200 tracking-widest uppercase mt-0.5">{resolvedDivisionName || "ENTERPRISE"}</div>
                  </div>
                )}

                {/* Center Brand Identity */}
                <div className="flex-1 flex flex-col items-center justify-center text-center min-w-0 px-2 sm:px-4">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl md:text-[34px] font-black tracking-wider leading-none text-zinc-950 uppercase font-sans text-center">
                      {resolvedBrandName}
                    </h1>
                    {resolvedTrademarkSymbol && resolvedTrademarkSymbol !== "none" ? (
                      resolvedTrademarkSymbol === "TM" || resolvedTrademarkSymbol === "™" ? (
                        <span className="inline-flex items-center justify-center w-[23px] h-[23px] rounded-full border-[1.5px] border-red-600 text-red-600 bg-white font-bold text-[9px] leading-none shrink-0 -translate-y-2 ml-1 shadow-xs select-none">
                          TM
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full border-[1.5px] border-red-600 text-red-600 bg-white font-black text-[11px] leading-none shrink-0 -translate-y-2 ml-1 shadow-xs select-none">
                          R
                        </span>
                      )
                    ) : null}
                  </div>

                  {resolvedDivisionName ? (
                    <h2 className="text-xs sm:text-sm font-black tracking-widest text-zinc-800 uppercase font-sans mt-1 leading-tight text-center">
                      {resolvedDivisionName}
                    </h2>
                  ) : null}

                  {resolvedSubtitle && (
                    <p className="text-[8.5px] font-semibold text-zinc-500 tracking-wider uppercase mt-0.5 text-center">
                      {resolvedSubtitle}
                    </p>
                  )}

                  {/* Legal Statutory Credentials */}
                  {hasLegalIds && (
                    <p className="text-[10px] font-semibold text-zinc-600 font-mono pt-1.5 flex items-center justify-center gap-2 flex-wrap">
                      {resolvedCin && <span>CIN: <strong className="text-zinc-900 font-bold">{resolvedCin}</strong></span>}
                      {resolvedGstin && <span>{resolvedCin ? "| " : ""}GSTIN: <strong className="text-zinc-900 font-black">{resolvedGstin}</strong></span>}
                      {resolvedPan && <span>{(resolvedCin || resolvedGstin) ? "| " : ""}PAN: <strong className="text-zinc-900 font-black">{resolvedPan}</strong></span>}
                      {resolvedMsme && <span>{(resolvedCin || resolvedGstin || resolvedPan) ? "| " : ""}MSME: <strong className="text-zinc-900 font-semibold">{resolvedMsme}</strong></span>}
                    </p>
                  )}
                </div>

                {/* Document Reference Header Card */}
                <div className={`w-full sm:w-56 rounded-xl ${theme.cardHeaderGradient} text-white p-3.5 shadow-md shrink-0 flex flex-col self-start space-y-1.5`}>
                  <div className="flex items-center justify-between border-b border-white/20 pb-1">
                    <span className="font-black text-[10px] tracking-wider uppercase">
                      {isNonGst ? "COMMERCIAL QUOTATION" : "TAX QUOTATION"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase bg-white text-zinc-900">
                      {quotation.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-[10px]">
                    <div>
                      <span className="text-white/80 text-[7.5px] uppercase tracking-wider font-semibold block">QUOTATION NUMBER:</span>
                      <strong className="font-mono text-amber-300 text-[12px] font-black break-all leading-tight block">
                        {quotation.number}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between pt-0.5 text-[9.5px]">
                      <span className="text-white/80 text-[7.5px] uppercase font-bold tracking-wider">ISSUE DATE:</span>
                      <strong className="text-white font-mono">{formatQuotationDate(quotation.date)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[9.5px]">
                      <span className="text-white/80 text-[7.5px] uppercase font-bold tracking-wider">VALID TILL:</span>
                      <strong className="text-amber-200 font-mono">{formatQuotationDate(quotation.validTill)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Registered Office & Contact Bar */}
              {(resolvedAddress || hasContactInfo) && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-x-4 gap-y-1 text-[9px] text-zinc-700 pt-1 border-t border-zinc-100">
                  {resolvedAddress && (
                    <div className="flex items-center gap-1.5 truncate max-w-full sm:max-w-[55%]">
                      <MapPin size={10} className="text-teal-700 shrink-0" />
                      <strong className="text-zinc-900 shrink-0">Registered Office:</strong>
                      <span className="text-zinc-600 truncate">{resolvedAddress}</span>
                    </div>
                  )}

                  {hasContactInfo && (
                    <div className="flex items-center gap-3 flex-wrap justify-end text-[9px]">
                      {resolvedPhone && (
                        <span className="flex items-center gap-1">
                          <Phone size={9} className="text-teal-700" />
                          <strong className="font-mono text-zinc-800">{resolvedPhone}</strong>
                        </span>
                      )}
                      {resolvedEmail && (
                        <span className="flex items-center gap-1">
                          <Mail size={9} className="text-teal-700" />
                          <span className="text-zinc-700">{resolvedEmail}</span>
                        </span>
                      )}
                      {resolvedWebsite && (
                        <span className="flex items-center gap-1">
                          <Globe size={9} className="text-teal-700" />
                          <span className="text-zinc-700">{resolvedWebsite}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Issuing Operating Unit / Branch Notice */}
              {(activeBranch || activeSubBranch) && (
                <div className="p-1.5 rounded-lg bg-teal-50/70 border border-teal-200 text-[8.5px] text-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={11} className="text-teal-700" />
                    <span>Issuing Operating Unit: <strong className="text-teal-900 font-bold">{activeBranch?.name || activeSubBranch?.name}</strong></span>
                    {(activeBranch?.code || activeSubBranch?.code) && (
                      <span className="font-mono text-[7.5px] px-1 py-0.2 rounded bg-teal-100 text-teal-800 font-bold">
                        {(activeBranch?.code || activeSubBranch?.code || "").toUpperCase()}
                      </span>
                    )}
                  </div>
                  {activeSubBranch && (
                    <span className="text-emerald-700 font-bold">Authorized Regional Franchise Partner</span>
                  )}
                </div>
              )}
            </div>

            {/* 2. Client & Business Owner Executive Details Card */}
            <div className="rounded-xl border-2 border-teal-700/80 bg-teal-50/40 p-4 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between border-b border-teal-200 pb-1.5">
                <span className="font-black text-[10.5px] uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-teal-700" />
                  <span>PREPARED EXCLUSIVELY FOR CLIENT &amp; PROPRIETOR / BUSINESS OWNER:</span>
                </span>
                <span className="text-[9px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                  Verified Commercial Entity
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Client Company & Owner Identity */}
                <div className="space-y-1">
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">CLIENT / ENTERPRISE NAME:</span>
                    <h3 className="text-base font-black text-zinc-950 uppercase tracking-tight">{clientBusinessName}</h3>
                  </div>
                  
                  <div className="pt-1">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">OWNER / AUTHORIZED PERSON:</span>
                    <p className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                      <span>{clientOwnerName}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 border border-teal-200">
                        {clientDesignation}
                      </span>
                    </p>
                  </div>

                  <div className="text-[10px] text-zinc-600 pt-1 space-y-0.5">
                    {clientEmailAddr && (
                      <p className="flex items-center gap-1">
                        <Mail size={10} className="text-teal-700 shrink-0" />
                        <span className="font-mono">{clientEmailAddr}</span>
                      </p>
                    )}
                    {clientPhoneNum && (
                      <p className="flex items-center gap-1">
                        <Phone size={10} className="text-teal-700 shrink-0" />
                        <span className="font-mono font-bold text-zinc-800">{clientPhoneNum}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Client Address, GSTIN & Supply Details */}
                <div className="space-y-1 sm:text-right text-[10.5px] text-zinc-600">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block sm:text-right">OFFICIAL BILLING DESTINATION:</span>
                  {clientFullAddress ? (
                    <p className="text-zinc-800 leading-snug">{clientFullAddress}</p>
                  ) : (
                    <p className="text-zinc-400 italic">Corporate Billing Address on file</p>
                  )}
                  
                  {(quotation.clientCity || quotation.clientState || quotation.clientPincode) && (
                    <p className="text-zinc-700 font-medium">
                      {[quotation.clientCity, quotation.clientDistrict, quotation.clientState, quotation.clientPincode].filter(Boolean).join(", ")}
                    </p>
                  )}

                  <div className="pt-1.5 space-y-0.5">
                    {quotation.clientGstin && (
                      <p>
                        <span className="text-zinc-500 font-semibold">Client GSTIN: </span>
                        <strong className="font-mono font-bold text-zinc-950 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                          {quotation.clientGstin}
                        </strong>
                      </p>
                    )}
                    <p>
                      <span className="text-zinc-500 font-semibold">Place of Supply: </span>
                      <strong className="text-zinc-900 font-bold">{clientPlaceOfSupply}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Project Details Profile Card */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                <span className="font-black text-[10.5px] uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <Layers size={14} className="text-teal-700" />
                  <span>PROJECT PROFILE &amp; EXECUTIVE TECHNICAL SCOPE:</span>
                </span>
                <span className="text-[9px] font-bold text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200">
                  Category: <strong className="text-teal-800">{projectCategory}</strong>
                </span>
              </div>

              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">PROJECT TITLE / ENGAGEMENT SCOPE:</span>
                <h4 className="text-sm font-black text-zinc-950 uppercase">{projectTitle}</h4>
              </div>

              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">EXECUTIVE SCOPE STATEMENT:</span>
                <p className="text-[10.5px] text-zinc-700 leading-relaxed bg-white p-2.5 rounded-lg border border-zinc-200/80 whitespace-pre-line">
                  {projectScopeOverview}
                </p>
              </div>

              {/* Project Delivery Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2 rounded-lg bg-white border border-zinc-200 text-center">
                  <span className="text-[8px] font-bold uppercase text-zinc-400 block">OVERALL ESTIMATED TIMELINE</span>
                  <strong className="text-xs font-black text-teal-800 font-mono mt-0.5 block">{projectOverallTimeline}</strong>
                </div>
                <div className="p-2 rounded-lg bg-white border border-zinc-200 text-center">
                  <span className="text-[8px] font-bold uppercase text-zinc-400 block">SPRINT VELOCITY / TURNAROUND</span>
                  <strong className="text-xs font-black text-zinc-900 font-mono mt-0.5 block">{projectTurnaroundTime}</strong>
                </div>
                <div className="p-2 rounded-lg bg-white border border-zinc-200 text-center">
                  <span className="text-[8px] font-bold uppercase text-zinc-400 block">TOTAL DELIVERABLE MODULES</span>
                  <strong className="text-xs font-black text-teal-800 font-mono mt-0.5 block">{rawItems.length} Specialized Modules</strong>
                </div>
              </div>
            </div>

            {/* 4. Executive Table of Contents / Index of Project Modules */}
            <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-2xs">
              <div className="bg-zinc-800 text-white px-3.5 py-2 flex items-center justify-between">
                <span className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare size={12} className="text-teal-400" />
                  <span>PROJECT MODULES ROADMAP &amp; DELIVERABLES INDEX</span>
                </span>
                <span className="text-[9px] text-zinc-300 font-mono">Detailed specifications on following pages</span>
              </div>
              <table className="w-full text-left border-collapse text-[10px]">
                <thead className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200 uppercase text-[8.5px]">
                  <tr>
                    <th className="py-1.5 px-3 w-8 text-center">#</th>
                    <th className="py-1.5 px-3">Module Name / Engineering Scope</th>
                    <th className="py-1.5 px-3 w-36 text-center">Deliverable Time</th>
                    <th className="py-1.5 px-3 text-right w-28">Commercial Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-800">
                  {rawItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-zinc-50/80">
                      <td className="py-1.5 px-3 text-center font-mono font-bold text-zinc-500">{(idx + 1).toString().padStart(2, "0")}</td>
                      <td className="py-1.5 px-3 font-semibold text-zinc-900">{item.name || item.serviceName}</td>
                      <td className="py-1.5 px-3 text-center font-mono text-teal-700 font-bold">
                        <span className="bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          ⏱ {item.deliverableTime || "1-2 Weeks"}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-zinc-900">
                        ₹{(item.total || (item.unitPrice * item.quantity)).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Page 1 Bottom Footer & Mandatory Page Break */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-[8.5px] text-zinc-400">
            <span>Corporate Proposal Prepared Exclusively for {clientBusinessName} • Confidential</span>
            <span className="font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">Page 1 of {1 + Math.max(1, Math.ceil(rawItems.length / 3)) + 1} • Executive Details Cover</span>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════════════
            PAGES 2 TO N: DETAILED MODULE SCOPE, ARCHITECTURE & DELIVERABLE TIMELINES
            Rule: Every module must be detailed with Deliverable Time, Full Description, and Itemized Pricing.
            This section dynamically spans across 10+ pages seamlessly with clean CSS print pagination!
            ══════════════════════════════════════════════════════════════════════════════ */}
        <section className="quotation-a4-card page-break-after-always a4-page bg-white text-zinc-900 font-sans p-6 sm:p-8 text-xs shadow-2xl border border-zinc-300 rounded-2xl w-full max-w-[820px] min-h-[1120px] mx-auto relative flex flex-col justify-between print:w-[210mm] print:max-w-[210mm] print:min-h-[297mm] print:shadow-none print:border-none print:rounded-none print:p-[10mm_12mm]">
          
          <div className="space-y-4">
            {/* Running Document Header */}
            <div className="flex items-center justify-between border-b-2 border-teal-800 pb-2">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-teal-700" />
                <span className="font-black text-xs uppercase tracking-wider text-zinc-900">
                  SECTION II: TECHNICAL MODULE SPECIFICATIONS &amp; DELIVERABLE MILESTONES
                </span>
              </div>
              <div className="text-[9px] font-mono text-zinc-500">
                Quotation Ref: <strong className="text-teal-800 font-bold">#{quotation.number}</strong>
              </div>
            </div>

            <p className="text-[10.5px] text-zinc-600 leading-snug">
              Each module specified below represents a discrete functional deliverable with dedicated engineering sprint allocations, deliverable deadlines, quality assurance cycles, and itemized commercial scope:
            </p>

            {/* List of Modules (Each Module rendered in clean, break-avoiding card) */}
            <div className="space-y-3.5">
              {rawItems.map((item, idx) => {
                const itemBase = item.total || (item.unitPrice * item.quantity)
                const itemGst = isNonGst ? 0 : Math.round(itemBase * 0.18)
                const itemCgst = Math.round(itemGst / 2)
                const itemSgst = itemGst - itemCgst
                const itemGross = itemBase + itemGst

                return (
                  <div 
                    key={item.id || idx} 
                    className="avoid-break-inside rounded-xl border border-zinc-200 bg-white p-4 shadow-xs space-y-2.5 hover:border-teal-300 transition-colors"
                  >
                    {/* Module Title Banner & Deliverable Time Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-800 text-white font-mono font-black text-xs shrink-0">
                          {(idx + 1).toString().padStart(2, "0")}
                        </span>
                        <div>
                          <h4 className="font-black text-sm text-zinc-950 uppercase tracking-tight">
                            {item.name || item.serviceName}
                          </h4>
                          {item.sac && (
                            <span className="text-[8.5px] font-mono text-zinc-400">SAC/HSN: {item.sac}</span>
                          )}
                        </div>
                      </div>

                      {/* Prominent Deliverable Time Badge */}
                      <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-300 text-teal-900 px-3 py-1 rounded-full text-[10.5px] font-black self-start sm:self-auto shadow-2xs">
                        <Clock size={12} className="text-teal-700" />
                        <span>Deliverable Time: <strong className="font-mono text-teal-800">{item.deliverableTime || "1-2 Weeks"}</strong></span>
                      </div>
                    </div>

                    {/* Detailed Module Description & Architecture */}
                    <div>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">TECHNICAL SPECIFICATIONS &amp; SCOPE DESCRIPTION:</span>
                      <p className="text-[11px] text-zinc-700 leading-relaxed whitespace-pre-line bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                        {item.description || "Detailed enterprise engineering, database schema configuration, RESTful API implementation, user interface wireframing, automated testing, and comprehensive code documentation."}
                      </p>
                    </div>

                    {/* Itemized Commercial Breakdown for this Module */}
                    <div className="rounded-lg border border-zinc-200 overflow-hidden text-[10px]">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[8px]">
                          <tr>
                            <th className="py-1 px-3">SAC</th>
                            <th className="py-1 px-2 text-center">Quantity</th>
                            <th className="py-1 px-2 text-right">Unit Rate (₹)</th>
                            <th className="py-1 px-3 text-right">Taxable Value (₹)</th>
                            {!isNonGst && <th className="py-1 px-2 text-right">CGST (9%)</th>}
                            {!isNonGst && <th className="py-1 px-2 text-right">SGST (9%)</th>}
                            <th className="py-1 px-3 text-right">Module Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-zinc-800">
                          <tr>
                            <td className="py-1.5 px-3 font-mono text-zinc-500">{item.sac || "998311"}</td>
                            <td className="py-1.5 px-2 text-center font-mono font-semibold">{item.quantity} {item.unit || "Module"}</td>
                            <td className="py-1.5 px-2 text-right font-mono">₹{item.unitPrice.toLocaleString("en-IN")}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-zinc-900">₹{itemBase.toLocaleString("en-IN")}</td>
                            {!isNonGst && <td className="py-1.5 px-2 text-right font-mono text-zinc-600">₹{itemCgst.toLocaleString("en-IN")}</td>}
                            {!isNonGst && <td className="py-1.5 px-2 text-right font-mono text-zinc-600">₹{itemSgst.toLocaleString("en-IN")}</td>}
                            <td className="py-1.5 px-3 text-right font-mono font-black text-teal-800">₹{itemGross.toLocaleString("en-IN")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Scope Inclusions & Exclusions (Enterprise Project Standards) */}
            {(quotation.scopeInclusions || quotation.scopeExclusions) && (
              <div className="avoid-break-inside grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {quotation.scopeInclusions && (
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-[10px] space-y-1">
                    <span className="font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-700" />
                      <span>Standard Inclusions:</span>
                    </span>
                    <p className="text-zinc-700 whitespace-pre-line leading-relaxed">{quotation.scopeInclusions}</p>
                  </div>
                )}

                {quotation.scopeExclusions && (
                  <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-[10px] space-y-1">
                    <span className="font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1">
                      <Shield size={11} className="text-rose-700" />
                      <span>Scope Exclusions / Client Inputs:</span>
                    </span>
                    <p className="text-zinc-700 whitespace-pre-line leading-relaxed">{quotation.scopeExclusions}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section II Running Footer */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-[8.5px] text-zinc-400">
            <span>Corporate Proposal • All deliverables backed by Saampark Service Level Agreement (SLA)</span>
            <span className="font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">Technical Specifications Section</span>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════════════
            LAST PAGE: COMMERCIAL SETTLEMENT, QR PAYMENT, TERMS & DUAL SIGNATURES
            Rule: The last page belongs strictly to Payment QR, Bank details, Signatures, Terms and Conditions
            ══════════════════════════════════════════════════════════════════════════════ */}
        <section className="quotation-a4-card page-break-before-always a4-page bg-white text-zinc-900 font-sans p-6 sm:p-8 text-xs shadow-2xl border border-zinc-300 rounded-2xl w-full max-w-[820px] min-h-[1120px] mx-auto relative flex flex-col justify-between print:w-[210mm] print:max-w-[210mm] print:min-h-[297mm] print:h-[297mm] print:overflow-hidden print:p-[10mm_12mm] print:shadow-none print:border-none print:rounded-none">
          
          <div className="space-y-4">
            {/* Running Document Header */}
            <div className="flex items-center justify-between border-b-2 border-teal-800 pb-2">
              <div className="flex items-center gap-2">
                <Landmark size={16} className="text-teal-700" />
                <span className="font-black text-xs uppercase tracking-wider text-zinc-900">
                  SECTION III: COMMERCIAL FINANCIAL SETTLEMENT, PAYMENT REMITTANCE &amp; AUTHORIZATIONS
                </span>
              </div>
              <div className="text-[9px] font-mono text-zinc-500">
                Quotation Ref: <strong className="text-teal-800 font-bold">#{quotation.number}</strong>
              </div>
            </div>

            {/* 1. Grand Financial Computation Matrix & Words */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Left: Total in Words & Payment Structure */}
              <div className="sm:col-span-7 space-y-3">
                <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 text-xs">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-teal-950 block mb-0.5">
                    TOTAL QUOTATION VALUE IN WORDS:
                  </span>
                  <p className="font-serif italic font-bold text-teal-950 text-sm leading-snug">
                    {numberToIndianWords(grandTotal)}
                  </p>
                </div>

                {/* Payment Plan / Commercial Structure */}
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/80 space-y-1.5 text-[10.5px]">
                  <span className="font-bold text-zinc-900 uppercase text-[9.5px] tracking-wider block flex items-center gap-1.5">
                    <Calculator size={13} className="text-teal-700" />
                    <span>Commercial Payment Settlement Structure:</span>
                  </span>
                  
                  {quotation.paymentStructure ? (
                    <p className="font-semibold text-teal-900 font-mono bg-white p-2 rounded border border-zinc-200">
                      {quotation.paymentStructure}
                    </p>
                  ) : (
                    <div className="space-y-1 text-zinc-700">
                      <p>• <strong>Mobilization Advance:</strong> 50% upon quotation acceptance &amp; project kickoff.</p>
                      <p>• <strong>Interim Milestone:</strong> 30% upon functional demo &amp; staging approval.</p>
                      <p>• <strong>Final Handover:</strong> 20% upon final production sign-off &amp; code deployment.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Calculations Breakdown Card */}
              <div className="sm:col-span-5 space-y-2">
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>{isNonGst ? "Commercial Scope Subtotal:" : "Taxable Value (Subtotal):"}</span>
                    <strong className="font-mono text-zinc-900">₹{subtotal.toLocaleString("en-IN")}</strong>
                  </div>
                  {!isNonGst && (
                    <>
                      <div className="flex justify-between text-zinc-600">
                        <span>Central GST (CGST 9%):</span>
                        <span className="font-mono font-semibold text-zinc-900">₹{cgst.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-zinc-600">
                        <span>State GST (SGST 9%):</span>
                        <span className="font-mono font-semibold text-zinc-900">₹{sgst.toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t-2 border-teal-700 pt-2 flex justify-between items-center text-sm font-black text-zinc-950">
                    <span className="uppercase text-xs tracking-wide">Grand Total Value:</span>
                    <span className="text-lg text-teal-800 font-mono font-black">₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[9.5px] text-amber-900 leading-snug">
                  <strong>Notice: </strong>
                  <span>{isNonGst ? "Non-GST Commercial quotation. Valid for 30 calendar days." : "Prices are inclusive of standard SLA & statutory 18% GST. Valid for 30 calendar days."}</span>
                </div>
              </div>
            </div>

            {/* 2. Beneficiary Banking Details & Scannable UPI Payment QR Code */}
            {hasAnyPaymentInfo && (
              <div className="p-4 rounded-xl border-2 border-teal-700/80 bg-zinc-50 space-y-2 text-[11px] shadow-2xs">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                  <span className="font-bold text-zinc-950 flex items-center gap-1.5">
                    <Landmark size={14} className="text-teal-700" />
                    <span>Official Remittance &amp; Banking Account Details</span>
                  </span>
                  <span className="text-[9.5px] font-mono text-teal-800 font-bold">NEFT / RTGS / IMPS / UPI REMITTANCE</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 text-[10.5px]">
                    {hasBankName && (
                      <div className="flex justify-between"><span className="text-zinc-500">Bank Name:</span> <strong className="text-zinc-900">{resolvedBankName}</strong></div>
                    )}
                    {hasAccountHolder && (
                      <div className="flex justify-between"><span className="text-zinc-500">Account Name:</span> <strong className="text-zinc-900">{resolvedAccountHolder}</strong></div>
                    )}
                    {hasAccountNum && (
                      <div className="flex justify-between"><span className="text-zinc-500">Account Number:</span> <strong className="font-mono font-black text-zinc-950 bg-zinc-200/60 px-1 rounded">{resolvedAccountNumber}</strong></div>
                    )}
                    {hasIfsc && (
                      <div className="flex justify-between"><span className="text-zinc-500">IFSC Code:</span> <strong className="font-mono font-black text-teal-800">{resolvedIfscCode}</strong></div>
                    )}
                    {hasBankBranch && (
                      <div className="flex justify-between"><span className="text-zinc-500">Branch:</span> <span className="font-semibold text-zinc-800">{resolvedBankBranch}</span></div>
                    )}
                    {hasUpi && (
                      <div className="flex justify-between"><span className="text-zinc-500">UPI ID:</span> <strong className="font-mono font-bold text-emerald-800">{resolvedUpiId}</strong></div>
                    )}
                  </div>

                  {hasQr && (
                    <div className="text-center shrink-0 pl-3 border-l border-zinc-200">
                      <img 
                        src={resolvedPaymentQrUrl!} 
                        alt="UPI Payment QR Code" 
                        className="w-24 h-24 border border-zinc-300 rounded-xl p-1 bg-white mx-auto shadow-xs" 
                      />
                      <span className="text-[8px] font-black text-teal-900 uppercase tracking-tight block mt-1">
                        Scan to Pay via UPI
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Commercial Terms & Conditions & Project Notes */}
            {(quotation.terms || quotation.notes || activeCompany?.quotation_notes || activeCompany?.terms_conditions) && (
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-1 text-[10px] text-zinc-600">
                <span className="font-bold text-zinc-900 uppercase text-[9.5px] tracking-wider block">
                  Commercial Terms &amp; Conditions / Project Notes:
                </span>
                <p className="whitespace-pre-line leading-relaxed">
                  {quotation.terms || quotation.notes || activeCompany?.quotation_notes || activeCompany?.terms_conditions}
                </p>
              </div>
            )}

            {/* 4. Dual Official Signatures & Acceptance Box */}
            <div className="pt-2 border-t-2 border-zinc-300 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              {/* Customer Acceptance Signature Box */}
              <div className="p-4 border-2 border-dashed border-zinc-300 rounded-xl space-y-3 bg-zinc-50/40">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  <span>Client Acceptance &amp; Purchase Confirmation</span>
                  <span>
                    {quotation.acceptedAt 
                      ? `Confirmed: ${formatQuotationDate(quotation.acceptedAt)}` 
                      : "Date: ____________"}
                  </span>
                </div>

                {quotation.status === "Accepted" || quotation.clientAccepted ? (
                  <div className="py-2.5 px-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-center font-sans shadow-2xs">
                    <div className="text-[10px] font-black uppercase text-emerald-800 flex items-center justify-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>Digitally Accepted &amp; Confirmed</span>
                    </div>
                    <div className="text-[9px] text-zinc-600 font-mono mt-0.5">
                      Confirmed by: <strong>{quotation.acceptedBy || clientOwnerName || "Client"}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="h-10 flex items-center justify-center text-zinc-400 italic text-[10px]">
                    [Client Signature / Stamp upon approval]
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-300 text-center">
                  <p className="font-bold text-zinc-950 text-xs">{clientOwnerName}</p>
                  <p className="text-[9.5px] text-zinc-500">{clientDesignation} • {clientBusinessName}</p>
                </div>
              </div>

              {/* Issuer Signature & Official Rubber Stamp Box */}
              <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/70 flex flex-col items-center justify-center text-center relative">
                <div className="w-full text-left text-[9.5px] font-bold uppercase tracking-wider text-teal-900 mb-1">
                  For {resolvedBrandName} {resolvedDivisionName}
                </div>

                <div className="flex items-center justify-center gap-6 my-1.5 min-h-[55px]">
                  {resolvedSignatureUrl ? (
                    <img src={resolvedSignatureUrl} alt="Signature" className="h-14 object-contain" />
                  ) : (
                    <div className="h-10 flex items-center justify-center italic font-serif text-zinc-400">
                      [Digitally Authorized Signatory]
                    </div>
                  )}

                  {resolvedStampUrl && (
                    <img src={resolvedStampUrl} alt="Official Seal" className="h-16 w-16 object-contain opacity-90" />
                  )}
                </div>

                <div className="w-full pt-1.5 border-t border-zinc-300">
                  <p className="font-bold text-zinc-950 text-xs">{resolvedSignatoryName}</p>
                  <p className="text-[9.5px] font-medium text-zinc-500">{resolvedSignatoryDesignation}</p>
                  <p className="text-[8.5px] text-zinc-400 mt-0.5">Authorized Signatory • Saampark Group</p>
                </div>
              </div>
            </div>

            {/* Statutory Declaration & Jurisdiction */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-[8px] text-zinc-500 leading-tight flex items-center justify-between">
              <span>We declare that this quotation shows the exact technical &amp; commercial specifications and that all particulars are true and correct.</span>
              <strong className="text-zinc-700 shrink-0 ml-2">Subject to Kolkata Jurisdiction</strong>
            </div>
          </div>

          {/* Final Page Bottom Footer */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-[8.5px] text-zinc-400">
            <span>Corporate Head Office: {resolvedAddress || "Kolkata, West Bengal"} • Registered under the Companies Act</span>
            <span className="font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">Final Page • Commercial Settlement &amp; Signatures</span>
          </div>
        </section>

      </div>
    </div>
  )
}
