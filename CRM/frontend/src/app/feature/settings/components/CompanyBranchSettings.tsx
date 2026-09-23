"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, Plus, Pencil, Trash2, Shield, MapPin, Phone, Mail, 
  User, Check, X, AlertTriangle, Layers, ChevronDown, ChevronRight, ChevronLeft,
  Globe, CreditCard, FileText, QrCode, Sparkles, Lock, UploadCloud,
  Image as ImageIcon, CheckCircle2
} from "lucide-react"
import { useAuthStore, Company, Branch, SubBranch, getCompanyFullName, getCompanyLogoUrl, isMatchingCompany } from "@/store/useAuthStore"
import { getUsers } from "@/app/feature/users/services/userService"
import { executeWithFeedback, useActionFeedbackStore } from "@/store/useActionFeedbackStore"
import { usePermissionStore, ALL_APP_MODULES, CLEAN_MODULE_CATEGORIES } from "@/store/usePermissionStore"

export function CompanyBranchSettings() {
  const { 
    user, 
    companies, 
    branches, 
    subBranches,
    fetchCompanies, 
    fetchBranches, 
    fetchSubBranches,
    addCompany, 
    updateCompany,
    deleteCompany, 
    addBranch, 
    updateBranch, 
    deleteBranch,
    addSubBranch,
    updateSubBranch,
    deleteSubBranch,
    activeCompanyId,
    switchCompany
  } = useAuthStore()

  const normRole = (user?.role || "").toLowerCase().trim()
  const isSuperAdmin = normRole === "super admin" || normRole.includes("super")
  const isAdmin = !isSuperAdmin && (normRole === "admin" || normRole.includes("admin"))

  // Filter companies visible for this user (Clients only see their own created entities)
  const isClientRole = normRole.includes("client")
  const visibleCompanies = React.useMemo(() => {
    let list = companies
    if (!isSuperAdmin) {
      if (isClientRole && user) {
        const uId = String(user.id || "").toLowerCase().trim()
        const uEmail = (user.email || "").toLowerCase().trim()
        list = companies.filter((c: any) => {
          const cOwnerId = String(c.clientId || c.createdById || c.ownerId || "").toLowerCase().trim()
          const cOwnerEmail = String(c.clientEmail || c.createdByEmail || c.ownerEmail || "").toLowerCase().trim()
          return (uId && cOwnerId === uId) || (uEmail && cOwnerEmail === uEmail)
        })
      } else {
        const adminCompanyIds = (user?.companyIds && user.companyIds.length > 0)
          ? user.companyIds
          : (user?.companyId ? [user.companyId] : ["tech"])
        list = companies.filter((c) => adminCompanyIds.some(id => isMatchingCompany(c, id)))
      }
    }

    const seen = new Set<string>()
    return list.filter(c => {
      const canon = isMatchingCompany(c, 'consultancy') ? 'consultancy' : (isMatchingCompany(c, 'tech') ? 'tech' : null)
      if (!canon || seen.has(canon)) return false
      seen.add(canon)
      return true
    })
  }, [isSuperAdmin, isClientRole, companies, user])

  const [expandedCompanyIds, setExpandedCompanyIds] = React.useState<string[]>([])
  const [allUsers, setAllUsers] = React.useState<any[]>([])

  // Modal States
  const COMPANY_TABS_LIST: Array<"basic" | "invoice" | "tax" | "contact" | "bank" | "smtp" | "modules"> = React.useMemo(() => {
    const list: Array<"basic" | "invoice" | "tax" | "contact" | "bank" | "smtp" | "modules"> = [
      "basic",
      "invoice",
      "tax",
      "contact",
      "bank",
      "smtp"
    ]
    if (isSuperAdmin) {
      list.push("modules")
    }
    return list
  }, [isSuperAdmin])
  const [isCompanyModalOpen, setIsCompanyModalOpen] = React.useState(false)
  const [companyModalTab, setCompanyModalTab] = React.useState<"basic" | "invoice" | "tax" | "contact" | "bank" | "smtp" | "modules">("basic")
  const [editingCompany, setEditingCompany] = React.useState<Company | null>(null)
  const { getEnabledModulesForCompany, setCompanyEnabledModules } = usePermissionStore()
  const [companyEnabledModulesState, setCompanyEnabledModulesState] = React.useState<string[]>([...ALL_APP_MODULES])

  // Company Form States (All invoice & enterprise configuration fields)
  const [companyBrandName, setCompanyBrandName] = React.useState("SAAMPARK")
  const [companyDivisionName, setCompanyDivisionName] = React.useState("")
  const [companyName, setCompanyName] = React.useState("")
  const [companySubtitle, setCompanySubtitle] = React.useState("")
  const [companySlug, setCompanySlug] = React.useState("")
  const [companyLogo, setCompanyLogo] = React.useState("🏢")
  const [companyLogoUrl, setCompanyLogoUrl] = React.useState("")
  const [companyCurrency, setCompanyCurrency] = React.useState("INR")
  const [companyCurrencySymbol, setCompanyCurrencySymbol] = React.useState("₹")

  // Legal & Tax
  const [companyCin, setCompanyCin] = React.useState("")
  const [companyGstin, setCompanyGstin] = React.useState("")
  const [companyPan, setCompanyPan] = React.useState("")

  // Address & Contact
  const [companyAddress, setCompanyAddress] = React.useState("")
  const [companyPhone, setCompanyPhone] = React.useState("")
  const [companyEmail, setCompanyEmail] = React.useState("")
  const [companyWebsite, setCompanyWebsite] = React.useState("")

  // Banking & UPI (Default/Fallback)
  const [companyUpiId, setCompanyUpiId] = React.useState("")
  const [companyAccountHolder, setCompanyAccountHolder] = React.useState("")
  const [companyBankName, setCompanyBankName] = React.useState("")
  const [companyAccountNumber, setCompanyAccountNumber] = React.useState("")
  const [companyIfscCode, setCompanyIfscCode] = React.useState("")
  const [companyBankBranch, setCompanyBankBranch] = React.useState("")
  const [companyPaymentQrUrl, setCompanyPaymentQrUrl] = React.useState("")

  // Company Dual GST & Non-GST Bank Profiles
  const [companyBankProfileTab, setCompanyBankProfileTab] = React.useState<"gst" | "nongst">("gst")
  const [companyGstBankName, setCompanyGstBankName] = React.useState("")
  const [companyGstAccountHolder, setCompanyGstAccountHolder] = React.useState("")
  const [companyGstAccountNumber, setCompanyGstAccountNumber] = React.useState("")
  const [companyGstIfscCode, setCompanyGstIfscCode] = React.useState("")
  const [companyGstBankBranch, setCompanyGstBankBranch] = React.useState("")
  const [companyGstUpiId, setCompanyGstUpiId] = React.useState("")
  const [companyGstPaymentQrUrl, setCompanyGstPaymentQrUrl] = React.useState("")

  const [companyNongstBankName, setCompanyNongstBankName] = React.useState("")
  const [companyNongstAccountHolder, setCompanyNongstAccountHolder] = React.useState("")
  const [companyNongstAccountNumber, setCompanyNongstAccountNumber] = React.useState("")
  const [companyNongstIfscCode, setCompanyNongstIfscCode] = React.useState("")
  const [companyNongstBankBranch, setCompanyNongstBankBranch] = React.useState("")
  const [companyNongstUpiId, setCompanyNongstUpiId] = React.useState("")
  const [companyNongstPaymentQrUrl, setCompanyNongstPaymentQrUrl] = React.useState("")

  // Terms & Signatory
  const [companyTermsConditions, setCompanyTermsConditions] = React.useState("")
  const [companySignatoryName, setCompanySignatoryName] = React.useState("")
  const [companySignatoryDesignation, setCompanySignatoryDesignation] = React.useState("")
  const [companySignatureImageUrl, setCompanySignatureImageUrl] = React.useState("")
  const [companyStampImageUrl, setCompanyStampImageUrl] = React.useState("")

  // SMTP & Email Dispatch Configurations (Per Company)
  const [companySmtpPreset, setCompanySmtpPreset] = React.useState<"gmail" | "zoho" | "outlook" | "custom">("gmail")
  const [companySmtpHost, setCompanySmtpHost] = React.useState("smtp.gmail.com")
  const [companySmtpPort, setCompanySmtpPort] = React.useState("587")
  const [companySmtpSecure, setCompanySmtpSecure] = React.useState(false)
  const [companySmtpUser, setCompanySmtpUser] = React.useState("")
  const [companySmtpPass, setCompanySmtpPass] = React.useState("")
  const [companySmtpFromName, setCompanySmtpFromName] = React.useState("")
  const [companySmtpFromEmail, setCompanySmtpFromEmail] = React.useState("")
  const [showCompanySmtpPass, setShowCompanySmtpPass] = React.useState(false)
  const [isTestingCompanySmtp, setIsTestingCompanySmtp] = React.useState(false)
  const [companySmtpTestResult, setCompanySmtpTestResult] = React.useState<{ success?: boolean; message?: string } | null>(null)
  const [companyTestEmail, setCompanyTestEmail] = React.useState("")

  // Branch Modal States (5 Full Tabs)
  const BRANCH_TABS_LIST: Array<"basic" | "tax" | "contact" | "bank" | "signature"> = React.useMemo(() => [
    "basic",
    "tax",
    "contact",
    "bank",
    "signature"
  ], [])
  const [isBranchModalOpen, setIsBranchModalOpen] = React.useState(false)
  const [branchModalTab, setBranchModalTab] = React.useState<"basic" | "tax" | "contact" | "bank" | "signature">("basic")
  const [targetCompanyIdForBranch, setTargetCompanyIdForBranch] = React.useState<string>("tech")
  const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null)
  
  // 1. Identity & Branding
  const [branchName, setBranchName] = React.useState("")
  const [branchCode, setBranchCode] = React.useState("")
  const [branchBrandName, setBranchBrandName] = React.useState("")
  const [branchDivisionName, setBranchDivisionName] = React.useState("")
  const [branchSubtitle, setBranchSubtitle] = React.useState("")
  const [branchLogoUrl, setBranchLogoUrl] = React.useState("")
  const [branchManager, setBranchManager] = React.useState("")
  const [branchManagerPhone, setBranchManagerPhone] = React.useState("")
  const [branchManagerEmail, setBranchManagerEmail] = React.useState("")
  const [branchStatus, setBranchStatus] = React.useState<"Active" | "Inactive">("Active")

  // 2. Legal & Tax
  const [branchGstin, setBranchGstin] = React.useState("")
  const [branchPan, setBranchPan] = React.useState("")
  const [branchCin, setBranchCin] = React.useState("")
  const [branchMsmeReg, setBranchMsmeReg] = React.useState("")

  // 3. Address & Contact
  const [branchAddress, setBranchAddress] = React.useState("")
  const [branchCity, setBranchCity] = React.useState("")
  const [branchState, setBranchState] = React.useState("")
  const [branchZip, setBranchZip] = React.useState("")
  const [branchCountry, setBranchCountry] = React.useState("India")
  const [branchPhone, setBranchPhone] = React.useState("")
  const [branchEmail, setBranchEmail] = React.useState("")
  const [branchWebsite, setBranchWebsite] = React.useState("")

  // 4. Bank & UPI Pay (Default / Fallback)
  const [branchBankName, setBranchBankName] = React.useState("")
  const [branchAccountHolder, setBranchAccountHolder] = React.useState("")
  const [branchAccountNumber, setBranchAccountNumber] = React.useState("")
  const [branchIfscCode, setBranchIfscCode] = React.useState("")
  const [branchBankBranch, setBranchBankBranch] = React.useState("")
  const [branchUpiId, setBranchUpiId] = React.useState("")
  const [branchPaymentQrUrl, setBranchPaymentQrUrl] = React.useState("")
  const [branchTermsConditions, setBranchTermsConditions] = React.useState("")

  // Branch Dual GST & Non-GST Bank Profiles
  const [branchBankProfileTab, setBranchBankProfileTab] = React.useState<"gst" | "nongst">("gst")
  const [branchGstBankName, setBranchGstBankName] = React.useState("")
  const [branchGstAccountHolder, setBranchGstAccountHolder] = React.useState("")
  const [branchGstAccountNumber, setBranchGstAccountNumber] = React.useState("")
  const [branchGstIfscCode, setBranchGstIfscCode] = React.useState("")
  const [branchGstBankBranch, setBranchGstBankBranch] = React.useState("")
  const [branchGstUpiId, setBranchGstUpiId] = React.useState("")
  const [branchGstPaymentQrUrl, setBranchGstPaymentQrUrl] = React.useState("")

  const [branchNongstBankName, setBranchNongstBankName] = React.useState("")
  const [branchNongstAccountHolder, setBranchNongstAccountHolder] = React.useState("")
  const [branchNongstAccountNumber, setBranchNongstAccountNumber] = React.useState("")
  const [branchNongstIfscCode, setBranchNongstIfscCode] = React.useState("")
  const [branchNongstBankBranch, setBranchNongstBankBranch] = React.useState("")
  const [branchNongstUpiId, setBranchNongstUpiId] = React.useState("")
  const [branchNongstPaymentQrUrl, setBranchNongstPaymentQrUrl] = React.useState("")

  // 5. Signature & Stamp
  const [branchSignatoryName, setBranchSignatoryName] = React.useState("")
  const [branchSignatoryDesignation, setBranchSignatoryDesignation] = React.useState("")
  const [branchSignatureImageUrl, setBranchSignatureImageUrl] = React.useState("")
  const [branchStampImageUrl, setBranchStampImageUrl] = React.useState("")

  // Sub-Branch Modal & Form States (5 Full Tabs)
  const SUB_BRANCH_TABS_LIST: Array<"basic" | "tax" | "contact" | "bank" | "signature"> = React.useMemo(() => [
    "basic",
    "tax",
    "contact",
    "bank",
    "signature"
  ], [])
  const [isSubBranchModalOpen, setIsSubBranchModalOpen] = React.useState(false)
  const [subBranchModalTab, setSubBranchModalTab] = React.useState<"basic" | "tax" | "contact" | "bank" | "signature">("basic")
  const [editingSubBranch, setEditingSubBranch] = React.useState<SubBranch | null>(null)
  const [subBranchParentBranchId, setSubBranchParentBranchId] = React.useState<string>("")
  const [subBranchCompanyId, setSubBranchCompanyId] = React.useState<string>("tech")

  // 1. Identity & Branding
  const [subBranchName, setSubBranchName] = React.useState("")
  const [subBranchCode, setSubBranchCode] = React.useState("")
  const [subBranchBrandName, setSubBranchBrandName] = React.useState("")
  const [subBranchDivisionName, setSubBranchDivisionName] = React.useState("")
  const [subBranchSubtitle, setSubBranchSubtitle] = React.useState("")
  const [subBranchPartnerName, setSubBranchPartnerName] = React.useState("")
  const [subBranchPartnerPhone, setSubBranchPartnerPhone] = React.useState("")
  const [subBranchPartnerEmail, setSubBranchPartnerEmail] = React.useState("")
  const [subBranchRevenueSharePct, setSubBranchRevenueSharePct] = React.useState<number>(30)
  const [subBranchPartnerType, setSubBranchPartnerType] = React.useState<"Franchise Partner" | "Agency Partner" | "Satellite Office" | "Regional Associate">("Franchise Partner")
  const [subBranchStatus, setSubBranchStatus] = React.useState<"Active" | "Inactive">("Active")

  // 2. Legal & Tax
  const [subBranchGstin, setSubBranchGstin] = React.useState("")
  const [subBranchPan, setSubBranchPan] = React.useState("")
  const [subBranchCin, setSubBranchCin] = React.useState("")
  const [subBranchMsmeReg, setSubBranchMsmeReg] = React.useState("")

  // 3. Address & Contact
  const [subBranchAddress, setSubBranchAddress] = React.useState("")
  const [subBranchCity, setSubBranchCity] = React.useState("")
  const [subBranchState, setSubBranchState] = React.useState("")
  const [subBranchZip, setSubBranchZip] = React.useState("")
  const [subBranchCountry, setSubBranchCountry] = React.useState("India")
  const [subBranchPhone, setSubBranchPhone] = React.useState("")
  const [subBranchEmail, setSubBranchEmail] = React.useState("")
  const [subBranchWebsite, setSubBranchWebsite] = React.useState("")

  // 4. Bank & UPI Pay (Default / Fallback)
  const [subBranchAccountHolder, setSubBranchAccountHolder] = React.useState("")
  const [subBranchBankName, setSubBranchBankName] = React.useState("")
  const [subBranchAccountNumber, setSubBranchAccountNumber] = React.useState("")
  const [subBranchIfscCode, setSubBranchIfscCode] = React.useState("")
  const [subBranchBankBranch, setSubBranchBankBranch] = React.useState("")
  const [subBranchUpiId, setSubBranchUpiId] = React.useState("")
  const [subBranchPaymentQrUrl, setSubBranchPaymentQrUrl] = React.useState("")
  const [subBranchTermsConditions, setSubBranchTermsConditions] = React.useState("")

  // Sub-Branch Dual GST & Non-GST Bank Profiles
  const [subBranchBankProfileTab, setSubBranchBankProfileTab] = React.useState<"gst" | "nongst">("gst")
  const [subBranchGstBankName, setSubBranchGstBankName] = React.useState("")
  const [subBranchGstAccountHolder, setSubBranchGstAccountHolder] = React.useState("")
  const [subBranchGstAccountNumber, setSubBranchGstAccountNumber] = React.useState("")
  const [subBranchGstIfscCode, setSubBranchGstIfscCode] = React.useState("")
  const [subBranchGstBankBranch, setSubBranchGstBankBranch] = React.useState("")
  const [subBranchGstUpiId, setSubBranchGstUpiId] = React.useState("")
  const [subBranchGstPaymentQrUrl, setSubBranchGstPaymentQrUrl] = React.useState("")

  const [subBranchNongstBankName, setSubBranchNongstBankName] = React.useState("")
  const [subBranchNongstAccountHolder, setSubBranchNongstAccountHolder] = React.useState("")
  const [subBranchNongstAccountNumber, setSubBranchNongstAccountNumber] = React.useState("")
  const [subBranchNongstIfscCode, setSubBranchNongstIfscCode] = React.useState("")
  const [subBranchNongstBankBranch, setSubBranchNongstBankBranch] = React.useState("")
  const [subBranchNongstUpiId, setSubBranchNongstUpiId] = React.useState("")
  const [subBranchNongstPaymentQrUrl, setSubBranchNongstPaymentQrUrl] = React.useState("")

  // 5. Signature & Stamp
  const [subBranchLogoUrl, setSubBranchLogoUrl] = React.useState("")
  const [subBranchSignatoryName, setSubBranchSignatoryName] = React.useState("")
  const [subBranchSignatoryDesignation, setSubBranchSignatoryDesignation] = React.useState("")
  const [subBranchSignatureImageUrl, setSubBranchSignatureImageUrl] = React.useState("")
  const [subBranchStampImageUrl, setSubBranchStampImageUrl] = React.useState("")

  // Refs for file uploads
  const logoFileInputRef = React.useRef<HTMLInputElement>(null)
  const signatureFileInputRef = React.useRef<HTMLInputElement>(null)
  const companyStampInputRef = React.useRef<HTMLInputElement>(null)
  const qrFileInputRef = React.useRef<HTMLInputElement>(null)
  const companyGstQrInputRef = React.useRef<HTMLInputElement>(null)
  const companyNongstQrInputRef = React.useRef<HTMLInputElement>(null)

  const branchSignatureInputRef = React.useRef<HTMLInputElement>(null)
  const branchStampInputRef = React.useRef<HTMLInputElement>(null)
  const branchQrInputRef = React.useRef<HTMLInputElement>(null)
  const branchGstQrInputRef = React.useRef<HTMLInputElement>(null)
  const branchNongstQrInputRef = React.useRef<HTMLInputElement>(null)

  const subBranchLogoInputRef = React.useRef<HTMLInputElement>(null)
  const subBranchSignatureInputRef = React.useRef<HTMLInputElement>(null)
  const subBranchStampInputRef = React.useRef<HTMLInputElement>(null)
  const subBranchQrInputRef = React.useRef<HTMLInputElement>(null)
  const subBranchGstQrInputRef = React.useRef<HTMLInputElement>(null)
  const subBranchNongstQrInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetchCompanies()
    fetchBranches()
    fetchSubBranches()
    getUsers("all").then((list) => setAllUsers(list || []))
  }, [fetchCompanies, fetchBranches, fetchSubBranches])

  // Automatically expand first company
  React.useEffect(() => {
    if (visibleCompanies.length > 0 && expandedCompanyIds.length === 0) {
      setExpandedCompanyIds([visibleCompanies[0].id])
    }
  }, [visibleCompanies])

  const toggleCompanyExpand = (compId: string) => {
    setExpandedCompanyIds((prev) =>
      prev.includes(compId) ? prev.filter((id) => id !== compId) : [...prev, compId]
    )
  }

  // Handle Logo Upload with ImgBB
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert("Logo image size should not exceed 10MB.")
      return
    }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "company_logo", 800)
      if (res && res.success && res.url) {
        setCompanyLogoUrl(res.url)
      } else {
        alert("Failed to upload logo to ImgBB cloud.")
      }
    } catch (err: any) {
      alert("Upload error: " + err.message)
    }
  }

  // Handle Signature Upload with ImgBB
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert("Signature image size should not exceed 10MB.")
      return
    }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "company_signature", 800)
      if (res && res.success && res.url) {
        setCompanySignatureImageUrl(res.url)
      } else {
        alert("Failed to upload signature to ImgBB cloud.")
      }
    } catch (err: any) {
      alert("Upload error: " + err.message)
    }
  }

  // Handle Company Stamp / Seal Upload with ImgBB
  const handleCompanyStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert("Company stamp image size should not exceed 10MB.")
      return
    }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "company_stamp", 800)
      if (res && res.success && res.url) {
        setCompanyStampImageUrl(res.url)
      } else {
        alert("Failed to upload company stamp to ImgBB cloud.")
      }
    } catch (err: any) {
      alert("Upload error: " + err.message)
    }
  }

  // Handle QR Image Uploads with ImgBB / Local Base64
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert("QR Code image size should not exceed 5MB."); return; }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCompanyPaymentQrUrl(reader.result)
        if (companyBankProfileTab === "gst") setCompanyGstPaymentQrUrl(reader.result)
        else setCompanyNongstPaymentQrUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCompanyGstQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("QR Code image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "company_gst_qr", 800)
      if (res && res.success && res.url) {
        setCompanyGstPaymentQrUrl(res.url)
        setCompanyPaymentQrUrl(res.url)
      } else alert("Failed to upload GST QR to cloud.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  const handleCompanyNongstQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("QR Code image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "company_nongst_qr", 800)
      if (res && res.success && res.url) {
        setCompanyNongstPaymentQrUrl(res.url)
      } else alert("Failed to upload Non-GST QR to cloud.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  const handleBranchGstQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("QR Code image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "branch_gst_qr", 800)
      if (res && res.success && res.url) {
        setBranchGstPaymentQrUrl(res.url)
        setBranchPaymentQrUrl(res.url)
      } else alert("Failed to upload branch GST QR to cloud.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  const handleBranchNongstQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("QR Code image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "branch_nongst_qr", 800)
      if (res && res.success && res.url) {
        setBranchNongstPaymentQrUrl(res.url)
      } else alert("Failed to upload branch Non-GST QR to cloud.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  const handleSubBranchGstQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("QR Code image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "subbranch_gst_qr", 800)
      if (res && res.success && res.url) {
        setSubBranchGstPaymentQrUrl(res.url)
        setSubBranchPaymentQrUrl(res.url)
      } else alert("Failed to upload sub-branch GST QR to cloud.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  const handleSubBranchNongstQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("QR Code image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "subbranch_nongst_qr", 800)
      if (res && res.success && res.url) {
        setSubBranchNongstPaymentQrUrl(res.url)
      } else alert("Failed to upload sub-branch Non-GST QR to cloud.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  // Copy GST to Non-GST Helpers
  const handleCopyCompanyGstToNongst = () => {
    setCompanyNongstBankName(companyGstBankName || companyBankName)
    setCompanyNongstAccountHolder(companyGstAccountHolder || companyAccountHolder)
    setCompanyNongstAccountNumber(companyGstAccountNumber || companyAccountNumber)
    setCompanyNongstIfscCode(companyGstIfscCode || companyIfscCode)
    setCompanyNongstBankBranch(companyGstBankBranch || companyBankBranch)
    setCompanyNongstUpiId(companyGstUpiId || companyUpiId)
    setCompanyNongstPaymentQrUrl(companyGstPaymentQrUrl || companyPaymentQrUrl)
  }

  const handleCopyBranchGstToNongst = () => {
    setBranchNongstBankName(branchGstBankName || branchBankName)
    setBranchNongstAccountHolder(branchGstAccountHolder || branchAccountHolder)
    setBranchNongstAccountNumber(branchGstAccountNumber || branchAccountNumber)
    setBranchNongstIfscCode(branchGstIfscCode || branchIfscCode)
    setBranchNongstBankBranch(branchGstBankBranch || branchBankBranch)
    setBranchNongstUpiId(branchGstUpiId || branchUpiId)
    setBranchNongstPaymentQrUrl(branchGstPaymentQrUrl || branchPaymentQrUrl)
  }

  const handleCopySubBranchGstToNongst = () => {
    setSubBranchNongstBankName(subBranchGstBankName || subBranchBankName)
    setSubBranchNongstAccountHolder(subBranchGstAccountHolder || subBranchAccountHolder)
    setSubBranchNongstAccountNumber(subBranchGstAccountNumber || subBranchAccountNumber)
    setSubBranchNongstIfscCode(subBranchGstIfscCode || subBranchIfscCode)
    setSubBranchNongstBankBranch(subBranchGstBankBranch || subBranchBankBranch)
    setSubBranchNongstUpiId(subBranchGstUpiId || subBranchUpiId)
    setSubBranchNongstPaymentQrUrl(subBranchGstPaymentQrUrl || subBranchPaymentQrUrl)
  }

  // Sync composed company name when brand or division changes
  const updateBrandOrDivision = (newBrand: string, newDivision: string) => {
    setCompanyBrandName(newBrand)
    setCompanyDivisionName(newDivision)
    const composed = [newBrand.trim(), newDivision.trim()].filter(Boolean).join(" ")
    setCompanyName(composed)
    if (!editingCompany) {
      const generatedSlug = (newDivision.trim() || newBrand.trim())
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      setCompanySlug(generatedSlug)
    }
  }

  // ── COMPANY HANDLERS (Super Admin Only) ──────────────────────────────────────
  const handleOpenCreateCompany = () => {
    if (!isSuperAdmin) return
    setEditingCompany(null)
    setCompanyModalTab("basic")
    setCompanyBrandName("SAAMPARK")
    setCompanyDivisionName("")
    setCompanyName("SAAMPARK")
    setCompanySubtitle("")
    setCompanySlug("saampark")
    setCompanyLogo("🏢")
    setCompanyLogoUrl("/saampark-logo.png")
    setCompanyCurrency("INR")
    setCompanyCurrencySymbol("₹")
    setCompanyCin("")
    setCompanyGstin("")
    setCompanyPan("")
    setCompanyAddress("")
    setCompanyPhone("")
    setCompanyEmail("")
    setCompanyWebsite("")
    setCompanyUpiId("")
    setCompanyAccountHolder("")
    setCompanyBankName("")
    setCompanyAccountNumber("")
    setCompanyIfscCode("")
    setCompanyBankBranch("")
    setCompanyPaymentQrUrl("")
    setCompanyBankProfileTab("gst")
    setCompanyGstBankName("")
    setCompanyGstAccountHolder("")
    setCompanyGstAccountNumber("")
    setCompanyGstIfscCode("")
    setCompanyGstBankBranch("")
    setCompanyGstUpiId("")
    setCompanyGstPaymentQrUrl("")
    setCompanyNongstBankName("")
    setCompanyNongstAccountHolder("")
    setCompanyNongstAccountNumber("")
    setCompanyNongstIfscCode("")
    setCompanyNongstBankBranch("")
    setCompanyNongstUpiId("")
    setCompanyNongstPaymentQrUrl("")
    setCompanyTermsConditions("1. E.& O.E.\n2. Total payment due within due date to avoid suspension/cancellation.\n3. Please include invoice number in payment notes.\n4. All disputes subject to jurisdiction.")
    setCompanySignatoryName("Authorized Signatory")
    setCompanySignatoryDesignation("Managing Director")
    setCompanySignatureImageUrl("")
    setCompanyStampImageUrl("")
    setCompanySmtpPreset("gmail")
    setCompanySmtpHost("smtp.gmail.com")
    setCompanySmtpPort("587")
    setCompanySmtpSecure(false)
    setCompanySmtpUser("")
    setCompanySmtpPass("")
    setCompanySmtpFromName("SAAMPARK")
    setCompanySmtpFromEmail("")
    setCompanySmtpTestResult(null)
    setCompanyTestEmail("")
    setIsCompanyModalOpen(true)
  }

  const handleOpenEditCompany = (company: Company) => {
    if (!isSuperAdmin) return
    setEditingCompany(company)
    setCompanyModalTab("basic")

    const brand = (company.brand_name || "SAAMPARK").trim()
    const division = (company.division_name || "").trim()
    
    setCompanyBrandName(brand)
    setCompanyDivisionName(division)
    setCompanyName(company.name || [brand, division].filter(Boolean).join(" "))
    setCompanySubtitle(company.subtitle || "")
    setCompanySlug(company.slug || company.id || "")
    setCompanyLogo(company.logo || "🏢")
    setCompanyLogoUrl(company.logo_url || "")
    setCompanyCurrency(company.currency || "INR")
    setCompanyCurrencySymbol(company.currency_symbol || "₹")
    setCompanyCin(company.cin || "")
    setCompanyGstin(company.gstin || "")
    setCompanyPan(company.pan || "")
    setCompanyAddress(company.address || "")
    setCompanyPhone(company.phone || "")
    setCompanyEmail(company.email || "")
    setCompanyWebsite(company.website || "")
    setCompanyUpiId(company.upi_id || "")
    setCompanyAccountHolder(company.account_holder || "")
    setCompanyBankName(company.bank_name || "")
    setCompanyAccountNumber(company.account_number || "")
    setCompanyIfscCode(company.ifsc_code || "")
    setCompanyBankBranch(company.bank_branch || "")
    setCompanyPaymentQrUrl(company.payment_qr_url || "")

    // Dual GST and Non-GST Profiles
    setCompanyBankProfileTab("gst")
    setCompanyGstBankName(company.gst_bank_name || company.bank_name || "")
    setCompanyGstAccountHolder(company.gst_account_holder || company.account_holder || "")
    setCompanyGstAccountNumber(company.gst_account_number || company.account_number || "")
    setCompanyGstIfscCode(company.gst_ifsc_code || company.ifsc_code || "")
    setCompanyGstBankBranch(company.gst_bank_branch || company.bank_branch || "")
    setCompanyGstUpiId(company.gst_upi_id || company.upi_id || "")
    setCompanyGstPaymentQrUrl(company.gst_payment_qr_url || company.payment_qr_url || "")

    setCompanyNongstBankName(company.nongst_bank_name || company.bank_name || "")
    setCompanyNongstAccountHolder(company.nongst_account_holder || company.account_holder || "")
    setCompanyNongstAccountNumber(company.nongst_account_number || company.account_number || "")
    setCompanyNongstIfscCode(company.nongst_ifsc_code || company.ifsc_code || "")
    setCompanyNongstBankBranch(company.nongst_bank_branch || company.bank_branch || "")
    setCompanyNongstUpiId(company.nongst_upi_id || company.upi_id || "")
    setCompanyNongstPaymentQrUrl(company.nongst_payment_qr_url || company.payment_qr_url || "")

    setCompanyTermsConditions(company.terms_conditions || "")
    setCompanySignatoryName(company.signatory_name || "Authorized Signatory")
    setCompanySignatoryDesignation(company.signatory_designation || "")
    setCompanySignatureImageUrl(company.signature_image_url || "")
    setCompanyStampImageUrl(company.stamp_image_url || "")

    // Load Company SMTP
    const host = company.smtp_host || "smtp.gmail.com"
    const port = String(company.smtp_port || "587")
    setCompanySmtpHost(host)
    setCompanySmtpPort(port)
    setCompanySmtpSecure(!!company.smtp_secure || port === "465")
    setCompanySmtpUser(company.smtp_user || "")
    setCompanySmtpPass(company.smtp_pass || "")
    setCompanySmtpFromName(company.smtp_from_name || company.name || "")
    setCompanySmtpFromEmail(company.smtp_from_email || company.email || "")
    if (host.includes("gmail")) setCompanySmtpPreset("gmail")
    else if (host.includes("zoho")) setCompanySmtpPreset("zoho")
    else if (host.includes("office365") || host.includes("outlook")) setCompanySmtpPreset("outlook")
    else setCompanySmtpPreset("custom")
    setCompanySmtpTestResult(null)
    setCompanyTestEmail(company.smtp_user || "")

    // Load Company Modules
    const compModules = getEnabledModulesForCompany(company.id || company.slug)
    setCompanyEnabledModulesState(compModules)

    setIsCompanyModalOpen(true)
  }

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSuperAdmin) {
      alert("Only Super Admin can modify or create company records.")
      return
    }

    const brand = companyBrandName.trim() || "SAAMPARK"
    const division = companyDivisionName.trim()
    const subtitle = companySubtitle.trim()

    const finalName = [brand, division].filter(Boolean).join(" ") || companyName.trim() || brand || "SAAMPARK"
    if (!finalName) return

    const slug = companySlug.trim() || finalName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const payload: Partial<Company> = {
      name: finalName,
      brand_name: brand,
      division_name: division,
      subtitle: subtitle,
      slug,
      logo: companyLogo || "🏢",
      logo_url: companyLogoUrl.trim(),
      currency: companyCurrency.trim() || "INR",
      currency_symbol: companyCurrencySymbol.trim() || "₹",
      cin: companyCin.trim(),
      gstin: companyGstin.trim(),
      pan: companyPan.trim(),
      address: companyAddress.trim(),
      phone: companyPhone.trim(),
      email: companyEmail.trim(),
      website: companyWebsite.trim(),
      // Base/Fallback Banking
      upi_id: (companyGstUpiId || companyUpiId || companyNongstUpiId).trim(),
      account_holder: (companyGstAccountHolder || companyAccountHolder || companyNongstAccountHolder).trim(),
      bank_name: (companyGstBankName || companyBankName || companyNongstBankName).trim(),
      account_number: (companyGstAccountNumber || companyAccountNumber || companyNongstAccountNumber).trim(),
      ifsc_code: (companyGstIfscCode || companyIfscCode || companyNongstIfscCode).trim(),
      bank_branch: (companyGstBankBranch || companyBankBranch || companyNongstBankBranch).trim(),
      payment_qr_url: companyGstPaymentQrUrl || companyPaymentQrUrl || companyNongstPaymentQrUrl,
      // Distinct GST Banking Profile
      gst_bank_name: companyGstBankName.trim(),
      gst_account_holder: companyGstAccountHolder.trim(),
      gst_account_number: companyGstAccountNumber.trim(),
      gst_ifsc_code: companyGstIfscCode.trim().toUpperCase(),
      gst_bank_branch: companyGstBankBranch.trim(),
      gst_upi_id: companyGstUpiId.trim(),
      gst_payment_qr_url: companyGstPaymentQrUrl,
      // Distinct Non-GST Banking Profile
      nongst_bank_name: companyNongstBankName.trim(),
      nongst_account_holder: companyNongstAccountHolder.trim(),
      nongst_account_number: companyNongstAccountNumber.trim(),
      nongst_ifsc_code: companyNongstIfscCode.trim().toUpperCase(),
      nongst_bank_branch: companyNongstBankBranch.trim(),
      nongst_upi_id: companyNongstUpiId.trim(),
      nongst_payment_qr_url: companyNongstPaymentQrUrl,
      terms_conditions: companyTermsConditions.trim(),
      signatory_name: companySignatoryName.trim(),
      signatory_designation: companySignatoryDesignation.trim(),
      signature_image_url: companySignatureImageUrl.trim(),
      stamp_image_url: companyStampImageUrl.trim(),
      smtp_host: companySmtpHost.trim() || "smtp.gmail.com",
      smtp_port: companySmtpPort.trim() || "587",
      smtp_secure: companySmtpSecure,
      smtp_user: companySmtpUser.trim(),
      smtp_pass: companySmtpPass.trim(),
      smtp_from_name: companySmtpFromName.trim() || finalName,
      smtp_from_email: companySmtpFromEmail.trim() || companySmtpUser.trim(),
      ...(isClientRole && user ? {
        clientId: user.id,
        createdById: user.id,
        createdByEmail: user.email,
        clientEmail: user.email,
      } : {}),
    }

    const isEdit = !!editingCompany
    const targetCompId = editingCompany ? (editingCompany.id || editingCompany.slug || slug) : slug

    await executeWithFeedback(async () => {
      if (editingCompany) {
        await updateCompany(editingCompany.id, payload)
      } else {
        await addCompany(payload)
      }

      if (isSuperAdmin && companyEnabledModulesState.length > 0) {
        setCompanyEnabledModules(targetCompId, companyEnabledModulesState)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
          window.dispatchEvent(new Event('storage'))
        }
      }

      await fetchCompanies().catch(() => {})
      setIsCompanyModalOpen(false)
    }, {
      actionType: isEdit ? "update" : "create",
      loadingTitle: isEdit ? "Saving Company Profile..." : "Creating Entity...",
      loadingMsg: `Applying corporate branding, GST/Non-GST profiles, and tax details for ${finalName}...`,
      successTitle: isEdit ? "Company Profile Saved!" : "Company Created Successfully!",
      successMsg: `Company profile for ${finalName} with GST and Non-GST credentials has been saved.`,
      errorTitle: "Company Save Failed",
    })
  }

  const handleApplyCompanyPreset = (preset: "gmail" | "zoho" | "outlook" | "custom") => {
    setCompanySmtpPreset(preset)
    setCompanySmtpTestResult(null)
    if (preset === "gmail") {
      setCompanySmtpHost("smtp.gmail.com")
      setCompanySmtpPort("587")
      setCompanySmtpSecure(false)
    } else if (preset === "zoho") {
      setCompanySmtpHost("smtp.zoho.in")
      setCompanySmtpPort("465")
      setCompanySmtpSecure(true)
    } else if (preset === "outlook") {
      setCompanySmtpHost("smtp.office365.com")
      setCompanySmtpPort("587")
      setCompanySmtpSecure(false)
    }
  }

  const handleTestCompanySmtp = async () => {
    if (!companySmtpHost || !companySmtpPort || !companySmtpUser || !companySmtpPass) {
      alert("Please fill in SMTP host, port, username, and password before testing.")
      return
    }
    const targetRecipient = companyTestEmail.trim() || companySmtpUser.trim()
    if (!targetRecipient) {
      alert("Please enter a test recipient email address.")
      return
    }

    setIsTestingCompanySmtp(true)
    setCompanySmtpTestResult(null)

    try {
      const { api } = await import("@/lib/api")
      const res: any = await api.post("/email/test-smtp", {
        host: companySmtpHost,
        port: parseInt(companySmtpPort, 10),
        secure: companySmtpSecure,
        user: companySmtpUser,
        pass: companySmtpPass,
        from_name: companySmtpFromName || companyBrandName || "SAAMPARK",
        from_email: companySmtpFromEmail || companySmtpUser,
        test_recipient: targetRecipient
      })

      if (res?.data?.success || res?.status === 200 || res?.success) {
        setCompanySmtpTestResult({ success: true, message: `Handshake successful! Test dispatch sent to ${targetRecipient}` })
      } else {
        setCompanySmtpTestResult({ success: false, message: res?.data?.error || res?.error || "SMTP test failed. Please check credentials." })
      }
    } catch (err: any) {
      setCompanySmtpTestResult({ 
        success: false, 
        message: err?.response?.data?.error || err.message || "Failed to establish secure TLS SMTP connection." 
      })
    } finally {
      setIsTestingCompanySmtp(false)
    }
  }

  const handleDeleteCompany = async (compId: string, compName: string) => {
    if (!isSuperAdmin) {
      useActionFeedbackStore.getState().showError({
        title: "Permission Denied",
        message: "Only Super Admin can delete companies.",
        actionType: "delete",
      })
      return
    }
    await executeWithFeedback(async () => {
      await deleteCompany(compId)
      await fetchCompanies().catch(() => {})
    }, {
      actionType: "delete",
      loadingTitle: "Deleting Company...",
      loadingMsg: `Permanently removing ${compName} and associated branches...`,
      successTitle: "Company Deleted",
      successMsg: `Company ${compName} has been removed.`,
      errorTitle: "Delete Failed",
    })
  }

  // Branch Upload Handlers
  const handleBranchSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("Signature image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "branch_signature", 800)
      if (res && res.success && res.url) setBranchSignatureImageUrl(res.url)
      else alert("Failed to upload branch signature to ImgBB.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  const handleBranchStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("Stamp image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "branch_stamp", 800)
      if (res && res.success && res.url) setBranchStampImageUrl(res.url)
      else alert("Failed to upload branch stamp to ImgBB.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  const handleBranchQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("QR Code image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "branch_upi_qr", 800)
      if (res && res.success && res.url) {
        setBranchPaymentQrUrl(res.url)
        if (branchBankProfileTab === "gst") setBranchGstPaymentQrUrl(res.url)
        else setBranchNongstPaymentQrUrl(res.url)
      } else alert("Failed to upload branch UPI QR to ImgBB.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  // Sub-Branch Upload Handlers
  const handleSubBranchLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("Partner logo image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "subbranch_logo", 800)
      if (res && res.success && res.url) setSubBranchLogoUrl(res.url)
      else alert("Failed to upload partner logo to ImgBB.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  const handleSubBranchSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("Signature image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "subbranch_signature", 800)
      if (res && res.success && res.url) setSubBranchSignatureImageUrl(res.url)
      else alert("Failed to upload sub-branch signature to ImgBB.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  const handleSubBranchStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("Stamp image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "subbranch_stamp", 800)
      if (res && res.success && res.url) setSubBranchStampImageUrl(res.url)
      else alert("Failed to upload sub-branch stamp to ImgBB.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  const handleSubBranchQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("QR Code image size should not exceed 10MB."); return; }
    try {
      const { uploadToImgBB } = await import("@/lib/imgbbUpload")
      const res = await uploadToImgBB(file, "subbranch_upi_qr", 800)
      if (res && res.success && res.url) {
        setSubBranchPaymentQrUrl(res.url)
        if (subBranchBankProfileTab === "gst") setSubBranchGstPaymentQrUrl(res.url)
        else setSubBranchNongstPaymentQrUrl(res.url)
      } else alert("Failed to upload sub-branch UPI QR to ImgBB.")
    } catch (err: any) { alert("Upload error: " + err.message) }
  }

  // ── BRANCH HANDLERS (Admin & Super Admin) ────────────────────────────────────
  const handleOpenCreateBranch = (compId: string) => {
    setTargetCompanyIdForBranch(compId)
    setEditingBranch(null)
    setBranchModalTab("basic")
    setBranchName("")
    setBranchCode(`BR-${Math.floor(100 + Math.random() * 900)}`)
    setBranchBrandName("")
    setBranchDivisionName("")
    setBranchSubtitle("")
    setBranchLogoUrl("")
    setBranchManager("")
    setBranchManagerPhone("")
    setBranchManagerEmail("")
    setBranchGstin("")
    setBranchPan("")
    setBranchCin("")
    setBranchMsmeReg("")
    setBranchAddress("")
    setBranchCity("")
    setBranchState("")
    setBranchZip("")
    setBranchCountry("India")
    setBranchPhone("")
    setBranchEmail("")
    setBranchWebsite("")
    setBranchBankName("")
    setBranchAccountHolder("")
    setBranchAccountNumber("")
    setBranchIfscCode("")
    setBranchBankBranch("")
    setBranchUpiId("")
    setBranchPaymentQrUrl("")
    setBranchBankProfileTab("gst")
    setBranchGstBankName("")
    setBranchGstAccountHolder("")
    setBranchGstAccountNumber("")
    setBranchGstIfscCode("")
    setBranchGstBankBranch("")
    setBranchGstUpiId("")
    setBranchGstPaymentQrUrl("")
    setBranchNongstBankName("")
    setBranchNongstAccountHolder("")
    setBranchNongstAccountNumber("")
    setBranchNongstIfscCode("")
    setBranchNongstBankBranch("")
    setBranchNongstUpiId("")
    setBranchNongstPaymentQrUrl("")
    setBranchTermsConditions("")
    setBranchSignatoryName("")
    setBranchSignatoryDesignation("")
    setBranchSignatureImageUrl("")
    setBranchStampImageUrl("")
    setBranchStatus("Active")
    setIsBranchModalOpen(true)
  }

  const handleOpenEditBranch = (branch: Branch) => {
    setTargetCompanyIdForBranch(branch.companyId)
    setEditingBranch(branch)
    setBranchModalTab("basic")
    setBranchName(branch.name || "")
    setBranchCode(branch.code || "")
    setBranchBrandName(branch.brand_name || "")
    setBranchDivisionName(branch.division_name || "")
    setBranchSubtitle(branch.subtitle || "")
    setBranchLogoUrl(branch.logo_url || "")
    setBranchManager(branch.managerName || "")
    setBranchManagerPhone(branch.managerPhone || "")
    setBranchManagerEmail(branch.managerEmail || "")
    setBranchGstin(branch.gstin || "")
    setBranchPan(branch.pan || "")
    setBranchCin(branch.cin || "")
    setBranchMsmeReg(branch.msme_reg || "")
    setBranchAddress(branch.address || "")
    setBranchCity(branch.city || "")
    setBranchState(branch.state || "")
    setBranchZip(branch.zip || "")
    setBranchCountry(branch.country || "India")
    setBranchPhone(branch.phone || "")
    setBranchEmail(branch.email || "")
    setBranchWebsite(branch.website || "")
    setBranchBankName(branch.bank_name || "")
    setBranchAccountHolder(branch.account_holder || "")
    setBranchAccountNumber(branch.account_number || "")
    setBranchIfscCode(branch.ifsc_code || "")
    setBranchBankBranch(branch.bank_branch || "")
    setBranchUpiId(branch.upi_id || "")
    setBranchPaymentQrUrl(branch.payment_qr_url || "")

    // Dual GST and Non-GST Profiles for Branch
    setBranchBankProfileTab("gst")
    setBranchGstBankName(branch.gst_bank_name || branch.bank_name || "")
    setBranchGstAccountHolder(branch.gst_account_holder || branch.account_holder || "")
    setBranchGstAccountNumber(branch.gst_account_number || branch.account_number || "")
    setBranchGstIfscCode(branch.gst_ifsc_code || branch.ifsc_code || "")
    setBranchGstBankBranch(branch.gst_bank_branch || branch.bank_branch || "")
    setBranchGstUpiId(branch.gst_upi_id || branch.upi_id || "")
    setBranchGstPaymentQrUrl(branch.gst_payment_qr_url || branch.payment_qr_url || "")

    setBranchNongstBankName(branch.nongst_bank_name || branch.bank_name || "")
    setBranchNongstAccountHolder(branch.nongst_account_holder || branch.account_holder || "")
    setBranchNongstAccountNumber(branch.nongst_account_number || branch.account_number || "")
    setBranchNongstIfscCode(branch.nongst_ifsc_code || branch.ifsc_code || "")
    setBranchNongstBankBranch(branch.nongst_bank_branch || branch.bank_branch || "")
    setBranchNongstUpiId(branch.nongst_upi_id || branch.upi_id || "")
    setBranchNongstPaymentQrUrl(branch.nongst_payment_qr_url || branch.payment_qr_url || "")

    setBranchTermsConditions(branch.terms_conditions || "")
    setBranchSignatoryName(branch.signatory_name || "")
    setBranchSignatoryDesignation(branch.signatory_designation || "")
    setBranchSignatureImageUrl(branch.signature_image_url || "")
    setBranchStampImageUrl(branch.stamp_image_url || "")
    setBranchStatus(branch.status)
    setIsBranchModalOpen(true)
  }

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchName.trim()) return

    let finalCompanyId = targetCompanyIdForBranch
    if (!isSuperAdmin) {
      const allowedIds = visibleCompanies.map(c => c.id)
      if (!allowedIds.includes(finalCompanyId)) {
        finalCompanyId = visibleCompanies[0]?.id || "tech"
      }
    }

    const payload: Partial<Branch> = {
      companyId: finalCompanyId,
      name: branchName.trim(),
      code: branchCode.trim().toUpperCase(),
      brand_name: branchBrandName.trim(),
      division_name: branchDivisionName.trim(),
      subtitle: branchSubtitle.trim(),
      logo_url: branchLogoUrl,
      managerName: branchManager.trim(),
      managerPhone: branchManagerPhone.trim(),
      managerEmail: branchManagerEmail.trim(),
      gstin: branchGstin.trim(),
      pan: branchPan.trim(),
      cin: branchCin.trim(),
      msme_reg: branchMsmeReg.trim(),
      address: branchAddress.trim(),
      city: branchCity.trim(),
      state: branchState.trim(),
      zip: branchZip.trim(),
      country: branchCountry.trim(),
      phone: branchPhone.trim(),
      email: branchEmail.trim(),
      website: branchWebsite.trim(),
      // Base/Fallback Banking
      bank_name: (branchGstBankName || branchBankName || branchNongstBankName).trim(),
      account_holder: (branchGstAccountHolder || branchAccountHolder || branchNongstAccountHolder).trim(),
      account_number: (branchGstAccountNumber || branchAccountNumber || branchNongstAccountNumber).trim(),
      ifsc_code: (branchGstIfscCode || branchIfscCode || branchNongstIfscCode).trim().toUpperCase(),
      bank_branch: (branchGstBankBranch || branchBankBranch || branchNongstBankBranch).trim(),
      upi_id: (branchGstUpiId || branchUpiId || branchNongstUpiId).trim(),
      payment_qr_url: branchGstPaymentQrUrl || branchPaymentQrUrl || branchNongstPaymentQrUrl,
      // Distinct GST Banking Profile
      gst_bank_name: branchGstBankName.trim(),
      gst_account_holder: branchGstAccountHolder.trim(),
      gst_account_number: branchGstAccountNumber.trim(),
      gst_ifsc_code: branchGstIfscCode.trim().toUpperCase(),
      gst_bank_branch: branchGstBankBranch.trim(),
      gst_upi_id: branchGstUpiId.trim(),
      gst_payment_qr_url: branchGstPaymentQrUrl,
      // Distinct Non-GST Banking Profile
      nongst_bank_name: branchNongstBankName.trim(),
      nongst_account_holder: branchNongstAccountHolder.trim(),
      nongst_account_number: branchNongstAccountNumber.trim(),
      nongst_ifsc_code: branchNongstIfscCode.trim().toUpperCase(),
      nongst_bank_branch: branchNongstBankBranch.trim(),
      nongst_upi_id: branchNongstUpiId.trim(),
      nongst_payment_qr_url: branchNongstPaymentQrUrl,
      terms_conditions: branchTermsConditions.trim(),
      signatory_name: branchSignatoryName.trim(),
      signatory_designation: branchSignatoryDesignation.trim(),
      signature_image_url: branchSignatureImageUrl,
      stamp_image_url: branchStampImageUrl,
      status: branchStatus,
    }

    const isEdit = !!editingBranch
    await executeWithFeedback(async () => {
      if (editingBranch) {
        await updateBranch(editingBranch.id, payload)
      } else {
        await addBranch(payload)
      }

      await fetchBranches().catch(() => {})
      setIsBranchModalOpen(false)
    }, {
      actionType: isEdit ? "update" : "create",
      loadingTitle: isEdit ? "Updating Branch..." : "Creating Branch...",
      loadingMsg: `Saving branch ${branchName.trim()} with GST and Non-GST profiles...`,
      successTitle: isEdit ? "Branch Updated!" : "Branch Created Successfully!",
      successMsg: `Branch ${branchName.trim()} has been saved with full GST and Non-GST records.`,
      errorTitle: "Branch Save Failed",
    })
  }

  const handleDeleteBranch = async (branchId: string, bName: string) => {
    await executeWithFeedback(async () => {
      await deleteBranch(branchId)
      await fetchBranches().catch(() => {})
    }, {
      actionType: "delete",
      loadingTitle: "Deleting Branch...",
      loadingMsg: `Removing branch "${bName}"...`,
      successTitle: "Branch Deleted",
      successMsg: `Branch "${bName}" removed.`,
      errorTitle: "Delete Failed",
    })
  }

  // ── SUB-BRANCH HANDLERS (Percentage Wise Revenue Share & Full Details) ─────
  const handleOpenCreateSubBranch = (parentBranch: Branch) => {
    setSubBranchParentBranchId(parentBranch.id)
    setSubBranchCompanyId(parentBranch.companyId)
    setEditingSubBranch(null)
    setSubBranchModalTab("basic")
    setSubBranchName("")
    setSubBranchCode(`SB-${Math.floor(100 + Math.random() * 900)}`)
    setSubBranchBrandName("")
    setSubBranchDivisionName("")
    setSubBranchSubtitle("")
    setSubBranchLogoUrl("")
    setSubBranchPartnerName("")
    setSubBranchPartnerPhone("")
    setSubBranchPartnerEmail("")
    setSubBranchCity(parentBranch.city || "")
    setSubBranchState(parentBranch.state || "")
    setSubBranchAddress("")
    setSubBranchZip("")
    setSubBranchCountry("India")
    setSubBranchPhone("")
    setSubBranchEmail("")
    setSubBranchWebsite("")
    setSubBranchRevenueSharePct(30)
    setSubBranchPartnerType("Franchise Partner")
    setSubBranchGstin("")
    setSubBranchPan("")
    setSubBranchCin("")
    setSubBranchMsmeReg("")
    setSubBranchAccountHolder("")
    setSubBranchBankName("")
    setSubBranchAccountNumber("")
    setSubBranchIfscCode("")
    setSubBranchBankBranch("")
    setSubBranchUpiId("")
    setSubBranchPaymentQrUrl("")
    setSubBranchBankProfileTab("gst")
    setSubBranchGstBankName("")
    setSubBranchGstAccountHolder("")
    setSubBranchGstAccountNumber("")
    setSubBranchGstIfscCode("")
    setSubBranchGstBankBranch("")
    setSubBranchGstUpiId("")
    setSubBranchGstPaymentQrUrl("")
    setSubBranchNongstBankName("")
    setSubBranchNongstAccountHolder("")
    setSubBranchNongstAccountNumber("")
    setSubBranchNongstIfscCode("")
    setSubBranchNongstBankBranch("")
    setSubBranchNongstUpiId("")
    setSubBranchNongstPaymentQrUrl("")
    setSubBranchTermsConditions("")
    setSubBranchSignatoryName("")
    setSubBranchSignatoryDesignation("")
    setSubBranchSignatureImageUrl("")
    setSubBranchStampImageUrl("")
    setSubBranchStatus("Active")
    setIsSubBranchModalOpen(true)
  }

  const handleOpenEditSubBranch = (sb: SubBranch) => {
    setSubBranchParentBranchId(sb.parentBranchId)
    setSubBranchCompanyId(sb.companyId)
    setEditingSubBranch(sb)
    setSubBranchModalTab("basic")
    setSubBranchName(sb.name || "")
    setSubBranchCode(sb.code || "")
    setSubBranchBrandName(sb.brand_name || "")
    setSubBranchDivisionName(sb.division_name || "")
    setSubBranchSubtitle(sb.subtitle || "")
    setSubBranchLogoUrl(sb.logo_url || "")
    setSubBranchPartnerName(sb.partnerName || "")
    setSubBranchPartnerPhone(sb.partnerPhone || "")
    setSubBranchPartnerEmail(sb.partnerEmail || "")
    setSubBranchCity(sb.city || "")
    setSubBranchState(sb.state || "")
    setSubBranchAddress(sb.address || "")
    setSubBranchZip(sb.zip || "")
    setSubBranchCountry(sb.country || "India")
    setSubBranchPhone(sb.phone || "")
    setSubBranchEmail(sb.email || "")
    setSubBranchWebsite(sb.website || "")
    setSubBranchRevenueSharePct(sb.revenueSharePct ?? 30)
    setSubBranchPartnerType(sb.partnerType || "Franchise Partner")
    setSubBranchGstin(sb.gstin || "")
    setSubBranchPan(sb.pan || "")
    setSubBranchCin(sb.cin || "")
    setSubBranchMsmeReg(sb.msme_reg || "")
    setSubBranchAccountHolder(sb.account_holder || sb.bankDetails?.accountHolder || "")
    setSubBranchBankName(sb.bank_name || sb.bankDetails?.bankName || "")
    setSubBranchAccountNumber(sb.account_number || sb.bankDetails?.accountNumber || "")
    setSubBranchIfscCode(sb.ifsc_code || sb.bankDetails?.ifscCode || "")
    setSubBranchBankBranch(sb.bank_branch || "")
    setSubBranchUpiId(sb.upi_id || sb.bankDetails?.upiId || "")
    setSubBranchPaymentQrUrl(sb.payment_qr_url || "")

    // Dual GST and Non-GST Profiles for Sub-Branch
    setSubBranchBankProfileTab("gst")
    setSubBranchGstBankName(sb.gst_bank_name || sb.bank_name || sb.bankDetails?.bankName || "")
    setSubBranchGstAccountHolder(sb.gst_account_holder || sb.account_holder || sb.bankDetails?.accountHolder || "")
    setSubBranchGstAccountNumber(sb.gst_account_number || sb.account_number || sb.bankDetails?.accountNumber || "")
    setSubBranchGstIfscCode(sb.gst_ifsc_code || sb.ifsc_code || sb.bankDetails?.ifscCode || "")
    setSubBranchGstBankBranch(sb.gst_bank_branch || sb.bank_branch || "")
    setSubBranchGstUpiId(sb.gst_upi_id || sb.upi_id || sb.bankDetails?.upiId || "")
    setSubBranchGstPaymentQrUrl(sb.gst_payment_qr_url || sb.payment_qr_url || "")

    setSubBranchNongstBankName(sb.nongst_bank_name || sb.bank_name || sb.bankDetails?.bankName || "")
    setSubBranchNongstAccountHolder(sb.nongst_account_holder || sb.account_holder || sb.bankDetails?.accountHolder || "")
    setSubBranchNongstAccountNumber(sb.nongst_account_number || sb.account_number || sb.bankDetails?.accountNumber || "")
    setSubBranchNongstIfscCode(sb.nongst_ifsc_code || sb.ifsc_code || sb.bankDetails?.ifscCode || "")
    setSubBranchNongstBankBranch(sb.nongst_bank_branch || sb.bank_branch || "")
    setSubBranchNongstUpiId(sb.nongst_upi_id || sb.upi_id || sb.bankDetails?.upiId || "")
    setSubBranchNongstPaymentQrUrl(sb.nongst_payment_qr_url || sb.payment_qr_url || "")

    setSubBranchTermsConditions(sb.terms_conditions || "")
    setSubBranchSignatoryName(sb.signatory_name || "")
    setSubBranchSignatoryDesignation(sb.signatory_designation || "")
    setSubBranchSignatureImageUrl(sb.signature_image_url || "")
    setSubBranchStampImageUrl(sb.stamp_image_url || "")
    setSubBranchStatus(sb.status)
    setIsSubBranchModalOpen(true)
  }

  const handleSaveSubBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subBranchName.trim() || !subBranchParentBranchId) {
      alert("Sub-Branch Name and Parent Branch are required.")
      return
    }

    const payload: Partial<SubBranch> = {
      parentBranchId: subBranchParentBranchId,
      companyId: subBranchCompanyId,
      name: subBranchName.trim(),
      code: subBranchCode.trim().toUpperCase(),
      brand_name: subBranchBrandName.trim(),
      division_name: subBranchDivisionName.trim(),
      subtitle: subBranchSubtitle.trim(),
      logo_url: subBranchLogoUrl.trim(),
      partnerName: subBranchPartnerName.trim(),
      partnerPhone: subBranchPartnerPhone.trim(),
      partnerEmail: subBranchPartnerEmail.trim(),
      city: subBranchCity.trim(),
      state: subBranchState.trim(),
      address: subBranchAddress.trim(),
      zip: subBranchZip.trim(),
      country: subBranchCountry.trim(),
      phone: subBranchPhone.trim(),
      email: subBranchEmail.trim(),
      website: subBranchWebsite.trim(),
      revenueSharePct: Number(subBranchRevenueSharePct),
      partnerType: subBranchPartnerType,
      gstin: subBranchGstin.trim(),
      pan: subBranchPan.trim(),
      cin: subBranchCin.trim(),
      msme_reg: subBranchMsmeReg.trim(),
      terms_conditions: subBranchTermsConditions.trim(),
      signatory_name: subBranchSignatoryName.trim(),
      signatory_designation: subBranchSignatoryDesignation.trim(),
      signature_image_url: subBranchSignatureImageUrl,
      stamp_image_url: subBranchStampImageUrl,
      // Base/Fallback Banking
      bank_name: (subBranchGstBankName || subBranchBankName || subBranchNongstBankName).trim(),
      account_holder: (subBranchGstAccountHolder || subBranchAccountHolder || subBranchNongstAccountHolder).trim(),
      account_number: (subBranchGstAccountNumber || subBranchAccountNumber || subBranchNongstAccountNumber).trim(),
      ifsc_code: (subBranchGstIfscCode || subBranchIfscCode || subBranchNongstIfscCode).trim().toUpperCase(),
      bank_branch: (subBranchGstBankBranch || subBranchBankBranch || subBranchNongstBankBranch).trim(),
      upi_id: (subBranchGstUpiId || subBranchUpiId || subBranchNongstUpiId).trim(),
      payment_qr_url: subBranchGstPaymentQrUrl || subBranchPaymentQrUrl || subBranchNongstPaymentQrUrl,
      // Distinct GST Banking Profile
      gst_bank_name: subBranchGstBankName.trim(),
      gst_account_holder: subBranchGstAccountHolder.trim(),
      gst_account_number: subBranchGstAccountNumber.trim(),
      gst_ifsc_code: subBranchGstIfscCode.trim().toUpperCase(),
      gst_bank_branch: subBranchGstBankBranch.trim(),
      gst_upi_id: subBranchGstUpiId.trim(),
      gst_payment_qr_url: subBranchGstPaymentQrUrl,
      // Distinct Non-GST Banking Profile
      nongst_bank_name: subBranchNongstBankName.trim(),
      nongst_account_holder: subBranchNongstAccountHolder.trim(),
      nongst_account_number: subBranchNongstAccountNumber.trim(),
      nongst_ifsc_code: subBranchNongstIfscCode.trim().toUpperCase(),
      nongst_bank_branch: subBranchNongstBankBranch.trim(),
      nongst_upi_id: subBranchNongstUpiId.trim(),
      nongst_payment_qr_url: subBranchNongstPaymentQrUrl,
      bankDetails: {
        accountHolder: (subBranchGstAccountHolder || subBranchAccountHolder || subBranchNongstAccountHolder).trim(),
        bankName: (subBranchGstBankName || subBranchBankName || subBranchNongstBankName).trim(),
        accountNumber: (subBranchGstAccountNumber || subBranchAccountNumber || subBranchNongstAccountNumber).trim(),
        ifscCode: (subBranchGstIfscCode || subBranchIfscCode || subBranchNongstIfscCode).trim().toUpperCase(),
        upiId: (subBranchGstUpiId || subBranchUpiId || subBranchNongstUpiId).trim(),
      },
      status: subBranchStatus,
    }

    const isEdit = !!editingSubBranch
    await executeWithFeedback(async () => {
      if (editingSubBranch) {
        await updateSubBranch(editingSubBranch.id, payload)
      } else {
        await addSubBranch(payload)
      }
      await fetchSubBranches().catch(() => {})
      setIsSubBranchModalOpen(false)
    }, {
      actionType: isEdit ? "update" : "create",
      loadingTitle: isEdit ? "Updating Sub-Branch..." : "Creating Sub-Branch...",
      loadingMsg: `Saving revenue share agreement (${subBranchRevenueSharePct}% Partner / ${100 - subBranchRevenueSharePct}% Company) for ${subBranchName}...`,
      successTitle: isEdit ? "Sub-Branch Updated!" : "Sub-Branch Created!",
      successMsg: `Sub-Branch "${subBranchName}" saved with ${subBranchRevenueSharePct}% partner revenue share.`,
      errorTitle: "Sub-Branch Save Failed",
    })
  }

  const handleDeleteSubBranch = async (subBranchId: string, sbName: string) => {
    await executeWithFeedback(async () => {
      await deleteSubBranch(subBranchId)
      await fetchSubBranches().catch(() => {})
    }, {
      actionType: "delete",
      loadingTitle: "Deleting Sub-Branch...",
      loadingMsg: `Removing sub-branch "${sbName}"...`,
      successTitle: "Sub-Branch Removed",
      successMsg: `Sub-Branch "${sbName}" deleted successfully.`,
      errorTitle: "Delete Failed",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers size={18} />
            </div>
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Company Entities & Branch Hubs
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure enterprise legal entities, registered tax IDs, invoice branding, company signatures, and regional branch networks.
          </p>
        </div>
      </div>

      {/* Companies & Branches Accordion List */}
      <div className="space-y-4">
        {visibleCompanies.map((company) => {
          const compBranches = branches.filter((b) => 
            isMatchingCompany(company, b.companyId || (b as any).company_id)
          )
          const compUsers = allUsers.filter((u) => {
            const cIds = u.companyIds || (u.companyId ? [u.companyId] : [])
            return cIds.some((id: string) => isMatchingCompany(company, id))
          })
          const isExpanded = expandedCompanyIds.includes(company.id)
          const compFullName = getCompanyFullName(company)
          const compLogoUrl = getCompanyLogoUrl(company)
          const isActive = isMatchingCompany(company, activeCompanyId)

          return (
            <div
              key={company.id}
              className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden transition-all"
            >
              {/* Company Header Row */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-hover/30 border-b border-border/60">
                <div 
                  className="flex items-center gap-3.5 cursor-pointer select-none flex-1"
                  onClick={() => toggleCompanyExpand(company.id)}
                >
                  <button type="button" className="text-muted-foreground">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  <div className="w-12 h-12 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {compLogoUrl ? (
                      <img src={compLogoUrl} alt={compFullName} className="w-9 h-9 object-contain" />
                    ) : (
                      company.logo || "🏢"
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-foreground">
                        <span className="text-primary font-black">{compFullName}</span>
                      </h3>
                      {company.subtitle && (
                        <span className="text-xs font-semibold text-muted-foreground hidden md:inline">
                          • {company.subtitle}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {compBranches.length} Branch{compBranches.length === 1 ? "" : "es"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>Slug: <code className="font-mono text-[11px] text-foreground">{company.slug || company.id}</code></span>
                      {company.gstin && <span>• GST: <strong className="font-mono text-foreground">{company.gstin}</strong></span>}
                      {company.cin && <span>• CIN: <strong className="font-mono text-foreground">{company.cin}</strong></span>}
                      {company.signature_image_url && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-0.5 text-[10.5px]">
                          • <CheckCircle2 size={11} /> Signature Uploaded
                        </span>
                      )}
                      <span>• Currency: {company.currency_symbol || "₹"} ({company.currency || "INR"})</span>
                      <span>• {compUsers.length} Users</span>
                    </div>
                  </div>
                </div>

                {/* Company Action Buttons */}
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  {/* Direct Switch Company Button / Active Badge */}
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold shadow-2xs">
                      <CheckCircle2 size={13} />
                      <span>Active Workspace</span>
                    </span>
                  ) : (isSuperAdmin || visibleCompanies.length > 1) ? (
                    <button
                      type="button"
                      onClick={() => switchCompany(company.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs cursor-pointer"
                      title={`Switch active CRM workspace to ${compFullName}`}
                    >
                      <Building2 size={13} />
                      <span>Switch to this Company</span>
                    </button>
                  ) : null}

                  {/* Super Admin Edit Company & Invoice Details Button */}
                  {isSuperAdmin ? (
                    <button
                      type="button"
                      onClick={() => handleOpenEditCompany(company)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                      title="Modify company, tax, signature, and invoice branding"
                    >
                      <Pencil size={13} />
                      <span>Edit Entity & Signature</span>
                    </button>
                  ) : (
                    <span className="text-[10.5px] text-muted-foreground flex items-center gap-1 px-2 py-1 bg-surface-pressed/40 rounded-lg border border-border/50">
                      <Lock size={11} className="text-amber-500" />
                      <span>Super Admin Locked</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenCreateBranch(company.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Branch</span>
                  </button>
                </div>
              </div>

              {/* Branches List Body */}
              {isExpanded && (
                <div className="p-5 space-y-4 bg-surface/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Branches & Location Hubs ({compBranches.length})
                    </span>
                  </div>

                  {compBranches.length === 0 ? (
                    <div className="py-8 text-center bg-surface rounded-2xl border border-dashed border-border p-6">
                      <p className="text-xs text-muted-foreground">No branches created for this company yet.</p>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateBranch(company.id)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Create First Branch</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {compBranches.map((branch) => (
                        <div
                          key={branch.id}
                          className="bg-surface p-4 rounded-2xl border border-border shadow-xs hover:border-primary/40 transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs text-foreground">{branch.name}</h4>
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                    branch.status === "Active"
                                      ? "bg-emerald-500/10 text-emerald-600"
                                      : "bg-zinc-500/10 text-zinc-500"
                                  }`}
                                >
                                  {branch.status}
                                </span>
                              </div>
                              {branch.code && (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  Code: {branch.code}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditBranch(branch)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBranch(branch.id, branch.name)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1 text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">
                            {branch.city && (
                              <div className="flex items-center gap-1.5">
                                <MapPin size={12} className="text-primary/70 shrink-0" />
                                <span className="truncate">{branch.city}</span>
                              </div>
                            )}
                            {branch.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone size={12} className="text-emerald-500/70 shrink-0" />
                                <span className="font-mono">{branch.phone}</span>
                              </div>
                            )}
                            {branch.managerName && (
                              <div className="flex items-center gap-1.5">
                                <User size={12} className="text-blue-500/70 shrink-0" />
                                <span>Manager: {branch.managerName}</span>
                              </div>
                            )}
                          </div>

                          {/* 🌿 Sub-Branches Section (% Share / Franchise Network) */}
                          <div className="mt-3 pt-3 border-t border-dashed border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <span>🌿 Sub-Branches</span>
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 font-mono text-[9px]">
                                  {(subBranches || []).filter(sb => sb.parentBranchId === branch.id).length}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenCreateSubBranch(branch)}
                                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                              >
                                <Plus size={11} />
                                <span>Add Sub-Branch (% Share)</span>
                              </button>
                            </div>

                            {/* Sub-Branch list for this parent branch */}
                            <div className="space-y-1.5">
                              {(subBranches || []).filter(sb => sb.parentBranchId === branch.id).length === 0 ? (
                                <p className="text-[10px] text-muted-foreground italic py-1">
                                  No sub-branches attached yet. Click above to add a percentage-share partner.
                                </p>
                              ) : (
                                (subBranches || []).filter(sb => sb.parentBranchId === branch.id).map(sb => (
                                  <div
                                    key={sb.id}
                                    className="p-2.5 rounded-xl bg-surface-pressed/30 border border-border/70 hover:border-emerald-500/40 transition-colors space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="font-bold text-[11px] text-foreground truncate">{sb.name}</span>
                                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[9.5px]">
                                          🪙 {sb.revenueSharePct}% Partner / {100 - (sb.revenueSharePct ?? 30)}% Company
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditSubBranch(sb)}
                                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                                          title="Edit Sub-Branch"
                                        >
                                          <Pencil size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSubBranch(sb.id, sb.name)}
                                          className="p-1 rounded-md text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                          title="Delete Sub-Branch"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                                      {sb.partnerName && (
                                        <span>Partner: <strong className="text-foreground">{sb.partnerName}</strong></span>
                                      )}
                                      {sb.partnerPhone && (
                                        <span className="font-mono">{sb.partnerPhone}</span>
                                      )}
                                      {sb.city && (
                                        <span>📍 {sb.city}</span>
                                      )}
                                      <span className={`px-1 py-0.2 rounded text-[8.5px] font-bold uppercase ${sb.status === "Active" ? "text-emerald-600 bg-emerald-500/10" : "text-zinc-500 bg-zinc-500/10"}`}>
                                        {sb.status}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── CREATE / EDIT COMPANY & INVOICE CUSTOMIZATION MODAL (Super Admin Only) ── */}
      <AnimatePresence>
        {isCompanyModalOpen && isSuperAdmin && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-surface p-6 rounded-3xl border border-border shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border/50 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-border flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {companyLogoUrl ? (
                      <img src={companyLogoUrl} alt="Logo" className="w-7 h-7 object-contain" />
                    ) : (
                      companyLogo || "🏢"
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {editingCompany ? `Modify Entity: ${editingCompany.name}` : "Create New Company Entity"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Customize branding names (e.g. SAAMPARK + Technology/Consultancy), upload official signatures & stamps, and invoice settings.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-surface-hover rounded-2xl border border-border shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setCompanyModalTab("basic")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    companyModalTab === "basic"
                      ? "bg-surface text-primary shadow-xs border border-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Building2 size={13} />
                  <span>1. Brand & Division Names</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompanyModalTab("invoice")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    companyModalTab === "invoice"
                      ? "bg-surface text-primary shadow-xs border border-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText size={13} />
                  <span>2. Signature & Stamp Upload</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompanyModalTab("tax")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    companyModalTab === "tax"
                      ? "bg-surface text-primary shadow-xs border border-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Shield size={13} />
                  <span>3. Legal & Tax IDs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompanyModalTab("contact")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    companyModalTab === "contact"
                      ? "bg-surface text-primary shadow-xs border border-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MapPin size={13} />
                  <span>4. Address & Contacts</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompanyModalTab("bank")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    companyModalTab === "bank"
                      ? "bg-surface text-primary shadow-xs border border-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CreditCard size={13} />
                  <span>5. Bank & UPI Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompanyModalTab("smtp")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    companyModalTab === "smtp"
                      ? "bg-surface text-primary shadow-xs border border-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail size={13} />
                  <span>6. SMTP Email Dispatch</span>
                </button>

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setCompanyModalTab("modules")}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      companyModalTab === "modules"
                        ? "bg-surface text-primary shadow-xs border border-primary/20"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers size={13} />
                    <span>7. Enabled Modules (Super Admin)</span>
                  </button>
                )}
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveCompany} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
                {/* TAB 1: BRANDING & STRUCTURED NAME */}
                {companyModalTab === "basic" && (
                  <div className="space-y-4">
                    {/* Live Brand Header Preview Box */}
                    <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                        Live Invoice Header Preview:
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-800 border border-border flex items-center justify-center text-xl overflow-hidden shrink-0">
                          {companyLogoUrl ? (
                            <img src={companyLogoUrl} alt="Logo" className="w-9 h-9 object-contain" />
                          ) : (
                            companyLogo || "🏢"
                          )}
                        </div>
                        <div>
                          <div className="text-base font-black tracking-tight leading-none text-foreground flex items-center gap-1.5 flex-wrap">
                            <span className="text-primary">{companyBrandName || "SAAMPARK"}</span>
                            {companyDivisionName?.trim() && (
                              <span className="text-foreground">{companyDivisionName.trim()}</span>
                            )}
                          </div>
                          {companySubtitle?.trim() && (
                            <div className="text-[11px] font-bold text-muted-foreground tracking-wider mt-1">
                              {companySubtitle.trim()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-bold text-foreground mb-1">
                          Main Brand Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyBrandName}
                          onChange={(e) => updateBrandOrDivision(e.target.value, companyDivisionName)}
                          placeholder="e.g. SAAMPARK or Saampark"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs focus:outline-hidden focus:border-primary font-bold text-foreground"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">Brand prefix (e.g. SAAMPARK, Saampark, etc.)</p>
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">
                          Division / Business Unit (Optional)
                        </label>
                        <input
                          type="text"
                          value={companyDivisionName}
                          onChange={(e) => updateBrandOrDivision(companyBrandName, e.target.value)}
                          placeholder="e.g. Technology, Consultancy, Digital Marketing (Optional)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs focus:outline-hidden focus:border-primary font-bold text-foreground"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">Leave blank if this company has no separate division</p>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-foreground mb-1">
                          Legal Suffix / Tagline (Appears under title in Invoice)
                        </label>
                        <input
                          type="text"
                          value={companySubtitle}
                          onChange={(e) => setCompanySubtitle(e.target.value)}
                          placeholder="e.g. AND RESEARCH PRIVATE LIMITED or Consultancy Services (Leave blank if none)"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden focus:border-primary"
                        />
                      </div>

                      {/* Logo File Upload Section */}
                      <div className="sm:col-span-2 p-3 rounded-2xl bg-surface-hover/50 border border-border space-y-2">
                        <label className="block font-bold text-foreground">
                          Company Logo / Crest Image
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            {companyLogoUrl ? (
                              <img src={companyLogoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                            ) : (
                              <span className="text-2xl">{companyLogo || "🏢"}</span>
                            )}
                          </div>
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <input 
                              type="file" 
                              ref={logoFileInputRef}
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden" 
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => logoFileInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                              >
                                <UploadCloud size={13} />
                                <span>Upload Logo Image</span>
                              </button>
                              {companyLogoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setCompanyLogoUrl("")}
                                  className="px-2.5 py-1.5 rounded-xl border border-border text-rose-600 hover:bg-rose-50 font-semibold text-xs cursor-pointer"
                                >
                                  Clear Image
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={companyLogoUrl}
                              onChange={(e) => setCompanyLogoUrl(e.target.value)}
                              placeholder="Or paste direct image URL (e.g. /saampark-logo.png)"
                              className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-mono focus:outline-hidden"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">Company Slug / Identifier</label>
                        <input
                          type="text"
                          value={companySlug}
                          onChange={(e) => setCompanySlug(e.target.value)}
                          placeholder="e.g. consultancy, tech"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-foreground mb-1">Currency Code</label>
                          <input
                            type="text"
                            value={companyCurrency}
                            onChange={(e) => setCompanyCurrency(e.target.value)}
                            placeholder="INR"
                            className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-foreground mb-1">Currency Symbol</label>
                          <input
                            type="text"
                            value={companyCurrencySymbol}
                            onChange={(e) => setCompanyCurrencySymbol(e.target.value)}
                            placeholder="₹"
                            className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SIGNATURE & STAMP UPLOAD */}
                {companyModalTab === "invoice" && (
                  <div className="space-y-4">
                    {/* Live Signature & Stamp Preview Card */}
                    <div className="p-4 rounded-2xl bg-surface border border-border space-y-2">
                      <span className="text-[10.5px] font-bold text-primary uppercase tracking-wider block">
                        Official Company Signature & Stamp Preview:
                      </span>
                      <div className="flex items-center justify-between border-t border-border/60 pt-3 gap-4 flex-wrap">
                        <div className="flex items-center gap-6">
                          {/* Signature Line */}
                          <div className="text-center space-y-1">
                            <div className="h-12 flex items-end justify-center">
                              {companySignatureImageUrl ? (
                                <img 
                                  src={companySignatureImageUrl} 
                                  alt="Signature" 
                                  className="max-h-12 max-w-[150px] object-contain drop-shadow-sm" 
                                />
                              ) : (
                                <span className="font-serif italic text-zinc-400 text-xs">
                                  No Signature Uploaded
                                </span>
                              )}
                            </div>
                            <div className="w-40 border-t border-zinc-400 pt-0.5">
                              <p className="text-[8.5px] font-black uppercase text-zinc-800">
                                {companySignatoryName || "AUTHORISED SIGNATORY"}
                              </p>
                              {companySignatoryDesignation && (
                                <p className="text-[8px] text-zinc-500 font-medium">
                                  {companySignatoryDesignation}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Stamp Preview */}
                          <div className="text-center space-y-1 border-l border-border/60 pl-6">
                            <div className="h-12 flex items-center justify-center">
                              {companyStampImageUrl ? (
                                <img 
                                  src={companyStampImageUrl} 
                                  alt="Seal" 
                                  className="max-h-12 max-w-[80px] object-contain drop-shadow-sm" 
                                />
                              ) : (
                                <span className="font-serif italic text-zinc-400 text-xs">
                                  No Seal Uploaded
                                </span>
                              )}
                            </div>
                            <p className="text-[8px] text-zinc-400 uppercase font-semibold">Official Seal</p>
                          </div>
                        </div>

                        <div className="text-[11px] text-muted-foreground max-w-[260px]">
                          <p>Configured at Company level. Automatically stamped on all official invoices, quotations, and corporate documents.</p>
                        </div>
                      </div>
                    </div>

                    {/* Signature & Stamp Upload Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Signature Upload */}
                      <div className="p-3.5 rounded-2xl bg-surface-hover/50 border border-border space-y-2">
                        <label className="block font-bold text-foreground text-xs">
                          Company Authorized Signature
                        </label>
                        <input 
                          type="file" 
                          ref={signatureFileInputRef}
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden" 
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => signatureFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <UploadCloud size={13} />
                            <span>Upload Signature</span>
                          </button>
                          {companySignatureImageUrl && (
                            <button
                              type="button"
                              onClick={() => setCompanySignatureImageUrl("")}
                              className="px-2.5 py-1.5 rounded-xl border border-border text-rose-600 hover:bg-rose-50 font-semibold text-xs cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={companySignatureImageUrl}
                          onChange={(e) => setCompanySignatureImageUrl(e.target.value)}
                          placeholder="Or paste direct image link..."
                          className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-mono focus:outline-hidden"
                        />
                      </div>

                      {/* Stamp Upload */}
                      <div className="p-3.5 rounded-2xl bg-surface-hover/50 border border-border space-y-2">
                        <label className="block font-bold text-foreground text-xs">
                          Company Official Stamp / Seal
                        </label>
                        <input 
                          type="file" 
                          ref={companyStampInputRef}
                          accept="image/*"
                          onChange={handleCompanyStampUpload}
                          className="hidden" 
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => companyStampInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <UploadCloud size={13} />
                            <span>Upload Seal / Stamp</span>
                          </button>
                          {companyStampImageUrl && (
                            <button
                              type="button"
                              onClick={() => setCompanyStampImageUrl("")}
                              className="px-2.5 py-1.5 rounded-xl border border-border text-rose-600 hover:bg-rose-50 font-semibold text-xs cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={companyStampImageUrl}
                          onChange={(e) => setCompanyStampImageUrl(e.target.value)}
                          placeholder="Or paste direct image link..."
                          className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-foreground mb-1">Company Signatory Name / Title</label>
                        <input
                          type="text"
                          value={companySignatoryName}
                          onChange={(e) => setCompanySignatoryName(e.target.value)}
                          placeholder="e.g. Authorized Signatory"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">Signatory Designation</label>
                        <input
                          type="text"
                          value={companySignatoryDesignation}
                          onChange={(e) => setCompanySignatoryDesignation(e.target.value)}
                          placeholder="e.g. Managing Director / CEO"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-foreground mb-1">Default Terms & Conditions (Multiline)</label>
                        <textarea
                          rows={3}
                          value={companyTermsConditions}
                          onChange={(e) => setCompanyTermsConditions(e.target.value)}
                          placeholder="1. E.& O.E.&#10;2. Payment due within invoice due date.&#10;3. All disputes subject to jurisdiction."
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: LEGAL & TAX CREDENTIALS */}
                {companyModalTab === "tax" && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-muted-foreground">
                      These numbers appear on official tax invoices. If left empty, that specific badge/row will remain completely blank.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-foreground mb-1">CIN (Corporate Identification Number)</label>
                        <input
                          type="text"
                          value={companyCin}
                          onChange={(e) => setCompanyCin(e.target.value)}
                          placeholder="e.g. U72900WB2024PTC271234 (Leave blank if none)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono uppercase focus:outline-hidden focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">GSTIN / Tax ID Number</label>
                        <input
                          type="text"
                          value={companyGstin}
                          onChange={(e) => setCompanyGstin(e.target.value)}
                          placeholder="e.g. 19ABFCS1234D1ZS (Leave blank if none)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono uppercase focus:outline-hidden focus:border-primary"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-foreground mb-1">PAN Number</label>
                        <input
                          type="text"
                          value={companyPan}
                          onChange={(e) => setCompanyPan(e.target.value)}
                          placeholder="e.g. ABFCS1234D (Leave blank if none)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono uppercase focus:outline-hidden focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: REGISTERED OFFICE & CONTACTS */}
                {companyModalTab === "contact" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-foreground mb-1">Registered Office Address (Printed on Invoice Header)</label>
                      <textarea
                        rows={2}
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="e.g. Madinipur, Kolkata, Durgapur, West Bengal, India - 721101 (Leave blank to omit address block)"
                        className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-foreground mb-1">Support / Billing Phone(s)</label>
                        <input
                          type="text"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          placeholder="+91 9901518567 / +91 9901518569"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">Official Email Address</label>
                        <input
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          placeholder="info@saamparktechnology.com"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-foreground mb-1">Company Website URL</label>
                        <input
                          type="text"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          placeholder="www.saamparktechnology.com"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: BANKING & DIGITAL UPI PAY (DUAL GST & NON-GST PROFILES) */}
                {companyModalTab === "bank" && (
                  <div className="space-y-3.5">
                    {/* Dual Profile Switcher Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-2xl bg-surface-hover/60 border border-border">
                      <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-surface border border-border/80">
                        <button
                          type="button"
                          onClick={() => setCompanyBankProfileTab("gst")}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            companyBankProfileTab === "gst"
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CreditCard size={13} />
                          <span>GST Invoice Bank Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompanyBankProfileTab("nongst")}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            companyBankProfileTab === "nongst"
                              ? "bg-amber-600 text-white shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CreditCard size={13} />
                          <span>Non-GST Invoice Bank Profile</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyCompanyGstToNongst}
                        className="px-2.5 py-1.5 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-hover font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                        title="Copy details from GST profile into Non-GST profile"
                      >
                        <Sparkles size={12} className="text-primary" />
                        <span>Copy GST to Non-GST</span>
                      </button>
                    </div>

                    {/* GST Profile Form */}
                    {companyBankProfileTab === "gst" && (
                      <div className="space-y-3 p-3 rounded-2xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                            GST Invoices Bank Account & QR (Tax B2B / B2C)
                          </span>
                          <span className="text-[10px] text-muted-foreground">Auto-attached to all GST tax invoices</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-foreground mb-1">Bank Name *</label>
                            <input
                              type="text"
                              value={companyGstBankName}
                              onChange={(e) => {
                                setCompanyGstBankName(e.target.value)
                                setCompanyBankName(e.target.value)
                              }}
                              placeholder="e.g. State Bank of India / HDFC Bank"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-bold"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-foreground mb-1">Account Holder Name *</label>
                            <input
                              type="text"
                              value={companyGstAccountHolder}
                              onChange={(e) => {
                                setCompanyGstAccountHolder(e.target.value)
                                setCompanyAccountHolder(e.target.value)
                              }}
                              placeholder="e.g. Saampark Technology & Research Pvt Ltd"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-foreground mb-1">Account Number *</label>
                            <input
                              type="text"
                              value={companyGstAccountNumber}
                              onChange={(e) => {
                                setCompanyGstAccountNumber(e.target.value)
                                setCompanyAccountNumber(e.target.value)
                              }}
                              placeholder="e.g. 40912384759"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-foreground mb-1">IFSC Code *</label>
                            <input
                              type="text"
                              value={companyGstIfscCode}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase()
                                setCompanyGstIfscCode(val)
                                setCompanyIfscCode(val)
                              }}
                              placeholder="e.g. SBIN0001234"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-foreground mb-1">Bank Branch Location</label>
                            <input
                              type="text"
                              value={companyGstBankBranch}
                              onChange={(e) => {
                                setCompanyGstBankBranch(e.target.value)
                                setCompanyBankBranch(e.target.value)
                              }}
                              placeholder="e.g. Sector V Kolkata Branch"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-foreground mb-1">UPI ID (VPA)</label>
                            <input
                              type="text"
                              value={companyGstUpiId}
                              onChange={(e) => {
                                setCompanyGstUpiId(e.target.value)
                                setCompanyUpiId(e.target.value)
                              }}
                              placeholder="e.g. saampark@sbi"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold focus:outline-hidden"
                            />
                          </div>

                          {/* GST Payment QR Code */}
                          <div className="sm:col-span-2 p-3 rounded-2xl bg-surface border border-border space-y-2">
                            <label className="block font-bold text-foreground">
                              GST Payment QR Code Image (Standalone Bank QR)
                            </label>
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                {companyGstPaymentQrUrl ? (
                                  <img src={companyGstPaymentQrUrl} alt="GST QR" className="w-14 h-14 object-contain" />
                                ) : (
                                  <QrCode size={28} className="text-muted-foreground" />
                                )}
                              </div>
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <input 
                                  type="file" 
                                  ref={companyGstQrInputRef}
                                  accept="image/*"
                                  onChange={handleCompanyGstQrUpload}
                                  className="hidden" 
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => companyGstQrInputRef.current?.click()}
                                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                                  >
                                    <UploadCloud size={13} />
                                    <span>Upload GST QR Image</span>
                                  </button>
                                  {companyGstPaymentQrUrl && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCompanyGstPaymentQrUrl("")
                                        if (companyPaymentQrUrl === companyGstPaymentQrUrl) setCompanyPaymentQrUrl("")
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl border border-border text-rose-600 hover:bg-rose-50 font-semibold text-xs cursor-pointer"
                                    >
                                      Clear Image
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={companyGstPaymentQrUrl}
                                  onChange={(e) => {
                                    setCompanyGstPaymentQrUrl(e.target.value)
                                    setCompanyPaymentQrUrl(e.target.value)
                                  }}
                                  placeholder="Or paste direct image URL (e.g. /gst-qr.png or https://...)"
                                  className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-mono focus:outline-hidden"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Non-GST Profile Form */}
                    {companyBankProfileTab === "nongst" && (
                      <div className="space-y-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                            Non-GST Invoices Bank Account & QR (Retail / Estimates / Non-Tax)
                          </span>
                          <span className="text-[10px] text-muted-foreground">Auto-attached to all Non-GST invoices & estimates</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-foreground mb-1">Non-GST Bank Name *</label>
                            <input
                              type="text"
                              value={companyNongstBankName}
                              onChange={(e) => setCompanyNongstBankName(e.target.value)}
                              placeholder="e.g. State Bank of India / HDFC Bank"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-bold"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-foreground mb-1">Account Holder Name *</label>
                            <input
                              type="text"
                              value={companyNongstAccountHolder}
                              onChange={(e) => setCompanyNongstAccountHolder(e.target.value)}
                              placeholder="e.g. Saampark Enterprise"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-foreground mb-1">Account Number *</label>
                            <input
                              type="text"
                              value={companyNongstAccountNumber}
                              onChange={(e) => setCompanyNongstAccountNumber(e.target.value)}
                              placeholder="e.g. 501004928172"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-foreground mb-1">IFSC Code *</label>
                            <input
                              type="text"
                              value={companyNongstIfscCode}
                              onChange={(e) => setCompanyNongstIfscCode(e.target.value.toUpperCase())}
                              placeholder="e.g. HDFC0001234"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-foreground mb-1">Bank Branch Location</label>
                            <input
                              type="text"
                              value={companyNongstBankBranch}
                              onChange={(e) => setCompanyNongstBankBranch(e.target.value)}
                              placeholder="e.g. Main Market Branch"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-foreground mb-1">UPI ID (VPA)</label>
                            <input
                              type="text"
                              value={companyNongstUpiId}
                              onChange={(e) => setCompanyNongstUpiId(e.target.value)}
                              placeholder="e.g. saampark.retail@okhdfcbank"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold focus:outline-hidden"
                            />
                          </div>

                          {/* Non-GST Payment QR Code */}
                          <div className="sm:col-span-2 p-3 rounded-2xl bg-surface border border-border space-y-2">
                            <label className="block font-bold text-foreground">
                              Non-GST Payment QR Code Image (Standalone Bank / UPI QR)
                            </label>
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                {companyNongstPaymentQrUrl ? (
                                  <img src={companyNongstPaymentQrUrl} alt="Non-GST QR" className="w-14 h-14 object-contain" />
                                ) : (
                                  <QrCode size={28} className="text-muted-foreground" />
                                )}
                              </div>
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <input 
                                  type="file" 
                                  ref={companyNongstQrInputRef}
                                  accept="image/*"
                                  onChange={handleCompanyNongstQrUpload}
                                  className="hidden" 
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => companyNongstQrInputRef.current?.click()}
                                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-amber-700 transition-all cursor-pointer shadow-xs"
                                  >
                                    <UploadCloud size={13} />
                                    <span>Upload Non-GST QR</span>
                                  </button>
                                  {companyNongstPaymentQrUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setCompanyNongstPaymentQrUrl("")}
                                      className="px-2.5 py-1.5 rounded-xl border border-border text-rose-600 hover:bg-rose-50 font-semibold text-xs cursor-pointer"
                                    >
                                      Clear Image
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={companyNongstPaymentQrUrl}
                                  onChange={(e) => setCompanyNongstPaymentQrUrl(e.target.value)}
                                  placeholder="Or paste direct image URL (e.g. /nongst-qr.png or https://...)"
                                  className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-mono focus:outline-hidden"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: DEDICATED COMPANY SMTP EMAIL DISPATCH */}
                {companyModalTab === "smtp" && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-2.5">
                      <Mail size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-blue-950 dark:text-blue-100 text-xs">
                          Company-Dedicated Email Dispatch (Google / Custom SMTP)
                        </h4>
                        <p className="text-[11px] text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                          Invoices, project completions, payment receipts, and reminders for <strong>{companyName || "this company"}</strong> will be dispatched directly through this company's authenticated email account.
                        </p>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                      <label className="block font-bold text-foreground text-[11px]">Choose Mail Provider Preset:</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleApplyCompanyPreset("gmail")}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            companySmtpPreset === "gmail"
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-surface border border-border text-foreground hover:bg-surface-hover"
                          }`}
                        >
                          <span>Gmail / Google Workspace</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyCompanyPreset("zoho")}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            companySmtpPreset === "zoho"
                              ? "bg-amber-600 text-white shadow-sm"
                              : "bg-surface border border-border text-foreground hover:bg-surface-hover"
                          }`}
                        >
                          <span>Zoho Mail</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyCompanyPreset("outlook")}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            companySmtpPreset === "outlook"
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-surface border border-border text-foreground hover:bg-surface-hover"
                          }`}
                        >
                          <span>Outlook / Microsoft 365</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyCompanyPreset("custom")}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            companySmtpPreset === "custom"
                              ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shadow-sm"
                              : "bg-surface border border-border text-foreground hover:bg-surface-hover"
                          }`}
                        >
                          <span>Custom SMTP Server</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-bold text-foreground mb-1">SMTP Host</label>
                        <input
                          type="text"
                          value={companySmtpHost}
                          onChange={(e) => setCompanySmtpHost(e.target.value)}
                          placeholder="e.g. smtp.gmail.com"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-foreground mb-1">Port</label>
                          <input
                            type="text"
                            value={companySmtpPort}
                            onChange={(e) => {
                              const p = e.target.value
                              setCompanySmtpPort(p)
                              if (p === "465") setCompanySmtpSecure(true)
                              if (p === "587") setCompanySmtpSecure(false)
                            }}
                            placeholder="587 / 465"
                            className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-foreground mb-1">Encryption</label>
                          <select
                            value={companySmtpSecure ? "ssl" : "tls"}
                            onChange={(e) => setCompanySmtpSecure(e.target.value === "ssl")}
                            className="w-full px-2.5 py-2 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden cursor-pointer"
                          >
                            <option value="tls">STARTTLS (587)</option>
                            <option value="ssl">SSL / TLS (465)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">SMTP Username / Email *</label>
                        <input
                          type="email"
                          value={companySmtpUser}
                          onChange={(e) => {
                            setCompanySmtpUser(e.target.value)
                            if (!companySmtpFromEmail) setCompanySmtpFromEmail(e.target.value)
                            if (!companyTestEmail) setCompanyTestEmail(e.target.value)
                          }}
                          placeholder="e.g. accounts@saamparktechnology.com"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-foreground">App Password / Auth Key *</label>
                          <button
                            type="button"
                            onClick={() => setShowCompanySmtpPass(!showCompanySmtpPass)}
                            className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                          >
                            {showCompanySmtpPass ? "Hide" : "Show"}
                          </button>
                        </div>
                        <input
                          type={showCompanySmtpPass ? "text" : "password"}
                          value={companySmtpPass}
                          onChange={(e) => setCompanySmtpPass(e.target.value)}
                          placeholder="16-character Google App Password"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">Sender Display Name</label>
                        <input
                          type="text"
                          value={companySmtpFromName}
                          onChange={(e) => setCompanySmtpFromName(e.target.value)}
                          placeholder="e.g. SAAMPARK TECHNOLOGY Invoicing"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">Sender From Email (Header)</label>
                        <input
                          type="email"
                          value={companySmtpFromEmail}
                          onChange={(e) => setCompanySmtpFromEmail(e.target.value)}
                          placeholder="e.g. billing@saamparktechnology.com"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Google App Password Help Banner */}
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <span>💡 How to generate a Google App Password:</span>
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        Go to your <strong>Google Account ➔ Security ➔ 2-Step Verification ➔ App passwords</strong>. Create a new App Password (name it "CRM") and paste the 16-character key above. Regular account passwords with 2FA will be rejected by Google SMTP.
                      </p>
                    </div>

                    {/* Live Test Connection Tool */}
                    <div className="p-3.5 bg-surface-hover/60 border border-border rounded-2xl space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-foreground text-xs block">Verify SMTP Connection & Send Test Email</span>
                          <span className="text-[10px] text-muted-foreground">Test your credentials in real-time before saving.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={companyTestEmail}
                            onChange={(e) => setCompanyTestEmail(e.target.value)}
                            placeholder="Recipient email..."
                            className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono w-44 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            disabled={isTestingCompanySmtp || !companySmtpUser || !companySmtpPass}
                            onClick={handleTestCompanySmtp}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                          >
                            <Sparkles size={13} className={isTestingCompanySmtp ? "animate-spin" : ""} />
                            <span>{isTestingCompanySmtp ? "Testing..." : "⚡ Test SMTP"}</span>
                          </button>
                        </div>
                      </div>

                      {companySmtpTestResult && (
                        <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          companySmtpTestResult.success
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        }`}>
                          {companySmtpTestResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                          <span>{companySmtpTestResult.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 7: COMPANY-LEVEL ENABLED MODULES (SUPER ADMIN ONLY) */}
                {companyModalTab === "modules" && isSuperAdmin && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="font-black text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <Shield size={14} className="text-amber-600" />
                            <span>Company Module Access Control (Super Admin Only)</span>
                          </h4>
                          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                            Configure which CRM modules are enabled for <strong>{companyName || "this company"}</strong>. When users or admins switch into this company, only the selected modules will be visible.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setCompanyEnabledModulesState([...ALL_APP_MODULES])}
                            className="px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10.5px] font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-2xs"
                          >
                            Select All Modules
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompanyEnabledModulesState(["Dashboard", "Settings"])}
                            className="px-2.5 py-1.5 rounded-xl bg-surface border border-border text-foreground text-[10.5px] font-bold hover:bg-surface-hover transition-all cursor-pointer"
                          >
                            Reset to Minimal
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(CLEAN_MODULE_CATEGORIES).map(([catKey, cat]) => (
                        <div key={catKey} className="p-3.5 rounded-2xl bg-surface border border-border space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <span className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2">
                              <span>{cat.label}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-hover font-mono text-muted-foreground">
                                {cat.modules.filter(m => companyEnabledModulesState.includes(m.key)).length}/{cat.modules.length} enabled
                              </span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const catKeys = cat.modules.map(m => m.key)
                                  setCompanyEnabledModulesState(prev => Array.from(new Set([...prev, ...catKeys])))
                                }}
                                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                              >
                                Enable All
                              </button>
                              <span className="text-muted-foreground text-xs">•</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const catKeys = cat.modules.map(m => m.key)
                                  setCompanyEnabledModulesState(prev => prev.filter(k => !catKeys.includes(k)))
                                }}
                                className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                              >
                                Disable All
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {cat.modules.map(mod => {
                              const isChecked = companyEnabledModulesState.includes(mod.key)
                              const isLockedCore = mod.key === "Dashboard"
                              return (
                                <label
                                  key={mod.key}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                    isChecked
                                      ? "bg-primary/5 border-primary/40 text-foreground shadow-2xs ring-1 ring-primary/20"
                                      : "bg-surface-hover/30 border-border/50 text-muted-foreground opacity-60"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    disabled={isLockedCore}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (isLockedCore) return
                                      if (e.target.checked) {
                                        setCompanyEnabledModulesState(prev => [...prev, mod.key])
                                      } else {
                                        setCompanyEnabledModulesState(prev => prev.filter(k => k !== mod.key))
                                      }
                                    }}
                                    className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-xs leading-tight flex items-center gap-1.5">
                                      <span>{mod.name}</span>
                                      {isLockedCore && (
                                        <span className="text-[9px] font-semibold text-muted-foreground bg-surface-pressed px-1 rounded">Core</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">{mod.description}</div>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Action Buttons */}
                {(() => {
                  const currentCompanyTabIndex = COMPANY_TABS_LIST.indexOf(companyModalTab)
                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border/60 gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground w-full sm:w-auto">
                        <Sparkles size={13} className="text-teal-500 shrink-0" />
                        <span>Step {currentCompanyTabIndex + 1} of {COMPANY_TABS_LIST.length} • Dynamic Multi-Company Sync</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                        <button
                          type="button"
                          onClick={() => setIsCompanyModalOpen(false)}
                          className="px-3.5 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground font-semibold cursor-pointer text-xs transition-colors"
                        >
                          Cancel
                        </button>

                        {currentCompanyTabIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => setCompanyModalTab(COMPANY_TABS_LIST[currentCompanyTabIndex - 1])}
                            className="px-3.5 py-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-hover font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <ChevronLeft size={14} />
                            <span>Back</span>
                          </button>
                        )}

                        {currentCompanyTabIndex < COMPANY_TABS_LIST.length - 1 && (
                          <button
                            type="button"
                            onClick={() => setCompanyModalTab(COMPANY_TABS_LIST[currentCompanyTabIndex + 1])}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 shadow-xs hover:bg-primary/90 cursor-pointer transition-all"
                          >
                            <span>Next</span>
                            <ChevronRight size={14} />
                          </button>
                        )}

                        <button
                          type="submit"
                          className="px-4.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          <span>{editingCompany ? "Save Entity & Signature" : "Create Company Entity"}</span>
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CREATE / EDIT BRANCH MODAL (5 Full Tabs) ───────────────────────── */}
      <AnimatePresence>
        {isBranchModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xs font-bold">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {editingBranch ? `Edit Branch: ${editingBranch.name}` : "Create New Branch Hub"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Configure branch branding, legal tax IDs, addresses, custom banking, and digital signature/stamp
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 5 Tab Navigation Bar */}
              <div className="flex items-center gap-1.5 p-1 bg-surface-pressed/30 rounded-2xl border border-border/80 overflow-x-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setBranchModalTab("basic")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    branchModalTab === "basic"
                      ? "bg-surface text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Building2 size={13} />
                  <span>1. Identity</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBranchModalTab("tax")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    branchModalTab === "tax"
                      ? "bg-surface text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText size={13} />
                  <span>2. Tax & Legal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBranchModalTab("contact")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    branchModalTab === "contact"
                      ? "bg-surface text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MapPin size={13} />
                  <span>3. Address</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBranchModalTab("bank")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    branchModalTab === "bank"
                      ? "bg-surface text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CreditCard size={13} />
                  <span>4. Bank & UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBranchModalTab("signature")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    branchModalTab === "signature"
                      ? "bg-surface text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Shield size={13} />
                  <span>5. Signature & Stamp</span>
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveBranch} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
                
                {/* ── TAB 1: IDENTITY & BRANDING ── */}
                {branchModalTab === "basic" && (
                  <div className="space-y-3.5">
                    {/* Target Company */}
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Target Parent Company *</label>
                      {isSuperAdmin ? (
                        <select
                          value={targetCompanyIdForBranch}
                          onChange={(e) => setTargetCompanyIdForBranch(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-semibold text-foreground"
                        >
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.logo || "🏢"} {c.name} ({c.slug || c.id})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-surface-pressed/30 border border-border text-xs font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{visibleCompanies[0]?.logo || "🏢"}</span>
                            <span>{visibleCompanies[0]?.name || "Assigned Company"}</span>
                          </div>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">Assigned</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Branch Operating Name *</label>
                        <input
                          type="text"
                          required
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                          placeholder="e.g. Kolkata Salt Lake City Center"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Branch Code (Invoice ID Prefix) *</label>
                        <input
                          type="text"
                          required
                          value={branchCode}
                          onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                          placeholder="e.g. KOL-01, BLR-HQ"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Brand & Division Custom Overrides */}
                    <div className="p-3 rounded-2xl bg-surface-pressed/30 border border-border/70 space-y-2.5">
                      <span className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                        <Sparkles size={13} className="text-primary" />
                        <span>Branch Custom Brand & Division Header (Optional Overrides)</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10.5px] text-muted-foreground mb-1">Brand Name Override</label>
                          <input
                            type="text"
                            value={branchBrandName}
                            onChange={(e) => setBranchBrandName(e.target.value)}
                            placeholder="Defaults to Company Brand (e.g. SAAMPARK)"
                            className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-xs focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[10.5px] text-muted-foreground mb-1">Division Name Override</label>
                          <input
                            type="text"
                            value={branchDivisionName}
                            onChange={(e) => setBranchDivisionName(e.target.value)}
                            placeholder="e.g. TECHNOLOGY - EAST INDIA"
                            className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-xs focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10.5px] text-muted-foreground mb-1">Branch Subtitle / Tagline</label>
                        <input
                          type="text"
                          value={branchSubtitle}
                          onChange={(e) => setBranchSubtitle(e.target.value)}
                          placeholder="e.g. Regional Development & Enterprise Support Center"
                          className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Manager & Operational Status */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Branch Manager</label>
                        <input
                          type="text"
                          value={branchManager}
                          onChange={(e) => setBranchManager(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Manager Phone</label>
                        <input
                          type="text"
                          value={branchManagerPhone}
                          onChange={(e) => setBranchManagerPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Status</label>
                        <select
                          value={branchStatus}
                          onChange={(e) => setBranchStatus(e.target.value as any)}
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-bold"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: LEGAL & TAX IDS ── */}
                {branchModalTab === "tax" && (
                  <div className="space-y-3.5">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[11px] text-blue-900 dark:text-blue-200">
                      💡 <strong>State-Specific GSTIN:</strong> In India, businesses with multi-state operations have distinct state GSTINs per branch. Enter the branch-specific GSTIN below to appear on invoices issued from this branch.
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Branch State GSTIN</label>
                        <input
                          type="text"
                          value={branchGstin}
                          onChange={(e) => setBranchGstin(e.target.value.toUpperCase())}
                          placeholder="e.g. 19ABCDE1234F1Z5"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Branch PAN</label>
                        <input
                          type="text"
                          value={branchPan}
                          onChange={(e) => setBranchPan(e.target.value.toUpperCase())}
                          placeholder="e.g. ABCDE1234F"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Branch CIN / Registration No.</label>
                        <input
                          type="text"
                          value={branchCin}
                          onChange={(e) => setBranchCin(e.target.value)}
                          placeholder="e.g. U72200WB2023PTC123456"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">MSME / Udyam Reg No.</label>
                        <input
                          type="text"
                          value={branchMsmeReg}
                          onChange={(e) => setBranchMsmeReg(e.target.value)}
                          placeholder="e.g. UDYAM-WB-10-0012345"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: ADDRESS & CONTACTS ── */}
                {branchModalTab === "contact" && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Physical Street Address *</label>
                      <input
                        type="text"
                        value={branchAddress}
                        onChange={(e) => setBranchAddress(e.target.value)}
                        placeholder="e.g. Plot 12, Block EP & GP, Sector V, Salt Lake"
                        className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">City / Hub</label>
                        <input
                          type="text"
                          value={branchCity}
                          onChange={(e) => setBranchCity(e.target.value)}
                          placeholder="e.g. Kolkata"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">State / Province</label>
                        <input
                          type="text"
                          value={branchState}
                          onChange={(e) => setBranchState(e.target.value)}
                          placeholder="e.g. West Bengal"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">PIN / Zip Code</label>
                        <input
                          type="text"
                          value={branchZip}
                          onChange={(e) => setBranchZip(e.target.value)}
                          placeholder="700091"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Branch Direct Phone</label>
                        <input
                          type="text"
                          value={branchPhone}
                          onChange={(e) => setBranchPhone(e.target.value)}
                          placeholder="+91 33 2345 6789"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Branch Invoicing Email</label>
                        <input
                          type="email"
                          value={branchEmail}
                          onChange={(e) => setBranchEmail(e.target.value)}
                          placeholder="kolkata.billing@saampark.in"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Branch Website / Portal</label>
                        <input
                          type="text"
                          value={branchWebsite}
                          onChange={(e) => setBranchWebsite(e.target.value)}
                          placeholder="https://saampark.com/kolkata"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: BANK & UPI PAY (DUAL GST & NON-GST PROFILES) ── */}
                {branchModalTab === "bank" && (
                  <div className="space-y-3.5">
                    {/* Dual Profile Switcher Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-2xl bg-surface-hover/60 border border-border">
                      <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-surface border border-border/80">
                        <button
                          type="button"
                          onClick={() => setBranchBankProfileTab("gst")}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            branchBankProfileTab === "gst"
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CreditCard size={13} />
                          <span>GST Invoice Bank Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBranchBankProfileTab("nongst")}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            branchBankProfileTab === "nongst"
                              ? "bg-amber-600 text-white shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CreditCard size={13} />
                          <span>Non-GST Invoice Bank Profile</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyBranchGstToNongst}
                        className="px-2.5 py-1.5 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-hover font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                        title="Copy details from GST profile into Non-GST profile"
                      >
                        <Sparkles size={12} className="text-primary" />
                        <span>Copy GST to Non-GST</span>
                      </button>
                    </div>

                    {/* Branch GST Profile */}
                    {branchBankProfileTab === "gst" && (
                      <div className="space-y-3 p-3 rounded-2xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                            Branch GST Invoices Bank Account & QR
                          </span>
                          <span className="text-[10px] text-muted-foreground">Used on GST Invoices from this Branch</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Bank Name *</label>
                            <input
                              type="text"
                              value={branchGstBankName}
                              onChange={(e) => {
                                setBranchGstBankName(e.target.value)
                                setBranchBankName(e.target.value)
                              }}
                              placeholder="e.g. ICICI Bank Ltd."
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-bold"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Account Holder Name *</label>
                            <input
                              type="text"
                              value={branchGstAccountHolder}
                              onChange={(e) => {
                                setBranchGstAccountHolder(e.target.value)
                                setBranchAccountHolder(e.target.value)
                              }}
                              placeholder="e.g. SAAMPARK TECHNOLOGY PVT LTD"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block font-semibold text-foreground mb-1">Bank Account Number *</label>
                            <input
                              type="text"
                              value={branchGstAccountNumber}
                              onChange={(e) => {
                                setBranchGstAccountNumber(e.target.value)
                                setBranchAccountNumber(e.target.value)
                              }}
                              placeholder="002105023910"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">IFSC Code *</label>
                            <input
                              type="text"
                              value={branchGstIfscCode}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase()
                                setBranchGstIfscCode(val)
                                setBranchIfscCode(val)
                              }}
                              placeholder="ICIC0000021"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Bank Branch Location</label>
                            <input
                              type="text"
                              value={branchGstBankBranch}
                              onChange={(e) => {
                                setBranchGstBankBranch(e.target.value)
                                setBranchBankBranch(e.target.value)
                              }}
                              placeholder="Salt Lake Sector V Branch"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Branch UPI VPA ID</label>
                            <input
                              type="text"
                              value={branchGstUpiId}
                              onChange={(e) => {
                                setBranchGstUpiId(e.target.value)
                                setBranchUpiId(e.target.value)
                              }}
                              placeholder="saampark.kolkata@icici"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* GST QR Code Upload */}
                        <div className="p-3.5 rounded-2xl bg-surface border border-border/70 flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold text-foreground text-xs block">GST Payment QR Code</span>
                            <span className="text-[10px] text-muted-foreground block">
                              Upload a standalone payment QR code for GST billing.
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {branchGstPaymentQrUrl && (
                              <div className="relative w-12 h-12 rounded-xl bg-white p-1 border border-border overflow-hidden shrink-0">
                                <img src={branchGstPaymentQrUrl} alt="QR Preview" className="w-full h-full object-contain" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBranchGstPaymentQrUrl("")
                                    if (branchPaymentQrUrl === branchGstPaymentQrUrl) setBranchPaymentQrUrl("")
                                  }}
                                  className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded-full text-[8px]"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            )}
                            <input
                              type="file"
                              ref={branchGstQrInputRef}
                              onChange={handleBranchGstQrUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => branchGstQrInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-xs"
                            >
                              Upload GST QR
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Branch Non-GST Profile */}
                    {branchBankProfileTab === "nongst" && (
                      <div className="space-y-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                            Branch Non-GST Invoices Bank Account & QR
                          </span>
                          <span className="text-[10px] text-muted-foreground">Used on Non-GST Invoices from this Branch</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Bank Name *</label>
                            <input
                              type="text"
                              value={branchNongstBankName}
                              onChange={(e) => setBranchNongstBankName(e.target.value)}
                              placeholder="e.g. ICICI Bank Ltd."
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-bold"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Account Holder Name *</label>
                            <input
                              type="text"
                              value={branchNongstAccountHolder}
                              onChange={(e) => setBranchNongstAccountHolder(e.target.value)}
                              placeholder="e.g. SAAMPARK ENTERPRISE"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block font-semibold text-foreground mb-1">Bank Account Number *</label>
                            <input
                              type="text"
                              value={branchNongstAccountNumber}
                              onChange={(e) => setBranchNongstAccountNumber(e.target.value)}
                              placeholder="501004928172"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">IFSC Code *</label>
                            <input
                              type="text"
                              value={branchNongstIfscCode}
                              onChange={(e) => setBranchNongstIfscCode(e.target.value.toUpperCase())}
                              placeholder="HDFC0001234"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Bank Branch Location</label>
                            <input
                              type="text"
                              value={branchNongstBankBranch}
                              onChange={(e) => setBranchNongstBankBranch(e.target.value)}
                              placeholder="Main Market Branch"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Branch UPI VPA ID</label>
                            <input
                              type="text"
                              value={branchNongstUpiId}
                              onChange={(e) => setBranchNongstUpiId(e.target.value)}
                              placeholder="saampark.retail@okhdfcbank"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Non-GST QR Code Upload */}
                        <div className="p-3.5 rounded-2xl bg-surface border border-border/70 flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold text-foreground text-xs block">Non-GST Payment QR Code</span>
                            <span className="text-[10px] text-muted-foreground block">
                              Upload a standalone payment QR code for Non-GST billing.
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {branchNongstPaymentQrUrl && (
                              <div className="relative w-12 h-12 rounded-xl bg-white p-1 border border-border overflow-hidden shrink-0">
                                <img src={branchNongstPaymentQrUrl} alt="QR Preview" className="w-full h-full object-contain" />
                                <button
                                  type="button"
                                  onClick={() => setBranchNongstPaymentQrUrl("")}
                                  className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded-full text-[8px]"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            )}
                            <input
                              type="file"
                              ref={branchNongstQrInputRef}
                              onChange={handleBranchNongstQrUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => branchNongstQrInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer shadow-xs"
                            >
                              Upload Non-GST QR
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 5: SIGNATURE & STAMP UPLOAD ── */}
                {branchModalTab === "signature" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Branch Signatory Name</label>
                        <input
                          type="text"
                          value={branchSignatoryName}
                          onChange={(e) => setBranchSignatoryName(e.target.value)}
                          placeholder="e.g. Subir Karmakar"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-bold focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Signatory Designation</label>
                        <input
                          type="text"
                          value={branchSignatoryDesignation}
                          onChange={(e) => setBranchSignatoryDesignation(e.target.value)}
                          placeholder="e.g. Branch Head & Authorized Signatory"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {/* Signature Upload Card */}
                      <div className="p-4 rounded-2xl bg-surface-pressed/30 border border-border/80 flex flex-col items-center justify-center text-center space-y-2">
                        <span className="font-bold text-xs text-foreground">Digital Signature</span>
                        <div className="w-full h-24 rounded-xl bg-surface border border-dashed border-border flex items-center justify-center p-2 relative overflow-hidden">
                          {branchSignatureImageUrl ? (
                            <>
                              <img src={branchSignatureImageUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setBranchSignatureImageUrl("")}
                                className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full cursor-pointer shadow-xs"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">No signature uploaded</span>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={branchSignatureInputRef}
                          onChange={handleBranchSignatureUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => branchSignatureInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-xs"
                        >
                          Upload Signature Image
                        </button>
                      </div>

                      {/* Stamp Upload Card */}
                      <div className="p-4 rounded-2xl bg-surface-pressed/30 border border-border/80 flex flex-col items-center justify-center text-center space-y-2">
                        <span className="font-bold text-xs text-foreground">Branch Official Stamp / Seal</span>
                        <div className="w-full h-24 rounded-xl bg-surface border border-dashed border-border flex items-center justify-center p-2 relative overflow-hidden">
                          {branchStampImageUrl ? (
                            <>
                              <img src={branchStampImageUrl} alt="Stamp" className="max-h-full max-w-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setBranchStampImageUrl("")}
                                className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full cursor-pointer shadow-xs"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">No seal uploaded</span>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={branchStampInputRef}
                          onChange={handleBranchStampUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => branchStampInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-xs"
                        >
                          Upload Official Seal
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                {(() => {
                  const currentBranchTabIndex = BRANCH_TABS_LIST.indexOf(branchModalTab)
                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border/60 gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Sparkles size={13} className="text-amber-500 shrink-0" />
                        <span>Step {currentBranchTabIndex + 1} of 5 • Branch Profile Configuration</span>
                      </div>

                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <button
                          type="button"
                          onClick={() => setIsBranchModalOpen(false)}
                          className="px-3.5 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground font-semibold cursor-pointer text-xs"
                        >
                          Cancel
                        </button>

                        {currentBranchTabIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => setBranchModalTab(BRANCH_TABS_LIST[currentBranchTabIndex - 1])}
                            className="px-3.5 py-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-hover font-semibold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft size={14} />
                            <span>Back</span>
                          </button>
                        )}

                        {currentBranchTabIndex < BRANCH_TABS_LIST.length - 1 && (
                          <button
                            type="button"
                            onClick={() => setBranchModalTab(BRANCH_TABS_LIST[currentBranchTabIndex + 1])}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 shadow-xs hover:bg-primary/90 cursor-pointer"
                          >
                            <span>Next</span>
                            <ChevronRight size={14} />
                          </button>
                        )}

                        <button
                          type="submit"
                          className="px-4.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          <span>{editingBranch ? "Save Branch Hub" : "Create Branch Hub"}</span>
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CREATE / EDIT SUB-BRANCH & REVENUE SHARE MODAL (5 Full Tabs) ──── */}
      <AnimatePresence>
        {isSubBranchModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    🌿
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {editingSubBranch ? `Edit Sub-Branch: ${editingSubBranch.name}` : "Add Sub-Branch (Partner / Franchise Hub)"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Manage percentage revenue split, legal IDs, contacts, settlement bank details, and digital signatures
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubBranchModalOpen(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 5 Tab Navigation Bar */}
              <div className="flex items-center gap-1.5 p-1 bg-surface-pressed/30 rounded-2xl border border-border/80 overflow-x-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setSubBranchModalTab("basic")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    subBranchModalTab === "basic"
                      ? "bg-surface text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Building2 size={13} />
                  <span>1. Identity & Split</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubBranchModalTab("tax")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    subBranchModalTab === "tax"
                      ? "bg-surface text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText size={13} />
                  <span>2. Tax & Legal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubBranchModalTab("contact")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    subBranchModalTab === "contact"
                      ? "bg-surface text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MapPin size={13} />
                  <span>3. Address</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubBranchModalTab("bank")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    subBranchModalTab === "bank"
                      ? "bg-surface text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CreditCard size={13} />
                  <span>4. Payout & Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubBranchModalTab("signature")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    subBranchModalTab === "signature"
                      ? "bg-surface text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Shield size={13} />
                  <span>5. Signature & Stamp</span>
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveSubBranch} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
                
                {/* ── TAB 1: IDENTITY & REVENUE SPLIT ── */}
                {subBranchModalTab === "basic" && (
                  <div className="space-y-3.5">
                    {/* Parent Branch Selection */}
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Parent Operating Branch *</label>
                      <select
                        value={subBranchParentBranchId}
                        onChange={(e) => {
                          setSubBranchParentBranchId(e.target.value)
                          const pb = branches.find(b => b.id === e.target.value)
                          if (pb) setSubBranchCompanyId(pb.companyId)
                        }}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground focus:outline-hidden focus:border-primary"
                      >
                        <option value="" disabled>Select Parent Branch</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>
                            🏢 {b.name} {b.city ? `(${b.city})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Sub-Branch Name *</label>
                        <input
                          type="text"
                          required
                          value={subBranchName}
                          onChange={(e) => setSubBranchName(e.target.value)}
                          placeholder="e.g. Durgapur City Center Sub-Branch"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Sub-Branch Code *</label>
                        <input
                          type="text"
                          value={subBranchCode}
                          onChange={(e) => setSubBranchCode(e.target.value.toUpperCase())}
                          placeholder="e.g. SB-DGP-01"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* ── PERCENTAGE REVENUE SPLIT SLIDER ── */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <span>🪙 Revenue Share Split (% Wise)</span>
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            Sub-Branch operates as a percentage partner; earnings auto-calculated on each invoice
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {subBranchRevenueSharePct}% Partner
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            / {100 - subBranchRevenueSharePct}% Company
                          </span>
                        </div>
                      </div>

                      {/* Slider Control */}
                      <div className="space-y-1">
                        <input
                          type="range"
                          min={1}
                          max={95}
                          step={1}
                          value={subBranchRevenueSharePct}
                          onChange={(e) => setSubBranchRevenueSharePct(Number(e.target.value))}
                          className="w-full accent-emerald-600 h-2 bg-emerald-200 dark:bg-emerald-900 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[9.5px] font-mono text-muted-foreground">
                          <span>1% (Referral)</span>
                          <span>30% (Franchise)</span>
                          <span>50% (50-50 JV)</span>
                          <span>90% (Principal)</span>
                        </div>
                      </div>

                      {/* Visual Split Bar */}
                      <div className="h-3 rounded-full overflow-hidden flex shadow-inner bg-zinc-200 dark:bg-zinc-800">
                        <div
                          style={{ width: `${subBranchRevenueSharePct}%` }}
                          className="bg-emerald-500 text-[9px] font-bold text-white flex items-center justify-center overflow-hidden transition-all"
                        >
                          {subBranchRevenueSharePct >= 15 ? `${subBranchRevenueSharePct}% Partner` : ""}
                        </div>
                        <div
                          style={{ width: `${100 - subBranchRevenueSharePct}%` }}
                          className="bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center overflow-hidden transition-all"
                        >
                          {100 - subBranchRevenueSharePct >= 15 ? `${100 - subBranchRevenueSharePct}% Company Retained` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Partner Details */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Partner / Owner Name</label>
                        <input
                          type="text"
                          value={subBranchPartnerName}
                          onChange={(e) => setSubBranchPartnerName(e.target.value)}
                          placeholder="e.g. Subrata Mukherjee"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Partner Phone</label>
                        <input
                          type="text"
                          value={subBranchPartnerPhone}
                          onChange={(e) => setSubBranchPartnerPhone(e.target.value)}
                          placeholder="+91 98765 00000"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Partner Entity Type</label>
                        <select
                          value={subBranchPartnerType}
                          onChange={(e) => setSubBranchPartnerType(e.target.value as any)}
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        >
                          <option value="Franchise Partner">Franchise Partner</option>
                          <option value="Agency Partner">Agency Partner</option>
                          <option value="Satellite Office">Satellite Office</option>
                          <option value="Regional Associate">Regional Associate</option>
                        </select>
                      </div>
                    </div>

                    {/* Sub-Branch Partner Logo Upload */}
                    <div className="p-3.5 rounded-2xl bg-surface-hover/50 border border-border space-y-2">
                      <label className="block font-bold text-foreground text-xs">
                        Sub-Branch Partner Logo / Brand Mark
                      </label>
                      <input 
                        type="file" 
                        ref={subBranchLogoInputRef}
                        accept="image/*"
                        onChange={handleSubBranchLogoUpload}
                        className="hidden" 
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => subBranchLogoInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <UploadCloud size={13} />
                          <span>Upload Partner Logo</span>
                        </button>
                        {subBranchLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setSubBranchLogoUrl("")}
                            className="px-2.5 py-1.5 rounded-xl border border-border text-rose-600 hover:bg-rose-50 font-semibold text-xs cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={subBranchLogoUrl}
                        onChange={(e) => setSubBranchLogoUrl(e.target.value)}
                        placeholder="Or paste direct image URL (e.g. https://...)"
                        className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-mono focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {/* ── TAB 2: TAX & LEGAL IDS ── */}
                {subBranchModalTab === "tax" && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Sub-Branch GSTIN</label>
                        <input
                          type="text"
                          value={subBranchGstin}
                          onChange={(e) => setSubBranchGstin(e.target.value.toUpperCase())}
                          placeholder="e.g. 19ABCDE1234F1Z5"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Partner PAN</label>
                        <input
                          type="text"
                          value={subBranchPan}
                          onChange={(e) => setSubBranchPan(e.target.value.toUpperCase())}
                          placeholder="e.g. ABCDE1234F"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">CIN / Registration No.</label>
                        <input
                          type="text"
                          value={subBranchCin}
                          onChange={(e) => setSubBranchCin(e.target.value)}
                          placeholder="e.g. U72200WB2023PTC123456"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">MSME Udyam No.</label>
                        <input
                          type="text"
                          value={subBranchMsmeReg}
                          onChange={(e) => setSubBranchMsmeReg(e.target.value)}
                          placeholder="e.g. UDYAM-WB-10-0012345"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: ADDRESS & CONTACTS ── */}
                {subBranchModalTab === "contact" && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Physical Address</label>
                      <input
                        type="text"
                        value={subBranchAddress}
                        onChange={(e) => setSubBranchAddress(e.target.value)}
                        placeholder="e.g. City Center Mall, Ground Floor, Durgapur"
                        className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">City / Region</label>
                        <input
                          type="text"
                          value={subBranchCity}
                          onChange={(e) => setSubBranchCity(e.target.value)}
                          placeholder="e.g. Durgapur"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">State</label>
                        <input
                          type="text"
                          value={subBranchState}
                          onChange={(e) => setSubBranchState(e.target.value)}
                          placeholder="e.g. West Bengal"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">PIN Code</label>
                        <input
                          type="text"
                          value={subBranchZip}
                          onChange={(e) => setSubBranchZip(e.target.value)}
                          placeholder="713216"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Partner Email</label>
                        <input
                          type="email"
                          value={subBranchEmail}
                          onChange={(e) => setSubBranchEmail(e.target.value)}
                          placeholder="partner@saampark.in"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Partner Phone / Hotline</label>
                        <input
                          type="text"
                          value={subBranchPhone}
                          onChange={(e) => setSubBranchPhone(e.target.value)}
                          placeholder="+91 98765 00000"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: BANK & UPI PAY (DUAL GST & NON-GST PROFILES) ── */}
                {subBranchModalTab === "bank" && (
                  <div className="space-y-3.5">
                    {/* Dual Profile Switcher Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-2xl bg-surface-hover/60 border border-border">
                      <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-surface border border-border/80">
                        <button
                          type="button"
                          onClick={() => setSubBranchBankProfileTab("gst")}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            subBranchBankProfileTab === "gst"
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CreditCard size={13} />
                          <span>GST Invoice Bank Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubBranchBankProfileTab("nongst")}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            subBranchBankProfileTab === "nongst"
                              ? "bg-amber-600 text-white shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CreditCard size={13} />
                          <span>Non-GST Invoice Bank Profile</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopySubBranchGstToNongst}
                        className="px-2.5 py-1.5 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-hover font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                        title="Copy details from GST profile into Non-GST profile"
                      >
                        <Sparkles size={12} className="text-primary" />
                        <span>Copy GST to Non-GST</span>
                      </button>
                    </div>

                    {/* Sub-Branch GST Profile */}
                    {subBranchBankProfileTab === "gst" && (
                      <div className="space-y-3 p-3 rounded-2xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                            Sub-Branch GST Invoices Bank Account & QR
                          </span>
                          <span className="text-[10px] text-muted-foreground">Used on GST Invoices from this Sub-Branch</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Bank Name *</label>
                            <input
                              type="text"
                              value={subBranchGstBankName}
                              onChange={(e) => {
                                setSubBranchGstBankName(e.target.value)
                                setSubBranchBankName(e.target.value)
                              }}
                              placeholder="e.g. HDFC Bank Ltd."
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-bold"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Account Holder Name *</label>
                            <input
                              type="text"
                              value={subBranchGstAccountHolder}
                              onChange={(e) => {
                                setSubBranchGstAccountHolder(e.target.value)
                                setSubBranchAccountHolder(e.target.value)
                              }}
                              placeholder="Partner Account Name"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-semibold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block font-semibold text-foreground mb-1">Bank Account Number *</label>
                            <input
                              type="text"
                              value={subBranchGstAccountNumber}
                              onChange={(e) => {
                                setSubBranchGstAccountNumber(e.target.value)
                                setSubBranchAccountNumber(e.target.value)
                              }}
                              placeholder="Account Number"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">IFSC Code *</label>
                            <input
                              type="text"
                              value={subBranchGstIfscCode}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase()
                                setSubBranchGstIfscCode(val)
                                setSubBranchIfscCode(val)
                              }}
                              placeholder="HDFC0001234"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Bank Branch Location</label>
                            <input
                              type="text"
                              value={subBranchGstBankBranch}
                              onChange={(e) => {
                                setSubBranchGstBankBranch(e.target.value)
                                setSubBranchBankBranch(e.target.value)
                              }}
                              placeholder="Local Branch"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Partner UPI ID</label>
                            <input
                              type="text"
                              value={subBranchGstUpiId}
                              onChange={(e) => {
                                setSubBranchGstUpiId(e.target.value)
                                setSubBranchUpiId(e.target.value)
                              }}
                              placeholder="partner@okhdfcbank"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Sub-Branch GST QR Code Upload */}
                        <div className="p-3.5 rounded-2xl bg-surface border border-border/70 flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold text-foreground text-xs block">GST Payment QR Code</span>
                            <span className="text-[10px] text-muted-foreground block">
                              Upload a standalone payment QR code for GST billing.
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {subBranchGstPaymentQrUrl && (
                              <div className="relative w-12 h-12 rounded-xl bg-white p-1 border border-border overflow-hidden shrink-0">
                                <img src={subBranchGstPaymentQrUrl} alt="QR Preview" className="w-full h-full object-contain" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubBranchGstPaymentQrUrl("")
                                    if (subBranchPaymentQrUrl === subBranchGstPaymentQrUrl) setSubBranchPaymentQrUrl("")
                                  }}
                                  className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded-full text-[8px]"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            )}
                            <input
                              type="file"
                              ref={subBranchGstQrInputRef}
                              onChange={handleSubBranchGstQrUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => subBranchGstQrInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-xs"
                            >
                              Upload GST QR
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-Branch Non-GST Profile */}
                    {subBranchBankProfileTab === "nongst" && (
                      <div className="space-y-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                            Sub-Branch Non-GST Invoices Bank Account & QR
                          </span>
                          <span className="text-[10px] text-muted-foreground">Used on Non-GST Invoices from this Sub-Branch</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Bank Name *</label>
                            <input
                              type="text"
                              value={subBranchNongstBankName}
                              onChange={(e) => setSubBranchNongstBankName(e.target.value)}
                              placeholder="e.g. State Bank of India"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden font-bold"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Account Holder Name *</label>
                            <input
                              type="text"
                              value={subBranchNongstAccountHolder}
                              onChange={(e) => setSubBranchNongstAccountHolder(e.target.value)}
                              placeholder="e.g. Partner Retail Account"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block font-semibold text-foreground mb-1">Bank Account Number *</label>
                            <input
                              type="text"
                              value={subBranchNongstAccountNumber}
                              onChange={(e) => setSubBranchNongstAccountNumber(e.target.value)}
                              placeholder="Account Number"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">IFSC Code *</label>
                            <input
                              type="text"
                              value={subBranchNongstIfscCode}
                              onChange={(e) => setSubBranchNongstIfscCode(e.target.value.toUpperCase())}
                              placeholder="SBIN0001234"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold uppercase focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Bank Branch Location</label>
                            <input
                              type="text"
                              value={subBranchNongstBankBranch}
                              onChange={(e) => setSubBranchNongstBankBranch(e.target.value)}
                              placeholder="Local Branch Location"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Partner UPI ID</label>
                            <input
                              type="text"
                              value={subBranchNongstUpiId}
                              onChange={(e) => setSubBranchNongstUpiId(e.target.value)}
                              placeholder="partner.retail@oksbi"
                              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Sub-Branch Non-GST QR Code Upload */}
                        <div className="p-3.5 rounded-2xl bg-surface border border-border/70 flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold text-foreground text-xs block">Non-GST Payment QR Code</span>
                            <span className="text-[10px] text-muted-foreground block">
                              Upload a standalone payment QR code for Non-GST billing.
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {subBranchNongstPaymentQrUrl && (
                              <div className="relative w-12 h-12 rounded-xl bg-white p-1 border border-border overflow-hidden shrink-0">
                                <img src={subBranchNongstPaymentQrUrl} alt="QR Preview" className="w-full h-full object-contain" />
                                <button
                                  type="button"
                                  onClick={() => setSubBranchNongstPaymentQrUrl("")}
                                  className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded-full text-[8px]"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            )}
                            <input
                              type="file"
                              ref={subBranchNongstQrInputRef}
                              onChange={handleSubBranchNongstQrUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => subBranchNongstQrInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer shadow-xs"
                            >
                              Upload Non-GST QR
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 5: SIGNATURE & STAMP ── */}
                {subBranchModalTab === "signature" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Partner Signatory Name</label>
                        <input
                          type="text"
                          value={subBranchSignatoryName}
                          onChange={(e) => setSubBranchSignatoryName(e.target.value)}
                          placeholder="e.g. Subrata Mukherjee"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-bold focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Designation</label>
                        <input
                          type="text"
                          value={subBranchSignatoryDesignation}
                          onChange={(e) => setSubBranchSignatoryDesignation(e.target.value)}
                          placeholder="e.g. Managing Partner / Franchise Head"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {/* Signature Upload */}
                      <div className="p-4 rounded-2xl bg-surface-pressed/30 border border-border/80 flex flex-col items-center justify-center text-center space-y-2">
                        <span className="font-bold text-xs text-foreground">Partner Signature</span>
                        <div className="w-full h-24 rounded-xl bg-surface border border-dashed border-border flex items-center justify-center p-2 relative overflow-hidden">
                          {subBranchSignatureImageUrl ? (
                            <>
                              <img src={subBranchSignatureImageUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setSubBranchSignatureImageUrl("")}
                                className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full cursor-pointer shadow-xs"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">No signature uploaded</span>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={subBranchSignatureInputRef}
                          onChange={handleSubBranchSignatureUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => subBranchSignatureInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-xs"
                        >
                          Upload Signature
                        </button>
                      </div>

                      {/* Stamp Upload */}
                      <div className="p-4 rounded-2xl bg-surface-pressed/30 border border-border/80 flex flex-col items-center justify-center text-center space-y-2">
                        <span className="font-bold text-xs text-foreground">Partner Seal / Stamp</span>
                        <div className="w-full h-24 rounded-xl bg-surface border border-dashed border-border flex items-center justify-center p-2 relative overflow-hidden">
                          {subBranchStampImageUrl ? (
                            <>
                              <img src={subBranchStampImageUrl} alt="Stamp" className="max-h-full max-w-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setSubBranchStampImageUrl("")}
                                className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full cursor-pointer shadow-xs"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">No seal uploaded</span>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={subBranchStampInputRef}
                          onChange={handleSubBranchStampUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => subBranchStampInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-xs"
                        >
                          Upload Seal
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                {(() => {
                  const currentSbTabIndex = SUB_BRANCH_TABS_LIST.indexOf(subBranchModalTab)
                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border/60 gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Sparkles size={13} className="text-emerald-500 shrink-0" />
                        <span>Step {currentSbTabIndex + 1} of 5 • Partner Agreement Configuration</span>
                      </div>

                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <button
                          type="button"
                          onClick={() => setIsSubBranchModalOpen(false)}
                          className="px-3.5 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground font-semibold cursor-pointer text-xs"
                        >
                          Cancel
                        </button>

                        {currentSbTabIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => setSubBranchModalTab(SUB_BRANCH_TABS_LIST[currentSbTabIndex - 1])}
                            className="px-3.5 py-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-hover font-semibold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft size={14} />
                            <span>Back</span>
                          </button>
                        )}

                        {currentSbTabIndex < SUB_BRANCH_TABS_LIST.length - 1 && (
                          <button
                            type="button"
                            onClick={() => setSubBranchModalTab(SUB_BRANCH_TABS_LIST[currentSbTabIndex + 1])}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 shadow-xs hover:bg-primary/90 cursor-pointer"
                          >
                            <span>Next</span>
                            <ChevronRight size={14} />
                          </button>
                        )}

                        <button
                          type="submit"
                          className="px-4.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          <span>{editingSubBranch ? "Save Sub-Branch" : "Register Sub-Branch"}</span>
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
