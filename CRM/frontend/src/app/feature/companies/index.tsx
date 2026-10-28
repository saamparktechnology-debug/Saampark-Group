"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, Plus, Search, Edit2, Trash2, ChevronRight, ChevronDown, 
  MapPin, Phone, Mail, Globe, Users, Briefcase, DollarSign, Building, 
  Loader2, AlertCircle, Shield, CreditCard, Award, CheckCircle2, Image,
  X, Sparkles, Eye, Landmark, QrCode, FileText, Check, ShieldCheck,
  Columns, Maximize2, Minimize2, Split, LayoutTemplate, Save, Copy
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { CompanyApiService, BranchApiService, SubBranchApiService } from "./services/companyService"
import { Company, Branch, SubBranch } from "./types"
import { useAuthStore, isMatchingCompany } from "@/store/useAuthStore"
import { markGlobalItemDeleted, unmarkGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB, syncGlobalDeletedIds, isGlobalItemDeleted, getLocalDeletedIds } from "@/lib/storageSync"
import { ImageUploadField } from "@/components/ui/ImageUploadField"
import { OfficialInvoiceDocument, CustomTextStamp } from "@/app/feature/sales/invoices/components/OfficialInvoiceDocument"
import { InvoiceItem, InvoiceLineItem } from "@/app/feature/sales/invoices/services/invoiceService"

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "Manufacturing",
  "Retail", "Real Estate", "Consulting", "Media", "Other"
]

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
]

const PARTNER_TYPES = [
  "Individual", "Corporate Partner", "Franchise Partner", 
  "Agency Partner", "Regional Associate", "Satellite Office"
]

const CANONICAL_COMPANIES: Company[] = [
  {
    id: "tech",
    name: "SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED",
    slug: "tech",
    brand_name: "SAAMPARK",
    division_name: "TECHNOLOGY",
    subtitle: "AND RESEARCH PRIVATE LIMITED",
    industry: "Technology",
    currency: "INR",
    gstin: "",
    pan: "",
    cin: "",
    msme_reg: "",
    iso_certification: "",
    logo_url: "/saampark-logo.png",
    address: "",
    phone: "",
    email: "",
    website: "",
    status: "active",
    member_count: 0,
    signatory_name: "Authorized Signatory",
    signatory_designation: "Managing Director",
  },
  {
    id: "consultancy",
    name: "SAAMPARK CONSULTANCY SERVICE",
    slug: "consultancy",
    brand_name: "SAAMPARK",
    division_name: "CONSULTANCY SERVICE",
    subtitle: "MANAGEMENT & ADVISORY SERVICES",
    industry: "Consulting",
    currency: "INR",
    gstin: "",
    pan: "",
    cin: "",
    msme_reg: "",
    iso_certification: "",
    logo_url: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    status: "active",
    member_count: 0,
    signatory_name: "Authorized Signatory",
    signatory_designation: "Consulting Director",
  },
]

const CANONICAL_BRANCHES: Branch[] = [
  {
    id: "br-1",
    company_id: "tech",
    name: "Head Office",
    code: "STR-HO",
    city: "",
    state: "",
    country: "India",
    phone: "",
    email: "",
    manager_name: "",
    status: "active",
    user_count: 0,
  },
]

