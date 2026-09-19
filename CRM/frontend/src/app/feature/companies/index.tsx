"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, Plus, Search, Edit2, Trash2, ChevronRight, ChevronDown, 
  MapPin, Phone, Mail, Globe, Users, Briefcase, DollarSign, Building, 
  Loader2, AlertCircle, Shield, CreditCard, Award, CheckCircle2, Image,
  X, Sparkles, Eye, Landmark, QrCode, FileText, Check, ShieldCheck
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
    currency_symbol: "₹",
    logo_url: "/saampark-logo.png",
    address: "Madinipur, Kolkata, Durgapur, West Bengal, India - 721101",
    phone: "+91 9901518567 / +91 9901518569",
    email: "info@saamparktechnology.com",
    website: "www.saamparktechnology.com",
    status: "active",
    member_count: 18,
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
    currency_symbol: "₹",
    logo_url: "",
    address: "Salt Lake Sector V, Bidhannagar, Kolkata, West Bengal - 700091",
    phone: "+91 9901518570",
    email: "consultancy@saampark.in",
    website: "www.saampark.in",
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
    name: "Head Office - Mumbai & Kolkata Technology Center",
    code: "STR-HO",
    city: "Mumbai / Kolkata",
    state: "Maharashtra / West Bengal",
    country: "India",
    phone: "+91 9901518567",
    email: "ho@saamparktechnology.com",
    manager_name: "Supriya Kumar",
    status: "active",
    user_count: 14,
  },
]

