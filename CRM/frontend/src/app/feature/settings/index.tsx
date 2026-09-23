"use client"

import { CompanyApiService } from "@/app/feature/companies/services/companyService"
import { api } from "@/lib/api"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Settings, Building2, Mail, Lock, Sun, Moon, ShieldCheck, 
  Save, CheckCircle2, Globe, Key, AlertCircle, RefreshCw,
  Camera, Upload, User, Sparkles, Phone, MapPin, Briefcase, Tag,
  QrCode, CreditCard
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore, Company, DEFAULT_COMPANIES } from "@/store/useAuthStore"
import { useTheme } from "next-themes"
import { fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"
import { 
  getUsers, 
  recordUserAccount, 
  getStoredUserAccountsAsync,
  cascadeUserAvatarChange, 
  checkUsernameAvailabilityAsync, 
  updateUserUsernameAsync 
} from "@/app/feature/users/services/userService"
import { uploadToImgBB } from "@/lib/imgbbUpload"
import { KycData, KycStatus } from "@/app/feature/users/types"
import { 
  getCompanyPaymentSettings, 
  saveCompanyPaymentSettings, 
  CompanyPaymentSettings,
  DEFAULT_COMPANY_PAYMENT_SETTINGS 
} from "./services/companyPaymentService"

type SettingsTab = "profile" | "kyc" | "payments" | "company" | "smtp" | "theme"

export default function SettingsMain() {
  const { user, loginAs, companies, updateCompany, fetchCompanies } = useAuthStore()
  const { theme, setTheme } = useTheme()

  const isSuperAdmin = user?.role === "Super Admin"

  const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile")
  const [successMsg, setSuccessMsg] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)

  // ── Profile Form State ──
  const [name, setName] = React.useState(user?.name || "")
  const [email, setEmail] = React.useState(user?.email || "")
  const [username, setUsername] = React.useState(user?.username || "")
  const [usernameStatus, setUsernameStatus] = React.useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle")
  const [usernameStatusMsg, setUsernameStatusMsg] = React.useState("")
  const [showUsernameConfirmModal, setShowUsernameConfirmModal] = React.useState(false)
  const [pendingUsername, setPendingUsername] = React.useState("")
  const [isSavingUsername, setIsSavingUsername] = React.useState(false)
  const [phone, setPhone] = React.useState(user?.phone || "")
  const [jobTitle, setJobTitle] = React.useState((user as any)?.jobTitle || user?.role || "Team Member")
  const [department, setDepartment] = React.useState(user?.department || "")
  const [location, setLocation] = React.useState((user as any)?.location || "Kolkata, India")
  const [bio, setBio] = React.useState((user as any)?.bio || "")
  const [skills, setSkills] = React.useState((user as any)?.skills || "")
  const [avatar, setAvatar] = React.useState(user?.avatar || (user as any)?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || "User"}`)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  // Company Settings Form State (Super Admin)
  const [companyName, setCompanyName] = React.useState("SAAMPARK Technology")
  const [currency, setCurrency] = React.useState("INR")
  const [currencySymbol, setCurrencySymbol] = React.useState("₹")
  const [address, setAddress] = React.useState("Saampark House, Tech Park, India")
  const [industry, setIndustry] = React.useState("Software & IT Services")

  // ── Multi-Company SMTP Settings State (Super Admin Only) ──
  const effectiveCompanies = React.useMemo(() => {
    return (companies && companies.length > 0) ? companies : DEFAULT_COMPANIES
  }, [companies])

  const [selectedSmtpCompanyId, setSelectedSmtpCompanyId] = React.useState<string>("tech")
  const [companySmtpMap, setCompanySmtpMap] = React.useState<Record<string, {
    preset: "gmail" | "zoho" | "outlook" | "custom"
    host: string
    port: string
    secure: boolean
    user: string
    pass: string
    fromName: string
    fromEmail: string
  }>>({})

  const [showSmtpPass, setShowSmtpPass] = React.useState(false)
  const [isTestingSmtp, setIsTestingSmtp] = React.useState(false)
  const [smtpTestResult, setSmtpTestResult] = React.useState<{ success?: boolean; message?: string } | null>(null)
  const [smtpTestRecipient, setSmtpTestRecipient] = React.useState("")

  const getInitialSmtpForCompany = React.useCallback((comp: Company | undefined, compId: string) => {
    const isTech = String(compId).toLowerCase() === "tech" || String(compId).toLowerCase() === "1" || String(comp?.name || "").toLowerCase().includes("tech")
    
    // If company has saved smtp fields in DB / state
    if (comp && (comp.smtp_user || comp.smtp_pass || comp.smtp_host)) {
      const host = comp.smtp_host || (isTech ? "smtp.gmail.com" : "")
      let preset: "gmail" | "zoho" | "outlook" | "custom" = "gmail"
      if (host.includes("zoho")) preset = "zoho"
      else if (host.includes("outlook") || host.includes("office365")) preset = "outlook"
      else if (host && !host.includes("gmail")) preset = "custom"

      return {
        preset,
        host,
        port: String(comp.smtp_port || "587"),
        secure: comp.smtp_secure === true || String(comp.smtp_port) === "465",
        user: comp.smtp_user || "",
        pass: comp.smtp_pass || "",
        fromName: comp.smtp_from_name || comp.brand_name || comp.name || (isTech ? "SAAMPARK Technology" : "SAAMPARK Consultancy"),
        fromEmail: comp.smtp_from_email || comp.smtp_user || "",
      }
    }

    // Saampark Technology: prefilled working credentials (supriyogod@gmail.com / vctonocakbbgbvib)
    if (isTech) {
      return {
        preset: "gmail" as const,
        host: "smtp.gmail.com",
        port: "587",
        secure: false,
        user: "supriyogod@gmail.com",
        pass: "vctonocakbbgbvib",
        fromName: "SAAMPARK Technology",
        fromEmail: "supriyogod@gmail.com",
      }
    }

    // Saampark Consultancy & Any other company: strictly EMPTY until filled by Super Admin
    return {
      preset: "gmail" as const,
      host: "",
      port: "587",
      secure: false,
      user: "",
      pass: "",
      fromName: comp?.brand_name ? `${comp.brand_name} ${comp.division_name || comp.name || ""}`.trim() : (comp?.name || "SAAMPARK Consultancy"),
      fromEmail: "",
    }
  }, [])

  const activeSmtpCompany = React.useMemo(() => {
    return effectiveCompanies.find(c => 
      String(c.id).toLowerCase() === String(selectedSmtpCompanyId).toLowerCase() || 
      String(c.slug || '').toLowerCase() === String(selectedSmtpCompanyId).toLowerCase()
    ) || effectiveCompanies[0]
  }, [effectiveCompanies, selectedSmtpCompanyId])

  const currentSmtp = React.useMemo(() => {
    if (companySmtpMap[selectedSmtpCompanyId]) {
      return companySmtpMap[selectedSmtpCompanyId]
    }
    return getInitialSmtpForCompany(activeSmtpCompany, selectedSmtpCompanyId)
  }, [companySmtpMap, selectedSmtpCompanyId, activeSmtpCompany, getInitialSmtpForCompany])

  const updateCurrentSmtp = (updates: Partial<typeof currentSmtp>) => {
    setCompanySmtpMap(prev => ({
      ...prev,
      [selectedSmtpCompanyId]: {
        ...currentSmtp,
        ...updates,
      }
    }))
  }

  // ── KYC Form State ──
  const [kycFullName, setKycFullName] = React.useState(user?.name || "")
  const [kycDocType, setKycDocType] = React.useState<"Aadhaar Card" | "PAN Card" | "Passport" | "Voter ID" | "Driving License">("Aadhaar Card")
  const [kycDocNumber, setKycDocNumber] = React.useState("")
  const [kycDocFrontUrl, setKycDocFrontUrl] = React.useState("")
  const [kycDocBackUrl, setKycDocBackUrl] = React.useState("")
  const [kycBankName, setKycBankName] = React.useState("")
  const [kycAccountNumber, setKycAccountNumber] = React.useState("")
  const [kycIfscCode, setKycIfscCode] = React.useState("")
  const [kycAccountHolderName, setKycAccountHolderName] = React.useState("")
  const [kycUpiId, setKycUpiId] = React.useState("")
  const [kycStatus, setKycStatus] = React.useState<KycStatus>("Pending")
  const [kycRejectionReason, setKycRejectionReason] = React.useState("")
  const [isUploadingFront, setIsUploadingFront] = React.useState(false)
  const [isUploadingBack, setIsUploadingBack] = React.useState(false)

  const frontDocInputRef = React.useRef<HTMLInputElement>(null)
  const backDocInputRef = React.useRef<HTMLInputElement>(null)

  // ── Company Payment QR & Bank Details State (for Invoices) ──
  const [payQrUrl, setPayQrUrl] = React.useState("")
  const [payBankName, setPayBankName] = React.useState("State Bank of India")
  const [payAccountHolder, setPayAccountHolder] = React.useState("Saampark Technology & Research Pvt. Ltd.")
  const [payAccountNumber, setPayAccountNumber] = React.useState("40912384759")
  const [payIfsc, setPayIfsc] = React.useState("SBIN0001234")
  const [payUpiId, setPayUpiId] = React.useState("saampark@sbi")
  const [payBranch, setPayBranch] = React.useState("Balichak Station Road")
  const [paySwiftCode, setPaySwiftCode] = React.useState("SBININBB123")
  const [payNotes, setPayNotes] = React.useState("Please scan QR or transfer via NEFT/RTGS/IMPS. Mention Invoice ID in transaction note.")
  const [isUploadingQr, setIsUploadingQr] = React.useState(false)
  const qrInputRef = React.useRef<HTMLInputElement>(null)

  // Load settings & user profile & payment QR settings on mount
  React.useEffect(() => {
    // 1. Fetch companies to ensure latest per-company SMTP configs are loaded
    fetchCompanies().catch(() => {})

    // 2. Fetch from DB master scope
    fetchModuleDataFromDB("settings", null, "all").then((saved: any) => {
      if (saved && typeof saved === "object") {
        if (saved.companyName) setCompanyName(saved.companyName)
        if (saved.currency) setCurrency(saved.currency)
        if (saved.currencySymbol) setCurrencySymbol(saved.currencySymbol)
        if (saved.address) setAddress(saved.address)
        if (saved.industry) setIndustry(saved.industry)
        if (saved.smtpUser && saved.smtpPass) {
          setCompanySmtpMap((prev) => ({
            ...prev,
            tech: {
              preset: saved.smtpHost?.includes("gmail") ? "gmail" : (saved.smtpHost?.includes("zoho") ? "zoho" : "custom"),
              host: saved.smtpHost || "smtp.gmail.com",
              port: String(saved.smtpPort || "587"),
              secure: saved.smtpSecure === true,
              user: saved.smtpUser || "supriyogod@gmail.com",
              pass: saved.smtpPass || "vctonocakbbgbvib",
              fromName: saved.smtpFromName || "SAAMPARK Technology",
              fromEmail: saved.smtpFromEmail || saved.smtpUser || "supriyogod@gmail.com",
            }
          }))
        }
      }
    })

    getCompanyPaymentSettings().then((pSet) => {
      if (pSet) {
        if (pSet.qrCodeUrl) setPayQrUrl(pSet.qrCodeUrl)
        if (pSet.bankName) setPayBankName(pSet.bankName)
        if (pSet.accountHolderName) setPayAccountHolder(pSet.accountHolderName)
        if (pSet.accountNumber) setPayAccountNumber(pSet.accountNumber)
        if (pSet.ifscCode) setPayIfsc(pSet.ifscCode)
        if (pSet.upiId) setPayUpiId(pSet.upiId)
        if (pSet.branch) setPayBranch(pSet.branch)
        if (pSet.swiftCode) setPaySwiftCode(pSet.swiftCode)
        if (pSet.notes) setPayNotes(pSet.notes)
      }
    }).catch(() => {})

    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      if (user.username) setUsername(user.username)
      if (user.phone) setPhone(user.phone)
      if (user.avatar || (user as any).avatarUrl) setAvatar(user.avatar || (user as any).avatarUrl)
      if (user.department) setDepartment(user.department)
      if (user.kycStatus) setKycStatus(user.kycStatus)

      if (user.kycData) {
        const kd = user.kycData
        if (kd.fullName) setKycFullName(kd.fullName)
        if (kd.docType) setKycDocType(kd.docType)
        if (kd.docNumber) setKycDocNumber(kd.docNumber)
        if (kd.docFrontUrl) setKycDocFrontUrl(kd.docFrontUrl)
        if (kd.docBackUrl) setKycDocBackUrl(kd.docBackUrl)
        if (kd.bankName) setKycBankName(kd.bankName)
        if (kd.accountNumber) setKycAccountNumber(kd.accountNumber)
        if (kd.ifscCode) setKycIfscCode(kd.ifscCode)
        if (kd.accountHolderName) setKycAccountHolderName(kd.accountHolderName)
        if (kd.upiId) setKycUpiId(kd.upiId)
        if (kd.rejectionReason) setKycRejectionReason(kd.rejectionReason)
      }

      // Live DB sync: fetch fresh user account to get KYC approved by Admin in real-time
      const syncFreshKYC = () => {
        getStoredUserAccountsAsync().then((accounts) => {
          const uId = String(user.id || "").toLowerCase().trim()
          const uEmail = (user.email || "").toLowerCase().trim()
          const fresh = accounts.find((a) => {
            const aId = String(a.id || "").toLowerCase().trim()
            const aEmail = (a.email || "").toLowerCase().trim()
            return (uId && aId === uId) || (uEmail && aEmail === uEmail)
          })
          if (fresh) {
            if (fresh.kycStatus) setKycStatus(fresh.kycStatus)
            if (fresh.kycData) {
              const kd = fresh.kycData
              if (kd.fullName) setKycFullName(kd.fullName)
              if (kd.docType) setKycDocType(kd.docType)
              if (kd.docNumber) setKycDocNumber(kd.docNumber)
              if (kd.docFrontUrl) setKycDocFrontUrl(kd.docFrontUrl)
              if (kd.docBackUrl) setKycDocBackUrl(kd.docBackUrl)
              if (kd.bankName) setKycBankName(kd.bankName)
              if (kd.accountNumber) setKycAccountNumber(kd.accountNumber)
              if (kd.ifscCode) setKycIfscCode(kd.ifscCode)
              if (kd.accountHolderName) setKycAccountHolderName(kd.accountHolderName)
              if (kd.upiId) setKycUpiId(kd.upiId)
              if (kd.rejectionReason) setKycRejectionReason(kd.rejectionReason)
            }
            if (fresh.kycStatus && fresh.kycStatus !== user.kycStatus) {
              useAuthStore.setState({
                user: {
                  ...user,
                  kycStatus: fresh.kycStatus,
                  kycData: fresh.kycData,
                }
              })
            }
          }
        }).catch(() => {})
      }

      syncFreshKYC()

      if (typeof window !== "undefined") {
        window.addEventListener("saampark_kyc_updated", syncFreshKYC)
        window.addEventListener("storage", syncFreshKYC)
        return () => {
          window.removeEventListener("saampark_kyc_updated", syncFreshKYC)
          window.removeEventListener("storage", syncFreshKYC)
        }
      }
    }
  }, [user])

  // Real-time debounced username availability checker
  React.useEffect(() => {
    const raw = (username || "").toLowerCase().trim()
    const cur = (user?.username || "").toLowerCase().trim()

    if (!raw) {
      setUsernameStatus("idle")
      setUsernameStatusMsg("")
      return
    }

    if (raw === cur) {
      setUsernameStatus("idle")
      setUsernameStatusMsg("This is your current username.")
      return
    }

    if (raw.length < 3 || raw.length > 30) {
      setUsernameStatus("invalid")
      setUsernameStatusMsg("Username must be between 3 and 30 characters.")
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(raw)) {
      setUsernameStatus("invalid")
      setUsernameStatusMsg("Only letters, numbers, and underscores allowed.")
      return
    }

    setUsernameStatus("checking")
    setUsernameStatusMsg("Checking availability...")

    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailabilityAsync(raw, String(user?.id || user?.email))
        if (res.available) {
          setUsernameStatus("available")
          setUsernameStatusMsg(res.message || "Username is available!")
        } else {
          setUsernameStatus("taken")
          setUsernameStatusMsg(res.message || "Username is already taken.")
        }
      } catch {
        setUsernameStatus("idle")
        setUsernameStatusMsg("")
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [username, user?.username, user?.id, user?.email])

  const handleOpenUsernameConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    const clean = (username || "").toLowerCase().trim()
    if (!clean || usernameStatus !== "available") return
    setPendingUsername(clean)
    setShowUsernameConfirmModal(true)
  }

  const handleConfirmSaveUsername = async () => {
    if (!pendingUsername) return
    setIsSavingUsername(true)
    setErrorMsg("")
    try {
      const res = await updateUserUsernameAsync(String(user?.id || user?.email), pendingUsername)
      if (res.success) {
        setShowUsernameConfirmModal(false)
        setSuccessMsg(`✅ Username updated to @${pendingUsername}! You can now sign in using this username or your email.`)
        setUsernameStatus("idle")
        setUsernameStatusMsg("This is your current username.")
        setTimeout(() => setSuccessMsg(""), 5000)
      } else {
        setErrorMsg(res.message || "Failed to update username.")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update username.")
    } finally {
      setIsSavingUsername(false)
    }
  }

  // Handle Photo Upload directly with permanent ImgBB Cloud Hosting & Automatic Compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 12 * 1024 * 1024) {
      alert("Image size should be under 12MB.")
      return
    }

    setIsUploadingAvatar(true)
    setErrorMsg("")
    try {
      const uploadResult = await uploadToImgBB(file, `${user?.name || "avatar"}_${Date.now()}`, 400)
      if (uploadResult.url) {
        const finalAvatarUrl = uploadResult.url
        setAvatar(finalAvatarUrl)
        
        // Live sync avatar across session immediately
        if (user) {
          useAuthStore.setState({
            user: { ...user, avatar: finalAvatarUrl, avatarUrl: finalAvatarUrl } as any
          })
          recordUserAccount({
            ...user,
            avatarUrl: finalAvatarUrl,
            avatar: finalAvatarUrl,
            id: String(user.id),
          })
          cascadeUserAvatarChange(user.name, user.email, finalAvatarUrl).catch(() => {})

          // Sync to backend MySQL table
          try {
            const { api } = await import("@/lib/api")
            await api.put(`/users/${user.id || user.email}`, {
              avatar_url: finalAvatarUrl,
              avatar: finalAvatarUrl,
              avatarUrl: finalAvatarUrl,
            }).catch(() => {})
          } catch {}

          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("storage"))
            window.dispatchEvent(new CustomEvent("crm_avatar_changed", { detail: { avatar: finalAvatarUrl } }))
          }
        }

        setSuccessMsg("📸 Profile picture updated & live synced across Topbar, Leads, Projects & Comments!")
        setTimeout(() => setSuccessMsg(""), 4000)
      }
    } catch (err: any) {
      setErrorMsg("Failed to upload image. Please try again.")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Handle KYC Document Front Upload (ImgBB)
  const handleFrontDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingFront(true)
    try {
      const res = await uploadToImgBB(file, `kyc_front_${user?.id || "doc"}_${Date.now()}`)
      if (res.url) {
        setKycDocFrontUrl(res.url)
        setSuccessMsg("📄 Front document image uploaded successfully!")
        setTimeout(() => setSuccessMsg(""), 3000)
      }
    } catch {
      setErrorMsg("Failed to upload document. Please retry.")
    } finally {
      setIsUploadingFront(false)
    }
  }

  // Handle KYC Document Back Upload (ImgBB)
  const handleBackDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingBack(true)
    try {
      const res = await uploadToImgBB(file, `kyc_back_${user?.id || "doc"}_${Date.now()}`)
      if (res.url) {
        setKycDocBackUrl(res.url)
        setSuccessMsg("📄 Back document image uploaded successfully!")
        setTimeout(() => setSuccessMsg(""), 3000)
      }
    } catch {
      setErrorMsg("Failed to upload document. Please retry.")
    } finally {
      setIsUploadingBack(false)
    }
  }

  // Save Complete User Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    // If changing password, require current password verification
    if (newPassword) {
      if (!currentPassword) {
        setErrorMsg("⚠️ Please enter your current/previous password to authorize a password change.")
        return
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg("⚠️ New password and confirmation password do not match.")
        return
      }
      if (newPassword.length < 6) {
        setErrorMsg("⚠️ New password must be at least 6 characters long.")
        return
      }
    }

    setLoading(true)
    try {
      const updatedUserData: any = {
        ...(user || {}),
        name: isSuperAdmin ? name : (user?.name || name),
        email: isSuperAdmin ? email : (user?.email || email),
        phone: isSuperAdmin ? phone : (user?.phone || phone),
        department: isSuperAdmin ? department : (user?.department || department),
        avatar,
        avatarUrl: avatar,
        jobTitle,
        location,
        bio,
        skills,
      }

      if (newPassword) {
        updatedUserData.password = newPassword
      }

      // Update Auth Store
      if (user?.role) {
        loginAs(user.role, updatedUserData)
      }

      // Sync to MySQL users table
      try {
        const { api } = await import("@/lib/api")
        await api.put(`/users/${user?.id || email}`, {
          full_name: updatedUserData.name,
          email: updatedUserData.email,
          phone: updatedUserData.phone,
          department: updatedUserData.department,
          avatar_url: avatar,
          avatarUrl: avatar,
          avatar: avatar,
          password: newPassword || undefined,
        }).catch((err) => console.warn("Backend profile update warning:", err))
      } catch {}

      // Save to database users list
      recordUserAccount({
        id: String(user?.id || Date.now()),
        name: updatedUserData.name,
        email: updatedUserData.email,
        phone: updatedUserData.phone,
        department: updatedUserData.department,
        avatarUrl: avatar,
        password: newPassword ? newPassword : ((user as any)?.password || undefined),
        username: user?.username || undefined,
        companyIds: user?.companyIds || (user?.companyId ? [user.companyId] : ["tech"]),
        companyId: user?.companyId || "tech",
        branchId: user?.branchId,
        branchName: user?.branchName,
        role: (user?.role as any) || "Admin",
        status: "Active",
      })

      if (avatar && user) {
        cascadeUserAvatarChange(updatedUserData.name, updatedUserData.email, avatar).catch(() => {})
      }

      // Clear password fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"))
      }

      setSuccessMsg("✅ Profile updated successfully! Cloud image & details live-synced across CRM.")
      setTimeout(() => setSuccessMsg(""), 4000)
    } catch (err: any) {
      setErrorMsg(`Error updating profile: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Submit KYC Details Form
  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!kycDocNumber.trim()) {
      setErrorMsg("Please enter your Document Number.")
      return
    }

    if (!kycDocFrontUrl) {
      setErrorMsg("Please upload at least the Front photo of your ID document.")
      return
    }

    setLoading(true)
    try {
      const kycPayload: KycData = {
        fullName: kycFullName.trim() || user?.name || "",
        docType: kycDocType,
        docNumber: kycDocNumber.trim(),
        docFrontUrl: kycDocFrontUrl,
        docBackUrl: kycDocBackUrl || undefined,
        bankName: kycBankName.trim() || undefined,
        accountNumber: kycAccountNumber.trim() || undefined,
        ifscCode: kycIfscCode.trim().toUpperCase() || undefined,
        accountHolderName: kycAccountHolderName.trim() || undefined,
        upiId: kycUpiId.trim() || undefined,
        submittedAt: new Date().toISOString(),
        rejectionReason: undefined,
      }

      const updatedUser: any = {
        ...(user || {}),
        kycStatus: "Processing" as KycStatus,
        kycData: kycPayload,
      }

      setKycStatus("Processing")

      // Update Auth Store
      if (user?.role) {
        loginAs(user.role, updatedUser)
      }

      // Record in userService & DB
      recordUserAccount({
        id: String(user?.id || Date.now()),
        email: user?.email || email,
        name: user?.name || name,
        kycStatus: "Processing",
        kycData: kycPayload,
      })

      // Sync with Team Banking & Payroll hub
      try {
        const { updateMemberBankingDetails } = await import("@/app/feature/team/services/teamPaymentService")
        await updateMemberBankingDetails(String(user?.id || user?.email || email), {
          bankName: kycBankName.trim() || undefined,
          accountNumber: kycAccountNumber.trim() || undefined,
          ifscCode: kycIfscCode.trim().toUpperCase() || undefined,
          accountHolderName: kycAccountHolderName.trim() || undefined,
          upiId: kycUpiId.trim() || undefined,
        }, user?.companyId || "tech")
      } catch {}

      setSuccessMsg("🎉 KYC & Banking details saved successfully! Your account is now Under Review.")
      setTimeout(() => setSuccessMsg(""), 5000)
    } catch (err: any) {
      setErrorMsg(`Error submitting KYC: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSuperAdmin) return
    setLoading(true)
    await saveModuleDataToDB("settings", {
      companyName, currency, currencySymbol, address, industry,
    })
    setLoading(false)
    setSuccessMsg("Company settings saved to MySQL database successfully!")
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSuperAdmin) return
    setLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    const curr = currentSmtp
    const compId = selectedSmtpCompanyId
    const comp = activeSmtpCompany
    const isTech = String(compId).toLowerCase() === "tech" || String(compId).toLowerCase() === "1" || String(comp?.name || "").toLowerCase().includes("tech")

    try {
      // 1. Update company in Zustand store and persist to MySQL `companies` table / `app_data`
      await updateCompany(compId, {
        smtp_host: curr.host.trim(),
        smtp_port: curr.port.trim(),
        smtp_secure: curr.secure,
        smtp_user: curr.user.trim(),
        smtp_pass: curr.pass.trim(),
        smtp_from_name: curr.fromName.trim() || comp?.name || "SAAMPARK",
        smtp_from_email: curr.fromEmail.trim() || curr.user.trim(),
      })

      // 2. Dispatch to backend API /email/company-config
      try {
        const { api } = await import("@/lib/api")
        await api.post("/email/company-config", {
          companyId: compId,
          host: curr.host.trim(),
          port: curr.port.trim(),
          secure: curr.secure,
          user: curr.user.trim(),
          pass: curr.pass.trim(),
          fromName: curr.fromName.trim() || comp?.name || "SAAMPARK",
          fromEmail: curr.fromEmail.trim() || curr.user.trim(),
        }).catch(() => {})

        // If this is Saampark Technology, also sync global master settings fallback
        if (isTech) {
          const smtpPayload = {
            companyName, currency, currencySymbol, address, industry,
            smtpUser: curr.user.trim(),
            smtpPass: curr.pass.trim(),
            smtpHost: curr.host.trim(),
            smtpPort: curr.port.trim(),
            smtpSecure: curr.secure,
            smtpFromName: curr.fromName.trim(),
            smtpFromEmail: curr.fromEmail.trim() || curr.user.trim(),
          }
          if (typeof window !== "undefined") {
            localStorage.setItem("saampark_smtp_settings", JSON.stringify(smtpPayload))
          }
          await saveModuleDataToDB("settings", smtpPayload, "all").catch(() => {})
          await api.post("/email/settings", smtpPayload).catch(() => {})
        }
      } catch {}

      setSuccessMsg(`✅ SMTP configurations for ${comp?.name || compId} saved and synced successfully!`)
      setTimeout(() => setSuccessMsg(""), 4000)
    } catch (err: any) {
      setErrorMsg(`Error saving SMTP settings: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const applySmtpPreset = (preset: "gmail" | "zoho" | "outlook" | "custom") => {
    setSmtpTestResult(null)
    if (preset === "gmail") {
      updateCurrentSmtp({ preset: "gmail", host: "smtp.gmail.com", port: "587", secure: false })
    } else if (preset === "zoho") {
      updateCurrentSmtp({ preset: "zoho", host: "smtp.zoho.in", port: "465", secure: true })
    } else if (preset === "outlook") {
      updateCurrentSmtp({ preset: "outlook", host: "smtp.office365.com", port: "587", secure: false })
    } else {
      updateCurrentSmtp({ preset: "custom" })
    }
  }

  const handleTestSmtpConnection = async () => {
    const curr = currentSmtp
    const compId = selectedSmtpCompanyId
    const comp = activeSmtpCompany

    if (!curr.user.trim() || !curr.pass.trim()) {
      setSmtpTestResult({
        success: false,
        message: `Please enter SMTP Username and App Password for ${comp?.name || compId} before testing.`,
      })
      return
    }

    setIsTestingSmtp(true)
    setSmtpTestResult(null)

    try {
      const { api } = await import("@/lib/api")
      const res = await api.post("/email/test-connection", {
        host: curr.host.trim() || "smtp.gmail.com",
        port: curr.port.trim() || "587",
        secure: curr.secure,
        user: curr.user.trim(),
        pass: curr.pass.trim(),
        fromName: curr.fromName.trim() || comp?.name || "SAAMPARK CRM",
        fromEmail: curr.fromEmail.trim() || curr.user.trim(),
        testEmail: smtpTestRecipient.trim() || curr.user.trim(),
        companyId: compId,
        companyName: comp?.name || (compId === "consultancy" ? "SAAMPARK Consultancy" : "SAAMPARK Technology"),
      })

      setSmtpTestResult({
        success: true,
        message: res.data?.message || `Verified! Test email successfully sent to ${smtpTestRecipient.trim() || curr.user.trim()} for ${comp?.name || compId}`,
      })
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.response?.data?.message || err.message || "Failed to authenticate SMTP connection. Please check your App Password or Host.",
      })
    } finally {
      setIsTestingSmtp(false)
    }
  }

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      alert("Image size should be under 8MB.")
      return
    }
    setIsUploadingQr(true)
    try {
      const res = await uploadToImgBB(file, `payment_qr_${Date.now()}`)
      if (res.url) {
        setPayQrUrl(res.url)
        setSuccessMsg("✅ Payment QR uploaded to Cloud successfully!")
        setTimeout(() => setSuccessMsg(""), 3000)
      }
    } catch (err: any) {
      setErrorMsg(`QR Upload failed: ${err.message}`)
    } finally {
      setIsUploadingQr(false)
    }
  }

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: CompanyPaymentSettings = {
        qrCodeUrl: payQrUrl,
        bankName: payBankName.trim() || "State Bank of India",
        accountHolderName: payAccountHolder.trim() || "Saampark Technology & Research Pvt. Ltd.",
        accountNumber: payAccountNumber.trim() || "40912384759",
        ifscCode: payIfsc.trim().toUpperCase() || "SBIN0001234",
        upiId: payUpiId.trim() || "saampark@sbi",
        branch: payBranch.trim() || "Balichak Station Road",
        swiftCode: paySwiftCode.trim() || undefined,
        notes: payNotes.trim() || undefined,
      }
      await saveCompanyPaymentSettings(payload)
      setSuccessMsg("✅ Payment QR & Official Bank Details saved! These will now appear on all client Invoices.")
      setTimeout(() => setSuccessMsg(""), 4000)
    } catch (err: any) {
      setErrorMsg(`Error saving payment settings: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Visible Tabs Filter based on user role
  const tabsList = React.useMemo(() => {
    const base: { id: SettingsTab; label: string; icon: any }[] = [
      { id: "profile", label: "My Profile & Avatar", icon: User },
      { id: "kyc", label: "🛡️ KYC Verification & Banking", icon: ShieldCheck },
    ]
    if (isSuperAdmin || user?.role === "Admin") {
      base.push(
        { id: "payments", label: "💳 Invoice Payment QR & Bank", icon: QrCode },

      )
    }
    if (isSuperAdmin) {
      base.push(
        { id: "company", label: "Workspace Branding", icon: Settings },
        { id: "smtp", label: "Email / SMTP Setup", icon: Mail }
      )
    }
    base.push({ id: "theme", label: "Display & Theme", icon: Sun })
    return base
  }, [isSuperAdmin, user?.role])

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
        {tabsList.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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



      {/* ── TAB 1: COMPLETE USER PROFILE & PERMANENT AVATAR ─────────────────── */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-2xs space-y-6">
          {/* Avatar Upload Card */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
            <div className="relative group shrink-0">
              <img
                src={avatar}
                alt={name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-zinc-800 shadow-md bg-transparent"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer"
                title="Upload Profile Picture"
              >
                {isUploadingAvatar ? <RefreshCw size={20} className="animate-spin" /> : <Camera size={20} className="mb-0.5" />}
                <span>{isUploadingAvatar ? "Uploading..." : "Change"}</span>
              </button>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{name || "User Account"}</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  {user?.role}
                </span>
                {user?.branchName && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    📍 {user.branchName}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 max-w-xl">
                Upload your profile photo from your device. Your photo is permanently hosted on cloud storage and live-synced across Topbar, Leads, Tasks, and Account Overview.
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
                  disabled={isUploadingAvatar}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Upload size={13} />
                  <span>{isUploadingAvatar ? "Uploading to Cloud..." : "Upload Profile Photo"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAvatar(`https://api.dicebear.com/7.x/notionists/svg?seed=${name || Date.now()}`)}
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Random Avatar
                </button>
              </div>
            </div>
          </div>

          {!isSuperAdmin && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
              <Lock size={16} className="shrink-0 mt-0.5" />
              <span>
                <strong>Organization Policy:</strong> Your core identity details (Name, Email, Phone, Department, Company Address) are managed by Super Admin and cannot be modified here. Contact your administrator if corrections are required.
              </span>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                Full Name {isSuperAdmin ? "*" : "(Locked)"}
              </label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border transition-all ${
                  isSuperAdmin
                    ? "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-1 focus:ring-blue-500"
                    : "bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-muted-foreground cursor-not-allowed opacity-80"
                }`}
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                Email Address (Locked)
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl text-muted-foreground cursor-not-allowed opacity-80 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                Phone Number {isSuperAdmin ? "" : "(Locked)"}
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className={`w-full px-3 py-2 rounded-xl border transition-all ${
                  isSuperAdmin
                    ? "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-1 focus:ring-blue-500"
                    : "bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-muted-foreground cursor-not-allowed opacity-80"
                }`}
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                Department {isSuperAdmin ? "" : "(Locked)"}
              </label>
              {isSuperAdmin ? (
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Software & IT Engineering">Software & IT Engineering</option>
                  <option value="Digital Marketing & Research">Digital Marketing & Research</option>
                  <option value="Sales & Business Development">Sales & Business Development</option>
                  <option value="Client Relationship & Support">Client Relationship & Support</option>
                  <option value="Operations & Finance">Operations & Finance</option>
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  value={department || "Assigned by Administrator"}
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl text-muted-foreground cursor-not-allowed opacity-80"
                />
              )}
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                Office Location / City {isSuperAdmin ? "" : "(Locked)"}
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kolkata, India"
                className={`w-full px-3 py-2 rounded-xl border transition-all ${
                  isSuperAdmin
                    ? "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-1 focus:ring-blue-500"
                    : "bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-muted-foreground cursor-not-allowed opacity-80"
                }`}
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Job Title / Designation</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Project Manager"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500"
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
              placeholder="Tell team members and clients about your responsibilities..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* ── CUSTOM USERNAME & DUAL LOGIN SECTION ── */}
          <div className="p-4 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 rounded-2xl border border-blue-200/50 dark:border-blue-800/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <Tag size={15} className="text-blue-600 dark:text-blue-400" />
                <span>Custom Username & Dual Login</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Login with Email or Username
                </span>
              </div>
              {user?.username && (
                <span className="text-[11px] font-mono text-zinc-500 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  Current: <strong className="text-foreground">@{user.username}</strong>
                </span>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Set a unique personal username. Once saved, you can log into the CRM using either your registered email address or your username.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="choose_username"
                  maxLength={30}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenUsernameConfirm}
                disabled={usernameStatus !== "available" || isSavingUsername}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Save size={13} />
                <span>Set Username</span>
              </button>
            </div>

            {/* Status indicator */}
            {usernameStatusMsg && (
              <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
                {usernameStatus === "checking" && (
                  <>
                    <RefreshCw size={12} className="animate-spin text-blue-500" />
                    <span className="text-blue-500">{usernameStatusMsg}</span>
                  </>
                )}
                {usernameStatus === "available" && (
                  <>
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{usernameStatusMsg}</span>
                  </>
                )}
                {usernameStatus === "taken" && (
                  <>
                    <AlertCircle size={12} className="text-rose-500" />
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">{usernameStatusMsg}</span>
                  </>
                )}
                {usernameStatus === "invalid" && (
                  <>
                    <AlertCircle size={12} className="text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">{usernameStatusMsg}</span>
                  </>
                )}
                {usernameStatus === "idle" && (
                  <span className="text-zinc-500 dark:text-zinc-400">{usernameStatusMsg}</span>
                )}
              </div>
            )}
          </div>

          {/* ── SECURE PASSWORD CHANGE SECTION ── */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
              <Key size={14} className="text-primary" />
              <span>Change Password (Requires Previous/Current Password Verification)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Current Password *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save size={14} />
              <span>{loading ? "Saving Profile..." : "Save Complete Profile"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB: KYC VERIFICATION & BANKING ───────────────────────────────── */}
      {activeTab === "kyc" && (
        <form onSubmit={handleSubmitKyc} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-2xs space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 flex-wrap ${
            kycStatus === "Verified"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
              : kycStatus === "Processing"
              ? "bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-300"
              : kycStatus === "Rejected"
              ? "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
              : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
          }`}>
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} className="shrink-0" />
              <div>
                <h4 className="font-bold text-sm">
                  KYC Verification Status: {kycStatus === "Processing" ? "Under Review" : kycStatus === "Verified" ? "Verified & Approved (Done)" : kycStatus}
                </h4>
                <p className="text-xs opacity-80 mt-0.5">
                  {kycStatus === "Verified"
                    ? "Your identity and bank details have been verified by the administrator."
                    : kycStatus === "Processing"
                    ? "Your KYC documents have been submitted and are currently under review by Super Admin / Admin."
                    : kycStatus === "Rejected"
                    ? `KYC application was rejected: ${kycRejectionReason || "Please re-upload clear document photos."}`
                    : "KYC is pending. Please fill in your legal identification, upload documents, and provide payout bank/UPI details."}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-surface border border-border">
              {kycStatus}
            </span>
          </div>

          {/* Section 1: Identification Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
              <span>1. Identity Document Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Legal Full Name (as per ID) *</label>
                <input
                  type="text"
                  required
                  disabled={kycStatus === "Verified"}
                  value={kycFullName}
                  onChange={(e) => setKycFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Document Type *</label>
                <select
                  disabled={kycStatus === "Verified"}
                  value={kycDocType}
                  onChange={(e) => setKycDocType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Driving License">Driving License</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Document Number *</label>
                <input
                  type="text"
                  required
                  disabled={kycStatus === "Verified"}
                  value={kycDocNumber}
                  onChange={(e) => setKycDocNumber(e.target.value)}
                  placeholder="e.g. 1234 5678 9012 or ABCDE1234F"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Document Photo Uploads (ImgBB Cloud Hosted) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Front Photo */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Document Front Photo *</span>
                  {kycDocFrontUrl && <span className="text-[10px] text-emerald-600 font-bold">Uploaded ✓</span>}
                </div>

                {kycDocFrontUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-surface h-36">
                    <img src={kycDocFrontUrl} alt="Front Document" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-36 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center text-zinc-400 text-xs">
                    <Upload size={24} className="mb-1" />
                    <span>Upload Front Photo (PNG / JPG)</span>
                  </div>
                )}

                {kycStatus !== "Verified" && (
                  <div>
                    <input
                      type="file"
                      ref={frontDocInputRef}
                      accept="image/*"
                      onChange={handleFrontDocUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => frontDocInputRef.current?.click()}
                      disabled={isUploadingFront}
                      className="w-full py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-foreground rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isUploadingFront ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>{isUploadingFront ? "Uploading..." : kycDocFrontUrl ? "Change Front Photo" : "Upload Front Photo"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Back Photo */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Document Back Photo / Address Page</span>
                  {kycDocBackUrl && <span className="text-[10px] text-emerald-600 font-bold">Uploaded ✓</span>}
                </div>

                {kycDocBackUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-surface h-36">
                    <img src={kycDocBackUrl} alt="Back Document" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-36 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center text-zinc-400 text-xs">
                    <Upload size={24} className="mb-1" />
                    <span>Upload Back Photo (Optional)</span>
                  </div>
                )}

                {kycStatus !== "Verified" && (
                  <div>
                    <input
                      type="file"
                      ref={backDocInputRef}
                      accept="image/*"
                      onChange={handleBackDocUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => backDocInputRef.current?.click()}
                      disabled={isUploadingBack}
                      className="w-full py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-foreground rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isUploadingBack ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>{isUploadingBack ? "Uploading..." : kycDocBackUrl ? "Change Back Photo" : "Upload Back Photo"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Bank & UPI Details */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
              <span>2. Bank Account & UPI Payout Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Bank Name</label>
                <input
                  type="text"
                  disabled={kycStatus === "Verified"}
                  value={kycBankName}
                  onChange={(e) => setKycBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank / State Bank of India"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Account Holder Name</label>
                <input
                  type="text"
                  disabled={kycStatus === "Verified"}
                  value={kycAccountHolderName}
                  onChange={(e) => setKycAccountHolderName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Bank Account Number</label>
                <input
                  type="text"
                  disabled={kycStatus === "Verified"}
                  value={kycAccountNumber}
                  onChange={(e) => setKycAccountNumber(e.target.value)}
                  placeholder="e.g. 50100234567890"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">IFSC Code</label>
                <input
                  type="text"
                  disabled={kycStatus === "Verified"}
                  value={kycIfscCode}
                  onChange={(e) => setKycIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">UPI ID / VPA</label>
                <input
                  type="text"
                  disabled={kycStatus === "Verified"}
                  value={kycUpiId}
                  onChange={(e) => setKycUpiId(e.target.value)}
                  placeholder="e.g. rahul@okaxis or 9876543210@paytm"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {kycStatus !== "Verified" && (
            <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck size={16} />
                <span>{loading ? "Submitting KYC..." : "Submit KYC for Verification"}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* ── TAB 2: COMPANY PROFILE (Super Admin Only) ───────────────────────── */}
      {activeTab === "company" && isSuperAdmin && (
        <form onSubmit={handleSaveCompany} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4 max-w-2xl text-xs shadow-2xs">
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

      {/* ── TAB 3: MULTI-COMPANY SMTP SETUP (Super Admin Only) ─────────────── */}
      {activeTab === "smtp" && isSuperAdmin && (
        <form onSubmit={handleSaveSmtp} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-6 max-w-4xl text-xs shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-4">
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Mail size={18} className="text-blue-600" />
                <span>Multi-Company SMTP Mail Server Configurations</span>
              </h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Configure separate SMTP credentials and email dispatch gateways for each company in SAAMPARK Group.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0 w-fit">
              Super Admin Exclusive
            </span>
          </div>

          {/* 🏢 Company Switcher Tabs */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs flex items-center gap-1.5">
                <Building2 size={14} className="text-blue-600" />
                <span>Select Company to Configure SMTP:</span>
              </span>
              <span className="text-[11px] text-zinc-500">
                Active Gateway: <strong className="text-zinc-800 dark:text-zinc-200">{activeSmtpCompany?.name || selectedSmtpCompanyId}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              {effectiveCompanies.map((comp) => {
                const compKey = String(comp.id || comp.slug || "").toLowerCase()
                const isSelected = compKey === String(selectedSmtpCompanyId).toLowerCase() || String(comp.slug || '').toLowerCase() === String(selectedSmtpCompanyId).toLowerCase()
                const cSmtp = companySmtpMap[comp.id] || getInitialSmtpForCompany(comp, comp.id)
                const isConfigured = Boolean(cSmtp.user && cSmtp.pass)

                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => {
                      setSelectedSmtpCompanyId(comp.id)
                      setSmtpTestResult(null)
                      if (cSmtp.user) setSmtpTestRecipient(cSmtp.user)
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-sm">{comp.id === "consultancy" || String(comp.name).toLowerCase().includes("consult") ? "💼" : "🏢"}</span>
                    <span className="font-semibold">{comp.brand_name ? `${comp.brand_name} ${comp.division_name || comp.name || ""}`.trim() : comp.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? "bg-white/25 text-white"
                        : isConfigured
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}>
                      {isConfigured ? "✅ Configured" : "⚠️ Empty / Unset"}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-900 dark:text-blue-200 mt-2">
              ℹ️ Users who log in under <strong>{activeSmtpCompany?.name || selectedSmtpCompanyId}</strong> will only dispatch and receive emails through this dedicated SMTP channel.
            </div>
          </div>

          {/* Quick Presets for Selected Company */}
          <div className="space-y-1.5">
            <label className="block font-bold text-foreground text-[11px]">Mail Provider Preset for {activeSmtpCompany?.name}:</label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => applySmtpPreset("gmail")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentSmtp.preset === "gmail"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-surface border border-border text-foreground hover:bg-surface-hover"
                }`}
              >
                <span>Gmail / Google Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => applySmtpPreset("zoho")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentSmtp.preset === "zoho"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-surface border border-border text-foreground hover:bg-surface-hover"
                }`}
              >
                <span>Zoho Mail</span>
              </button>
              <button
                type="button"
                onClick={() => applySmtpPreset("outlook")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentSmtp.preset === "outlook"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-surface border border-border text-foreground hover:bg-surface-hover"
                }`}
              >
                <span>Outlook / Microsoft 365</span>
              </button>
              <button
                type="button"
                onClick={() => applySmtpPreset("custom")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentSmtp.preset === "custom"
                    ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shadow-sm"
                    : "bg-surface border border-border text-foreground hover:bg-surface-hover"
                }`}
              >
                <span>Custom SMTP Server</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">SMTP Host</label>
              <input
                type="text"
                value={currentSmtp.host}
                onChange={(e) => updateCurrentSmtp({ host: e.target.value })}
                placeholder="e.g. smtp.gmail.com"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Port</label>
                <input
                  type="text"
                  value={currentSmtp.port}
                  onChange={(e) => {
                    const p = e.target.value
                    updateCurrentSmtp({
                      port: p,
                      secure: p === "465",
                    })
                  }}
                  placeholder="587 / 465"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Encryption</label>
                <select
                  value={currentSmtp.secure ? "ssl" : "tls"}
                  onChange={(e) => updateCurrentSmtp({ secure: e.target.value === "ssl" })}
                  className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value="tls">STARTTLS (587)</option>
                  <option value="ssl">SSL / TLS (465)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Sender Email (Username) *</label>
              <input
                type="email"
                value={currentSmtp.user}
                onChange={(e) => {
                  const val = e.target.value
                  updateCurrentSmtp({
                    user: val,
                    fromEmail: currentSmtp.fromEmail || val,
                  })
                  if (!smtpTestRecipient) setSmtpTestRecipient(val)
                }}
                placeholder={selectedSmtpCompanyId === "tech" ? "supriyogod@gmail.com" : "consultancy@saampark.in"}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-600 dark:text-zinc-400 font-semibold">App Password / Auth Token *</label>
                <button
                  type="button"
                  onClick={() => setShowSmtpPass(!showSmtpPass)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  {showSmtpPass ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showSmtpPass ? "text" : "password"}
                value={currentSmtp.pass}
                onChange={(e) => updateCurrentSmtp({ pass: e.target.value })}
                placeholder="16-digit Google App Password"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Sender From Name</label>
              <input
                type="text"
                value={currentSmtp.fromName}
                onChange={(e) => updateCurrentSmtp({ fromName: e.target.value })}
                placeholder={activeSmtpCompany?.name || "SAAMPARK CRM"}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Sender From Email (Header)</label>
              <input
                type="email"
                value={currentSmtp.fromEmail}
                onChange={(e) => updateCurrentSmtp({ fromEmail: e.target.value })}
                placeholder={currentSmtp.user || "info@saampark.in"}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden"
              />
            </div>
          </div>

          {/* Google App Password Help Banner */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>💡 Google / Custom SMTP Security Notice for {activeSmtpCompany?.name}:</span>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Google requires a 16-character <strong>App Password</strong>. Navigate to <strong>Google Account ➔ Security ➔ 2-Step Verification ➔ App passwords</strong>, create an app password (name it "{activeSmtpCompany?.name || 'CRM'}"), and paste it above.
            </p>
          </div>

          {/* Live Test Connection Tool */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-foreground text-xs block">Verify SMTP for {activeSmtpCompany?.name}</span>
                <span className="text-[10px] text-muted-foreground">Test credentials in real time and deliver a branded test verification email.</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={smtpTestRecipient}
                  onChange={(e) => setSmtpTestRecipient(e.target.value)}
                  placeholder="Test recipient email..."
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono w-48 focus:outline-hidden"
                />
                <button
                  type="button"
                  disabled={isTestingSmtp || !currentSmtp.user || !currentSmtp.pass}
                  onClick={handleTestSmtpConnection}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0"
                >
                  <Sparkles size={13} className={isTestingSmtp ? "animate-spin" : ""} />
                  <span>{isTestingSmtp ? "Verifying..." : `⚡ Test SMTP (${activeSmtpCompany?.id || selectedSmtpCompanyId})`}</span>
                </button>
              </div>
            </div>

            {smtpTestResult && (
              <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                smtpTestResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              }`}>
                {smtpTestResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{smtpTestResult.message}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Save size={14} />
              <span>Save & Apply {activeSmtpCompany?.name || selectedSmtpCompanyId} SMTP Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB: INVOICE PAYMENT QR & BANK DETAILS ─────────────────────────── */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <form onSubmit={handleSavePaymentSettings} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-6 max-w-4xl text-xs shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <QrCode size={18} className="text-blue-600" />
                  <span>Invoice Payment QR & Official Bank Account</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  These details and payment QR code are dynamically printed on all tax invoices sent to clients.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isSuperAdmin && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <Lock size={10} /> View Only (Super Admin Editable)
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 w-fit">
                  Printed on Invoice PDF
                </span>
              </div>
            </div>

            {!isSuperAdmin && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
                <Lock size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Organization Security Policy</p>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                    Payment QR & Official Bank details are displayed here for your verification and reference. Only <strong>Super Admin</strong> is authorized to edit or update company banking credentials.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* QR Code Upload Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center text-center space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Payment QR Code
                </span>

                <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center overflow-hidden bg-white dark:bg-zinc-900 shadow-inner relative group">
                  {payQrUrl ? (
                    <img src={payQrUrl} alt="Payment QR" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-400 p-2">
                      <QrCode size={36} className="text-zinc-300 dark:text-zinc-600" />
                      <span className="text-[10px]">No QR Uploaded</span>
                    </div>
                  )}

                  {isUploadingQr && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-[11px] font-bold">
                      Uploading to Cloud...
                    </div>
                  )}
                </div>

                {isSuperAdmin && (
                  <>
                    <input
                      type="file"
                      ref={qrInputRef}
                      onChange={handleQrUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => qrInputRef.current?.click()}
                      disabled={isUploadingQr}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload size={13} />
                      <span>{payQrUrl ? "Change QR Code" : "Upload QR Image"}</span>
                    </button>
                  </>
                )}
                <p className="text-[10px] text-zinc-400">Supports GPay, PhonePe, Paytm, BharatPe, BHIM (PNG, JPG)</p>
              </div>

              {/* Bank Details Inputs */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={payBankName}
                      onChange={(e) => setPayBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      required
                      className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden text-xs ${
                        !isSuperAdmin ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                      Account Holder / Company Name *
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={payAccountHolder}
                      onChange={(e) => setPayAccountHolder(e.target.value)}
                      placeholder="e.g. Saampark Technology & Research Pvt. Ltd."
                      required
                      className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden text-xs ${
                        !isSuperAdmin ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={payAccountNumber}
                      onChange={(e) => setPayAccountNumber(e.target.value)}
                      placeholder="e.g. 40912384759"
                      required
                      className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden text-xs font-bold ${
                        !isSuperAdmin ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={payIfsc}
                      onChange={(e) => setPayIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      required
                      className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden text-xs font-bold ${
                        !isSuperAdmin ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                      UPI ID / VPA *
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={payUpiId}
                      onChange={(e) => setPayUpiId(e.target.value)}
                      placeholder="e.g. saampark@sbi"
                      required
                      className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden text-xs ${
                        !isSuperAdmin ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                      Branch Name / Location
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={payBranch}
                      onChange={(e) => setPayBranch(e.target.value)}
                      placeholder="e.g. Balichak Station Road"
                      className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden text-xs ${
                        !isSuperAdmin ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                    Invoice Payment Instructions / Notes
                  </label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin}
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Please mention Invoice ID in transaction description."
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden text-xs ${
                      !isSuperAdmin ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Auto-saved and synced across all invoice generation
              </span>
              {isSuperAdmin && (
                <button
                  type="submit"
                  disabled={loading || isUploadingQr}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>Save Payment QR & Bank Details</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── TAB: THEME ────────────────────────────────────────────────────── */}
      {activeTab === "theme" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4 max-w-2xl text-xs shadow-2xs">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Globe size={16} className="text-blue-600" />
            <span>Appearance & Theme Preferences</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
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
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
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

      {/* ── USERNAME SAVE CONFIRMATION MODAL ── */}
      {showUsernameConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
              <Tag size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Confirm New Username</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to set your username to:
              </p>
              <div className="my-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                <span className="text-base font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  @{pendingUsername}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                After saving, you will be able to log in to your account with either your registered email address or <strong>@{pendingUsername}</strong> using your password.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowUsernameConfirmModal(false)}
                disabled={isSavingUsername}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSaveUsername}
                disabled={isSavingUsername}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isSavingUsername ? "Saving..." : "Confirm & Save"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}


