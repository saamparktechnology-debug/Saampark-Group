"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, GitBranch, MapPin, CheckCircle2, AlertCircle, 
  Search, SlidersHorizontal, ShieldCheck, Check, X, 
  RotateCcw, Sparkles, Layers, Eye, EyeOff, Save, Info
} from "lucide-react"

import { useAuthStore, Company, Branch, SubBranch, DEFAULT_COMPANIES } from "@/store/useAuthStore"
import { 
  usePermissionStore, 
  ALL_APP_MODULES, 
  CONFIGURABLE_MODULES, 
  CLEAN_MODULE_CATEGORIES 
} from "@/store/usePermissionStore"
import { saveModuleDataToDB, fetchModuleDataFromDB } from "@/lib/storageSync"
import { Button } from "@/components/ui/Button"

type EntityTier = "company" | "branch" | "subbranch"

export function EntityModulePermissionsTab() {
  const { 
    companies, 
    branches, 
    subBranches, 
    fetchCompanies, 
    fetchBranches, 
    fetchSubBranches 
  } = useAuthStore()

  const {
    companyEnabledModules,
    branchEnabledModules,
    subBranchEnabledModules,
    setCompanyEnabledModules,
    setBranchEnabledModules,
    setSubBranchEnabledModules,
  } = usePermissionStore()

  // State
  const [tier, setTier] = React.useState<EntityTier>("company")
  const [selectedEntityId, setSelectedEntityId] = React.useState<string>("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
  const [draftModules, setDraftModules] = React.useState<string[]>([...CONFIGURABLE_MODULES])
  const [isSaving, setIsSaving] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState("")
  const [errorMessage, setErrorMessage] = React.useState("")

  // Ensure fresh entity data from DB on mount
  React.useEffect(() => {
    fetchCompanies?.().catch(() => {})
    fetchBranches?.().catch(() => {})
    fetchSubBranches?.().catch(() => {})
  }, [fetchCompanies, fetchBranches, fetchSubBranches])

  // Companies list fallback
  const effectiveCompanies = React.useMemo(() => {
    return companies && companies.length > 0 ? companies : DEFAULT_COMPANIES
  }, [companies])

  // Auto-select initial entity when tier changes
  React.useEffect(() => {
    if (tier === "company") {
      const first = effectiveCompanies[0]?.id || "tech"
      setSelectedEntityId(first)
    } else if (tier === "branch") {
      const first = branches[0]?.id || ""
      setSelectedEntityId(first)
    } else if (tier === "subbranch") {
      const first = subBranches[0]?.id || ""
      setSelectedEntityId(first)
    }
  }, [tier, effectiveCompanies, branches, subBranches])

  // Load current modules for selected entity into draft state
  React.useEffect(() => {
    if (!selectedEntityId) return

    let current: string[] | undefined
    const normId = String(selectedEntityId).toLowerCase().trim()

    if (tier === "company") {
      const canonKey = (normId.includes("consult") || normId === "2") ? "consultancy" : (normId.includes("tech") || normId === "1" ? "tech" : normId)
      current = companyEnabledModules[selectedEntityId] || companyEnabledModules[canonKey]
    } else if (tier === "branch") {
      current = branchEnabledModules[selectedEntityId] || branchEnabledModules[normId]
    } else if (tier === "subbranch") {
      current = subBranchEnabledModules[selectedEntityId] || subBranchEnabledModules[normId]
    }

    if (current && Array.isArray(current)) {
      setDraftModules([...current])
    } else {
      // Default: all configurable modules enabled
      setDraftModules([...CONFIGURABLE_MODULES])
    }
  }, [selectedEntityId, tier, companyEnabledModules, branchEnabledModules, subBranchEnabledModules])

  // Selected entity display metadata
  const selectedEntityMeta = React.useMemo(() => {
    if (tier === "company") {
      const comp = effectiveCompanies.find(c => String(c.id).toLowerCase() === String(selectedEntityId).toLowerCase())
      return {
        name: comp?.name || selectedEntityId || "Selected Company",
        subtitle: comp?.division_name || comp?.subtitle || "Company Scope",
        type: "Company",
      }
    }
    if (tier === "branch") {
      const br = branches.find(b => String(b.id).toLowerCase() === String(selectedEntityId).toLowerCase())
      const comp = effectiveCompanies.find(c => String(c.id).toLowerCase() === String(br?.companyId).toLowerCase())
      return {
        name: br?.name || selectedEntityId || "Selected Branch",
        subtitle: `Belongs to: ${comp?.name || br?.companyId || "Parent Company"}`,
        type: "Branch",
      }
    }
    const sb = subBranches.find(s => String(s.id).toLowerCase() === String(selectedEntityId).toLowerCase())
    const parentBr = branches.find(b => String(b.id).toLowerCase() === String(sb?.parentBranchId).toLowerCase())
    return {
      name: sb?.name || selectedEntityId || "Selected Sub-Branch",
      subtitle: `Under branch: ${parentBr?.name || sb?.parentBranchId || "Parent Branch"}`,
      type: "Sub-Branch",
    }
  }, [tier, selectedEntityId, effectiveCompanies, branches, subBranches])

  // Toggle single module
  const toggleModule = (moduleKey: string) => {
    setDraftModules(prev => {
      if (prev.includes(moduleKey)) {
        return prev.filter(m => m !== moduleKey)
      } else {
        return [...prev, moduleKey]
      }
    })
  }

  // Bulk enable all
  const handleEnableAll = () => {
    setDraftModules([...CONFIGURABLE_MODULES])
  }

  // Bulk disable all
  const handleDisableAll = () => {
    // Keep Settings enabled so Super Admin can always configure system
    setDraftModules(["Settings"])
  }

  // Toggle all in a category
  const toggleCategory = (modules: { key: string }[]) => {
    const keys = modules.map(m => m.key)
    const allEnabled = keys.every(k => draftModules.includes(k))
    if (allEnabled) {
      // Disable all in this category
      setDraftModules(prev => prev.filter(k => !keys.includes(k)))
    } else {
      // Enable all in this category
      setDraftModules(prev => Array.from(new Set([...prev, ...keys])))
    }
  }

  // Save changes to Zustand Store & MySQL database
  const handleSave = async () => {
    if (!selectedEntityId) return
    setIsSaving(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      const modulesToSave = [...draftModules]

      // 1. Update Zustand store
      if (tier === "company") {
        setCompanyEnabledModules(selectedEntityId, modulesToSave)
      } else if (tier === "branch") {
        setBranchEnabledModules(selectedEntityId, modulesToSave)
      } else if (tier === "subbranch") {
        setSubBranchEnabledModules(selectedEntityId, modulesToSave)
      }

      // 2. Persist to database storageSync
      const payload = {
        tier,
        entityId: selectedEntityId,
        modules: modulesToSave,
        updatedAt: new Date().toISOString(),
      }

      await saveModuleDataToDB(
        `entity_permissions_${tier}_${selectedEntityId}`,
        payload,
        "all"
      ).catch(() => {})

      // Also persist consolidated map
      const storageKey = `saampark_entity_modules_${tier}`
      try {
        const rawExisting = await fetchModuleDataFromDB<Record<string, string[]>>(storageKey, {}, "all").catch(() => ({}))
        const existing: Record<string, string[]> = (rawExisting && typeof rawExisting === "object") ? { ...rawExisting } : {}
        existing[selectedEntityId] = modulesToSave
        await saveModuleDataToDB(storageKey, existing, "all").catch(() => {})
      } catch {}

      // 3. Dispatch global sync event
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("saampark_entity_permissions_updated"))
        window.dispatchEvent(new CustomEvent("saampark_data_synced"))
      }

      setSuccessMessage(`✅ Module permissions for "${selectedEntityMeta.name}" saved successfully!`)
      setTimeout(() => setSuccessMessage(""), 4000)
    } catch (err: any) {
      setErrorMessage(`Failed to save entity permissions: ${err?.message || "Unknown error"}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Filter modules by search & category
  const filteredCategories = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const result: Array<{
      id: string
      label: string
      icon: string
      modules: Array<{ key: string; name: string; description: string }>
    }> = []

    for (const [catId, cat] of Object.entries(CLEAN_MODULE_CATEGORIES)) {
      if (selectedCategory !== "all" && selectedCategory !== catId) continue

      const matchedMods = cat.modules.filter(m => {
        if (!query) return true
        return (
          m.name.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.key.toLowerCase().includes(query)
        )
      })

      if (matchedMods.length > 0) {
        result.push({
          id: catId,
          label: cat.label,
          icon: cat.icon,
          modules: matchedMods,
        })
      }
    }

    return result
  }, [searchQuery, selectedCategory])

  const totalModulesCount = CONFIGURABLE_MODULES.length
  const activeCount = draftModules.filter(m => CONFIGURABLE_MODULES.includes(m as any)).length

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-blue-500/20 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Super Admin Master Control
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Multi-Tenant Governance
              </span>
            </div>
            <h2 className="text-xl font-black flex items-center gap-2 text-white">
              <Building2 className="text-blue-400" size={22} />
              <span>Entity-Level Module Permissions</span>
            </h2>
            <p className="text-xs text-blue-200/80 max-w-2xl leading-relaxed">
              Configure which modules are available for each Company, Branch, and Sub-Branch. When a module is turned off for an entity, it is completely hidden from the sidebar and protected against direct URL navigation for anyone operating in that entity.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-black text-white">{activeCount} / {totalModulesCount}</div>
              <div className="text-[11px] text-blue-200/70 font-medium">Modules Enabled</div>
            </div>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !selectedEntityId}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{isSaving ? "Saving Changes..." : "Save Permissions"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ENTITY TIER SELECTOR & ENTITY DROPDOWN ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-2xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Tier Pills */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} className="text-blue-600" />
              <span>1. Select Entity Scope Tier</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => setTier("company")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tier === "company"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Building2 size={13} />
                <span>Company</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-zinc-200 dark:bg-zinc-700">
                  {effectiveCompanies.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTier("branch")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tier === "branch"
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <GitBranch size={13} />
                <span>Branch</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-zinc-200 dark:bg-zinc-700">
                  {branches.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTier("subbranch")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tier === "subbranch"
                    ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <MapPin size={13} />
                <span>Sub-Branch</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-zinc-200 dark:bg-zinc-700">
                  {subBranches.length}
                </span>
              </button>
            </div>
          </div>

          {/* Entity Dropdown */}
          <div className="md:col-span-7 space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal size={13} className="text-blue-600" />
                <span>2. Target {tier === "company" ? "Company" : tier === "branch" ? "Branch Office" : "Sub-Branch Partner"}</span>
              </span>
              <span className="text-[11px] font-normal text-zinc-400">
                Active: <strong className="text-zinc-700 dark:text-zinc-300">{selectedEntityMeta.name}</strong>
              </span>
            </label>

            {tier === "company" && (
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {effectiveCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏢 {c.name} {c.division_name ? `(${c.division_name})` : ""}
                  </option>
                ))}
              </select>
            )}

            {tier === "branch" && (
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {branches.length === 0 ? (
                  <option value="">No branches configured yet</option>
                ) : (
                  branches.map((b) => {
                    const comp = effectiveCompanies.find(c => String(c.id).toLowerCase() === String(b.companyId).toLowerCase())
                    return (
                      <option key={b.id} value={b.id}>
                        🌿 {b.name} [{comp?.name || b.companyId}]
                      </option>
                    )
                  })
                )}
              </select>
            )}

            {tier === "subbranch" && (
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {subBranches.length === 0 ? (
                  <option value="">No sub-branches registered yet</option>
                ) : (
                  subBranches.map((sb) => {
                    const parentBr = branches.find(b => String(b.id).toLowerCase() === String(sb.parentBranchId).toLowerCase())
                    return (
                      <option key={sb.id} value={sb.id}>
                        🍃 {sb.name} [Branch: {parentBr?.name || sb.parentBranchId}]
                      </option>
                    )
                  })
                )}
              </select>
            )}
          </div>
        </div>

        {/* Current Entity Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {tier === "company" ? <Building2 size={18} /> : tier === "branch" ? <GitBranch size={18} /> : <MapPin size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  {selectedEntityMeta.name}
                </h4>
                <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {selectedEntityMeta.type}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {selectedEntityMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleEnableAll}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Check size={13} />
              <span>Enable All</span>
            </button>
            <button
              type="button"
              onClick={handleDisableAll}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950/50 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X size={13} />
              <span>Disable All</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH & CATEGORY FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search modules (e.g. Tickets, Invoices)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
            }`}
          >
            All Categories
          </button>
          {Object.entries(CLEAN_MODULE_CATEGORIES).map(([catKey, cat]) => (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === catKey
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
              }`}
            >
              {cat.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* ── MODULE CARDS GROUPED BY CATEGORY ── */}
      <div className="space-y-6">
        {filteredCategories.map((category) => {
          const catModules = category.modules
          const allCatEnabled = catModules.every(m => draftModules.includes(m.key))
          const someCatEnabled = catModules.some(m => draftModules.includes(m.key))

          return (
            <div
              key={category.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-2xs space-y-4"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-200/50 dark:border-blue-900/50">
                    {category.label.charAt(0)}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {category.label}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      {catModules.filter(m => draftModules.includes(m.key)).length} of {catModules.length} modules enabled
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleCategory(catModules)}
                  className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  {allCatEnabled ? "Disable Category" : "Enable Category"}
                </button>
              </div>

              {/* Module Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {catModules.map((mod) => {
                  const isEnabled = draftModules.includes(mod.key)

                  return (
                    <div
                      key={mod.key}
                      onClick={() => toggleModule(mod.key)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isEnabled
                          ? "bg-blue-50/20 dark:bg-blue-950/10 border-blue-300 dark:border-blue-800/80 shadow-xs ring-1 ring-blue-500/10"
                          : "bg-zinc-50/50 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {mod.name}
                            </h4>
                            <span
                              className={`px-2 py-0.2 rounded-md text-[10px] font-extrabold ${
                                isEnabled
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40"
                                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              {isEnabled ? "ACTIVE" : "DISABLED"}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {mod.description}
                          </p>
                        </div>

                        {/* Switch Visual */}
                        <div className="shrink-0 pt-0.5">
                          <div
                            className={`w-10 h-6 rounded-full transition-colors relative ${
                              isEnabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 shadow-xs ${
                                isEnabled ? "left-5" : "left-1"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Status footer */}
                      <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400 flex items-center gap-1 font-medium">
                          {isEnabled ? (
                            <>
                              <Eye size={11} className="text-emerald-500" />
                              <span>Visible to {selectedEntityMeta.type}</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={11} className="text-rose-500" />
                              <span>Hidden for {selectedEntityMeta.type}</span>
                            </>
                          )}
                        </span>
                        <span className="font-mono text-zinc-400">
                          {mod.key}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating or Bottom Save Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <Info size={15} className="text-blue-500 shrink-0" />
          <span>
            Ready to commit module permissions for <strong className="text-zinc-900 dark:text-zinc-100">{selectedEntityMeta.name}</strong> ({activeCount} enabled).
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleEnableAll}
            className="text-xs font-semibold"
          >
            Reset to All
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !selectedEntityId}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 px-6 shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isSaving ? "Saving..." : "Save Entity Permissions"}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
