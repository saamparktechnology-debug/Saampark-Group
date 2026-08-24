"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Settings, Building2, Mail, Lock, Sun, Moon, ShieldCheck, 
  Save, CheckCircle2, Globe, Key, AlertCircle, RefreshCw,
  Camera, Upload, User, Sparkles, Phone, MapPin, Briefcase, Tag
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore } from "@/store/useAuthStore"
import { useTheme } from "next-themes"
import { fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"
import { getUsers, recordUserAccount } from "@/app/feature/users/services/userService"

type SettingsTab = "profile" | "company" | "smtp" | "theme"

export default function SettingsMain() {
  const { user, loginAs } = useAuthStore()
  const { theme, setTheme } = useTheme()

  const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile")
  const [successMsg, setSuccessMsg] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  // ── Profile Form State ──
  const [name, setName] = React.useState(user?.name || "")
  const [email, setEmail] = React.useState(user?.email || "")
  const [phone, setPhone] = React.useState(user?.phone || "+91 98765 43210")
  const [jobTitle, setJobTitle] = React.useState((user as any)?.jobTitle || (user as any)?.role || "Technical Lead")
  const [department, setDepartment] = React.useState((user as any)?.department || "Software & IT Engineering")
  const [location, setLocation] = React.useState((user as any)?.location || "Mumbai, India")
  const [bio, setBio] = React.useState((user as any)?.bio || "Senior CRM engineer & client delivery manager at SAAMPARK Group.")
  const [skills, setSkills] = React.useState((user as any)?.skills || "Full-Stack Development, React, Next.js, Cloud Architecture, CRM Management")
  const [avatar, setAvatar] = React.useState(user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || "Admin"}`)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Password state
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  // Company Settings Form State
  const [companyName, setCompanyName] = React.useState("SAAMPARK Technology")
  const [currency, setCurrency] = React.useState("INR")
  const [currencySymbol, setCurrencySymbol] = React.useState("₹")
  const [address, setAddress] = React.useState("Saampark House, Tech Park, India")
  const [industry, setIndustry] = React.useState("Software & IT Services")

  // SMTP Settings Form State
  const [smtpUser, setSmtpUser] = React.useState("supriyogod@gmail.com")
  const [smtpPass, setSmtpPass] = React.useState("vctonocakbbgbvib")
  const [smtpHost, setSmtpHost] = React.useState("smtp.gmail.com")
  const [smtpPort, setSmtpPort] = React.useState("587")

  // Load settings & user profile on mount
  React.useEffect(() => {
    fetchModuleDataFromDB("settings", null).then((saved: any) => {
      if (saved) {
        if (saved.companyName) setCompanyName(saved.companyName)
        if (saved.currency) setCurrency(saved.currency)
        if (saved.currencySymbol) setCurrencySymbol(saved.currencySymbol)
        if (saved.address) setAddress(saved.address)
        if (saved.industry) setIndustry(saved.industry)
        if (saved.smtpUser) setSmtpUser(saved.smtpUser)
        if (saved.smtpPass) setSmtpPass(saved.smtpPass)
        if (saved.smtpHost) setSmtpHost(saved.smtpHost)
        if (saved.smtpPort) setSmtpPort(saved.smtpPort)
      }
    })

    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      if (user.phone) setPhone(user.phone)
      if (user.avatar) setAvatar(user.avatar)
    }
  }, [user])

  // Handle Photo Upload directly from phone or browser
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be under 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string
      if (dataUrl) {
        setAvatar(dataUrl)
        setSuccessMsg("📸 Profile picture uploaded! Click 'Save Complete Profile' to apply everywhere.")
        setTimeout(() => setSuccessMsg(""), 4000)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const updatedUserData: any = {
        ...(user || {}),
        name,
        email,
        phone,
        avatar,
        jobTitle,
        department,
        location,
        bio,
        skills,
      }

      // Update Auth Store
      if (user?.role) {
        loginAs(user.role, updatedUserData)
      }

      // Sync to MySQL users table
      try {
        const { api } = await import("@/lib/api")
        await api.put(`/users/${user?.id || email}`, {
          full_name: name,
          email,
          phone,
          department,
        }).catch((err) => console.warn("Backend profile update warning:", err))
      } catch {}

      // Save to database users list
      recordUserAccount({
        id: String(user?.id || Date.now()),
        name,
        email,
        phone,
        department,
        companyIds: user?.companyIds || (user?.companyId ? [user.companyId] : ["tech"]),
        companyId: user?.companyId || "tech",
        role: (user?.role as any) || "Admin",
        status: "Active",
      })

      // Persist profile data to settings
      await saveModuleDataToDB(`user_profile_${(email || "").toLowerCase().trim()}`, updatedUserData)

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"))
      }

      setSuccessMsg("✅ Complete profile & avatar updated successfully! Live synced across Dashboard, Leads, Tasks, and Team.")
      setTimeout(() => setSuccessMsg(""), 4000)
    } catch (err: any) {
      setErrorMsg(`Error updating profile: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await saveModuleDataToDB("settings", {
      companyName, currency, currencySymbol, address, industry,
      smtpUser, smtpPass, smtpHost, smtpPort
    })
    setLoading(false)
    setSuccessMsg("Company settings saved to MySQL database successfully!")
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await saveModuleDataToDB("settings", {
      companyName, currency, currencySymbol, address, industry,
      smtpUser, smtpPass, smtpHost, smtpPort
    })
    setLoading(false)
    setSuccessMsg("SMTP configurations saved to MySQL database successfully!")
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[1200px] mx-auto p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Settings className="text-blue-600" size={24} />
            <span>Account & Workspace Settings</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage your complete user profile, upload profile photo, and configure company settings</p>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 rounded-xl border border-rose-200 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto">
        {[
          { id: "profile", label: "Complete Profile & Avatar", icon: User },
          { id: "company", label: "Company Profile", icon: Building2 },
          { id: "smtp", label: "Email / SMTP Setup", icon: Mail },
          { id: "theme", label: "Display & Theme", icon: Sun },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── TAB 1: COMPLETE USER PROFILE & PHOTO UPLOAD ─────────────────────── */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
            {/* Avatar Preview with Camera Overlay */}
            <div className="relative group shrink-0">
              <img
                src={avatar}
                alt={name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-zinc-800 shadow-md bg-zinc-100"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer"
                title="Change photo"
              >
                <Camera size={20} className="mb-0.5" />
                <span>Upload</span>
              </button>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{name || "User Account"}</h3>
              <p className="text-xs text-zinc-500">
                Upload your profile photo from your phone or PC. This photo will show on the <span className="font-semibold text-blue-600">Leads Kanban cards</span>, <span className="font-semibold text-blue-600">Tasks assigned icons</span>, and Team directory.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Upload size={13} />
                  <span>Choose Photo (Phone / PC)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAvatar(`https://api.dicebear.com/7.x/notionists/svg?seed=${name || Date.now()}`)}
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Generate Avatar
                </button>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl opacity-70 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Job Title / Designation</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Project Manager / Technical Lead"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="Software & IT Engineering">Software & IT Engineering</option>
                <option value="Digital Marketing & Research">Digital Marketing & Research</option>
                <option value="Sales & Business Development">Sales & Business Development</option>
                <option value="Client Relationship & Support">Client Relationship & Support</option>
                <option value="Operations & Finance">Operations & Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Location / Office City</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, India"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 text-xs">Skills & Specializations</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Next.js, React, Node.js, UI/UX, Sales Lead, Client Management"
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 text-xs">Professional Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell team members and clients about your background and responsibilities..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save size={14} />
              <span>{loading ? "Saving Profile..." : "Save Complete Profile"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 2: COMPANY PROFILE ────────────────────────────────────────── */}
      {activeTab === "company" && (
        <form onSubmit={handleSaveCompany} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 space-y-4 max-w-2xl text-xs shadow-2xs">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            <span>Company & Organization Details</span>
          </h3>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Currency Code</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Registered Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Save size={14} />
              <span>Save Company Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 3: SMTP SETUP ─────────────────────────────────────────────── */}
      {activeTab === "smtp" && (
        <form onSubmit={handleSaveSmtp} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 space-y-4 max-w-2xl text-xs shadow-2xs">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Mail size={16} className="text-blue-600" />
            <span>SMTP Email Dispatch Configurations</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">SMTP Host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Port</label>
              <input
                type="text"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Sender Email *</label>
            <input
              type="email"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">App Password / Auth Token *</label>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Save size={14} />
              <span>Save SMTP Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 4: THEME ──────────────────────────────────────────────────── */}
      {activeTab === "theme" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 space-y-4 max-w-2xl text-xs shadow-2xs">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Globe size={16} className="text-blue-600" />
            <span>Appearance & Theme Preferences</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                theme === "dark" ? "border-blue-600 bg-blue-50/20 text-blue-600 font-bold" : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <Moon size={20} />
              <div className="text-left">
                <p className="text-sm font-semibold">Dark Theme</p>
                <p className="text-[11px] text-zinc-400">Sleek dark mode</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                theme === "light" ? "border-blue-600 bg-blue-50/20 text-blue-600 font-bold" : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <Sun size={20} />
              <div className="text-left">
                <p className="text-sm font-semibold">Light Theme</p>
                <p className="text-[11px] text-zinc-400">Crisp light mode</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