export default function CompaniesMain() {
  const { user, fetchCompanies } = useAuthStore()
  const isSuperAdmin = user?.role === "Super Admin"

  const [companies, setCompanies] = React.useState<Company[]>(CANONICAL_COMPANIES)
  const [branches, setBranches] = React.useState<Branch[]>(CANONICAL_BRANCHES)
  const [subBranches, setSubBranches] = React.useState<SubBranch[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [searchQuery, setSearchQuery] = React.useState("")
  const [industryFilter, setIndustryFilter] = React.useState("")
  const [expandedCompanies, setExpandedCompanies] = React.useState<Set<string>>(new Set(["tech", "digital", "saampark-ai-solutions"]))
  const [expandedBranches, setExpandedBranches] = React.useState<Set<string>>(new Set())

  // Modal states
  const [showCompanyModal, setShowCompanyModal] = React.useState(false)
  const [editingCompany, setEditingCompany] = React.useState<Company | null>(null)
  const [companyTab, setCompanyTab] = React.useState<"identity" | "tax" | "contact" | "branding" | "signatory" | "bank" | "preview">("identity")
  const [companyBankProfileTab, setCompanyBankProfileTab] = React.useState<"gst" | "nongst">("gst")
  const [companyBankSubTab, setCompanyBankSubTab] = React.useState<"gst" | "nongst">("gst")
  const [companyPreviewScale, setCompanyPreviewScale] = React.useState<"fit" | "normal" | "large">("fit")
  const [branchPreviewScale, setBranchPreviewScale] = React.useState<"fit" | "normal" | "large">("fit")
  const [subBranchPreviewScale, setSubBranchPreviewScale] = React.useState<"fit" | "normal" | "large">("fit")
  const [previewEntityLevel, setPreviewEntityLevel] = React.useState<"company" | "branch" | "subbranch">("company")
  const [previewInvoiceType, setPreviewInvoiceType] = React.useState<"gst" | "nongst">("gst")
  const [selectedPreviewBranchId, setSelectedPreviewBranchId] = React.useState<string>("")
  const [selectedPreviewSubBranchId, setSelectedPreviewSubBranchId] = React.useState<string>("")
  const [companySignaturePos, setCompanySignaturePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [branchSignaturePos, setBranchSignaturePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [subBranchSignaturePos, setSubBranchSignaturePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [companyCustomStamps, setCompanyCustomStamps] = React.useState<CustomTextStamp[]>([])
  const [activePreviewDocModal, setActivePreviewDocModal] = React.useState<{
    isOpen: boolean
    entityType: "company" | "branch" | "subbranch"
    companyData?: any
    branchData?: any
    subBranchData?: any
  } | null>(null)

  const [companyForm, setCompanyForm] = React.useState({
    name: "", brand_name: "", division_name: "", subtitle: "", slug: "", 
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
  const [branchTab, setBranchTab] = React.useState<"basic" | "tax" | "preview">("basic")
  const [branchForm, setBranchForm] = React.useState({
    name: "", code: "", brand_name: "", division_name: "",
    logo_url: "", payment_qr_url: "",
    gstin: "", pan: "",
    signatory_name: "", signatory_designation: "", signature_image_url: "", stamp_image_url: "",
    address: "", city: "", state: "", zip: "", country: "India", phone: "", email: "", managerName: "", managerPhone: "",
    bank_name: "", account_holder: "", account_number: "", ifsc_code: "", upi_id: "",
    status: "active"
  })

  const [showSubBranchModal, setShowSubBranchModal] = React.useState(false)
  const [editingSubBranch, setEditingSubBranch] = React.useState<SubBranch | null>(null)
  const [subBranchBranchId, setSubBranchBranchId] = React.useState("")
  const [subBranchCompanyId, setSubBranchCompanyId] = React.useState("")
  const [subBranchTab, setSubBranchTab] = React.useState<"partner" | "location" | "preview">("partner")
  const [subBranchForm, setSubBranchForm] = React.useState({
    name: "", code: "", partner_name: "", partner_phone: "", partner_email: "",
    revenue_share_pct: 0, partner_type: "Individual",
    address: "", city: "", state: "", phone: "", email: "",
    gstin: "", pan: "", bank_name: "", account_number: "", ifsc_code: "", upi_id: "",
    logo_url: "", signature_image_url: "", stamp_image_url: "", payment_qr_url: "",
    signatory_name: "Partner Signatory", signatory_designation: "Franchise Partner",
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

      // 1. Merge Companies (strictly 2 canonical companies: tech and consultancy)
      const getCanonKey = (c: any) => {
        const str = String(c?.slug || c?.id || c?.numeric_id || c?.name || "").toLowerCase().trim()
        if (str === "2" || str === "consultancy" || str.includes("consult")) return "consultancy"
        return "tech"
      }

      const compMap = new Map<string, Company>()
      CANONICAL_COMPANIES.forEach(c => {
        const k = getCanonKey(c)
        compMap.set(k, { ...c, id: k, slug: k })
      })

      if (Array.isArray(dbComps) && dbComps.length > 0) {
        dbComps.forEach(c => {
          if (!isCompanyDeleted(c.id, c.slug)) {
            const k = getCanonKey(c)
            const prev = compMap.get(k)
            compMap.set(k, {
              ...prev,
              ...c,
              id: k,
              slug: k,
              logo_url: (k === "consultancy" && c.logo_url === "/saampark-logo.png") ? "" : (c.logo_url !== undefined ? c.logo_url : (prev?.logo_url || "")),
            })
          }
        })
      }

      if (Array.isArray(compRes) && compRes.length > 0) {
        compRes.forEach(c => {
          if (!isCompanyDeleted(c.id, c.slug)) {
            const k = getCanonKey(c)
            const prev = compMap.get(k)
            compMap.set(k, {
              ...prev,
              ...c,
              id: k,
              slug: k,
              logo_url: (k === "consultancy" && c.logo_url === "/saampark-logo.png") ? "" : (c.logo_url !== undefined ? c.logo_url : (prev?.logo_url || "")),
            })
          }
        })
      }

      const rawTech = compMap.get("tech") || CANONICAL_COMPANIES[0]
      const rawConsult = compMap.get("consultancy") || CANONICAL_COMPANIES[1]

      const techUsersCount = cleanUsers.filter(u => {
        const cIds = u.companyIds || (u.companyId ? [u.companyId] : ["tech"])
        return (Array.isArray(cIds) ? cIds : [cIds]).some((id: any) => String(id).toLowerCase().includes("tech") || id === "1")
      }).length

      const consultUsersCount = cleanUsers.filter(u => {
        const cIds = u.companyIds || (u.companyId ? [u.companyId] : [])
        return (Array.isArray(cIds) ? cIds : [cIds]).some((id: any) => String(id).toLowerCase().includes("consult") || id === "2")
      }).length

      const finalCompanies: Company[] = [
        {
          ...CANONICAL_COMPANIES[0],
          ...rawTech,
          id: "tech",
          slug: "tech",
          brand_name: "SAAMPARK",
          division_name: "TECHNOLOGY",
          subtitle: (rawTech.subtitle && !rawTech.subtitle.toLowerCase().includes("consult")) ? rawTech.subtitle : "AND RESEARCH PRIVATE LIMITED",
          name: "SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED",
          logo_url: (rawTech.logo_url && rawTech.logo_url.trim() !== "") ? rawTech.logo_url : "/saampark-logo.png",
          member_count: techUsersCount,
        },
        {
          ...CANONICAL_COMPANIES[1],
          ...rawConsult,
          id: "consultancy",
          slug: "consultancy",
          brand_name: "SAAMPARK",
          division_name: "CONSULTANCY SERVICE",
          subtitle: (rawConsult.subtitle && !rawConsult.subtitle.toLowerCase().includes("research")) ? rawConsult.subtitle : "MANAGEMENT & ADVISORY SERVICES",
          name: "SAAMPARK CONSULTANCY SERVICE",
          logo_url: (rawConsult.logo_url && rawConsult.logo_url !== "/saampark-logo.png") ? rawConsult.logo_url : "",
          member_count: consultUsersCount,
        },
      ]
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

      // Persist baseline to DB
      saveModuleDataToDB("companies", finalCompanies, "all").catch(() => {})
      saveModuleDataToDB("branches", finalBranches, "all").catch(() => {})
      saveModuleDataToDB("sub_branches", subList, "all").catch(() => {})
    } catch (err: any) {
      setError(err?.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

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
    return subBranches.filter(sb => String(sb.branch_id || (sb as any).branchId) === String(branchId))
  }
  const getUserCountForCompany = (companyId: string) => {
    const isConsult = String(companyId).toLowerCase().includes("consult") || companyId === "2"
    if (isConsult) {
      return (allUsers || []).filter(u => {
        const cIds = u.companyIds || (u.companyId ? [u.companyId] : [])
        return (Array.isArray(cIds) ? cIds : [cIds]).some((id: any) => String(id).toLowerCase().includes("consult") || id === "2")
      }).length
    }
    return (allUsers || []).filter(u => {
      const cIds = u.companyIds || (u.companyId ? [u.companyId] : ["tech"])
      return (Array.isArray(cIds) ? cIds : [cIds]).some((id: any) => String(id).toLowerCase().includes("tech") || id === "1")
    }).length
  }

  const filteredCompanies = React.useMemo(() => {
    return companies.filter(c => {
      const matchesSearch = !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.slug?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesIndustry = !industryFilter || c.industry === industryFilter
      return matchesSearch && matchesIndustry
    })
  }, [companies, searchQuery, industryFilter])

  // ── COMPANY MODAL OPENERS ──────────────────────────────────────────────────
  const openAddCompany = () => {
    setEditingCompany(null)
    setCompanyTab("identity")
    setCompanyBankSubTab("gst")
    setCompanyForm({
      name: "", brand_name: "SAAMPARK", division_name: "", subtitle: "", slug: "",
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
    setCompanyForm({
      name: c.name || "", brand_name: c.brand_name || "", division_name: c.division_name || "", subtitle: c.subtitle || "", slug: c.slug || "",
      industry: c.industry || "Technology", currency: c.currency || "INR", logo_url: c.logo_url || "",
      gstin: c.gstin || "", pan: c.pan || "", cin: c.cin || "", msme_reg: c.msme_reg || "",
      iso_certification: c.iso_certification ?? "An ISO 9001:2015 Certified Company",
      signatory_name: c.signatory_name || "Authorized Signatory", signatory_designation: c.signatory_designation || "Managing Director", signature_image_url: c.signature_image_url || "", stamp_image_url: c.stamp_image_url || "",
      address: c.address || "", city: c.city || "", state: c.state || "", zip: c.zip || "", country: c.country || "India", phone: c.phone || "", email: c.email || "", website: c.website || "",
      bank_name: c.bank_name || c.gst_bank_name || "",
      account_holder: c.account_holder || c.gst_account_holder || "",
      account_number: c.account_number || c.gst_account_number || "",
      ifsc_code: c.ifsc_code || c.gst_ifsc_code || "",
      bank_branch: c.bank_branch || c.gst_bank_branch || "",
      upi_id: c.upi_id || c.gst_upi_id || "",
      payment_qr_url: c.payment_qr_url || c.gst_payment_qr_url || "",
      gst_bank_name: c.gst_bank_name || c.bank_name || "",
      gst_account_holder: c.gst_account_holder || c.account_holder || "",
      gst_account_number: c.gst_account_number || c.account_number || "",
      gst_ifsc_code: c.gst_ifsc_code || c.ifsc_code || "",
      gst_bank_branch: c.gst_bank_branch || c.bank_branch || "",
      gst_upi_id: c.gst_upi_id || c.upi_id || "",
      gst_payment_qr_url: c.gst_payment_qr_url || c.payment_qr_url || "",
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

  const saveCompany = async () => {
    if (!companyForm.name.trim()) return
    setSaving(true)
    try {
      const cur = CURRENCIES.find(c => c.code === companyForm.currency)
      const payload = {
        ...companyForm,
        name: companyForm.name.trim(),
        slug: companyForm.slug.trim() || generateSlug(companyForm.name.trim()),
        currency_symbol: cur?.symbol || "₹",
      }

      if (editingCompany) {
        await CompanyApiService.update(String(editingCompany.id), payload)
      } else {
        await CompanyApiService.create(payload)
      }

      // Sync into useAuthStore state, app_data, and localStorage immediately
      const { updateCompany, addCompany, fetchCompanies: syncCompanies } = useAuthStore.getState()
      const compKey = editingCompany ? (editingCompany.slug || String(editingCompany.id)) : payload.slug
      if (editingCompany) {
        await updateCompany(compKey, payload).catch(() => {})
      } else {
        await addCompany(payload).catch(() => {})
      }
      await syncCompanies()

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("saampark_company_updated", { detail: payload }))
        window.dispatchEvent(new CustomEvent("saampark_data_synced"))
        window.dispatchEvent(new Event("storage"))
      }

      setShowCompanyModal(false)
      setEditingCompany(null)
      await loadData()
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
    setBranchForm({
      name: "Salt Lake Technology Center Branch",
      code: `STR-BR-${Math.floor(100 + Math.random() * 900)}`,
      brand_name: "SAAMPARK",
      division_name: "Operations",
      logo_url: "",
      payment_qr_url: "",
      gstin: "19AAECS1234F1Z8",
      pan: "AAECS1234F",
      signatory_name: "Supriya Kumar",
      signatory_designation: "Branch Manager",
      signature_image_url: "",
      stamp_image_url: "",
      address: "Plot 4, Block DP, Sector V, Salt Lake City",
      city: "Kolkata",
      state: "West Bengal",
      zip: "700091",
      country: "India",
      phone: "+91 99015 18567",
      email: "saltlake.branch@saamparktechnology.com",
      managerName: "Supriya Kumar",
      managerPhone: "+91 98765 43210",
      bank_name: "ICICI Bank Ltd",
      account_holder: "SAAMPARK TECHNOLOGY - BRANCH OPERATIONS",
      account_number: "123405009876",
      ifsc_code: "ICIC0001234",
      upi_id: "saampark.branch@icici",
      status: "active"
    })
    setShowBranchModal(true)
  }

  const openEditBranch = (b: any) => {
    setEditingBranch(b)
    setBranchCompanyId(b.company_id)
    setBranchTab("basic")
    setBranchForm({
      name: b.name || "", code: b.code || "", brand_name: b.brand_name || "", division_name: b.division_name || "",
      logo_url: b.logo_url || "", payment_qr_url: b.payment_qr_url || "",
      gstin: b.gstin || "", pan: b.pan || "",
      signatory_name: b.signatory_name || "Authorized Signatory", signatory_designation: b.signatory_designation || "Branch Manager", signature_image_url: b.signature_image_url || "", stamp_image_url: b.stamp_image_url || "",
      address: b.address || "", city: b.city || "", state: b.state || "", zip: b.zip || "", country: b.country || "India", phone: b.phone || "", email: b.email || "", managerName: b.managerName || "", managerPhone: b.managerPhone || "",
      bank_name: b.bank_name || "", account_holder: b.account_holder || "", account_number: b.account_number || "", ifsc_code: b.ifsc_code || "", upi_id: b.upi_id || "",
      status: b.status || "active"
    })
    setShowBranchModal(true)
  }

  const saveBranch = async () => {
    if (!branchForm.name.trim()) return
    setSaving(true)
    try {
      const payload: any = {
        ...branchForm,
        name: branchForm.name.trim(),
        code: branchForm.code.trim().toUpperCase(),
        companyId: branchCompanyId,
        company_id: branchCompanyId,
        bankDetails: {
          bankName: branchForm.bank_name,
          accountHolder: branchForm.account_holder,
          accountNumber: branchForm.account_number,
          ifscCode: branchForm.ifsc_code,
          upiId: branchForm.upi_id,
        }
      }

      unmarkGlobalItemDeleted(payload.code, "branches")
      if (editingBranch?.id) unmarkGlobalItemDeleted(editingBranch.id, "branches")

      if (editingBranch) {
        await useAuthStore.getState().updateBranch(editingBranch.id, payload).catch(() => {})
        await BranchApiService.update(String(editingBranch.id), payload).catch(() => {})
      } else {
        await useAuthStore.getState().addBranch(payload).catch(() => {})
        await BranchApiService.create(branchCompanyId, payload).catch(() => {})
      }
      setShowBranchModal(false)
      setEditingBranch(null)
      setExpandedCompanies(prev => new Set([...prev, branchCompanyId]))
      await loadData()
      await useAuthStore.getState().fetchBranches().catch(() => {})
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
    setSubBranchForm({
      name: "Durgapur City Center Sub-Branch",
      code: `SB-DUR-${Math.floor(100 + Math.random() * 900)}`,
      partner_name: "Debabrata Mukherjee",
      partner_phone: "+91 98321 45678",
      partner_email: "debabrata.durgapur@saampark.com",
      revenue_share_pct: 30,
      partner_type: "Franchise Partner",
      address: "Bengal Shristi Commercial Complex, City Center",
      city: "Durgapur",
      state: "West Bengal",
      phone: "+91 98321 45678",
      email: "durgapur.franchise@saamparktechnology.com",
      gstin: "19BBCCS5678G1Z2",
      pan: "BBCCS5678G",
      bank_name: "State Bank of India",
      account_number: "39871234567",
      ifsc_code: "SBIN0001234",
      upi_id: "saampark.durgapur@sbi",
      logo_url: "",
      signature_image_url: "",
      stamp_image_url: "",
      payment_qr_url: "",
      signatory_name: "Debabrata Mukherjee",
      signatory_designation: "Franchise Partner",
      status: "active"
    })
    setShowSubBranchModal(true)
  }

  const openEditSubBranch = (sb: any) => {
    setEditingSubBranch(sb)
    setSubBranchBranchId(sb.branch_id)
    setSubBranchCompanyId(sb.company_id)
    setSubBranchTab("partner")
    setSubBranchForm({
      name: sb.name || "", code: sb.code || "", partner_name: sb.partner_name || "", partner_phone: sb.partner_phone || "", partner_email: sb.partner_email || "",
      revenue_share_pct: sb.revenue_share_pct != null ? Number(sb.revenue_share_pct) : 30, partner_type: sb.partner_type || "Franchise Partner",
      address: sb.address || "", city: sb.city || "", state: sb.state || "", phone: sb.phone || "", email: sb.email || "",
      gstin: sb.gstin || "", pan: sb.pan || "", bank_name: sb.bank_name || "", account_number: sb.account_number || "", ifsc_code: sb.ifsc_code || "", upi_id: sb.upi_id || "",
      logo_url: sb.logo_url || "", signature_image_url: sb.signature_image_url || "", stamp_image_url: sb.stamp_image_url || "", payment_qr_url: sb.payment_qr_url || "",
      signatory_name: sb.signatory_name || "Partner Signatory", signatory_designation: sb.signatory_designation || "Franchise Partner",
      status: sb.status || "active"
    })
    setShowSubBranchModal(true)
  }

  const saveSubBranch = async () => {
    if (!subBranchForm.name.trim()) return
    setSaving(true)
    try {
      const payload: any = {
        branch_id: subBranchBranchId,
        parentBranchId: subBranchBranchId,
        companyId: subBranchCompanyId,
        company_id: subBranchCompanyId,
        ...subBranchForm,
        name: subBranchForm.name.trim(),
        code: subBranchForm.code.trim().toUpperCase(),
        revenue_share_pct: Number(subBranchForm.revenue_share_pct),
        revenueSharePct: Number(subBranchForm.revenue_share_pct),
      }

      unmarkGlobalItemDeleted(payload.code, "subBranches")
      if (editingSubBranch?.id) unmarkGlobalItemDeleted(editingSubBranch.id, "subBranches")

      if (editingSubBranch) {
        await useAuthStore.getState().updateSubBranch(editingSubBranch.id, payload).catch(() => {})
        await SubBranchApiService.update(String(editingSubBranch.id), payload).catch(() => {})
      } else {
        await useAuthStore.getState().addSubBranch(payload).catch(() => {})
        await SubBranchApiService.create(subBranchCompanyId, payload).catch(() => {})
      }
      setShowSubBranchModal(false)
      setEditingSubBranch(null)
      setExpandedBranches(prev => new Set([...prev, subBranchBranchId]))
      await loadData()
      await useAuthStore.getState().fetchSubBranches().catch(() => {})
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
                  <Button variant="ghost" size="sm" onClick={() => { openEditCompany(company); setCompanyTab("preview") }} title="Live Preview Document & Stamps" className="h-8 gap-1 text-xs text-primary font-bold"><Eye className="h-4 w-4" />Preview</Button>
                  <Button variant="ghost" size="sm" onClick={() => openAddBranch(company.id)} title="Add Branch"><Plus className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditCompany(company)} title="Edit Full Company Details"><Edit2 className="h-4 w-4" /></Button>
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
                                  <Button variant="ghost" size="sm" onClick={() => { openEditBranch(branch); setBranchTab("preview") }} title="Live Preview Branch Invoice" className="text-xs h-7 gap-1 text-blue-600 font-semibold"><Eye className="h-3.5 w-3.5" />Preview</Button>
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
                                          <Button variant="ghost" size="sm" onClick={() => { openEditSubBranch(sb); setSubBranchTab("preview") }} title="Live Preview Sub-Branch Invoice" className="text-xs h-7 gap-1 text-emerald-600 font-semibold"><Eye className="h-3.5 w-3.5" />Preview</Button>
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

                  {/* ── 5-TAB COMPANY MODAL (CLEAN FULL-WIDTH FORM) ────────────────── */}
      <AnimatePresence>
        {showCompanyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-xs">
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <span>{editingCompany ? `Edit Company: ${editingCompany.name}` : "Create New Company Entity"}</span>
                    </h2>
                    <p className="text-[11px] text-muted-foreground">Configure corporate branding, legal tax IDs, dual bank accounts, and authorized signatories</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCompanyModal(false)}><X className="h-4 w-4" /></Button>
              </div>

              {/* Full Width Form Tabs (Mobile Scrollable) */}
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex sm:grid sm:grid-cols-7 border-b border-border bg-muted/40 font-bold text-center shrink-0 overflow-x-auto">
                  <button type="button" onClick={() => setCompanyTab("identity")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "identity" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>1. Identity</button>
                  <button type="button" onClick={() => setCompanyTab("tax")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "tax" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>2. GST & Legal</button>
                  <button type="button" onClick={() => setCompanyTab("contact")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "contact" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>3. Address</button>
                  <button type="button" onClick={() => setCompanyTab("branding")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "branding" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>4. Branding</button>
                  <button type="button" onClick={() => setCompanyTab("signatory")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "signatory" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>5. Stamp & Sig</button>
                  <button type="button" onClick={() => setCompanyTab("bank")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "bank" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground hover:text-foreground"}`}>6. Dual Bank & QR</button>
                  <button type="button" onClick={() => setCompanyTab("preview")} className={`py-2.5 px-3 border-b-2 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-1 ${companyTab === "preview" ? "border-emerald-600 text-emerald-600 bg-surface dark:bg-zinc-900" : "border-transparent text-muted-foreground hover:text-foreground"}`}>7. Live Preview &amp; Drag</button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto flex-1 max-h-[64vh]">
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
                      <div><label className="block font-semibold mb-1">Registered Address *</label><Input placeholder="Full registered street address" value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} /></div>
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
                        <div><label className="block font-semibold mb-1">Signatory Name</label><Input placeholder="e.g. Authorized Signatory" value={companyForm.signatory_name} onChange={e => setCompanyForm({ ...companyForm, signatory_name: e.target.value })} /></div>
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
                                  gst_account_holder: prev.name || "SAAMPARK TECHNOLOGY RESEARCH & INNOVATION PRIVATE LIMITED",
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

                  {companyTab === "preview" && (
                    <div className="space-y-4">
                      {/* Top Controls Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/60 dark:bg-zinc-800/60 rounded-xl border border-border">
                        {/* Scheme Switcher */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-muted-foreground">Scheme:</span>
                          <button
                            type="button"
                            onClick={() => setPreviewInvoiceType("gst")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              previewInvoiceType === "gst" ? "bg-teal-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            GST Tax Invoice (Teal)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewInvoiceType("nongst")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              previewInvoiceType === "nongst" ? "bg-sky-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Non-GST Commercial (Sky Blue)
                          </button>
                        </div>

                        {/* Stamp adders and signature position reset */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newStamp = {
                                id: "stamp-" + Date.now(),
                                text: "PAID IN FULL",
                                x: 10,
                                y: 20,
                                color: "#059669",
                                fontSize: 12
                              }
                              setCompanyCustomStamps(prev => [...prev, newStamp])
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-200 cursor-pointer"
                          >
                            + PAID Stamp
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newStamp = {
                                id: "stamp-" + Date.now(),
                                text: "OFFICIAL SEAL",
                                x: -10,
                                y: 15,
                                color: "#0d9488",
                                fontSize: 11
                              }
                              setCompanyCustomStamps(prev => [...prev, newStamp])
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 hover:bg-teal-200 cursor-pointer"
                          >
                            + SEAL Stamp
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCompanySignaturePos({ x: 0, y: 0 })
                              setCompanyCustomStamps([])
                            }}
                            className="px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg"
                          >
                            Reset Position
                          </button>
                        </div>
                      </div>

                      {/* Interactive Drag Notice */}
                      <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5">
                          <span>✥</span>
                          <span>Interactive Live Placement: Drag the <strong>Authorized Signatory Block</strong> or <strong>Stamps</strong> to calibrate positioning.</span>
                        </span>
                        <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded font-bold">
                          X: {companySignaturePos.x}px, Y: {companySignaturePos.y}px
                        </span>
                      </div>

                      {/* Scaled Preview Document */}
                      <div className="w-full overflow-x-auto p-4 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-300 dark:border-zinc-800 flex justify-center shadow-inner">
                        <div className="w-full max-w-[794px]">
                          <OfficialInvoiceDocument
                            invoice={{
                              id: "DEMO-INV-001",
                              invoiceNumber: "INV-" + (companyForm.slug?.toUpperCase() || "DEMO") + "-2026-001",
                              invoice_number: "INV-" + (companyForm.slug?.toUpperCase() || "DEMO") + "-2026-001",
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
                            signaturePosition={companySignaturePos}
                            onSignaturePositionChange={setCompanySignaturePos}
                            customStamps={companyCustomStamps}
                            onCustomStampMove={(id, pos) => setCompanyCustomStamps(prev => prev.map(s => s.id === id ? { ...s, ...pos } : s))}
                            onRemoveCustomStamp={(id) => setCompanyCustomStamps(prev => prev.filter(s => s.id !== id))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border-t border-border shrink-0 bg-muted/20">
                <span className="text-muted-foreground text-[11px]">* All details automatically link into Quotations, Estimates, Letters &amp; Invoices</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowCompanyModal(false)}>Cancel</Button>
                  <Button onClick={saveCompany} disabled={saving || !companyForm.name.trim()} className="font-bold bg-blue-600 hover:bg-blue-700 text-white">
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    {editingCompany ? "Update Company Entity" : "Create Company Entity"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── UPGRADED 3-TAB BRANCH MODAL ────────────── */}
      <AnimatePresence>
        {showBranchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden text-xs">
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Building size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">{editingBranch ? `Edit Branch: ${editingBranch.name}` : "Add Operational Branch"}</h2>
                    <p className="text-[11px] text-muted-foreground">Configures branch location, manager, tax credentials, and live preview</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowBranchModal(false)}><X className="h-4 w-4" /></Button>
              </div>

              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="grid grid-cols-3 border-b border-border bg-muted/40 font-bold text-center shrink-0">
                  <button type="button" onClick={() => setBranchTab("basic")} className={`py-2.5 border-b-2 text-[11px] ${branchTab === "basic" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>1. Info &amp; Manager</button>
                  <button type="button" onClick={() => setBranchTab("tax")} className={`py-2.5 border-b-2 text-[11px] ${branchTab === "tax" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>2. Address &amp; Tax</button>
                  <button type="button" onClick={() => setBranchTab("preview")} className={`py-2.5 border-b-2 text-[11px] ${branchTab === "preview" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>3. Live Preview &amp; Drag</button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto flex-1 max-h-[65vh]">
                  {/* Inheritance Notice */}
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <Landmark size={14} className="shrink-0 text-blue-600" />
                    <span>Banking, UPI QR codes, Signatories, Stamps, and Notes are centralized and inherited from the parent Company.</span>
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
                          helperText="Displayed on Invoices and Letters issued from this Branch."
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
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                        <div><label className="block font-semibold mb-1">Branch GSTIN (Optional)</label><Input placeholder="19AAECS1234F1Z8" value={branchForm.gstin} onChange={e => setBranchForm({ ...branchForm, gstin: e.target.value.toUpperCase() })} className="font-mono font-bold uppercase" /></div>
                        <div><label className="block font-semibold mb-1">Branch PAN (Optional)</label><Input placeholder="AAECS1234F" value={branchForm.pan} onChange={e => setBranchForm({ ...branchForm, pan: e.target.value.toUpperCase() })} className="font-mono font-bold uppercase" /></div>
                      </div>
                    </div>
                  )}

                  {branchTab === "preview" && (
                    <div className="space-y-4">
                      {/* Top Controls Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/60 dark:bg-zinc-800/60 rounded-xl border border-border">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-muted-foreground">Scheme:</span>
                          <button
                            type="button"
                            onClick={() => setPreviewInvoiceType("gst")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              previewInvoiceType === "gst" ? "bg-teal-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            GST Tax Invoice (Teal)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewInvoiceType("nongst")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              previewInvoiceType === "nongst" ? "bg-sky-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Non-GST Commercial (Sky Blue)
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newStamp = {
                                id: "stamp-" + Date.now(),
                                text: "PAID IN FULL",
                                x: 10,
                                y: 20,
                                color: "#059669",
                                fontSize: 12
                              }
                              setCompanyCustomStamps(prev => [...prev, newStamp])
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-200 cursor-pointer"
                          >
                            + PAID Stamp
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newStamp = {
                                id: "stamp-" + Date.now(),
                                text: "OFFICIAL SEAL",
                                x: -10,
                                y: 15,
                                color: "#0d9488",
                                fontSize: 11
                              }
                              setCompanyCustomStamps(prev => [...prev, newStamp])
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 hover:bg-teal-200 cursor-pointer"
                          >
                            + SEAL Stamp
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBranchSignaturePos({ x: 0, y: 0 })
                              setCompanyCustomStamps([])
                            }}
                            className="px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg"
                          >
                            Reset Position
                          </button>
                        </div>
                      </div>

                      {/* Interactive Drag Notice */}
                      <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5">
                          <span>✥</span>
                          <span>Interactive Live Placement: Drag the <strong>Authorized Signatory Block</strong> or <strong>Stamps</strong> to calibrate positioning.</span>
                        </span>
                        <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded font-bold">
                          X: {branchSignaturePos.x}px, Y: {branchSignaturePos.y}px
                        </span>
                      </div>

                      {/* Scaled Preview Document */}
                      <div className="w-full overflow-x-auto p-4 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-300 dark:border-zinc-800 flex justify-center shadow-inner">
                        <div className="w-full max-w-[794px]">
                          {(() => {
                            const pComp = companies.find(c => c.id === branchCompanyId) || companies[0]
                            return (
                              <OfficialInvoiceDocument
                                invoice={{
                                  id: "DEMO-BR-INV-001",
                                  invoiceNumber: "INV-" + (branchForm.code || "BR") + "-2026-001",
                                  invoice_number: "INV-" + (branchForm.code || "BR") + "-2026-001",
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
                                  terms: pComp?.terms_conditions || "1. Payment is due within statutory terms.\n2. Goods & Services once delivered are subject to project sign-off.\n3. Disputed items must be notified within 7 days.",
                                  notes: pComp?.invoice_notes || "Thank you for your business."
                                } as any}
                                companyDetails={pComp}
                                activeBranch={{
                                  ...branchForm,
                                  id: editingBranch?.id || "branch-preview",
                                  company_id: branchCompanyId
                                } as any}
                                interactive={true}
                                signaturePosition={branchSignaturePos}
                                onSignaturePositionChange={setBranchSignaturePos}
                                customStamps={companyCustomStamps}
                                onCustomStampMove={(id, pos) => setCompanyCustomStamps(prev => prev.map(s => s.id === id ? { ...s, ...pos } : s))}
                                onRemoveCustomStamp={(id) => setCompanyCustomStamps(prev => prev.filter(s => s.id !== id))}
                              />
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-border shrink-0 bg-muted/20">
                <Button variant="outline" onClick={() => setShowBranchModal(false)}>Cancel</Button>
                <Button onClick={saveBranch} disabled={saving || !branchForm.name.trim()} className="font-bold bg-blue-600 hover:bg-blue-700 text-white">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  {editingBranch ? "Update Branch" : "Create Branch"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── UPGRADED 3-TAB SUB-BRANCH (% SHARE) MODAL ─── */}
      <AnimatePresence>
        {showSubBranchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden text-xs">
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">{editingSubBranch ? `Edit Sub-Branch: ${editingSubBranch.name}` : "Add Sub-Branch (Partner & Revenue Share Hub)"}</h2>
                    <p className="text-[11px] text-muted-foreground">Sets up partner percentage share, location attribution, and live document preview</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowSubBranchModal(false)}><X className="h-4 w-4" /></Button>
              </div>

              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="grid grid-cols-3 border-b border-border bg-muted/40 font-bold text-center shrink-0">
                  <button type="button" onClick={() => setSubBranchTab("partner")} className={`py-2.5 border-b-2 text-[11px] ${subBranchTab === "partner" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>1. Partner &amp; Share</button>
                  <button type="button" onClick={() => setSubBranchTab("location")} className={`py-2.5 border-b-2 text-[11px] ${subBranchTab === "location" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>2. Address &amp; Location</button>
                  <button type="button" onClick={() => setSubBranchTab("preview")} className={`py-2.5 border-b-2 text-[11px] ${subBranchTab === "preview" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>3. Live Preview &amp; Drag</button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto flex-1 max-h-[65vh]">
                  {/* Inheritance Notice */}
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                    <Landmark size={14} className="shrink-0 text-emerald-600" />
                    <span>Banking, UPI QR codes, Signatories, Stamps, and Terms are centralized and inherited from the parent Company.</span>
                  </div>

                  {subBranchTab === "partner" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div><label className="block font-semibold mb-1">Sub-Branch Name *</label><Input placeholder="e.g. Durgapur City Center Sub-Branch" value={subBranchForm.name} onChange={e => setSubBranchForm({ ...subBranchForm, name: e.target.value })} className="font-bold" /></div>
                        <div><label className="block font-semibold mb-1">Sub-Branch Code *</label><Input placeholder="e.g. SB-DUR-01" value={subBranchForm.code} onChange={e => setSubBranchForm({ ...subBranchForm, code: e.target.value })} className="font-mono font-bold" /></div>
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
                    </div>
                  )}

                  {subBranchTab === "preview" && (
                    <div className="space-y-4">
                      {/* Top Controls Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/60 dark:bg-zinc-800/60 rounded-xl border border-border">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-muted-foreground">Scheme:</span>
                          <button
                            type="button"
                            onClick={() => setPreviewInvoiceType("gst")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              previewInvoiceType === "gst" ? "bg-teal-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            GST Tax Invoice (Teal)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewInvoiceType("nongst")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              previewInvoiceType === "nongst" ? "bg-sky-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Non-GST Commercial (Sky Blue)
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newStamp = {
                                id: "stamp-" + Date.now(),
                                text: "PAID IN FULL",
                                x: 10,
                                y: 20,
                                color: "#059669",
                                fontSize: 12
                              }
                              setCompanyCustomStamps(prev => [...prev, newStamp])
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-200 cursor-pointer"
                          >
                            + PAID Stamp
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newStamp = {
                                id: "stamp-" + Date.now(),
                                text: "OFFICIAL SEAL",
                                x: -10,
                                y: 15,
                                color: "#0d9488",
                                fontSize: 11
                              }
                              setCompanyCustomStamps(prev => [...prev, newStamp])
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 hover:bg-teal-200 cursor-pointer"
                          >
                            + SEAL Stamp
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSubBranchSignaturePos({ x: 0, y: 0 })
                              setCompanyCustomStamps([])
                            }}
                            className="px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg"
                          >
                            Reset Position
                          </button>
                        </div>
                      </div>

                      {/* Interactive Drag Notice */}
                      <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5">
                          <span>✥</span>
                          <span>Interactive Live Placement: Drag the <strong>Authorized Signatory Block</strong> or <strong>Stamps</strong> to calibrate positioning.</span>
                        </span>
                        <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded font-bold">
                          X: {subBranchSignaturePos.x}px, Y: {subBranchSignaturePos.y}px
                        </span>
                      </div>

                      {/* Scaled Preview Document */}
                      <div className="w-full overflow-x-auto p-4 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-300 dark:border-zinc-800 flex justify-center shadow-inner">
                        <div className="w-full max-w-[794px]">
                          {(() => {
                            const pBranch = branches.find(b => b.id === subBranchBranchId)
                            const pComp = companies.find(c => c.id === subBranchCompanyId || c.id === pBranch?.company_id) || companies[0]
                            return (
                              <OfficialInvoiceDocument
                                invoice={{
                                  id: "DEMO-SB-INV-001",
                                  invoiceNumber: "INV-" + (subBranchForm.code || "SB") + "-2026-001",
                                  invoice_number: "INV-" + (subBranchForm.code || "SB") + "-2026-001",
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
                                  terms: pComp?.terms_conditions || "1. Payment is due within statutory terms.\n2. Goods & Services once delivered are subject to project sign-off.\n3. Disputed items must be notified within 7 days.",
                                  notes: pComp?.invoice_notes || "Thank you for your business."
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
                                signaturePosition={subBranchSignaturePos}
                                onSignaturePositionChange={setSubBranchSignaturePos}
                                customStamps={companyCustomStamps}
                                onCustomStampMove={(id, pos) => setCompanyCustomStamps(prev => prev.map(s => s.id === id ? { ...s, ...pos } : s))}
                                onRemoveCustomStamp={(id) => setCompanyCustomStamps(prev => prev.filter(s => s.id !== id))}
                              />
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-border shrink-0 bg-muted/20">
                <Button variant="outline" onClick={() => setShowSubBranchModal(false)}>Cancel</Button>
                <Button onClick={saveSubBranch} disabled={saving || !subBranchForm.name.trim()} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  {editingSubBranch ? "Update Sub-Branch" : "Save Sub-Branch"}
                </Button>
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
