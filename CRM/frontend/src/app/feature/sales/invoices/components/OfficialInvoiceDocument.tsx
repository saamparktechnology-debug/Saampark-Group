"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  MapPin, Phone, Mail, Globe, Building2, Landmark, ShieldCheck, 
  Award, Sparkles, UserCheck, Briefcase, FileText, QrCode, CreditCard, 
  CheckCircle2, Layers, Check
} from "lucide-react"
import { InvoiceItem, InvoiceLineItem } from "../services/invoiceService"
import { CompanyPaymentSettings } from "@/app/feature/settings/services/companyPaymentService"
import { ClientItem } from "@/app/feature/clients/types"
import { useAuthStore, Company, Branch, SubBranch, DEFAULT_COMPANIES, getCompanyLogoUrl } from "@/store/useAuthStore"

export interface CustomTextStamp {
  id: string
  text: string
  color: string
  fontSize?: number
  x: number
  y: number
}

interface OfficialInvoiceDocumentProps {
  invoice: InvoiceItem
  clientDetails?: ClientItem | null
  companyDetails?: Company | null
  paySettings?: CompanyPaymentSettings
  interactive?: boolean
  logoPosition?: { x: number; y: number }
  onLogoPositionChange?: (pos: { x: number; y: number }) => void
  signaturePosition?: { x: number; y: number }
  onSignaturePositionChange?: (pos: { x: number; y: number }) => void
  customStamps?: CustomTextStamp[]
  onCustomStampMove?: (id: string, pos: { x: number; y: number }) => void
  onRemoveCustomStamp?: (id: string) => void
  overrideLogoUrl?: string
  overrideSignatureUrl?: string
  overrideStampUrl?: string
  overrideBankDetails?: {
    bankName?: string
    accountHolder?: string
    accountNumber?: string
    ifscCode?: string
    bankBranch?: string
    upiId?: string
    paymentQrUrl?: string
  }
  activeBranch?: Branch | any | null
  activeSubBranch?: SubBranch | any | null
}

export function formatInvoiceDate(rawDate?: string | number | Date | null): string {
  if (!rawDate) return "-"
  const str = String(rawDate).trim()
  if (str === "-" || str === "") return "-"

  // Check if already in DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (dmyMatch) {
    return `${dmyMatch[1].padStart(2, "0")}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[3]}`
  }

  // Check if in YYYY-MM-DD or YYYY/MM/DD
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

  const str = ("000000000" + num).substr(-9)
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

