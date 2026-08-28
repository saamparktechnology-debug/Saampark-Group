"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, HelpCircle, User } from "lucide-react"
import { ClientItem } from "../types"
import { getUsers } from "@/app/feature/users/services/userService"
import { useAuthStore } from "@/store/useAuthStore"
import { sendClientWelcomeEmailNotification } from "@/services/emailNotificationService"


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
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()

  const [type, setType] = React.useState<"Organization" | "Person">("Organization")
  const [companyName, setCompanyName] = React.useState("")
  const [owner, setOwner] = React.useState("")
  const [managers, setManagers] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [city, setCity] = React.useState("")
  const [state, setState] = React.useState("")
  const [zip, setZip] = React.useState("")
  const [country, setCountry] = React.useState("India")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [vatNumber, setVatNumber] = React.useState("")
  const [gstNumber, setGstNumber] = React.useState("")
  const [clientGroup, setClientGroup] = React.useState("VIP")
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
        setCompanyName(initialData.name || "")
        setPhone(initialData.phone || "")
        setEmail(initialData.email || "")
        setClientGroup(initialData.group || "VIP")
        setLabel(initialData.label || "Corporate")
        setOwner(initialData.owner || user?.name || "")
        setManagers(initialData.managers || "")
        setAddress(initialData.address || "")
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
        setPhone("")
        setEmail("")
        setCountry("India")
        setCity("")
        setState("")
        setZip("")
        setOwner(user?.name || "")
        setManagers("")
        setAddress("")
        setWebsite("")
        setVatNumber("")
        setGstNumber("")
        setClientGroup("VIP")
        setLabel("Corporate")
        setDisableOnlinePayment(false)
      }
    }
  }, [initialData, isOpen, user])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) return

    const currentBranchObj = branches.find(b => b.id === (activeBranchId || user?.branchId))
    const finalBranchName = currentBranchObj?.name || user?.branchName || undefined

    const newClient: ClientItem = {
      id: initialData ? initialData.id : `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: companyName.trim(),
      primaryContact: companyName.trim(),
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
      branchId: initialData?.branchId || activeBranchId || user?.branchId || undefined,
      branchName: initialData?.branchName || finalBranchName,
      companyId: initialData?.companyId || activeCompanyId || user?.companyId || "tech",
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
                placeholder="Address"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* City */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* State */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Zip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Zip</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="400001"
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

            {/* Client groups */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Client groups</label>
              <select
                value={clientGroup}
                onChange={(e) => setClientGroup(e.target.value)}
                className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="VIP">VIP</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
              </select>
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
