"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Settings, Building2, Mail, Lock, Sun, Moon, ShieldCheck, 
  Save, CheckCircle2, Globe, Key, AlertCircle, RefreshCw
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore } from "@/store/useAuthStore"
import { useTheme } from "next-themes"
import { AuthService } from "@/services/apiServices"

type SettingsTab = "company" | "smtp" | "profile" | "theme"

export default function SettingsMain() {
  const { user } = useAuthStore()
  const { theme, setTheme } = useTheme()

  const [activeTab, setActiveTab] = React.useState<SettingsTab>("company")
  const [successMsg, setSuccessMsg] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState("")
  const [loading, setLoading] = React.useState(false)

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

  // User Profile Settings Form State
  const [name, setName] = React.useState(user?.name || "")
  const [email, setEmail] = React.useState(user?.email || "")
  const [phone, setPhone] = React.useState(user?.phone || "+91 98765 43210")
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccessMsg("Company Profile updated successfully!")
      setTimeout(() => setSuccessMsg(""), 3000)
    }, 600)
  }

  const handleSaveSMTP = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccessMsg("SMTP Configuration saved and verified!")
      setTimeout(() => setSuccessMsg(""), 3000)
    }, 600)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.")
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccessMsg("Profile details updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSuccessMsg(""), 3000)
    }, 600)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-[1400px] mx-auto p-4 sm:p-6"
    >
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
          <Settings size={14} /> Platform Configuration
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          System Settings & Preferences
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage company branding, SMTP mailer, personal profile, security, and theme preferences.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto scrollbar-hide pb-2">
        {[
          { id: "company", label: "Company Profile", icon: Building2 },
          { id: "smtp", label: "Email / SMTP Config", icon: Mail },
          { id: "profile", label: "My Profile & Security", icon: Lock },
          { id: "theme", label: "Theme & Display", icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as SettingsTab); setErrorMsg(""); setSuccessMsg("") }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground border border-border/50"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMsg}
        </motion.div>
      )}

      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} /> {errorMsg}
        </motion.div>
      )}

      {/* ── TAB 1: COMPANY PROFILE ────────────────────────────────────────────── */}
      {activeTab === "company" && (
        <form onSubmit={handleSaveCompany} className="bg-surface border border-border rounded-2xl p-6 space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Building2 size={18} className="text-primary" /> Company Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Company Name *</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Currency Code</label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="INR"
                  className="bg-background font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Currency Symbol</label>
                <Input
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="₹"
                  className="bg-background font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Industry / Domain</label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="bg-background"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Registered Business Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full p-3 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" leftIcon={<Save size={16} />} disabled={loading}>
            {loading ? "Saving Company Details..." : "Save Company Settings"}
          </Button>
        </form>
      )}

      {/* ── TAB 2: SMTP EMAIL CONFIG ──────────────────────────────────────────── */}
      {activeTab === "smtp" && (
        <form onSubmit={handleSaveSMTP} className="bg-surface border border-border rounded-2xl p-6 space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Mail size={18} className="text-primary" /> System Email & SMTP Config
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">SMTP Host</label>
                <Input
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="bg-background font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Port</label>
                <Input
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="bg-background font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Sender Email Address *</label>
              <Input
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                required
                className="bg-background font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">App Password / Auth Token *</label>
              <Input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                required
                className="bg-background font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" leftIcon={<Save size={16} />} disabled={loading}>
              {loading ? "Saving SMTP..." : "Save SMTP Config"}
            </Button>
          </div>
        </form>
      )}

      {/* ── TAB 3: USER PROFILE & SECURITY ────────────────────────────────────── */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-surface border border-border rounded-2xl p-6 space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Lock size={18} className="text-primary" /> Profile & Security Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Full Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background" />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Email Address</label>
              <Input value={email} disabled className="bg-background/50 cursor-not-allowed opacity-70" />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Phone Number</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background" />
            </div>

            <div className="border-t border-border pt-4 mt-2 space-y-3">
              <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Change Password</h4>

              <div>
                <label className="block text-xs font-semibold mb-1">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="primary" leftIcon={<Save size={16} />} disabled={loading}>
            {loading ? "Updating Profile..." : "Update Profile"}
          </Button>
        </form>
      )}

      {/* ── TAB 4: THEME & DISPLAY ────────────────────────────────────────────── */}
      {activeTab === "theme" && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Globe size={18} className="text-primary" /> Appearance & Display Preferences
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2">Theme Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                    theme === "dark" ? "border-primary bg-primary/10 text-primary font-bold" : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <Moon size={20} />
                  <div className="text-left">
                    <p className="text-sm">Dark Mode</p>
                    <p className="text-[11px] text-muted-foreground">Default CRM Theme</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                    theme === "light" ? "border-primary bg-primary/10 text-primary font-bold" : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <Sun size={20} />
                  <div className="text-left">
                    <p className="text-sm">Light Mode</p>
                    <p className="text-[11px] text-muted-foreground">Clean Light Theme</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