export function OfficialInvoiceDocument({
  invoice,
  clientDetails,
  companyDetails,
  paySettings,
  interactive = false,
  logoPosition = { x: 0, y: 0 },
  onLogoPositionChange,
  signaturePosition = { x: 0, y: 0 },
  onSignaturePositionChange,
  customStamps = [],
  onCustomStampMove,
  onRemoveCustomStamp,
  overrideLogoUrl,
  overrideSignatureUrl,
  overrideStampUrl,
  overrideBankDetails,
  activeBranch: propActiveBranch,
  activeSubBranch: propActiveSubBranch,
}: OfficialInvoiceDocumentProps) {
  const { 
    companies, 
    branches, 
    subBranches, 
    activeCompanyId, 
    activeBranchId,
    fetchCompanies, 
    fetchBranches, 
    fetchSubBranches 
  } = useAuthStore()

  // Ensure entities are fetched if not yet loaded
  React.useEffect(() => {
    if (!companies || companies.length === 0) fetchCompanies().catch(() => {})
    if (!branches || branches.length === 0) fetchBranches().catch(() => {})
    if (!subBranches || subBranches.length === 0) fetchSubBranches().catch(() => {})
  }, [companies, branches, subBranches, fetchCompanies, fetchBranches, fetchSubBranches])

  // 1. Resolve Company Details dynamically based on specific invoice company
  const activeCompany = React.useMemo(() => {
    if (companyDetails) return companyDetails

    const targetCompId = String(invoice.companyId || (invoice as any).company || activeCompanyId || "tech").toLowerCase().trim()
    const targetCompName = String((invoice as any).companyName || "").toLowerCase().trim()

    const matched = companies.find(c => {
      const cId = c.id.toLowerCase().trim()
      const cSlug = (c.slug || "").toLowerCase().trim()
      const cName = c.name.toLowerCase().trim()
      const cBrand = (c.brand_name || "").toLowerCase().trim()
      const cDivision = (c.division_name || "").toLowerCase().trim()
      return (
        cId === targetCompId || 
        cSlug === targetCompId || 
        cName === targetCompId ||
        (targetCompName && (cName === targetCompName || cBrand === targetCompName || `${cBrand} ${cDivision}`.trim() === targetCompName))
      )
    })
    if (matched) return matched

    const defMatch = DEFAULT_COMPANIES.find(c => c.id.toLowerCase() === targetCompId || c.slug?.toLowerCase() === targetCompId)
    return defMatch || companies[0] || DEFAULT_COMPANIES[0]
  }, [companyDetails, invoice.companyId, (invoice as any).company, (invoice as any).companyName, activeCompanyId, companies])

  // Resolve Issuing Branch / Sub-Branch Details
  const activeBranch: Branch | null = React.useMemo(() => {
    if (propActiveBranch) return propActiveBranch
    const targetBranchId = String(invoice.branchId || (invoice as any).branch_id || "").toLowerCase().trim()
    const targetBranchName = String(invoice.branchName || (invoice as any).branch_name || "").toLowerCase().trim()

    if (!targetBranchId && !targetBranchName) return null

    const matched = (branches || []).find(b => {
      const bId = String(b.id || "").toLowerCase().trim()
      const bName = String(b.name || "").toLowerCase().trim()
      const bCode = String(b.code || "").toLowerCase().trim()
      return (targetBranchId && (bId === targetBranchId || bCode === targetBranchId)) ||
             (targetBranchName && (bName === targetBranchName || bCode === targetBranchName))
    })

    if (matched) return matched

    if (targetBranchName) {
      return {
        id: targetBranchId || "branch",
        name: targetBranchName,
        code: (invoice as any).branchCode || "",
        companyId: invoice.companyId || "tech",
        status: "Active",
        city: "",
        address: "",
        phone: "",
        email: "",
      } as Branch
    }
    return null
  }, [propActiveBranch, invoice.branchId, invoice.branchName, (invoice as any).branch_id, (invoice as any).branch_name, (invoice as any).branchCode, branches])

  const activeSubBranch = React.useMemo(() => {
    if (propActiveSubBranch) return propActiveSubBranch
    const targetSbId = String(invoice.subBranchId || (invoice as any).sub_branch_id || "").toLowerCase().trim()
    const targetSbName = String(invoice.subBranchName || (invoice as any).sub_branch_name || "").toLowerCase().trim()

    if (!targetSbId && !targetSbName) return null

    return (subBranches || []).find(sb => {
      const sbId = String(sb.id || "").toLowerCase().trim()
      const sbName = String(sb.name || "").toLowerCase().trim()
      const sbCode = String(sb.code || "").toLowerCase().trim()
      return (targetSbId && (sbId === targetSbId || sbCode === targetSbId)) ||
             (targetSbName && (sbName === targetSbName || sbCode === targetSbName))
    }) || null
  }, [propActiveSubBranch, invoice.subBranchId, invoice.subBranchName, (invoice as any).sub_branch_id, (invoice as any).sub_branch_name, subBranches])

  // ── Unified Entity Resolution (Specific Issuing Entity Priority) ──
  const isSubBranchIssued = Boolean(activeSubBranch)
  const isBranchIssued = Boolean(activeBranch) && !isSubBranchIssued

  const resolvedBrandName = activeSubBranch?.brand_name || activeSubBranch?.name || activeBranch?.brand_name || activeCompany?.brand_name || activeCompany?.name || "SAAMPARK"
  const resolvedDivisionName = (activeSubBranch?.division_name && activeSubBranch.division_name.trim()) 
    ? activeSubBranch.division_name.trim() 
    : ((activeBranch?.division_name && activeBranch.division_name.trim()) 
      ? activeBranch.division_name.trim() 
      : (activeCompany?.division_name?.trim() || ""))
  const resolvedSubtitle = activeSubBranch?.subtitle || activeBranch?.subtitle || activeCompany?.subtitle || ""
  const resolvedLogoUrl = overrideLogoUrl || activeSubBranch?.logo_url || activeBranch?.logo_url || getCompanyLogoUrl(activeCompany) || activeCompany?.logo_url || ""

  // Specific Entity Legal IDs
  const resolvedCin = (isSubBranchIssued ? activeSubBranch?.cin : isBranchIssued ? activeBranch?.cin : activeCompany?.cin)?.trim() || ""
  const resolvedGstin = (isSubBranchIssued ? activeSubBranch?.gstin : isBranchIssued ? activeBranch?.gstin : activeCompany?.gstin)?.trim() || ""
  const resolvedPan = (isSubBranchIssued ? activeSubBranch?.pan : isBranchIssued ? activeBranch?.pan : activeCompany?.pan)?.trim() || ""

  // Address & Contact Information
  const resolvedAddress = (isSubBranchIssued ? activeSubBranch?.address : isBranchIssued ? activeBranch?.address : activeCompany?.address)?.trim() || ""
  const resolvedPhone = (isSubBranchIssued ? (activeSubBranch?.phone || (activeSubBranch as any)?.partnerPhone) : isBranchIssued ? activeBranch?.phone : activeCompany?.phone)?.trim() || ""
  const resolvedEmail = (isSubBranchIssued ? (activeSubBranch?.email || (activeSubBranch as any)?.partnerEmail) : isBranchIssued ? activeBranch?.email : activeCompany?.email)?.trim() || ""
  const resolvedWebsite = (isSubBranchIssued ? activeSubBranch?.website : isBranchIssued ? activeBranch?.website : activeCompany?.website)?.trim() || ""

  // 2. Determine if GST (>0%) or Non-GST / 0% GST Bill (Done early for Bank profile binding)
  const isExplicitNonGst = 
    invoice.id?.toUpperCase().startsWith("NGINV") || 
    (invoice as any).invoiceType === "nongst" || 
    (invoice as any).type === "nongst" || 
    (invoice.gstRate === 0 && (!invoice.items || invoice.items.every(it => !it.gstRate || it.gstRate === 0))) ||
    (invoice.gstAmount === 0 && (!invoice.items || invoice.items.every(it => !it.gstAmount || it.gstAmount === 0)))
  
  const hasItemGst = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items.some(it => (Number(it.gstRate) || 0) > 0 || (Number(it.gstAmount) || 0) > 0)
    : false

  const isGstInvoice = !isExplicitNonGst && Boolean(
    hasItemGst ||
    (typeof invoice.gstRate === "number" && invoice.gstRate > 0) ||
    (typeof invoice.gstAmount === "number" && invoice.gstAmount > 0)
  )

  // Bank & UPI details resolved specifically for issuing entity and GST vs Non-GST
  const resolvedUpiId = overrideBankDetails?.upiId || (isSubBranchIssued 
    ? (activeSubBranch?.upi_id || (activeSubBranch as any)?.bankDetails?.upiId) 
    : isBranchIssued 
    ? activeBranch?.upi_id 
    : (isGstInvoice ? (activeCompany?.gst_upi_id || activeCompany?.upi_id) : (activeCompany?.nongst_upi_id || activeCompany?.upi_id)) || paySettings?.upiId)?.trim() || ""

  const resolvedAccountHolder = overrideBankDetails?.accountHolder || (isSubBranchIssued 
    ? (activeSubBranch?.account_holder || (activeSubBranch as any)?.bankDetails?.accountHolder) 
    : isBranchIssued 
    ? activeBranch?.account_holder 
    : (isGstInvoice ? (activeCompany?.gst_account_holder || activeCompany?.account_holder) : (activeCompany?.nongst_account_holder || activeCompany?.account_holder)) || paySettings?.accountHolderName)?.trim() || ""

  const resolvedBankName = overrideBankDetails?.bankName || (isSubBranchIssued 
    ? (activeSubBranch?.bank_name || (activeSubBranch as any)?.bankDetails?.bankName) 
    : isBranchIssued 
    ? activeBranch?.bank_name 
    : (isGstInvoice ? (activeCompany?.gst_bank_name || activeCompany?.bank_name) : (activeCompany?.nongst_bank_name || activeCompany?.bank_name)) || paySettings?.bankName)?.trim() || ""

  const resolvedAccountNumber = overrideBankDetails?.accountNumber || (isSubBranchIssued 
    ? (activeSubBranch?.account_number || (activeSubBranch as any)?.bankDetails?.accountNumber) 
    : isBranchIssued 
    ? activeBranch?.account_number 
    : (isGstInvoice ? (activeCompany?.gst_account_number || activeCompany?.account_number) : (activeCompany?.nongst_account_number || activeCompany?.account_number)) || paySettings?.accountNumber)?.trim() || ""

  const resolvedIfscCode = overrideBankDetails?.ifscCode || (isSubBranchIssued 
    ? (activeSubBranch?.ifsc_code || (activeSubBranch as any)?.bankDetails?.ifscCode) 
    : isBranchIssued 
    ? activeBranch?.ifsc_code 
    : (isGstInvoice ? (activeCompany?.gst_ifsc_code || activeCompany?.ifsc_code) : (activeCompany?.nongst_ifsc_code || activeCompany?.ifsc_code)) || paySettings?.ifscCode)?.trim() || ""

  const resolvedBankBranch = overrideBankDetails?.bankBranch || (isSubBranchIssued 
    ? activeSubBranch?.bank_branch 
    : isBranchIssued 
    ? activeBranch?.bank_branch 
    : (isGstInvoice ? (activeCompany?.gst_bank_branch || activeCompany?.bank_branch) : (activeCompany?.nongst_bank_branch || activeCompany?.bank_branch)) || paySettings?.branch)?.trim() || ""

  // Signatory & Stamp URLs (Strict to issuing entity with overrides)
  const resolvedSignatureUrl = overrideSignatureUrl || (isSubBranchIssued 
    ? activeSubBranch?.signature_image_url 
    : isBranchIssued 
    ? activeBranch?.signature_image_url 
    : (activeCompany?.signature_image_url || (activeCompany as any)?.signatureImageUrl || (activeCompany as any)?.signature_url))?.trim() || ""

  const resolvedStampUrl = overrideStampUrl || (isSubBranchIssued 
    ? activeSubBranch?.stamp_image_url 
    : isBranchIssued 
    ? activeBranch?.stamp_image_url 
    : activeCompany?.stamp_image_url)?.trim() || ""

  const resolvedSignatoryName = (isSubBranchIssued 
    ? activeSubBranch?.signatory_name 
    : isBranchIssued 
    ? activeBranch?.signatory_name 
    : activeCompany?.signatory_name)?.trim() || ""

  const resolvedSignatoryDesignation = (isSubBranchIssued 
    ? activeSubBranch?.signatory_designation 
    : isBranchIssued 
    ? activeBranch?.signatory_designation 
    : activeCompany?.signatory_designation)?.trim() || ""

  // Theme configuration based on GST (Teal theme) vs Non-GST (Light Blue theme)
  const theme = isGstInvoice
    ? {
        name: "gst-teal",
        headerGradient: "bg-gradient-to-r from-[#005f69] via-[#007380] to-[#008a99]",
        cardHeaderGradient: "bg-gradient-to-br from-[#005f69] via-[#007380] to-[#008a99]",
        primaryBg: "bg-[#005f69]",
        primaryText: "text-[#005f69]",
        lightBg: "bg-teal-50/70 dark:bg-teal-950/30",
        lightBorder: "border-teal-200/80 dark:border-teal-800/60",
        tableHeaderBg: "bg-[#005f69] text-white",
        tableSubtotalBg: "bg-[#e0f7fa] text-[#005f69] dark:bg-[#005f69]/40 dark:text-teal-300",
        grandTotalBg: "bg-[#005f69] text-white",
        badgeBg: "bg-teal-50 text-teal-800 border-teal-300",
        accentRing: "ring-[#005f69]",
        sealColor: "text-[#005f69] border-[#005f69]",
        invoiceTypeLabel: "TAX INVOICE",
      }
    : {
        name: "non-gst-light-blue",
        headerGradient: "bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]",
        cardHeaderGradient: "bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]",
        primaryBg: "bg-[#0ea5e9]",
        primaryText: "text-[#0284c7]",
        lightBg: "bg-sky-50/80 dark:bg-sky-950/30",
        lightBorder: "border-sky-200/90 dark:border-sky-800/60",
        tableHeaderBg: "bg-[#0284c7] text-white",
        tableSubtotalBg: "bg-[#e0f2fe] text-[#0369a1] dark:bg-sky-950/40 dark:text-sky-300",
        grandTotalBg: "bg-[#0284c7] text-white",
        badgeBg: "bg-sky-50 text-sky-800 border-sky-300",
        accentRing: "ring-[#0ea5e9]",
        sealColor: "text-[#0284c7] border-[#0284c7]",
        invoiceTypeLabel: "INVOICE",
      }

  // 3. Financial Computations
  const gstRate = isGstInvoice ? (invoice.gstRate !== undefined && invoice.gstRate > 0 ? invoice.gstRate : 18) : 0
  const setupCharge = typeof invoice.setupCharge === "number" ? invoice.setupCharge : 0
  const discount = typeof invoice.discount === "number" 
    ? invoice.discount 
    : (invoice.discountsList ? invoice.discountsList.reduce((sum, d) => sum + (d.amount || 0), 0) : 0)
  
  const parsedInvoiced = parseInt((invoice.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0

  const baseNum = invoice.baseAmount !== undefined && invoice.baseAmount > 0
    ? invoice.baseAmount
    : (parsedInvoiced > 0 && isGstInvoice ? Math.round(parsedInvoiced / (1 + gstRate / 100)) : parsedInvoiced)
  
  const taxableBase = Math.max(0, baseNum + setupCharge - discount)

  const gstAmt = isGstInvoice && taxableBase > 0
    ? (invoice.gstAmount !== undefined ? invoice.gstAmount : Math.round(taxableBase * (gstRate / 100)))
    : 0

  const cgstAmt = Math.round(gstAmt / 2)
  const sgstAmt = gstAmt - cgstAmt
  const totalVal = taxableBase + gstAmt

  const rawReceived = parseInt((invoice.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
  const parsedReceived = Math.min(rawReceived, totalVal)
  const parsedDue = invoice.due !== undefined 
    ? Math.min(parseInt(String(invoice.due).replace(/[^0-9]/g, "")) || 0, Math.max(0, totalVal - parsedReceived))
    : Math.max(0, totalVal - parsedReceived)

  const isFullyPaid = invoice.status === "Fully paid" || invoice.status === "Credited" || (parsedDue === 0 && parsedReceived > 0)
  const isPartPaid = invoice.status === "Partially paid" || (parsedReceived > 0 && parsedDue > 0)

  const statusBadgeText = isFullyPaid 
    ? "PAID IN FULL" 
    : isPartPaid 
    ? "PART PAID" 
    : "NOT PAID"

  // Resolve QR Code URL: 100% scanable high-res square modules with margin
  const customPaymentQrUrl = activeSubBranch?.payment_qr_url || activeBranch?.payment_qr_url || activeCompany?.payment_qr_url || paySettings?.qrCodeUrl || (
    resolvedUpiId
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&ecc=M&data=${encodeURIComponent(`upi://pay?pa=${resolvedUpiId}&pn=${encodeURIComponent(resolvedAccountHolder || resolvedBrandName)}&am=${totalVal}&cu=INR`)}`
      : null
  )

  // Generate Official Public Verification / View Online PDF QR Code against Invoice Number (Crisp 300x300 M-level ECC QR)
  const invoiceNumOrId = (invoice as any).invoiceNumber || (invoice as any).invoice_number || invoice.id
  const originUrl = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://saampark.com"
  const publicInvoiceViewUrl = `${originUrl}/public/invoice?id=${encodeURIComponent(invoice.id)}`
  const invoiceVerificationQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&ecc=M&data=${encodeURIComponent(publicInvoiceViewUrl)}`

  // Line items
  const finalRenderedRows = (invoice.items && invoice.items.length > 0)
    ? invoice.items.map((it, idx) => {
        const itemRate = typeof it.rate === "number" ? it.rate : 0
        const itemQty = it.qty > 0 ? it.qty : 1
        const itemCharges = it.charges ? it.charges.reduce((sum, c) => sum + (c.amount || 0), 0) : 0
        const rowBase = (itemRate * itemQty) + itemCharges
        const rowTax = isGstInvoice ? Math.round(rowBase * ((it.gstRate || gstRate) / 100)) : 0
        const rowTotal = isGstInvoice ? (it.totalAmount || (rowBase + rowTax)) : rowBase
        return {
          ...it,
          id: it.id || `row_${idx}`,
          serviceName: it.serviceName || invoice.project || "Enterprise Solutions",
          itemRate,
          itemQty,
          itemCharges,
          rowBase,
          rowTax,
          rowTotal,
        }
      })
    : [
        {
          id: "row_single_service",
          serviceName: invoice.project || "Custom Enterprise Consulting & Development",
          itemRate: baseNum,
          itemQty: 1,
          unit: "Project",
          itemCharges: setupCharge,
          charges: setupCharge > 0 ? [{ id: "c1", name: "Platform / Setup Fee", amount: setupCharge }] : [],
          gstRate: isGstInvoice ? gstRate : 0,
          rowBase: baseNum + setupCharge,
          rowTax: gstAmt,
          rowTotal: totalVal,
        }
      ]

  const totalTableQty = finalRenderedRows.reduce((sum, it) => sum + it.itemQty, 0)
  const totalTableBase = finalRenderedRows.reduce((sum, it) => sum + (it.itemRate * it.itemQty) + it.itemCharges, 0)
  const totalTableGst = isGstInvoice ? finalRenderedRows.reduce((sum, it) => sum + it.rowTax, 0) : 0
  const totalTableGross = isGstInvoice ? finalRenderedRows.reduce((sum, it) => sum + it.rowTotal, 0) : totalTableBase

  const isMultiPage = finalRenderedRows.length > 5
  const page1Items = isMultiPage ? finalRenderedRows.slice(0, 5) : finalRenderedRows
  const page2Items = isMultiPage ? finalRenderedRows.slice(5) : []

  const hasDue = parsedDue > 0
  const hasBankDetails = Boolean(resolvedBankName || resolvedAccountNumber)
  const hasUpiDetails = Boolean(resolvedUpiId || customPaymentQrUrl)
  const hasContactInfo = Boolean(resolvedPhone || resolvedWebsite || resolvedEmail)
  const hasLegalIds = Boolean(resolvedCin || (isGstInvoice && resolvedGstin) || resolvedPan)

  // Full official company name resolution
  const fullRegisteredCompanyName = (
    companyDetails?.name || 
    activeCompany?.name || 
    `${resolvedBrandName} ${resolvedDivisionName}`.trim() || 
    "SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED"
  ).trim()

  const renderTopHeader = (pageNumber?: number) => (
    <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 border-b border-zinc-200 pb-3.5">
      {/* Left: Company Brand & Entity Info with Logo */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Top-Left Logo Card */}
        <motion.div
          drag={interactive}
          dragMomentum={false}
          dragElastic={0}
          whileDrag={{ scale: 1.04, zIndex: 50 }}
          animate={{ x: logoPosition?.x || 0, y: logoPosition?.y || 0 }}
          onDragEnd={(_, info) => {
            if (onLogoPositionChange) {
              onLogoPositionChange({
                x: (logoPosition?.x || 0) + info.offset.x,
                y: (logoPosition?.y || 0) + info.offset.y,
              })
            }
          }}
          className={`relative shrink-0 select-none ${
            interactive ? "cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 rounded-2xl group transition-shadow z-20" : ""
          }`}
        >
          {interactive && (
            <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xs z-30">
              ✥ Drag Logo
            </div>
          )}
          {resolvedLogoUrl ? (
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-2xs shrink-0 border border-zinc-200/80 bg-white flex items-center justify-center p-2.5">
              <img 
                src={resolvedLogoUrl} 
                alt={resolvedBrandName || "Entity Logo"} 
                className="max-w-full max-h-full object-contain pointer-events-none select-none" 
              />
            </div>
          ) : (
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-md shrink-0 border border-teal-900/30 bg-gradient-to-b from-[#004e59] via-[#005c68] to-[#003840] flex flex-col items-center justify-center p-2.5">
              {/* Layered Organic Bottom Wave Curves */}
              <svg className="absolute bottom-0 left-0 right-0 w-full h-14 pointer-events-none" viewBox="0 0 100 45" preserveAspectRatio="none">
                <path d="M0,28 C25,38 65,18 100,24 L100,45 L0,45 Z" fill="#008a99" fillOpacity="0.45" />
                <path d="M0,34 C35,42 70,22 100,12 L100,45 L0,45 Z" fill="#0d9488" fillOpacity="0.7" />
                <path d="M0,40 C30,44 75,28 100,4 L100,45 L0,45 Z" fill="#2dd4bf" fillOpacity="0.85" />
                <path d="M55,45 C75,32 90,18 100,0 L100,45 Z" fill="#a7f3d0" fillOpacity="0.95" />
              </svg>
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center text-white pb-2">
                <Sparkles className="w-7 h-7 mb-1 text-teal-200 drop-shadow-sm" />
                <div className="font-black text-xs tracking-wider uppercase leading-tight font-sans">
                  {resolvedBrandName}
                </div>
                <div className="text-[7.5px] font-bold text-teal-200 tracking-widest uppercase mt-0.5">
                  {resolvedDivisionName || "TECHNOLOGY"}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Title, Full Company Name, Subtitle, ISO Badge & Legal IDs */}
        <div className="space-y-1.5 flex-1 min-w-0 pt-0.5">
          <div>
            {/* Registered Full Corporate Name */}
            <h1 className="text-lg sm:text-xl font-black tracking-tight leading-snug text-zinc-950 uppercase font-sans">
              {fullRegisteredCompanyName}
            </h1>

            {/* Brand & Division Highlight if distinct */}
            {(resolvedBrandName && resolvedBrandName !== fullRegisteredCompanyName) && (
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="text-xs font-black tracking-wider text-zinc-800 uppercase">
                  {resolvedBrandName}
                </span>
                {resolvedDivisionName && (
                  <span className={`text-xs font-black uppercase ${theme.primaryText}`}>
                    • {resolvedDivisionName}
                  </span>
                )}
              </div>
            )}

            {resolvedSubtitle && (
              <h2 className="text-xs font-semibold text-zinc-600 tracking-wider mt-0.5">
                {resolvedSubtitle}
              </h2>
            )}

            {/* ISO 9001:2015 Certified Company Tagline Badge */}
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-300/90 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 text-[8.5px] font-black tracking-wider uppercase shadow-2xs mt-1">
              <Award size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>An ISO 9001:2015 Certified Company</span>
            </div>
          </div>

          {/* Legal IDs: CIN, GSTIN (GST Only), PAN */}
          {hasLegalIds && (
            <p className="text-[10px] font-semibold text-zinc-600 font-mono pt-0.5 flex items-center gap-2 flex-wrap">
              {resolvedCin && (
                <span>CIN: <strong className="text-zinc-800 font-bold">{resolvedCin}</strong></span>
              )}
              {isGstInvoice && resolvedGstin && (
                <span>{resolvedCin ? "| " : ""}GSTIN: <strong className="text-zinc-900 font-black">{resolvedGstin}</strong></span>
              )}
              {resolvedPan && (
                <span>{(resolvedCin || (isGstInvoice && resolvedGstin)) ? "| " : ""}PAN: <strong className="text-zinc-900 font-black">{resolvedPan}</strong></span>
              )}
            </p>
          )}

          {/* Address & Contact Row */}
          {(resolvedAddress || hasContactInfo) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[9.5px] text-zinc-700 pt-1">
              {resolvedAddress ? (
                <div className="flex items-start gap-1.5">
                  <span className={`w-4 h-4 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0 mt-0.5`}>
                    <MapPin size={9} />
                  </span>
                  <div className="leading-snug">
                    <strong className="text-zinc-900 block text-[9.5px]">Registered Office:</strong>
                    <span className="text-zinc-600 text-[9px]">{resolvedAddress}</span>
                  </div>
                </div>
              ) : <div />}

              {hasContactInfo && (
                <div className="space-y-0.5">
                  {resolvedPhone && (
                    <p className="flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
                        <Phone size={8} />
                      </span>
                      <span className="font-mono text-zinc-800 font-semibold text-[9px]">{resolvedPhone}</span>
                    </p>
                  )}
                  {resolvedWebsite && (
                    <p className="flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
                        <Globe size={8} />
                      </span>
                      <span className="text-zinc-700 text-[9px]">{resolvedWebsite}</span>
                    </p>
                  )}
                  {resolvedEmail && (
                    <p className="flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
                        <Mail size={8} />
                      </span>
                      <span className="text-zinc-700 text-[9px]">{resolvedEmail}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3-Tier Hierarchy: Sub-Branch Billing Breakdown (Company -> Branch -> Sub-Branch) */}
          {activeSubBranch ? (
            <div className="mt-2 p-2.5 rounded-xl bg-gradient-to-r from-zinc-50 via-slate-50 to-zinc-100/80 dark:from-zinc-900/70 dark:to-zinc-800/50 border border-zinc-200/90 dark:border-zinc-700/70 text-[9px] text-zinc-700 dark:text-zinc-300 space-y-1.5 shadow-2xs">
              {/* Tier 1: Parent Company */}
              <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-zinc-700/60 pb-1 flex-wrap gap-1">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Building2 size={12} className="text-blue-600 shrink-0" />
                  <span>Corporate Entity: <strong>{fullRegisteredCompanyName}</strong></span>
                </span>
                {resolvedCin && (
                  <span className="font-mono text-[8.5px] text-zinc-500">CIN: {resolvedCin}</span>
                )}
              </div>
              
              {/* Tier 2: Controlling Branch */}
              <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-zinc-700/60 pb-1 flex-wrap gap-1">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Landmark size={12} className="text-indigo-600 shrink-0" />
                  <span>Branch: <strong>{activeBranch?.name || "Main Branch"}</strong></span>
                  {activeBranch?.code && (
                    <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                      Code: {activeBranch.code.toUpperCase()}
                    </span>
                  )}
                </span>
                {activeBranch?.city && (
                  <span className="text-zinc-500 font-medium">({activeBranch.city}{activeBranch.state ? `, ${activeBranch.state}` : ''})</span>
                )}
              </div>

              {/* Tier 3: Operating Partner Sub-Branch */}
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                  <span>Partner Sub-Branch: <strong>{activeSubBranch.name}</strong></span>
                  {activeSubBranch.code && (
                    <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                      Code: {activeSubBranch.code.toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="font-mono text-[8.5px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-extrabold border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <Sparkles size={10} className="text-emerald-600" />
                  <span>{activeSubBranch.revenueSharePct}% Partner Share</span>
                </span>
              </div>
              {/* Sub-Branch Contact/Location details */}
              {(activeSubBranch.address || activeSubBranch.city || (activeSubBranch as any).partnerPhone || (activeSubBranch as any).partnerEmail) && (
                <div className="flex items-center gap-3 flex-wrap text-[8.5px] text-zinc-600 dark:text-zinc-400 pt-0.5 font-medium">
                  {activeSubBranch.address && (
                    <span className="flex items-center gap-1"><MapPin size={10} className="text-emerald-600" />{activeSubBranch.address}</span>
                  )}
                  {(activeSubBranch as any).partnerPhone && (
                    <span className="flex items-center gap-1"><Phone size={10} className="text-emerald-600" />{(activeSubBranch as any).partnerPhone}</span>
                  )}
                  {(activeSubBranch as any).partnerEmail && (
                    <span className="flex items-center gap-1"><Mail size={10} className="text-emerald-600" />{(activeSubBranch as any).partnerEmail}</span>
                  )}
                </div>
              )}
            </div>
          ) : activeBranch ? (
            /* Standard Branch Section (without Sub-Branch) */
            <div className="mt-1.5 p-2 rounded-xl bg-gradient-to-r from-zinc-50 to-zinc-100/70 dark:from-zinc-900/60 dark:to-zinc-800/40 border border-zinc-200/90 dark:border-zinc-700/60 text-[9px] text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Building2 size={12} className="text-blue-600 shrink-0" />
                  <span>Branch:</span>
                  <span className="text-blue-700 dark:text-blue-400 font-black">{activeBranch.name}</span>
                </span>
                {activeBranch.code && (
                  <span className="font-mono text-[8.5px] px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold border border-blue-200/60 dark:border-blue-800/60">
                    Branch Code: {activeBranch.code.toUpperCase()}
                  </span>
                )}
              </div>
              {(activeBranch.address || activeBranch.city || activeBranch.phone || activeBranch.email) && (
                <div className="flex items-center gap-3 flex-wrap text-[8.5px] text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
                  {activeBranch.address && (
                    <span className="flex items-center gap-1"><MapPin size={10} className="text-blue-600" />{activeBranch.address}</span>
                  )}
                  {activeBranch.city && (
                    <span>({activeBranch.city})</span>
                  )}
                  {activeBranch.phone && (
                    <span className="flex items-center gap-1"><Phone size={10} className="text-blue-600" />{activeBranch.phone}</span>
                  )}
                  {activeBranch.email && (
                    <span className="flex items-center gap-1"><Mail size={10} className="text-blue-600" />{activeBranch.email}</span>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Right: Header Card with Status Badge & Dates */}
      <div className={`w-full sm:w-56 rounded-2xl ${theme.cardHeaderGradient} text-white p-3 shadow-md shrink-0 flex flex-col self-start space-y-2.5`}>
        <div className="flex items-center justify-between border-b border-white/20 pb-2">
          <span className="font-black text-xs tracking-wider uppercase">
            {theme.invoiceTypeLabel} {pageNumber ? `(P.${pageNumber}/2)` : ''}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
            isFullyPaid 
              ? "bg-white text-emerald-800" 
              : isPartPaid 
              ? "bg-white text-amber-800" 
              : "bg-white text-rose-800"
          }`}>
            {statusBadgeText}
          </span>
        </div>

        <div className="space-y-1.5 text-[10px]">
          <div>
            <span className="text-white/80 text-[8.5px] uppercase tracking-wider font-semibold block">INVOICE NO:</span>
            <strong className="font-mono text-white text-xs font-bold break-all leading-tight block">
              {invoiceNumOrId}
            </strong>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-white/80 text-[8.5px] uppercase font-bold tracking-wider shrink-0 w-12">DATE:</span>
            <strong className="text-white font-mono text-[9.5px]">
              {formatInvoiceDate(invoice.billDate)}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-[8.5px] uppercase font-bold tracking-wider shrink-0 w-12">DUE:</span>
            <strong className="text-white font-mono text-[9.5px]">
              {hasDue ? formatInvoiceDate(invoice.dueDate) : "-"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  )

  const renderInfoCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
      {/* Box 1: BILL TO (6 cols) */}
      <div className={`sm:col-span-6 p-3 rounded-2xl ${theme.lightBg} border ${theme.lightBorder} space-y-1 shadow-2xs`}>
        <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-zinc-700">
          <span className={`w-4 h-4 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
            <UserCheck size={9} />
          </span>
          <span>BILL TO</span>
        </div>
        <p className="font-black text-xs text-zinc-900 leading-tight">{invoice.client}</p>
        <p className="text-[10px] text-zinc-600 leading-tight">
          <strong>Address:</strong> {clientDetails?.address || (invoice.clientEmail ? `${clientDetails?.address || 'Corporate Center'}` : 'Head Office')}
        </p>
        <p className="text-[10px] text-zinc-600">
          <strong>Location:</strong> {clientDetails?.city || clientDetails?.state || (activeCompany?.city ? `${activeCompany.city}, ${activeCompany?.state || ''}` : activeCompany?.state || 'West Bengal')}
        </p>
        {isGstInvoice && clientDetails?.gstNumber && (
          <p className="text-[9.5px] font-mono font-bold text-zinc-800">
            <strong>Client GSTIN:</strong> {clientDetails.gstNumber}
          </p>
        )}
      </div>

      {/* Box 2: SERVICE / ENGAGEMENT DETAILS (6 cols) with embedded Official Verification QR beside it */}
      <div className={`sm:col-span-6 p-3 rounded-2xl ${theme.lightBg} border ${theme.lightBorder} shadow-2xs flex items-center justify-between gap-2.5`}>
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-zinc-700">
            <span className={`w-4 h-4 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
              <Briefcase size={9} />
            </span>
            <span>PROJECT / SERVICE SCOPE</span>
          </div>
          <p className="font-bold text-xs text-zinc-900 truncate">{invoice.project || "Enterprise Solutions"}</p>
          <p className="text-[10px] text-zinc-600 font-mono">
            <strong>Billing Scheme:</strong> {isGstInvoice ? 'GST Tax Invoice' : 'Non-GST Direct Invoice'}
          </p>
          <p className="text-[10px] text-zinc-600 truncate">
            <strong>Company:</strong> {fullRegisteredCompanyName}
          </p>
          {(activeBranch || activeSubBranch) && (
            <p className="text-[10px] text-zinc-700 font-semibold truncate">
              <strong>Branch:</strong> {activeSubBranch ? activeSubBranch.name : activeBranch?.name} {((activeBranch?.code || activeSubBranch?.code)) ? `(Code: ${(activeBranch?.code || activeSubBranch?.code || '').toUpperCase()})` : ''}
            </p>
          )}
        </div>

        {/* Official Scan & Verify QR Code beside Project Scope - Clean Square without circular background */}
        <div className="shrink-0 text-center flex flex-col items-center bg-white p-1.5 border border-zinc-300 shadow-2xs rounded-none">
          <a 
            href={publicInvoiceViewUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group block"
            title="Scan or click to view public invoice online"
          >
            <img 
              src={invoiceVerificationQrUrl} 
              alt={`QR ${invoiceNumOrId}`} 
              className="w-14 h-14 bg-white object-contain group-hover:scale-105 transition-transform" 
              style={{ imageRendering: 'pixelated' }}
            />
          </a>
          <span className="text-[7.5px] font-mono font-bold text-zinc-700 mt-0.5 block uppercase tracking-tight">
            Scan & Verify
          </span>
        </div>
      </div>
    </div>
  )

  const renderTable = (itemsToRender: any[], startIndex: number, showSubtotal: boolean) => (
    <div className="rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs mt-1">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={`${theme.tableHeaderBg} text-[10px] uppercase font-black tracking-wider`}>
            <th className="py-2.5 px-3 w-10 text-center">#</th>
            <th className="py-2.5 px-3">Service / Product Description</th>
            <th className="py-2.5 px-2.5 w-14 text-center">Qty</th>
            <th className="py-2.5 px-2.5 w-16 text-center">Unit</th>
            <th className="py-2.5 px-3 w-28 text-right">Unit Rate</th>
            <th className="py-2.5 px-3 w-24 text-right">{isGstInvoice ? "GST Rate / Amt" : "Taxes"}</th>
            <th className="py-2.5 px-3 w-28 text-right">Amount (INR)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 text-[11px] text-zinc-800 bg-white">
          {itemsToRender.map((item, idx) => (
            <tr key={item.id || idx} className="hover:bg-zinc-50/80 transition-colors">
              <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-500">
                {startIndex + idx + 1}
              </td>
              <td className="py-2.5 px-3 font-semibold text-zinc-900">
                <div>{item.serviceName}</div>
                {item.itemCharges > 0 && (
                  <div className="text-[9.5px] text-zinc-500 font-normal">
                    + Platform Setup: ₹{item.itemCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                )}
              </td>
              <td className="py-2.5 px-2.5 text-center font-mono">{item.itemQty}</td>
              <td className="py-2.5 px-2.5 text-center text-zinc-500">{item.unit || "Unit"}</td>
              <td className="py-2.5 px-3 text-right font-mono">
                ₹{item.itemRate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-zinc-600">
                {isGstInvoice ? (
                  <div>
                    <span className="font-bold">{item.gstRate || gstRate}%</span>
                    <span className="text-[9.5px] text-zinc-500 block">
                      (₹{item.rowTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                    </span>
                  </div>
                ) : (
                  <span className="font-mono text-zinc-400">₹0.00</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-mono font-black text-zinc-900">
                ₹{item.rowTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
        {showSubtotal && (
          <tfoot>
            <tr className={`${theme.tableSubtotalBg} font-bold text-[10.5px] border-t border-zinc-200`}>
              <td colSpan={2} className="py-2 px-3 uppercase tracking-wider">
                SUBTOTAL SERVICES & BASE AMOUNT
              </td>
              <td className="py-2 px-2.5 text-center font-mono">{totalTableQty}</td>
              <td className="py-2 px-2.5 text-center">Items</td>
              <td className="py-2 px-3 text-right font-mono">
                ₹{totalTableBase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right font-mono">
                ₹{totalTableGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right font-mono font-black">
                ₹{totalTableGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )

  const renderFinancialsAndFooter = () => (
    <>
      {/* TOTAL AMOUNT IN WORDS + TERMS & CONDITIONS (LEFT) & FINANCIAL BREAKDOWN (RIGHT) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-1">
        {/* Left 6 Columns: Amount in Words & Terms */}
        <div className="sm:col-span-6 space-y-2">
          <div className={`p-2.5 rounded-xl ${theme.lightBg} border ${theme.lightBorder} space-y-0.5 shadow-2xs`}>
            <span className="font-black text-[9.5px] uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
              <FileText size={12} className={theme.primaryText} />
              <span>TOTAL AMOUNT IN WORDS</span>
            </span>
            <p className="font-bold text-zinc-900 italic text-[10.5px] leading-tight">
              {numberToIndianWords(totalVal)}
            </p>
          </div>

          {/* Terms & Conditions */}
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1 shadow-2xs">
            <span className="font-black text-[10px] uppercase tracking-wider text-zinc-700 block border-b border-zinc-200 pb-1">
              TERMS & CONDITIONS
            </span>
            <ul className="space-y-1 text-[9px] text-zinc-700 font-medium leading-tight whitespace-pre-line">
              {(activeCompany?.terms_conditions || "1. All payments must be made in favor of the company indicated above.\n2. Please quote Invoice Number in all remittance references.\n3. Goods / Services once rendered are subject to standard enterprise terms.\n4. Interest @ 18% p.a. applies on unpaid balances beyond the due date.")
                .split("\n")
                .filter(Boolean)
                .map((line, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Check size={11} className={`${theme.primaryText} font-bold shrink-0 mt-0.5`} />
                    <span>{line}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Right 6 Columns: Financial Computation Matrix */}
        <div className="sm:col-span-6 space-y-1 text-[10.5px]">
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-0.5 text-zinc-700 shadow-2xs">
            <div className="flex justify-between py-0.5">
              <span>Total Services Value</span>
              <span className="font-mono font-semibold">₹{baseNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            {setupCharge > 0 && (
              <div className="flex justify-between py-0.5">
                <span>Platform / Setup Charge</span>
                <span className="font-mono">₹{setupCharge.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {invoice.discountsList && invoice.discountsList.length > 0 ? (
              invoice.discountsList.map((d: any) => (
                <div key={d.id} className="flex justify-between py-0.5 text-zinc-500">
                  <span>Less: {d.name}</span>
                  <span className="font-mono">(-) ₹{(d.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              ))
            ) : discount > 0 ? (
              <div className="flex justify-between py-0.5 text-zinc-500">
                <span>Less: Promotional Discount</span>
                <span className="font-mono">(-) ₹{discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            ) : null}

            <div className="flex justify-between py-1 border-t border-zinc-200 font-bold text-zinc-900">
              <span>Taxable Base Amount</span>
              <span className="font-mono">₹{taxableBase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            {isGstInvoice && (
              <>
                <div className="flex justify-between py-0.5 text-zinc-600">
                  <span>CGST ({(gstRate / 2).toFixed(1)}%)</span>
                  <span className="font-mono">₹{cgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-0.5 text-zinc-600">
                  <span>SGST ({(gstRate / 2).toFixed(1)}%)</span>
                  <span className="font-mono">₹{sgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}

            <div className={`flex justify-between p-2 rounded-lg ${theme.grandTotalBg} font-black text-xs tracking-wide my-1 shadow-xs`}>
              <span>GRAND TOTAL (NET PAYABLE)</span>
              <span className="font-mono text-sm">₹{totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between py-0.5 text-emerald-700 font-bold">
              <span>Received Amount</span>
              <span className="font-mono">₹{parsedReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between py-1 border-t border-zinc-200 font-black text-[11px] text-rose-600">
              <span>Current Balance (Total Due)</span>
              <span className="font-mono">₹{parsedDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between pt-0.5 text-[9.5px] text-zinc-500">
              <span>Next Due Date</span>
              <span className="font-mono font-bold text-zinc-800">{hasDue ? formatInvoiceDate(invoice.dueDate) : "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT & BANK TRANSFER DETAILS */}
      {(hasUpiDetails || hasBankDetails) && (
        <div className={`grid grid-cols-1 ${hasUpiDetails && hasBankDetails ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-3 pt-1`}>
          {hasUpiDetails && (
            <div className={`p-2.5 rounded-xl ${theme.lightBg} border ${theme.lightBorder} space-y-1 shadow-2xs`}>
              <div className="flex items-center justify-between">
                <span className="font-black text-[10px] uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                  <QrCode size={12} className={theme.primaryText} />
                  <span>UPI & DIGITAL PAYMENT</span>
                </span>
                <span className="text-[8.5px] font-bold text-emerald-700">Instant Settlement</span>
              </div>

              <div className="flex items-center gap-2.5">
                {customPaymentQrUrl && (
                  <div className="shrink-0 text-center space-y-0.5">
                    <img 
                      src={customPaymentQrUrl} 
                      alt="UPI Payment QR Code" 
                      className="w-16 h-16 bg-white p-1 border border-zinc-300 shadow-xs object-contain" 
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <span className="text-[7px] font-black text-zinc-600 block uppercase">SCAN TO PAY</span>
                  </div>
                )}
                
                <div className="space-y-0.5 text-[9px] flex-1 min-w-0">
                  {resolvedUpiId && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600">UPI ID:</span>
                      <strong className="font-mono text-zinc-900 font-bold truncate">{resolvedUpiId}</strong>
                    </div>
                  )}
                  {resolvedAccountHolder && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600">A/C Name:</span>
                      <strong className="text-zinc-900 font-bold truncate max-w-[130px]">{resolvedAccountHolder}</strong>
                    </div>
                  )}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5 font-bold text-zinc-600 text-[8px]">
                    <span className="px-1.5 py-0.2 rounded bg-white border border-zinc-200">GPay</span>
                    <span className="px-1.5 py-0.2 rounded bg-white border border-zinc-200">PhonePe</span>
                    <span className="px-1.5 py-0.2 rounded bg-white border border-zinc-200">Paytm</span>
                    <span className="px-1.5 py-0.2 rounded bg-white border border-zinc-200">BHIM UPI</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasBankDetails && (
            <div className={`p-2.5 rounded-xl ${theme.lightBg} border ${theme.lightBorder} space-y-0.5 shadow-2xs`}>
              <span className="font-black text-[10px] uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                <Landmark size={12} className={theme.primaryText} />
                <span>BANK DETAILS</span>
              </span>
              <div className="space-y-0.5 text-[9px] text-zinc-700">
                {resolvedBankName && (
                  <div className="flex justify-between">
                    <span>Bank Name:</span>
                    <strong className="text-zinc-900 font-bold">{resolvedBankName}</strong>
                  </div>
                )}
                {resolvedAccountNumber && (
                  <div className="flex justify-between font-mono">
                    <span>A/C No.:</span>
                    <strong className="text-zinc-900 font-bold">{resolvedAccountNumber}</strong>
                  </div>
                )}
                {resolvedIfscCode && (
                  <div className="flex justify-between font-mono">
                    <span>IFSC Code:</span>
                    <strong className="text-zinc-900 font-bold">{resolvedIfscCode}</strong>
                  </div>
                )}
                {resolvedBankBranch && (
                  <div className="flex justify-between">
                    <span>Branch:</span>
                    <strong className="text-zinc-900">{resolvedBankBranch}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SIGNATURES & OFFICIAL SEAL ROW */}
      <div className="flex flex-row justify-between items-center gap-3 pt-2 border-t border-zinc-200">
        <div className="text-center space-y-0.5">
          <div className="h-14 flex items-end justify-center">
            {/* Blank signature space */}
          </div>
          <div className="w-36 border-t border-zinc-400 pt-0.5">
            <p className="text-[8px] font-black uppercase text-zinc-600">CUSTOMER SIGNATURE</p>
          </div>
        </div>

        <motion.div
          drag={interactive}
          dragMomentum={false}
          dragElastic={0}
          whileDrag={{ scale: 1.04, zIndex: 50 }}
          animate={{ x: signaturePosition?.x || 0, y: signaturePosition?.y || 0 }}
          onDragEnd={(_, info) => {
            if (onSignaturePositionChange) {
              onSignaturePositionChange({
                x: (signaturePosition?.x || 0) + info.offset.x,
                y: (signaturePosition?.y || 0) + info.offset.y,
              })
            }
          }}
          className={`flex items-center gap-3 relative select-none ${
            interactive ? "cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 rounded-xl group transition-shadow p-1 z-20" : ""
          }`}
        >
          {interactive && (
            <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xs z-30">
              ✥ Drag Signature
            </div>
          )}
          <div className="text-center space-y-0.5">
            <div className="h-14 flex items-end justify-center">
              {resolvedSignatureUrl ? (
                <img 
                  src={resolvedSignatureUrl} 
                  alt="Authorized Signature / Stamp" 
                  className="max-h-14 max-w-[150px] object-contain drop-shadow-xs pointer-events-none select-none" 
                />
              ) : null}
            </div>
            <div className="w-36 border-t border-zinc-400 pt-0.5">
              {resolvedSignatoryName ? (
                <p className="text-[8px] font-black uppercase text-zinc-700 font-bold">
                  {resolvedSignatoryName}
                </p>
              ) : null}
              {resolvedSignatoryDesignation ? (
                <p className="text-[7.5px] text-zinc-500 font-medium">
                  {resolvedSignatoryDesignation}
                </p>
              ) : null}
            </div>
          </div>

          {resolvedStampUrl ? (
            <div className="w-14 h-14 flex items-center justify-center p-0.5 shadow-2xs shrink-0 select-none">
              <img src={resolvedStampUrl} alt="Official Seal" className="max-h-14 max-w-14 object-contain pointer-events-none select-none" />
            </div>
          ) : null}
        </motion.div>
      </div>

      {/* BOTTOM BANNER */}
      <div className={`rounded-xl ${theme.headerGradient} text-white p-1.5 text-[8.5px] font-medium flex flex-wrap items-center justify-between gap-1 shadow-xs`}>
        <p className="flex items-center gap-1">
          <MapPin size={10} />
          <span>{resolvedAddress || fullRegisteredCompanyName}</span>
        </p>
        <p>
          {resolvedEmail ? `Support: ${resolvedEmail}` : ""} {resolvedPhone ? `| Tel: ${resolvedPhone}` : ""}
        </p>
      </div>
    </>
  )

  return (
    <div id="printable-invoice" className="bg-white text-zinc-900 font-sans p-4 sm:p-5 text-xs shadow-xl border border-zinc-200 rounded-2xl w-full max-w-[840px] mx-auto print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none relative overflow-hidden">
      {/* Draggable Custom Text Stamps / Badges Overlay */}
      {customStamps && customStamps.map(stamp => (
        <motion.div
          key={stamp.id}
          drag={interactive}
          dragMomentum={false}
          dragElastic={0}
          whileDrag={{ scale: 1.05, zIndex: 60 }}
          animate={{ x: stamp.x, y: stamp.y }}
          onDragEnd={(_, info) => {
            if (onCustomStampMove) {
              onCustomStampMove(stamp.id, {
                x: stamp.x + info.offset.x,
                y: stamp.y + info.offset.y,
              })
            }
          }}
          className={`absolute z-30 px-3 py-1 rounded-lg border-2 font-black uppercase tracking-wider select-none shadow-md flex items-center gap-1.5 ${
            interactive ? "cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-emerald-400 group" : ""
          }`}
          style={{
            borderColor: stamp.color || "#0d9488",
            color: stamp.color || "#0d9488",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            fontSize: `${stamp.fontSize || 11}px`,
            left: "40%",
            top: "20%",
          }}
        >
          {interactive && (
            <span className="text-[9px] opacity-60 pointer-events-none">✥</span>
          )}
          <span>{stamp.text}</span>
          {interactive && onRemoveCustomStamp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveCustomStamp(stamp.id)
              }}
              className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] hover:bg-rose-700 cursor-pointer ml-1"
              title="Remove Stamp"
            >
              ✕
            </button>
          )}
        </motion.div>
      ))}

      {!isMultiPage ? (
        <div className="space-y-2.5">
          {renderTopHeader()}
          {renderInfoCards()}
          {renderTable(page1Items, 0, true)}
          {renderFinancialsAndFooter()}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2.5 page-break-after">
            {renderTopHeader(1)}
            {renderInfoCards()}
            {renderTable(page1Items, 0, false)}
          </div>
          <div className="space-y-2.5 pt-4">
            {renderTopHeader(2)}
            {renderTable(page2Items, 5, true)}
            {renderFinancialsAndFooter()}
          </div>
        </div>
      )}
    </div>
  )
}
