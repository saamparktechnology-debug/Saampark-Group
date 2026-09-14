"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, Plus, Search, Edit2, Trash2, ChevronRight, ChevronDown, 
  MapPin, Phone, Mail, Globe, Users, Briefcase, DollarSign, Building, 
  Loader2, AlertCircle, Shield, CreditCard, Award, CheckCircle2, Image,
  X, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { CompanyApiService, BranchApiService, SubBranchApiService } from "./services/companyService"
import { Company, Branch, SubBranch } from "./types"
import { useAuthStore } from "@/store/useAuthStore"
import { markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB, syncGlobalDeletedIds, isGlobalItemDeleted, getLocalDeletedIds } from "@/lib/storageSync"
import { ImageUploadField } from "@/components/ui/ImageUploadField"

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
    id: "digital",
    name: "SAAMPARK DIGITAL MARKETING RESEARCH & CREATIVE MEDIA AGENCY",
    slug: "digital",
    brand_name: "SAAMPARK",
    division_name: "DIGITAL MARKETING",
    subtitle: "RESEARCH & CREATIVE MEDIA AGENCY",
    industry: "Media & Marketing",
    currency: "INR",
    currency_symbol: "₹",
    logo_url: "/saampark-logo.png",
    address: "Salt Lake Sector V, Bidhannagar, Kolkata, West Bengal - 700091",
    phone: "+91 9901518570",
    email: "digital@saampark.in",
    website: "www.saamparkdigital.com",
    status: "active",
    member_count: 3,
    signatory_name: "Authorized Signatory",
    signatory_designation: "Agency Head",
  },
  {
    id: "saampark-ai-solutions",
    name: "SAAMPARK AI SOLUTIONS",
    slug: "saampark-ai-solutions",
    brand_name: "SAAMPARK",
    division_name: "AI SOLUTIONS",
    subtitle: "INTELLIGENT SYSTEMS & AUTOMATION",
    industry: "Artificial Intelligence & Software",
    currency: "INR",
    currency_symbol: "₹",
    logo_url: "/saampark-logo.png",
    address: "Outer Ring Road, Bellandur, Bengaluru, Karnataka - 560103",
    phone: "+91 9901518572",
    email: "ai@saampark.com",
    website: "www.saamparkai.com",
    status: "active",
    member_count: 2,
    signatory_name: "Authorized Signatory",
    signatory_designation: "Head of AI",
  }
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
  {
    id: "br-2",
    company_id: "tech",
    name: "Branch - Delhi NCR",
    code: "STR-DEL",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    phone: "+91 9901518568",
    email: "delhi@saamparktechnology.com",
    manager_name: "Regional Director",
    status: "active",
    user_count: 4,
  },
  {
    id: "br-3",
    company_id: "digital",
    name: "Head Office - Kolkata Creative Hub",
    code: "SDM-HQ",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    phone: "+91 9901518570",
    email: "kolkata@saamparkdigital.com",
    manager_name: "Creative Lead",
    status: "active",
    user_count: 3,
  },
  {
    id: "br-5",
    company_id: "saampark-ai-solutions",
    name: "Head Office - Bengaluru Innovation Center",
    code: "SAI-HQ",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    phone: "+91 9901518572",
    email: "ai@saampark.com",
    manager_name: "AI Architect",
    status: "active",
    user_count: 2,
  }
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
  const [companyTab, setCompanyTab] = React.useState<"identity" | "tax" | "signatory" | "contact" | "bank">("identity")
  const [companyForm, setCompanyForm] = React.useState({
    name: "", brand_name: "", division_name: "", subtitle: "", slug: "", 
    industry: "Technology", currency: "INR", logo_url: "",
    gstin: "", pan: "", cin: "", msme_reg: "",
    signatory_name: "", signatory_designation: "", signature_image_url: "", stamp_image_url: "",
    address: "", city: "", state: "", zip: "", country: "India", phone: "", email: "", website: "",
    bank_name: "", account_holder: "", account_number: "", ifsc_code: "", bank_branch: "", upi_id: "", payment_qr_url: "",
    status: "active"
  })

  const [showBranchModal, setShowBranchModal] = React.useState(false)
  const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null)
  const [branchCompanyId, setBranchCompanyId] = React.useState("")
  const [branchTab, setBranchTab] = React.useState<"basic" | "tax" | "signatory" | "bank">("basic")
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
  const [subBranchTab, setSubBranchTab] = React.useState<"partner" | "location" | "bank">("partner")
  const [subBranchForm, setSubBranchForm] = React.useState({
    name: "", code: "", partner_name: "", partner_phone: "", partner_email: "",
    revenue_share_pct: 0, partner_type: "Individual",
    address: "", city: "", state: "", phone: "", email: "",
    gstin: "", pan: "", bank_name: "", account_number: "", ifsc_code: "", upi_id: "",
    logo_url: "", signature_image_url: "", stamp_image_url: "", payment_qr_url: "",
    signatory_name: "Partner Signatory", signatory_designation: "Franchise Partner",
    status: "active"
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{ type: "company" | "branch" | "sub_branch"; id: string } | null>(null)
  const [saving, setSaving] = React.useState(false)

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const deletedIds = await syncGlobalDeletedIds().catch(() => getLocalDeletedIds())
      const localDel = getLocalDeletedIds()
      const allDel = new Set([...deletedIds, ...localDel].map(d => String(d).toLowerCase().trim()))

      const isDeleted = (id?: string | number, slug?: string) => {
        if (id && (allDel.has(String(id).toLowerCase().trim()) || isGlobalItemDeleted(id))) return true
        if (slug && (allDel.has(String(slug).toLowerCase().trim()) || isGlobalItemDeleted(slug))) return true
        return false
      }

      const [compRes, branchRes, subBranchRes, dbComps, dbBranches, dbSubBranches] = await Promise.all([
        CompanyApiService.getAll().catch(() => []),
        BranchApiService.getAll().catch(() => []),
        SubBranchApiService.getAll().catch(() => []),
        fetchModuleDataFromDB<Company[]>("companies", [], "all").catch(() => []),
        fetchModuleDataFromDB<Branch[]>("branches", [], "all").catch(() => []),
        fetchModuleDataFromDB<SubBranch[]>("sub_branches", [], "all").catch(() => []),
      ])

      // 1. Merge Companies (excluding deleted ones)
      const compMap = new Map<string, Company>()
      CANONICAL_COMPANIES.forEach(c => {
        if (!isDeleted(c.id, c.slug)) {
          compMap.set(c.slug || c.id, c)
        }
      })
      if (Array.isArray(dbComps) && dbComps.length > 0) {
        dbComps.forEach(c => {
          if (!isDeleted(c.id, c.slug)) {
            const k = c.slug || c.id
            compMap.set(k, { ...compMap.get(k), ...c })
          }
        })
      }
      if (Array.isArray(compRes) && compRes.length > 0) {
        compRes.forEach(c => {
          if (!isDeleted(c.id, c.slug)) {
            const k = c.slug || String(c.id)
            compMap.set(k, { ...compMap.get(k), ...c })
          }
        })
      }
      const finalCompanies = Array.from(compMap.values())
      setCompanies(finalCompanies)

      // Active company IDs set for cascade branch checks
      const validCompanyIds = new Set(
        finalCompanies.flatMap(c => [String(c.id).toLowerCase().trim(), String(c.slug || '').toLowerCase().trim()].filter(Boolean))
      )

      // 2. Merge Branches (excluding deleted ones and branches of deleted companies)
      const branchMap = new Map<string, Branch>()
      CANONICAL_BRANCHES.forEach(b => {
        const bComp = String(b.company_id || (b as any).companyId || '').toLowerCase().trim()
        if (!isDeleted(b.id) && (!bComp || validCompanyIds.has(bComp))) {
          branchMap.set(b.id, b)
        }
      })
      if (Array.isArray(dbBranches) && dbBranches.length > 0) {
        dbBranches.forEach(b => {
          const bComp = String(b.company_id || (b as any).companyId || '').toLowerCase().trim()
          if (!isDeleted(b.id) && (!bComp || validCompanyIds.has(bComp))) {
            branchMap.set(b.id, { ...branchMap.get(b.id), ...b })
          }
        })
      }
      if (Array.isArray(branchRes) && branchRes.length > 0) {
        branchRes.forEach(b => {
          const bComp = String(b.company_id || (b as any).companyId || '').toLowerCase().trim()
          if (!isDeleted(b.id) && (!bComp || validCompanyIds.has(bComp))) {
            branchMap.set(b.id, { ...branchMap.get(b.id), ...b })
          }
        })
      }
      const finalBranches = Array.from(branchMap.values())
      setBranches(finalBranches)

      const validBranchIds = new Set(finalBranches.map(b => String(b.id).toLowerCase().trim()))

      // 3. Merge SubBranches (excluding deleted ones and sub-branches of deleted branches)
      const rawSubList = (Array.isArray(dbSubBranches) && dbSubBranches.length > 0)
        ? dbSubBranches
        : (Array.isArray(subBranchRes) ? subBranchRes : [])
      const subList = rawSubList.filter(sb => {
        const sbBranch = String(sb.branch_id || (sb as any).branchId || '').toLowerCase().trim()
        return !isDeleted(sb.id) && (!sbBranch || validBranchIds.has(sbBranch))
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
    const target = String(companyId || "").toLowerCase().trim()
    const comp = companies.find(c => String(c.id).toLowerCase().trim() === target || String(c.slug || "").toLowerCase().trim() === target)
    const compSlug = comp?.slug?.toLowerCase().trim()
    const compNum = (comp as any)?.numeric_id ? String((comp as any).numeric_id) : (target === "tech" ? "1" : target === "digital" ? "2" : target === "saampark-ai-solutions" ? "3" : "")

    return branches.filter(b => {
      const bCompId = String(b.company_id || (b as any).companyId || "").toLowerCase().trim()
      return bCompId === target || (compSlug && bCompId === compSlug) || (compNum && bCompId === compNum)
    })
  }
  const getSubBranchesForBranch = (branchId: string) => subBranches.filter(sb => String(sb.branch_id) === String(branchId))
  const getUserCountForCompany = (companyId: string) => getBranchesForCompany(companyId).reduce((sum, b) => sum + (b.user_count || 0), 0)

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
    setCompanyForm({
      name: "", brand_name: "SAAMPARK", division_name: "", subtitle: "", slug: "",
      industry: "Technology", currency: "INR", logo_url: "",
      gstin: "", pan: "", cin: "", msme_reg: "",
      signatory_name: "Authorized Signatory", signatory_designation: "Managing Director", signature_image_url: "", stamp_image_url: "",
      address: "", city: "Kolkata", state: "West Bengal", zip: "", country: "India", phone: "", email: "", website: "",
      bank_name: "", account_holder: "", account_number: "", ifsc_code: "", bank_branch: "", upi_id: "", payment_qr_url: "",
      status: "active"
    })
    setShowCompanyModal(true)
  }

  const openEditCompany = (c: any) => {
    setEditingCompany(c)
    setCompanyTab("identity")
    setCompanyForm({
      name: c.name || "", brand_name: c.brand_name || "", division_name: c.division_name || "", subtitle: c.subtitle || "", slug: c.slug || "",
      industry: c.industry || "Technology", currency: c.currency || "INR", logo_url: c.logo_url || "",
      gstin: c.gstin || "", pan: c.pan || "", cin: c.cin || "", msme_reg: c.msme_reg || "",
      signatory_name: c.signatory_name || "Authorized Signatory", signatory_designation: c.signatory_designation || "Managing Director", signature_image_url: c.signature_image_url || "", stamp_image_url: c.stamp_image_url || "",
      address: c.address || "", city: c.city || "", state: c.state || "", zip: c.zip || "", country: c.country || "India", phone: c.phone || "", email: c.email || "", website: c.website || "",
      bank_name: c.bank_name || "", account_holder: c.account_holder || "", account_number: c.account_number || "", ifsc_code: c.ifsc_code || "", bank_branch: c.bank_branch || "", upi_id: c.upi_id || "", payment_qr_url: c.payment_qr_url || "",
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
      name: "", code: `BR-${Math.floor(100 + Math.random() * 900)}`, brand_name: "SAAMPARK", division_name: "",
      logo_url: "", payment_qr_url: "",
      gstin: "", pan: "",
      signatory_name: "Authorized Signatory", signatory_designation: "Branch Manager", signature_image_url: "", stamp_image_url: "",
      address: "", city: "", state: "West Bengal", zip: "", country: "India", phone: "", email: "", managerName: "", managerPhone: "",
      bank_name: "", account_holder: "", account_number: "", ifsc_code: "", upi_id: "",
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
      const payload = {
        ...branchForm,
        name: branchForm.name.trim(),
        code: branchForm.code.trim().toUpperCase(),
      }
      if (editingBranch) {
        await BranchApiService.update(String(editingBranch.id), payload)
      } else {
        await BranchApiService.create(branchCompanyId, payload)
      }
      setShowBranchModal(false)
      setEditingBranch(null)
      setExpandedCompanies(prev => new Set([...prev, branchCompanyId]))
      await loadData()
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
      name: "", code: `SB-${Math.floor(100 + Math.random() * 900)}`, partner_name: "", partner_phone: "", partner_email: "",
      revenue_share_pct: 30, partner_type: "Franchise Partner",
      address: "", city: "", state: "West Bengal", phone: "", email: "",
      gstin: "", pan: "", bank_name: "", account_number: "", ifsc_code: "", upi_id: "",
      logo_url: "", signature_image_url: "", stamp_image_url: "", payment_qr_url: "",
      signatory_name: "Partner Signatory", signatory_designation: "Franchise Partner",
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
      const payload = {
        branch_id: subBranchBranchId,
        ...subBranchForm,
        name: subBranchForm.name.trim(),
        code: subBranchForm.code.trim().toUpperCase(),
        revenue_share_pct: Number(subBranchForm.revenue_share_pct),
      }
      if (editingSubBranch) {
        await SubBranchApiService.update(String(editingSubBranch.id), payload)
      } else {
        await SubBranchApiService.create(subBranchCompanyId, payload)
      }
      setShowSubBranchModal(false)
      setEditingSubBranch(null)
      setExpandedBranches(prev => new Set([...prev, subBranchBranchId]))
      await loadData()
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
        const comp = companies.find(c => c.id === deleteTarget.id || c.slug === deleteTarget.id)
        const targetId = comp?.id || deleteTarget.id
        const targetSlug = comp?.slug || deleteTarget.id
        const targetNumericId = (comp as any)?.numeric_id ? String((comp as any).numeric_id) : ""

        // Mark deleted in universal registry
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

        // Immediately update state
        const remainingComps = companies.filter(c => 
          c.id !== targetId && 
          c.slug !== targetSlug && 
          c.id !== deleteTarget.id &&
          String((c as any).numeric_id || "") !== String(targetId)
        )
        setCompanies(remainingComps)
        await saveModuleDataToDB("companies", remainingComps, "all").catch(() => {})
      } else if (deleteTarget.type === "branch") {
        await markGlobalItemDeleted(deleteTarget.id, "branches")
        await BranchApiService.delete(deleteTarget.id).catch(() => {})
        try {
          await useAuthStore.getState().deleteBranch(deleteTarget.id)
        } catch (e) {}
        const remainingBranches = branches.filter(b => b.id !== deleteTarget.id)
        setBranches(remainingBranches)
        await saveModuleDataToDB("branches", remainingBranches, "all").catch(() => {})
      } else {
        await markGlobalItemDeleted(deleteTarget.id, "sub_branches")
        await SubBranchApiService.delete(deleteTarget.id).catch(() => {})
        try {
          await useAuthStore.getState().deleteSubBranch(deleteTarget.id)
        } catch (e) {}
        const remainingSub = subBranches.filter(sb => sb.id !== deleteTarget.id)
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
          <Button onClick={openAddCompany} className="flex items-center gap-2 font-bold shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" />Add Company
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
                  <Button variant="ghost" size="sm" onClick={() => openAddBranch(company.id)} title="Add Branch"><Plus className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditCompany(company)} title="Edit Full Company Details"><Edit2 className="h-4 w-4" /></Button>
                  {isSuperAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => confirmDelete("company", company.id)} title="Delete Company" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
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

      {/* ── UPGRADED 5-TAB COMPANY MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {showCompanyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-xs">
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">🏢</div>
                  <h2 className="text-base font-bold text-foreground">{editingCompany ? `Edit Company: ${editingCompany.name}` : "Create New Company Entity"}</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCompanyModal(false)}><X className="h-4 w-4" /></Button>
              </div>

              {/* Modal Tabs */}
              <div className="grid grid-cols-5 border-b border-border bg-muted/40 font-bold text-center shrink-0">
                <button type="button" onClick={() => setCompanyTab("identity")} className={`py-2.5 border-b-2 transition-all ${companyTab === "identity" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>1. Identity & Logo</button>
                <button type="button" onClick={() => setCompanyTab("tax")} className={`py-2.5 border-b-2 transition-all ${companyTab === "tax" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>2. GST & Legal</button>
                <button type="button" onClick={() => setCompanyTab("signatory")} className={`py-2.5 border-b-2 transition-all ${companyTab === "signatory" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>3. Stamp & Sign</button>
                <button type="button" onClick={() => setCompanyTab("contact")} className={`py-2.5 border-b-2 transition-all ${companyTab === "contact" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>4. Address & Desk</button>
                <button type="button" onClick={() => setCompanyTab("bank")} className={`py-2.5 border-b-2 transition-all ${companyTab === "bank" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>5. Bank & UPI</button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* TAB 1: IDENTITY & LOGO */}
                {companyTab === "identity" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-1">Company Registered Name *</label>
                        <Input placeholder="e.g. SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Brand Name</label>
                        <Input placeholder="e.g. SAAMPARK" value={companyForm.brand_name} onChange={e => setCompanyForm({ ...companyForm, brand_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Division Name</label>
                        <Input placeholder="e.g. TECHNOLOGY & AI LABS" value={companyForm.division_name} onChange={e => setCompanyForm({ ...companyForm, division_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Subtitle / Tagline</label>
                        <Input placeholder="e.g. RESEARCH & INNOVATION" value={companyForm.subtitle} onChange={e => setCompanyForm({ ...companyForm, subtitle: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold mb-1">System Slug / ID</label>
                        <Input placeholder="e.g. tech" value={companyForm.slug} onChange={e => setCompanyForm({ ...companyForm, slug: e.target.value })} disabled={!!editingCompany} />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Industry</label>
                        <select value={companyForm.industry} onChange={e => setCompanyForm({ ...companyForm, industry: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-surface text-foreground text-xs">
                          {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Currency</label>
                        <select value={companyForm.currency} onChange={e => setCompanyForm({ ...companyForm, currency: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-surface text-foreground text-xs">
                          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                      <ImageUploadField
                        label="Sub-Branch Partner Logo"
                        value={subBranchForm.logo_url}
                        onChange={url => setSubBranchForm({ ...subBranchForm, logo_url: url })}
                        uploadNamePrefix="subbranch_logo"
                        helperText="Uploaded to ImgBB. Displayed on top-left of invoices issued by this Partner."
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                        <ImageUploadField
                          label="Partner Authorized Signature"
                          value={subBranchForm.signature_image_url}
                          onChange={url => setSubBranchForm({ ...subBranchForm, signature_image_url: url })}
                          uploadNamePrefix="subbranch_signature"
                          aspectRatio="signature"
                          helperText="Uploaded to ImgBB. Partner signature for invoices."
                        />
                      </div>
                      <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                        <ImageUploadField
                          label="Partner Official Stamp / Seal"
                          value={subBranchForm.stamp_image_url}
                          onChange={url => setSubBranchForm({ ...subBranchForm, stamp_image_url: url })}
                          uploadNamePrefix="subbranch_stamp"
                          helperText="Uploaded to ImgBB. Stamp/seal for this Sub-Branch."
                        />
                      </div>
                    </div>

                    {/* Company Logo Upload with ImgBB */}
                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                      <ImageUploadField
                        label="Company Logo / Brand Crest"
                        value={companyForm.logo_url}
                        onChange={url => setCompanyForm({ ...companyForm, logo_url: url })}
                        uploadNamePrefix="company_logo"
                        helperText="Uploaded directly to ImgBB permanent cloud. Displayed on top-left of Invoices, Quotations, and Official Letters."
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: LEGAL & TAX */}
                {companyTab === "tax" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-1">GSTIN (Goods and Services Tax Number)</label>
                        <Input placeholder="e.g. 19ABFCS1234D1ZS" value={companyForm.gstin} onChange={e => setCompanyForm({ ...companyForm, gstin: e.target.value.toUpperCase() })} className="font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">PAN (Permanent Account Number)</label>
                        <Input placeholder="e.g. ABFCS1234D" value={companyForm.pan} onChange={e => setCompanyForm({ ...companyForm, pan: e.target.value.toUpperCase() })} className="font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">CIN (Corporate Identity Number)</label>
                        <Input placeholder="e.g. U72900WB2024PTC271234" value={companyForm.cin} onChange={e => setCompanyForm({ ...companyForm, cin: e.target.value.toUpperCase() })} className="font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">MSME / Udyam Registration No.</label>
                        <Input placeholder="e.g. UDYAM-WB-10-0012345" value={companyForm.msme_reg} onChange={e => setCompanyForm({ ...companyForm, msme_reg: e.target.value })} className="font-mono" />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SIGNATORY & STAMP */}
                {companyTab === "signatory" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-1">Authorized Signatory Name</label>
                        <Input placeholder="e.g. Supriya Naskar" value={companyForm.signatory_name} onChange={e => setCompanyForm({ ...companyForm, signatory_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Signatory Designation</label>
                        <Input placeholder="e.g. Managing Director" value={companyForm.signatory_designation} onChange={e => setCompanyForm({ ...companyForm, signatory_designation: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                        <ImageUploadField
                          label="Authorized Digital Signature"
                          value={companyForm.signature_image_url}
                          onChange={url => setCompanyForm({ ...companyForm, signature_image_url: url })}
                          uploadNamePrefix="company_signature"
                          aspectRatio="signature"
                          helperText="Uploaded to ImgBB. Rendered on the Authorised Signatory line on Invoices."
                        />
                      </div>
                      <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                        <ImageUploadField
                          label="Official Company Seal / Stamp"
                          value={companyForm.stamp_image_url}
                          onChange={url => setCompanyForm({ ...companyForm, stamp_image_url: url })}
                          uploadNamePrefix="company_stamp"
                          helperText="Uploaded to ImgBB. Rendered next to the signature on Invoices."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: ADDRESS & CONTACTS */}
                {companyTab === "contact" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold mb-1">Registered Street Address</label>
                      <Input placeholder="Office address, premises, street..." value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div><label className="block font-semibold mb-1">City</label><Input value={companyForm.city} onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">State</label><Input value={companyForm.state} onChange={e => setCompanyForm({ ...companyForm, state: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">ZIP / PIN Code</label><Input value={companyForm.zip} onChange={e => setCompanyForm({ ...companyForm, zip: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Country</label><Input value={companyForm.country} onChange={e => setCompanyForm({ ...companyForm, country: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div><label className="block font-semibold mb-1">Official Phone</label><Input placeholder="+91 9901518567" value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Official Email</label><Input placeholder="info@saampark.com" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Official Website</label><Input placeholder="www.saampark.com" value={companyForm.website} onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })} /></div>
                    </div>
                  </div>
                )}

                {/* TAB 5: BANK & UPI */}
                {companyTab === "bank" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block font-semibold mb-1">Bank Name</label><Input placeholder="e.g. HDFC Bank Ltd" value={companyForm.bank_name} onChange={e => setCompanyForm({ ...companyForm, bank_name: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Account Holder Name</label><Input placeholder="e.g. SAAMPARK TECHNOLOGY PVT LTD" value={companyForm.account_holder} onChange={e => setCompanyForm({ ...companyForm, account_holder: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Account Number</label><Input placeholder="e.g. 50200012345678" value={companyForm.account_number} onChange={e => setCompanyForm({ ...companyForm, account_number: e.target.value })} className="font-mono" /></div>
                      <div><label className="block font-semibold mb-1">IFSC Code</label><Input placeholder="e.g. HDFC0001234" value={companyForm.ifsc_code} onChange={e => setCompanyForm({ ...companyForm, ifsc_code: e.target.value.toUpperCase() })} className="font-mono" /></div>
                      <div><label className="block font-semibold mb-1">Bank Branch</label><Input placeholder="e.g. Sector V Kolkata Branch" value={companyForm.bank_branch} onChange={e => setCompanyForm({ ...companyForm, bank_branch: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">UPI ID for Direct Transfers</label><Input placeholder="e.g. saampark@hdfcbank" value={companyForm.upi_id} onChange={e => setCompanyForm({ ...companyForm, upi_id: e.target.value })} className="font-mono" /></div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-muted/20 mt-3">
                      <ImageUploadField
                        label="UPI Scanner / Payment QR Code"
                        value={companyForm.payment_qr_url}
                        onChange={url => setCompanyForm({ ...companyForm, payment_qr_url: url })}
                        uploadNamePrefix="company_upi_qr"
                        helperText="Uploaded to ImgBB. Displayed in the UPI & Digital Payment section of Invoices for instant scan-to-pay."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 border-t border-border shrink-0 bg-muted/20">
                <span className="text-muted-foreground text-[11px]">* All details automatically link into Quotations, Estimates, Letters & Invoices</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowCompanyModal(false)}>Cancel</Button>
                  <Button onClick={saveCompany} disabled={saving || !companyForm.name.trim()} className="font-bold">
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    {editingCompany ? "Update Company Entity" : "Create Company Entity"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── UPGRADED 4-TAB BRANCH MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showBranchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <h2 className="text-base font-bold text-foreground">{editingBranch ? `Edit Branch: ${editingBranch.name}` : "Add Operational Branch"}</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowBranchModal(false)}><X className="h-4 w-4" /></Button>
              </div>

              <div className="grid grid-cols-4 border-b border-border bg-muted/40 font-bold text-center shrink-0">
                <button type="button" onClick={() => setBranchTab("basic")} className={`py-2.5 border-b-2 ${branchTab === "basic" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>1. Info & Manager</button>
                <button type="button" onClick={() => setBranchTab("tax")} className={`py-2.5 border-b-2 ${branchTab === "tax" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>2. Address & Contacts</button>
                <button type="button" onClick={() => setBranchTab("signatory")} className={`py-2.5 border-b-2 ${branchTab === "signatory" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>3. Tax & Stamp</button>
                <button type="button" onClick={() => setBranchTab("bank")} className={`py-2.5 border-b-2 ${branchTab === "bank" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>4. Bank & UPI</button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {branchTab === "basic" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block font-semibold mb-1">Branch Name *</label><Input placeholder="e.g. Kolkata Salt Lake Branch" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Branch Code *</label><Input placeholder="e.g. BR-KOL-01" value={branchForm.code} onChange={e => setBranchForm({ ...branchForm, code: e.target.value })} className="font-mono" /></div>
                      <div><label className="block font-semibold mb-1">Branch Manager Name</label><Input placeholder="e.g. Amit Sen" value={branchForm.managerName} onChange={e => setBranchForm({ ...branchForm, managerName: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Manager Phone</label><Input placeholder="+91 98765 43210" value={branchForm.managerPhone} onChange={e => setBranchForm({ ...branchForm, managerPhone: e.target.value })} /></div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border bg-muted/20 mt-3">
                      <ImageUploadField
                        label="Branch Logo (Overrides Company Logo on Branch Invoices)"
                        value={branchForm.logo_url}
                        onChange={url => setBranchForm({ ...branchForm, logo_url: url })}
                        uploadNamePrefix="branch_logo"
                        helperText="Uploaded directly to ImgBB. Displayed on Invoices and Letters issued from this Branch."
                      />
                    </div>
                  </div>
                )}

                {branchTab === "tax" && (
                  <div className="space-y-4">
                    <div><label className="block font-semibold mb-1">Branch Address</label><Input placeholder="Street address..." value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="block font-semibold mb-1">City</label><Input value={branchForm.city} onChange={e => setBranchForm({ ...branchForm, city: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">State</label><Input value={branchForm.state} onChange={e => setBranchForm({ ...branchForm, state: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Country</label><Input value={branchForm.country} onChange={e => setBranchForm({ ...branchForm, country: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block font-semibold mb-1">Phone</label><Input value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Email</label><Input value={branchForm.email} onChange={e => setBranchForm({ ...branchForm, email: e.target.value })} /></div>
                    </div>
                  </div>
                )}

                {branchTab === "signatory" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block font-semibold mb-1">Branch GSTIN</label><Input placeholder="GSTIN" value={branchForm.gstin} onChange={e => setBranchForm({ ...branchForm, gstin: e.target.value })} className="font-mono" /></div>
                      <div><label className="block font-semibold mb-1">Branch PAN</label><Input placeholder="PAN" value={branchForm.pan} onChange={e => setBranchForm({ ...branchForm, pan: e.target.value })} className="font-mono" /></div>
                      <div><label className="block font-semibold mb-1">Signatory Name</label><Input value={branchForm.signatory_name} onChange={e => setBranchForm({ ...branchForm, signatory_name: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Signatory Designation</label><Input value={branchForm.signatory_designation} onChange={e => setBranchForm({ ...branchForm, signatory_designation: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
                      <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                        <ImageUploadField
                          label="Branch Authorized Signature"
                          value={branchForm.signature_image_url}
                          onChange={url => setBranchForm({ ...branchForm, signature_image_url: url })}
                          uploadNamePrefix="branch_signature"
                          aspectRatio="signature"
                          helperText="Uploaded to ImgBB. Displayed on invoices issued from this Branch."
                        />
                      </div>
                      <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                        <ImageUploadField
                          label="Branch Official Stamp / Seal"
                          value={branchForm.stamp_image_url}
                          onChange={url => setBranchForm({ ...branchForm, stamp_image_url: url })}
                          uploadNamePrefix="branch_stamp"
                          helperText="Uploaded to ImgBB. Official Branch stamp."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {branchTab === "bank" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block font-semibold mb-1">Bank Name</label><Input value={branchForm.bank_name} onChange={e => setBranchForm({ ...branchForm, bank_name: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Account Holder</label><Input value={branchForm.account_holder} onChange={e => setBranchForm({ ...branchForm, account_holder: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Account Number</label><Input value={branchForm.account_number} onChange={e => setBranchForm({ ...branchForm, account_number: e.target.value })} className="font-mono" /></div>
                      <div><label className="block font-semibold mb-1">IFSC Code</label><Input value={branchForm.ifsc_code} onChange={e => setBranchForm({ ...branchForm, ifsc_code: e.target.value })} className="font-mono" /></div>
                      <div><label className="block font-semibold mb-1">UPI ID</label><Input value={branchForm.upi_id} onChange={e => setBranchForm({ ...branchForm, upi_id: e.target.value })} className="font-mono" /></div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border bg-muted/20 mt-3">
                      <ImageUploadField
                        label="Branch UPI Scanner / Payment QR Code"
                        value={branchForm.payment_qr_url}
                        onChange={url => setBranchForm({ ...branchForm, payment_qr_url: url })}
                        uploadNamePrefix="branch_upi_qr"
                        helperText="Uploaded to ImgBB. Scan-to-pay QR code displayed on invoices issued from this Branch."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-border shrink-0 bg-muted/20">
                <Button variant="outline" onClick={() => setShowBranchModal(false)}>Cancel</Button>
                <Button onClick={saveBranch} disabled={saving || !branchForm.name.trim()} className="font-bold">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  {editingBranch ? "Update Branch" : "Create Branch"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── UPGRADED 3-TAB SUB-BRANCH (% SHARE) MODAL ───────────────────────── */}
      <AnimatePresence>
        {showSubBranchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <h2 className="text-base font-bold text-foreground">{editingSubBranch ? `Edit Sub-Branch: ${editingSubBranch.name}` : "Add Sub-Branch (Partner & Revenue Share Hub)"}</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowSubBranchModal(false)}><X className="h-4 w-4" /></Button>
              </div>

              <div className="grid grid-cols-3 border-b border-border bg-muted/40 font-bold text-center shrink-0">
                <button type="button" onClick={() => setSubBranchTab("partner")} className={`py-2.5 border-b-2 ${subBranchTab === "partner" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>1. Partner & % Share</button>
                <button type="button" onClick={() => setSubBranchTab("location")} className={`py-2.5 border-b-2 ${subBranchTab === "location" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>2. Address & Contacts</button>
                <button type="button" onClick={() => setSubBranchTab("bank")} className={`py-2.5 border-b-2 ${subBranchTab === "bank" ? "border-primary text-primary bg-surface" : "border-transparent text-muted-foreground"}`}>3. Bank & Payouts</button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {subBranchTab === "partner" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block font-semibold mb-1">Sub-Branch Name *</label><Input placeholder="e.g. Durgapur City Center Sub-Branch" value={subBranchForm.name} onChange={e => setSubBranchForm({ ...subBranchForm, name: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Sub-Branch Code *</label><Input placeholder="e.g. SB-DUR-01" value={subBranchForm.code} onChange={e => setSubBranchForm({ ...subBranchForm, code: e.target.value })} className="font-mono" /></div>
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
                      <div><label className="block font-semibold mb-1">Phone</label><Input value={subBranchForm.phone} onChange={e => setSubBranchForm({ ...subBranchForm, phone: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Email</label><Input value={subBranchForm.email} onChange={e => setSubBranchForm({ ...subBranchForm, email: e.target.value })} /></div>
                    </div>
                  </div>
                )}

                {subBranchTab === "bank" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block font-semibold mb-1">Partner Bank Name</label><Input value={subBranchForm.bank_name} onChange={e => setSubBranchForm({ ...subBranchForm, bank_name: e.target.value })} /></div>
                      <div><label className="block font-semibold mb-1">Account Number</label><Input value={subBranchForm.account_number} onChange={e => setSubBranchForm({ ...subBranchForm, account_number: e.target.value })} className="font-mono" /></div>
                      <div><label className="block font-semibold mb-1">IFSC Code</label><Input value={subBranchForm.ifsc_code} onChange={e => setSubBranchForm({ ...subBranchForm, ifsc_code: e.target.value })} className="font-mono" /></div>
                      <div><label className="block font-semibold mb-1">UPI ID for Payouts</label><Input value={subBranchForm.upi_id} onChange={e => setSubBranchForm({ ...subBranchForm, upi_id: e.target.value })} className="font-mono" /></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-border shrink-0 bg-muted/20">
                <Button variant="outline" onClick={() => setShowSubBranchModal(false)}>Cancel</Button>
                <Button onClick={saveSubBranch} disabled={saving || !subBranchForm.name.trim()} className="font-bold">
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
