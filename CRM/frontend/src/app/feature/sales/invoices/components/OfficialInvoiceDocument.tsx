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
  color?: string
  bgStyle?: "stamp" | "badge" | "clean" | "watermark"
  fontSize?: number
  isBold?: boolean
  isItalic?: boolean
  rotation?: number
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
  stampPosition?: { x: number; y: number }
  onStampPositionChange?: (pos: { x: number; y: number }) => void
  signaturePosition?: { x: number; y: number }
  onSignaturePositionChange?: (pos: { x: number; y: number }) => void
  customStamps?: CustomTextStamp[]
  onCustomStampMove?: (id: string, pos: { x: number; y: number }) => void
  onCustomStampUpdate?: (id: string, updates: Partial<CustomTextStamp>) => void
  onRemoveCustomStamp?: (id: string) => void
  onAddCustomStamp?: (stamp?: Partial<CustomTextStamp>) => void
  onFieldChange?: (field: string, value: string) => void
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

export function EditableText({
  value,
  onChange,
  className = "",
  placeholder = "",
  as = "span",
  interactive = false,
  fieldKey,
}: {
  value?: string | null
  onChange?: (val: string) => void
  className?: string
  placeholder?: string
  as?: any
  interactive?: boolean
  fieldKey?: string
}) {
  const displayVal = value ?? ""
  if (!interactive) {
    const Tag = as
    return <Tag className={className}>{displayVal || placeholder}</Tag>
  }

  const Tag = as
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      className={`${className} outline-none transition-all rounded px-0.5 -mx-0.5 hover:bg-blue-100/70 hover:ring-1 hover:ring-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:shadow-xs cursor-text inline-block min-w-[20px]`}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const text = e.currentTarget.innerText.trim()
        if (onChange) onChange(text)
      }}
      title="Click or touch to edit this text directly"
    >
      {displayVal || placeholder}
    </Tag>
  )
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
  stampPosition = { x: 0, y: 0 },
  onStampPositionChange,
  signaturePosition = { x: 0, y: 0 },
  onSignaturePositionChange,
  customStamps = [],
  onCustomStampMove,
  onCustomStampUpdate,
  onRemoveCustomStamp,
  onAddCustomStamp,
  onFieldChange,
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

  // Resolve Parent Branch for Sub-Branch
  const resolvedParentBranch: Branch | null = React.useMemo(() => {
    if (propActiveBranch) return propActiveBranch
    if (activeBranch && !propActiveSubBranch) return activeBranch
    if (!activeSubBranch) return null
    const parentId = String(activeSubBranch.parentBranchId || (activeSubBranch as any).branch_id || (activeSubBranch as any).branchId || invoice.branchId || (invoice as any).branch_id || "").toLowerCase().trim()
    if (!parentId) return activeBranch || null
    return (branches || []).find(b => {
      const bId = String(b.id || "").toLowerCase().trim()
      const bCode = String(b.code || "").toLowerCase().trim()
      return bId === parentId || bCode === parentId
    }) || activeBranch || null
  }, [propActiveBranch, activeBranch, propActiveSubBranch, activeSubBranch, invoice.branchId, (invoice as any).branch_id, branches])

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

  // Full official company name resolution
  const fullRegisteredCompanyName = (
    companyDetails?.name || 
    activeCompany?.name || 
    `${resolvedBrandName} ${resolvedDivisionName}`.trim() || 
    "SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED"
  ).trim()

  // Default fallback values if company / branch hasn't configured bank details yet
  const defaultBankFallback = {
    bankName: "ICICI Bank Ltd",
    accountHolder: fullRegisteredCompanyName || "SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED",
    accountNumber: "123405009876",
    ifscCode: "ICIC0001234",
    bankBranch: "Sector V, Kolkata",
    upiId: "saampark@icici",
  }

  // Parent Company baseline values
  const companyGstUpi = (companyDetails?.gst_upi_id || activeCompany?.gst_upi_id || (companyDetails as any)?.upi_id || activeCompany?.upi_id || paySettings?.upiId || "")?.trim()
  const companyNonGstUpi = (companyDetails?.nongst_upi_id || activeCompany?.nongst_upi_id || (companyDetails as any)?.upi_id || activeCompany?.upi_id || paySettings?.upiId || "")?.trim()
  const companyUpi = isGstInvoice ? companyGstUpi : companyNonGstUpi

  const companyGstHolder = (companyDetails?.gst_account_holder || activeCompany?.gst_account_holder || (companyDetails as any)?.account_holder || activeCompany?.account_holder || paySettings?.accountHolderName || fullRegisteredCompanyName || "")?.trim()
  const companyNonGstHolder = (companyDetails?.nongst_account_holder || activeCompany?.nongst_account_holder || (companyDetails as any)?.account_holder || activeCompany?.account_holder || paySettings?.accountHolderName || fullRegisteredCompanyName || "")?.trim()
  const companyHolder = isGstInvoice ? companyGstHolder : companyNonGstHolder

  const companyGstBank = (companyDetails?.gst_bank_name || activeCompany?.gst_bank_name || (companyDetails as any)?.bank_name || activeCompany?.bank_name || paySettings?.bankName || "")?.trim()
  const companyNonGstBank = (companyDetails?.nongst_bank_name || activeCompany?.nongst_bank_name || (companyDetails as any)?.bank_name || activeCompany?.bank_name || paySettings?.bankName || "")?.trim()
  const companyBank = isGstInvoice ? companyGstBank : companyNonGstBank

  const companyGstAccNum = (companyDetails?.gst_account_number || activeCompany?.gst_account_number || (companyDetails as any)?.account_number || activeCompany?.account_number || paySettings?.accountNumber || "")?.trim()
  const companyNonGstAccNum = (companyDetails?.nongst_account_number || activeCompany?.nongst_account_number || (companyDetails as any)?.account_number || activeCompany?.account_number || paySettings?.accountNumber || "")?.trim()
  const companyAccNum = isGstInvoice ? companyGstAccNum : companyNonGstAccNum

  const companyGstIfsc = (companyDetails?.gst_ifsc_code || activeCompany?.gst_ifsc_code || (companyDetails as any)?.ifsc_code || activeCompany?.ifsc_code || paySettings?.ifscCode || "")?.trim()
  const companyNonGstIfsc = (companyDetails?.nongst_ifsc_code || activeCompany?.nongst_ifsc_code || (companyDetails as any)?.ifsc_code || activeCompany?.ifsc_code || paySettings?.ifscCode || "")?.trim()
  const companyIfsc = isGstInvoice ? companyGstIfsc : companyNonGstIfsc

  const companyGstBranch = (companyDetails?.gst_bank_branch || activeCompany?.gst_bank_branch || (companyDetails as any)?.bank_branch || activeCompany?.bank_branch || paySettings?.branch || "")?.trim()
  const companyNonGstBranch = (companyDetails?.nongst_bank_branch || activeCompany?.nongst_bank_branch || (companyDetails as any)?.bank_branch || activeCompany?.bank_branch || paySettings?.branch || "")?.trim()
  const companyBranch = isGstInvoice ? companyGstBranch : companyNonGstBranch

  // Bank & UPI details resolved specifically for issuing entity with strict company fallback
  const resolvedUpiId = (
    overrideBankDetails?.upiId ||
    (isSubBranchIssued 
      ? (isGstInvoice ? (activeSubBranch?.gst_upi_id || activeSubBranch?.upi_id || activeBranch?.gst_upi_id || activeBranch?.upi_id || companyUpi) : (activeSubBranch?.nongst_upi_id || activeSubBranch?.upi_id || activeBranch?.nongst_upi_id || activeBranch?.upi_id || companyUpi))
      : isBranchIssued 
      ? (isGstInvoice ? (activeBranch?.gst_upi_id || activeBranch?.upi_id || companyUpi) : (activeBranch?.nongst_upi_id || activeBranch?.upi_id || companyUpi))
      : companyUpi
    )
  )?.trim() || activeCompany?.upi_id || defaultBankFallback.upiId

  const resolvedAccountHolder = (
    overrideBankDetails?.accountHolder ||
    (isSubBranchIssued 
      ? (isGstInvoice ? (activeSubBranch?.gst_account_holder || activeSubBranch?.account_holder || activeBranch?.gst_account_holder || activeBranch?.account_holder || companyHolder) : (activeSubBranch?.nongst_account_holder || activeSubBranch?.account_holder || activeBranch?.nongst_account_holder || activeBranch?.account_holder || companyHolder))
      : isBranchIssued 
      ? (isGstInvoice ? (activeBranch?.gst_account_holder || activeBranch?.account_holder || companyHolder) : (activeBranch?.nongst_account_holder || activeBranch?.account_holder || companyHolder))
      : companyHolder
    )
  )?.trim() || fullRegisteredCompanyName || defaultBankFallback.accountHolder

  const resolvedBankName = (
    overrideBankDetails?.bankName ||
    (isSubBranchIssued 
      ? (isGstInvoice ? (activeSubBranch?.gst_bank_name || activeSubBranch?.bank_name || activeBranch?.gst_bank_name || activeBranch?.bank_name || companyBank) : (activeSubBranch?.nongst_bank_name || activeSubBranch?.bank_name || activeBranch?.nongst_bank_name || activeBranch?.bank_name || companyBank))
      : isBranchIssued 
      ? (isGstInvoice ? (activeBranch?.gst_bank_name || activeBranch?.bank_name || companyBank) : (activeBranch?.nongst_bank_name || activeBranch?.bank_name || companyBank))
      : companyBank
    )
  )?.trim() || activeCompany?.bank_name || defaultBankFallback.bankName

  const resolvedAccountNumber = (
    overrideBankDetails?.accountNumber ||
    (isSubBranchIssued 
      ? (isGstInvoice ? (activeSubBranch?.gst_account_number || activeSubBranch?.account_number || activeBranch?.gst_account_number || activeBranch?.account_number || companyAccNum) : (activeSubBranch?.nongst_account_number || activeSubBranch?.account_number || activeBranch?.nongst_account_number || activeBranch?.account_number || companyAccNum))
      : isBranchIssued 
      ? (isGstInvoice ? (activeBranch?.gst_account_number || activeBranch?.account_number || companyAccNum) : (activeBranch?.nongst_account_number || activeBranch?.account_number || companyAccNum))
      : companyAccNum
    )
  )?.trim() || activeCompany?.account_number || defaultBankFallback.accountNumber

  const resolvedIfscCode = (
    overrideBankDetails?.ifscCode ||
    (isSubBranchIssued 
      ? (isGstInvoice ? (activeSubBranch?.gst_ifsc_code || activeSubBranch?.ifsc_code || activeBranch?.gst_ifsc_code || activeBranch?.ifsc_code || companyIfsc) : (activeSubBranch?.nongst_ifsc_code || activeSubBranch?.ifsc_code || activeBranch?.nongst_ifsc_code || activeBranch?.ifsc_code || companyIfsc))
      : isBranchIssued 
      ? (isGstInvoice ? (activeBranch?.gst_ifsc_code || activeBranch?.ifsc_code || companyIfsc) : (activeBranch?.nongst_ifsc_code || activeBranch?.ifsc_code || companyIfsc))
      : companyIfsc
    )
  )?.trim() || activeCompany?.ifsc_code || defaultBankFallback.ifscCode

  const resolvedBankBranch = (
    overrideBankDetails?.bankBranch ||
    (isSubBranchIssued 
      ? (isGstInvoice ? (activeSubBranch?.gst_bank_branch || activeSubBranch?.bank_branch || activeBranch?.gst_bank_branch || activeBranch?.bank_branch || companyBranch) : (activeSubBranch?.nongst_bank_branch || activeSubBranch?.bank_branch || activeBranch?.nongst_bank_branch || activeBranch?.bank_branch || companyBranch))
      : isBranchIssued 
      ? (isGstInvoice ? (activeBranch?.gst_bank_branch || activeBranch?.bank_branch || companyBranch) : (activeBranch?.nongst_bank_branch || activeBranch?.bank_branch || companyBranch))
      : companyBranch
    )
  )?.trim() || activeCompany?.bank_branch || defaultBankFallback.bankBranch

  // Signatory & Stamp URLs (Strict to issuing entity with seamless cascade to parent Company)
  const companySignatureFallback = (
    (companyDetails as any)?.signature_image_url ||
    (companyDetails as any)?.signatureImageUrl ||
    (companyDetails as any)?.signature_url ||
    activeCompany?.signature_image_url ||
    (activeCompany as any)?.signatureImageUrl ||
    (activeCompany as any)?.signature_url ||
    ""
  )?.trim()

  const companyStampFallback = (
    (companyDetails as any)?.stamp_image_url ||
    (companyDetails as any)?.stampImageUrl ||
    (companyDetails as any)?.stamp_url ||
    activeCompany?.stamp_image_url ||
    (activeCompany as any)?.stampImageUrl ||
    (activeCompany as any)?.stamp_url ||
    ""
  )?.trim()

  const resolvedSignatureUrl = overrideSignatureUrl || (
    isSubBranchIssued 
      ? (activeSubBranch?.signature_image_url?.trim() || activeBranch?.signature_image_url?.trim() || companySignatureFallback)
      : isBranchIssued 
      ? (activeBranch?.signature_image_url?.trim() || companySignatureFallback)
      : companySignatureFallback
  ) || ""

  const resolvedStampUrl = overrideStampUrl || (
    isSubBranchIssued 
      ? (activeSubBranch?.stamp_image_url?.trim() || activeBranch?.stamp_image_url?.trim() || companyStampFallback)
      : isBranchIssued 
      ? (activeBranch?.stamp_image_url?.trim() || companyStampFallback)
      : companyStampFallback
  ) || ""

  const resolvedSignatoryName = (isSubBranchIssued 
    ? (activeSubBranch?.signatory_name || (activeSubBranch as any)?.partner_name || (activeSubBranch as any)?.partnerName || activeBranch?.signatory_name || (companyDetails as any)?.signatory_name || activeCompany?.signatory_name)
    : isBranchIssued 
    ? (activeBranch?.signatory_name || activeBranch?.managerName || (activeBranch as any)?.manager_name || (companyDetails as any)?.signatory_name || activeCompany?.signatory_name)
    : ((companyDetails as any)?.signatory_name || activeCompany?.signatory_name))?.trim() || "Authorized Signatory"

  const resolvedSignatoryDesignation = (isSubBranchIssued 
    ? (activeSubBranch?.signatory_designation || `${(activeSubBranch as any)?.partner_type || 'Franchise'} Partner` || activeBranch?.signatory_designation || (companyDetails as any)?.signatory_designation || activeCompany?.signatory_designation)
    : isBranchIssued 
    ? (activeBranch?.signatory_designation || "Branch Manager" || (companyDetails as any)?.signatory_designation || activeCompany?.signatory_designation)
    : ((companyDetails as any)?.signatory_designation || activeCompany?.signatory_designation))?.trim() || "Managing Director"

  // ISO / Quality Certification Badge text (Editable)
  const resolvedIsoCertification = (
    (companyDetails as any)?.iso_certification !== undefined
      ? (companyDetails as any)?.iso_certification
      : isSubBranchIssued
      ? (activeSubBranch as any)?.iso_certification
      : isBranchIssued
      ? (activeBranch as any)?.iso_certification
      : (activeCompany as any)?.iso_certification
  ) ?? "An ISO 9001:2015 Certified Company"

  // Terms & Conditions / Notes (Strictly inherited from company settings with optional invoice override)
  const resolvedTermsAndNotes = (
    (invoice as any)?.terms ||
    (invoice as any)?.notes ||
    companyDetails?.invoice_notes ||
    activeCompany?.invoice_notes ||
    companyDetails?.terms_conditions ||
    activeCompany?.terms_conditions ||
    "1. E. & O.E.\n2. Total payment due within due date to avoid suspension/cancellation.\n3. Please include invoice number in payment notes.\n4. All disputes subject to local jurisdiction."
  )?.trim()

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

  // Resolve QR Code URL: 100% scanable high-res square modules with margin (Cascading from Sub-Branch -> Branch -> Parent Company)
  const companyGstQr = (companyDetails?.gst_payment_qr_url || activeCompany?.gst_payment_qr_url || (companyDetails as any)?.payment_qr_url || activeCompany?.payment_qr_url || "")?.trim()
  const companyNonGstQr = (companyDetails?.nongst_payment_qr_url || activeCompany?.nongst_payment_qr_url || (companyDetails as any)?.payment_qr_url || activeCompany?.payment_qr_url || "")?.trim()
  const companyQr = isGstInvoice ? (companyGstQr || companyNonGstQr) : (companyNonGstQr || companyGstQr)

  const customPaymentQrUrl = 
    overrideBankDetails?.paymentQrUrl ||
    (isSubBranchIssued
      ? (isGstInvoice 
          ? (activeSubBranch?.gst_payment_qr_url || activeSubBranch?.payment_qr_url || activeBranch?.gst_payment_qr_url || activeBranch?.payment_qr_url || companyGstQr || companyQr) 
          : (activeSubBranch?.nongst_payment_qr_url || activeSubBranch?.payment_qr_url || activeBranch?.nongst_payment_qr_url || activeBranch?.payment_qr_url || companyNonGstQr || companyQr)
        )
      : isBranchIssued
      ? (isGstInvoice 
          ? (activeBranch?.gst_payment_qr_url || activeBranch?.payment_qr_url || companyGstQr || companyQr) 
          : (activeBranch?.nongst_payment_qr_url || activeBranch?.payment_qr_url || companyNonGstQr || companyQr)
        )
      : (isGstInvoice 
          ? (companyGstQr || companyQr) 
          : (companyNonGstQr || companyQr)
        )
    ) ||
    activeSubBranch?.payment_qr_url ||
    activeBranch?.payment_qr_url ||
    companyQr ||
    activeCompany?.payment_qr_url ||
    paySettings?.qrCodeUrl ||
    (resolvedUpiId
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

  // 4. Strict A4 Pagination Engine (Strictly > 3 items creates next page)
  const ITEMS_PER_FIRST_PAGE = 3
  const ITEMS_PER_SUBSEQUENT_PAGE = 3

  const paginatedPages = React.useMemo(() => {
    if (finalRenderedRows.length <= ITEMS_PER_FIRST_PAGE) {
      return [{
        pageNumber: 1,
        items: finalRenderedRows,
        startIndex: 0,
        isFirstPage: true,
        isLastPage: true,
      }]
    }

    const pages: Array<{
      pageNumber: number
      items: typeof finalRenderedRows
      startIndex: number
      isFirstPage: boolean
      isLastPage: boolean
    }> = []

    // Page 1: first 3 items
    pages.push({
      pageNumber: 1,
      items: finalRenderedRows.slice(0, ITEMS_PER_FIRST_PAGE),
      startIndex: 0,
      isFirstPage: true,
      isLastPage: false,
    })

    // Subsequent pages
    let currentIndex = ITEMS_PER_FIRST_PAGE
    let pageNum = 2

    while (currentIndex < finalRenderedRows.length) {
      const nextItems = finalRenderedRows.slice(currentIndex, currentIndex + ITEMS_PER_SUBSEQUENT_PAGE)
      const isLast = (currentIndex + ITEMS_PER_SUBSEQUENT_PAGE) >= finalRenderedRows.length
      pages.push({
        pageNumber: pageNum,
        items: nextItems,
        startIndex: currentIndex,
        isFirstPage: false,
        isLastPage: isLast,
      })
      currentIndex += ITEMS_PER_SUBSEQUENT_PAGE
      pageNum++
    }

    return pages
  }, [finalRenderedRows])

  const totalPages = paginatedPages.length

  const hasDue = parsedDue > 0
  const hasBankDetails = Boolean(resolvedBankName || resolvedAccountNumber)
  const hasUpiDetails = Boolean(resolvedUpiId || customPaymentQrUrl)
  const hasContactInfo = Boolean(resolvedPhone || resolvedWebsite || resolvedEmail)
  const hasLegalIds = Boolean(resolvedCin || (isGstInvoice && resolvedGstin) || resolvedPan || interactive)



  const renderTopHeader = (pageNumber: number = 1, totalPgs: number = 1) => (
    <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3 border-b border-zinc-200 pb-2.5">
      {/* Left: Company Brand & Entity Info with Logo */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
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
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-2xs shrink-0 border border-zinc-200/90 bg-white flex items-center justify-center p-2">
              <img 
                src={resolvedLogoUrl} 
                alt={resolvedBrandName || "Entity Logo"} 
                className="max-w-full max-h-full object-contain pointer-events-none select-none" 
              />
            </div>
          ) : (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-md shrink-0 border border-teal-900/30 bg-gradient-to-b from-[#004e59] via-[#005c68] to-[#003840] flex flex-col items-center justify-center p-2">
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center text-white">
                <Sparkles className="w-6 h-6 mb-1 text-teal-200 drop-shadow-sm" />
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
        <div className="space-y-0.5 flex-1 min-w-0 pt-0.5">
          <div>
            {/* Primary Official Registered Corporate Name */}
            <EditableText
              as="h1"
              value={fullRegisteredCompanyName}
              onChange={(val) => onFieldChange?.("name", val)}
              interactive={interactive}
              fieldKey="name"
              className="text-sm sm:text-base font-black tracking-tight leading-tight text-zinc-950 uppercase font-sans"
            />

            {/* If a distinct subtitle/tagline is defined, display it */}
            {(resolvedSubtitle || interactive) && (
              <EditableText
                as="h2"
                value={resolvedSubtitle}
                onChange={(val) => onFieldChange?.("subtitle", val)}
                interactive={interactive}
                fieldKey="subtitle"
                placeholder="Add company subtitle or division tagline..."
                className="text-[9.5px] font-semibold text-zinc-600 tracking-wider mt-0.5 block"
              />
            )}

            {/* Editable ISO 9001 / Quality Certification Badge */}
            {(resolvedIsoCertification || interactive) && (
              <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-300/90 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 text-[7.5px] font-black tracking-wider uppercase shadow-2xs mt-0.5">
                <Award size={10} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <EditableText
                  value={resolvedIsoCertification}
                  onChange={(val) => onFieldChange?.("iso_certification", val)}
                  interactive={interactive}
                  fieldKey="iso_certification"
                  placeholder="Quality certification..."
                />
              </div>
            )}
          </div>

          {/* Legal IDs: CIN, GSTIN (GST Only), PAN */}
          {hasLegalIds && (
            <p className="text-[8.5px] font-semibold text-zinc-600 font-mono pt-0.5 flex items-center gap-2 flex-wrap">
              {(resolvedCin || interactive) && (
                <span className="inline-flex items-center gap-0.5">
                  <span className="text-zinc-500">CIN:</span>
                  <EditableText
                    value={resolvedCin}
                    onChange={(val) => onFieldChange?.("cin", val)}
                    interactive={interactive}
                    fieldKey="cin"
                    placeholder="CIN Number..."
                    className="text-zinc-800 font-bold"
                  />
                </span>
              )}
              {(isGstInvoice && (resolvedGstin || interactive)) && (
                <span className="inline-flex items-center gap-0.5">
                  {(resolvedCin || interactive) ? <span className="text-zinc-300 mr-0.5">|</span> : null}
                  <span className="text-zinc-500">GSTIN:</span>
                  <EditableText
                    value={resolvedGstin}
                    onChange={(val) => onFieldChange?.("gstin", val)}
                    interactive={interactive}
                    fieldKey="gstin"
                    placeholder="GSTIN..."
                    className="text-zinc-900 font-black"
                  />
                </span>
              )}
              {(resolvedPan || interactive) && (
                <span className="inline-flex items-center gap-0.5">
                  {((resolvedCin || (isGstInvoice && resolvedGstin)) || interactive) ? <span className="text-zinc-300 mr-0.5">|</span> : null}
                  <span className="text-zinc-500">PAN:</span>
                  <EditableText
                    value={resolvedPan}
                    onChange={(val) => onFieldChange?.("pan", val)}
                    interactive={interactive}
                    fieldKey="pan"
                    placeholder="PAN..."
                    className="text-zinc-900 font-black"
                  />
                </span>
              )}
            </p>
          )}

          {/* Address & Contact Row */}
          {(resolvedAddress || hasContactInfo || interactive) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px] text-zinc-700 pt-0.5">
              {(resolvedAddress || interactive) ? (
                <div className="flex items-start gap-1">
                  <span className={`w-3 h-3 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0 mt-0.5`}>
                    <MapPin size={7} />
                  </span>
                  <div className="leading-tight flex-1">
                    <strong className="text-zinc-900 block text-[8.5px]">Office:</strong>
                    <EditableText
                      value={resolvedAddress}
                      onChange={(val) => onFieldChange?.("address", val)}
                      interactive={interactive}
                      fieldKey="address"
                      placeholder="Company address..."
                      className="text-zinc-600 text-[8px]"
                    />
                  </div>
                </div>
              ) : <div />}

              {(hasContactInfo || interactive) && (
                <div className="space-y-0.2">
                  {(resolvedPhone || interactive) && (
                    <p className="flex items-center gap-1">
                      <span className={`w-3 h-3 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
                        <Phone size={6.5} />
                      </span>
                      <EditableText
                        value={resolvedPhone}
                        onChange={(val) => onFieldChange?.("phone", val)}
                        interactive={interactive}
                        fieldKey="phone"
                        placeholder="+91 Phone..."
                        className="font-mono text-zinc-800 font-semibold text-[8px]"
                      />
                    </p>
                  )}
                  {(resolvedEmail || interactive) && (
                    <p className="flex items-center gap-1">
                      <span className={`w-3 h-3 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
                        <Mail size={6.5} />
                      </span>
                      <EditableText
                        value={resolvedEmail}
                        onChange={(val) => onFieldChange?.("email", val)}
                        interactive={interactive}
                        fieldKey="email"
                        placeholder="Official email..."
                        className="text-zinc-700 text-[8px]"
                      />
                    </p>
                  )}
                  {(resolvedWebsite || interactive) && (
                    <p className="flex items-center gap-1">
                      <span className={`w-3 h-3 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
                        <Globe size={6.5} />
                      </span>
                      <EditableText
                        value={resolvedWebsite}
                        onChange={(val) => onFieldChange?.("website", val)}
                        interactive={interactive}
                        fieldKey="website"
                        placeholder="Website..."
                        className="text-zinc-700 text-[8px]"
                      />
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Header Card with Status Badge & Dates */}
      <div className={`w-full sm:w-48 rounded-xl ${theme.cardHeaderGradient} text-white p-2.5 shadow-md shrink-0 flex flex-col self-start space-y-1.5`}>
        <div className="flex items-center justify-between border-b border-white/20 pb-1">
          <span className="font-black text-[10px] tracking-wider uppercase">
            {theme.invoiceTypeLabel} {totalPgs > 1 ? `(P.${pageNumber}/${totalPgs})` : ''}
          </span>
          <span className={`px-1.5 py-0.2 rounded-full text-[7.5px] font-black tracking-wider uppercase ${
            isFullyPaid 
              ? "bg-white text-emerald-800" 
              : isPartPaid 
              ? "bg-white text-amber-800" 
              : "bg-white text-rose-800"
          }`}>
            {statusBadgeText}
          </span>
        </div>

        <div className="space-y-1 text-[9px]">
          <div>
            <span className="text-white/80 text-[7.5px] uppercase tracking-wider font-semibold block">INVOICE NO:</span>
            <strong className="font-mono text-white text-[11px] font-bold break-all leading-tight block">
              {invoiceNumOrId}
            </strong>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-white/80 text-[7.5px] uppercase font-bold tracking-wider shrink-0 w-8">DATE:</span>
            <strong className="text-white font-mono text-[8.5px]">
              {formatInvoiceDate(invoice.billDate)}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-[7.5px] uppercase font-bold tracking-wider shrink-0 w-8">DUE:</span>
            <strong className="text-white font-mono text-[8.5px]">
              {hasDue ? formatInvoiceDate(invoice.dueDate) : "-"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCompactSubsequentHeader = (pageNumber: number, totalPgs: number) => (
    <div className="flex justify-between items-center border-b border-zinc-200 pb-2 mb-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-black tracking-tight text-zinc-900 uppercase">
          {fullRegisteredCompanyName}
        </h2>
        <span className="text-[9px] text-zinc-500 font-mono">| Invoice: <strong>{invoiceNumOrId}</strong></span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-md ${theme.primaryBg} text-white font-mono font-bold text-[8.5px] uppercase tracking-wider`}>
          Page {pageNumber} of {totalPgs}
        </span>
      </div>
    </div>
  )

  const renderEntityHierarchyStrip = () => {
    if (isSubBranchIssued && activeSubBranch) {
      const parentName = resolvedParentBranch?.name || activeBranch?.name || "Main Operational Branch"
      const parentCode = resolvedParentBranch?.code || activeBranch?.code
      const parentManager = resolvedParentBranch?.managerName || (resolvedParentBranch as any)?.manager_name || (activeBranch?.managerName || (activeBranch as any)?.manager_name)
      const parentCity = resolvedParentBranch?.city || activeBranch?.city

      const subName = activeSubBranch.name || "Franchise Sub-Branch"
      const subCode = activeSubBranch.code
      const partnerName = activeSubBranch.partner_name || (activeSubBranch as any)?.partnerName
      const subCity = activeSubBranch.city || activeSubBranch.state

      return (
        <div className="w-full rounded-xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-emerald-50/90 border border-zinc-200/90 p-2 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
            {/* Left: Parent Branch */}
            <div className="flex items-center gap-2 min-w-0 pr-0 sm:pr-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Building2 size={12} />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[7px] uppercase font-black text-blue-700 tracking-wider">Parent Branch:</span>
                  <span className="font-bold text-zinc-900 text-[9.5px] truncate">{parentName}</span>
                  {parentCode && (
                    <span className="font-mono text-[7px] bg-blue-100 text-blue-950 font-bold px-1 py-0.2 rounded border border-blue-200">
                      {parentCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[8px] text-zinc-600 mt-0.5 flex-wrap">
                  {parentManager && (
                    <span>Mgr: <strong className="text-zinc-800">{parentManager}</strong></span>
                  )}
                  {parentCity && (
                    <span className="flex items-center gap-0.5 text-zinc-500 font-medium">
                      <MapPin size={8} className="text-blue-600 shrink-0" />
                      <span>{parentCity}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Franchise Sub-Branch */}
            <div className="flex items-center gap-2 min-w-0 pt-1.5 sm:pt-0 pl-0 sm:pl-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck size={12} />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[7px] uppercase font-black text-emerald-700 tracking-wider">Franchise Sub-Branch:</span>
                  <span className="font-bold text-zinc-900 text-[9.5px] truncate">{subName}</span>
                  {subCode && (
                    <span className="font-mono text-[7px] bg-emerald-100 text-emerald-950 font-bold px-1 py-0.2 rounded border border-emerald-200">
                      [{subCode}]
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[8px] text-zinc-600 mt-0.5 flex-wrap">
                  {partnerName && (
                    <span>Partner: <strong className="text-zinc-800">{partnerName}</strong></span>
                  )}
                  {subCity && (
                    <span className="flex items-center gap-0.5 text-zinc-500 font-medium">
                      <MapPin size={8} className="text-emerald-600 shrink-0" />
                      <span>{subCity}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (isBranchIssued && activeBranch) {
      const branchName = activeBranch.name || "Regional Operations Branch"
      const branchCode = activeBranch.code
      const branchManager = activeBranch.managerName || (activeBranch as any)?.manager_name
      const branchLocation = [activeBranch.city, activeBranch.state].filter(Boolean).join(", ")

      return (
        <div className="w-full rounded-xl bg-blue-50/80 border border-blue-200/90 p-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Building2 size={12} />
              </span>
              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[7px] uppercase font-black text-blue-700 tracking-wider">Issuing Operational Branch:</span>
                  <strong className="text-zinc-900 text-[9.5px]">{branchName}</strong>
                  {branchCode && (
                    <span className="font-mono text-[7px] bg-blue-200/80 text-blue-950 font-bold px-1.5 py-0.2 rounded border border-blue-300">
                      [{branchCode}]
                    </span>
                  )}
                  {branchManager && (
                    <span className="text-[8px] text-zinc-600">
                      • Manager: <strong className="text-zinc-800">{branchManager}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {branchLocation && (
              <div className="flex items-center gap-1 text-[8px] text-zinc-600 shrink-0 bg-white/80 px-2 py-0.5 rounded-md border border-blue-200">
                <MapPin size={8} className="text-blue-600 shrink-0" />
                <span className="font-medium">{branchLocation}</span>
              </div>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  const renderInfoCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-0.5">
      {/* Box 1: BILL TO (6 cols) */}
      <div className={`sm:col-span-6 p-2 rounded-xl ${theme.lightBg} border ${theme.lightBorder} space-y-0.5 shadow-2xs`}>
        <div className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-zinc-700">
          <span className={`w-3 h-3 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
            <UserCheck size={7} />
          </span>
          <span>BILL TO</span>
        </div>
        <p className="font-black text-[10.5px] text-zinc-900 leading-tight">{invoice.client}</p>
        <p className="text-[8px] text-zinc-600 leading-tight">
          <strong>Address:</strong> {clientDetails?.address || (invoice.clientEmail ? `${clientDetails?.address || 'Corporate Center'}` : 'Head Office')}
        </p>
        <p className="text-[8px] text-zinc-600 flex items-center gap-1">
          <MapPin size={7.5} className="text-zinc-500 shrink-0" />
          <span><strong>Location:</strong> {clientDetails?.city || clientDetails?.state || (activeCompany?.city ? `${activeCompany.city}, ${activeCompany?.state || ''}` : activeCompany?.state || 'West Bengal')}</span>
        </p>
        {isGstInvoice && clientDetails?.gstNumber && (
          <p className="text-[7.5px] font-mono font-bold text-zinc-800">
            <strong>Client GSTIN:</strong> {clientDetails.gstNumber}
          </p>
        )}
      </div>

      {/* Box 2: SERVICE / ENGAGEMENT DETAILS (6 cols) with embedded Official Verification QR beside it */}
      <div className={`sm:col-span-6 p-2 rounded-xl ${theme.lightBg} border ${theme.lightBorder} shadow-2xs flex items-center justify-between gap-2`}>
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-zinc-700">
            <span className={`w-3 h-3 rounded-full ${theme.primaryBg} text-white flex items-center justify-center shrink-0`}>
              <Briefcase size={7} />
            </span>
            <span>PROJECT / SERVICE SCOPE</span>
          </div>
          <p className="font-bold text-[10.5px] text-zinc-900 truncate">{invoice.project || "Enterprise Solutions"}</p>
          <p className="text-[8px] text-zinc-600 font-mono">
            <strong>Scheme:</strong> {isGstInvoice ? 'GST Tax Invoice' : 'Non-GST Direct Invoice'}
          </p>
          <p className="text-[8px] text-zinc-600 truncate">
            <strong>Company:</strong> {fullRegisteredCompanyName}
          </p>
          {isSubBranchIssued ? (
            <p className="text-[7.5px] text-emerald-800 dark:text-emerald-300 truncate font-semibold">
              <strong>Unit:</strong> {activeSubBranch?.name} {activeSubBranch?.code ? `[${activeSubBranch.code}]` : ""}
            </p>
          ) : isBranchIssued && activeBranch ? (
            <p className="text-[7.5px] text-blue-900 dark:text-blue-300 truncate font-semibold">
              <strong>Branch:</strong> {activeBranch.name} {activeBranch.code ? `[${activeBranch.code}]` : ""}
            </p>
          ) : null}
        </div>

        {/* Official Scan & Verify QR Code beside Project Scope */}
        <div className="shrink-0 text-center flex flex-col items-center bg-white p-1 border border-zinc-300 shadow-2xs rounded-lg">
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
              className="w-10 h-10 bg-white object-contain group-hover:scale-105 transition-transform" 
              style={{ imageRendering: 'pixelated' }}
            />
          </a>
          <span className="text-[5.5px] font-mono font-bold text-zinc-700 mt-0.5 block uppercase tracking-tight">
            Scan & Verify
          </span>
        </div>
      </div>
    </div>
  )

  const renderTable = (itemsToRender: any[], startIndex: number, showSubtotal: boolean) => {
    const pageSubtotalQty = itemsToRender.reduce((sum, it) => sum + it.itemQty, 0)
    const pageSubtotalBase = itemsToRender.reduce((sum, it) => sum + (it.itemRate * it.itemQty) + it.itemCharges, 0)
    const pageSubtotalGst = isGstInvoice ? itemsToRender.reduce((sum, it) => sum + it.rowTax, 0) : 0
    const pageSubtotalGross = isGstInvoice ? itemsToRender.reduce((sum, it) => sum + it.rowTotal, 0) : pageSubtotalBase

    return (
      <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-2xs mt-0.5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`${theme.tableHeaderBg} text-[8.5px] uppercase font-black tracking-wider`}>
              <th className="py-1.5 px-2.5 w-8 text-center">#</th>
              <th className="py-1.5 px-2.5">Service / Product Description</th>
              <th className="py-1.5 px-1.5 w-10 text-center">Qty</th>
              <th className="py-1.5 px-1.5 w-12 text-center">Unit</th>
              <th className="py-1.5 px-2 w-20 text-right">Unit Rate</th>
              <th className="py-1.5 px-2 w-20 text-right">{isGstInvoice ? "GST Rate / Amt" : "Taxes"}</th>
              <th className="py-1.5 px-2.5 w-24 text-right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-[9.5px] text-zinc-800 bg-white">
            {itemsToRender.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                <td className="py-1.5 px-2.5 text-center font-mono font-bold text-zinc-500">
                  {startIndex + idx + 1}
                </td>
                <td className="py-1.5 px-2.5 font-semibold text-zinc-900">
                  <div>{item.serviceName}</div>
                  {item.itemCharges > 0 && (
                    <div className="text-[8px] text-zinc-500 font-normal">
                      + Platform Setup: ₹{item.itemCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </td>
                <td className="py-1.5 px-1.5 text-center font-mono">{item.itemQty}</td>
                <td className="py-1.5 px-1.5 text-center text-zinc-500">{item.unit || "Unit"}</td>
                <td className="py-1.5 px-2 text-right font-mono">
                  ₹{item.itemRate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-zinc-600">
                  {isGstInvoice ? (
                    <div>
                      <span className="font-bold">{item.gstRate || gstRate}%</span>
                      <span className="text-[7.5px] text-zinc-500 block">
                        (₹{item.rowTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                      </span>
                    </div>
                  ) : (
                    <span className="font-mono text-zinc-400">₹0.00</span>
                  )}
                </td>
                <td className="py-1.5 px-2.5 text-right font-mono font-black text-zinc-900">
                  ₹{item.rowTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          {showSubtotal && (
            <tfoot>
              <tr className={`${theme.tableSubtotalBg} font-bold text-[9px] border-t border-zinc-200`}>
                <td colSpan={2} className="py-1 px-2.5 uppercase tracking-wider">
                  SUBTOTAL SERVICES & BASE AMOUNT
                </td>
                <td className="py-1 px-1.5 text-center font-mono">{pageSubtotalQty}</td>
                <td className="py-1 px-1.5 text-center">Items</td>
                <td className="py-1 px-2 text-right font-mono">
                  ₹{pageSubtotalBase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-1 px-2 text-right font-mono">
                  ₹{pageSubtotalGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-1 px-2.5 text-right font-mono font-black">
                  ₹{pageSubtotalGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    )
  }

  const renderFinancialsAndFooter = (pageNumber: number = 1, totalPgs: number = 1) => (
    <div className="flex-1 flex flex-col justify-between space-y-2 mt-auto">
      {/* 2-COLUMN BALANCED MATRIX: LEFT = TOTAL IN WORDS + BANK & UPI PAYMENT DETAILS; RIGHT = FINANCIAL SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-stretch">
        {/* Left 6 Columns: Amount in Words + Bank & UPI Payment Details */}
        <div className="sm:col-span-6 flex flex-col justify-between gap-1.5">
          {/* Card 1: TOTAL AMOUNT IN WORDS */}
          <div className={`p-2 rounded-xl ${theme.lightBg} border ${theme.lightBorder} space-y-0.5 shadow-2xs`}>
            <span className="font-black text-[8.5px] uppercase tracking-wider text-zinc-600 flex items-center gap-1">
              <FileText size={10} className={theme.primaryText} />
              <span>TOTAL AMOUNT IN WORDS</span>
            </span>
            <p className="font-bold text-zinc-900 italic text-[9.5px] leading-tight">
              {numberToIndianWords(totalVal)}
            </p>
          </div>

          {/* Card 2: BANK & UPI PAYMENT DETAILS (Always visible, prominent, and scannable) */}
          <div className={`p-2 rounded-xl ${theme.lightBg} border ${theme.lightBorder} space-y-1.5 shadow-2xs flex-1 flex flex-col justify-between`}>
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-700/60 pb-1">
              <span className="font-black text-[9px] uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                <Landmark size={11} className={theme.primaryText} />
                <span>BANK &amp; UPI PAYMENT DETAILS</span>
              </span>
              <span className="text-[7px] font-black px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                Instant Settlement
              </span>
            </div>

            <div className="grid grid-cols-12 gap-2 items-center">
              {/* Left side of card: UPI QR Code & Instant Scan */}
              <div className="col-span-4 flex flex-col items-center justify-center text-center space-y-0.5">
                {customPaymentQrUrl && (
                  <div className="bg-white p-1 rounded-lg border border-zinc-300 shadow-2xs shrink-0">
                    <img 
                      src={customPaymentQrUrl} 
                      alt="UPI Payment QR Code" 
                      className="w-14 h-14 object-contain" 
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                )}
                <span className="text-[6.5px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-tight">SCAN TO PAY</span>
              </div>

              {/* Right side of card: Direct Bank Account & UPI Details */}
              <div className="col-span-8 space-y-0.5 text-[8px] text-zinc-700 dark:text-zinc-300">
                {(resolvedBankName || interactive) && (
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-zinc-500 font-medium shrink-0">Bank:</span>
                    <EditableText
                      value={resolvedBankName}
                      onChange={(val) => onFieldChange?.("bank_name", val)}
                      interactive={interactive}
                      fieldKey="bank_name"
                      placeholder="Bank name..."
                      className="text-zinc-900 dark:text-zinc-100 font-bold truncate text-right flex-1"
                    />
                  </div>
                )}
                {(resolvedAccountNumber || interactive) && (
                  <div className="flex justify-between items-center gap-1 font-mono">
                    <span className="text-zinc-500 font-medium font-sans shrink-0">A/C No:</span>
                    <EditableText
                      value={resolvedAccountNumber}
                      onChange={(val) => onFieldChange?.("account_number", val)}
                      interactive={interactive}
                      fieldKey="account_number"
                      placeholder="Account number..."
                      className="text-zinc-900 dark:text-zinc-100 font-extrabold text-right flex-1"
                    />
                  </div>
                )}
                {(resolvedIfscCode || interactive) && (
                  <div className="flex justify-between items-center gap-1 font-mono">
                    <span className="text-zinc-500 font-medium font-sans shrink-0">IFSC:</span>
                    <EditableText
                      value={resolvedIfscCode}
                      onChange={(val) => onFieldChange?.("ifsc_code", val)}
                      interactive={interactive}
                      fieldKey="ifsc_code"
                      placeholder="IFSC code..."
                      className="text-zinc-900 dark:text-zinc-100 font-extrabold uppercase text-right flex-1"
                    />
                  </div>
                )}
                {(resolvedAccountHolder || interactive) && (
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-zinc-500 font-medium shrink-0">A/C Name:</span>
                    <EditableText
                      value={resolvedAccountHolder}
                      onChange={(val) => onFieldChange?.("account_holder", val)}
                      interactive={interactive}
                      fieldKey="account_holder"
                      placeholder="A/C holder..."
                      className="text-zinc-900 dark:text-zinc-100 font-bold truncate text-right flex-1"
                    />
                  </div>
                )}
                {(resolvedUpiId || interactive) && (
                  <div className="flex justify-between items-center gap-1 pt-0.5 border-t border-zinc-200/60 dark:border-zinc-700/50 font-mono">
                    <span className="text-zinc-500 font-medium font-sans shrink-0">UPI ID:</span>
                    <EditableText
                      value={resolvedUpiId}
                      onChange={(val) => onFieldChange?.("upi_id", val)}
                      interactive={interactive}
                      fieldKey="upi_id"
                      placeholder="UPI ID..."
                      className="text-indigo-700 dark:text-indigo-300 font-black truncate bg-indigo-50 dark:bg-indigo-950/60 px-1 py-0.2 rounded border border-indigo-200 dark:border-indigo-800 text-right flex-1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payment App Badges */}
            <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-zinc-200/70 dark:border-zinc-700/60 text-[6.5px] font-bold text-zinc-500">
              <span className="uppercase text-[6px] font-extrabold text-zinc-400">Accepted:</span>
              <div className="flex items-center gap-1">
                <span className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">GPay</span>
                <span className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">PhonePe</span>
                <span className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">Paytm</span>
                <span className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">NEFT/IMPS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Financial Computation Matrix */}
        <div className="sm:col-span-6 flex flex-col justify-between text-[8.5px]">
          <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-0.5 text-zinc-700 dark:text-zinc-300 shadow-2xs h-full flex flex-col justify-between">
            <div className="space-y-0.5">
              <div className="flex justify-between py-0.2">
                <span>Total Services Value</span>
                <span className="font-mono font-semibold">₹{baseNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              {setupCharge > 0 && (
                <div className="flex justify-between py-0.2">
                  <span>Platform / Setup Charge</span>
                  <span className="font-mono">₹{setupCharge.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {invoice.discountsList && invoice.discountsList.length > 0 ? (
                invoice.discountsList.map((d: any) => (
                  <div key={d.id} className="flex justify-between py-0.2 text-zinc-500">
                    <span>Less: {d.name}</span>
                    <span className="font-mono">(-) ₹{(d.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))
              ) : discount > 0 ? (
                <div className="flex justify-between py-0.2 text-zinc-500">
                  <span>Less: Promotional Discount</span>
                  <span className="font-mono">(-) ₹{discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              ) : null}

              <div className="flex justify-between py-0.5 border-t border-zinc-200 dark:border-zinc-700 font-bold text-zinc-900 dark:text-zinc-100">
                <span>Taxable Base Amount</span>
                <span className="font-mono">₹{taxableBase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              {isGstInvoice && (
                <>
                  <div className="flex justify-between py-0.2 text-zinc-600 dark:text-zinc-400">
                    <span>CGST ({(gstRate / 2).toFixed(1)}%)</span>
                    <span className="font-mono">₹{cgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-0.2 text-zinc-600 dark:text-zinc-400">
                    <span>SGST ({(gstRate / 2).toFixed(1)}%)</span>
                    <span className="font-mono">₹{sgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
            </div>

            <div className={`flex justify-between p-1.5 rounded-lg ${theme.grandTotalBg} font-black text-[9.5px] tracking-wide my-1 shadow-xs`}>
              <span>GRAND TOTAL (NET PAYABLE)</span>
              <span className="font-mono text-xs">₹{totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="space-y-0.2">
              <div className="flex justify-between py-0.2 text-emerald-700 dark:text-emerald-400 font-bold">
                <span>Received Amount</span>
                <span className="font-mono">₹{parsedReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between py-0.2 border-t border-zinc-200 dark:border-zinc-700 font-black text-[8.5px] text-rose-600 dark:text-rose-400">
                <span>Current Balance (Total Due)</span>
                <span className="font-mono">₹{parsedDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between pt-0.5 text-[8px] text-zinc-500">
                <span>Next Due Date</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{hasDue ? formatInvoiceDate(invoice.dueDate) : "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TERMS & CONDITIONS / INVOICE NOTES (Enlarged, Clear & Prominent) */}
      {(resolvedTermsAndNotes || interactive) && (
        <div className="p-2.5 sm:p-3 rounded-xl border border-zinc-300/90 dark:border-zinc-700 bg-zinc-50/90 dark:bg-zinc-900/60 text-[8.5px] sm:text-[9.5px] text-zinc-700 dark:text-zinc-300 space-y-1 shadow-2xs">
          <span className="font-extrabold text-zinc-900 dark:text-zinc-100 uppercase text-[8px] sm:text-[8.5px] tracking-wider block">
            Terms &amp; Conditions / Official Notes:
          </span>
          <EditableText
            value={resolvedTermsAndNotes}
            onChange={(val) => onFieldChange?.("terms_conditions", val)}
            interactive={interactive}
            fieldKey="terms_conditions"
            placeholder="Click to add default terms and conditions..."
            className="whitespace-pre-line leading-relaxed font-normal block"
          />
        </div>
      )}

      {/* STICKY BOTTOM SECTION: SIGNATURES, OFFICIAL SEAL & FOOTER BANNER */}
      <div className="space-y-2 mt-auto pt-1">
        {/* SIGNATURES & OFFICIAL SEAL ROW */}
        <div className="flex flex-row justify-between items-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {/* Left: Customer Acceptance */}
          <div className="text-center space-y-1">
            <div className="h-11 flex items-end justify-center">
              {/* Blank space for physical signing */}
            </div>
            <div className="w-40 border-t-2 border-zinc-400 dark:border-zinc-600 pt-0.5">
              <p className="text-[8px] font-black uppercase text-zinc-700 dark:text-zinc-300">CUSTOMER SIGNATURE</p>
              <p className="text-[6.5px] text-zinc-500 font-medium">Accepted &amp; Confirmed</p>
            </div>
          </div>

          {/* Center-Right: Independent Draggable Corporate Seal / Stamp */}
          <motion.div
            drag={interactive}
            dragMomentum={false}
            dragElastic={0}
            whileDrag={{ scale: 1.05, zIndex: 50 }}
            animate={{ x: stampPosition?.x || 0, y: stampPosition?.y || 0 }}
            onDragEnd={(_, info) => {
              if (onStampPositionChange) {
                onStampPositionChange({
                  x: (stampPosition?.x || 0) + info.offset.x,
                  y: (stampPosition?.y || 0) + info.offset.y,
                })
              }
            }}
            className={`shrink-0 select-none relative ${
              interactive ? "cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-emerald-500 rounded-2xl group transition-shadow p-1 z-20" : ""
            }`}
          >
            {interactive && (
              <div className="absolute -top-3 -left-2 bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xs z-30 whitespace-nowrap">
                ✥ Drag Stamp / Seal
              </div>
            )}
            {resolvedStampUrl ? (
              <div className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center p-0.5 shadow-2xs">
                <img 
                  src={resolvedStampUrl} 
                  alt="Official Company Seal" 
                  className="max-h-20 max-w-20 object-contain pointer-events-none select-none drop-shadow-sm" 
                />
              </div>
            ) : (
              /* High-Fidelity Vector Circular Corporate Stamp Seal */
              <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-dashed ${theme.sealColor} flex flex-col items-center justify-center p-1 text-center bg-white shadow-2xs rotate-[-5deg] relative`}>
                <div className="w-[56px] h-[56px] rounded-full border border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center p-0.5">
                  <div className="text-[6px] font-black uppercase tracking-tighter leading-tight text-zinc-900 truncate max-w-[50px]">
                    {resolvedBrandName}
                  </div>
                  <div className="w-full border-t border-zinc-300 dark:border-zinc-700 my-0.5" />
                  <div className="text-[5.5px] font-black text-emerald-700 dark:text-emerald-400 tracking-wider uppercase leading-none">
                    ★ OFFICIAL SEAL ★
                  </div>
                  <div className="text-[4.5px] font-bold text-zinc-500 uppercase tracking-tight leading-none mt-0.5">
                    VERIFIED
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right: Independent Draggable Company Authorized Signatory */}
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
            className={`text-center space-y-0.5 min-w-[150px] relative select-none ${
              interactive ? "cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 rounded-xl group transition-shadow p-1.5 z-20" : ""
            }`}
          >
            {interactive && (
              <div className="absolute -top-3 -right-2 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xs z-30 whitespace-nowrap">
                ✥ Drag Signature
              </div>
            )}

            <p className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-tight truncate max-w-[160px]">
              For {fullRegisteredCompanyName} {isSubBranchIssued && activeSubBranch ? `(${activeSubBranch.name})` : isBranchIssued && activeBranch ? `(${activeBranch.name})` : ""}
            </p>
            <div className="h-11 flex items-center justify-center">
              {resolvedSignatureUrl ? (
                <img 
                  src={resolvedSignatureUrl} 
                  alt="Authorized Signature" 
                  className="max-h-11 max-w-[140px] object-contain drop-shadow-xs pointer-events-none select-none" 
                />
              ) : (
                /* Elegant Digital Calligraphic Signature Graphic */
                <div className="flex flex-col items-center justify-center">
                  <span className="font-serif italic font-extrabold text-sm tracking-wide text-zinc-800 dark:text-zinc-200">
                    {resolvedSignatoryName || "Authorized Signatory"}
                  </span>
                  <span className="text-[5.5px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase flex items-center gap-0.5">
                    ✓ Digitally Authorized
                  </span>
                </div>
              )}
            </div>
            <div className="w-full border-t-2 border-zinc-400 dark:border-zinc-600 pt-0.5">
              <EditableText
                value={resolvedSignatoryName || "Authorized Signatory"}
                onChange={(val) => onFieldChange?.("signatory_name", val)}
                interactive={interactive}
                fieldKey="signatory_name"
                placeholder="Signatory name..."
                className="text-[8px] font-black uppercase text-zinc-800 dark:text-zinc-200 font-bold leading-tight block truncate"
              />
              <EditableText
                value={resolvedSignatoryDesignation || "Managing Director"}
                onChange={(val) => onFieldChange?.("signatory_designation", val)}
                interactive={interactive}
                fieldKey="signatory_designation"
                placeholder="Designation..."
                className="text-[6.5px] text-zinc-500 font-medium leading-tight block truncate"
              />
            </div>
          </motion.div>
        </div>

        {/* BOTTOM BANNER WITH PAGE NUMBER */}
        <div className={`rounded-xl ${theme.headerGradient} text-white p-1 text-[7.5px] font-medium flex flex-wrap items-center justify-between gap-1 shadow-xs`}>
          <p className="flex items-center gap-1">
            <MapPin size={8} />
            <span>{resolvedAddress || fullRegisteredCompanyName}</span>
          </p>
          <div className="flex items-center gap-2">
            <span>{resolvedEmail ? `Support: ${resolvedEmail}` : ""} {resolvedPhone ? `| Tel: ${resolvedPhone}` : ""}</span>
            <span className="font-mono font-bold bg-black/20 px-1.5 py-0.2 rounded text-[7px]">
              Page {pageNumber} of {totalPgs}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPageFooterOnly = (pageNumber: number, totalPgs: number) => (
    <div className="mt-auto shrink-0 pt-2 border-t border-zinc-200 space-y-2">
      <div className="flex justify-between items-center bg-zinc-50 p-2 rounded-xl border border-zinc-200 text-[8.5px] text-zinc-600">
        <span>Continued to Next Page...</span>
        <span className="font-mono font-bold text-zinc-800">Page {pageNumber} of {totalPgs}</span>
      </div>
      <div className={`rounded-xl ${theme.headerGradient} text-white p-1.5 text-[8px] font-medium flex flex-wrap items-center justify-between gap-1 shadow-xs`}>
        <p className="flex items-center gap-1">
          <MapPin size={9} />
          <span>{resolvedAddress || fullRegisteredCompanyName}</span>
        </p>
        <span className="font-mono font-bold bg-black/20 px-1.5 py-0.2 rounded text-[7.5px]">
          Page {pageNumber} of {totalPgs}
        </span>
      </div>
    </div>
  )

  return (
    <div id="printable-invoice" className="w-full flex flex-col items-center gap-6 py-2 print:p-0 print:gap-0 print:m-0">
      {paginatedPages.map((pg) => (
        <div
          key={`invoice-page-${pg.pageNumber}`}
          className="a4-page bg-white text-zinc-900 font-sans p-4 sm:p-5 text-xs shadow-2xl border border-zinc-200/90 rounded-2xl w-full max-w-[794px] min-h-[1080px] mx-auto relative flex flex-col justify-between gap-2.5 overflow-visible print:w-[210mm] print:max-w-[210mm] print:h-[282mm] print:min-h-[282mm] print:max-h-[282mm] print:p-[5mm_8mm] print:gap-1.5 print:m-0 print:shadow-none print:border-none print:rounded-none page-break-after"
        >
          {/* Draggable Custom Text Stamps / Badges Overlay (on page 1) */}
          {pg.isFirstPage && customStamps && customStamps.map(stamp => {
            const curSize = stamp.fontSize || 12
            const curRot = stamp.rotation ?? (stamp.bgStyle === "stamp" ? -12 : 0)
            const curStyle = stamp.bgStyle || "stamp"
            const curColor = stamp.color || "#0d9488"
            const isBold = stamp.isBold !== false

            return (
              <motion.div
                key={stamp.id}
                drag={interactive}
                dragMomentum={false}
                dragElastic={0}
                whileDrag={{ scale: 1.05, zIndex: 60 }}
                animate={{ x: stamp.x, y: stamp.y, rotate: curRot }}
                onDragEnd={(_, info) => {
                  if (onCustomStampMove) {
                    onCustomStampMove(stamp.id, {
                      x: stamp.x + info.offset.x,
                      y: stamp.y + info.offset.y,
                    })
                  }
                }}
                className={`absolute z-30 select-none transition-shadow group ${
                  interactive ? "cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-400 p-1" : ""
                }`}
                style={{
                  left: "35%",
                  top: "18%",
                }}
              >
                {/* Floating Interactive Micro-Toolbar (visible on hover when in interactive mode) */}
                {interactive && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity bg-zinc-900/95 backdrop-blur-sm text-white px-2 py-1 rounded-xl shadow-xl flex items-center gap-1.5 z-40 text-[9px] pointer-events-auto whitespace-nowrap border border-white/20">
                    <span className="text-[7.5px] font-bold text-zinc-400 select-none">✥ Drag</span>

                    {/* Zoom In / Zoom Out Font Size Controls */}
                    <div className="flex items-center bg-zinc-800 rounded px-1 py-0.5 gap-1 border border-zinc-700">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCustomStampUpdate?.(stamp.id, { fontSize: Math.max(8, curSize - 2) })
                        }}
                        className="text-[9px] font-bold hover:text-teal-300 px-1 cursor-pointer"
                        title="Zoom out text (Decrease font size)"
                      >
                        A-
                      </button>
                      <span className="font-mono text-[8.5px] text-zinc-300 font-bold">{curSize}px</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCustomStampUpdate?.(stamp.id, { fontSize: Math.min(48, curSize + 2) })
                        }}
                        className="text-[9px] font-bold hover:text-teal-300 px-1 cursor-pointer"
                        title="Zoom in text (Increase font size)"
                      >
                        A+
                      </button>
                    </div>

                    {/* Quick Color Swatches */}
                    <div className="flex items-center gap-0.5">
                      {[
                        { color: "#0d9488", title: "Teal" },
                        { color: "#dc2626", title: "Crimson" },
                        { color: "#2563eb", title: "Blue" },
                        { color: "#d97706", title: "Amber" },
                        { color: "#7c3aed", title: "Purple" },
                        { color: "#18181b", title: "Black" },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onCustomStampUpdate?.(stamp.id, { color: c.color })
                          }}
                          className={`w-3 h-3 rounded-full border border-white/40 cursor-pointer ${curColor === c.color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                          style={{ backgroundColor: c.color }}
                          title={c.title}
                        />
                      ))}
                    </div>

                    {/* Rotation Cycle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const rotSequence = [0, -12, -24, 15, 45]
                        const nextIndex = (rotSequence.indexOf(curRot) + 1) % rotSequence.length
                        onCustomStampUpdate?.(stamp.id, { rotation: rotSequence[nextIndex] })
                      }}
                      className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 text-[8px] font-bold cursor-pointer"
                      title="Rotate stamp angle"
                    >
                      ⟳ {curRot}°
                    </button>

                    {/* Style Preset Cycler */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const styleSequence: ("stamp" | "badge" | "clean" | "watermark")[] = ["stamp", "badge", "clean", "watermark"]
                        const nextIndex = (styleSequence.indexOf(curStyle) + 1) % styleSequence.length
                        onCustomStampUpdate?.(stamp.id, { bgStyle: styleSequence[nextIndex] })
                      }}
                      className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 text-[8px] font-bold uppercase cursor-pointer"
                      title="Cycle style: Stamp, Badge, Clean, Watermark"
                    >
                      {curStyle}
                    </button>

                    {/* Remove Stamp Button */}
                    {onRemoveCustomStamp && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveCustomStamp(stamp.id)
                        }}
                        className="w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-[9px] font-bold cursor-pointer ml-0.5 shadow-xs"
                        title="Delete custom text sticker"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}

                {/* Actual Custom Stamp Element (Editable in-place) */}
                <div
                  className={`flex items-center gap-1.5 ${
                    curStyle === "stamp"
                      ? "px-3 py-1 rounded-lg border-2 border-dashed font-black uppercase tracking-wider shadow-md backdrop-blur-xs bg-white/95"
                      : curStyle === "badge"
                      ? "px-3 py-0.5 rounded-full border-2 font-bold uppercase tracking-wider shadow-sm backdrop-blur-xs bg-white/95"
                      : curStyle === "watermark"
                      ? "p-2 font-black uppercase tracking-widest opacity-25 select-none"
                      : "px-2 py-0.5 font-bold"
                  }`}
                  style={{
                    borderColor: curColor,
                    color: curColor,
                    fontSize: `${curSize}px`,
                    fontWeight: isBold ? 800 : 500,
                  }}
                >
                  <EditableText
                    value={stamp.text}
                    onChange={(val) => onCustomStampUpdate?.(stamp.id, { text: val })}
                    interactive={interactive}
                    placeholder="Enter custom text..."
                    className="outline-none"
                  />
                </div>
              </motion.div>
            )
          })}

          {/* PAGE CONTENT (Top to mid sections) */}
          <div className="flex flex-col gap-2 shrink-0">
            {pg.isFirstPage ? (
              <>
                {renderTopHeader(pg.pageNumber, totalPages)}
                {renderEntityHierarchyStrip()}
                {renderInfoCards()}
                {renderTable(pg.items, pg.startIndex, pg.isLastPage)}
              </>
            ) : (
              <>
                {renderCompactSubsequentHeader(pg.pageNumber, totalPages)}
                {renderTable(pg.items, pg.startIndex, pg.isLastPage)}
              </>
            )}
          </div>

          {/* FINANCIALS, SIGNATURES & STICKY FOOTER */}
          {pg.isLastPage ? (
            renderFinancialsAndFooter(pg.pageNumber, totalPages)
          ) : (
            renderPageFooterOnly(pg.pageNumber, totalPages)
          )}
        </div>
      ))}
    </div>
  )
}
