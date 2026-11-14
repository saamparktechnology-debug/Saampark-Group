"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, HelpCircle, User, Building, MapPin } from "lucide-react"
import { ClientItem } from "../types"
import { getUsers } from "@/app/feature/users/services/userService"
import { useAuthStore, isMatchingCompany, getSelectableCompanies } from "@/store/useAuthStore"
import { sendClientWelcomeEmailNotification } from "@/services/emailNotificationService"
import { formatDisplayEmail, getClientCategories, saveClientCategory, DEFAULT_CLIENT_CATEGORIES } from "../services/clientService"
import { lookupPincode } from "@/lib/pincodeService"

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (client: ClientItem) => void
  initialData?: ClientItem | null
}

export function AddClientModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddClientModalProps) {
  const { user, companies, activeCompanyId, activeBranchId, activeSubBranchId, branches, subBranches } = useAuthStore()
  const isSuperOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const selectableCompanies = React.useMemo(() => {
    return getSelectableCompanies(companies, activeCompanyId, user, branches, subBranches)
  }, [companies, activeCompanyId, user, branches, subBranches])

  const isBranchLocked = Boolean(user?.branchId && user?.role !== "Super Admin")

  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>(() => {
    if (activeCompanyId && activeCompanyId !== "all") return activeCompanyId
    return user?.companyId || "tech"
  })
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>(
    initialData?.branchId || user?.branchId || activeBranchId || ""
  )
  const [selectedSubBranchId, setSelectedSubBranchId] = React.useState<string>(
    initialData?.subBranchId || user?.subBranchId || activeSubBranchId || ""
  )

  const availableBranches = React.useMemo(() => {
    if (!branches || !Array.isArray(branches)) return []
    const targetComp = selectedCompanyId || activeCompanyId || user?.companyId || "tech"
    if (targetComp && targetComp !== "all") {
      return branches.filter((b) =>
        isMatchingCompany({ id: b.companyId || (b as any).company_id, slug: b.companyId } as any, targetComp)
      )
    }
    return branches
  }, [branches, selectedCompanyId, activeCompanyId, user?.companyId])

  const availableSubBranchesForBranch = React.useMemo(() => {
    if (!selectedBranchId || !subBranches || !Array.isArray(subBranches)) return []
    const normB = String(selectedBranchId).toLowerCase().trim()
    const targetB = availableBranches.find(b => String(b.id).toLowerCase().trim() === normB || String(b.name).toLowerCase().trim() === normB)
    const bId = targetB ? String(targetB.id).toLowerCase().trim() : normB
    const bName = targetB ? String(targetB.name).toLowerCase().trim() : ""

    return subBranches.filter(sb => {
      const pId = String(sb.parentBranchId || (sb as any).branch_id || (sb as any).branchId || "").toLowerCase().trim()
      const pName = String((sb as any).branchName || (sb as any).branch_name || "").toLowerCase().trim()
      return pId === bId || (bName && (pId === bName || pName === bName)) || pName === bId
    })
  }, [selectedBranchId, subBranches, availableBranches])

  const handleCompanyChange = (cId: string) => {
    setSelectedCompanyId(cId)
    if (!isBranchLocked) {
      setSelectedBranchId("")
      setSelectedSubBranchId("")
    }
  }

  const handleBranchChange = (bId: string) => {
    setSelectedBranchId(bId)
    setSelectedSubBranchId("")
  }

  const [type, setType] = React.useState<"Organization" | "Person">("Organization")
  const [companyName, setCompanyName] = React.useState("")
  const [designation, setDesignation] = React.useState("Proprietor")
  const [customDesignation, setCustomDesignation] = React.useState("")
  const [owner, setOwner] = React.useState("")
  const [managers, setManagers] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [district, setDistrict] = React.useState("")
  const [city, setCity] = React.useState("")
  const [state, setState] = React.useState("")
  const [zip, setZip] = React.useState("")
  const [pincodePlaces, setPincodePlaces] = React.useState<string[]>([])
  const [pincodeDistricts, setPincodeDistricts] = React.useState<string[]>([])
  const [pincodeStates, setPincodeStates] = React.useState<string[]>([])
  const [isPincodeLoading, setIsPincodeLoading] = React.useState(false)
  const [country, setCountry] = React.useState("India")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [vatNumber, setVatNumber] = React.useState("")
  const [gstNumber, setGstNumber] = React.useState("")
  
  // Category / Level State & Dynamic Creator
  const [availableCategories, setAvailableCategories] = React.useState<string[]>(DEFAULT_CLIENT_CATEGORIES)
  const [clientGroup, setClientGroup] = React.useState("Level 1")
  const [isAddingCategory, setIsAddingCategory] = React.useState(false)
  const [newCategoryInput, setNewCategoryInput] = React.useState("")

  const [currency, setCurrency] = React.useState("INR")
  const [currencySymbol, setCurrencySymbol] = React.useState("₹")
  const [label, setLabel] = React.useState("Corporate")
  const [disableOnlinePayment, setDisableOnlinePayment] = React.useState(false)
  const [ownersList, setOwnersList] = React.useState<{ id: string; name: string; role?: string }[]>([])

  React.useEffect(() => {
    if (isOpen) {
      getUsers("all").then((users) => {
        const staff = users
          .filter((u) => {
            const role = (u.role || "").toLowerCase().trim()
            return !role.includes("admin") && !role.includes("super") && !role.includes("client") && role !== "owner" && u.status !== "Inactive"
          })
          .map((u) => ({ id: u.id, name: u.name, role: u.role }))

        setOwnersList(staff)

        if (!owner) {
          setOwner(initialData?.owner || (staff.length > 0 ? staff[0].name : "Team"))
        }
      }).catch(() => {})

      if (initialData) {
        setSelectedCompanyId(initialData.companyId || activeCompanyId || "tech")
        setSelectedBranchId(initialData.branchId || "")
        setSelectedSubBranchId(initialData.subBranchId || "")
        setCompanyName(initialData.name || "")
        setDesignation(initialData.designation || "Proprietor")
        setCustomDesignation("")
        setPhone(initialData.phone || "")
        setEmail(formatDisplayEmail(initialData.email) || "")
        setClientGroup(initialData.group || "VIP")
        setLabel(initialData.label || "Corporate")
        setOwner(initialData.owner || user?.name || "")
        setManagers(initialData.managers || "")
        setAddress(initialData.address || "")
        setDistrict(initialData.district || "")
        setCity(initialData.city || "")
        setState(initialData.state || "")
        setZip(initialData.zip || "")
        setCountry(initialData.country || "India")
        setWebsite(initialData.website || "")
        setVatNumber(initialData.vatNumber || "")
        setGstNumber(initialData.gstNumber || "")
        setCurrency(initialData.currency || "INR")
        setDisableOnlinePayment(!!initialData.disableOnlinePayment)
      } else {
        setCompanyName("")
        setDesignation("Proprietor")
        setCustomDesignation("")
        setPhone("")
        setEmail("")
        setCountry("India")
        setDistrict("")
        setCity("")
        setState("")
        setZip("")
        setOwner(user?.name || "")
        setManagers("")
        setAddress("")
        setWebsite("")
        setVatNumber("")
        setGstNumber("")
        setClientGroup("Level 1")
        setLabel("Corporate")
        setDisableOnlinePayment(false)
      }

      getClientCategories(activeCompanyId || undefined).then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setAvailableCategories(cats)
          if (initialData?.group) {
            setClientGroup(initialData.group)
          } else if (!initialData) {
            setClientGroup(cats[0])
          }
        }
      }).catch(() => {})
    }
  }, [initialData, isOpen, user, activeCompanyId])

  const handleAddCategory = async () => {
    if (!newCategoryInput.trim()) return
    const trimmed = newCategoryInput.trim()
    const updated = await saveClientCategory(trimmed, activeCompanyId || undefined)
    setAvailableCategories(updated)
    setClientGroup(trimmed)
    setNewCategoryInput("")
    setIsAddingCategory(false)
  }

  if (!isOpen) return null

  const handlePincodeChange = async (pin: string) => {
    setZip(pin)
    const cleanPin = pin.trim().replace(/\D/g, "")
    if (cleanPin.length === 6) {
      setIsPincodeLoading(true)
      const res = await lookupPincode(cleanPin)
      setIsPincodeLoading(false)
      if (res && res.status === "Success") {
        setPincodePlaces(res.places || [])
        setPincodeDistricts(res.districts || [])
        setPincodeStates(res.states || [])
        if (res.state) setState(res.state)
        if (res.district) setDistrict(res.district)
        if (res.places && res.places.length > 0) setCity(res.places[0])
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) return

    const targetBranchObj = availableBranches.find(b => String(b.id).toLowerCase().trim() === String(selectedBranchId).toLowerCase().trim() || String(b.name).toLowerCase().trim() === String(selectedBranchId).toLowerCase().trim())
    const finalBranchId = targetBranchObj ? String(targetBranchObj.id) : (selectedBranchId || undefined)
    const finalBranchName = targetBranchObj?.name || (finalBranchId ? user?.branchName : undefined)

    const targetSubBranchObj = selectedSubBranchId ? subBranches?.find(sb => String(sb.id).toLowerCase().trim() === String(selectedSubBranchId).toLowerCase().trim()) : undefined
    const finalSubBranchId = selectedSubBranchId || undefined
    const finalSubBranchName = targetSubBranchObj?.name || undefined

    const effectiveDesignation = designation === "Other" ? (customDesignation.trim() || "Client") : designation

    const newClient: ClientItem = {
      id: initialData ? initialData.id : `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: companyName.trim(),
      primaryContact: companyName.trim(),
      designation: effectiveDesignation,
      phone: phone.trim(),
      email: email.trim(),
      group: clientGroup || "VIP",
      label: label || "Corporate",
      labelColor: "#d8b4fe",
      projectsCount: initialData?.projectsCount || 0,
      totalInvoiced: initialData?.totalInvoiced || "₹0.00",
      paymentReceived: initialData?.paymentReceived || "₹0.00",
      due: initialData?.due || "₹0.00",
      type,
      owner: owner || "Admin",
      managers,
      address,
      district,
      city,
      state,
      zip,
      country,
      vatNumber,
      gstNumber,
      currency,
      disableOnlinePayment,
      website,
      createdAt: initialData?.createdAt || Date.now(),
      branchId: finalBranchId,
      branchName: finalBranchName,
      subBranchId: finalSubBranchId,
      subBranchName: finalSubBranchName,
      companyId: selectedCompanyId || activeCompanyId || user?.companyId || "tech",
    }

    onSave(newClient)

    if (!initialData && newClient.email) {
      sendClientWelcomeEmailNotification(newClient).catch(() => null)
    }

    onClose()
  }



  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto scrollbar-hide"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200">
              {initialData ? "Edit client" : "Add client"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs md:text-sm">
            {/* Company, Branch & Sub-Branch Selector */}
            {isSuperOrAdmin && (
              <div className={`grid grid-cols-1 ${availableSubBranchesForBranch.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80`}>
                {/* Company */}
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1.5 text-[11px]">
                    <Building size={13} className="text-blue-500" />
                    <span>Company Entity *</span>
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-bold cursor-pointer text-xs"
                  >
                    {selectableCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch */}
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300 font-semibold flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-amber-500" />
                      <span>Branch Location</span>
                    </span>
                    {isBranchLocked && (
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        🔒 Locked
                      </span>
                    )}
                  </label>
                  {isBranchLocked ? (
                    <div className="w-full px-2.5 py-1.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between">
                      <span className="truncate">📍 {branches.find(b => b.id === user?.branchId)?.name || user?.branchId || "Assigned Branch"}</span>
                    </div>
                  ) : (
                    <select
                      value={selectedBranchId}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-bold cursor-pointer text-xs"
                    >
                      <option value="">🏢 Company HQ (All Branches)</option>
                      {availableBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          📍 {b.name || (b as any).branch_name || b.code || "Branch"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Dynamic Sub-Branch Selector (Visible when selected branch has sub-branches) */}
                {availableSubBranchesForBranch.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1.5 text-[11px]">
                      <span className="text-purple-500">🤝</span>
                      <span>Sub-Branch (Partner)</span>
                    </label>
                    <select
                      value={selectedSubBranchId}
                      onChange={(e) => setSelectedSubBranchId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 dark:text-slate-200 font-bold cursor-pointer text-xs"
                    >
                      <option value="">-- Direct Branch Client --</option>
                      {availableSubBranchesForBranch.map((sb) => (
                        <option key={sb.id} value={sb.id}>
                          🤝 {sb.name || (sb as any).sub_branch_name || sb.code}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Type */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Type</label>
              <div className="md:col-span-3 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="clientType"
                    checked={type === "Organization"}
                    onChange={() => setType("Organization")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Organization</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="clientType"
                    checked={type === "Person"}
                    onChange={() => setType("Person")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Person</span>
                </label>
              </div>
            </div>

            {/* Company Name */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Company name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Designation / Role */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Designation</label>
              <div className="md:col-span-3 flex flex-col sm:flex-row gap-2">
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                >
                  <option value="Proprietor">Proprietor</option>
                  <option value="Manager">Manager</option>
                  <option value="Founder">Founder</option>
                  <option value="CEO">CEO</option>
                  <option value="Director">Director</option>
                  <option value="Partner">Partner</option>
                  <option value="Other">Other (Custom)</option>
                </select>
                {designation === "Other" && (
                  <input
                    type="text"
                    value={customDesignation}
                    onChange={(e) => setCustomDesignation(e.target.value)}
                    placeholder="Enter custom title..."
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            {/* Owner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                Owner <HelpCircle size={13} className="text-slate-400" />
              </label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ownersList.length === 0 ? (
                  <option value={user?.name || "Admin"}>{user?.name || "Admin"}</option>
                ) : (
                  ownersList.map((o) => (
                    <option key={o.id || o.name} value={o.name}>
                      {o.name} {o.role ? `(${o.role})` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Managers */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Managers</label>
              <input
                type="text"
                value={managers}
                onChange={(e) => setManagers(e.target.value)}
                placeholder="Managers"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
              <label className="text-slate-600 dark:text-slate-400 font-medium pt-2">Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address / Street name"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Zip / Pincode with Postal Lookup */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium flex items-center justify-between">
                <span>PIN Code</span>
                {isPincodeLoading && (
                  <span className="text-xs text-blue-500 animate-pulse font-normal">Lookup...</span>
                )}
              </label>
              <div className="md:col-span-3 flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={zip}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  placeholder="e.g. 700001 (auto-fills city & state)"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* City */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">City / Area</label>
              {pincodePlaces.length > 0 ? (
                <div className="md:col-span-3 flex gap-2">
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {pincodePlaces.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Or type city"
                    className="w-1/3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kolkata / Mumbai"
                  className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* District */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">District</label>
              {pincodeDistricts.length > 0 ? (
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {pincodeDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Central Delhi / Howrah"
                  className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* State */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">State</label>
              {pincodeStates.length > 0 ? (
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {pincodeStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. West Bengal / Maharashtra"
                  className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Country - India */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone with India Flag & +91 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Phone</label>
              <div className="md:col-span-3 flex items-center gap-2">
                <span className="px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1 shrink-0">
                  🇮🇳 ▾
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765-43210"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@company.com"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Website */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Website"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* VAT Number */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">VAT Number</label>
              <input
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="VAT Number"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* GST Number */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">GST Number</label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="GST Number"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category / Level (with dynamic '+ Add Category') */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
              <label className="text-slate-600 dark:text-slate-400 font-medium pt-2">Category / Level</label>
              <div className="md:col-span-3 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={clientGroup}
                    onChange={(e) => setClientGroup(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    + Add Category
                  </button>
                </div>

                {/* Inline Add Category / Level Creator */}
                {isAddingCategory && (
                  <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Diamond, Level 4, Priority Partner..."
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddCategory()
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false)
                        setNewCategoryInput("")
                      }}
                      className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Currency - Default INR */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INR">Keep it blank to use the default (INR - ₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            {/* Currency Symbol */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="Keep it blank to use the default (₹)"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Labels */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Labels</label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Corporate">Corporate</option>
                <option value="Unsatisfied">Unsatisfied</option>
                <option value="Referral">Referral</option>
                <option value="Inactive">Inactive</option>
                <option value="Potential">Potential</option>
              </select>
            </div>

            {/* Disable online payment */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center pt-1">
              <label className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                Disable online payment <HelpCircle size={13} className="text-slate-400" />
              </label>
              <div className="md:col-span-3">
                <input
                  type="checkbox"
                  checked={disableOnlinePayment}
                  onChange={(e) => setDisableOnlinePayment(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <X size={14} /> Close
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Check size={14} /> Save & continue
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
              >
                <Check size={14} /> Save
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
