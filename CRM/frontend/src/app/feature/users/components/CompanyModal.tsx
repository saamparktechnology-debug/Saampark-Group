"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Building, DollarSign, Image, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"

interface CompanyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CompanyModal({ isOpen, onClose }: CompanyModalProps) {
  const { addCompany, fetchCompanies } = useAuthStore()

  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [logo, setLogo] = React.useState("🏢")
  const [currencySymbol, setCurrencySymbol] = React.useState("₹")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (name && !slug) {
      setSlug(name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
    }
  }, [name, slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const created = await addCompany({
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        logo: logo || "🏢",
        currency_symbol: currencySymbol || "₹",
      })

      if (created) {
        await fetchCompanies()
        alert(`Company workspace "${created.name}" created successfully in MySQL database!`)
        onClose()
      }
    } catch (err) {
      console.error("Failed to create company:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const PRESET_ICONS = ["💻", "📈", "🏢", "🚀", "🎨", "🛍️", "🏗️", "📦", "🌐", "⚡"]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Building size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Create Workspace Company
                </h2>
                <p className="text-xs text-zinc-500">
                  Super Admin only: Provision a new company tenant with isolated database module data.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Building size={14} /> Company Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
                }}
                placeholder="e.g. SAAMPARK AI Solutions"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={14} /> Workspace Code / Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. saampark-ai"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <DollarSign size={14} /> Currency Symbol
                </label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden"
                >
                  <option value="₹">₹ (INR)</option>
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="AED">AED (Dirham)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Image size={14} /> Company Logo / Emoji
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="🏢"
                  className="w-16 text-center text-lg py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-hidden"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setLogo(icon)}
                      className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center cursor-pointer transition-all ${
                        logo === icon
                          ? "border-purple-500 bg-purple-500/10 scale-110"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Company"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
