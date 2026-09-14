"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, Plus, Search, Edit2, Trash2, MapPin, Users, X, Check, 
  ChevronDown, Globe, CreditCard, FileText, QrCode, Sparkles, Lock, 
  UploadCloud, CheckCircle2, Shield, Eye, Phone, Mail, Building,
  AlertCircle, ExternalLink, Image as ImageIcon, Briefcase, Info,
  Landmark, Stamp, FileCheck
} from "lucide-react"
import { useAuthStore, Branch, SubBranch, Company, isMatchingCompany } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { ImageUploadField } from "@/components/ui/ImageUploadField"
import { BranchApiService, SubBranchApiService } from "@/app/feature/companies/services/companyService"

type Tab = "branches" | "sub-branches"
type BranchModalTab = "basic" | "address" | "tax" | "bank" | "signatory"
type SubBranchModalTab = "basic" | "address" | "tax_bank" | "signatory"

export default function BranchesMain() {
  const { 
    user, 
    activeCompanyId, 
    companies, 
    branches, 
    subBranches, 
    addBranch, 
    updateBranch, 
    deleteBranch, 
    addSubBranch, 
    updateSubBranch, 
    deleteSubBranch, 
    fetchBranches, 
    fetchSubBranches,
    fetchCompanies
  } = useAuthStore()
  
  const { canPerformAction } = usePermissionStore()

  const canAdd = canPerformAction(user, "Settings", "add") || user?.role === "Super Admin"
  const canEdit = canPerformAction(user, "Settings", "edit") || user?.role === "Super Admin"
  const canDelete = canPerformAction(user, "Settings", "delete") || user?.role === "Super Admin"

  const [activeTab, setActiveTab] = React.useState<Tab>("branches")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCompanyFilter, setSelectedCompanyFilter] = React.useState<string>("all")

  // Modals
  const [isBranchModalOpen, setIsBranchModalOpen] = React.useState(false)
  const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null)
  const [branchTab, setBranchTab] = React.useState<BranchModalTab>("basic")

  const [isSubBranchModalOpen, setIsSubBranchModalOpen] = React.useState(false)
  const [editingSubBranch, setEditingSubBranch] = React.useState<SubBranch | null>(null)
  const [subBranchTab, setSubBranchTab] = React.useState<SubBranchModalTab>("basic")

  const [viewingItem, setViewingItem] = React.useState<Branch | SubBranch | null>(null)
  const [viewingType, setViewingType] = React.useState<"branch" | "sub-branch">("branch")
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ id: string; name: string; type: "branch" | "sub-branch" } | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  // ── BRANCH FORM STATE (All Enterprise & Invoicing Fields) ───────────
  const [branchCompanyId, setBranchCompanyId] = React.useState<string>("tech")
  const [branchForm, setBranchForm] = React.useState({
    name: "",
    code: "",
    brand_name: "SAAMPARK",
    division_name: "",
    subtitle: "",
    logo_url: "",
    managerName: "",
    managerPhone: "",
    managerEmail: "",
    status: "Active" as "Active" | "Inactive",
    
    // Address & Contacts
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
    phone: "",
    email: "",
    website: "",

    // Legal & Tax IDs
    gstin: "",
    pan: "",
    cin: "",
    msme_reg: "",

    // Bank & UPI Details
    bank_name: "",
    account_holder: "",
    account_number: "",
    ifsc_code: "",
    bank_branch: "",
    upi_id: "",
    payment_qr_url: "",

    // Signatory & Invoice Customization
    signatory_name: "Authorized Signatory",
    signatory_designation: "Branch Manager",
    signature_image_url: "",
    stamp_image_url: "",
    terms_conditions: "",
    invoice_notes: "",
  })

  // ── SUB-BRANCH FORM STATE ──────────────────────────────────────────
  const [subBranchCompanyId, setSubBranchCompanyId] = React.useState<string>("tech")
  const [subBranchParentBranchId, setSubBranchParentBranchId] = React.useState<string>("")
  const [subBranchForm, setSubBranchForm] = React.useState({
    name: "",
    code: "",
    brand_name: "",
    division_name: "",
    subtitle: "",
    logo_url: "",
    partnerName: "",
    partnerPhone: "",
    partnerEmail: "",
    partnerType: "Franchise Partner" as "Franchise Partner" | "Agency Partner" | "Satellite Office" | "Regional Associate",
    revenueSharePct: 30,
    status: "Active" as "Active" | "Inactive",

    // Address & Contact
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
    phone: "",
    email: "",

    // Tax & Bank
    gstin: "",
    pan: "",
    bank_name: "",
    account_holder: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
    payment_qr_url: "",

    // Signatory & Stamp
    signatory_name: "Partner Signatory",
    signatory_designation: "Franchise Partner",
    signature_image_url: "",
    stamp_image_url: "",
  })

  React.useEffect(() => {
    fetchCompanies().catch(() => {})
    fetchBranches().catch(() => {})
    fetchSubBranches().catch(() => {})
  }, [])

  // Filter branches
  const filteredBranches = React.useMemo(() => {
    return branches.filter(b => {
      const matchesSearch = 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.state || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.gstin || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.brand_name || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCompany = selectedCompanyFilter === "all" || isMatchingCompany({ id: b.companyId || (b as any).company_id, slug: b.companyId } as any, selectedCompanyFilter)
      return matchesSearch && matchesCompany
    })
  }, [branches, searchQuery, selectedCompanyFilter])

  // Filter sub-branches
  const filteredSubBranches = React.useMemo(() => {
    return subBranches.filter(sb => {
      const matchesSearch = 
        sb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sb.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sb.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sb.partnerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sb.partnerType || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCompany = selectedCompanyFilter === "all" || isMatchingCompany({ id: sb.companyId || (sb as any).company_id, slug: sb.companyId } as any, selectedCompanyFilter)
      return matchesSearch && matchesCompany
    })
  }, [subBranches, searchQuery, selectedCompanyFilter])

  // ── OPEN BRANCH MODALS ─────────────────────────────────────────────
  const openAddBranch = () => {
    setEditingBranch(null)
    setBranchCompanyId(activeCompanyId || (companies[0]?.id || "tech"))
    setBranchTab("basic")
    setBranchForm({
      name: "",
      code: `BR-${Math.floor(100 + Math.random() * 900)}`,
      brand_name: "SAAMPARK",
      division_name: "",
      subtitle: "",
      logo_url: "",
      managerName: user?.name || "",
      managerPhone: user?.phone || "",
      managerEmail: user?.email || "",
      status: "Active",
      
      address: "",
      city: "",
      state: "West Bengal",
      zip: "",
      country: "India",
      phone: "",
      email: "",
      website: "",

      gstin: "",
      pan: "",
      cin: "",
      msme_reg: "",

      bank_name: "",
      account_holder: "",
      account_number: "",
      ifsc_code: "",
      bank_branch: "",
      upi_id: "",
      payment_qr_url: "",

      signatory_name: user?.name || "Authorized Signatory",
      signatory_designation: "Branch Manager",
      signature_image_url: "",
      stamp_image_url: "",
      terms_conditions: "1. All disputes subject to local jurisdiction only.\n2. Goods/Services once billed are non-refundable.",
      invoice_notes: "Thank you for partnering with us.",
    })
    setIsBranchModalOpen(true)
  }

  const openEditBranch = (b: Branch) => {
    setEditingBranch(b)
    setBranchCompanyId(b.companyId || activeCompanyId || "tech")
    setBranchTab("basic")
    setBranchForm({
      name: b.name || "",
      code: b.code || "",
      brand_name: b.brand_name || "SAAMPARK",
      division_name: b.division_name || "",
      subtitle: b.subtitle || "",
      logo_url: b.logo_url || "",
      managerName: b.managerName || "",
      managerPhone: (b as any).managerPhone || "",
      managerEmail: (b as any).managerEmail || "",
      status: (b.status as any) || "Active",

      address: b.address || "",
      city: b.city || "",
      state: b.state || "",
      zip: (b as any).zip || "",
      country: b.country || "India",
      phone: b.phone || "",
      email: b.email || "",
      website: (b as any).website || "",

      gstin: (b as any).gstin || "",
      pan: (b as any).pan || "",
      cin: (b as any).cin || "",
      msme_reg: (b as any).msme_reg || "",

      bank_name: (b as any).bank_name || b.bankDetails?.bankName || "",
      account_holder: (b as any).account_holder || b.bankDetails?.accountHolder || "",
      account_number: (b as any).account_number || b.bankDetails?.accountNumber || "",
      ifsc_code: (b as any).ifsc_code || b.bankDetails?.ifscCode || "",
      bank_branch: (b as any).bank_branch || "",
      upi_id: (b as any).upi_id || b.bankDetails?.upiId || "",
      payment_qr_url: (b as any).payment_qr_url || "",

      signatory_name: (b as any).signatory_name || "Authorized Signatory",
      signatory_designation: (b as any).signatory_designation || "Branch Manager",
      signature_image_url: (b as any).signature_image_url || "",
      stamp_image_url: (b as any).stamp_image_url || "",
      terms_conditions: (b as any).terms_conditions || "",
      invoice_notes: (b as any).invoice_notes || "",
    })
    setIsBranchModalOpen(true)
  }

  // ── SAVE BRANCH ────────────────────────────────────────────────────
  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchForm.name.trim()) return

    setIsSaving(true)
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

    try {
      if (editingBranch) {
        await executeWithFeedback(async () => {
          await updateBranch(editingBranch.id, payload)
          await BranchApiService.update(String(editingBranch.id), payload).catch(() => {})
        }, {
          actionType: "update",
          successTitle: "Branch Updated",
          successMsg: `${branchForm.name} updated with all legal, tax, banking, and signatory details.`,
        })
      } else {
        await executeWithFeedback(async () => {
          await addBranch(payload)
          await BranchApiService.create(branchCompanyId, payload).catch(() => {})
        }, {
          actionType: "create",
          successTitle: "Branch Created",
          successMsg: `${branchForm.name} created successfully.`,
        })
      }
      setIsBranchModalOpen(false)
      await fetchBranches().catch(() => {})
    } catch (err) {
      console.error("Save branch error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // ── OPEN SUB-BRANCH MODALS ─────────────────────────────────────────
  const openAddSubBranch = () => {
    setEditingSubBranch(null)
    const defaultParent = branches[0]?.id || ""
    const parent = branches.find(b => b.id === defaultParent)
    setSubBranchCompanyId(parent?.companyId || activeCompanyId || "tech")
    setSubBranchParentBranchId(defaultParent)
    setSubBranchTab("basic")
    setSubBranchForm({
      name: "",
      code: `SB-${Math.floor(100 + Math.random() * 900)}`,
      brand_name: "SAAMPARK",
      division_name: "",
      subtitle: "",
      logo_url: "",
      partnerName: "",
      partnerPhone: "",
      partnerEmail: "",
      partnerType: "Franchise Partner",
      revenueSharePct: 30,
      status: "Active",

      address: parent?.address || "",
      city: parent?.city || "",
      state: parent?.state || "",
      zip: (parent as any)?.zip || "",
      country: parent?.country || "India",
      phone: "",
      email: "",

      gstin: "",
      pan: "",
      bank_name: "",
      account_holder: "",
      account_number: "",
      ifsc_code: "",
      upi_id: "",
      payment_qr_url: "",

      signatory_name: "Partner Signatory",
      signatory_designation: "Franchise Partner",
      signature_image_url: "",
      stamp_image_url: "",
    })
    setIsSubBranchModalOpen(true)
  }

  const openEditSubBranch = (sb: SubBranch) => {
    setEditingSubBranch(sb)
    setSubBranchCompanyId(sb.companyId || activeCompanyId || "tech")
    setSubBranchParentBranchId(sb.parentBranchId || "")
    setSubBranchTab("basic")
    setSubBranchForm({
      name: sb.name || "",
      code: sb.code || "",
      brand_name: sb.brand_name || "",
      division_name: sb.division_name || "",
      subtitle: sb.subtitle || "",
      logo_url: sb.logo_url || "",
      partnerName: sb.partnerName || "",
      partnerPhone: sb.partnerPhone || "",
      partnerEmail: sb.partnerEmail || "",
      partnerType: (sb.partnerType as any) || "Franchise Partner",
      revenueSharePct: sb.revenueSharePct ?? 30,
      status: (sb.status as any) || "Active",

      address: (sb as any).address || "",
      city: (sb as any).city || "",
      state: (sb as any).state || "",
      zip: (sb as any).zip || "",
      country: (sb as any).country || "India",
      phone: (sb as any).phone || "",
      email: (sb as any).email || "",

      gstin: (sb as any).gstin || "",
      pan: (sb as any).pan || "",
      bank_name: (sb as any).bank_name || "",
      account_holder: (sb as any).account_holder || "",
      account_number: (sb as any).account_number || "",
      ifsc_code: (sb as any).ifsc_code || "",
      upi_id: (sb as any).upi_id || "",
      payment_qr_url: (sb as any).payment_qr_url || "",

      signatory_name: (sb as any).signatory_name || "Partner Signatory",
      signatory_designation: (sb as any).signatory_designation || "Franchise Partner",
      signature_image_url: (sb as any).signature_image_url || "",
      stamp_image_url: (sb as any).stamp_image_url || "",
    })
    setIsSubBranchModalOpen(true)
  }

  // ── SAVE SUB-BRANCH ────────────────────────────────────────────────
  const handleSaveSubBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subBranchForm.name.trim()) return

    setIsSaving(true)
    const payload: any = {
      ...subBranchForm,
      name: subBranchForm.name.trim(),
      code: subBranchForm.code.trim().toUpperCase(),
      companyId: subBranchCompanyId,
      parentBranchId: subBranchParentBranchId,
    }

    try {
      if (editingSubBranch) {
        await executeWithFeedback(async () => {
          await updateSubBranch(editingSubBranch.id, payload)
          await SubBranchApiService.update(String(editingSubBranch.id), payload).catch(() => {})
        }, {
          actionType: "update",
          successTitle: "Sub-Branch Updated",
          successMsg: `${subBranchForm.name} updated successfully.`,
        })
      } else {
        await executeWithFeedback(async () => {
          await addSubBranch(payload)
          await SubBranchApiService.create(subBranchCompanyId, payload).catch(() => {})
        }, {
          actionType: "create",
          successTitle: "Sub-Branch Created",
          successMsg: `${subBranchForm.name} created successfully.`,
        })
      }
      setIsSubBranchModalOpen(false)
      await fetchSubBranches().catch(() => {})
    } catch (err) {
      console.error("Save sub-branch error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // ── DELETE CONFIRMATION ───────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return
    if (deleteConfirm.type === "branch") {
      await executeWithFeedback(async () => {
        await deleteBranch(deleteConfirm.id)
        await BranchApiService.delete(deleteConfirm.id).catch(() => {})
      }, {
        actionType: "delete",
        successTitle: "Branch Deleted",
        successMsg: `${deleteConfirm.name} deleted.`,
      })
    } else {
      await executeWithFeedback(async () => {
        await deleteSubBranch(deleteConfirm.id)
        await SubBranchApiService.delete(deleteConfirm.id).catch(() => {})
      }, {
        actionType: "delete",
        successTitle: "Sub-Branch Deleted",
        successMsg: `${deleteConfirm.name} deleted.`,
      })
    }
    setDeleteConfirm(null)
  }

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return "SAAMPARK Group"
    const found = companies.find(c => String(c.id).toLowerCase() === String(companyId).toLowerCase())
    return found?.brand_name || found?.name || (companyId === "print" ? "Print Space India" : companyId === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology")
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.2 }} 
      className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6"
    >
      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
              <Building2 size={22} />
            </div>
            <span>Branch &amp; Organisation Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Configure operational branches with full legal GSTIN/PAN, Bank &amp; UPI accounts, Signatories, and Sub-branch franchise networks
          </p>
        </div>

        {canAdd && (
          <button 
            onClick={activeTab === "branches" ? openAddBranch : openAddSubBranch} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-blue-500/20 active:scale-95"
          >
            <Plus size={15} />
            <span>Add {activeTab === "branches" ? "Branch" : "Sub-Branch"}</span>
          </button>
        )}
      </div>

      {/* ── TABS & COUNTERS ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setActiveTab("branches"); setSearchQuery("") }} 
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === "branches" 
                ? "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30" 
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Building2 size={15} />
            <span>Operational Branches</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {branches.length}
            </span>
          </button>
          <button 
            onClick={() => { setActiveTab("sub-branches"); setSearchQuery("") }} 
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === "sub-branches" 
                ? "border-emerald-600 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30" 
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <MapPin size={15} />
            <span>Sub-Branches &amp; Franchises</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {subBranches.length}
            </span>
          </button>
        </div>

        {/* Company Quick Filter */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="text-zinc-400 font-medium">Company:</span>
          <select 
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="all">All Companies ({companies.length})</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.brand_name || c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── SEARCH & FILTERS BAR ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === "branches" ? "branches by name, code, city, GSTIN..." : "sub-branches by name, partner..."}`} 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" 
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs text-zinc-500">
          <span>Showing {activeTab === "branches" ? filteredBranches.length : filteredSubBranches.length} records</span>
        </div>
      </div>

      {/* ── DATA TABLE ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Branch Identity</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Tax / GSTIN</th>
                <th className="py-3 px-4">{activeTab === "branches" ? "Manager" : "Partner / Share"}</th>
                <th className="py-3 px-4">Banking &amp; Stamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {(activeTab === "branches" ? filteredBranches : filteredSubBranches).length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">No records found matching your filter.</p>
                  </td>
                </tr>
              ) : (
                (activeTab === "branches" ? filteredBranches : filteredSubBranches).map((item) => {
                  const compName = getCompanyName((item as any).companyId || (item as any).company_id)
                  const hasGstin = !!(item as any).gstin
                  const hasBank = !!((item as any).bank_name || (item as Branch).bankDetails?.bankName)
                  const hasSignature = !!(item as any).signature_image_url
                  const hasStamp = !!(item as any).stamp_image_url
                  const logoUrl = (item as any).logo_url

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      {/* Identity & Logo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {logoUrl ? (
                            <img src={logoUrl} alt={item.name} className="w-8 h-8 rounded-lg object-contain bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {(item as any).division_name && (
                                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  {(item as any).division_name}
                                </span>
                              )}
                            </div>
                            {(item as any).subtitle && (
                              <p className="text-[10px] text-zinc-400 truncate max-w-[200px]">{(item as any).subtitle}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-800/50">
                          {item.code || "-"}
                        </span>
                      </td>

                      {/* Company */}
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          {compName}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <div className="text-[11px]">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{item.city || "-"}</span>
                          {item.state && <span className="text-zinc-400">, {item.state}</span>}
                        </div>
                        {(item as any).address && (
                          <p className="text-[10px] text-zinc-400 truncate max-w-[180px]">{(item as any).address}</p>
                        )}
                      </td>

                      {/* Tax GSTIN */}
                      <td className="py-3 px-4">
                        {hasGstin ? (
                          <div>
                            <span className="font-mono text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              {(item as any).gstin}
                            </span>
                            {(item as any).pan && (
                              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">PAN: {(item as any).pan}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic">Inherits HQ</span>
                        )}
                      </td>

                      {/* Manager / Partner */}
                      <td className="py-3 px-4">
                        {activeTab === "branches" ? (
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{(item as Branch).managerName || "-"}</p>
                            {(item as any).managerPhone && (
                              <p className="text-[10px] text-zinc-400">{(item as any).managerPhone}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{(item as SubBranch).partnerName || "-"}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{(item as SubBranch).revenueSharePct}% Share</span>
                              <span className="text-[10px] text-zinc-400">({(item as SubBranch).partnerType || "Franchise"})</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Banking & Stamp Badges */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`p-1 rounded text-[10px] ${hasBank ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800" : "bg-zinc-100 text-zinc-400"}`} title={hasBank ? `Bank: ${(item as any).bank_name || "Configured"}` : "No Bank Added"}>
                            <Landmark size={13} />
                          </span>
                          <span className={`p-1 rounded text-[10px] ${hasSignature ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800" : "bg-zinc-100 text-zinc-400"}`} title={hasSignature ? "Authorized Signature Available" : "No Signature"}>
                            <FileCheck size={13} />
                          </span>
                          <span className={`p-1 rounded text-[10px] ${hasStamp ? "bg-purple-50 text-purple-600 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800" : "bg-zinc-100 text-zinc-400"}`} title={hasStamp ? "Official Stamp Available" : "No Stamp"}>
                            <Stamp size={13} />
                          </span>
                          {(item as any).payment_qr_url && (
                            <span className="p-1 rounded text-[10px] bg-amber-50 text-amber-600 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800" title="UPI Payment QR Ready">
                              <QrCode size={13} />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          item.status === "Active" 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => { setViewingItem(item); setViewingType(activeTab === "branches" ? "branch" : "sub-branch") }}
                            className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                            title="View Full Profile"
                          >
                            <Eye size={14} />
                          </button>
                          {canEdit && (
                            <button 
                              onClick={() => activeTab === "branches" ? openEditBranch(item as Branch) : openEditSubBranch(item as SubBranch)} 
                              className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors" 
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button 
                              onClick={() => setDeleteConfirm({ id: item.id, name: item.name, type: activeTab === "branches" ? "branch" : "sub-branch" })} 
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors" 
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── UPGRADED 5-TAB BRANCH MODAL ─────────────────────────────── */}
      <AnimatePresence>
        {isBranchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-xs"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {editingBranch ? `Edit Branch: ${editingBranch.name}` : "Add Operational Branch"}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      All GSTIN, PAN, Bank &amp; Signatory details configured here apply to invoices generated for this branch
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsBranchModalOpen(false)} 
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 5 Tab Navigation Header */}
              <div className="grid grid-cols-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 font-semibold text-center shrink-0">
                <button 
                  type="button" 
                  onClick={() => setBranchTab("basic")} 
                  className={`py-3 px-2 border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                    branchTab === "basic" 
                      ? "border-blue-600 text-blue-600 bg-white dark:bg-zinc-900 font-bold" 
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <Building size={13} />
                  <span className="hidden sm:inline">1. Basic &amp; Brand</span>
                  <span className="sm:hidden">1. Info</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => setBranchTab("address")} 
                  className={`py-3 px-2 border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                    branchTab === "address" 
                      ? "border-blue-600 text-blue-600 bg-white dark:bg-zinc-900 font-bold" 
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <MapPin size={13} />
                  <span className="hidden sm:inline">2. Address &amp; Contact</span>
                  <span className="sm:hidden">2. Location</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => setBranchTab("tax")} 
                  className={`py-3 px-2 border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                    branchTab === "tax" 
                      ? "border-blue-600 text-blue-600 bg-white dark:bg-zinc-900 font-bold" 
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <Shield size={13} />
                  <span className="hidden sm:inline">3. Tax &amp; Legal</span>
                  <span className="sm:hidden">3. Tax</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => setBranchTab("bank")} 
                  className={`py-3 px-2 border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                    branchTab === "bank" 
                      ? "border-blue-600 text-blue-600 bg-white dark:bg-zinc-900 font-bold" 
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <Landmark size={13} />
                  <span className="hidden sm:inline">4. Bank &amp; UPI QR</span>
                  <span className="sm:hidden">4. Bank</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => setBranchTab("signatory")} 
                  className={`py-3 px-2 border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                    branchTab === "signatory" 
                      ? "border-blue-600 text-blue-600 bg-white dark:bg-zinc-900 font-bold" 
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <Stamp size={13} />
                  <span className="hidden sm:inline">5. Signatory &amp; Stamp</span>
                  <span className="sm:hidden">5. Stamp</span>
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveBranch} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[65vh]">
                  
                  {/* ── TAB 1: BASIC & BRAND ── */}
                  {branchTab === "basic" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Company *</label>
                          <select 
                            required 
                            value={branchCompanyId} 
                            onChange={(e) => setBranchCompanyId(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium"
                          >
                            {companies.map(c => (
                              <option key={c.id} value={c.id}>{c.brand_name || c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Branch Name *</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Kolkata Salt Lake Branch" 
                            value={branchForm.name} 
                            onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Branch Code *</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. BR-KOL-01" 
                            value={branchForm.code} 
                            onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Status</label>
                          <select 
                            value={branchForm.status} 
                            onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value as any })}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Brand Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. SAAMPARK" 
                            value={branchForm.brand_name} 
                            onChange={(e) => setBranchForm({ ...branchForm, brand_name: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Division Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Technology &amp; Software" 
                            value={branchForm.division_name} 
                            onChange={(e) => setBranchForm({ ...branchForm, division_name: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Subtitle / Operations Tagline</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Eastern Regional Operations &amp; R&amp;D Center" 
                            value={branchForm.subtitle} 
                            onChange={(e) => setBranchForm({ ...branchForm, subtitle: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Branch Manager Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Amit Sen" 
                            value={branchForm.managerName} 
                            onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Manager Phone</label>
                          <input 
                            type="text" 
                            placeholder="+91 98765 43210" 
                            value={branchForm.managerPhone} 
                            onChange={(e) => setBranchForm({ ...branchForm, managerPhone: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>
                      </div>

                      {/* Branch Logo Upload */}
                      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <ImageUploadField 
                          label="Branch Logo (Overrides Company Logo on Branch Invoices)"
                          value={branchForm.logo_url}
                          onChange={(url) => setBranchForm({ ...branchForm, logo_url: url })}
                          uploadNamePrefix="branch_logo"
                          helperText="Uploaded to ImgBB storage. Used on official invoices, quotations, and letters issued by this branch."
                        />
                      </div>
                    </div>
                  )}

                  {/* ── TAB 2: ADDRESS & CONTACT ── */}
                  {branchTab === "address" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Street Address</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Tower 3, 5th Floor, Salt Lake Sector V" 
                          value={branchForm.address} 
                          onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} 
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">City</label>
                          <input 
                            type="text" 
                            value={branchForm.city} 
                            onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">State</label>
                          <input 
                            type="text" 
                            value={branchForm.state} 
                            onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">ZIP / PIN</label>
                          <input 
                            type="text" 
                            value={branchForm.zip} 
                            onChange={(e) => setBranchForm({ ...branchForm, zip: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Country</label>
                          <input 
                            type="text" 
                            value={branchForm.country} 
                            onChange={(e) => setBranchForm({ ...branchForm, country: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Branch Official Phone</label>
                          <input 
                            type="text" 
                            placeholder="+91 33 2345 6789" 
                            value={branchForm.phone} 
                            onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Branch Official Email</label>
                          <input 
                            type="email" 
                            placeholder="kolkata@saampark.com" 
                            value={branchForm.email} 
                            onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Website URL</label>
                          <input 
                            type="text" 
                            placeholder="https://saampark.com" 
                            value={branchForm.website} 
                            onChange={(e) => setBranchForm({ ...branchForm, website: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB 3: TAX & LEGAL IDS ── */}
                  {branchTab === "tax" && (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl flex items-start gap-2.5 text-blue-800 dark:text-blue-300">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                          If this branch has a state-specific GST registration (GSTIN), provide it below. The tax engine automatically selects this GSTIN on invoices generated from this location.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Branch GSTIN (15 Digits)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 19AAECS1234F1Z5" 
                            value={branchForm.gstin} 
                            onChange={(e) => setBranchForm({ ...branchForm, gstin: e.target.value.toUpperCase() })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Branch PAN (10 Digits)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. AAECS1234F" 
                            value={branchForm.pan} 
                            onChange={(e) => setBranchForm({ ...branchForm, pan: e.target.value.toUpperCase() })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">CIN (Corporate Identification)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. U72200WB2020PTC123456" 
                            value={branchForm.cin} 
                            onChange={(e) => setBranchForm({ ...branchForm, cin: e.target.value.toUpperCase() })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">MSME Registration No.</label>
                          <input 
                            type="text" 
                            placeholder="e.g. UDYAM-WB-01-0012345" 
                            value={branchForm.msme_reg} 
                            onChange={(e) => setBranchForm({ ...branchForm, msme_reg: e.target.value.toUpperCase() })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB 4: BANK & UPI QR ── */}
                  {branchTab === "bank" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Bank Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. HDFC Bank Ltd" 
                            value={branchForm.bank_name} 
                            onChange={(e) => setBranchForm({ ...branchForm, bank_name: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Account Holder Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. SAAMPARK Technology Pvt Ltd" 
                            value={branchForm.account_holder} 
                            onChange={(e) => setBranchForm({ ...branchForm, account_holder: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Account Number</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 50200012345678" 
                            value={branchForm.account_number} 
                            onChange={(e) => setBranchForm({ ...branchForm, account_number: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">IFSC Code</label>
                          <input 
                            type="text" 
                            placeholder="e.g. HDFC0001234" 
                            value={branchForm.ifsc_code} 
                            onChange={(e) => setBranchForm({ ...branchForm, ifsc_code: e.target.value.toUpperCase() })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Bank Branch / Sol ID</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Sector V Salt Lake Branch" 
                            value={branchForm.bank_branch} 
                            onChange={(e) => setBranchForm({ ...branchForm, bank_branch: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">UPI ID / VPA</label>
                          <input 
                            type="text" 
                            placeholder="e.g. saampark@hdfcbank" 
                            value={branchForm.upi_id} 
                            onChange={(e) => setBranchForm({ ...branchForm, upi_id: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono" 
                          />
                        </div>
                      </div>

                      {/* Payment QR Code Upload */}
                      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <ImageUploadField 
                          label="Branch Payment QR Code / UPI Scanner"
                          value={branchForm.payment_qr_url}
                          onChange={(url) => setBranchForm({ ...branchForm, payment_qr_url: url })}
                          uploadNamePrefix="branch_upi_qr"
                          helperText="Uploaded to ImgBB. Displayed on invoices generated from this branch for instant client scanning and payments."
                        />
                      </div>
                    </div>
                  )}

                  {/* ── TAB 5: SIGNATORY & STAMP ── */}
                  {branchTab === "signatory" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Authorized Signatory Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Amit Sen" 
                            value={branchForm.signatory_name} 
                            onChange={(e) => setBranchForm({ ...branchForm, signatory_name: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Signatory Designation</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Branch Manager" 
                            value={branchForm.signatory_designation} 
                            onChange={(e) => setBranchForm({ ...branchForm, signatory_designation: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                          <ImageUploadField 
                            label="Branch Authorized Signature"
                            value={branchForm.signature_image_url}
                            onChange={(url) => setBranchForm({ ...branchForm, signature_image_url: url })}
                            uploadNamePrefix="branch_sig"
                            aspectRatio="signature"
                            helperText="Uploaded to ImgBB. Displayed on official branch invoices."
                          />
                        </div>

                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                          <ImageUploadField 
                            label="Branch Official Stamp / Seal"
                            value={branchForm.stamp_image_url}
                            onChange={(url) => setBranchForm({ ...branchForm, stamp_image_url: url })}
                            uploadNamePrefix="branch_stamp"
                            helperText="Uploaded to ImgBB. Round branch seal affixed to invoices and proposals."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Invoice Terms &amp; Conditions</label>
                        <textarea 
                          rows={3}
                          placeholder="Standard terms and conditions printed on invoices..."
                          value={branchForm.terms_conditions}
                          onChange={(e) => setBranchForm({ ...branchForm, terms_conditions: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Invoice Notes / Remarks</label>
                        <textarea 
                          rows={2}
                          placeholder="Default notes displayed at the bottom of invoice..."
                          value={branchForm.invoice_notes}
                          onChange={(e) => setBranchForm({ ...branchForm, invoice_notes: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 shrink-0">
                  <div className="text-zinc-400 text-[11px]">
                    Step {branchTab === "basic" ? "1" : branchTab === "address" ? "2" : branchTab === "tax" ? "3" : branchTab === "bank" ? "4" : "5"} of 5
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => setIsBranchModalOpen(false)} 
                      className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving || !branchForm.name.trim()}
                      className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      {isSaving ? "Saving..." : (editingBranch ? "Update Branch" : "Create Branch")}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── UPGRADED SUB-BRANCH / PARTNER MODAL ───────────────────────── */}
      <AnimatePresence>
        {isSubBranchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-xs"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {editingSubBranch ? `Edit Sub-Branch: ${editingSubBranch.name}` : "Add Sub-Branch / Franchise Partner"}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Satellite office with percentage-based revenue sharing and compliance
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsSubBranchModalOpen(false)} 
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tab navigation */}
              <div className="grid grid-cols-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 font-semibold text-center shrink-0">
                <button type="button" onClick={() => setSubBranchTab("basic")} className={`py-2.5 border-b-2 ${subBranchTab === "basic" ? "border-emerald-600 text-emerald-600 font-bold bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500"}`}>1. Partner Info</button>
                <button type="button" onClick={() => setSubBranchTab("address")} className={`py-2.5 border-b-2 ${subBranchTab === "address" ? "border-emerald-600 text-emerald-600 font-bold bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500"}`}>2. Location</button>
                <button type="button" onClick={() => setSubBranchTab("tax_bank")} className={`py-2.5 border-b-2 ${subBranchTab === "tax_bank" ? "border-emerald-600 text-emerald-600 font-bold bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500"}`}>3. Tax &amp; Bank</button>
                <button type="button" onClick={() => setSubBranchTab("signatory")} className={`py-2.5 border-b-2 ${subBranchTab === "signatory" ? "border-emerald-600 text-emerald-600 font-bold bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500"}`}>4. Signatory</button>
              </div>

              <form onSubmit={handleSaveSubBranch} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[65vh]">
                  {subBranchTab === "basic" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold mb-1">Company *</label>
                          <select 
                            required 
                            value={subBranchCompanyId} 
                            onChange={(e) => setSubBranchCompanyId(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                          >
                            {companies.map(c => (
                              <option key={c.id} value={c.id}>{c.brand_name || c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Parent Branch *</label>
                          <select 
                            required 
                            value={subBranchParentBranchId} 
                            onChange={(e) => setSubBranchParentBranchId(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                          >
                            <option value="">Select Branch</option>
                            {branches.map(b => (
                              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Sub-Branch Name *</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Salt Lake Satellite Hub" 
                            value={subBranchForm.name} 
                            onChange={(e) => setSubBranchForm({ ...subBranchForm, name: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Code</label>
                          <input 
                            type="text" 
                            value={subBranchForm.code} 
                            onChange={(e) => setSubBranchForm({ ...subBranchForm, code: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase" 
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Partner Type</label>
                          <select 
                            value={subBranchForm.partnerType} 
                            onChange={(e) => setSubBranchForm({ ...subBranchForm, partnerType: e.target.value as any })}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                          >
                            <option value="Franchise Partner">Franchise Partner</option>
                            <option value="Agency Partner">Agency Partner</option>
                            <option value="Satellite Office">Satellite Office</option>
                            <option value="Regional Associate">Regional Associate</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Revenue Share (%)</label>
                          <input 
                            type="number" 
                            min={0} 
                            max={100} 
                            value={subBranchForm.revenueSharePct} 
                            onChange={(e) => setSubBranchForm({ ...subBranchForm, revenueSharePct: Number(e.target.value) })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold" 
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Partner Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Ramesh Babu" 
                            value={subBranchForm.partnerName} 
                            onChange={(e) => setSubBranchForm({ ...subBranchForm, partnerName: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Partner Phone</label>
                          <input 
                            type="text" 
                            placeholder="+91 98765 43210" 
                            value={subBranchForm.partnerPhone} 
                            onChange={(e) => setSubBranchForm({ ...subBranchForm, partnerPhone: e.target.value })} 
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                          />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <ImageUploadField 
                          label="Sub-Branch / Partner Logo"
                          value={subBranchForm.logo_url}
                          onChange={(url) => setSubBranchForm({ ...subBranchForm, logo_url: url })}
                          uploadNamePrefix="sub_branch_logo"
                        />
                      </div>
                    </div>
                  )}

                  {subBranchTab === "address" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-semibold mb-1">Street Address</label>
                        <input 
                          type="text" 
                          value={subBranchForm.address} 
                          onChange={(e) => setSubBranchForm({ ...subBranchForm, address: e.target.value })} 
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">City</label>
                          <input type="text" value={subBranchForm.city} onChange={(e) => setSubBranchForm({ ...subBranchForm, city: e.target.value })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">State</label>
                          <input type="text" value={subBranchForm.state} onChange={(e) => setSubBranchForm({ ...subBranchForm, state: e.target.value })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Country</label>
                          <input type="text" value={subBranchForm.country} onChange={(e) => setSubBranchForm({ ...subBranchForm, country: e.target.value })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">Phone</label>
                          <input type="text" value={subBranchForm.phone} onChange={(e) => setSubBranchForm({ ...subBranchForm, phone: e.target.value })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Email</label>
                          <input type="email" value={subBranchForm.email} onChange={(e) => setSubBranchForm({ ...subBranchForm, email: e.target.value })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  )}

                  {subBranchTab === "tax_bank" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">GSTIN</label>
                          <input type="text" placeholder="GSTIN" value={subBranchForm.gstin} onChange={(e) => setSubBranchForm({ ...subBranchForm, gstin: e.target.value.toUpperCase() })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase" />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">PAN</label>
                          <input type="text" placeholder="PAN" value={subBranchForm.pan} onChange={(e) => setSubBranchForm({ ...subBranchForm, pan: e.target.value.toUpperCase() })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">Bank Name</label>
                          <input type="text" value={subBranchForm.bank_name} onChange={(e) => setSubBranchForm({ ...subBranchForm, bank_name: e.target.value })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Account Holder</label>
                          <input type="text" value={subBranchForm.account_holder} onChange={(e) => setSubBranchForm({ ...subBranchForm, account_holder: e.target.value })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Account Number</label>
                          <input type="text" value={subBranchForm.account_number} onChange={(e) => setSubBranchForm({ ...subBranchForm, account_number: e.target.value })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono" />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">IFSC Code</label>
                          <input type="text" value={subBranchForm.ifsc_code} onChange={(e) => setSubBranchForm({ ...subBranchForm, ifsc_code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase" />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <ImageUploadField 
                          label="Partner UPI Payment QR Code"
                          value={subBranchForm.payment_qr_url}
                          onChange={(url) => setSubBranchForm({ ...subBranchForm, payment_qr_url: url })}
                          uploadNamePrefix="sb_upi_qr"
                        />
                      </div>
                    </div>
                  )}

                  {subBranchTab === "signatory" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">Signatory Name</label>
                          <input type="text" value={subBranchForm.signatory_name} onChange={(e) => setSubBranchForm({ ...subBranchForm, signatory_name: e.target.value })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Designation</label>
                          <input type="text" value={subBranchForm.signatory_designation} onChange={(e) => setSubBranchForm({ ...subBranchForm, signatory_designation: e.target.value })} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                          <ImageUploadField 
                            label="Signature Image"
                            value={subBranchForm.signature_image_url}
                            onChange={(url) => setSubBranchForm({ ...subBranchForm, signature_image_url: url })}
                            aspectRatio="signature"
                            uploadNamePrefix="sb_sig"
                          />
                        </div>
                        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                          <ImageUploadField 
                            label="Stamp / Seal Image"
                            value={subBranchForm.stamp_image_url}
                            onChange={(url) => setSubBranchForm({ ...subBranchForm, stamp_image_url: url })}
                            uploadNamePrefix="sb_stamp"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 shrink-0">
                  <button type="button" onClick={() => setIsSubBranchModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 rounded-xl">Cancel</button>
                  <button type="submit" disabled={isSaving || !subBranchForm.name.trim()} className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md">
                    {isSaving ? "Saving..." : (editingSubBranch ? "Update Sub-Branch" : "Create Sub-Branch")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── VIEW DETAIL DRAWER / MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {viewingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden text-xs"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                  {(viewingItem as any).logo_url ? (
                    <img src={(viewingItem as any).logo_url} alt={viewingItem.name} className="w-10 h-10 rounded-xl object-contain border border-zinc-200 dark:border-zinc-700 p-0.5" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {viewingItem.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{viewingItem.name}</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">{viewingItem.code || "No Code"} • {getCompanyName((viewingItem as any).companyId)}</p>
                  </div>
                </div>
                <button onClick={() => setViewingItem(null)} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100"><X size={16} /></button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Status & Type Bar */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <span className="font-semibold text-zinc-500">Status</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${viewingItem.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-200 text-zinc-600"}`}>
                    {viewingItem.status}
                  </span>
                </div>

                {/* Location & Contact */}
                <div className="space-y-2">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"><MapPin size={13} className="text-blue-600" /> Location &amp; Address</h4>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div><span className="text-zinc-400">Street:</span> <span className="font-medium text-zinc-800 dark:text-zinc-200">{(viewingItem as any).address || "-"}</span></div>
                    <div><span className="text-zinc-400">City / State:</span> <span className="font-medium text-zinc-800 dark:text-zinc-200">{viewingItem.city || "-"}, {viewingItem.state || "-"}</span></div>
                    <div><span className="text-zinc-400">Phone:</span> <span className="font-medium text-zinc-800 dark:text-zinc-200">{viewingItem.phone || "-"}</span></div>
                    <div><span className="text-zinc-400">Email:</span> <span className="font-medium text-zinc-800 dark:text-zinc-200">{viewingItem.email || "-"}</span></div>
                  </div>
                </div>

                {/* Tax & Compliance */}
                <div className="space-y-2">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"><Shield size={13} className="text-amber-600" /> Tax &amp; Legal IDs</h4>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800 font-mono">
                    <div><span className="text-zinc-400 font-sans">GSTIN:</span> <span className="font-bold text-amber-600">{(viewingItem as any).gstin || "Inherits Company"}</span></div>
                    <div><span className="text-zinc-400 font-sans">PAN:</span> <span className="font-bold text-zinc-700 dark:text-zinc-300">{(viewingItem as any).pan || "-"}</span></div>
                  </div>
                </div>

                {/* Bank Account */}
                <div className="space-y-2">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"><Landmark size={13} className="text-emerald-600" /> Banking &amp; UPI</h4>
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                    <div className="flex justify-between"><span className="text-zinc-400">Bank:</span> <span className="font-medium">{(viewingItem as any).bank_name || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Account:</span> <span className="font-mono">{(viewingItem as any).account_number || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">IFSC:</span> <span className="font-mono uppercase">{(viewingItem as any).ifsc_code || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">UPI ID:</span> <span className="font-mono text-blue-600">{(viewingItem as any).upi_id || "-"}</span></div>
                  </div>
                </div>

                {/* Visual Assets (Signature, Stamp, QR) */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="text-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                    <p className="text-[10px] font-bold text-zinc-500 mb-2">Signature</p>
                    {(viewingItem as any).signature_image_url ? (
                      <img src={(viewingItem as any).signature_image_url} alt="Signature" className="h-12 mx-auto object-contain" />
                    ) : (
                      <span className="text-[10px] text-zinc-400 italic">None</span>
                    )}
                  </div>

                  <div className="text-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                    <p className="text-[10px] font-bold text-zinc-500 mb-2">Stamp / Seal</p>
                    {(viewingItem as any).stamp_image_url ? (
                      <img src={(viewingItem as any).stamp_image_url} alt="Stamp" className="h-12 mx-auto object-contain" />
                    ) : (
                      <span className="text-[10px] text-zinc-400 italic">None</span>
                    )}
                  </div>

                  <div className="text-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                    <p className="text-[10px] font-bold text-zinc-500 mb-2">Payment QR</p>
                    {(viewingItem as any).payment_qr_url ? (
                      <img src={(viewingItem as any).payment_qr_url} alt="UPI QR" className="h-12 mx-auto object-contain" />
                    ) : (
                      <span className="text-[10px] text-zinc-400 italic">None</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 shrink-0">
                <button onClick={() => setViewingItem(null)} className="px-4 py-1.5 text-xs font-bold text-zinc-600 bg-zinc-200 hover:bg-zinc-300 rounded-lg">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRMATION MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Delete {deleteConfirm.type === "branch" ? "Branch" : "Sub-Branch"}
              </h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs text-zinc-500 font-semibold hover:bg-zinc-100 rounded-lg">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
