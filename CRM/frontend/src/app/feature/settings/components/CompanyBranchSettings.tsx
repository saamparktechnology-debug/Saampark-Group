"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, Plus, Pencil, Trash2, Shield, MapPin, Phone, Mail, 
  User, Check, X, AlertTriangle, Layers, ChevronDown, ChevronRight,
  Globe, CreditCard, FileText, QrCode, Sparkles, Lock, UploadCloud,
  Image as ImageIcon, CheckCircle2
} from "lucide-react"
import { useAuthStore, Company, Branch } from "@/store/useAuthStore"
import { getUsers } from "@/app/feature/users/services/userService"

export function CompanyBranchSettings() {
  const { 
    user, 
    companies, 
    branches, 
    fetchCompanies, 
    fetchBranches, 
    addCompany, 
    updateCompany,
    deleteCompany, 
    addBranch, 
    updateBranch, 
    deleteBranch 
  } = useAuthStore()

  const isSuperAdmin = user?.role === "Super Admin"
  const isAdmin = user?.role === "Admin"

  // Filter companies visible for this user
  const visibleCompanies = React.useMemo(() => {
    if (isSuperAdmin) return companies
    const adminCompanyIds = user?.companyIds || (user?.companyId ? [user.companyId] : ["tech"])
    return companies.filter((c) => adminCompanyIds.includes(c.id) || adminCompanyIds.includes(c.slug || ""))
  }, [isSuperAdmin, companies, user])

  const [expandedCompanyIds, setExpandedCompanyIds] = React.useState<string[]>([])
  const [allUsers, setAllUsers] = React.useState<any[]>([])

  // Modal States
  const [isCompanyModalOpen, setIsCompanyModalOpen] = React.useState(false)
  const [companyModalTab, setCompanyModalTab] = React.useState<"basic" | "tax" | "contact" | "bank" | "invoice">("basic")
  const [editingCompany, setEditingCompany] = React.useState<Company | null>(null)

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

  // Banking & UPI
  const [companyUpiId, setCompanyUpiId] = React.useState("")
  const [companyAccountHolder, setCompanyAccountHolder] = React.useState("")
  const [companyBankName, setCompanyBankName] = React.useState("")
  const [companyAccountNumber, setCompanyAccountNumber] = React.useState("")
  const [companyIfscCode, setCompanyIfscCode] = React.useState("")
  const [companyBankBranch, setCompanyBankBranch] = React.useState("")
  const [companyPaymentQrUrl, setCompanyPaymentQrUrl] = React.useState("")

  // Terms & Signatory
  const [companyTermsConditions, setCompanyTermsConditions] = React.useState("")
  const [companySignatoryName, setCompanySignatoryName] = React.useState("")
  const [companySignatoryDesignation, setCompanySignatoryDesignation] = React.useState("")
  const [companySignatureImageUrl, setCompanySignatureImageUrl] = React.useState("")

  // Branch Modal States
  const [isBranchModalOpen, setIsBranchModalOpen] = React.useState(false)
  const [targetCompanyIdForBranch, setTargetCompanyIdForBranch] = React.useState<string>("tech")
  const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null)
  const [branchName, setBranchName] = React.useState("")
  const [branchCode, setBranchCode] = React.useState("")
  const [branchCity, setBranchCity] = React.useState("")
  const [branchAddress, setBranchAddress] = React.useState("")
  const [branchPhone, setBranchPhone] = React.useState("")
  const [branchEmail, setBranchEmail] = React.useState("")
  const [branchManager, setBranchManager] = React.useState("")
  const [branchStatus, setBranchStatus] = React.useState<"Active" | "Inactive">("Active")

  // Refs for file uploads
  const logoFileInputRef = React.useRef<HTMLInputElement>(null)
  const signatureFileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetchCompanies()
    fetchBranches()
    getUsers("all").then((list) => setAllUsers(list || []))
  }, [fetchCompanies, fetchBranches])

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

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("Logo image size should not exceed 5MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCompanyLogoUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle Signature Upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("Signature image size should not exceed 5MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCompanySignatureImageUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
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
    setCompanyTermsConditions("1. E.& O.E.\n2. Total payment due within due date to avoid suspension/cancellation.\n3. Please include invoice number in payment notes.\n4. All disputes subject to jurisdiction.")
    setCompanySignatoryName("Authorized Signatory")
    setCompanySignatoryDesignation("Managing Director")
    setCompanySignatureImageUrl("")
    setIsCompanyModalOpen(true)
  }

  const handleOpenEditCompany = (company: Company) => {
    if (!isSuperAdmin) return
    setEditingCompany(company)
    setCompanyModalTab("basic")

    const brand = company.brand_name || company.name || "SAAMPARK"
    const division = company.division_name !== undefined ? company.division_name : ""
    
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
    setCompanyTermsConditions(company.terms_conditions || "")
    setCompanySignatoryName(company.signatory_name || "Authorized Signatory")
    setCompanySignatoryDesignation(company.signatory_designation || "")
    setCompanySignatureImageUrl(company.signature_image_url || "")
    setIsCompanyModalOpen(true)
  }

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSuperAdmin) {
      alert("Only Super Admin can modify or create company records.")
      return
    }

    const finalName = companyName.trim() || [companyBrandName.trim(), companyDivisionName.trim()].filter(Boolean).join(" ")
    if (!finalName) return

    const slug = companySlug.trim() || finalName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const payload: Partial<Company> = {
      name: finalName,
      brand_name: companyBrandName.trim() || "SAAMPARK",
      division_name: companyDivisionName.trim(),
      subtitle: companySubtitle.trim(),
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
      upi_id: companyUpiId.trim(),
      account_holder: companyAccountHolder.trim(),
      bank_name: companyBankName.trim(),
      account_number: companyAccountNumber.trim(),
      ifsc_code: companyIfscCode.trim(),
      bank_branch: companyBankBranch.trim(),
      payment_qr_url: companyPaymentQrUrl.trim(),
      terms_conditions: companyTermsConditions.trim(),
      signatory_name: companySignatoryName.trim(),
      signatory_designation: companySignatoryDesignation.trim(),
      signature_image_url: companySignatureImageUrl.trim(),
    }

    if (editingCompany) {
      await updateCompany(editingCompany.id, payload)
    } else {
      await addCompany(payload)
    }

    await fetchCompanies().catch(() => {})
    setIsCompanyModalOpen(false)
  }

  const handleDeleteCompany = async (compId: string, compName: string) => {
    if (!isSuperAdmin) {
      alert("Only Super Admin can delete companies.")
      return
    }
    if (!confirm(`Are you sure you want to permanently delete company "${compName}" and all its branches?`)) {
      return
    }
    try {
      await deleteCompany(compId)
      await fetchCompanies().catch(() => {})
    } catch (err: any) {
      alert(err?.message || "Failed to delete company.")
    }
  }

  // ── BRANCH HANDLERS (Admin & Super Admin) ────────────────────────────────────
  const handleOpenCreateBranch = (compId: string) => {
    setTargetCompanyIdForBranch(compId)
    setEditingBranch(null)
    setBranchName("")
    setBranchCode("")
    setBranchCity("")
    setBranchAddress("")
    setBranchPhone("")
    setBranchEmail("")
    setBranchManager("")
    setBranchStatus("Active")
    setIsBranchModalOpen(true)
  }

  const handleOpenEditBranch = (branch: Branch) => {
    setTargetCompanyIdForBranch(branch.companyId)
    setEditingBranch(branch)
    setBranchName(branch.name)
    setBranchCode(branch.code || "")
    setBranchCity(branch.city || "")
    setBranchAddress(branch.address || "")
    setBranchPhone(branch.phone || "")
    setBranchEmail(branch.email || "")
    setBranchManager(branch.managerName || "")
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

    if (editingBranch) {
      await updateBranch(editingBranch.id, {
        companyId: finalCompanyId,
        name: branchName.trim(),
        code: branchCode.trim(),
        city: branchCity.trim(),
        address: branchAddress.trim(),
        phone: branchPhone.trim(),
        email: branchEmail.trim(),
        managerName: branchManager.trim(),
        status: branchStatus,
      })
    } else {
      await addBranch({
        companyId: finalCompanyId,
        name: branchName.trim(),
        code: branchCode.trim(),
        city: branchCity.trim(),
        address: branchAddress.trim(),
        phone: branchPhone.trim(),
        email: branchEmail.trim(),
        managerName: branchManager.trim(),
        status: branchStatus,
      })
    }

    await fetchBranches().catch(() => {})
    setIsBranchModalOpen(false)
  }

  const handleDeleteBranch = async (branchId: string, bName: string) => {
    if (!confirm(`Are you sure you want to delete branch "${bName}"?`)) {
      return
    }
    await deleteBranch(branchId)
    await fetchBranches().catch(() => {})
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

        {/* Super Admin Top-Level Create Company Button */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={handleOpenCreateCompany}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Create New Company</span>
          </button>
        )}
      </div>

      {/* Companies & Branches Accordion List */}
      <div className="space-y-4">
        {visibleCompanies.map((company) => {
          const compBranches = branches.filter((b) => 
            (b.companyId && b.companyId.toLowerCase() === company.id.toLowerCase()) || 
            (company.slug && b.companyId && b.companyId.toLowerCase() === company.slug.toLowerCase())
          )
          const compUsers = allUsers.filter((u) => {
            const cIds = u.companyIds || (u.companyId ? [u.companyId] : [])
            return cIds.some((id: string) => 
              id.toLowerCase() === company.id.toLowerCase() || 
              (company.slug && id.toLowerCase() === company.slug.toLowerCase())
            )
          })
          const isExpanded = expandedCompanyIds.includes(company.id)
          const brandPart = company.brand_name || (company.name ? company.name.split(" ")[0] : "SAAMPARK")
          const divisionPart = company.division_name || (company.name ? company.name.split(" ").slice(1).join(" ") : "")

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
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-9 h-9 object-contain" />
                    ) : (
                      company.logo || "🏢"
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-foreground">
                        <span className="text-primary font-black">{brandPart}</span>
                        {divisionPart && <span className="ml-1.5 font-extrabold">{divisionPart}</span>}
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

                  {isSuperAdmin && companies.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCompany(company.id, company.name)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title="Delete Company"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
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
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0 overflow-hidden">
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
                        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl overflow-hidden shrink-0">
                          {companyLogoUrl ? (
                            <img src={companyLogoUrl} alt="Logo" className="w-9 h-9 object-contain" />
                          ) : (
                            companyLogo || "🏢"
                          )}
                        </div>
                        <div>
                          <div className="text-base font-black tracking-tight leading-none text-foreground flex items-center gap-1.5 flex-wrap">
                            <span className="text-primary uppercase">{companyBrandName || "SAAMPARK"}</span>
                            {companyDivisionName?.trim() && (
                              <span className="text-foreground uppercase">{companyDivisionName.trim()}</span>
                            )}
                          </div>
                          {companySubtitle?.trim() && (
                            <div className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase mt-1">
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
                          placeholder="e.g. SAAMPARK"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs focus:outline-hidden focus:border-primary font-bold text-foreground uppercase"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">Primary brand prefix (e.g. SAAMPARK)</p>
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
                          placeholder="e.g. AND RESEARCH PRIVATE LIMITED or CONSULTING SERVICES (Leave blank if none)"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden focus:border-primary uppercase"
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
                    {/* Live Signature Preview Card */}
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                      <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                        Official Authorized Signature Preview:
                      </span>
                      <div className="flex items-center justify-between border-t border-amber-500/20 pt-3">
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
                                No Signature Uploaded (Blank)
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

                        <div className="text-[11px] text-muted-foreground max-w-[280px]">
                          <p>Upload a clean transparent PNG or JPG of the company stamp / director signature. It will be printed directly above the Authorised Signatory line on all generated invoices.</p>
                        </div>
                      </div>
                    </div>

                    {/* Signature File Upload Form */}
                    <div className="p-3.5 rounded-2xl bg-surface-hover/50 border border-border space-y-3">
                      <div>
                        <label className="block font-bold text-foreground mb-1">
                          Upload Company Stamp / Signature Image
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
                            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-600/20"
                          >
                            <UploadCloud size={14} />
                            <span>Upload Signature File</span>
                          </button>
                          {companySignatureImageUrl && (
                            <button
                              type="button"
                              onClick={() => setCompanySignatureImageUrl("")}
                              className="px-3 py-2 rounded-xl border border-border text-rose-600 hover:bg-rose-50 font-semibold text-xs cursor-pointer"
                            >
                              Remove Signature
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-foreground mb-1">
                          Or Direct Image URL
                        </label>
                        <input
                          type="text"
                          value={companySignatureImageUrl}
                          onChange={(e) => setCompanySignatureImageUrl(e.target.value)}
                          placeholder="https://... (Direct image link to signature)"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-foreground mb-1">Authorized Signatory Name / Title</label>
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
                          placeholder="e.g. Managing Director / Partner"
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

                {/* TAB 5: BANKING & DIGITAL UPI PAY */}
                {companyModalTab === "bank" && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-muted-foreground">
                      Bank and UPI details printed on invoices for client payments. If bank details are left blank, the Bank Box is omitted.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-foreground mb-1">UPI ID (e.g. GPay, PhonePe, Paytm)</label>
                        <input
                          type="text"
                          value={companyUpiId}
                          onChange={(e) => setCompanyUpiId(e.target.value)}
                          placeholder="e.g. saampark@sbi (Leave blank if none)"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">Bank Account Holder Name</label>
                        <input
                          type="text"
                          value={companyAccountHolder}
                          onChange={(e) => setCompanyAccountHolder(e.target.value)}
                          placeholder="e.g. Saampark Technology & Research Pvt. Ltd."
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={companyBankName}
                          onChange={(e) => setCompanyBankName(e.target.value)}
                          placeholder="e.g. State Bank of India"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">Account Number</label>
                        <input
                          type="text"
                          value={companyAccountNumber}
                          onChange={(e) => setCompanyAccountNumber(e.target.value)}
                          placeholder="e.g. 40912384759"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">IFSC Code</label>
                        <input
                          type="text"
                          value={companyIfscCode}
                          onChange={(e) => setCompanyIfscCode(e.target.value)}
                          placeholder="e.g. SBIN0001234"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono uppercase focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-foreground mb-1">Branch Name</label>
                        <input
                          type="text"
                          value={companyBankBranch}
                          onChange={(e) => setCompanyBankBranch(e.target.value)}
                          placeholder="e.g. Balichak Station Road"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-foreground mb-1">Custom Payment QR Image Link</label>
                        <input
                          type="text"
                          value={companyPaymentQrUrl}
                          onChange={(e) => setCompanyPaymentQrUrl(e.target.value)}
                          placeholder="https://... (Direct image URL of UPI QR Code to show on invoice)"
                          className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-border/60 shrink-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Sparkles size={13} className="text-teal-500" />
                    <span>Branding and signature changes reflect dynamically on all invoices.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCompanyModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 cursor-pointer"
                    >
                      {editingCompany ? "Save Entity & Signature" : "Create Company Entity"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CREATE / EDIT BRANCH MODAL (Admin & Super Admin) ───────────────── */}
      <AnimatePresence>
        {isBranchModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-surface p-6 rounded-3xl border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 shadow-2xs">
                    <MapPin size={16} />
                  </div>
                  <h3 className="font-bold text-base text-foreground">
                    {editingBranch ? "Edit Branch" : "Create New Branch"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveBranch} className="space-y-3.5 text-xs">
                {/* Company Selection Field */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    {isSuperAdmin ? "Target Company *" : "Assigned Company"}
                  </label>
                  {isSuperAdmin ? (
                    <select
                      value={targetCompanyIdForBranch}
                      onChange={(e) => setTargetCompanyIdForBranch(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden focus:border-primary font-semibold text-foreground"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.logo || "🏢"} {c.name} ({c.slug || c.id})
                        </option>
                      ))}
                    </select>
                  ) : visibleCompanies.length > 1 ? (
                    <select
                      value={targetCompanyIdForBranch}
                      onChange={(e) => setTargetCompanyIdForBranch(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden focus:border-primary font-semibold text-foreground"
                    >
                      {visibleCompanies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.logo || "🏢"} {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-surface-pressed/30 border border-border text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{visibleCompanies[0]?.logo || "🏢"}</span>
                        <span>{visibleCompanies[0]?.name || "Assigned Company"}</span>
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                        Assigned
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {isSuperAdmin
                      ? "Super Admin can create a branch under any registered company."
                      : "Branches created by this Admin are automatically scoped under your assigned company."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-foreground mb-1">Branch Name *</label>
                    <input
                      type="text"
                      required
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Kolkata South Branch"
                      className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-foreground mb-1">Branch Code</label>
                    <input
                      type="text"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      placeholder="e.g. BR-101"
                      className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">City / Region</label>
                    <input
                      type="text"
                      value={branchCity}
                      onChange={(e) => setBranchCity(e.target.value)}
                      placeholder="e.g. Kolkata"
                      className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                    />
                  </div>
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
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={branchAddress}
                    onChange={(e) => setBranchAddress(e.target.value)}
                    placeholder="e.g. Plot 12, Salt Lake Sector V, Kolkata"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={branchPhone}
                      onChange={(e) => setBranchPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Status</label>
                    <select
                      value={branchStatus}
                      onChange={(e) => setBranchStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => setIsBranchModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 cursor-pointer"
                  >
                    {editingBranch ? "Update Branch" : "Create Branch"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
