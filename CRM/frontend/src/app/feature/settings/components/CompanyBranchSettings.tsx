"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, Plus, Pencil, Trash2, Shield, MapPin, Phone, Mail, 
  User, Check, X, AlertTriangle, Layers, ChevronDown, ChevronRight 
} from "lucide-react"
import { useAuthStore, Company, Branch } from "@/store/useAuthStore"
import { getUsers } from "@/app/feature/users/services/userService"

export function CompanyBranchSettings() {
  const { 
    user, 
    companies, 
    branches, 
    activeCompanyId, 
    fetchCompanies, 
    fetchBranches, 
    addCompany, 
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
  const [editingCompany, setEditingCompany] = React.useState<Company | null>(null)
  const [companyName, setCompanyName] = React.useState("")
  const [companySlug, setCompanySlug] = React.useState("")
  const [companyLogo, setCompanyLogo] = React.useState("🏢")
  const [companyCurrency, setCompanyCurrency] = React.useState("INR")
  const [companyCurrencySymbol, setCompanyCurrencySymbol] = React.useState("₹")

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

  // ── COMPANY HANDLERS (Super Admin) ──────────────────────────────────────────
  const handleOpenCreateCompany = () => {
    setEditingCompany(null)
    setCompanyName("")
    setCompanySlug("")
    setCompanyLogo("🏢")
    setCompanyCurrency("INR")
    setCompanyCurrencySymbol("₹")
    setIsCompanyModalOpen(true)
  }

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) return

    const slug = companySlug.trim() || companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    await addCompany({
      name: companyName.trim(),
      slug,
      logo: companyLogo || "🏢",
      currency: companyCurrency,
      currency_symbol: companyCurrencySymbol,
    })

    setIsCompanyModalOpen(false)
  }

  const handleDeleteCompany = async (compId: string, compName: string) => {
    if (!confirm(`Are you sure you want to permanently delete company "${compName}" and all its sub-branches?`)) {
      return
    }
    try {
      await deleteCompany(compId)
    } catch (err: any) {
      alert(err?.message || "Failed to delete company.")
    }
  }

  // ── BRANCH HANDLERS (Admin & Super Admin) ────────────────────────────────────
  const handleOpenCreateBranch = (compId: string) => {
    setTargetCompanyIdForBranch(compId)
    setEditingBranch(null)
    setBranchName("")
    setBranchCode(`BR-${Math.floor(100 + Math.random() * 900)}`)
    setBranchCity("Kolkata")
    setBranchAddress("")
    setBranchPhone("+91 98765 43210")
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

    if (editingBranch) {
      await updateBranch(editingBranch.id, {
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
        companyId: targetCompanyIdForBranch,
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

    setIsBranchModalOpen(false)
  }

  const handleDeleteBranch = async (branchId: string, bName: string) => {
    if (!confirm(`Are you sure you want to delete sub-branch "${bName}"?`)) {
      return
    }
    await deleteBranch(branchId)
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 size={20} />
            </span>
            <h2 className="text-xl font-bold text-foreground">
              Company & Sub-Branch Organization
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl">
            {isSuperAdmin
              ? "Super Admin Master Panel: Create and manage top-level companies, or configure sub-branches and location hubs."
              : "Company Admin Panel: Create and manage sub-branches, and assign specific team members and clients to branch locations."}
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

      {/* Companies & Sub-Branches Accordion List */}
      <div className="space-y-4">
        {visibleCompanies.map((company) => {
          const compBranches = branches.filter((b) => b.companyId === company.id || b.companyId === company.slug)
          const compUsers = allUsers.filter((u) => {
            const cIds = u.companyIds || (u.companyId ? [u.companyId] : [])
            return cIds.includes(company.id) || cIds.includes(company.slug || "")
          })
          const isExpanded = expandedCompanyIds.includes(company.id)

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
                  <div className="w-12 h-12 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-center text-2xl shrink-0">
                    {company.logo || "🏢"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">{company.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {compBranches.length} Sub-Branch{compBranches.length === 1 ? "" : "es"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>Slug: <code className="font-mono text-[11px] text-foreground">{company.slug || company.id}</code></span>
                      <span>•</span>
                      <span>Currency: {company.currency_symbol || "₹"} ({company.currency || "INR"})</span>
                      <span>•</span>
                      <span>{compUsers.length} Team Members & Clients</span>
                    </div>
                  </div>
                </div>

                {/* Company Action Buttons */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateBranch(company.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Sub-Branch</span>
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

              {/* Sub-Branches List Body */}
              {isExpanded && (
                <div className="p-5 space-y-4 bg-surface/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Sub-Branches & Location Hubs ({compBranches.length})
                    </span>
                  </div>

                  {compBranches.length === 0 ? (
                    <div className="py-8 text-center bg-surface rounded-2xl border border-dashed border-border p-6">
                      <p className="text-xs text-muted-foreground">No sub-branches created for this company yet.</p>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateBranch(company.id)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Create First Sub-Branch</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {compBranches.map((branch) => {
                        const branchUsers = allUsers.filter((u) => u.branchId === branch.id || (u as any).branch_id === branch.id)
                        
                        return (
                          <div
                            key={branch.id}
                            className="bg-surface p-4 rounded-2xl border border-border shadow-2xs space-y-3 hover:border-primary/40 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-sm text-foreground">{branch.name}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  branch.status === "Active"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                                }`}>
                                  {branch.status}
                                </span>
                              </div>

                              {branch.code && (
                                <span className="inline-block mt-1 font-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  Code: {branch.code}
                                </span>
                              )}

                              <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                                {branch.city && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin size={12} className="text-zinc-400 shrink-0" />
                                    <span>{branch.city}{branch.address ? `, ${branch.address}` : ""}</span>
                                  </div>
                                )}
                                {branch.phone && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone size={12} className="text-zinc-400 shrink-0" />
                                    <span>{branch.phone}</span>
                                  </div>
                                )}
                                {branch.managerName && (
                                  <div className="flex items-center gap-1.5">
                                    <User size={12} className="text-zinc-400 shrink-0" />
                                    <span>Manager: {branch.managerName}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Branch Footer */}
                            <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                              <span className="text-[11px] font-semibold text-muted-foreground">
                                👥 {branchUsers.length} Assigned Staff/Clients
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditBranch(branch)}
                                  className="p-1.5 text-zinc-500 hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
                                  title="Edit Sub-Branch"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBranch(branch.id, branch.name)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Sub-Branch"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── CREATE / EDIT COMPANY MODAL (Super Admin Only) ────────────────────── */}
      <AnimatePresence>
        {isCompanyModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface p-6 rounded-3xl border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  <h3 className="font-bold text-base text-foreground">Create Top-Level Company</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCompany} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. SAAMPARK Logistics & Freight"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Company Slug / Identifier</label>
                  <input
                    type="text"
                    value={companySlug}
                    onChange={(e) => setCompanySlug(e.target.value)}
                    placeholder="e.g. logistics (auto-generated if empty)"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-mono focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Emoji / Logo</label>
                    <input
                      type="text"
                      value={companyLogo}
                      onChange={(e) => setCompanyLogo(e.target.value)}
                      placeholder="e.g. 🏢, 💻, 📈"
                      className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-center text-lg focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={companyCurrencySymbol}
                      onChange={(e) => setCompanyCurrencySymbol(e.target.value)}
                      placeholder="₹"
                      className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-center focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => setIsCompanyModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90"
                  >
                    Save Company
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CREATE / EDIT SUB-BRANCH MODAL (Admin & Super Admin) ───────────────── */}
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
                <div className="flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  <h3 className="font-bold text-base text-foreground">
                    {editingBranch ? "Edit Sub-Branch" : "Create New Sub-Branch"}
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
                    className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90"
                  >
                    {editingBranch ? "Update Sub-Branch" : "Create Sub-Branch"}
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
