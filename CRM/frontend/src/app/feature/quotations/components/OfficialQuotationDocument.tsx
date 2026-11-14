"use client"

import * as React from "react"
import { 
  Printer, Send, X, Building2, MapPin, Phone, Mail, Globe, 
  Shield, Calendar, Calculator, CheckCircle2, Clock, Landmark, 
  Stamp, FileCheck, ArrowRight, QrCode, FileText, UserCheck, Sparkles,
  Check, ChevronRight, Layers, Award, ShieldCheck, BadgeCheck, FileCode, CheckSquare, Megaphone,
  ListChecks, AlertCircle
} from "lucide-react"
import { useAuthStore, Company, Branch, DEFAULT_COMPANIES, getCompanyLogoUrl } from "@/store/useAuthStore"
import { OfficialFormNo9Document } from "@/components/documents/OfficialFormNo9Document"
import { printDocument } from "@/lib/printUtils"

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
  marketingPackage?: any
}

interface OfficialQuotationDocumentProps {
  quotation: QuotationData
  onClose?: () => void
  onAccept?: () => void
  onSendEmail?: () => void
  onConvertToInvoice?: () => void
  onConvertToProject?: () => void
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
  onConvertToProject,
  onConvertToClient,
  onSendEstimate,
  isClientRole = false,
}: OfficialQuotationDocumentProps) {
  const [isForm9Open, setIsForm9Open] = React.useState(false)
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

  // Resolved line items / deliverable modules with priority to deliverables if user specified modules
  const rawDeliverables: any[] = Array.isArray(quotation.deliverables) && quotation.deliverables.length > 0
    ? quotation.deliverables
    : []

  const rawItems: any[] = Array.isArray(quotation.items) && quotation.items.length > 0
    ? quotation.items
    : (Array.isArray(quotation.services) && quotation.services.length > 0 ? quotation.services : [])

  let lineItems: QuotationLineItem[] = []

  if (rawDeliverables.length > 0) {
    // User explicitly defined deliverables/modules (e.g. 5-6 modules in Document Studio)
    const count = rawDeliverables.length
    const hasPerItemPricing = rawItems.length === count && rawItems.some(it => (it.total || it.unitPrice || it.rate) > 0)
    const baseSharePerModule = count > 0 ? Math.floor(subtotal / count) : subtotal
    const remainder = subtotal - (baseSharePerModule * count)

    lineItems = rawDeliverables.map((d: any, idx: number) => {
      const matchedItem = rawItems.find((it: any) => 
        (it.id && d.id && String(it.id) === String(d.id)) ||
        (it.name && d.title && it.name.toLowerCase().trim() === d.title.toLowerCase().trim())
      ) || (rawItems.length === count ? rawItems[idx] : null)

      const title = d.title || d.name || matchedItem?.name || matchedItem?.serviceName || `Module ${idx + 1}`
      const description = d.description || matchedItem?.description || ""
      const duration = d.duration || matchedItem?.deliverableTime || matchedItem?.duration || "1-2 Weeks"
      const sac = matchedItem?.sac || matchedItem?.sacCode || rawItems[0]?.sac || "998311"
      const qty = matchedItem?.quantity || matchedItem?.qty || 1
      const unit = matchedItem?.unit || "Module"

      let itemBase = 0
      if (hasPerItemPricing && matchedItem) {
        itemBase = matchedItem.total || ((matchedItem.unitPrice || matchedItem.rate || 0) * qty)
      } else if (rawItems.length === 1 && (rawItems[0].total || rawItems[0].unitPrice)) {
        itemBase = idx === count - 1 ? (baseSharePerModule + remainder) : baseSharePerModule
      } else {
        itemBase = idx === count - 1 ? (baseSharePerModule + remainder) : baseSharePerModule
      }

      const unitPrice = qty > 0 ? Math.round(itemBase / qty) : itemBase

      return {
        id: d.id || `mod_${idx + 1}`,
        name: title,
        serviceName: title,
        description: description,
        deliverableTime: duration,
        sac: sac,
        quantity: qty,
        unit: unit,
        unitPrice: unitPrice,
        total: itemBase,
      }
    })
  } else if (rawItems.length > 0) {
    lineItems = rawItems.map((it: any, idx: number) => {
      const name = it.name || it.serviceName || it.title || `Module ${idx + 1}`
      const qty = it.quantity || it.qty || 1
      const unitPrice = it.unitPrice || it.rate || (it.total ? Math.round(it.total / qty) : 0)
      const total = it.total || it.totalAmount || (unitPrice * qty)
      return {
        ...it,
        id: it.id || `mod_${idx + 1}`,
        name: name,
        serviceName: name,
        description: it.description || "",
        deliverableTime: it.deliverableTime || it.duration || it.turnaround || "1-2 Weeks",
        sac: it.sac || it.sacCode || "998311",
        quantity: qty,
        unit: it.unit || "Nos",
        unitPrice: unitPrice,
        total: total,
      }
    })
  } else {
    // Fallback single default module
    lineItems = [
      {
        id: "mod_1",
        name: quotation.project || quotation.projectTitle || "Enterprise Solution & Engineering Scope",
        serviceName: quotation.project || quotation.projectTitle || "Enterprise Solution & Engineering Scope",
        description: quotation.overview || quotation.notes || "Complete custom architecture, database engineering, deployment & operational support.",
        deliverableTime: quotation.timeline || quotation.turnaroundTime || "4-6 Weeks",
        sac: "998311",
        quantity: 1,
        unit: "Project",
        unitPrice: subtotal,
        total: subtotal
      }
    ]
  }

  // Scannable UPI QR: Strictly respects uploaded QR images; if cleared or deleted, NO QR is rendered
  const isImageQrUrl = (url?: string | null): boolean => {
    if (!url || typeof url !== "string") return false
    const s = url.trim()
    return s !== "" && s !== "none" && (s.startsWith("http") || s.startsWith("data:") || s.startsWith("/"))
  }

  const rawCandidateQr = isSubBranchIssued
    ? (isNonGst ? (activeSubBranch?.nongst_payment_qr_url || activeSubBranch?.payment_qr_url) : (activeSubBranch?.gst_payment_qr_url || activeSubBranch?.payment_qr_url))
    : isBranchIssued
    ? (isNonGst ? (activeBranch?.nongst_payment_qr_url || activeBranch?.payment_qr_url) : (activeBranch?.gst_payment_qr_url || activeBranch?.payment_qr_url))
    : (isNonGst ? (activeCompany?.nongst_payment_qr_url || activeCompany?.payment_qr_url) : (activeCompany?.gst_payment_qr_url || activeCompany?.payment_qr_url))

  const resolvedPaymentQrUrl = isImageQrUrl(rawCandidateQr) ? rawCandidateQr : null

  const handlePrint = () => {
    printDocument("printable-quotation", `Quotation_${quotation.number}`)
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

  const isValidField = (val: any) => {
    if (val === null || val === undefined) return false
    const s = String(val).trim()
    return s !== "" && s !== "-" && s !== "N/A" && s !== "null" && s !== "undefined"
  }

  const hasBankName = isValidField(resolvedBankName)
  const hasAccountHolder = isValidField(resolvedAccountHolder)
  const hasAccountNum = isValidField(resolvedAccountNumber)
  const hasIfsc = isValidField(resolvedIfscCode)
  const hasBankBranch = isValidField(resolvedBankBranch)
  const hasUpi = isValidField(resolvedUpiId)
  const hasQr = Boolean(resolvedPaymentQrUrl)
  const hasAnyBankInfo = Boolean(hasBankName || hasAccountHolder || hasAccountNum || hasIfsc || hasBankBranch)
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

  const resolvedProjectTitle = quotation.project || quotation.projectTitle || "Enterprise Engineering & Technical Scope"
  const resolvedCategory = quotation.category || quotation.primaryCategory || "Software & Technology"
  const resolvedOverview = quotation.overview || quotation.notes || ""
  const resolvedTimeline = quotation.timeline || "4-6 Weeks"
  const resolvedTurnaround = quotation.turnaroundTime || "1-2 Weeks"

  return (
    <div className="official-quotation-modal-root relative flex flex-col w-full max-w-4xl mx-auto my-2 sm:my-4 bg-white text-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 print:border-none print:shadow-none print:my-0 print:max-w-none print:w-full">
      {/* ── TOP ACTION BAR (Hidden during printing) ── */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white border-b border-zinc-700 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-400/30">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              <span>Commercial Quotation / Scope Tender</span>
              <span className="font-mono text-amber-300">#{quotation.number}</span>
            </h3>
            <p className="text-[10px] text-zinc-400">Technical deliverable breakdown, scope specifications &amp; commercial quotation</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quotation.marketingPackage && (
            <button
              type="button"
              onClick={() => setIsForm9Open(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all cursor-pointer"
              title="View the dedicated Form No - 9 Digital Marketing execution sheet"
            >
              <Megaphone size={13} />
              <span>View Form No - 9</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-100 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Printer size={13} className="text-teal-700" />
            <span>Print / Save PDF</span>
          </button>

          {quotation.status !== "Accepted" && onAccept && (
            <button
              type="button"
              onClick={onAccept}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all cursor-pointer"
              title="Formally accept and approve this quotation"
            >
              <CheckCircle2 size={13} />
              <span>{isClientRole ? "Accept Quotation" : "Mark Accepted"}</span>
            </button>
          )}

          {(quotation.status === "Accepted" || quotation.clientAccepted) && (
            <div className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded-lg shadow-2xs">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Accepted</span>
            </div>
          )}

          {onConvertToClient && (
            <button
              type="button"
              onClick={onConvertToClient}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all cursor-pointer"
              title="Save this prospect as an official CRM Client"
            >
              <UserCheck size={13} />
              <span>Move to Client</span>
            </button>
          )}

          {onSendEstimate && (
            <button
              type="button"
              onClick={onSendEstimate}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
              title="Generate a commercial Estimate from this Quotation"
            >
              <Sparkles size={13} />
              <span>Create Estimate</span>
            </button>
          )}

          {onSendEmail && (
            <button
              type="button"
              onClick={onSendEmail}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-zinc-100 bg-zinc-700 hover:bg-zinc-600 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Send size={13} />
              <span>Send to Client</span>
            </button>
          )}

          {onConvertToInvoice && (
            <button
              type="button"
              onClick={onConvertToInvoice}
              className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <ArrowRight size={13} />
              <span>Convert to Invoice</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors ml-auto sm:ml-2 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── PRINTABLE DOCUMENT BODY (Standard A4 Corporate Format with Multi-Page Flow) ── */}
      <div className="w-full flex flex-col items-center py-2 print:p-0 print:m-0 overflow-x-auto">
        <div 
          id="printable-quotation" 
          className="a4-page bg-white text-zinc-900 font-sans p-5 sm:p-6 text-xs shadow-2xl border border-zinc-200/90 rounded-lg w-full max-w-[794px] mx-auto relative flex flex-col gap-4 overflow-visible print:w-[210mm] print:max-w-[210mm] print:h-auto print:min-h-0 print:max-h-none print:overflow-visible print:p-[4mm_6mm] print:gap-3.5 print:m-0 print:shadow-none print:border-none print:rounded-none"
        >
        
        {/* ── PAGE 1 CONTAINER: Header, Customer Details & Project Details Only ── */}
        <div 
          className="quotation-page-1 break-after-page print:break-after-page flex flex-col gap-3.5"
          style={{ breakAfter: 'page', pageBreakAfter: 'always' }}
        >
          {/* 1. Top Header: Company Brand, Logo, Statutory IDs & Document Header Card */}
          <div className="avoid-break break-inside-avoid flex flex-col gap-2.5 border-b-2 border-zinc-900 pb-3">
            <div 
              className="flex flex-row justify-between items-start gap-4 w-full print:flex-row print:justify-between print:items-start"
              style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}
            >
              {/* Logo Card */}
              {resolvedLogoUrl ? (
                <div 
                  className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-2xs shrink-0 border border-zinc-200 bg-white flex items-center justify-center p-1.5 print:w-24 print:h-24 print:shrink-0"
                  style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px', flexShrink: 0 }}
                >
                  <img 
                    src={resolvedLogoUrl} 
                    alt={resolvedBrandName} 
                    className="max-w-full max-h-full object-contain mx-auto print:max-w-full print:max-h-full" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div 
                  className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-md shrink-0 border border-teal-900/30 bg-gradient-to-b from-[#004e59] via-[#005c68] to-[#003840] flex flex-col items-center justify-center p-2 text-white text-center print:w-24 print:h-24 print:shrink-0"
                  style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px', flexShrink: 0 }}
                >
                  <Sparkles className="w-5 h-5 mb-1 text-teal-200 drop-shadow-sm" />
                  <div className="font-black text-[11px] tracking-wider uppercase leading-tight font-sans">{resolvedBrandName}</div>
                  <div className="text-[7px] font-bold text-teal-200 tracking-widest uppercase mt-0.5">{resolvedDivisionName || "ENTERPRISE"}</div>
                </div>
              )}

              {/* Center: BIG SAAMPARK and in below SECONDARY LINE */}
              <div 
                className="flex-1 flex flex-col items-center justify-center text-center min-w-0 px-2 sm:px-4 print:flex-1 print:text-center"
                style={{ flex: '1 1 auto', textAlign: 'center', minWidth: 0, padding: '0 8px' }}
              >
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl md:text-[34px] font-black tracking-wider leading-none text-zinc-950 uppercase font-sans text-center drop-shadow-2xs">
                    {resolvedBrandName}
                  </h1>
                  {resolvedTrademarkSymbol && resolvedTrademarkSymbol !== "none" ? (
                    resolvedTrademarkSymbol === "TM" || resolvedTrademarkSymbol === "™" ? (
                      <span 
                        className="inline-flex items-center justify-center w-[23px] h-[23px] min-w-[23px] min-h-[23px] rounded-full border-[1.5px] border-red-600 text-red-600 bg-white font-bold text-[9px] tracking-tight leading-none shrink-0 -translate-y-2 ml-1 shadow-xs select-none"
                        title="Trademark"
                      >
                        TM
                      </span>
                    ) : (
                      <span 
                        className="inline-flex items-center justify-center w-[20px] h-[20px] min-w-[20px] min-h-[20px] rounded-full border-[1.5px] border-red-600 text-red-600 bg-white font-black text-[11px] leading-none shrink-0 -translate-y-2 ml-1 shadow-xs select-none"
                        title="Registered Trademark"
                      >
                        R
                      </span>
                    )
                  ) : null}
                </div>

                {/* Secondary Line */}
                {resolvedDivisionName ? (
                  <h2 className="text-xs sm:text-sm md:text-[15px] font-black tracking-widest text-zinc-800 uppercase font-sans mt-1.5 block leading-tight text-center">
                    {resolvedDivisionName}
                  </h2>
                ) : null}

                {resolvedSubtitle && (
                  <p className="text-[8.5px] sm:text-[9px] font-semibold text-zinc-500 tracking-wider uppercase mt-0.5 text-center">
                    {resolvedSubtitle}
                  </p>
                )}

                {/* Legal IDs: CIN, GSTIN, PAN, MSME centered */}
                {hasLegalIds && (
                  <p className="text-[10px] sm:text-[10.5px] font-semibold text-zinc-600 font-mono pt-1.5 flex items-center justify-center gap-2.5 flex-wrap">
                    {resolvedCin && <span>CIN: <strong className="text-zinc-900 font-bold">{resolvedCin}</strong></span>}
                    {resolvedGstin && <span>{resolvedCin ? "| " : ""}GSTIN: <strong className="text-zinc-900 font-black">{resolvedGstin}</strong></span>}
                    {resolvedPan && <span>{(resolvedCin || resolvedGstin) ? "| " : ""}PAN: <strong className="text-zinc-900 font-black">{resolvedPan}</strong></span>}
                    {resolvedMsme && <span>| MSME: <strong className="text-zinc-900 font-semibold">{resolvedMsme}</strong></span>}
                  </p>
                )}
              </div>

              {/* Right: Header Card with Status Badge & Dates */}
              <div 
                className={`w-56 rounded-xl ${theme.cardHeaderGradient} text-white p-3.5 shadow-md shrink-0 flex flex-col self-start space-y-2 print:w-56 print:shrink-0`}
                style={{ width: '224px', minWidth: '224px', flexShrink: 0 }}
              >
                <div className="flex items-center justify-between border-b border-white/20 pb-1.5">
                  <span className="font-black text-[11px] tracking-wider uppercase">
                    {isNonGst ? "COMMERCIAL QUOTATION" : "TAX QUOTATION"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black tracking-wider uppercase ${
                    quotation.status === "Accepted" 
                      ? "bg-white text-emerald-800" 
                      : quotation.status === "Sent" 
                      ? "bg-white text-blue-800" 
                      : quotation.status === "Declined"
                      ? "bg-white text-rose-800"
                      : "bg-white text-zinc-800"
                  }`}>
                    {quotation.status}
                  </span>
                </div>

                <div className="space-y-1 text-[10px]">
                  <div>
                    <span className="text-white/80 text-[8px] uppercase tracking-wider font-semibold block">QUOTATION NO:</span>
                    <strong className="font-mono text-amber-300 text-[12.5px] font-black break-all leading-tight block">
                      {quotation.number}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-white/80 text-[8px] uppercase font-bold tracking-wider shrink-0 w-12">DATE:</span>
                    <strong className="text-white font-mono text-[9.5px]">
                      {formatQuotationDate(quotation.date)}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 text-[8px] uppercase font-bold tracking-wider shrink-0 w-12">VALID TILL:</span>
                    <strong className="text-amber-200 font-mono text-[9.5px]">
                      {formatQuotationDate(quotation.validTill)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Address & Contact Row (Full Address with wrap) */}
            {(resolvedAddress || hasContactInfo) && (
              <div 
                className="flex flex-row items-start justify-between gap-x-4 gap-y-1.5 text-[9.5px] text-zinc-700 pt-1.5 border-t border-zinc-100 w-full print:flex-row print:justify-between print:items-start"
                style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}
              >
                {resolvedAddress && (
                  <div className="flex items-start gap-1.5 min-w-0 flex-1 max-w-[65%]">
                    <span className={`w-3.5 h-3.5 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0 mt-0.5`}>
                      <MapPin size={8} />
                    </span>
                    <strong className="text-zinc-900 text-[9px] shrink-0">Registered Office:</strong>
                    <span className="text-zinc-700 text-[9px] leading-relaxed break-words whitespace-normal font-medium">{resolvedAddress}</span>
                  </div>
                )}

                {hasContactInfo && (
                  <div className="flex items-center gap-3 flex-wrap justify-end text-[9px] shrink-0">
                    {resolvedPhone && (
                      <p className="flex items-center gap-1">
                        <span className={`w-3.5 h-3.5 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
                          <Phone size={7.5} />
                        </span>
                        <span className="font-mono text-zinc-800 font-semibold">{resolvedPhone}</span>
                      </p>
                    )}
                    {resolvedEmail && (
                      <p className="flex items-center gap-1">
                        <span className={`w-3.5 h-3.5 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
                          <Mail size={7.5} />
                        </span>
                        <span className="text-zinc-700">{resolvedEmail}</span>
                      </p>
                    )}
                    {resolvedWebsite && (
                      <p className="flex items-center gap-1">
                        <span className={`w-3.5 h-3.5 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
                          <Globe size={7.5} />
                        </span>
                        <span className="text-zinc-700">{resolvedWebsite}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Issuing Branch / Operating Unit Card */}
            {(activeBranch || activeSubBranch) && (
              <div className="mt-1 p-2 rounded-xl bg-gradient-to-r from-teal-50 to-zinc-50 border border-teal-200/80 text-[9px] text-zinc-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-zinc-900 flex items-center gap-1">
                    <Building2 size={12} className="text-teal-700" />
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

          {/* 2. Customer / Bill-To Section (Card Style with Proprietor Details) */}
          <div className="avoid-break break-inside-avoid p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-900 mb-2 flex items-center justify-between border-b border-zinc-200/80 pb-1">
              <span className="flex items-center gap-1">
                <UserCheck size={12} className="text-teal-700" />
                <span>PREPARED EXCLUSIVELY FOR CLIENT &amp; PROPRIETOR / BUSINESS OWNER:</span>
              </span>
              <span className="text-emerald-700 font-bold text-[9px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Verified Commercial Entity
              </span>
            </div>

            <div 
              className="grid grid-cols-2 gap-4 text-xs print:grid-cols-2"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
            >
              <div className="space-y-1">
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">CLIENT / ENTERPRISE NAME:</span>
                  <h3 className="text-sm font-black text-zinc-950 uppercase leading-snug">{quotation.customer || quotation.client || "Client"}</h3>
                </div>

                {(quotation.contactPersonName || quotation.clientContactPerson || quotation.primaryContact) && (
                  <div className="pt-0.5">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">OWNER / AUTHORIZED PERSON:</span>
                    <p className="text-zinc-800 font-semibold text-[11px]">
                      {quotation.contactPersonName || quotation.clientContactPerson || quotation.primaryContact}
                      <span className="ml-1 text-[9.5px] font-normal text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">
                        {quotation.clientDesignation || "Proprietor"}
                      </span>
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[10.5px]">
                  {(quotation.customerEmail || quotation.clientEmail) && (
                    <p className="text-zinc-600 font-mono flex items-center gap-1">
                      <Mail size={10} className="text-zinc-400" />
                      <span>{quotation.customerEmail || quotation.clientEmail}</span>
                    </p>
                  )}
                  {(quotation.customerPhone || quotation.clientPhone) && (
                    <p className="text-zinc-600 font-mono flex items-center gap-1">
                      <Phone size={10} className="text-zinc-400" />
                      <span>{quotation.customerPhone || quotation.clientPhone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-zinc-600 space-y-1 sm:text-right">
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">OFFICIAL BILLING DESTINATION:</span>
                  <p className="leading-snug text-zinc-800 break-words whitespace-normal font-medium">
                    {quotation.customerAddress || quotation.clientAddress || "Client Registered Address"}
                  </p>
                </div>

                <div className="pt-0.5 space-y-0.5">
                  {quotation.clientGstin ? (
                    <p>
                      <span className="text-zinc-400 text-[9px] uppercase font-bold mr-1">Client GSTIN:</span>
                      <strong className="font-mono font-black text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                        {quotation.clientGstin}
                      </strong>
                    </p>
                  ) : (
                    <p className="text-zinc-400 text-[10px]">Unregistered Commercial Entity (B2C / Non-GST)</p>
                  )}

                  <p>
                    <span className="text-zinc-400 text-[9px] uppercase font-bold mr-1">Place of Supply:</span>
                    <strong className="text-zinc-800 font-semibold">{quotation.placeOfSupply || "West Bengal (Code 19)"}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Project Profile & Executive Technical Scope */}
          <div className="avoid-break break-inside-avoid p-3.5 rounded-xl border border-zinc-200 bg-white shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-teal-900 text-[10px]">
                <Layers size={13} className="text-teal-700" />
                <span>PROJECT PROFILE &amp; EXECUTIVE TECHNICAL SCOPE:</span>
              </div>
              <span className="text-[9px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Category: {resolvedCategory}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">PROJECT TITLE / ENGAGEMENT SCOPE:</span>
              <h4 className="text-xs sm:text-sm font-black text-zinc-950 uppercase font-mono tracking-tight">
                {resolvedProjectTitle}
              </h4>
            </div>

            {resolvedOverview && (
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">EXECUTIVE SCOPE STATEMENT:</span>
                <p className="text-[10.5px] text-zinc-700 leading-relaxed whitespace-pre-line bg-zinc-50/80 p-2.5 rounded-lg border border-zinc-100">
                  {resolvedOverview}
                </p>
              </div>
            )}

            {/* 3 Summary Stat Cards */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                <span className="text-zinc-400 block text-[7.5px] uppercase font-bold tracking-wider">OVERALL ESTIMATED TIMELINE</span>
                <strong className="text-zinc-900 text-[11px] font-mono font-bold">{resolvedTimeline}</strong>
              </div>
              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                <span className="text-zinc-400 block text-[7.5px] uppercase font-bold tracking-wider">SPRINT VELOCITY / TURNAROUND</span>
                <strong className="text-zinc-900 text-[11px] font-mono font-bold">{resolvedTurnaround}</strong>
              </div>
              <div className="bg-teal-50/80 p-2 rounded-lg border border-teal-200">
                <span className="text-teal-800 block text-[7.5px] uppercase font-bold tracking-wider">TOTAL DELIVERABLE MODULES</span>
                <strong className="text-teal-900 text-[11px] font-black">{lineItems.length} Specialized Modules</strong>
              </div>
            </div>
          </div>
        </div>
        {/* ── END OF PAGE 1 ── */}

        {/* ── INTERMEDIATE PAGES: Modules Roadmap, Scope Breakdown Cards & Specifications ── */}
        <div className="flex flex-col gap-4 w-full">

        {/* 4. Project Modules Roadmap & Deliverables Index (Summary Table) */}
        <div className="avoid-break break-inside-avoid border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-2.5 bg-zinc-900 text-white flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks size={13} className="text-teal-400" />
              <span>PROJECT MODULES ROADMAP &amp; DELIVERABLES INDEX</span>
            </span>
            <span className="text-[8px] text-zinc-300 font-medium">Detailed specifications on following section</span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-zinc-100 text-zinc-700 uppercase text-[9.5px] tracking-wider border-b border-zinc-200">
              <tr>
                <th className="py-2 px-3 w-10 text-center font-bold">#</th>
                <th className="py-2 px-3 font-bold">MODULE NAME / ENGINEERING SCOPE</th>
                <th className="py-2 px-3 text-center font-bold w-36">ESTIMATED DURATION / SPRINT</th>
                <th className="py-2 px-3 text-right font-bold w-32">COMMERCIAL VALUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800 bg-white">
              {lineItems.map((it, idx) => (
                <tr key={it.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-2 px-3 text-center font-mono font-bold text-zinc-500">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-bold text-zinc-950 text-[11px]">{it.name || it.serviceName}</div>
                    {it.description && (
                      <p className="text-[9.5px] text-zinc-500 line-clamp-1 mt-0.5 leading-normal">{it.description}</p>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                      <Clock size={9} className="text-teal-600" /> {it.deliverableTime || "1-2 Weeks"}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900 text-[11px]">
                    ₹{it.total.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5. Section II: Deliverables & Functional Scope Breakdown (Full Detailed Cards) */}
        <div className="space-y-3 w-full">
          <div className="avoid-break break-inside-avoid p-2.5 rounded-xl bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <FileCode size={14} className="text-teal-300" />
              <span className="text-xs font-black uppercase tracking-wider">
                SECTION II: DELIVERABLES &amp; FUNCTIONAL SCOPE BREAKDOWN
              </span>
            </div>
            <span className="text-[9px] font-bold text-teal-200 uppercase tracking-wider">
              Technical Module Specifications &amp; Deliverable Milestones
            </span>
          </div>

          {/* Module Breakdown Cards */}
          {lineItems.map((it, idx) => {
            const itemBase = it.total || (it.unitPrice * it.quantity)
            const itemTax = isNonGst ? 0 : Math.round(itemBase * 0.18)
            const itemGross = itemBase + itemTax

            return (
              <div 
                key={it.id || idx} 
                className="avoid-break break-inside-avoid rounded-xl border border-zinc-200 bg-white p-3.5 space-y-2.5 shadow-2xs hover:border-teal-300 transition-colors"
              >
                {/* Module Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-zinc-900 text-white tracking-wider">
                      MODULE #{String(idx + 1).padStart(2, "0")}
                    </span>
                    <h4 className="font-black text-xs sm:text-[13px] text-zinc-950 uppercase tracking-tight">
                      {it.name || it.serviceName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-mono text-[9.5px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      <Clock size={10} className="text-teal-600" /> Estimated Duration / Sprint: <strong className="font-bold">{it.deliverableTime || "1-2 Weeks"}</strong>
                    </span>
                    <span className="font-mono text-[9.5px] text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                      SAC/HSN: <strong>{it.sac || it.sacCode || "998311"}</strong>
                    </span>
                  </div>
                </div>

                {/* Scope Description & Technical Criteria */}
                <div className="space-y-1">
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1">
                    <CheckSquare size={11} className="text-teal-700" />
                    <span>SCOPE DESCRIPTION &amp; TECHNICAL CRITERIA:</span>
                  </span>
                  <div className="text-[11px] text-zinc-800 leading-relaxed whitespace-pre-line bg-zinc-50/90 p-3 rounded-lg border border-zinc-200/90 font-sans">
                    {it.description || "Full functional engineering deliverable according to specifications, architecture design, test criteria, and production deployment."}
                  </div>
                </div>

                {/* Itemized Commercial & Delivery Specs Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] pt-0.5">
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                    <span className="text-zinc-500 block text-[7.5px] uppercase font-bold">Quantity / Unit</span>
                    <strong className="text-zinc-900 font-mono text-[10.5px]">{it.quantity} {it.unit || "Nos"}</strong>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                    <span className="text-zinc-500 block text-[7.5px] uppercase font-bold">Unit Price</span>
                    <strong className="text-zinc-900 font-mono text-[10.5px]">₹{it.unitPrice.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                    <span className="text-zinc-500 block text-[7.5px] uppercase font-bold">Taxable Scope Value</span>
                    <strong className="text-zinc-900 font-mono text-[10.5px]">₹{itemBase.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                    <span className="text-zinc-500 block text-[7.5px] uppercase font-bold">Applicable Tax</span>
                    <strong className="text-zinc-900 font-mono text-[10.5px]">
                      {isNonGst ? "Exempt / Non-GST" : `₹${itemTax.toLocaleString("en-IN")} (18%)`}
                    </strong>
                  </div>
                  <div className="bg-teal-50/80 p-2 rounded-lg border border-teal-200">
                    <span className="text-teal-900 block text-[7.5px] uppercase font-bold">Total Scope Value</span>
                    <strong className="text-teal-900 font-mono font-black text-[11px]">₹{itemGross.toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 5.5 Scope Inclusions & Exclusions (If present) */}
        {(quotation.scopeInclusions || quotation.scopeExclusions) && (
          <div className="avoid-break break-inside-avoid grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {quotation.scopeInclusions && (
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>SCOPE INCLUSIONS &amp; ARCHITECTURAL COVERAGE</span>
                </span>
                <p className="text-[10px] text-zinc-700 whitespace-pre-line leading-relaxed font-sans">
                  {quotation.scopeInclusions}
                </p>
              </div>
            )}
            {quotation.scopeExclusions && (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <AlertCircle size={12} className="text-amber-600" />
                  <span>SCOPE EXCLUSIONS &amp; CLIENT DEPENDENCIES</span>
                </span>
                <p className="text-[10px] text-zinc-700 whitespace-pre-line leading-relaxed font-sans">
                  {quotation.scopeExclusions}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 5.6 Payment Milestones Schedule (If present) */}
        {Array.isArray(quotation.paymentMilestones) && quotation.paymentMilestones.length > 0 && (
          <div className="avoid-break break-inside-avoid border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-2.5 bg-zinc-800 text-white flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} className="text-teal-400" />
                <span>MILESTONE PAYMENT TERMS &amp; SPRINT SCHEDULE</span>
              </span>
              <span className="text-[8px] text-zinc-300">Phase-wise commercial disbursement schedule</span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-100 text-zinc-700 uppercase text-[9px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="py-2 px-3 font-bold">Milestone / Deliverable Phase</th>
                  <th className="py-2 px-3 font-bold text-center w-24">Allocation</th>
                  <th className="py-2 px-3 font-bold">Sprint Stage Trigger</th>
                  <th className="py-2 px-3 font-bold text-right w-32">Phase Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800 bg-white text-[10.5px]">
                {quotation.paymentMilestones.map((pm, idx) => {
                  const mAmount = Math.round((grandTotal * (pm.percentage || 0)) / 100)
                  return (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-bold text-zinc-900">{pm.milestone}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-teal-800">{pm.percentage}%</td>
                      <td className="py-2 px-3 text-zinc-600">{pm.stage}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-950">₹{mAmount.toLocaleString("en-IN")}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5.7 Form No. 9 Digital Marketing Campaign Summary (If present) */}
        {quotation.marketingPackage && (
          <div className="avoid-break break-inside-avoid p-3.5 rounded-xl border-2 border-purple-200 bg-purple-50/50 space-y-2">
            <div className="flex items-center justify-between border-b border-purple-200 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-purple-600 text-white uppercase tracking-wider">
                  {quotation.marketingPackage.formNumber || "FORM NO - 9"}
                </span>
                <span className="text-xs font-black text-purple-950 uppercase">
                  Digital Marketing &amp; Social Media Campaign Package
                </span>
              </div>
              <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                Plan: {quotation.marketingPackage.packageName || "Grow - 2"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="bg-white p-2 rounded-lg border border-purple-100 shadow-2xs">
                <span className="text-zinc-500 block text-[8px] uppercase font-bold">Posters Deliverable</span>
                <strong className="text-purple-900 text-xs">{quotation.marketingPackage.postersPerMonth || 15} Posters / Month</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-purple-100 shadow-2xs">
                <span className="text-zinc-500 block text-[8px] uppercase font-bold">Video Reels Deliverable</span>
                <strong className="text-purple-900 text-xs">{quotation.marketingPackage.videosPerMonth || 15} Reels / Month</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-purple-100 shadow-2xs">
                <span className="text-zinc-500 block text-[8px] uppercase font-bold">Target Locations</span>
                <strong className="text-zinc-800 text-xs truncate block">{quotation.marketingPackage.targetLocations || "Regional Business Network"}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-purple-100 shadow-2xs">
                <span className="text-zinc-500 block text-[8px] uppercase font-bold">Execution Window</span>
                <strong className="text-zinc-800 text-xs">{quotation.marketingPackage.durationMonths || 1} Month Campaign</strong>
              </div>
            </div>
          </div>
        )}

        </div>
        {/* ── END OF INTERMEDIATE PAGES ── */}

        {/* ── VERY LAST PAGE: Commercial Summary, Banking & Remittance Details, Terms, Dual Signatures ── */}
        <div 
          className="quotation-final-page break-before-page print:break-before-page flex flex-col gap-4 w-full pt-1"
          style={{ breakBefore: 'page', pageBreakBefore: 'always' }}
        >
        {/* 6. Consolidated Commercial Summary Table */}
        <div className="avoid-break break-inside-avoid border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-2.5 bg-zinc-900 text-white flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Calculator size={13} className="text-teal-400" />
              <span>SECTION III: CONSOLIDATED COMMERCIAL SUMMARY &amp; TAXATION</span>
            </span>
            <span className="text-[8px] text-zinc-300">All prices in Indian National Rupee (INR)</span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead className={`${theme.tableHeaderBg} uppercase text-[9.5px] tracking-wider`}>
              <tr>
                <th className="py-2.5 px-3 w-10 text-center font-bold">#</th>
                <th className="py-2.5 px-4 font-bold">Scope Summary &amp; Module List</th>
                <th className="py-2.5 px-3 text-center font-bold">SAC/HSN</th>
                <th className="py-2.5 px-3 text-center font-bold">Qty</th>
                <th className="py-2.5 px-3 text-right font-bold">Unit Price (₹)</th>
                <th className="py-2.5 px-3 text-right font-bold">Taxable Value (₹)</th>
                {!isNonGst && (
                  <>
                    <th className="py-2.5 px-3 text-right font-bold">CGST (9%)</th>
                    <th className="py-2.5 px-3 text-right font-bold">SGST (9%)</th>
                  </>
                )}
                <th className="py-2.5 px-4 text-right font-bold">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800 bg-white">
              {lineItems.map((it, idx) => {
                const itemBase = it.total || (it.unitPrice * it.quantity)
                const itemTax = isNonGst ? 0 : Math.round(itemBase * 0.18)
                const itemCgst = Math.round(itemTax / 2)
                const itemSgst = itemTax - itemCgst
                const itemGross = itemBase + itemTax

                return (
                  <tr key={it.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-zinc-500 font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-zinc-950">{it.name || it.serviceName}</div>
                      <span className="font-mono text-[9px] text-teal-700">Sprint: {it.deliverableTime || "1-2 Weeks"}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-zinc-500">
                      {it.sac || it.sacCode || "998311"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold">{it.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono">₹{it.unitPrice.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">₹{itemBase.toLocaleString("en-IN")}</td>
                    {!isNonGst && (
                      <>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-600">₹{itemCgst.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-600">₹{itemSgst.toLocaleString("en-IN")}</td>
                      </>
                    )}
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-zinc-950">
                      ₹{itemGross.toLocaleString("en-IN")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-zinc-50 border-t border-zinc-200 font-semibold text-zinc-700">
              <tr>
                <td colSpan={3} className="py-2 px-4 font-bold uppercase text-[10px] text-zinc-600">Subtotal Scope Value</td>
                <td className="py-2 px-3 text-center font-mono">{lineItems.reduce((acc, it) => acc + (it.quantity || 1), 0)}</td>
                <td></td>
                <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">₹{subtotal.toLocaleString("en-IN")}</td>
                {!isNonGst && (
                  <>
                    <td className="py-2 px-3 text-right font-mono">₹{cgst.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-3 text-right font-mono">₹{sgst.toLocaleString("en-IN")}</td>
                  </>
                )}
                <td className="py-2 px-4 text-right font-mono font-black text-teal-800">₹{grandTotal.toLocaleString("en-IN")}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 7. Computation, Words, Banking & Remittance Grid */}
        <div className="avoid-break break-inside-avoid grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
          {/* Left Column: Words & Payment Details */}
          <div className="sm:col-span-7 space-y-3">
            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-xs">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-teal-900 block mb-0.5">
                Total Quotation Value in Words:
              </span>
              <p className="font-serif italic font-bold text-teal-950 text-xs leading-snug">
                {numberToIndianWords(grandTotal)}
              </p>
            </div>

            {/* Bank Remittance Details Box */}
            {hasAnyPaymentInfo && (
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-1.5 text-[10.5px]">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-1">
                  <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <Landmark size={12} className="text-teal-700" />
                    <span>Beneficiary Remittance &amp; Banking Details</span>
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">NEFT / RTGS / IMPS / UPI</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 flex-1">
                    {hasBankName && (
                      <div className="flex justify-between"><span className="text-zinc-500">Bank Name:</span> <span className="font-semibold text-zinc-900">{resolvedBankName}</span></div>
                    )}
                    {hasAccountHolder && (
                      <div className="flex justify-between"><span className="text-zinc-500">Account Name:</span> <span className="font-semibold text-zinc-900">{resolvedAccountHolder}</span></div>
                    )}
                    {hasAccountNum && (
                      <div className="flex justify-between"><span className="text-zinc-500">Account Number:</span> <span className="font-mono font-bold text-zinc-900">{resolvedAccountNumber}</span></div>
                    )}
                    {hasIfsc && (
                      <div className="flex justify-between"><span className="text-zinc-500">IFSC Code:</span> <span className="font-mono font-bold text-teal-700">{resolvedIfscCode}</span></div>
                    )}
                    {hasBankBranch && (
                      <div className="flex justify-between"><span className="text-zinc-500">Branch:</span> <span className="font-semibold text-zinc-800">{resolvedBankBranch}</span></div>
                    )}
                    {hasUpi && (
                      <div className="flex justify-between"><span className="text-zinc-500">UPI ID:</span> <span className="font-mono font-bold text-emerald-700">{resolvedUpiId}</span></div>
                    )}
                  </div>

                  {hasQr && (
                    <div className="text-center shrink-0">
                      <img 
                        src={resolvedPaymentQrUrl!} 
                        alt="UPI QR" 
                        className="w-16 h-16 border border-zinc-200 rounded-lg p-1 bg-white mx-auto shadow-2xs" 
                      />
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tight block mt-0.5">Scan to Remit</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Calculations */}
          <div className="sm:col-span-5 space-y-2 text-xs">
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1.5">
              <div className="flex justify-between text-zinc-600 text-[11px]">
                <span>{isNonGst ? "Commercial Scope Subtotal:" : "Taxable Value (Subtotal):"}</span>
                <span className="font-mono font-semibold text-zinc-900">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {!isNonGst && (
                <>
                  <div className="flex justify-between text-zinc-600 text-[11px]">
                    <span>Central GST (CGST 9%):</span>
                    <span className="font-mono font-semibold text-zinc-900">₹{cgst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 text-[11px]">
                    <span>State GST (SGST 9%):</span>
                    <span className="font-mono font-semibold text-zinc-900">₹{sgst.toLocaleString("en-IN")}</span>
                  </div>
                </>
              )}
              <div className="border-t-2 border-teal-700 pt-1.5 flex justify-between items-center text-sm font-black text-zinc-950">
                <span className="uppercase text-xs tracking-wide">Total Quotation Value:</span>
                <span className="text-base text-teal-800 font-mono font-black">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[9.5px] text-amber-900 leading-tight">
              <strong>Notice:</strong> This quotation is valid for 30 calendar days from issue date. Deliverables and sprints commence upon mobilization advance clearance.
            </div>
          </div>
        </div>

        {/* 8. Commercial Terms & Conditions */}
        <div className="avoid-break break-inside-avoid p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-1">
          <div className="text-[9.5px] font-bold uppercase tracking-wider text-teal-900 flex items-center justify-between">
            <span>OFFICIAL TERMS &amp; CONDITIONS OF ENGAGEMENT:</span>
            <span className="text-zinc-400 font-normal text-[8.5px]">Standard Corporate Scope Policy</span>
          </div>
          <p className="text-[10px] text-zinc-700 whitespace-pre-line leading-relaxed font-sans">
            {quotation.terms || activeSubBranch?.terms_conditions || activeBranch?.terms_conditions || activeCompany?.terms_conditions || "1. Quotation is valid for 30 days from date of issuance.\n2. 50% mobilization advance required before project kick-off.\n3. Applicable GST 18% billed as per statutory norms.\n4. All disputes subject to local jurisdiction only."}
          </p>
        </div>

        {/* 9. Official Dual Signatures & Acceptance Box */}
        <div className="avoid-break break-inside-avoid grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Customer Acceptance Sign */}
          <div className="p-3 border border-dashed border-zinc-300 rounded-xl space-y-3 bg-zinc-50/40">
            <div className="flex justify-between text-[9.5px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Client Acceptance &amp; Purchase Order</span>
              <span>
                {quotation.acceptedAt 
                  ? `Accepted: ${formatQuotationDate(quotation.acceptedAt)}` 
                  : "Date: ____________"}
              </span>
            </div>
            {quotation.status === "Accepted" || quotation.clientAccepted ? (
              <div className="py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-center font-sans shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-emerald-700 flex items-center justify-center gap-1">
                  <span>✓ Digitally Accepted &amp; Confirmed</span>
                </div>
                <div className="text-[9px] text-zinc-600 font-mono mt-0.5">
                  Confirmed by: {quotation.acceptedBy || quotation.customer || "Client"}
                </div>
              </div>
            ) : (
              <div className="h-5" />
            )}
            <div className="pt-1.5 border-t border-zinc-300 text-center">
              <p className="font-bold text-zinc-900 text-xs">{quotation.customer}</p>
              <p className="text-[9.5px] text-zinc-400">
                {quotation.status === "Accepted" || quotation.clientAccepted ? "✓ Verified Online Acceptance" : "Authorized Signature & Company Seal"}
              </p>
            </div>
          </div>

          {/* Issuer Signature & Official Stamp */}
          <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/60 flex flex-col items-center justify-center text-center relative">
            <div className="w-full text-left text-[9.5px] font-bold uppercase tracking-wider text-teal-900 mb-1">
              For {resolvedBrandName} {resolvedDivisionName}
            </div>

            <div className="flex items-center justify-center gap-4 my-1 min-h-[50px]">
              {resolvedSignatureUrl ? (
                <img src={resolvedSignatureUrl} alt="Signature" className="h-12 object-contain" />
              ) : (
                <div className="h-10 flex items-center justify-center italic font-serif text-zinc-400 text-xs">
                  [Digitally Authorized]
                </div>
              )}

              {resolvedStampUrl && (
                <img src={resolvedStampUrl} alt="Stamp" className="h-14 w-14 object-contain opacity-90" />
              )}
            </div>

            <div className="w-full pt-1.5 border-t border-zinc-300">
              <p className="font-bold text-zinc-950 text-xs">{resolvedSignatoryName}</p>
              <p className="text-[9.5px] font-medium text-zinc-500">{resolvedSignatoryDesignation}</p>
              <p className="text-[8.5px] text-zinc-400 mt-0.5">This quotation constitutes a binding commercial offer upon receipt of confirmation.</p>
            </div>
          </div>
        </div>

        {/* 10. Dedicated Bottom Declarations & Terms Section */}
        <div className="avoid-break break-inside-avoid w-full rounded-md border border-zinc-200/90 bg-zinc-50/70 p-2 text-[8px] sm:text-[8.5px] text-zinc-600 leading-tight space-y-0.5">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-0.5">
            <span className="font-bold uppercase tracking-wider text-zinc-700 text-[8px] flex items-center gap-1">
              <span>⚖️ Statutory Declaration &amp; Legal Terms:</span>
            </span>
            <span className="text-[7.5px] text-zinc-500 font-medium">
              Subject to Kolkata Jurisdiction • Formal Corporate Commercial Quotation
            </span>
          </div>
          <p className="text-zinc-600 italic leading-relaxed">
            {(quotation as any).bottomNote || (quotation as any).bottomDetails || "We declare that this quotation shows the estimated price of the services described and that all particulars are true and correct. All disputes are subject to Kolkata jurisdiction."}
          </p>
        </div>

        {/* 11. Footer Jurisdiction Notice */}
        <div className="avoid-break break-inside-avoid text-center text-[9px] text-zinc-400 pt-1.5 border-t border-zinc-200">
          Corporate Office: {resolvedAddress || "Kolkata, West Bengal"} • Registered under the Companies Act • All disputes subject to local jurisdiction only.
        </div>
        </div>
        {/* ── END OF VERY LAST PAGE ── */}
      </div>
    </div>

    {/* Form No. 9 Modal Viewer */}
    {isForm9Open && quotation.marketingPackage && (
      <OfficialFormNo9Document
        pkg={quotation.marketingPackage}
        clientInfo={{
          name: quotation.customer,
          businessName: quotation.customer,
          phone: quotation.customerPhone,
          address: quotation.customerAddress,
          category: quotation.category || quotation.primaryCategory,
        }}
        branchInfo={{
          branchName: activeBranch?.name || activeSubBranch?.name || "Balichak",
          branchCode: activeBranch?.code || activeSubBranch?.code || "B-2501",
        }}
        onClose={() => setIsForm9Open(false)}
      />
    )}
  </div>
  )
}