export default function CompaniesMain() {
  const { user, fetchCompanies, activeCompanyId } = useAuthStore()
  const isSuperAdmin = user?.role === "Super Admin" || (user as any)?.role_id === 1 || String((user as any)?.role_name || "").toLowerCase().includes("super") || user?.email === "hiisupriya@gmail.com" || user?.email === "saampark.official@gmail.com"

  const userAssignedComps = React.useMemo(() => {
    if (!user) return []
    const comps = [
      ...(Array.isArray((user as any)?.companyIds) ? (user as any).companyIds : []),
      (user as any)?.companyId,
      (user as any)?.company_id,
    ].filter(Boolean).map((id: any) => String(id).toLowerCase().trim())
    return Array.from(new Set(comps))
  }, [user])

  const [companies, setCompanies] = React.useState<Company[]>(CANONICAL_COMPANIES)
  const [branches, setBranches] = React.useState<Branch[]>(CANONICAL_BRANCHES)
  const [subBranches, setSubBranches] = React.useState<SubBranch[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [searchQuery, setSearchQuery] = React.useState("")
  const [industryFilter, setIndustryFilter] = React.useState("")
  const [expandedCompanies, setExpandedCompanies] = React.useState<Set<string>>(new Set(["tech", "digital", "saampark-ai-solutions"]))
  const [expandedBranches, setExpandedBranches] = React.useState<Set<string>>(new Set())

  // Modal states & Split-Screen View Modes
  const [showCompanyModal, setShowCompanyModal] = React.useState(false)
  const [companyModalViewMode, setCompanyModalViewMode] = React.useState<"split" | "form" | "preview">("split")
  const [branchModalViewMode, setBranchModalViewMode] = React.useState<"split" | "form" | "preview">("split")
  const [subBranchModalViewMode, setSubBranchModalViewMode] = React.useState<"split" | "form" | "preview">("split")
  const [editingCompany, setEditingCompany] = React.useState<Company | null>(null)
  const [companyTab, setCompanyTab] = React.useState<"identity" | "tax" | "contact" | "branding" | "signatory" | "bank">("identity")
  const [companyBankProfileTab, setCompanyBankProfileTab] = React.useState<"gst" | "nongst">("gst")
  const [companyBankSubTab, setCompanyBankSubTab] = React.useState<"gst" | "nongst">("gst")
  const [companyPreviewScale, setCompanyPreviewScale] = React.useState<"fit" | "normal" | "large">("fit")
  const [branchPreviewScale, setBranchPreviewScale] = React.useState<"fit" | "normal" | "large">("fit")
  const [subBranchPreviewScale, setSubBranchPreviewScale] = React.useState<"fit" | "normal" | "large">("fit")
  const [previewEntityLevel, setPreviewEntityLevel] = React.useState<"company" | "branch" | "subbranch">("company")
  const [previewInvoiceType, setPreviewInvoiceType] = React.useState<"gst" | "nongst">("gst")
  const [selectedPreviewBranchId, setSelectedPreviewBranchId] = React.useState<string>("")
  const [companySignaturePos, setCompanySignaturePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [companyStampPos, setCompanyStampPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [companyLogoScale, setCompanyLogoScale] = React.useState<number>(1)
  const [companyStampScale, setCompanyStampScale] = React.useState<number>(1)
  const [companySignatureScale, setCompanySignatureScale] = React.useState<number>(1)
  const [branchSignaturePos, setBranchSignaturePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [branchStampPos, setBranchStampPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [branchLogoScale, setBranchLogoScale] = React.useState<number>(1)
  const [branchStampScale, setBranchStampScale] = React.useState<number>(1)
  const [branchSignatureScale, setBranchSignatureScale] = React.useState<number>(1)
  const [subBranchSignaturePos, setSubBranchSignaturePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [subBranchStampPos, setSubBranchStampPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [subBranchLogoScale, setSubBranchLogoScale] = React.useState<number>(1)
  const [subBranchStampScale, setSubBranchStampScale] = React.useState<number>(1)
  const [subBranchSignatureScale, setSubBranchSignatureScale] = React.useState<number>(1)
  const [companyZoom, setCompanyZoom] = React.useState<number>(100)
  const [branchZoom, setBranchZoom] = React.useState<number>(100)
  const [subBranchZoom, setSubBranchZoom] = React.useState<number>(100)
  const [companyCustomStamps, setCompanyCustomStamps] = React.useState<CustomTextStamp[]>([])
  const [branchCustomStamps, setBranchCustomStamps] = React.useState<CustomTextStamp[]>([])
  const [subBranchCustomStamps, setSubBranchCustomStamps] = React.useState<CustomTextStamp[]>([])

  const addCustomStampTo = (
    setStamps: React.Dispatch<React.SetStateAction<CustomTextStamp[]>>,
    text = "OFFICIAL COPY",
    color = "#0d9488",
    bgStyle: "stamp" | "badge" | "clean" | "watermark" = "stamp"
  ) => {
    const newStamp: CustomTextStamp = {
      id: `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text,
      color,
      bgStyle,
      fontSize: 12,
      isBold: true,
      isItalic: false,
      rotation: bgStyle === "stamp" ? -12 : 0,
      x: Math.floor(Math.random() * 40) - 20,
      y: Math.floor(Math.random() * 40) - 20,
    }
    setStamps(prev => [...prev, newStamp])
  }

  const [activePreviewDocModal, setActivePreviewDocModal] = React.useState<{
    isOpen: boolean
    entityType: "company" | "branch" | "subbranch"
    companyData?: any
    branchData?: any
    subBranchData?: any
  } | null>(null)

  const [companyForm, setCompanyForm] = React.useState({
    name: "", brand_name: "", division_name: "", subtitle: "", slug: "", trademark_symbol: "",
    industry: "Technology", currency: "INR", logo_url: "",
    gstin: "", pan: "", cin: "", msme_reg: "", iso_certification: "An ISO 9001:2015 Certified Company",
    signatory_name: "", signatory_designation: "", signature_image_url: "", stamp_image_url: "",
    address: "", city: "", state: "", zip: "", country: "India", phone: "", email: "", website: "",
    bank_name: "", account_holder: "", account_number: "", ifsc_code: "", bank_branch: "", upi_id: "", payment_qr_url: "",
    gst_bank_name: "", gst_account_holder: "", gst_account_number: "", gst_ifsc_code: "", gst_bank_branch: "", gst_upi_id: "", gst_payment_qr_url: "",
    nongst_bank_name: "", nongst_account_holder: "", nongst_account_number: "", nongst_ifsc_code: "", nongst_bank_branch: "", nongst_upi_id: "", nongst_payment_qr_url: "",
    terms_conditions: "", invoice_notes: "", quotation_notes: "",
    status: "active"
  })

  const [showBranchModal, setShowBranchModal] = React.useState(false)
  const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null)
  const [branchCompanyId, setBranchCompanyId] = React.useState("")
  const [branchTab, setBranchTab] = React.useState<"basic" | "tax" | "stamp" | "bank" | "terms" | "preview">("basic")
  const [branchBankProfileTab, setBranchBankProfileTab] = React.useState<"gst" | "nongst">("gst")
  const [branchCopiedNotice, setBranchCopiedNotice] = React.useState(false)
  const [branchForm, setBranchForm] = React.useState({
    name: "", code: "", brand_name: "", division_name: "", subtitle: "",
    logo_url: "", payment_qr_url: "",
    gstin: "", pan: "", cin: "", msme_reg: "", iso_certification: "",
    signatory_name: "", signatory_designation: "", signature_image_url: "", stamp_image_url: "",
    address: "", city: "", state: "", zip: "", country: "India", phone: "", email: "", managerName: "", managerPhone: "",
    bank_name: "", account_holder: "", account_number: "", ifsc_code: "", bank_branch: "", upi_id: "",
    gst_bank_name: "", gst_account_holder: "", gst_account_number: "", gst_ifsc_code: "", gst_bank_branch: "", gst_upi_id: "", gst_payment_qr_url: "",
    nongst_bank_name: "", nongst_account_holder: "", nongst_account_number: "", nongst_ifsc_code: "", nongst_bank_branch: "", nongst_upi_id: "", nongst_payment_qr_url: "",
    terms_conditions: "", invoice_notes: "",
    status: "active"
  })

  const [showSubBranchModal, setShowSubBranchModal] = React.useState(false)
  const [editingSubBranch, setEditingSubBranch] = React.useState<SubBranch | null>(null)
  const [subBranchBranchId, setSubBranchBranchId] = React.useState("")
  const [subBranchCompanyId, setSubBranchCompanyId] = React.useState("")
  const [subBranchTab, setSubBranchTab] = React.useState<"partner" | "location" | "stamp" | "bank" | "terms" | "preview">("partner")
  const [subBranchBankProfileTab, setSubBranchBankProfileTab] = React.useState<"gst" | "nongst">("gst")
  const [subBranchCopiedNotice, setSubBranchCopiedNotice] = React.useState(false)
  const [subBranchForm, setSubBranchForm] = React.useState({
    name: "", code: "", partner_name: "", partner_phone: "", partner_email: "",
    revenue_share_pct: 0, partner_type: "Individual",
    address: "", city: "", state: "", phone: "", email: "",
    gstin: "", pan: "", cin: "", msme_reg: "", subtitle: "", iso_certification: "",
    // Fallback Banking
    bank_name: "", account_holder: "", account_number: "", ifsc_code: "", bank_branch: "", upi_id: "", payment_qr_url: "",
    // GST Banking Profile
    gst_bank_name: "", gst_account_holder: "", gst_account_number: "", gst_ifsc_code: "", gst_bank_branch: "", gst_upi_id: "", gst_payment_qr_url: "",
    // Non-GST Banking Profile
    nongst_bank_name: "", nongst_account_holder: "", nongst_account_number: "", nongst_ifsc_code: "", nongst_bank_branch: "", nongst_upi_id: "", nongst_payment_qr_url: "",
    logo_url: "", signature_image_url: "", stamp_image_url: "",
    signatory_name: "Partner Signatory", signatory_designation: "Franchise Partner",
    terms_conditions: "", invoice_notes: "",
    status: "active"
  })

  const [allUsers, setAllUsers] = React.useState<any[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{ type: "company" | "branch" | "sub_branch"; id: string } | null>(null)
  const [saving, setSaving] = React.useState(false)

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const deletedIds = await syncGlobalDeletedIds().catch(() => getLocalDeletedIds())

      const isCompanyDeleted = (id?: string | number, slug?: string) => {
        if (id && isGlobalItemDeleted(id, deletedIds, "companies")) return true
        if (slug && isGlobalItemDeleted(slug, deletedIds, "companies")) return true
        return false
      }

      const isBranchDeleted = (id?: string | number, code?: string) => {
        if (id && isGlobalItemDeleted(id, deletedIds, "branches")) return true
        if (code && isGlobalItemDeleted(code, deletedIds, "branches")) return true
        return false
      }

      const isSubBranchDeleted = (id?: string | number, code?: string) => {
        if (id && isGlobalItemDeleted(id, deletedIds, "sub_branches")) return true
        if (code && isGlobalItemDeleted(code, deletedIds, "sub_branches")) return true
        return false
      }

      const [compRes, branchRes, subBranchRes, dbComps, dbBranches, dbSubBranches, dbUsersList] = await Promise.all([
        CompanyApiService.getAll().catch(() => []),
        BranchApiService.getAll("all").catch(() => []),
        SubBranchApiService.getAll(undefined, "all").catch(() => []),
        fetchModuleDataFromDB<Company[]>("companies", [], "all").catch(() => []),
        fetchModuleDataFromDB<Branch[]>("branches", [], "all").catch(() => []),
        fetchModuleDataFromDB<SubBranch[]>("sub_branches", [], "all").catch(() => []),
        fetchModuleDataFromDB<any[]>("users", [], "all").catch(() => []),
      ])

      const cleanUsers = (dbUsersList || []).filter((u: any) => 
        !isGlobalItemDeleted(u.id, undefined, "users") && 
        !isGlobalItemDeleted(u.email, undefined, "users")
      )
      setAllUsers(cleanUsers)

      // 1. Merge Companies: Support all companies dynamically with full retention
      const compMap = new Map<string, Company>()

      // First add baseline canonical companies (Super Admin gets all, Company Admin gets only assigned)
      CANONICAL_COMPANIES.forEach(c => {
        if (!isSuperAdmin) {
          const isAssigned = userAssignedComps.length > 0
            ? userAssignedComps.some(target => isMatchingCompany(c, target))
            : isMatchingCompany(c, (user as any)?.companyId || (user as any)?.company_id)
          if (!isAssigned) return
        }
        const key = c.slug || c.id
        compMap.set(key, { ...c })
      })

      // Helper: check if a company is accessible to current user
      const isCompanyAllowed = (c: any): boolean => {
        if (isSuperAdmin) return true
        if (userAssignedComps.length > 0) {
          return userAssignedComps.some(target => isMatchingCompany(c, target))
        }
        const uComp = (user as any)?.companyId || (user as any)?.company_id
        return uComp ? isMatchingCompany(c, uComp) : false
      }

      // Overlay API companies (from MySQL) — only allowed companies for non-super-admins
      if (Array.isArray(compRes) && compRes.length > 0) {
        compRes.forEach(c => {
          if (!isCompanyDeleted(c.id, c.slug) && isCompanyAllowed(c)) {
            const key = c.slug || String(c.id)
            const prev = compMap.get(key) || compMap.get(c.slug) || compMap.get(String(c.id))
            compMap.set(key, { ...(prev || {}), ...c })
          }
        })
      }

      // Overlay persistent storage companies (from app_data) — only allowed companies
      if (Array.isArray(dbComps) && dbComps.length > 0) {
        dbComps.forEach(c => {
          if (!isCompanyDeleted(c.id, c.slug) && isCompanyAllowed(c)) {
            const key = c.slug || String(c.id)
            const prev = compMap.get(key) || compMap.get(c.slug) || compMap.get(String(c.id))
            compMap.set(key, { ...(prev || {}), ...c })
          }
        })
      }

      // Also overlay current auth store companies — only allowed companies
      const storeComps = useAuthStore.getState().companies
      if (Array.isArray(storeComps) && storeComps.length > 0) {
        storeComps.forEach(c => {
          if (!isCompanyDeleted(c.id, c.slug) && isCompanyAllowed(c)) {
            const key = c.slug || String(c.id)
            const prev = compMap.get(key) || compMap.get(c.slug) || compMap.get(String(c.id))
            compMap.set(key, { ...(prev || {}), ...c })
          }
        })
      }

      const finalCompanies: Company[] = Array.from(compMap.values()).map(c => {
        const uCount = getUserCountForCompany(c.id || c.slug)
        return {
          ...c,
          member_count: uCount,
          signature_position: c.signature_position || { x: 0, y: 0 },
          stamp_position: c.stamp_position || { x: 0, y: 0 },
          logo_position: c.logo_position || { x: 0, y: 0 },
          logo_scale: c.logo_scale ?? 1,
          stamp_scale: c.stamp_scale ?? 1,
          signature_scale: c.signature_scale ?? 1,
          custom_stamps: Array.isArray(c.custom_stamps) ? c.custom_stamps : [],
          invoice_customization: c.invoice_customization || { hidden_fields: [] },
        }
      })
      setCompanies(finalCompanies)

      // 2. Merge Branches: KEEP all branches belonging to active companies unless deleted
      const branchMap = new Map<string, Branch>()

      // First add baseline canonical branches for active companies (tech br-1, br-2)
      CANONICAL_BRANCHES.forEach(b => {
        if (!isBranchDeleted(b.id, b.code)) {
          const bComp = b.company_id || (b as any).companyId
          if (finalCompanies.some(c => isMatchingCompany(c, bComp))) {
            branchMap.set(String(b.id), { ...b, company_id: bComp, companyId: bComp })
          }
        }
      })

      // Overlay DB branches (from app_data)
      if (Array.isArray(dbBranches) && dbBranches.length > 0) {
        dbBranches.forEach(b => {
          if (!isBranchDeleted(b.id, b.code)) {
            const bComp = b.company_id || (b as any).companyId
            if (finalCompanies.some(c => isMatchingCompany(c, bComp))) {
              const strKey = String(b.id)
              const prev = branchMap.get(strKey)
              const resolvedComp = bComp || prev?.company_id || prev?.companyId
              branchMap.set(strKey, { ...prev, ...b, company_id: resolvedComp, companyId: resolvedComp })
            }
          }
        })
      }

      // Overlay API branches (from MySQL)
      if (Array.isArray(branchRes) && branchRes.length > 0) {
        branchRes.forEach(b => {
          if (!isBranchDeleted(b.id, b.code)) {
            const bComp = b.company_id || (b as any).companyId
            if (finalCompanies.some(c => isMatchingCompany(c, bComp))) {
              const strKey = String(b.id)
              const prev = branchMap.get(strKey)
              const resolvedComp = bComp || prev?.company_id || prev?.companyId
              branchMap.set(strKey, { ...prev, ...b, company_id: resolvedComp, companyId: resolvedComp })
            }
          }
        })
      }

      // Overlay Auth Store branches (created in branches section or companies section)
      const storeBranches = useAuthStore.getState().branches || []
      if (Array.isArray(storeBranches) && storeBranches.length > 0) {
        storeBranches.forEach(b => {
          if (!isBranchDeleted(b.id, b.code)) {
            const bComp = b.company_id || (b as any).companyId
            if (finalCompanies.some(c => isMatchingCompany(c, bComp))) {
              const strKey = String(b.id)
              const prev = branchMap.get(strKey)
              const resolvedComp = bComp || prev?.company_id || prev?.companyId
              branchMap.set(strKey, { ...prev, ...b, company_id: resolvedComp, companyId: resolvedComp })
            }
          }
        })
      }

      const finalBranches = Array.from(branchMap.values())
      setBranches(finalBranches)

      const validBranchIds = new Set(finalBranches.map(b => String(b.id).toLowerCase().trim()))

      // 3. Merge SubBranches (excluding deleted ones and sub-branches of deleted branches)
      const storeSubBranches = useAuthStore.getState().subBranches || []
      const combinedSubList = [
        ...(Array.isArray(dbSubBranches) ? dbSubBranches : []),
        ...(Array.isArray(subBranchRes) ? subBranchRes : []),
        ...(Array.isArray(storeSubBranches) ? storeSubBranches : [])
      ]
      const subMap = new Map<string, any>()
      combinedSubList.forEach(sb => {
        if (sb && sb.id) {
          subMap.set(String(sb.id), sb)
        }
      })
      const subList = Array.from(subMap.values()).filter(sb => {
        const sbBranch = String(sb.branch_id || (sb as any).branchId || '').toLowerCase().trim()
        return !isSubBranchDeleted(sb.id, sb.code) && (!sbBranch || validBranchIds.has(sbBranch))
      })
      setSubBranches(subList)

      // Persist fresh data to app_data cache for all users — Super Admin saves all companies,
      // other users only save branches/sub-branches (company list is scoped server-side)
      if (isSuperAdmin) {
        saveModuleDataToDB("companies", finalCompanies, "all").catch(() => {})
      }
      // Always cache branches/sub-branches so they survive refresh even when API is slow
      if (finalBranches.length > 0) {
        saveModuleDataToDB("branches", finalBranches, "all").catch(() => {})
      }
      if (subList.length > 0) {
        saveModuleDataToDB("sub_branches", subList, "all").catch(() => {})
      }
      setExpandedCompanies(prev => new Set([...Array.from(prev), ...finalCompanies.map(c => c.id)]))
    } catch (err: any) {
      setError(err?.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [activeCompanyId, isSuperAdmin, userAssignedComps, user])

  React.useEffect(() => { loadData() }, [loadData])

  const toggleCompanyExpand = (companyId: string) => {
    setExpandedCompanies(prev => {
      const next = new Set(prev)
      next.has(companyId) ? next.delete(companyId) : next.add(companyId)
      return next
    })
  }

  const toggleBranchExpand = (branchId: string) => {
    setExpandedBranches(prev => {
      const next = new Set(prev)
      next.has(branchId) ? next.delete(branchId) : next.add(branchId)
      return next
    })
  }

  const getBranchesForCompany = (companyId: string) => {
    const comp = companies.find(c => isMatchingCompany(c, companyId))
    if (!comp) return []
    return branches.filter(b => {
      const bComp = b.company_id || (b as any).companyId
      return isMatchingCompany(comp, bComp)
    })
  }

  const getSubBranchesForBranch = (branchId: string | number) => {
    return subBranches.filter(sb => {
      const sbBranch = sb.branch_id || (sb as any).branchId || (sb as any).parentBranchId
      return String(sbBranch) === String(branchId)
    })
  }
  const getUserCountForCompany = (compInput: string | Company) => {
    const targetComp = typeof compInput === "object" && compInput !== null
      ? compInput
      : companies.find(c => isMatchingCompany(c, compInput)) || { id: compInput, slug: compInput }

    return (allUsers || []).filter(u => {
      const uCompId = u.company_id || u.companyId
      if (uCompId && isMatchingCompany(targetComp, uCompId)) return true
      if (Array.isArray(u.companyIds)) {
        return u.companyIds.some((id: any) => isMatchingCompany(targetComp, id))
      }
      return false
    }).length
  }

  const filteredCompanies = React.useMemo(() => {
    return companies.filter(c => {
      // 1. Role Scope Restriction: Non-Super-Admins can ONLY see their assigned company
      if (!isSuperAdmin) {
        if (userAssignedComps.length > 0) {
          const isAssigned = userAssignedComps.some(target => isMatchingCompany(c, target))
          if (!isAssigned) return false
        } else {
          const uComp = (user as any)?.companyId || (user as any)?.company_id
          if (uComp && !isMatchingCompany(c, uComp)) return false
          if (!uComp) return false
        }
      }

      // 2. Active Company Filter (from Topbar switcher):
      // When activeCompanyId is set to a specific company (not "all"), ONLY show that company!
      if (activeCompanyId && activeCompanyId !== "all") {
        if (!isMatchingCompany(c, activeCompanyId)) return false
      }

      // 3. Search & Industry Filters
      const matchesSearch = !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.slug?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesIndustry = !industryFilter || c.industry === industryFilter
      return matchesSearch && matchesIndustry
    })
  }, [companies, searchQuery, industryFilter, isSuperAdmin, userAssignedComps, activeCompanyId, user])

  // ── COMPANY MODAL OPENERS ──────────────────────────────────────────────────
  const openAddCompany = () => {
    setEditingCompany(null)
    setCompanyTab("identity")
    setCompanyBankSubTab("gst")
    setCompanySignaturePos({ x: 0, y: 0 })
    setCompanyStampPos({ x: 0, y: 0 })
    setCompanyLogoScale(1)
    setCompanyStampScale(1)
    setCompanySignatureScale(1)
    setCompanyCustomStamps([])
    setCompanyZoom(100)
    setPreviewInvoiceType("gst")
    setCompanyForm({
      name: "", brand_name: "SAAMPARK", division_name: "", subtitle: "", slug: "", trademark_symbol: "",
      industry: "Technology", currency: "INR", logo_url: "",
      gstin: "", pan: "", cin: "", msme_reg: "", iso_certification: "An ISO 9001:2015 Certified Company",
      signatory_name: "Authorized Signatory", signatory_designation: "Managing Director", signature_image_url: "", stamp_image_url: "",
      address: "", city: "Kolkata", state: "West Bengal", zip: "", country: "India", phone: "", email: "", website: "",
      bank_name: "", account_holder: "", account_number: "", ifsc_code: "", bank_branch: "", upi_id: "", payment_qr_url: "",
      gst_bank_name: "", gst_account_holder: "", gst_account_number: "", gst_ifsc_code: "", gst_bank_branch: "", gst_upi_id: "", gst_payment_qr_url: "",
      nongst_bank_name: "", nongst_account_holder: "", nongst_account_number: "", nongst_ifsc_code: "", nongst_bank_branch: "", nongst_upi_id: "", nongst_payment_qr_url: "",
      terms_conditions: "1. All disputes subject to local jurisdiction only.\n2. Goods/Services once delivered are non-refundable.\n3. Disputed items must be notified within 7 business days.",
      invoice_notes: "Thank you for partnering with us. Please remit payment according to the stated terms.",
      quotation_notes: "This quotation is valid for 30 calendar days from the date of issuance.",
      status: "active"
    })
    setShowCompanyModal(true)
  }

  const openEditCompany = (c: any) => {
    setEditingCompany(c)
    setCompanyTab("identity")
    setCompanyBankSubTab("gst")
    setCompanySignaturePos(c.signature_position || { x: 0, y: 0 })
    setCompanyStampPos(c.stamp_position || { x: 0, y: 0 })
    setCompanyLogoScale(c.logo_scale ?? 1)
    setCompanyStampScale(c.stamp_scale ?? 1)
    setCompanySignatureScale(c.signature_scale ?? 1)
    setCompanyCustomStamps(Array.isArray(c.custom_stamps) ? c.custom_stamps : [])
    setCompanyZoom(c.zoom || 100)
    setPreviewInvoiceType(c.preview_invoice_type || "gst")
    setCompanyForm({
      name: c.name || "", brand_name: c.brand_name || "", division_name: c.division_name || "", subtitle: c.subtitle || "", slug: c.slug || "", trademark_symbol: c.trademark_symbol || "",
      industry: c.industry || "Technology", currency: c.currency || "INR", logo_url: c.logo_url || "",
      gstin: c.gstin || "", pan: c.pan || "", cin: c.cin || "", msme_reg: c.msme_reg || "",
      iso_certification: c.iso_certification ?? "An ISO 9001:2015 Certified Company",
      signatory_name: c.signatory_name || "Authorized Signatory", signatory_designation: c.signatory_designation || "Managing Director", signature_image_url: c.signature_image_url || "", stamp_image_url: c.stamp_image_url || "",
      address: c.address || "", city: c.city || "", state: c.state || "", zip: c.zip || "", country: c.country || "India", phone: c.phone || "", email: c.email || "", website: c.website || "",
      bank_name: c.bank_name || "",
      account_holder: c.account_holder || "",
      account_number: c.account_number || "",
      ifsc_code: c.ifsc_code || "",
      bank_branch: c.bank_branch || "",
      upi_id: c.upi_id || "",
      payment_qr_url: c.payment_qr_url || "",
      gst_bank_name: c.gst_bank_name || "",
      gst_account_holder: c.gst_account_holder || "",
      gst_account_number: c.gst_account_number || "",
      gst_ifsc_code: c.gst_ifsc_code || "",
      gst_bank_branch: c.gst_bank_branch || "",
      gst_upi_id: c.gst_upi_id || "",
      gst_payment_qr_url: c.gst_payment_qr_url || "",
      nongst_bank_name: c.nongst_bank_name || "",
      nongst_account_holder: c.nongst_account_holder || "",
      nongst_account_number: c.nongst_account_number || "",
      nongst_ifsc_code: c.nongst_ifsc_code || "",
      nongst_bank_branch: c.nongst_bank_branch || "",
      nongst_upi_id: c.nongst_upi_id || "",
      nongst_payment_qr_url: c.nongst_payment_qr_url || "",
      terms_conditions: c.terms_conditions || c.terms || "1. All disputes subject to local jurisdiction only.\n2. Goods/Services once delivered are non-refundable.\n3. Disputed items must be notified within 7 business days.",
      invoice_notes: c.invoice_notes || c.notes || "Thank you for partnering with us. Please remit payment according to the stated terms.",
      quotation_notes: c.quotation_notes || "This quotation is valid for 30 calendar days from the date of issuance.",
      status: c.status || "active"
    })
    setShowCompanyModal(true)
  }

  const [previewSaveSuccess, setPreviewSaveSuccess] = React.useState(false)

  const saveCompany = async (keepModalOpen = false) => {
    if (!companyForm.name.trim()) return
    setSaving(true)
    try {
      const cur = CURRENCIES.find(c => c.code === companyForm.currency)
      const payload = {
        ...companyForm,
        name: companyForm.name.trim(),
        slug: companyForm.slug.trim() || generateSlug(companyForm.name.trim()),
        trademark_symbol: companyForm.trademark_symbol || "",
        currency_symbol: cur?.symbol || "₹",
        signature_position: companySignaturePos,
        stamp_position: companyStampPos,
        logo_scale: companyLogoScale,
        stamp_scale: companyStampScale,
        signature_scale: companySignatureScale,
        custom_stamps: companyCustomStamps,
        zoom: companyZoom,
        preview_invoice_type: previewInvoiceType,
        // Align legacy bank fields to edited profile so old values don't linger
        bank_name: companyForm.gst_bank_name || companyForm.nongst_bank_name || "",
        account_holder: companyForm.gst_account_holder || companyForm.nongst_account_holder || "",
        account_number: companyForm.gst_account_number || companyForm.nongst_account_number || "",
        ifsc_code: companyForm.gst_ifsc_code || companyForm.nongst_ifsc_code || "",
        bank_branch: companyForm.gst_bank_branch || companyForm.nongst_bank_branch || "",
        upi_id: companyForm.gst_upi_id || companyForm.nongst_upi_id || "",
        payment_qr_url: companyForm.gst_payment_qr_url || companyForm.nongst_payment_qr_url || "",
      }

      const targetId = (editingCompany as any)?.numeric_id || editingCompany?.id || editingCompany?.slug || payload.slug
      const compKey = editingCompany ? (editingCompany.slug || String(editingCompany.id)) : payload.slug

      // 1. Immediately update React state for instant UI response
      setCompanies(prev => {
        const idx = prev.findIndex(c => isMatchingCompany(c, compKey))
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], ...payload, id: payload.slug || next[idx].id, slug: payload.slug || next[idx].slug }
          return next
        }
        return [...prev, { ...payload, id: payload.slug, slug: payload.slug } as Company]
      })

      if (editingCompany) {
        setEditingCompany((prev: any) => ({ ...prev, ...payload }))
      }

      // 2. Sync into useAuthStore state (now sends ALL fields to backend API)
      const { updateCompany, addCompany } = useAuthStore.getState()
      if (editingCompany) {
        await updateCompany(compKey, payload).catch(() => {})
      } else {
        await addCompany(payload).catch(() => {})
      }

      // 3. Also directly persist full payload to MySQL via CompanyApiService
      try {
        if (editingCompany) {
          await CompanyApiService.update(String(targetId), payload)
        } else {
          await CompanyApiService.create(payload)
        }
      } catch (apiErr) {
        console.warn("Company API save warning:", apiErr)
      }

      // 4. Persist all companies to app_data for guaranteed retention
      const currentComps = useAuthStore.getState().companies
      await saveModuleDataToDB("companies", currentComps, "all").catch(() => {})

      // 5. Dispatch events so all tabs / preview sync immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("saampark_company_updated", { detail: payload }))
        window.dispatchEvent(new CustomEvent("saampark_data_synced"))
        window.dispatchEvent(new Event("storage"))
      }

      if (keepModalOpen) {
        setPreviewSaveSuccess(true)
        setTimeout(() => setPreviewSaveSuccess(false), 3000)
      } else {
        setShowCompanyModal(false)
        setEditingCompany(null)
      }

      // 6. Refresh companies in auth store in background (non-blocking)
      useAuthStore.getState().fetchCompanies().catch(() => {})
    } catch (err) {
      console.error("Error saving company:", err)
      alert("Failed to save company.")
    } finally {
      setSaving(false)
    }
  }

  // ── BRANCH MODAL OPENERS ───────────────────────────────────────────────────
  const openAddBranch = (companyId: string) => {
    setEditingBranch(null)
    setBranchCompanyId(companyId)
    setBranchTab("basic")
    setBranchBankProfileTab("gst")
    setBranchSignaturePos({ x: 0, y: 0 })
    setBranchStampPos({ x: 0, y: 0 })
    setBranchLogoScale(1)
    setBranchStampScale(1)
    setBranchSignatureScale(1)
    setBranchCustomStamps([])
    setBranchZoom(100)
    setPreviewInvoiceType("gst")
    setBranchForm({
      name: "",
      code: `BR-${Math.floor(100 + Math.random() * 900)}`,
      brand_name: "SAAMPARK",
      division_name: "",
      subtitle: "",
      logo_url: "",
      payment_qr_url: "",
      gstin: "",
      pan: "",
      cin: "",
      msme_reg: "",
      iso_certification: "",
      signatory_name: "Authorized Signatory",
      signatory_designation: "Branch Manager",
      signature_image_url: "",
      stamp_image_url: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "India",
      phone: "",
      email: "",
      managerName: "",
      managerPhone: "",
      bank_name: "",
      account_holder: "",
      account_number: "",
      ifsc_code: "",
      bank_branch: "",
      upi_id: "",
      gst_bank_name: "",
      gst_account_holder: "",
      gst_account_number: "",
      gst_ifsc_code: "",
      gst_bank_branch: "",
      gst_upi_id: "",
      gst_payment_qr_url: "",
      nongst_bank_name: "",
      nongst_account_holder: "",
      nongst_account_number: "",
      nongst_ifsc_code: "",
      nongst_bank_branch: "",
      nongst_upi_id: "",
      nongst_payment_qr_url: "",
      terms_conditions: "",
      invoice_notes: "",
      status: "active"
    })
    setShowBranchModal(true)
  }

  const openEditBranch = (b: any) => {
    setEditingBranch(b)
    setBranchCompanyId(b.company_id || b.companyId)
    setBranchTab("basic")
    setBranchBankProfileTab("gst")
    setBranchSignaturePos(b.signature_position || { x: 0, y: 0 })
    setBranchStampPos(b.stamp_position || { x: 0, y: 0 })
    setBranchLogoScale(b.logo_scale ?? 1)
    setBranchStampScale(b.stamp_scale ?? 1)
    setBranchSignatureScale(b.signature_scale ?? 1)
    setBranchCustomStamps(Array.isArray(b.custom_stamps) ? b.custom_stamps : [])
    setBranchZoom(b.zoom || 100)
    setPreviewInvoiceType(b.preview_invoice_type || "gst")
    setBranchForm({
      name: b.name || "", code: b.code || "", brand_name: b.brand_name || "", division_name: b.division_name || "", subtitle: b.subtitle || "",
      logo_url: b.logo_url || "", payment_qr_url: b.payment_qr_url || "",
      gstin: b.gstin || "", pan: b.pan || "", cin: b.cin || "", msme_reg: b.msme_reg || "", iso_certification: b.iso_certification || "",
      signatory_name: b.signatory_name || "Authorized Signatory", signatory_designation: b.signatory_designation || "Branch Manager", signature_image_url: b.signature_image_url || "", stamp_image_url: b.stamp_image_url || "",
      address: b.address || "", city: b.city || "", state: b.state || "", zip: b.zip || "", country: b.country || "India", phone: b.phone || "", email: b.email || "", managerName: b.managerName || "", managerPhone: b.managerPhone || "",
      bank_name: b.bank_name || b.bankDetails?.bankName || "", account_holder: b.account_holder || b.bankDetails?.accountHolder || "", account_number: b.account_number || b.bankDetails?.accountNumber || "", ifsc_code: b.ifsc_code || b.bankDetails?.ifscCode || "", bank_branch: b.bank_branch || "", upi_id: b.upi_id || b.bankDetails?.upiId || "",
      gst_bank_name: b.gst_bank_name || b.bank_name || b.bankDetails?.bankName || "",
      gst_account_holder: b.gst_account_holder || b.account_holder || b.bankDetails?.accountHolder || "",
      gst_account_number: b.gst_account_number || b.account_number || b.bankDetails?.accountNumber || "",
      gst_ifsc_code: b.gst_ifsc_code || b.ifsc_code || b.bankDetails?.ifscCode || "",
      gst_bank_branch: b.gst_bank_branch || b.bank_branch || "",
      gst_upi_id: b.gst_upi_id || b.upi_id || b.bankDetails?.upiId || "",
      gst_payment_qr_url: b.gst_payment_qr_url || b.payment_qr_url || "",
      nongst_bank_name: b.nongst_bank_name || b.bank_name || b.bankDetails?.bankName || "",
      nongst_account_holder: b.nongst_account_holder || b.account_holder || b.bankDetails?.accountHolder || "",
      nongst_account_number: b.nongst_account_number || b.account_number || b.bankDetails?.accountNumber || "",
      nongst_ifsc_code: b.nongst_ifsc_code || b.ifsc_code || b.bankDetails?.ifscCode || "",
      nongst_bank_branch: b.nongst_bank_branch || b.bank_branch || "",
      nongst_upi_id: b.nongst_upi_id || b.upi_id || b.bankDetails?.upiId || "",
      nongst_payment_qr_url: b.nongst_payment_qr_url || b.payment_qr_url || "",
      terms_conditions: b.terms_conditions || "",
      invoice_notes: b.invoice_notes || "",
      status: b.status || "active"
    })
    setShowBranchModal(true)
  }

  const handleCopyBranchGstToNongst = () => {
    setBranchForm(prev => ({
      ...prev,
      nongst_bank_name: prev.gst_bank_name || prev.bank_name,
      nongst_account_holder: prev.gst_account_holder || prev.account_holder,
      nongst_account_number: prev.gst_account_number || prev.account_number,
      nongst_ifsc_code: prev.gst_ifsc_code || prev.ifsc_code,
      nongst_bank_branch: prev.gst_bank_branch || prev.bank_branch,
      nongst_upi_id: prev.gst_upi_id || prev.upi_id,
      nongst_payment_qr_url: prev.gst_payment_qr_url || prev.payment_qr_url,
    }))
  }

  const handleCopyCompanyDetailsToBranch = () => {
    const parentCompany = companies.find(c => isMatchingCompany(c, branchCompanyId))
    if (!parentCompany) return
    setBranchForm(prev => ({
      ...prev,
      gst_bank_name: parentCompany.gst_bank_name || parentCompany.bank_name || prev.gst_bank_name,
      gst_account_holder: parentCompany.gst_account_holder || parentCompany.account_holder || prev.gst_account_holder,
      gst_account_number: parentCompany.gst_account_number || parentCompany.account_number || prev.gst_account_number,
      gst_ifsc_code: parentCompany.gst_ifsc_code || parentCompany.ifsc_code || prev.gst_ifsc_code,
      gst_bank_branch: parentCompany.gst_bank_branch || parentCompany.bank_branch || prev.gst_bank_branch,
      gst_upi_id: parentCompany.gst_upi_id || parentCompany.upi_id || prev.gst_upi_id,
      gst_payment_qr_url: parentCompany.gst_payment_qr_url || parentCompany.payment_qr_url || prev.gst_payment_qr_url,
      nongst_bank_name: parentCompany.nongst_bank_name || parentCompany.bank_name || prev.nongst_bank_name,
      nongst_account_holder: parentCompany.nongst_account_holder || parentCompany.account_holder || prev.nongst_account_holder,
      nongst_account_number: parentCompany.nongst_account_number || parentCompany.account_number || prev.nongst_account_number,
      nongst_ifsc_code: parentCompany.nongst_ifsc_code || parentCompany.ifsc_code || prev.nongst_ifsc_code,
      nongst_bank_branch: parentCompany.nongst_bank_branch || parentCompany.bank_branch || prev.nongst_bank_branch,
      nongst_upi_id: parentCompany.nongst_upi_id || parentCompany.upi_id || prev.nongst_upi_id,
      nongst_payment_qr_url: parentCompany.nongst_payment_qr_url || parentCompany.payment_qr_url || prev.nongst_payment_qr_url,
      bank_name: parentCompany.gst_bank_name || parentCompany.bank_name || prev.bank_name,
      account_holder: parentCompany.gst_account_holder || parentCompany.account_holder || prev.account_holder,
      account_number: parentCompany.gst_account_number || parentCompany.account_number || prev.account_number,
      ifsc_code: parentCompany.gst_ifsc_code || parentCompany.ifsc_code || prev.ifsc_code,
      bank_branch: parentCompany.gst_bank_branch || parentCompany.bank_branch || prev.bank_branch,
      upi_id: parentCompany.gst_upi_id || parentCompany.upi_id || prev.upi_id,
      payment_qr_url: parentCompany.gst_payment_qr_url || parentCompany.payment_qr_url || prev.payment_qr_url,
      signatory_name: parentCompany.signatory_name || prev.signatory_name,
      signatory_designation: parentCompany.signatory_designation || prev.signatory_designation,
      signature_image_url: parentCompany.signature_image_url || prev.signature_image_url,
      stamp_image_url: parentCompany.stamp_image_url || prev.stamp_image_url,
      terms_conditions: parentCompany.terms_conditions || (parentCompany as any).terms || prev.terms_conditions,
      invoice_notes: parentCompany.invoice_notes || (parentCompany as any).notes || prev.invoice_notes,
    }))
    setBranchCopiedNotice(true)
    setTimeout(() => setBranchCopiedNotice(false), 2500)
  }

  const [branchPreviewSaveSuccess, setBranchPreviewSaveSuccess] = React.useState(false)

  const saveBranch = async (keepModalOpen = false) => {
    if (!branchForm.name.trim()) return
    setSaving(true)
    try {
      const curComp = companies.find(c => isMatchingCompany(c, branchCompanyId))
      const resolvedCompSlug = curComp?.slug || String(curComp?.id || branchCompanyId || "tech")
      // Use actual numeric ID from the company object (populated from MySQL API response)
      const resolvedCompNumeric = (curComp as any)?.numeric_id || (Number.isFinite(Number(curComp?.id)) ? Number(curComp?.id) : null) || 1

      const payload: any = {
        ...branchForm,
        name: branchForm.name.trim(),
        code: branchForm.code.trim().toUpperCase(),
        companyId: resolvedCompSlug,
        company_id: resolvedCompNumeric,
        signature_position: branchSignaturePos,
        stamp_position: branchStampPos,
        logo_scale: branchLogoScale,
        stamp_scale: branchStampScale,
        signature_scale: branchSignatureScale,
        custom_stamps: branchCustomStamps,
        zoom: branchZoom,
        preview_invoice_type: previewInvoiceType,
        // Base fallback banking
        bank_name: (branchForm.gst_bank_name || branchForm.bank_name || branchForm.nongst_bank_name || "").trim(),
        account_holder: (branchForm.gst_account_holder || branchForm.account_holder || branchForm.nongst_account_holder || "").trim(),
        account_number: (branchForm.gst_account_number || branchForm.account_number || branchForm.nongst_account_number || "").trim(),
        ifsc_code: (branchForm.gst_ifsc_code || branchForm.ifsc_code || branchForm.nongst_ifsc_code || "").trim().toUpperCase(),
        bank_branch: (branchForm.gst_bank_branch || branchForm.bank_branch || branchForm.nongst_bank_branch || "").trim(),
        upi_id: (branchForm.gst_upi_id || branchForm.upi_id || branchForm.nongst_upi_id || "").trim(),
        payment_qr_url: branchForm.gst_payment_qr_url || branchForm.payment_qr_url || branchForm.nongst_payment_qr_url || "",
        bankDetails: {
          bankName: (branchForm.gst_bank_name || branchForm.bank_name || branchForm.nongst_bank_name || "").trim(),
          accountHolder: (branchForm.gst_account_holder || branchForm.account_holder || branchForm.nongst_account_holder || "").trim(),
          accountNumber: (branchForm.gst_account_number || branchForm.account_number || branchForm.nongst_account_number || "").trim(),
          ifscCode: (branchForm.gst_ifsc_code || branchForm.ifsc_code || branchForm.nongst_ifsc_code || "").trim().toUpperCase(),
          upiId: (branchForm.gst_upi_id || branchForm.upi_id || branchForm.nongst_upi_id || "").trim(),
        }
      }

      unmarkGlobalItemDeleted(payload.code, "branches")
      if (editingBranch?.id) unmarkGlobalItemDeleted(editingBranch.id, "branches")

      let savedBranch: any = null
      if (editingBranch) {
        await BranchApiService.update(String(editingBranch.id), payload)
        savedBranch = { ...editingBranch, ...payload }
        setEditingBranch(savedBranch)
        setBranches(prev => prev.map(b => String(b.id) === String(editingBranch.id) ? savedBranch : b))
      } else {
        const apiRes = await BranchApiService.create(String(resolvedCompNumeric), payload)
        const realId = apiRes?.id || apiRes?.data?.id
        if (!realId) {
          throw new Error("Branch creation did not return a valid ID from the server.")
        }
        savedBranch = { ...payload, id: realId, company_id: resolvedCompNumeric, companyId: resolvedCompSlug }
        setBranches(prev => [...prev.filter(b => String(b.id) !== String(realId)), savedBranch])
      }

      // Update auth store in memory for global components
      const curStoreBranches = useAuthStore.getState().branches || []
      const nextStoreBranches = editingBranch
        ? curStoreBranches.map(b => String(b.id) === String(editingBranch.id) ? savedBranch : b)
        : [...curStoreBranches.filter(b => String(b.id) !== String(savedBranch.id)), savedBranch]
      useAuthStore.setState({ branches: nextStoreBranches })

      // Always persist branches to app_data so they survive page refresh for all users
      saveModuleDataToDB("branches", nextStoreBranches, "all").catch(() => {})

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"))
        window.dispatchEvent(new CustomEvent("saampark_data_synced"))
      }

      if (keepModalOpen) {
        setBranchPreviewSaveSuccess(true)
        setTimeout(() => setBranchPreviewSaveSuccess(false), 3000)
      } else {
        setShowBranchModal(false)
        setEditingBranch(null)
      }
      setExpandedCompanies(prev => new Set([...prev, branchCompanyId]))
    } catch (err) {
      console.error("Error saving branch:", err)
      alert("Failed to save branch.")
    } finally {
      setSaving(false)
    }
  }

  // ── SUB-BRANCH MODAL OPENERS ───────────────────────────────────────────────
  const openAddSubBranch = (branchId: string, companyId: string) => {
    setEditingSubBranch(null)
    setSubBranchBranchId(branchId)
    setSubBranchCompanyId(companyId)
    setSubBranchTab("partner")
    setSubBranchBankProfileTab("gst")
    setSubBranchSignaturePos({ x: 0, y: 0 })
    setSubBranchStampPos({ x: 0, y: 0 })
    setSubBranchLogoScale(1)
    setSubBranchStampScale(1)
    setSubBranchSignatureScale(1)
    setSubBranchCustomStamps([])
    setSubBranchZoom(100)
    setPreviewInvoiceType("gst")
    setSubBranchForm({
      name: "",
      code: `SB-${Math.floor(100 + Math.random() * 900)}`,
      partner_name: "",
      partner_phone: "",
      partner_email: "",
      revenue_share_pct: 0,
      partner_type: "Regional Associate",
      address: "",
      city: "",
      state: "",
      phone: "",
      email: "",
      gstin: "",
      pan: "",
      cin: "",
      msme_reg: "",
      subtitle: "",
      iso_certification: "",
      bank_name: "",
      account_holder: "",
      account_number: "",
      ifsc_code: "",
      bank_branch: "",
      upi_id: "",
      payment_qr_url: "",
      gst_bank_name: "",
      gst_account_holder: "",
      gst_account_number: "",
      gst_ifsc_code: "",
      gst_bank_branch: "",
      gst_upi_id: "",
      gst_payment_qr_url: "",
      nongst_bank_name: "",
      nongst_account_holder: "",
      nongst_account_number: "",
      nongst_ifsc_code: "",
      nongst_bank_branch: "",
      nongst_upi_id: "",
      nongst_payment_qr_url: "",
      logo_url: "",
      signature_image_url: "",
      stamp_image_url: "",
      signatory_name: "Authorized Signatory",
      signatory_designation: "Partner",
      terms_conditions: "",
      invoice_notes: "",
      status: "active"
    })
    setShowSubBranchModal(true)
  }

  const openEditSubBranch = (sb: any) => {
    setEditingSubBranch(sb)
    setSubBranchBranchId(sb.branch_id)
    setSubBranchCompanyId(sb.company_id)
    setSubBranchTab("partner")
    setSubBranchBankProfileTab("gst")
    setSubBranchSignaturePos(sb.signature_position || { x: 0, y: 0 })
    setSubBranchStampPos(sb.stamp_position || { x: 0, y: 0 })
    setSubBranchLogoScale(sb.logo_scale ?? 1)
    setSubBranchStampScale(sb.stamp_scale ?? 1)
    setSubBranchSignatureScale(sb.signature_scale ?? 1)
    setSubBranchCustomStamps(Array.isArray(sb.custom_stamps) ? sb.custom_stamps : [])
    setSubBranchZoom(sb.zoom || 100)
    setPreviewInvoiceType(sb.preview_invoice_type || "gst")
    setSubBranchForm({
      name: sb.name || "", 
      code: sb.code || "", 
      partner_name: sb.partner_name || "", 
      partner_phone: sb.partner_phone || "", 
      partner_email: sb.partner_email || "",
      revenue_share_pct: sb.revenue_share_pct != null ? Number(sb.revenue_share_pct) : 30, 
      partner_type: sb.partner_type || "Franchise Partner",
      address: sb.address || "", 
      city: sb.city || "", 
      state: sb.state || "", 
      phone: sb.phone || "", 
      email: sb.email || "",
      gstin: sb.gstin || "", 
      pan: sb.pan || "", 
      cin: sb.cin || "",
      msme_reg: sb.msme_reg || "",
      subtitle: sb.subtitle || "",
      iso_certification: sb.iso_certification || "",
      // Base Banking
      bank_name: sb.bank_name || sb.bankDetails?.bankName || "", 
      account_holder: sb.account_holder || sb.bankDetails?.accountHolder || "",
      account_number: sb.account_number || sb.bankDetails?.accountNumber || "", 
      ifsc_code: sb.ifsc_code || sb.bankDetails?.ifscCode || "", 
      bank_branch: sb.bank_branch || "",
      upi_id: sb.upi_id || sb.bankDetails?.upiId || "", 
      payment_qr_url: sb.payment_qr_url || "",
      // GST Profile
      gst_bank_name: sb.gst_bank_name || sb.bank_name || sb.bankDetails?.bankName || "",
      gst_account_holder: sb.gst_account_holder || sb.account_holder || sb.bankDetails?.accountHolder || "",
      gst_account_number: sb.gst_account_number || sb.account_number || sb.bankDetails?.accountNumber || "",
      gst_ifsc_code: sb.gst_ifsc_code || sb.ifsc_code || sb.bankDetails?.ifscCode || "",
      gst_bank_branch: sb.gst_bank_branch || sb.bank_branch || "",
      gst_upi_id: sb.gst_upi_id || sb.upi_id || sb.bankDetails?.upiId || "",
      gst_payment_qr_url: sb.gst_payment_qr_url || sb.payment_qr_url || "",
      // Non-GST Profile
      nongst_bank_name: sb.nongst_bank_name || sb.bank_name || sb.bankDetails?.bankName || "",
      nongst_account_holder: sb.nongst_account_holder || sb.account_holder || sb.bankDetails?.accountHolder || "",
      nongst_account_number: sb.nongst_account_number || sb.account_number || sb.bankDetails?.accountNumber || "",
      nongst_ifsc_code: sb.nongst_ifsc_code || sb.ifsc_code || sb.bankDetails?.ifscCode || "",
      nongst_bank_branch: sb.nongst_bank_branch || sb.bank_branch || "",
      nongst_upi_id: sb.nongst_upi_id || sb.upi_id || sb.bankDetails?.upiId || "",
      nongst_payment_qr_url: sb.nongst_payment_qr_url || sb.payment_qr_url || "",
      logo_url: sb.logo_url || "", 
      signature_image_url: sb.signature_image_url || "", 
      stamp_image_url: sb.stamp_image_url || "", 
      signatory_name: sb.signatory_name || "Partner Signatory", 
      signatory_designation: sb.signatory_designation || "Franchise Partner",
      terms_conditions: sb.terms_conditions || "",
      invoice_notes: sb.invoice_notes || "",
      status: sb.status || "active"
    })
    setShowSubBranchModal(true)
  }

  const handleCopySubBranchGstToNongst = () => {
    setSubBranchForm(prev => ({
      ...prev,
      nongst_bank_name: prev.gst_bank_name || prev.bank_name,
      nongst_account_holder: prev.gst_account_holder || prev.account_holder,
      nongst_account_number: prev.gst_account_number || prev.account_number,
      nongst_ifsc_code: prev.gst_ifsc_code || prev.ifsc_code,
      nongst_bank_branch: prev.gst_bank_branch || prev.bank_branch,
      nongst_upi_id: prev.gst_upi_id || prev.upi_id,
      nongst_payment_qr_url: prev.gst_payment_qr_url || prev.payment_qr_url,
    }))
  }

  const handleCopyCompanyDetailsToSubBranch = () => {
    const pBranch = branches.find(b => b.id === subBranchBranchId)
    const parentCompany = companies.find(c => isMatchingCompany(c, subBranchCompanyId) || (pBranch && isMatchingCompany(c, pBranch.company_id)))
    if (!parentCompany) return
    setSubBranchForm(prev => ({
      ...prev,
      gst_bank_name: parentCompany.gst_bank_name || parentCompany.bank_name || prev.gst_bank_name,
      gst_account_holder: parentCompany.gst_account_holder || parentCompany.account_holder || prev.gst_account_holder,
      gst_account_number: parentCompany.gst_account_number || parentCompany.account_number || prev.gst_account_number,
      gst_ifsc_code: parentCompany.gst_ifsc_code || parentCompany.ifsc_code || prev.gst_ifsc_code,
      gst_bank_branch: parentCompany.gst_bank_branch || parentCompany.bank_branch || prev.gst_bank_branch,
      gst_upi_id: parentCompany.gst_upi_id || parentCompany.upi_id || prev.gst_upi_id,
      gst_payment_qr_url: parentCompany.gst_payment_qr_url || parentCompany.payment_qr_url || prev.gst_payment_qr_url,
      nongst_bank_name: parentCompany.nongst_bank_name || parentCompany.bank_name || prev.nongst_bank_name,
      nongst_account_holder: parentCompany.nongst_account_holder || parentCompany.account_holder || prev.nongst_account_holder,
      nongst_account_number: parentCompany.nongst_account_number || parentCompany.account_number || prev.nongst_account_number,
      nongst_ifsc_code: parentCompany.nongst_ifsc_code || parentCompany.ifsc_code || prev.nongst_ifsc_code,
      nongst_bank_branch: parentCompany.nongst_bank_branch || parentCompany.bank_branch || prev.nongst_bank_branch,
      nongst_upi_id: parentCompany.nongst_upi_id || parentCompany.upi_id || prev.nongst_upi_id,
      nongst_payment_qr_url: parentCompany.nongst_payment_qr_url || parentCompany.payment_qr_url || prev.nongst_payment_qr_url,
      bank_name: parentCompany.gst_bank_name || parentCompany.bank_name || prev.bank_name,
      account_holder: parentCompany.gst_account_holder || parentCompany.account_holder || prev.account_holder,
      account_number: parentCompany.gst_account_number || parentCompany.account_number || prev.account_number,
      ifsc_code: parentCompany.gst_ifsc_code || parentCompany.ifsc_code || prev.ifsc_code,
      bank_branch: parentCompany.gst_bank_branch || parentCompany.bank_branch || prev.bank_branch,
      upi_id: parentCompany.gst_upi_id || parentCompany.upi_id || prev.upi_id,
      payment_qr_url: parentCompany.gst_payment_qr_url || parentCompany.payment_qr_url || prev.payment_qr_url,
      signatory_name: parentCompany.signatory_name || prev.signatory_name,
      signatory_designation: parentCompany.signatory_designation || prev.signatory_designation,
      signature_image_url: parentCompany.signature_image_url || prev.signature_image_url,
      stamp_image_url: parentCompany.stamp_image_url || prev.stamp_image_url,
      terms_conditions: parentCompany.terms_conditions || (parentCompany as any).terms || prev.terms_conditions,
      invoice_notes: parentCompany.invoice_notes || (parentCompany as any).notes || prev.invoice_notes,
    }))
    setSubBranchCopiedNotice(true)
    setTimeout(() => setSubBranchCopiedNotice(false), 2500)
  }

  const [subBranchPreviewSaveSuccess, setSubBranchPreviewSaveSuccess] = React.useState(false)

  const saveSubBranch = async (keepModalOpen = false) => {
    if (!subBranchForm.name.trim()) return
    setSaving(true)
    try {
      const curBranch = branches.find(b => String(b.id) === String(subBranchBranchId) || (b.code && b.code === subBranchBranchId))
      const resolvedBranchId = curBranch?.id || subBranchBranchId
      const curComp = companies.find(c => isMatchingCompany(c, subBranchCompanyId))
      const resolvedCompSlug = curComp?.slug || String(curComp?.id || subBranchCompanyId || "tech")
      // Use actual numeric ID from the company object (populated from MySQL API response)
      const resolvedCompNumeric = (curComp as any)?.numeric_id || (Number.isFinite(Number(curComp?.id)) ? Number(curComp?.id) : null) || (Number.isFinite(Number((curBranch as any)?.company_id)) ? Number((curBranch as any)?.company_id) : null) || 1

      const payload: any = {
        branch_id: resolvedBranchId,
        parentBranchId: resolvedBranchId,
        companyId: resolvedCompSlug,
        company_id: resolvedCompNumeric,
        ...subBranchForm,
        name: subBranchForm.name.trim(),
        code: subBranchForm.code.trim().toUpperCase(),
        revenue_share_pct: Number(subBranchForm.revenue_share_pct),
        revenueSharePct: Number(subBranchForm.revenue_share_pct),
        signature_position: subBranchSignaturePos,
        stamp_position: subBranchStampPos,
        logo_scale: subBranchLogoScale,
        stamp_scale: subBranchStampScale,
        signature_scale: subBranchSignatureScale,
        custom_stamps: subBranchCustomStamps,
        zoom: subBranchZoom,
        preview_invoice_type: previewInvoiceType,
        // Base fallback banking
        bank_name: (subBranchForm.gst_bank_name || subBranchForm.bank_name || subBranchForm.nongst_bank_name || "").trim(),
        account_holder: (subBranchForm.gst_account_holder || subBranchForm.account_holder || subBranchForm.nongst_account_holder || "").trim(),
        account_number: (subBranchForm.gst_account_number || subBranchForm.account_number || subBranchForm.nongst_account_number || "").trim(),
        ifsc_code: (subBranchForm.gst_ifsc_code || subBranchForm.ifsc_code || subBranchForm.nongst_ifsc_code || "").trim().toUpperCase(),
        bank_branch: (subBranchForm.gst_bank_branch || subBranchForm.bank_branch || subBranchForm.nongst_bank_branch || "").trim(),
        upi_id: (subBranchForm.gst_upi_id || subBranchForm.upi_id || subBranchForm.nongst_upi_id || "").trim(),
        payment_qr_url: subBranchForm.gst_payment_qr_url || subBranchForm.payment_qr_url || subBranchForm.nongst_payment_qr_url || "",
      }

      unmarkGlobalItemDeleted(payload.code, "subBranches")
      if (editingSubBranch?.id) unmarkGlobalItemDeleted(editingSubBranch.id, "subBranches")

      let savedSub: any = null
      if (editingSubBranch) {
        await SubBranchApiService.update(String(editingSubBranch.id), payload)
        savedSub = { ...editingSubBranch, ...payload }
        setEditingSubBranch(savedSub)
        setSubBranches(prev => prev.map(sb => String(sb.id) === String(editingSubBranch.id) ? savedSub : sb))
      } else {
        const apiRes = await SubBranchApiService.create(String(resolvedCompNumeric), payload)
        const realId = apiRes?.id || apiRes?.data?.id
        if (!realId) {
          throw new Error("Sub-branch creation did not return a valid ID from the server.")
        }
        savedSub = { ...payload, id: realId, branch_id: resolvedBranchId, company_id: resolvedCompNumeric, companyId: resolvedCompSlug }
        setSubBranches(prev => [...prev.filter(sb => String(sb.id) !== String(realId)), savedSub])
      }

      // Update auth store in memory for global components
      const curStoreSubs = useAuthStore.getState().subBranches || []
      const nextStoreSubs = editingSubBranch
        ? curStoreSubs.map(sb => String(sb.id) === String(editingSubBranch.id) ? savedSub : sb)
        : [...curStoreSubs.filter(sb => String(sb.id) !== String(savedSub.id)), savedSub]
      useAuthStore.setState({ subBranches: nextStoreSubs })

      // Always persist sub-branches to app_data so they survive page refresh for all users
      saveModuleDataToDB("sub_branches", nextStoreSubs, "all").catch(() => {})

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"))
        window.dispatchEvent(new CustomEvent("saampark_data_synced"))
      }

      if (keepModalOpen) {
        setSubBranchPreviewSaveSuccess(true)
        setTimeout(() => setSubBranchPreviewSaveSuccess(false), 3000)
      } else {
        setShowSubBranchModal(false)
        setEditingSubBranch(null)
      }
      setExpandedBranches(prev => new Set([...prev, subBranchBranchId]))
    } catch (err) {
      console.error("Error saving sub-branch:", err)
      alert("Failed to save sub-branch.")
    } finally {
      setSaving(false)
    }
  }

  // ── DELETE HANDLER ─────────────────────────────────────────────────────────
  const confirmDelete = (type: "company" | "branch" | "sub_branch", id: string) => {
    if (!isSuperAdmin) {
      alert("Permission denied: Only Super Admin can delete companies or branches.")
      return
    }
    setDeleteTarget({ type, id })
    setShowDeleteConfirm(true)
  }

  const executeDelete = async () => {
    if (!deleteTarget) return
    if (!isSuperAdmin) {
      alert("Permission denied: Only Super Admin can delete companies or branches.")
      return
    }
    setSaving(true)
    try {
      if (deleteTarget.type === "company") {
        const comp = companies.find(c => isMatchingCompany(c, deleteTarget.id))
        const targetId = comp?.id || deleteTarget.id
        const targetSlug = comp?.slug || deleteTarget.id
        const targetNumericId = (comp as any)?.numeric_id ? String((comp as any).numeric_id) : ""

        // Mark deleted in universal registry with module 'companies'
        await markGlobalItemDeleted(targetId, "companies")
        if (targetSlug && targetSlug !== targetId) {
          await markGlobalItemDeleted(targetSlug, "companies")
        }
        if (targetNumericId) {
          await markGlobalItemDeleted(targetNumericId, "companies")
        }

        // Call backend API
        await CompanyApiService.delete(targetId).catch(() => {})

        // Update auth store
        try {
          await useAuthStore.getState().deleteCompany(targetId)
        } catch (e) {
          console.warn("deleteCompany store warning:", e)
        }

        // Immediately update state - keep all other companies intact
        const remainingComps = companies.filter(c => 
          !isMatchingCompany(c, targetId) && 
          !isMatchingCompany(c, targetSlug)
        )
        setCompanies(remainingComps)
        await saveModuleDataToDB("companies", remainingComps, "all").catch(() => {})

        // ONLY filter out branches belonging to the deleted company!
        // Preserve all branches belonging to remaining active companies!
        const remainingBranches = branches.filter(b => {
          const bComp = b.company_id || (b as any).companyId
          return !isMatchingCompany({ id: targetId, slug: targetSlug, numeric_id: targetNumericId } as any, bComp)
        })
        setBranches(remainingBranches)
        await saveModuleDataToDB("branches", remainingBranches, "all").catch(() => {})
      } else if (deleteTarget.type === "branch") {
        const targetBranchId = String(deleteTarget.id).toLowerCase().trim()
        const targetBranch = branches.find(b => 
          String(b.id).toLowerCase().trim() === targetBranchId || 
          (b.code && String(b.code).toLowerCase().trim() === targetBranchId)
        )
        await markGlobalItemDeleted(deleteTarget.id, "branches")
        if (targetBranch?.id) await markGlobalItemDeleted(targetBranch.id, "branches")
        if (targetBranch?.code) await markGlobalItemDeleted(targetBranch.code, "branches")

        await BranchApiService.delete(deleteTarget.id).catch(() => {})
        if (targetBranch?.id && String(targetBranch.id) !== deleteTarget.id) {
          await BranchApiService.delete(String(targetBranch.id)).catch(() => {})
        }
        try {
          await useAuthStore.getState().deleteBranch(deleteTarget.id)
        } catch (e) {}

        const targetId = targetBranch ? String(targetBranch.id).toLowerCase().trim() : targetBranchId
        const targetCode = targetBranch?.code ? String(targetBranch.code).toLowerCase().trim() : ""

        const remainingBranches = branches.filter(b => {
          const bId = String(b.id).toLowerCase().trim()
          const bCode = String(b.code || "").toLowerCase().trim()
          if (bId === targetBranchId || bId === targetId) return false
          if (targetCode && (bId === targetCode || bCode === targetCode)) return false
          if (bCode && bCode === targetBranchId) return false
          return true
        })
        setBranches(remainingBranches)
        await saveModuleDataToDB("branches", remainingBranches, "all").catch(() => {})
      } else {
        const targetSubId = String(deleteTarget.id).toLowerCase().trim()
        const targetSub = subBranches.find(sb => 
          String(sb.id).toLowerCase().trim() === targetSubId || 
          (sb.code && String(sb.code).toLowerCase().trim() === targetSubId)
        )
        await markGlobalItemDeleted(deleteTarget.id, "sub_branches")
        if (targetSub?.id) await markGlobalItemDeleted(targetSub.id, "sub_branches")
        if (targetSub?.code) await markGlobalItemDeleted(targetSub.code, "sub_branches")

        await SubBranchApiService.delete(deleteTarget.id).catch(() => {})
        if (targetSub?.id && String(targetSub.id) !== deleteTarget.id) {
          await SubBranchApiService.delete(String(targetSub.id)).catch(() => {})
        }
        try {
          await useAuthStore.getState().deleteSubBranch(deleteTarget.id)
        } catch (e) {}

        const targetId = targetSub ? String(targetSub.id).toLowerCase().trim() : targetSubId
        const targetCode = targetSub?.code ? String(targetSub.code).toLowerCase().trim() : ""

        const remainingSub = subBranches.filter(sb => {
          const sId = String(sb.id).toLowerCase().trim()
          const sCode = String(sb.code || "").toLowerCase().trim()
          if (sId === targetSubId || sId === targetId) return false
          if (targetCode && (sId === targetCode || sCode === targetCode)) return false
          if (sCode && sCode === targetSubId) return false
          return true
        })
        setSubBranches(remainingSub)
        await saveModuleDataToDB("sub_branches", remainingSub, "all").catch(() => {})
      }
      setShowDeleteConfirm(false)
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      console.error("Error deleting:", err)
      alert("Failed to delete record.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-muted-foreground text-xs">Loading company hierarchy...</p></div>)
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Building2 size={18} />
            </div>
            <span>Companies & Branches Management</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Configure corporate entities, divisions, legal tax IDs, authorized stamps, and percentage-share franchise sub-branches</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openAddCompany} className="flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Add Company</span>
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search companies by name or slug..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 text-xs" />
        </div>
        <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="px-3 py-2 rounded-md border border-border bg-surface text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Industries</option>
          {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
        </select>
      </div>

      <div className="text-xs text-muted-foreground font-semibold">
        {filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"} active in workspace
      </div>

      {/* Company List Cards */}
      <div className="space-y-4">
        {filteredCompanies.map((company, index) => {
          const cBranches = getBranchesForCompany(company.id)
          const isExpanded = expandedCompanies.has(company.id)
          return (
            <motion.div key={company.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => toggleCompanyExpand(company.id)}>
                {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />}
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="h-11 w-11 rounded-xl object-contain border border-border p-1 bg-white" />
                ) : (
                  <div className="h-11 w-11 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground text-sm truncate">{company.name}</h3>
                    {company.brand_name && company.brand_name !== company.name && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">{company.brand_name}</span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{company.status || "active"}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                    {company.industry && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{company.industry}</span>}
                    <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" />{cBranches.length} {cBranches.length === 1 ? "branch" : "branches"}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{getUserCountForCompany(company.id)} members</span>
                    {company.gstin && <span className="font-mono text-[10px] text-zinc-400">GST: {company.gstin}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => { openEditCompany(company); setCompanyModalViewMode("preview") }} title="Live Preview Document & Stamps" className="h-8 gap-1 text-xs text-primary font-bold"><Eye className="h-4 w-4" />Preview</Button>
                  <Button variant="ghost" size="sm" onClick={() => openAddBranch(company.id)} title="Add Branch"><Plus className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditCompany(company)} title="Edit Full Company Details"><Edit2 className="h-4 w-4" /></Button>
                  {isSuperAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => confirmDelete("company", company.id)} title="Delete Company" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border/80">
                  {/* Company Quick Metadata Header */}
                  <div className="p-4 bg-muted/20 text-xs text-muted-foreground grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {company.address && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-blue-500" /><span>{company.address}</span></div>}
                    {company.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-blue-500" /><span>{company.email}</span></div>}
                    {company.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-blue-500" /><span>{company.phone}</span></div>}
                  </div>

                  {/* Branches Section */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5"><Building className="h-4 w-4 text-blue-600" />Branches ({cBranches.length})</h4>
                      <Button variant="outline" size="sm" onClick={() => openAddBranch(company.id)} className="flex items-center gap-1 text-xs"><Plus className="h-3.5 w-3.5" />Add Branch</Button>
                    </div>

                    {cBranches.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-xs border border-dashed rounded-xl"><p>No branches attached yet. Click "Add Branch" to set up operational branches.</p></div>
                    ) : (
                      <div className="space-y-2">
                        {cBranches.map(branch => {
                          const bSubBranches = getSubBranchesForBranch(branch.id)
                          const isBrExpanded = expandedBranches.has(branch.id)
                          return (
                            <div key={branch.id} className="rounded-xl border border-border bg-surface p-3 space-y-3">
                              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleBranchExpand(branch.id)}>
                                <div className="flex items-center gap-2.5">
                                  {isBrExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs text-foreground">{branch.name}</span>
                                      {branch.code && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono font-semibold">{branch.code}</span>}
                                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{branch.status || "active"}</span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground flex items-center gap-3 mt-0.5">
                                      {branch.city && <span>📍 {branch.city}{branch.state ? `, ${branch.state}` : ""}</span>}
                                      <span>🌿 {bSubBranches.length} Sub-Branches</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" onClick={() => { openEditBranch(branch); setBranchModalViewMode("preview") }} title="Live Preview Branch Invoice" className="text-xs h-7 gap-1 text-blue-600 font-semibold"><Eye className="h-3.5 w-3.5" />Preview</Button>
                                  <Button variant="ghost" size="sm" onClick={() => openAddSubBranch(branch.id, branch.company_id)} title="Add Sub-Branch" className="text-xs h-7 gap-1"><Plus className="h-3 w-3" />Sub-Branch</Button>
                                  <Button variant="ghost" size="sm" onClick={() => openEditBranch(branch)} title="Edit Branch" className="h-7 w-7 p-0"><Edit2 className="h-3 w-3" /></Button>
                                  {isSuperAdmin && (
                                    <Button variant="ghost" size="sm" onClick={() => confirmDelete("branch", branch.id)} title="Delete Branch" className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                  )}
                                </div>
                              </div>

                              {/* Sub-Branches Accordion */}
                              {isBrExpanded && (
                                <div className="pt-3 border-t border-border/60 pl-6 space-y-2">
                                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                    <span>Sub-Branches & Percentage Partners ({bSubBranches.length})</span>
                                    <Button variant="outline" size="sm" onClick={() => openAddSubBranch(branch.id, branch.company_id)} className="h-6 text-[10px] px-2 gap-1"><Plus className="h-3 w-3" />Add Sub-Branch</Button>
                                  </div>
                                  {bSubBranches.length === 0 ? (
                                    <p className="text-[11px] text-muted-foreground italic">No sub-branches registered under this branch.</p>
                                  ) : (
                                    bSubBranches.map(sb => (
                                      <div key={sb.id} className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between text-xs">
                                        <div>
                                          <div className="flex items-center gap-2 font-bold text-foreground">
                                            <span>{sb.name}</span>
                                            {sb.code && <span className="font-mono text-[10px] bg-muted px-1 rounded">{sb.code}</span>}
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                              {sb.revenue_share_pct || 0}% Partner Share
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3">
                                            {sb.partner_name && <span>👤 Partner: {sb.partner_name}</span>}
                                            {sb.partner_type && <span>🏷️ {sb.partner_type}</span>}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button variant="ghost" size="sm" onClick={() => { openEditSubBranch(sb); setSubBranchModalViewMode("preview") }} title="Live Preview Sub-Branch Invoice" className="text-xs h-7 gap-1 text-emerald-600 font-semibold"><Eye className="h-3.5 w-3.5" />Preview</Button>
                                          <Button variant="ghost" size="sm" onClick={() => openEditSubBranch(sb)} className="h-7 w-7 p-0"><Edit2 className="h-3 w-3" /></Button>
                                          {isSuperAdmin && (
                                            <Button variant="ghost" size="sm" onClick={() => confirmDelete("sub_branch", sb.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* ── UPGRADED COMPANY MODAL (SPLIT-SCREEN STUDIO) ────────────────── */}
      <AnimatePresence>
        {showCompanyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.96 }} 
              className={`bg-surface rounded-2xl border border-border shadow-2xl w-full h-[94vh] max-h-[94vh] flex flex-col overflow-hidden text-xs transition-all ${
                companyModalViewMode === "split" 
                  ? "max-w-[97vw] 2xl:max-w-[1600px]" 
                  : companyModalViewMode === "preview" 
                  ? "max-w-5xl" 
                  : "max-w-4xl"
              }`}
            >
              {/* Top Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-muted/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-foreground truncate">
                      {editingCompany ? `Edit Company: ${editingCompany.name}` : "Create New Company Entity"}
                    </h2>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Split-screen live studio for corporate settings, bank accounts &amp; live document calibration
                    </p>
                  </div>
                </div>

                {/* Header Controls: View Mode Switcher + Close */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => setCompanyModalViewMode("split")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        companyModalViewMode === "split" 
                          ? "bg-blue-600 text-white shadow-xs" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Split Screen: Side by Side Form & Live Preview"
                    >
                      <Split size={13} />
                      <span className="hidden sm:inline">Split Screen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompanyModalViewMode("form")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        companyModalViewMode === "form" 
                          ? "bg-blue-600 text-white shadow-xs" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Form Controls Only"
                    >
                      <LayoutTemplate size={13} />
                      <span className="hidden sm:inline">Form Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompanyModalViewMode("preview")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        companyModalViewMode === "preview" 
                          ? "bg-blue-600 text-white shadow-xs" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Live Document Preview Studio Only"
                    >
                      <Eye size={13} />
                      <span className="hidden sm:inline">Preview Only</span>
                    </button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowCompanyModal(false)}><X className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Modal Main Body (Split View or Single View) */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                {/* Left Form Pane */}
                {(companyModalViewMode === "split" || companyModalViewMode === "form") && (
                  <div className={`flex flex-col h-full overflow-hidden bg-surface ${
                    companyModalViewMode === "split" ? "w-full lg:w-[48%] xl:w-[45%] border-b lg:border-b-0 lg:border-r border-border shrink-0" : "w-full"
                  }`}>
                    {/* Form Tab Navigation */}
                    <div className="flex border-b border-border bg-muted/40 font-bold text-center shrink-0 overflow-x-auto">
                      <button type="button" onClick={() => setCompanyTab("identity")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "identity" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>1. Identity</button>
                      <button type="button" onClick={() => setCompanyTab("tax")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "tax" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>2. GST &amp; Legal</button>
                      <button type="button" onClick={() => setCompanyTab("contact")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "contact" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>3. Address</button>
                      <button type="button" onClick={() => setCompanyTab("branding")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "branding" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>4. Branding</button>
                      <button type="button" onClick={() => setCompanyTab("signatory")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "signatory" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>5. Stamp &amp; Sig</button>
                      <button type="button" onClick={() => setCompanyTab("bank")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "bank" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>6. Dual Bank &amp; QR</button>
                    </div>

                    {/* Active Tab Form Inputs */}
                    <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                      {companyTab === "identity" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div><label className="block font-semibold mb-1">Company Registered Name *</label><Input placeholder="Full registered company name" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} className="font-bold" /></div>
                            <div><label className="block font-semibold mb-1">Brand Name / Display Title</label><Input placeholder="e.g. SAAMPARK" value={companyForm.brand_name} onChange={e => setCompanyForm({ ...companyForm, brand_name: e.target.value })} className="font-bold" /></div>
                            <div><label className="block font-semibold mb-1">Company Slug (Identifier) *</label><Input placeholder="e.g. tech, printspace" value={companyForm.slug} onChange={e => setCompanyForm({ ...companyForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="font-mono font-bold" /></div>
                            <div><label className="block font-semibold mb-1">Industry</label><select value={companyForm.industry} onChange={e => setCompanyForm({ ...companyForm, industry: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-surface text-foreground text-xs">{INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}</select></div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div><label className="block font-semibold mb-1">Division / Group Tagline</label><Input placeholder="e.g. RESEARCH & INNOVATION" value={companyForm.division_name} onChange={e => setCompanyForm({ ...companyForm, division_name: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">Subtitle / Sub-Header</label><Input placeholder="e.g. Software, Cloud & Security" value={companyForm.subtitle} onChange={e => setCompanyForm({ ...companyForm, subtitle: e.target.value })} /></div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                            <div>
                              <label className="block font-semibold mb-1">Trademark / Registered Badge</label>
                              <select 
                                value={companyForm.trademark_symbol} 
                                onChange={e => setCompanyForm({ ...companyForm, trademark_symbol: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-foreground text-xs font-semibold"
                              >
                                <option value="">None (No badge)</option>
                                <option value="TM">TM (Trademark / Applied)</option>
                                <option value="R">R / ® (Registered Trademark)</option>
                              </select>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">When selected, appears as a stylish pill badge next to SAAMPARK brand on invoices.</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {companyTab === "tax" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div><label className="block font-semibold mb-1">GSTIN</label><Input placeholder="e.g. 19AAECS1234F1Z8" value={companyForm.gstin} onChange={e => setCompanyForm({ ...companyForm, gstin: e.target.value.toUpperCase() })} className="font-mono font-bold uppercase" /></div>
                            <div><label className="block font-semibold mb-1">PAN Number</label><Input placeholder="e.g. AAECS1234F" value={companyForm.pan} onChange={e => setCompanyForm({ ...companyForm, pan: e.target.value.toUpperCase() })} className="font-mono font-bold uppercase" /></div>
                            <div><label className="block font-semibold mb-1">CIN (Corporate ID)</label><Input placeholder="e.g. U72900WB2026PTC123456" value={companyForm.cin} onChange={e => setCompanyForm({ ...companyForm, cin: e.target.value.toUpperCase() })} className="font-mono uppercase" /></div>
                            <div><label className="block font-semibold mb-1">MSME Registration Number</label><Input placeholder="e.g. UDYAM-WB-00-1234567" value={companyForm.msme_reg} onChange={e => setCompanyForm({ ...companyForm, msme_reg: e.target.value })} className="font-mono" /></div>
                          </div>
                          <div><label className="block font-semibold mb-1">ISO / Quality Certification Badge</label><Input placeholder="e.g. An ISO 9001:2015 Certified Company" value={companyForm.iso_certification} onChange={e => setCompanyForm({ ...companyForm, iso_certification: e.target.value })} /></div>
                        </div>
                      )}

                      {companyTab === "contact" && (
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block font-semibold">Registered Address *</label>
                              <span className={`text-[10px] font-mono ${companyForm.address.length > 110 ? "text-amber-500 font-bold" : "text-muted-foreground"}`}>
                                {companyForm.address.length}/120 chars
                              </span>
                            </div>
                            <Input 
                              placeholder="Full registered street address" 
                              maxLength={120} 
                              value={companyForm.address} 
                              onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} 
                            />
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Character limit keeps invoice bottom footer on a single clean line without extra vertical spacing.</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div><label className="block font-semibold mb-1">City</label><Input value={companyForm.city} onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">State</label><Input value={companyForm.state} onChange={e => setCompanyForm({ ...companyForm, state: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">Country</label><Input value={companyForm.country} onChange={e => setCompanyForm({ ...companyForm, country: e.target.value })} /></div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div><label className="block font-semibold mb-1">Primary Phone</label><Input value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">Official Email</label><Input value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">Official Website</label><Input value={companyForm.website} onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })} /></div>
                          </div>
                        </div>
                      )}

                      {companyTab === "branding" && (
                        <div className="space-y-4">
                          <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                            <ImageUploadField
                              label="Primary Official Company Logo"
                              value={companyForm.logo_url}
                              onChange={url => setCompanyForm({ ...companyForm, logo_url: url })}
                              uploadNamePrefix="company_logo"
                              helperText="Shown on top of invoices, estimates, quotations, and official letters."
                            />
                          </div>
                        </div>
                      )}

                      {companyTab === "signatory" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div><label className="block font-semibold mb-1">Signatory Name</label><Input placeholder="e.g. Atanu De" value={companyForm.signatory_name} onChange={e => setCompanyForm({ ...companyForm, signatory_name: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">Signatory Designation</label><Input placeholder="e.g. Managing Director" value={companyForm.signatory_designation} onChange={e => setCompanyForm({ ...companyForm, signatory_designation: e.target.value })} /></div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="p-3.5 rounded-2xl border border-border bg-surface space-y-3">
                              <ImageUploadField
                                label="Digital Signature Image"
                                value={companyForm.signature_image_url}
                                onChange={url => setCompanyForm({ ...companyForm, signature_image_url: url })}
                                uploadNamePrefix="company_signature"
                                aspectRatio="signature"
                                helperText="Rendered on the Authorised Signatory line on Invoices and Quotations."
                              />
                            </div>
                            <div className="p-3.5 rounded-2xl border border-border bg-surface space-y-3">
                              <ImageUploadField
                                label="Corporate Seal / Stamp Image"
                                value={companyForm.stamp_image_url}
                                onChange={url => setCompanyForm({ ...companyForm, stamp_image_url: url })}
                                uploadNamePrefix="company_stamp"
                                helperText="Rendered as the round official seal beside the signature."
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border space-y-3">
                            <span className="font-bold text-xs text-foreground block">Default Terms &amp; Conditions and Notes (Auto-inherited on all Documents)</span>
                            <div>
                              <label className="block font-semibold mb-1 text-[11px]">Default Terms &amp; Conditions</label>
                              <textarea
                                rows={3}
                                value={companyForm.terms_conditions}
                                onChange={e => setCompanyForm({ ...companyForm, terms_conditions: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Standard terms and conditions..."
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-semibold mb-1 text-[11px]">Default Invoice Notes</label>
                                <textarea
                                  rows={2}
                                  value={companyForm.invoice_notes}
                                  onChange={e => setCompanyForm({ ...companyForm, invoice_notes: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                  placeholder="Default notes on invoices..."
                                />
                              </div>
                              <div>
                                <label className="block font-semibold mb-1 text-[11px]">Default Quotation Notes</label>
                                <textarea
                                  rows={2}
                                  value={companyForm.quotation_notes}
                                  onChange={e => setCompanyForm({ ...companyForm, quotation_notes: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                  placeholder="Default notes on quotations..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {companyTab === "bank" && (
                        <div className="space-y-4">
                          {/* Dual Profile Switcher */}
                          <div className="flex items-center gap-2 p-1.5 bg-muted/60 rounded-xl border border-border">
                            <button
                              type="button"
                              onClick={() => setCompanyBankProfileTab("gst")}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                companyBankProfileTab === "gst" ? "bg-teal-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              GST Tax Invoices Bank Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => setCompanyBankProfileTab("nongst")}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                companyBankProfileTab === "nongst" ? "bg-sky-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Non-GST Invoices Bank Profile
                            </button>
                          </div>

                          {companyBankProfileTab === "gst" ? (
                            <div className="p-4 rounded-2xl border border-teal-500/20 bg-teal-50/20 dark:bg-teal-950/10 space-y-3.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                                  GST Tax Invoices Bank &amp; UPI
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCompanyForm(prev => ({
                                      ...prev,
                                      gst_bank_name: "Union Bank of India",
                                      gst_account_holder: prev.name || "SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED",
                                      gst_account_number: "130321010000212",
                                      gst_ifsc_code: "UBIN0913031",
                                      gst_bank_branch: "DEBRA BRANCH",
                                      gst_upi_id: "80638401@ubin"
                                    }))
                                  }}
                                  className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline"
                                >
                                  Fill Default GST Bank
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div><label className="block font-semibold mb-1">GST Bank Name</label><Input placeholder="e.g. HDFC Bank Ltd" value={companyForm.gst_bank_name} onChange={e => setCompanyForm({ ...companyForm, gst_bank_name: e.target.value })} /></div>
                                <div><label className="block font-semibold mb-1">GST Account Holder</label><Input placeholder="e.g. Registered Company A/C" value={companyForm.gst_account_holder} onChange={e => setCompanyForm({ ...companyForm, gst_account_holder: e.target.value })} /></div>
                                <div><label className="block font-semibold mb-1">GST Account Number</label><Input placeholder="e.g. 50200084920194" value={companyForm.gst_account_number} onChange={e => setCompanyForm({ ...companyForm, gst_account_number: e.target.value })} className="font-mono font-bold" /></div>
                                <div><label className="block font-semibold mb-1">GST IFSC Code</label><Input placeholder="e.g. HDFC0001234" value={companyForm.gst_ifsc_code} onChange={e => setCompanyForm({ ...companyForm, gst_ifsc_code: e.target.value.toUpperCase() })} className="font-mono font-bold uppercase" /></div>
                                <div><label className="block font-semibold mb-1">GST Bank Branch</label><Input placeholder="e.g. Salt Lake Sector V" value={companyForm.gst_bank_branch} onChange={e => setCompanyForm({ ...companyForm, gst_bank_branch: e.target.value })} /></div>
                                <div><label className="block font-semibold mb-1">GST UPI ID / VPA</label><Input placeholder="e.g. saamparkgst@hdfcbank" value={companyForm.gst_upi_id} onChange={e => setCompanyForm({ ...companyForm, gst_upi_id: e.target.value })} className="font-mono" /></div>
                              </div>
                              <div className="pt-2">
                                <ImageUploadField
                                  label="Company GST Payment Scanner / QR Code"
                                  value={companyForm.gst_payment_qr_url}
                                  onChange={url => setCompanyForm({ ...companyForm, gst_payment_qr_url: url })}
                                  uploadNamePrefix="company_gst_qr"
                                  helperText="Rendered on GST Tax Invoices for instant scan-to-pay settlement."
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl border border-sky-500/20 bg-sky-50/20 dark:bg-sky-950/10 space-y-3.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                                  Non-GST Invoices Bank &amp; UPI
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCompanyForm(prev => ({
                                      ...prev,
                                      nongst_bank_name: "ICICI Bank Ltd",
                                      nongst_account_holder: prev.brand_name || "SAAMPARK GROUP",
                                      nongst_account_number: "000201012345",
                                      nongst_ifsc_code: "ICIC0000002",
                                      nongst_bank_branch: "Kolkata Main Branch",
                                      nongst_upi_id: "saamparkcommercial@icici"
                                    }))
                                  }}
                                  className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline"
                                >
                                  Fill Default Non-GST Bank
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div><label className="block font-semibold mb-1">Non-GST Bank Name</label><Input placeholder="e.g. ICICI Bank Ltd" value={companyForm.nongst_bank_name} onChange={e => setCompanyForm({ ...companyForm, nongst_bank_name: e.target.value })} /></div>
                                <div><label className="block font-semibold mb-1">Non-GST Account Holder</label><Input placeholder="e.g. Operating Commercial A/C" value={companyForm.nongst_account_holder} onChange={e => setCompanyForm({ ...companyForm, nongst_account_holder: e.target.value })} /></div>
                                <div><label className="block font-semibold mb-1">Non-GST Account Number</label><Input placeholder="e.g. 000201012345" value={companyForm.nongst_account_number} onChange={e => setCompanyForm({ ...companyForm, nongst_account_number: e.target.value })} className="font-mono font-bold" /></div>
                                <div><label className="block font-semibold mb-1">Non-GST IFSC Code</label><Input placeholder="e.g. ICIC0000002" value={companyForm.nongst_ifsc_code} onChange={e => setCompanyForm({ ...companyForm, nongst_ifsc_code: e.target.value.toUpperCase() })} className="font-mono font-bold uppercase" /></div>
                                <div><label className="block font-semibold mb-1">Non-GST Bank Branch</label><Input placeholder="e.g. Main Market Branch" value={companyForm.nongst_bank_branch} onChange={e => setCompanyForm({ ...companyForm, nongst_bank_branch: e.target.value })} /></div>
                                <div><label className="block font-semibold mb-1">Non-GST UPI ID / VPA</label><Input placeholder="e.g. saamparknongst@icici" value={companyForm.nongst_upi_id} onChange={e => setCompanyForm({ ...companyForm, nongst_upi_id: e.target.value })} className="font-mono" /></div>
                              </div>
                              <div className="pt-2">
                                <ImageUploadField
                                  label="Company Non-GST Payment Scanner / QR Code"
                                  value={companyForm.nongst_payment_qr_url}
                                  onChange={url => setCompanyForm({ ...companyForm, nongst_payment_qr_url: url })}
                                  uploadNamePrefix="company_nongst_qr"
                                  helperText="Used on commercial Non-GST Invoices."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Left Pane Footer Actions */}
                    <div className="flex items-center justify-between p-3.5 border-t border-border shrink-0 bg-muted/20">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Real-time live synced</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowCompanyModal(false)}>Cancel</Button>
                        <Button size="sm" onClick={() => saveCompany(false)} disabled={saving || !companyForm.name.trim()} className="font-bold bg-blue-600 hover:bg-blue-700 text-white">
                          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                          {editingCompany ? "Update Company" : "Create Company"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Right Live Document Preview Studio Pane */}
                {(companyModalViewMode === "split" || companyModalViewMode === "preview") && (
                  <div className={`flex flex-col h-full overflow-hidden bg-zinc-100 dark:bg-zinc-950/80 ${
                    companyModalViewMode === "split" ? "w-full lg:w-[52%] xl:w-[55%]" : "w-full"
                  }`}>
                    {/* Studio Header Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-surface border-b border-border shrink-0 text-xs">
                      {/* Scheme Switcher */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Scheme:</span>
                        <button
                          type="button"
                          onClick={() => setPreviewInvoiceType("gst")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            previewInvoiceType === "gst" ? "bg-teal-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          GST Tax (Teal)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewInvoiceType("nongst")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            previewInvoiceType === "nongst" ? "bg-sky-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Non-GST Direct (Sky)
                        </button>
                      </div>

                      {/* Zoom / Volume Controls */}
                      <div className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-lg border border-border">
                        <span className="text-[10px] font-bold text-muted-foreground mr-1">Zoom:</span>
                        <button
                          type="button"
                          onClick={() => setCompanyZoom(prev => Math.max(60, prev - 10))}
                          className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-surface border border-border rounded hover:bg-muted"
                          title="Zoom Out"
                        >
                          -
                        </button>
                        <span className="font-mono text-[10px] font-bold w-10 text-center">{companyZoom}%</span>
                        <button
                          type="button"
                          onClick={() => setCompanyZoom(prev => Math.min(150, prev + 10))}
                          className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-surface border border-border rounded hover:bg-muted"
                          title="Zoom In"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompanyZoom(100)}
                          className="text-[9px] px-1 text-muted-foreground hover:text-foreground ml-0.5"
                          title="Reset to 100%"
                        >
                          100%
                        </button>
                      </div>

                      {/* Stamp Adders & Reset */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => addCustomStampTo(setCompanyCustomStamps, "CUSTOM NOTE", "#2563eb", "badge")}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 hover:bg-blue-200 cursor-pointer"
                          title="Add draggable text sticker with zoom in/out & styling"
                        >
                          + Text Note
                        </button>
                        <button
                          type="button"
                          onClick={() => addCustomStampTo(setCompanyCustomStamps, "PAID IN FULL", "#059669", "stamp")}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-200 cursor-pointer"
                        >
                          + PAID Stamp
                        </button>
                        <button
                          type="button"
                          onClick={() => addCustomStampTo(setCompanyCustomStamps, "OFFICIAL SEAL", "#0d9488", "stamp")}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 hover:bg-teal-200 cursor-pointer"
                        >
                          + SEAL Stamp
                        </button>
                        <button
                          type="button"
                          onClick={() => addCustomStampTo(setCompanyCustomStamps, "CONFIDENTIAL", "#dc2626", "stamp")}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 hover:bg-rose-200 cursor-pointer"
                        >
                          + CONFIDENTIAL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCompanySignaturePos({ x: 0, y: 0 })
                            setCompanyStampPos({ x: 0, y: 0 })
                            setCompanyCustomStamps([])
                          }}
                          className="px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded"
                        >
                          Reset Drag
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveCompany(true)}
                          disabled={saving}
                          className={`font-bold h-7 px-3 text-xs gap-1 shadow-sm shrink-0 ml-auto transition-all ${
                            previewSaveSuccess 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                              : "bg-primary hover:bg-primary/90 text-primary-foreground"
                          }`}
                          title="Save preview layout, signature/stamp positions, and live canvas modifications"
                        >
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          {saving ? "Saving..." : previewSaveSuccess ? "Saved Successfully!" : "Save Preview"}
                        </Button>
                      </div>
                    </div>

                    {/* Interactive Placement & Live Edit Notice */}
                    <div className="px-3 py-1.5 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/50 text-[10px] text-amber-900 dark:text-amber-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
                      <span className="flex items-center gap-1 font-semibold">
                        <span>✍ <strong>Live Canvas:</strong> Touch/click any text to edit • ✥ Drag Logo, Seal, Signature &amp; Notes independently</span>
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[9px] font-bold">
                        <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200">
                          Sig: X:{companySignaturePos.x} Y:{companySignaturePos.y}
                        </span>
                        <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200">
                          Stamp: X:{companyStampPos.x} Y:{companyStampPos.y}
                        </span>
                      </div>
                    </div>

                    {/* Scrollable Live Canvas with Zoom */}
                    <div className="flex-1 overflow-y-auto overflow-x-auto p-4 flex justify-center items-start">
                      <div 
                        className="w-full max-w-[820px] shadow-xl rounded-2xl transition-transform duration-150 origin-top"
                        style={{ transform: `scale(${companyZoom / 100})`, transformOrigin: "top center" }}
                      >
                        <OfficialInvoiceDocument
                          invoice={{
                            id: "DEMO-INV-001",
                            invoiceNumber: previewInvoiceType === "gst" ? "INV-29102026001" : "NG-29102026001",
                            invoice_number: previewInvoiceType === "gst" ? "INV-29102026001" : "NG-29102026001",
                            date: "2026-09-18",
                            issueDate: "2026-09-18",
                            dueDate: "2026-10-03",
                            companyId: editingCompany?.id || companyForm.slug || "tech",
                            company_id: editingCompany?.id || companyForm.slug || "tech",
                            client: "Acme Corp",
                            clientName: "Acme Corp",
                            customer: "Acme Corp",
                            clientEmail: "billing@acmecorp.com",
                            clientPhone: "+91 90915 18567",
                            clientAddress: "Corporate Center, Paschim Medinipur, West Bengal",
                            clientGstin: "19ABASCS1649D1ZY",
                            projectTitle: "Custom Solution Project",
                            status: "Draft",
                            scheme: previewInvoiceType,
                            items: [
                              {
                                id: "item-1",
                                description: "Custom Enterprise Consulting & Development",
                                serviceName: "Custom Enterprise Consulting & Development",
                                sacCode: "998313",
                                sac: "998313",
                                qty: 1,
                                quantity: 1,
                                rate: 15000,
                                unitPrice: 15000,
                                unit: "Project",
                                gstRate: previewInvoiceType === "gst" ? 18 : 0,
                                totalAmount: previewInvoiceType === "gst" ? 17700 : 15000,
                                total: previewInvoiceType === "gst" ? 17700 : 15000,
                              }
                            ],
                            subtotal: 15000,
                            taxableBase: 15000,
                            tax: previewInvoiceType === "gst" ? 2700 : 0,
                            taxAmount: previewInvoiceType === "gst" ? 2700 : 0,
                            total: previewInvoiceType === "gst" ? 17700 : 15000,
                            totalAmount: previewInvoiceType === "gst" ? 17700 : 15000,
                            paidAmount: 0,
                            received: 0,
                            due: previewInvoiceType === "gst" ? 17700 : 15000,
                            dueAmount: previewInvoiceType === "gst" ? 17700 : 15000,
                            terms: companyForm.terms_conditions || "1. Payment is due within statutory terms.\n2. Goods & Services once delivered are subject to project sign-off.\n3. Disputed items must be notified within 7 days.",
                            notes: companyForm.invoice_notes || "Thank you for your business."
                          } as any}
                          companyDetails={companyForm as any}
                          interactive={true}
                          logoScale={companyLogoScale}
                          onLogoScaleChange={setCompanyLogoScale}
                          stampPosition={companyStampPos}
                          onStampPositionChange={setCompanyStampPos}
                          stampScale={companyStampScale}
                          onStampScaleChange={setCompanyStampScale}
                          signaturePosition={companySignaturePos}
                          onSignaturePositionChange={setCompanySignaturePos}
                          signatureScale={companySignatureScale}
                          onSignatureScaleChange={setCompanySignatureScale}
                          customStamps={companyCustomStamps}
                          onCustomStampMove={(id, pos) => setCompanyCustomStamps(prev => prev.map(s => s.id === id ? { ...s, ...pos } : s))}
                          onCustomStampUpdate={(id, updates) => setCompanyCustomStamps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))}
                          onRemoveCustomStamp={(id) => setCompanyCustomStamps(prev => prev.filter(s => s.id !== id))}
                          onAddCustomStamp={(s) => addCustomStampTo(setCompanyCustomStamps, s?.text || "NOTE", s?.color || "#0d9488", s?.bgStyle || "badge")}
                          onFieldChange={(field, val) => setCompanyForm(prev => ({ ...prev, [field]: val }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── UPGRADED BRANCH MODAL (SPLIT-SCREEN STUDIO) ────────────── */}
      <AnimatePresence>
        {showBranchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.96 }} 
              className={`bg-surface rounded-2xl border border-border shadow-2xl w-full h-[94vh] max-h-[94vh] flex flex-col overflow-hidden text-xs transition-all ${
                branchModalViewMode === "split" 
                  ? "max-w-[97vw] 2xl:max-w-[1600px]" 
                  : branchModalViewMode === "preview" 
                  ? "max-w-5xl" 
                  : "max-w-4xl"
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-muted/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <Building size={16} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-foreground truncate">
                      {editingBranch ? `Edit Branch: ${editingBranch.name}` : "Add Operational Branch"}
                    </h2>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Configure branch manager, stamp/signature overrides &amp; live document calibration
                    </p>
                  </div>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => setBranchModalViewMode("split")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        branchModalViewMode === "split" 
                          ? "bg-blue-600 text-white shadow-xs" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Split Screen: Side by Side Form & Live Preview"
                    >
                      <Split size={13} />
                      <span className="hidden sm:inline">Split Screen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBranchModalViewMode("form")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        branchModalViewMode === "form" 
                          ? "bg-blue-600 text-white shadow-xs" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Form Controls Only"
                    >
                      <LayoutTemplate size={13} />
                      <span className="hidden sm:inline">Form Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBranchModalViewMode("preview")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        branchModalViewMode === "preview" 
                          ? "bg-blue-600 text-white shadow-xs" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Live Document Preview Studio Only"
                    >
                      <Eye size={13} />
                      <span className="hidden sm:inline">Preview Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCompanyDetailsToBranch}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-muted hover:bg-muted/80 text-foreground border border-border"
                      title="Copy Bank, QR, Stamp, Signature, and Terms from Parent Company"
                    >
                      {branchCopiedNotice ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} className="text-primary" />
                          <span className="hidden sm:inline">Copy Company Details</span>
                        </>
                      )}
                    </button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowBranchModal(false)}><X className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Main Body */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                {/* Left Form Pane */}
                {(branchModalViewMode === "split" || branchModalViewMode === "form") && (
                  <div className={`flex flex-col h-full overflow-hidden bg-surface ${
                    branchModalViewMode === "split" ? "w-full lg:w-[48%] xl:w-[45%] border-b lg:border-b-0 lg:border-r border-border shrink-0" : "w-full"
                  }`}>
                    {/* Tab Navigation */}
                    <div className="grid grid-cols-5 border-b border-border bg-muted/40 font-bold text-center shrink-0">
                      <button type="button" onClick={() => setBranchTab("basic")} className={`py-2.5 border-b-2 text-[10px] sm:text-[11px] font-bold ${branchTab === "basic" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>1. Info</button>
                      <button type="button" onClick={() => setBranchTab("tax")} className={`py-2.5 border-b-2 text-[10px] sm:text-[11px] font-bold ${branchTab === "tax" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>2. Address</button>
                      <button type="button" onClick={() => setBranchTab("stamp")} className={`py-2.5 border-b-2 text-[10px] sm:text-[11px] font-bold ${branchTab === "stamp" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>3. Stamp &amp; Sig</button>
                      <button type="button" onClick={() => setBranchTab("bank")} className={`py-2.5 border-b-2 text-[10px] sm:text-[11px] font-bold ${branchTab === "bank" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>4. Bank &amp; QR</button>
                      <button type="button" onClick={() => setBranchTab("terms")} className={`py-2.5 border-b-2 text-[10px] sm:text-[11px] font-bold ${branchTab === "terms" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>5. Terms &amp; Notes</button>
                    </div>

                    {/* Form Fields */}
                    <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                      {/* Inheritance Notice */}
                      <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                        <Landmark size={14} className="shrink-0 text-blue-600" />
                        <span>Any field left empty below will automatically inherit its stamp, signature, bank account, and payment QR from the parent Company.</span>
                      </div>

                      {branchTab === "basic" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div><label className="block font-semibold mb-1">Branch Name *</label><Input placeholder="e.g. Kolkata Salt Lake Branch" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} className="font-bold" /></div>
                            <div><label className="block font-semibold mb-1">Branch Code *</label><Input placeholder="e.g. BR-KOL-01" value={branchForm.code} onChange={e => setBranchForm({ ...branchForm, code: e.target.value })} className="font-mono font-bold" /></div>
                            <div><label className="block font-semibold mb-1">Branch Manager Name</label><Input placeholder="e.g. Amit Sen" value={branchForm.managerName} onChange={e => setBranchForm({ ...branchForm, managerName: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">Manager Phone</label><Input placeholder="+91 98765 43210" value={branchForm.managerPhone} onChange={e => setBranchForm({ ...branchForm, managerPhone: e.target.value })} /></div>
                          </div>
                          <div className="p-3.5 rounded-xl border border-border bg-muted/20 mt-3">
                            <ImageUploadField
                              label="Branch Logo (Overrides Company Logo on Branch Invoices)"
                              value={branchForm.logo_url}
                              onChange={url => setBranchForm({ ...branchForm, logo_url: url })}
                              uploadNamePrefix="branch_logo"
                              helperText="Leave empty to use the parent Company logo."
                            />
                          </div>
                        </div>
                      )}

                      {branchTab === "tax" && (
                        <div className="space-y-4">
                          <div><label className="block font-semibold mb-1">Branch Street Address</label><Input placeholder="Street address..." value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} /></div>
                          <div className="grid grid-cols-3 gap-3">
                            <div><label className="block font-semibold mb-1">City</label><Input value={branchForm.city} onChange={e => setBranchForm({ ...branchForm, city: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">State</label><Input value={branchForm.state} onChange={e => setBranchForm({ ...branchForm, state: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">Country</label><Input value={branchForm.country} onChange={e => setBranchForm({ ...branchForm, country: e.target.value })} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block font-semibold mb-1">Branch Phone</label><Input value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">Branch Email</label><Input value={branchForm.email} onChange={e => setBranchForm({ ...branchForm, email: e.target.value })} /></div>
                          </div>
                        </div>
                      )}

                      {branchTab === "stamp" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block font-semibold mb-1">Branch Signatory Name</label>
                              <Input placeholder="e.g. Supriya Kumar (Leave blank for Company default)" value={branchForm.signatory_name} onChange={e => setBranchForm({ ...branchForm, signatory_name: e.target.value })} />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1">Signatory Designation</label>
                              <Input placeholder="e.g. Branch Head / Operations Manager" value={branchForm.signatory_designation} onChange={e => setBranchForm({ ...branchForm, signatory_designation: e.target.value })} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                              <ImageUploadField
                                label="Branch Signature (Optional Override)"
                                value={branchForm.signature_image_url}
                                onChange={url => setBranchForm({ ...branchForm, signature_image_url: url })}
                                uploadNamePrefix="branch_sig"
                                helperText="If not uploaded, the parent Company's signature image is automatically used."
                              />
                            </div>
                            <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                              <ImageUploadField
                                label="Branch Official Stamp / Seal (Optional Override)"
                                value={branchForm.stamp_image_url}
                                onChange={url => setBranchForm({ ...branchForm, stamp_image_url: url })}
                                uploadNamePrefix="branch_stamp"
                                helperText="If not uploaded, the parent Company's corporate seal stamp is automatically used."
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {branchTab === "bank" && (
                        <div className="space-y-4">
                          {/* Dual Profile Switcher Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-2xl bg-surface border border-border">
                            <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-muted/40 border border-border/80">
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
                                <span>GST Bank Profile</span>
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
                                <span>Non-GST Bank Profile</span>
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

                          {/* GST BANK PROFILE */}
                          {branchBankProfileTab === "gst" && (
                            <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10 space-y-3.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                                  GST Invoicing Bank &amp; Settlement Account
                                </span>
                                <span className="text-[10px] text-muted-foreground">Used for Official GST Tax Invoices</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                  <label className="block font-semibold mb-1">GST Bank Name</label>
                                  <Input 
                                    placeholder="e.g. ICICI Bank Ltd" 
                                    value={branchForm.gst_bank_name} 
                                    onChange={e => setBranchForm({ ...branchForm, gst_bank_name: e.target.value, bank_name: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Account Holder Name</label>
                                  <Input 
                                    placeholder="e.g. Saampark Technology Pvt Ltd" 
                                    value={branchForm.gst_account_holder} 
                                    onChange={e => setBranchForm({ ...branchForm, gst_account_holder: e.target.value, account_holder: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">GST Account Number</label>
                                  <Input 
                                    placeholder="Branch GST A/C number..." 
                                    value={branchForm.gst_account_number} 
                                    onChange={e => setBranchForm({ ...branchForm, gst_account_number: e.target.value, account_number: e.target.value })} 
                                    className="font-mono font-bold" 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">IFSC Code</label>
                                  <Input 
                                    placeholder="e.g. ICIC0001234" 
                                    value={branchForm.gst_ifsc_code} 
                                    onChange={e => setBranchForm({ ...branchForm, gst_ifsc_code: e.target.value.toUpperCase(), ifsc_code: e.target.value.toUpperCase() })} 
                                    className="font-mono font-bold uppercase" 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Bank Branch Name</label>
                                  <Input 
                                    placeholder="e.g. Sector V Branch" 
                                    value={branchForm.gst_bank_branch} 
                                    onChange={e => setBranchForm({ ...branchForm, gst_bank_branch: e.target.value, bank_branch: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">GST UPI ID / VPA</label>
                                  <Input 
                                    placeholder="e.g. saampark.gst@icici" 
                                    value={branchForm.gst_upi_id} 
                                    onChange={e => setBranchForm({ ...branchForm, gst_upi_id: e.target.value, upi_id: e.target.value })} 
                                    className="font-mono" 
                                  />
                                </div>
                              </div>
                              <div className="pt-2">
                                <ImageUploadField
                                  label="GST Payment QR Code / Scanner"
                                  value={branchForm.gst_payment_qr_url}
                                  onChange={url => setBranchForm({ ...branchForm, gst_payment_qr_url: url, payment_qr_url: url })}
                                  uploadNamePrefix="branch_gst_qr"
                                  helperText="Official QR scanner image printed on Branch GST Tax Invoices."
                                />
                              </div>
                            </div>
                          )}

                          {/* NON-GST BANK PROFILE */}
                          {branchBankProfileTab === "nongst" && (
                            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10 space-y-3.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                                  Non-GST Invoicing Bank &amp; Settlement Account
                                </span>
                                <span className="text-[10px] text-muted-foreground">Used for Non-GST / Direct Estimates &amp; Bills</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                  <label className="block font-semibold mb-1">Non-GST Bank Name</label>
                                  <Input 
                                    placeholder="e.g. HDFC Bank Ltd" 
                                    value={branchForm.nongst_bank_name} 
                                    onChange={e => setBranchForm({ ...branchForm, nongst_bank_name: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Account Holder Name</label>
                                  <Input 
                                    placeholder="Branch Non-GST Account Holder" 
                                    value={branchForm.nongst_account_holder} 
                                    onChange={e => setBranchForm({ ...branchForm, nongst_account_holder: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Non-GST Account Number</label>
                                  <Input 
                                    placeholder="Branch Non-GST A/C number..." 
                                    value={branchForm.nongst_account_number} 
                                    onChange={e => setBranchForm({ ...branchForm, nongst_account_number: e.target.value })} 
                                    className="font-mono font-bold" 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">IFSC Code</label>
                                  <Input 
                                    placeholder="e.g. HDFC0000123" 
                                    value={branchForm.nongst_ifsc_code} 
                                    onChange={e => setBranchForm({ ...branchForm, nongst_ifsc_code: e.target.value.toUpperCase() })} 
                                    className="font-mono font-bold uppercase" 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Bank Branch Name</label>
                                  <Input 
                                    placeholder="e.g. City Main Branch" 
                                    value={branchForm.nongst_bank_branch} 
                                    onChange={e => setBranchForm({ ...branchForm, nongst_bank_branch: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Non-GST UPI ID / VPA</label>
                                  <Input 
                                    placeholder="e.g. branch.nongst@hdfcbank" 
                                    value={branchForm.nongst_upi_id} 
                                    onChange={e => setBranchForm({ ...branchForm, nongst_upi_id: e.target.value })} 
                                    className="font-mono" 
                                  />
                                </div>
                              </div>
                              <div className="pt-2">
                                <ImageUploadField
                                  label="Non-GST Payment QR Code / Scanner"
                                  value={branchForm.nongst_payment_qr_url}
                                  onChange={url => setBranchForm({ ...branchForm, nongst_payment_qr_url: url })}
                                  uploadNamePrefix="branch_nongst_qr"
                                  helperText="Official QR scanner image printed on Branch Non-GST Direct Bills."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {branchTab === "terms" && (
                        <div className="space-y-4">
                          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                            <Landmark size={14} className="shrink-0 text-blue-600" />
                            <span>Leave blank to automatically inherit parent Company's Terms &amp; Conditions and Invoice Notes.</span>
                          </div>
                          <div>
                            <label className="block font-semibold mb-1 text-[11px]">Branch Terms &amp; Conditions (Override)</label>
                            <textarea
                              rows={4}
                              value={branchForm.terms_conditions}
                              onChange={e => setBranchForm({ ...branchForm, terms_conditions: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Enter branch-specific terms or leave empty to inherit from parent Company..."
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1 text-[11px]">Branch Invoice Notes (Override)</label>
                            <textarea
                              rows={3}
                              value={branchForm.invoice_notes}
                              onChange={e => setBranchForm({ ...branchForm, invoice_notes: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Enter branch-specific invoice notes or leave empty to inherit from parent Company..."
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Left Pane Footer Actions */}
                    <div className="flex items-center justify-between p-3.5 border-t border-border shrink-0 bg-muted/20">
                      <span className="text-blue-700 dark:text-blue-400 font-semibold text-[10px] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span>Live synced with preview</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowBranchModal(false)}>Cancel</Button>
                        <Button size="sm" onClick={() => saveBranch(false)} disabled={saving || !branchForm.name.trim()} className="font-bold bg-blue-600 hover:bg-blue-700 text-white">
                          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                          {editingBranch ? "Update Branch" : "Create Branch"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Right Live Document Preview Studio Pane */}
                {(branchModalViewMode === "split" || branchModalViewMode === "preview") && (
                  <div className={`flex flex-col h-full overflow-hidden bg-zinc-100 dark:bg-zinc-950/80 ${
                    branchModalViewMode === "split" ? "w-full lg:w-[52%] xl:w-[55%]" : "w-full"
                  }`}>
                    {/* Studio Header Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-surface border-b border-border shrink-0 text-xs">
                      {/* Scheme Switcher */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Scheme:</span>
                        <button
                          type="button"
                          onClick={() => setPreviewInvoiceType("gst")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            previewInvoiceType === "gst" ? "bg-teal-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          GST Tax (Teal)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewInvoiceType("nongst")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            previewInvoiceType === "nongst" ? "bg-sky-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Non-GST Direct (Sky)
                        </button>
                      </div>

                      {/* Zoom / Volume Controls */}
                      <div className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-lg border border-border">
                        <span className="text-[10px] font-bold text-muted-foreground mr-1">Zoom:</span>
                        <button
                          type="button"
                          onClick={() => setBranchZoom(prev => Math.max(60, prev - 10))}
                          className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-surface border border-border rounded hover:bg-muted"
                          title="Zoom Out"
                        >
                          -
                        </button>
                        <span className="font-mono text-[10px] font-bold w-10 text-center">{branchZoom}%</span>
                        <button
                          type="button"
                          onClick={() => setBranchZoom(prev => Math.min(150, prev + 10))}
                          className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-surface border border-border rounded hover:bg-muted"
                          title="Zoom In"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => setBranchZoom(100)}
                          className="text-[9px] px-1 text-muted-foreground hover:text-foreground ml-0.5"
                          title="Reset to 100%"
                        >
                          100%
                        </button>
                      </div>

                      {/* Stamp Adders & Reset */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => addCustomStampTo(setBranchCustomStamps, "BRANCH NOTE", "#2563eb", "badge")}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 hover:bg-blue-200 cursor-pointer"
                          title="Add draggable text sticker with zoom in/out & styling"
                        >
                          + Text Note
                        </button>
                        <button
                          type="button"
                          onClick={() => addCustomStampTo(setBranchCustomStamps, "PAID IN FULL", "#059669", "stamp")}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-200 cursor-pointer"
                        >
                          + PAID Stamp
                        </button>
                        <button
                          type="button"
                          onClick={() => addCustomStampTo(setBranchCustomStamps, "BRANCH SEAL", "#0d9488", "stamp")}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 hover:bg-teal-200 cursor-pointer"
                        >
                          + SEAL Stamp
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBranchSignaturePos({ x: 0, y: 0 })
                            setBranchStampPos({ x: 0, y: 0 })
                            setBranchCustomStamps([])
                          }}
                          className="px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded"
                        >
                          Reset Drag
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveBranch(true)}
                          disabled={saving}
                          className={`font-bold h-7 px-3 text-xs gap-1 shadow-sm shrink-0 ml-auto transition-all ${
                            branchPreviewSaveSuccess 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                              : "bg-primary hover:bg-primary/90 text-primary-foreground"
                          }`}
                          title="Save preview layout, signature/stamp positions, and live canvas modifications for this branch"
                        >
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          {saving ? "Saving..." : branchPreviewSaveSuccess ? "Saved Successfully!" : "Save Preview"}
                        </Button>
                      </div>
                    </div>

                    {/* Interactive Placement Coordinates */}
                    <div className="px-3 py-1.5 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/50 text-[10px] text-amber-900 dark:text-amber-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
                      <span className="flex items-center gap-1 font-semibold">
                        <span>✍ <strong>Live Canvas:</strong> Touch/click any text to edit • ✥ Drag Logo, Seal, Signature &amp; Notes independently</span>
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[9px] font-bold">
                        <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200">
                          Sig: X:{branchSignaturePos.x} Y:{branchSignaturePos.y}
                        </span>
                        <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200">
                          Stamp: X:{branchStampPos.x} Y:{branchStampPos.y}
                        </span>
                      </div>
                    </div>

                    {/* Scrollable Live Canvas with Zoom */}
                    <div className="flex-1 overflow-y-auto overflow-x-auto p-4 flex justify-center items-start">
                      <div 
                        className="w-full max-w-[820px] shadow-xl rounded-2xl transition-transform duration-150 origin-top"
                        style={{ transform: `scale(${branchZoom / 100})`, transformOrigin: "top center" }}
                      >
                        {(() => {
                          const pComp = companies.find(c => c.id === branchCompanyId) || companies[0]
                          return (
                            <OfficialInvoiceDocument
                              invoice={{
                                id: "DEMO-BR-INV-001",
                                invoiceNumber: previewInvoiceType === "gst" ? "INV-29102026001" : "NG-29102026001",
                                invoice_number: previewInvoiceType === "gst" ? "INV-29102026001" : "NG-29102026001",
                                date: "2026-09-18",
                                issueDate: "2026-09-18",
                                dueDate: "2026-10-03",
                                companyId: branchCompanyId || "tech",
                                company_id: branchCompanyId || "tech",
                                branchId: editingBranch?.id || "branch-preview",
                                branch_id: editingBranch?.id || "branch-preview",
                                client: "Acme Corp",
                                clientName: "Acme Corp",
                                customer: "Acme Corp",
                                clientEmail: "billing@acmecorp.com",
                                clientPhone: "+91 90915 18567",
                                clientAddress: "Corporate Center, Paschim Medinipur, West Bengal",
                                clientGstin: "19ABASCS1649D1ZY",
                                projectTitle: "Custom Solution Project",
                                status: "Draft",
                                scheme: previewInvoiceType,
                                items: [
                                  {
                                    id: "item-1",
                                    description: "Custom Enterprise Consulting & Development",
                                    serviceName: "Custom Enterprise Consulting & Development",
                                    sacCode: "998313",
                                    sac: "998313",
                                    qty: 1,
                                    quantity: 1,
                                    rate: 15000,
                                    unitPrice: 15000,
                                    unit: "Project",
                                    gstRate: previewInvoiceType === "gst" ? 18 : 0,
                                    totalAmount: previewInvoiceType === "gst" ? 17700 : 15000,
                                    total: previewInvoiceType === "gst" ? 17700 : 15000,
                                  }
                                ],
                                subtotal: 15000,
                                taxableBase: 15000,
                                tax: previewInvoiceType === "gst" ? 2700 : 0,
                                taxAmount: previewInvoiceType === "gst" ? 2700 : 0,
                                total: previewInvoiceType === "gst" ? 17700 : 15000,
                                totalAmount: previewInvoiceType === "gst" ? 17700 : 15000,
                                paidAmount: 0,
                                received: 0,
                                due: previewInvoiceType === "gst" ? 17700 : 15000,
                                dueAmount: previewInvoiceType === "gst" ? 17700 : 15000,
                                terms: branchForm.terms_conditions || pComp?.terms_conditions || "1. Payment is due within statutory terms.\n2. Goods & Services once delivered are subject to project sign-off.\n3. Disputed items must be notified within 7 days.",
                                notes: branchForm.invoice_notes || pComp?.invoice_notes || "Thank you for your business."
                              } as any}
                              companyDetails={pComp}
                              activeBranch={{
                                ...branchForm,
                                id: editingBranch?.id || "branch-preview",
                                company_id: branchCompanyId
                              } as any}
                              interactive={true}
                              logoScale={branchLogoScale}
                              onLogoScaleChange={setBranchLogoScale}
                              stampPosition={branchStampPos}
                              onStampPositionChange={setBranchStampPos}
                              stampScale={branchStampScale}
                              onStampScaleChange={setBranchStampScale}
                              signaturePosition={branchSignaturePos}
                              onSignaturePositionChange={setBranchSignaturePos}
                              signatureScale={branchSignatureScale}
                              onSignatureScaleChange={setBranchSignatureScale}
                              customStamps={branchCustomStamps}
                              onCustomStampMove={(id, pos) => setBranchCustomStamps(prev => prev.map(s => s.id === id ? { ...s, ...pos } : s))}
                              onCustomStampUpdate={(id, updates) => setBranchCustomStamps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))}
                              onRemoveCustomStamp={(id) => setBranchCustomStamps(prev => prev.filter(s => s.id !== id))}
                              onAddCustomStamp={(s) => addCustomStampTo(setBranchCustomStamps, s?.text || "NOTE", s?.color || "#0d9488", s?.bgStyle || "badge")}
                              onFieldChange={(field, val) => setBranchForm(prev => ({ ...prev, [field]: val }))}
                            />
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── UPGRADED SUB-BRANCH (% SHARE) MODAL (SPLIT-SCREEN STUDIO) ─── */}
      <AnimatePresence>
        {showSubBranchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.96 }} 
              className={`bg-surface rounded-2xl border border-border shadow-2xl w-full h-[94vh] max-h-[94vh] flex flex-col overflow-hidden text-xs transition-all ${
                subBranchModalViewMode === "split" 
                  ? "max-w-[97vw] 2xl:max-w-[1600px]" 
                  : subBranchModalViewMode === "preview" 
                  ? "max-w-5xl" 
                  : "max-w-4xl"
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-muted/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-foreground truncate">
                      {editingSubBranch ? `Edit Sub-Branch: ${editingSubBranch.name}` : "Add Sub-Branch (Partner & Revenue Share Hub)"}
                    </h2>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Partner percentage revenue share, custom seal/stamp &amp; live document calibration
                    </p>
                  </div>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => setSubBranchModalViewMode("split")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        subBranchModalViewMode === "split" 
                          ? "bg-emerald-600 text-white shadow-xs" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Split Screen: Side by Side Form & Live Preview"
                    >
                      <Split size={13} />
                      <span className="hidden sm:inline">Split Screen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubBranchModalViewMode("form")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        subBranchModalViewMode === "form" 
                          ? "bg-emerald-600 text-white shadow-xs" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Form Controls Only"
                    >
                      <LayoutTemplate size={13} />
                      <span className="hidden sm:inline">Form Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubBranchModalViewMode("preview")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        subBranchModalViewMode === "preview" 
                          ? "bg-emerald-600 text-white shadow-xs" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Live Document Preview Studio Only"
                    >
                      <Eye size={13} />
                      <span className="hidden sm:inline">Preview Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCompanyDetailsToSubBranch}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-muted hover:bg-muted/80 text-foreground border border-border"
                      title="Copy Bank, QR, Stamp, Signature, and Terms from Parent Company"
                    >
                      {subBranchCopiedNotice ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} className="text-emerald-600" />
                          <span className="hidden sm:inline">Copy Company Details</span>
                        </>
                      )}
                    </button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowSubBranchModal(false)}><X className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Main Body */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                {/* Left Form Pane */}
                {(subBranchModalViewMode === "split" || subBranchModalViewMode === "form") && (
                  <div className={`flex flex-col h-full overflow-hidden bg-surface ${
                    subBranchModalViewMode === "split" ? "w-full lg:w-[48%] xl:w-[45%] border-b lg:border-b-0 lg:border-r border-border shrink-0" : "w-full"
                  }`}>
                    {/* Tab Navigation */}
                    <div className="grid grid-cols-5 border-b border-border bg-muted/40 font-bold text-center shrink-0">
                      <button type="button" onClick={() => setSubBranchTab("partner")} className={`py-2.5 border-b-2 text-[10px] sm:text-[11px] font-bold ${subBranchTab === "partner" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>1. Partner</button>
                      <button type="button" onClick={() => setSubBranchTab("location")} className={`py-2.5 border-b-2 text-[10px] sm:text-[11px] font-bold ${subBranchTab === "location" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>2. Address</button>
                      <button type="button" onClick={() => setSubBranchTab("stamp")} className={`py-2.5 border-b-2 text-[10px] sm:text-[11px] font-bold ${subBranchTab === "stamp" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>3. Stamp &amp; Sig</button>
                      <button type="button" onClick={() => setSubBranchTab("bank")} className={`py-2.5 border-b-2 text-[10px] sm:text-[11px] font-bold ${subBranchTab === "bank" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>4. Bank &amp; QR</button>
                      <button type="button" onClick={() => setSubBranchTab("terms")} className={`py-2.5 border-b-2 text-[10px] sm:text-[11px] font-bold ${subBranchTab === "terms" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>5. Terms &amp; Notes</button>
                    </div>

                    {/* Form Fields */}
                    <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                      {/* Inheritance Notice */}
                      <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                        <Landmark size={14} className="shrink-0 text-emerald-600" />
                        <span>Any field left empty below will automatically inherit its stamp, signature, bank account, and payment QR from the parent Company.</span>
                      </div>

                      {subBranchTab === "partner" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div><label className="block font-semibold mb-1">Sub-Branch Name *</label><Input placeholder="e.g. Regional Sub-Branch" value={subBranchForm.name} onChange={e => setSubBranchForm({ ...subBranchForm, name: e.target.value })} className="font-bold" /></div>
                            <div><label className="block font-semibold mb-1">Sub-Branch Code *</label><Input placeholder="e.g. SB-01" value={subBranchForm.code} onChange={e => setSubBranchForm({ ...subBranchForm, code: e.target.value })} className="font-mono font-bold" /></div>
                            <div><label className="block font-semibold mb-1">Partner / Associate Full Name *</label><Input placeholder="Partner person/entity name" value={subBranchForm.partner_name} onChange={e => setSubBranchForm({ ...subBranchForm, partner_name: e.target.value })} /></div>
                            <div>
                              <label className="block font-semibold mb-1">Partner Network Type</label>
                              <select value={subBranchForm.partner_type} onChange={e => setSubBranchForm({ ...subBranchForm, partner_type: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-surface text-foreground text-xs">
                                {PARTNER_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Revenue Share Percentage Slider / Input */}
                          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="font-bold text-indigo-900 dark:text-indigo-200">Partner Revenue Share Percentage (%)</label>
                              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{subBranchForm.revenue_share_pct}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={subBranchForm.revenue_share_pct}
                              onChange={e => setSubBranchForm({ ...subBranchForm, revenue_share_pct: Number(e.target.value) })}
                              className="w-full cursor-pointer accent-indigo-600"
                            />
                            <p className="text-[10px] text-muted-foreground">Earnings will automatically calculate: {subBranchForm.revenue_share_pct}% to Sub-Branch Partner, {100 - subBranchForm.revenue_share_pct}% to Headquarters.</p>
                          </div>
                        </div>
                      )}

                      {subBranchTab === "location" && (
                        <div className="space-y-4">
                          <div><label className="block font-semibold mb-1">Sub-Branch Address</label><Input value={subBranchForm.address} onChange={e => setSubBranchForm({ ...subBranchForm, address: e.target.value })} /></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><label className="block font-semibold mb-1">City</label><Input value={subBranchForm.city} onChange={e => setSubBranchForm({ ...subBranchForm, city: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">State</label><Input value={subBranchForm.state} onChange={e => setSubBranchForm({ ...subBranchForm, state: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">Partner Phone</label><Input value={subBranchForm.phone} onChange={e => setSubBranchForm({ ...subBranchForm, phone: e.target.value })} /></div>
                            <div><label className="block font-semibold mb-1">Partner Email</label><Input value={subBranchForm.email} onChange={e => setSubBranchForm({ ...subBranchForm, email: e.target.value })} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                            <div><label className="block font-semibold mb-1">Sub-Branch GSTIN (Optional)</label><Input placeholder="19BBCCS5678G1Z2" value={subBranchForm.gstin} onChange={e => setSubBranchForm({ ...subBranchForm, gstin: e.target.value.toUpperCase() })} className="font-mono font-bold uppercase" /></div>
                            <div><label className="block font-semibold mb-1">Sub-Branch PAN (Optional)</label><Input placeholder="BBCCS5678G" value={subBranchForm.pan} onChange={e => setSubBranchForm({ ...subBranchForm, pan: e.target.value.toUpperCase() })} className="font-mono font-bold uppercase" /></div>
                          </div>
                        </div>
                      )}

                      {subBranchTab === "stamp" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block font-semibold mb-1">Partner Signatory Name</label>
                              <Input placeholder="e.g. Debabrata Mukherjee (Leave blank for Company default)" value={subBranchForm.signatory_name} onChange={e => setSubBranchForm({ ...subBranchForm, signatory_name: e.target.value })} />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1">Partner Designation</label>
                              <Input placeholder="e.g. Franchise Partner / Director" value={subBranchForm.signatory_designation} onChange={e => setSubBranchForm({ ...subBranchForm, signatory_designation: e.target.value })} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                              <ImageUploadField
                                label="Partner Signature (Optional Override)"
                                value={subBranchForm.signature_image_url}
                                onChange={url => setSubBranchForm({ ...subBranchForm, signature_image_url: url })}
                                uploadNamePrefix="subbranch_sig"
                                helperText="If not uploaded, the parent Company's signature is automatically used."
                              />
                            </div>
                            <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                              <ImageUploadField
                                label="Partner / Franchise Stamp (Optional Override)"
                                value={subBranchForm.stamp_image_url}
                                onChange={url => setSubBranchForm({ ...subBranchForm, stamp_image_url: url })}
                                uploadNamePrefix="subbranch_stamp"
                                helperText="If not uploaded, the parent Company's seal stamp is automatically used."
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {subBranchTab === "bank" && (
                        <div className="space-y-4">
                          {/* Dual Profile Switcher Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-2xl bg-surface border border-border">
                            <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-muted/40 border border-border/80">
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
                                <span>GST Bank Profile</span>
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
                                <span>Non-GST Bank Profile</span>
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

                          {/* GST BANK PROFILE */}
                          {subBranchBankProfileTab === "gst" && (
                            <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10 space-y-3.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                                  GST Invoicing Bank &amp; Settlement Account
                                </span>
                                <span className="text-[10px] text-muted-foreground">Used for Official GST Tax Invoices</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                  <label className="block font-semibold mb-1">GST Bank Name</label>
                                  <Input 
                                    placeholder="e.g. State Bank of India" 
                                    value={subBranchForm.gst_bank_name} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, gst_bank_name: e.target.value, bank_name: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Account Holder Name</label>
                                  <Input 
                                    placeholder="e.g. Saampark Technology Pvt Ltd" 
                                    value={subBranchForm.gst_account_holder} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, gst_account_holder: e.target.value, account_holder: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">GST Account Number</label>
                                  <Input 
                                    placeholder="Partner GST A/C number..." 
                                    value={subBranchForm.gst_account_number} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, gst_account_number: e.target.value, account_number: e.target.value })} 
                                    className="font-mono font-bold" 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">IFSC Code</label>
                                  <Input 
                                    placeholder="e.g. SBIN0001234" 
                                    value={subBranchForm.gst_ifsc_code} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, gst_ifsc_code: e.target.value.toUpperCase(), ifsc_code: e.target.value.toUpperCase() })} 
                                    className="font-mono font-bold uppercase" 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Bank Branch Name</label>
                                  <Input 
                                    placeholder="e.g. City Center Branch" 
                                    value={subBranchForm.gst_bank_branch} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, gst_bank_branch: e.target.value, bank_branch: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">GST UPI ID / VPA</label>
                                  <Input 
                                    placeholder="e.g. saampark.gst@sbi" 
                                    value={subBranchForm.gst_upi_id} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, gst_upi_id: e.target.value, upi_id: e.target.value })} 
                                    className="font-mono" 
                                  />
                                </div>
                              </div>
                              <div className="pt-2">
                                <ImageUploadField
                                  label="GST Payment QR Code / Scanner"
                                  value={subBranchForm.gst_payment_qr_url}
                                  onChange={url => setSubBranchForm({ ...subBranchForm, gst_payment_qr_url: url, payment_qr_url: url })}
                                  uploadNamePrefix="subbranch_gst_qr"
                                  helperText="Official QR scanner image printed on GST Tax Invoices."
                                />
                              </div>
                            </div>
                          )}

                          {/* NON-GST BANK PROFILE */}
                          {subBranchBankProfileTab === "nongst" && (
                            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10 space-y-3.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                                  Non-GST Invoicing Bank &amp; Settlement Account
                                </span>
                                <span className="text-[10px] text-muted-foreground">Used for Non-GST / Direct Estimates &amp; Bills</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                  <label className="block font-semibold mb-1">Non-GST Bank Name</label>
                                  <Input 
                                    placeholder="e.g. HDFC Bank Ltd" 
                                    value={subBranchForm.nongst_bank_name} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, nongst_bank_name: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Account Holder Name</label>
                                  <Input 
                                    placeholder="e.g. Franchise Partner Name" 
                                    value={subBranchForm.nongst_account_holder} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, nongst_account_holder: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Non-GST Account Number</label>
                                  <Input 
                                    placeholder="Partner Non-GST A/C number..." 
                                    value={subBranchForm.nongst_account_number} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, nongst_account_number: e.target.value })} 
                                    className="font-mono font-bold" 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">IFSC Code</label>
                                  <Input 
                                    placeholder="e.g. HDFC0001234" 
                                    value={subBranchForm.nongst_ifsc_code} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, nongst_ifsc_code: e.target.value.toUpperCase() })} 
                                    className="font-mono font-bold uppercase" 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Bank Branch Name</label>
                                  <Input 
                                    placeholder="e.g. Main Commercial Branch" 
                                    value={subBranchForm.nongst_bank_branch} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, nongst_bank_branch: e.target.value })} 
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Non-GST UPI ID / VPA</label>
                                  <Input 
                                    placeholder="e.g. partner.nongst@okhdfcbank" 
                                    value={subBranchForm.nongst_upi_id} 
                                    onChange={e => setSubBranchForm({ ...subBranchForm, nongst_upi_id: e.target.value })} 
                                    className="font-mono" 
                                  />
                                </div>
                              </div>
                              <div className="pt-2">
                                <ImageUploadField
                                  label="Non-GST Payment QR Code / Scanner"
                                  value={subBranchForm.nongst_payment_qr_url}
                                  onChange={url => setSubBranchForm({ ...subBranchForm, nongst_payment_qr_url: url })}
                                  uploadNamePrefix="subbranch_nongst_qr"
                                  helperText="Payment QR code scanner image printed on Non-GST Invoices."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {subBranchTab === "terms" && (
                        <div className="space-y-4">
                          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                            <Landmark size={14} className="shrink-0 text-emerald-600" />
                            <span>Leave blank to automatically inherit parent Company's Terms &amp; Conditions and Invoice Notes.</span>
                          </div>
                          <div>
                            <label className="block font-semibold mb-1 text-[11px]">Sub-Branch Terms &amp; Conditions (Override)</label>
                            <textarea
                              rows={4}
                              value={subBranchForm.terms_conditions}
                              onChange={e => setSubBranchForm({ ...subBranchForm, terms_conditions: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Enter sub-branch specific terms or leave empty to inherit from parent Company..."
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1 text-[11px]">Sub-Branch Invoice Notes (Override)</label>
                            <textarea
                              rows={3}
                              value={subBranchForm.invoice_notes}
                              onChange={e => setSubBranchForm({ ...subBranchForm, invoice_notes: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Enter sub-branch specific invoice notes or leave empty to inherit from parent Company..."
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Left Pane Footer Actions */}
                    <div className="flex items-center justify-between p-3.5 border-t border-border shrink-0 bg-muted/20">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live synced with preview</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowSubBranchModal(false)}>Cancel</Button>
                        <Button size="sm" onClick={() => saveSubBranch(false)} disabled={saving || !subBranchForm.name.trim()} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                          {editingSubBranch ? "Update Sub-Branch" : "Save Sub-Branch"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Right Live Document Preview Studio Pane */}
                {(subBranchModalViewMode === "split" || subBranchModalViewMode === "preview") && (
                  <div className={`flex flex-col h-full overflow-hidden bg-zinc-100 dark:bg-zinc-950/80 ${
                    subBranchModalViewMode === "split" ? "w-full lg:w-[52%] xl:w-[55%]" : "w-full"
                  }`}>
                    {/* Studio Header Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-surface border-b border-border shrink-0 text-xs">
                      {/* Scheme Switcher */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Scheme:</span>
                        <button
                          type="button"
                          onClick={() => setPreviewInvoiceType("gst")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            previewInvoiceType === "gst" ? "bg-teal-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          GST Tax (Teal)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewInvoiceType("nongst")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            previewInvoiceType === "nongst" ? "bg-sky-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Non-GST Direct (Sky)
                        </button>
                      </div>

                      {/* Zoom / Volume Controls */}
                      <div className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-lg border border-border">
                        <span className="text-[10px] font-bold text-muted-foreground mr-1">Zoom:</span>
                        <button
                          type="button"
                          onClick={() => setSubBranchZoom(prev => Math.max(60, prev - 10))}
                          className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-surface border border-border rounded hover:bg-muted"
                          title="Zoom Out"
                        >
                          -
                        </button>
                        <span className="font-mono text-[10px] font-bold w-10 text-center">{subBranchZoom}%</span>
                        <button
                          type="button"
                          onClick={() => setSubBranchZoom(prev => Math.min(150, prev + 10))}
                          className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-surface border border-border rounded hover:bg-muted"
                          title="Zoom In"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubBranchZoom(100)}
                          className="text-[9px] px-1 text-muted-foreground hover:text-foreground ml-0.5"
                          title="Reset to 100%"
                        >
                          100%
                        </button>
                      </div>

                      {/* Stamp Adders & Reset */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => addCustomStampTo(setSubBranchCustomStamps, "PARTNER NOTE", "#2563eb", "badge")}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 hover:bg-blue-200 cursor-pointer"
                          title="Add draggable text sticker with zoom in/out & styling"
                        >
                          + Text Note
                        </button>
                        <button
                          type="button"
                          onClick={() => addCustomStampTo(setSubBranchCustomStamps, "PAID IN FULL", "#059669", "stamp")}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-200 cursor-pointer"
                        >
                          + PAID Stamp
                        </button>
                        <button
                          type="button"
                          onClick={() => addCustomStampTo(setSubBranchCustomStamps, "PARTNER SEAL", "#0d9488", "stamp")}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 hover:bg-teal-200 cursor-pointer"
                        >
                          + SEAL Stamp
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSubBranchSignaturePos({ x: 0, y: 0 })
                            setSubBranchStampPos({ x: 0, y: 0 })
                            setSubBranchCustomStamps([])
                          }}
                          className="px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded"
                        >
                          Reset Drag
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveSubBranch(true)}
                          disabled={saving}
                          className={`font-bold h-7 px-3 text-xs gap-1 shadow-sm shrink-0 ml-auto transition-all ${
                            subBranchPreviewSaveSuccess 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                              : "bg-primary hover:bg-primary/90 text-primary-foreground"
                          }`}
                          title="Save preview layout, signature/stamp positions, and live canvas modifications for this sub-branch"
                        >
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          {saving ? "Saving..." : subBranchPreviewSaveSuccess ? "Saved Successfully!" : "Save Preview"}
                        </Button>
                      </div>
                    </div>

                    {/* Interactive Placement Coordinates */}
                    <div className="px-3 py-1.5 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/50 text-[10px] text-amber-900 dark:text-amber-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
                      <span className="flex items-center gap-1 font-semibold">
                        <span>✍ <strong>Live Canvas:</strong> Touch/click any text to edit • ✥ Drag Logo, Seal, Signature &amp; Notes independently</span>
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[9px] font-bold">
                        <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200">
                          Sig: X:{subBranchSignaturePos.x} Y:{subBranchSignaturePos.y}
                        </span>
                        <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200">
                          Stamp: X:{subBranchStampPos.x} Y:{subBranchStampPos.y}
                        </span>
                      </div>
                    </div>

                    {/* Scrollable Live Canvas with Zoom */}
                    <div className="flex-1 overflow-y-auto overflow-x-auto p-4 flex justify-center items-start">
                      <div 
                        className="w-full max-w-[820px] shadow-xl rounded-2xl transition-transform duration-150 origin-top"
                        style={{ transform: `scale(${subBranchZoom / 100})`, transformOrigin: "top center" }}
                      >
                        {(() => {
                          const pBranch = branches.find(b => b.id === subBranchBranchId)
                          const pComp = companies.find(c => c.id === subBranchCompanyId || c.id === pBranch?.company_id) || companies[0]
                          return (
                            <OfficialInvoiceDocument
                              invoice={{
                                id: "DEMO-SB-INV-001",
                                invoiceNumber: previewInvoiceType === "gst" ? "INV-29102026001" : "NG-29102026001",
                                invoice_number: previewInvoiceType === "gst" ? "INV-29102026001" : "NG-29102026001",
                                date: "2026-09-18",
                                issueDate: "2026-09-18",
                                dueDate: "2026-10-03",
                                companyId: pComp?.id || "tech",
                                company_id: pComp?.id || "tech",
                                branchId: pBranch?.id || subBranchBranchId,
                                branch_id: pBranch?.id || subBranchBranchId,
                                subBranchId: editingSubBranch?.id || "subbranch-preview",
                                sub_branch_id: editingSubBranch?.id || "subbranch-preview",
                                client: "Acme Corp",
                                clientName: "Acme Corp",
                                customer: "Acme Corp",
                                clientEmail: "billing@acmecorp.com",
                                clientPhone: "+91 90915 18567",
                                clientAddress: "Corporate Center, Paschim Medinipur, West Bengal",
                                clientGstin: "19ABASCS1649D1ZY",
                                projectTitle: "Custom Solution Project",
                                status: "Draft",
                                scheme: previewInvoiceType,
                                items: [
                                  {
                                    id: "item-1",
                                    description: "Custom Enterprise Consulting & Development",
                                    serviceName: "Custom Enterprise Consulting & Development",
                                    sacCode: "998313",
                                    sac: "998313",
                                    qty: 1,
                                    quantity: 1,
                                    rate: 15000,
                                    unitPrice: 15000,
                                    unit: "Project",
                                    gstRate: previewInvoiceType === "gst" ? 18 : 0,
                                    totalAmount: previewInvoiceType === "gst" ? 17700 : 15000,
                                    total: previewInvoiceType === "gst" ? 17700 : 15000,
                                  }
                                ],
                                subtotal: 15000,
                                taxableBase: 15000,
                                tax: previewInvoiceType === "gst" ? 2700 : 0,
                                taxAmount: previewInvoiceType === "gst" ? 2700 : 0,
                                total: previewInvoiceType === "gst" ? 17700 : 15000,
                                totalAmount: previewInvoiceType === "gst" ? 17700 : 15000,
                                paidAmount: 0,
                                received: 0,
                                due: previewInvoiceType === "gst" ? 17700 : 15000,
                                dueAmount: previewInvoiceType === "gst" ? 17700 : 15000,
                                terms: subBranchForm.terms_conditions || pBranch?.terms_conditions || pComp?.terms_conditions || "1. Payment is due within statutory terms.\n2. Goods & Services once delivered are subject to project sign-off.\n3. Disputed items must be notified within 7 days.",
                                notes: subBranchForm.invoice_notes || pBranch?.invoice_notes || pComp?.invoice_notes || "Thank you for your business."
                              } as any}
                              companyDetails={pComp}
                              activeBranch={pBranch}
                              activeSubBranch={{
                                ...subBranchForm,
                                id: editingSubBranch?.id || "subbranch-preview",
                                branch_id: subBranchBranchId,
                                company_id: subBranchCompanyId
                              } as any}
                              interactive={true}
                              logoScale={subBranchLogoScale}
                              onLogoScaleChange={setSubBranchLogoScale}
                              stampPosition={subBranchStampPos}
                              onStampPositionChange={setSubBranchStampPos}
                              stampScale={subBranchStampScale}
                              onStampScaleChange={setSubBranchStampScale}
                              signaturePosition={subBranchSignaturePos}
                              onSignaturePositionChange={setSubBranchSignaturePos}
                              signatureScale={subBranchSignatureScale}
                              onSignatureScaleChange={setSubBranchSignatureScale}
                              customStamps={subBranchCustomStamps}
                              onCustomStampMove={(id, pos) => setSubBranchCustomStamps(prev => prev.map(s => s.id === id ? { ...s, ...pos } : s))}
                              onCustomStampUpdate={(id, updates) => setSubBranchCustomStamps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))}
                              onRemoveCustomStamp={(id) => setSubBranchCustomStamps(prev => prev.filter(s => s.id !== id))}
                              onAddCustomStamp={(s) => addCustomStampTo(setSubBranchCustomStamps, s?.text || "NOTE", s?.color || "#0d9488", s?.bgStyle || "badge")}
                              onFieldChange={(field, val) => setSubBranchForm(prev => ({ ...prev, [field]: val }))}
                            />
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION */}
      <AnimatePresence>
        {showDeleteConfirm && deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 space-y-4 text-xs">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                <h2 className="text-sm font-bold text-foreground mb-1">Delete {deleteTarget.type === "company" ? "Company" : deleteTarget.type === "branch" ? "Branch" : "Sub-Branch"}</h2>
                <p className="text-muted-foreground">
                  Are you sure you want to permanently delete this {deleteTarget.type.replace('_', ' ')}? All associated records will be cleanly removed.
                </p>
                <div className="flex items-center justify-center gap-2 mt-5">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                  <Button variant="danger" onClick={executeDelete} disabled={saving}>
                    {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
