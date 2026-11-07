"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShieldCheck, Clock, AlertCircle, XCircle, CheckCircle2, 
  FileText, Upload, Building2, MapPin, Phone, Mail, User, 
  CreditCard, Landmark, RefreshCw, LogOut, Sparkles, Check, 
  ChevronRight, ArrowRight, Eye, ShieldAlert, Award
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { updateUser, getUsers } from "@/app/feature/users/services/userService"
import { api } from "@/lib/api"
import { uploadToImgBB } from "@/lib/imgbbUpload"
import { createNotification } from "@/services/notificationService"

export function EmployeeKycGate({ children }: { children: React.ReactNode }) {
  const { user, logout, activeCompanyId, companies } = useAuthStore()

  // Only Teams role needs employee onboarding KYC gate
  const isEmployeeRole = user?.role === "Teams"
  const isKycVerified = user?.kycStatus === "Verified"

  // If user is Super Admin, Admin, Clients, or already Verified, show normal app
  if (!user || !isEmployeeRole || isKycVerified) {
    return <>{children}</>
  }

  return <EmployeeKycGateContent user={user} logout={logout} />
}

function EmployeeKycGateContent({ user, logout }: { user: any; logout: () => void }) {
  const storeUser = useAuthStore((s) => s.user)

  // Dedicated backup localStorage lookup for this employee
  const getKycBackup = React.useCallback(() => {
    try {
      const emailOrId = (user?.email || user?.id || "").toLowerCase().trim()
      if (!emailOrId) return null
      const key = `saampark_kyc_submission_${emailOrId}`
      const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }, [user?.email, user?.id])

  const [localUser, setLocalUser] = React.useState<any>(() => {
    const backup = getKycBackup()
    const base = storeUser || user
    if (backup && (!base?.kycData || !base?.kycData?.docNumber)) {
      return {
        ...base,
        kycStatus: backup.kycStatus || "Processing",
        kycData: backup.kycData || backup,
      }
    }
    return base
  })

  // Track if this user has already submitted KYC
  const [isSubmittedLocally, setIsSubmittedLocally] = React.useState<boolean>(() => {
    if (user?.kycStatus === "Processing" || user?.kycData?.docNumber) return true
    return Boolean(getKycBackup())
  })

  React.useEffect(() => {
    if (storeUser) {
      setLocalUser((prev: any) => {
        const backup = getKycBackup()
        const resolvedKycStatus = storeUser.kycStatus || backup?.kycStatus || prev?.kycStatus || "Pending"
        const resolvedKycData = storeUser.kycData || backup?.kycData || prev?.kycData
        return {
          ...prev,
          ...storeUser,
          kycStatus: resolvedKycStatus,
          kycData: resolvedKycData,
        }
      })
    }
  }, [storeUser, getKycBackup])

  const effectiveUser = localUser || storeUser || user
  const backupData = getKycBackup()
  const kycStatus = effectiveUser?.kycStatus || backupData?.kycStatus || (effectiveUser?.kycData?.docNumber ? "Processing" : "Pending")
  const hasSubmittedKyc = Boolean(
    isSubmittedLocally ||
    effectiveUser?.kycData?.docNumber || 
    effectiveUser?.kycStatus === "Processing" || 
    effectiveUser?.kycStatus === "Verified" ||
    Boolean(backupData?.docNumber || backupData?.kycData?.docNumber)
  )

  const [isReuploading, setIsReuploading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)

  // Form State prefilled from existing data
  const [fullName, setFullName] = React.useState(effectiveUser?.kycData?.fullName || backupData?.kycData?.fullName || effectiveUser?.name || "")
  const [phone, setPhone] = React.useState(effectiveUser?.phone || "")
  const [emergencyContactName, setEmergencyContactName] = React.useState((effectiveUser as any)?.emergencyContactName || "")
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState(effectiveUser?.emergencyContact || (effectiveUser as any)?.emergencyContactPhone || "")
  const [bloodGroup, setBloodGroup] = React.useState(effectiveUser?.bloodGroup || "O+")
  const [address, setAddress] = React.useState((effectiveUser as any)?.address || "")

  const [docType, setDocType] = React.useState<string>(effectiveUser?.kycData?.docType || backupData?.kycData?.docType || "Aadhaar Card")
  const [docNumber, setDocNumber] = React.useState(effectiveUser?.kycData?.docNumber || backupData?.kycData?.docNumber || "")
  const [docFrontUrl, setDocFrontUrl] = React.useState(effectiveUser?.kycData?.docFrontUrl || backupData?.kycData?.docFrontUrl || "")
  const [docBackUrl, setDocBackUrl] = React.useState(effectiveUser?.kycData?.docBackUrl || backupData?.kycData?.docBackUrl || "")

  const [bankName, setBankName] = React.useState(effectiveUser?.kycData?.bankName || backupData?.kycData?.bankName || "")
  const [accountHolderName, setAccountHolderName] = React.useState(effectiveUser?.kycData?.accountHolderName || backupData?.kycData?.accountHolderName || effectiveUser?.name || "")
  const [accountNumber, setAccountNumber] = React.useState(effectiveUser?.kycData?.accountNumber || backupData?.kycData?.accountNumber || "")
  const [confirmAccountNumber, setConfirmAccountNumber] = React.useState(effectiveUser?.kycData?.accountNumber || backupData?.kycData?.accountNumber || "")
  const [ifscCode, setIfscCode] = React.useState(effectiveUser?.kycData?.ifscCode || backupData?.kycData?.ifscCode || "")
  const [upiId, setUpiId] = React.useState(effectiveUser?.kycData?.upiId || backupData?.kycData?.upiId || "")

  const [declarationAccepted, setDeclarationAccepted] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [uploadingFront, setUploadingFront] = React.useState(false)
  const [uploadingBack, setUploadingBack] = React.useState(false)

  // File Upload Handlers
  const handleFileUpload = async (file: File, target: "front" | "back") => {
    if (!file) return
    const setUploading = target === "front" ? setUploadingFront : setUploadingBack
    const setUrl = target === "front" ? setDocFrontUrl : setDocBackUrl

    setUploading(true)
    setFormError(null)
    try {
      const res = await uploadToImgBB(file, `${effectiveUser?.name || "employee"}_kyc_${target}`, 1200)
      if (res && res.url) {
        setUrl(res.url)
      } else {
        // Fallback: Read as base64 data URL
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) setUrl(String(e.target.result))
        }
        reader.readAsDataURL(file)
      }
    } catch (err: any) {
      console.warn("Upload error, using local data URL fallback:", err)
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) setUrl(String(e.target.result))
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  // Refresh status check against database
  const handleCheckStatus = async () => {
    setIsRefreshing(true)
    setStatusMessage(null)
    try {
      // 1. First fetch direct profile from MySQL users table
      const userIdOrEmail = effectiveUser?.id || effectiveUser?.email
      let freshUser: any = null
      if (userIdOrEmail) {
        try {
          const res: any = await api.get(`/users/${encodeURIComponent(userIdOrEmail)}`)
          freshUser = res?.data || res
        } catch {}
      }

      // 2. Fallback to getUsers if direct fetch wasn't available
      if (!freshUser || !freshUser.id) {
        try {
          const allUsers = await getUsers("all")
          freshUser = allUsers.find(
            (u) =>
              String(u.id) === String(effectiveUser?.id) ||
              (u.email && u.email.toLowerCase().trim() === effectiveUser?.email?.toLowerCase().trim())
          )
        } catch {}
      }

      if (freshUser) {
        let freshKyc = freshUser.kyc_status || freshUser.kycStatus
        let freshKycData = freshUser.kyc_data || freshUser.kycData
        if (typeof freshKycData === "string") {
          try { freshKycData = JSON.parse(freshKycData) } catch {}
        }

        // Never downgrade to Pending if submission exists
        if (!freshKyc || freshKyc === "Pending") {
          if (freshKycData?.docNumber || effectiveUser?.kycData?.docNumber || isSubmittedLocally) {
            freshKyc = "Processing"
          } else {
            freshKyc = "Pending"
          }
        }

        const merged = {
          ...effectiveUser,
          ...freshUser,
          kycStatus: freshKyc,
          kycData: freshKycData || effectiveUser?.kycData,
        }
        setLocalUser(merged)
        useAuthStore.setState({ user: merged })
        setIsSubmittedLocally(freshKyc === "Processing" || freshKyc === "Verified" || Boolean(merged.kycData?.docNumber))

        if (freshKyc === "Verified") {
          setStatusMessage("KYC verification approved! Loading workspace...")
          setTimeout(() => {
            if (typeof window !== "undefined") window.location.reload()
          }, 800)
          return
        }
        setStatusMessage(`Current Status: Under Review by Management (${freshKyc})`)
      } else {
        setStatusMessage("Documents are currently under review by Branch Management.")
      }
    } catch {
      setStatusMessage("Verification status: Under review.")
    } finally {
      setIsRefreshing(false)
      setTimeout(() => setStatusMessage(null), 4000)
    }
  }

  // Form Submit
  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!fullName.trim()) {
      setFormError("Please enter your full legal name.")
      return
    }
    if (!docNumber.trim()) {
      setFormError(`Please enter your valid ${docType} number.`)
      return
    }
    if (!docFrontUrl) {
      setFormError("Please upload the front photo of your government identity document.")
      return
    }
    if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      setFormError("Please provide your complete bank account details for salary remittance.")
      return
    }
    if (accountNumber.trim() !== confirmAccountNumber.trim()) {
      setFormError("Bank account numbers do not match. Please re-enter carefully.")
      return
    }
    if (!declarationAccepted) {
      setFormError("Please accept the legal declaration before submitting.")
      return
    }

    setIsSubmitting(true)
    try {
      const kycDataPayload = {
        fullName: fullName.trim(),
        docType: docType as any,
        docNumber: docNumber.trim().toUpperCase(),
        docFrontUrl,
        docBackUrl: docBackUrl || undefined,
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim() || fullName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        upiId: upiId.trim() || undefined,
        submittedAt: new Date().toISOString(),
        rejectionReason: undefined,
      }

      const updatedUser = {
        ...effectiveUser,
        phone: phone.trim() || effectiveUser?.phone,
        bloodGroup,
        emergencyContact: emergencyContactPhone.trim() || (effectiveUser as any)?.emergencyContact,
        emergencyContactName: emergencyContactName.trim(),
        address: address.trim(),
        kycStatus: "Processing" as const,
        kycData: kycDataPayload,
      }

      // 1. Immediately lock submitted state in component UI
      setIsSubmittedLocally(true)
      setIsReuploading(false)
      setLocalUser(updatedUser)

      // 2. Save dedicated backup key to localStorage for this specific employee
      try {
        const emailOrId = (effectiveUser?.email || effectiveUser?.id || "").toLowerCase().trim()
        if (emailOrId) {
          const key = `saampark_kyc_submission_${emailOrId}`
          localStorage.setItem(key, JSON.stringify({
            kycStatus: "Processing",
            kycData: kycDataPayload,
            docNumber: kycDataPayload.docNumber,
            submittedAt: new Date().toISOString(),
          }))
        }
      } catch {}

      // 3. Immediately update global auth store
      useAuthStore.setState({
        user: updatedUser,
      })

      // 4. Update zustand persistent storage (saampark-auth-v3)
      try {
        const raw = localStorage.getItem("saampark-auth-v3")
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && parsed.state) {
            parsed.state.user = updatedUser
            localStorage.setItem("saampark-auth-v3", JSON.stringify(parsed))
          }
        }
      } catch {}

      // 5. Update live MySQL database & backend API
      try {
        await updateUser(effectiveUser?.id || effectiveUser?.email, updatedUser)
        // Also call api.put directly to ensure MySQL users table has kyc_status & kyc_data immediately!
        await api.put(`/users/${encodeURIComponent(effectiveUser?.id || effectiveUser?.email)}`, {
          kyc_status: "Processing",
          kycStatus: "Processing",
          kyc_data: kycDataPayload,
          kycData: kycDataPayload,
          phone: phone.trim() || undefined,
        }).catch(err => console.warn("Direct /users KYC put warning:", err))
      } catch (saveErr) {
        console.warn("Background updateUser warning:", saveErr)
      }

      // 6. Notify Super Admin / Branch Admin
      createNotification({
        title: `New Team KYC Submitted: ${fullName.trim()}`,
        message: `${fullName.trim()} (${effectiveUser?.branchName || "Branch"}) has submitted KYC documents awaiting review.`,
        type: "system",
        targetUserId: "admin",
      }).catch(() => {})

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("saampark_kyc_updated", { detail: updatedUser }))
      }
    } catch (err: any) {
      console.error("KYC submit error:", err)
      setFormError(err?.message || "Failed to submit KYC documents. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine whether to show the submission form or the pending review screen
  const showForm = isReuploading || (!hasSubmittedKyc && kycStatus !== "Processing")

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-2 sm:px-4">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-indigo-400" />
              <span>SAAMPARK Group • Employee Onboarding &amp; Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {showForm ? "Submit Employee KYC Documents" : "KYC Documents Under Review"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {showForm
                ? "As an official team member, please submit your government identity and salary bank details for verification."
                : "Your onboarding credentials have been submitted and are currently awaiting review by management."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {isReuploading && (
              <button
                type="button"
                onClick={() => setIsReuploading(false)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-200 hover:text-white bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>Back to Status</span>
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* ─── CASE A: PENDING REVIEW SCREEN ─────────────────────────────────── */}
        {!showForm && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 text-zinc-900 dark:text-zinc-100"
          >
            {/* Status Hero */}
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10">
                  <Clock size={38} className="animate-pulse" />
                </div>
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white text-[11px] font-bold">
                  !
                </span>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  <Clock size={12} />
                  <span>Verification Pending Approval</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">Documents Under Review by Management</h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                  Your KYC documents and salary bank details have been safely received. Super Admin, Company Admin, or your Branch Admin ({effectiveUser?.branchName || "Main Branch"}) will verify your credentials.
                </p>
              </div>
            </div>

            {/* 4-Step Progress Tracker */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-4">
                Onboarding Progress Timeline:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/30">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold block text-emerald-600 dark:text-emerald-400">Step 1: Joined</strong>
                    <span className="text-[10px] text-zinc-500">Account Created</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/30">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold block text-emerald-600 dark:text-emerald-400">Step 2: PIN Setup</strong>
                    <span className="text-[10px] text-zinc-500">4-Digit PIN Active</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/30">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold block text-emerald-600 dark:text-emerald-400">Step 3: KYC Sent</strong>
                    <span className="text-[10px] text-zinc-500">Documents Submitted</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/40 animate-pulse">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Clock size={14} />
                  </div>
                  <div>
                    <strong className="text-xs font-bold block text-amber-700 dark:text-amber-300">Step 4: Verification</strong>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">In Progress</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submitted Summary Details Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Submitted Identity Document:
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <FileText size={14} className="text-indigo-500" />
                    <span>{effectiveUser?.kycData?.docType || "Aadhaar Card"}</span>
                  </span>
                  <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    {effectiveUser?.kycData?.docNumber ? `•••• •••• ${String(effectiveUser.kycData.docNumber).slice(-4)}` : "Submitted"}
                  </span>
                </div>
                {effectiveUser?.kycData?.submittedAt && (
                  <p className="text-[10px] text-zinc-500">
                    Submitted: {new Date(effectiveUser.kycData.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Salary Remittance Bank Account:
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Landmark size={14} className="text-emerald-500" />
                    <span>{effectiveUser?.kycData?.bankName || "Bank Account"}</span>
                  </span>
                  <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {effectiveUser?.kycData?.accountNumber ? `•••• •••• ${String(effectiveUser.kycData.accountNumber).slice(-4)}` : "Verified"}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  IFSC: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{effectiveUser?.kycData?.ifscCode || "SBIN0001234"}</strong>
                  {effectiveUser?.kycData?.upiId && ` • UPI: ${effectiveUser.kycData.upiId}`}
                </p>
              </div>
            </div>

            {/* Email Notification Notice */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
              <Mail size={18} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Automated Email Notification upon Approval:</strong>
                <span>
                  Once verified by management, you will automatically receive an official confirmation email to <strong>{effectiveUser?.email}</strong> and your full CRM workspace and permissions will unlock instantly.
                </span>
              </div>
            </div>

            {statusMessage && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-center text-xs font-bold text-blue-700 dark:text-blue-300">
                {statusMessage}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsReuploading(true)}
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                Edit or Re-upload Information
              </button>

              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isRefreshing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                <span>{isRefreshing ? "Checking Server..." : "Check Verification Status"}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── CASE B: KYC SUBMISSION FORM ───────────────────────────────────── */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl text-zinc-900 dark:text-zinc-100"
          >
            {kycStatus === "Rejected" && user.kycData?.rejectionReason && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 mb-6 flex items-start gap-3 text-xs">
                <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Verification Update - Correction Required:</strong>
                  <span>{user.kycData.rejectionReason}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitKyc} className="space-y-6">
              {/* SECTION 1: Personal Profile & Emergency Contact */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">1</div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Personal Identity &amp; Contact Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="As per Government ID"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Mobile Phone *</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                    >
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Emergency Contact Person Name *</label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Parent, Spouse, or Guardian"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Emergency Contact Phone Number *</label>
                    <input
                      type="text"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Permanent Residential Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Complete residential address with City, State, and Pincode"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* SECTION 2: Government Identity Proof */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Government Identity Document
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Document Type *</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="Aadhaar Card">Aadhaar Card (12 Digits)</option>
                      <option value="PAN Card">PAN Card (10 Characters)</option>
                      <option value="Voter ID">Voter ID / EPIC Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Document Number *</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                      placeholder={docType === "Aadhaar Card" ? "XXXX XXXX XXXX" : docType === "PAN Card" ? "ABCDE1234F" : "Document Identification No."}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase"
                    />
                  </div>
                </div>

                {/* Upload Photos Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front Photo */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-center space-y-3">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                      Document Front Side Photo *
                    </span>
                    {docFrontUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 max-h-36 mx-auto bg-black/10">
                        <img src={docFrontUrl} alt="Document Front" className="w-full h-32 object-contain" />
                        <button
                          type="button"
                          onClick={() => setDocFrontUrl("")}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer">
                        <Upload size={22} className="text-indigo-500 mb-1" />
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Upload Front Side</span>
                        <span className="text-[10px] text-zinc-400 mt-0.5">JPG, PNG or PDF (Max 10MB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "front")}
                          className="hidden"
                          disabled={uploadingFront}
                        />
                      </label>
                    )}
                    {uploadingFront && <p className="text-[10px] text-indigo-500 font-bold animate-pulse">Uploading Front Photo...</p>}
                  </div>

                  {/* Back Photo */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-center space-y-3">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                      Document Back Side Photo (Optional for PAN)
                    </span>
                    {docBackUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 max-h-36 mx-auto bg-black/10">
                        <img src={docBackUrl} alt="Document Back" className="w-full h-32 object-contain" />
                        <button
                          type="button"
                          onClick={() => setDocBackUrl("")}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer">
                        <Upload size={22} className="text-indigo-500 mb-1" />
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Upload Back Side</span>
                        <span className="text-[10px] text-zinc-400 mt-0.5">JPG, PNG or PDF (Max 10MB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "back")}
                          className="hidden"
                          disabled={uploadingBack}
                        />
                      </label>
                    )}
                    {uploadingBack && <p className="text-[10px] text-indigo-500 font-bold animate-pulse">Uploading Back Photo...</p>}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Salary Bank Account Remittance */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">3</div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Salary &amp; Expense Remittance Bank Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Bank Name *</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India, HDFC, PNB"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Full Name as per Bank Passbook"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Account Number *</label>
                    <input
                      type="password"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ""))}
                      placeholder="Enter Bank Account Number"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Confirm Account Number *</label>
                    <input
                      type="text"
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\s+/g, ""))}
                      placeholder="Re-enter to Confirm"
                      required
                      className={`w-full px-3 py-2 rounded-xl border ${confirmAccountNumber && confirmAccountNumber !== accountNumber ? "border-rose-500 bg-rose-50/20" : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"} text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Bank IFSC Code *</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                      placeholder="e.g. SBIN0001234"
                      maxLength={11}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">UPI VPA ID (Optional)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* SECTION 4: Legal Affirmation & Submit */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <label className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    I solemnly declare that all personal information, government identity documents, and bank details provided above are authentic, true, and complete. I authorize SAAMPARK Group to verify these credentials for operational onboarding and payroll remittance.
                  </span>
                </label>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  {effectiveUser?.kycData?.docNumber && (
                    <button
                      type="button"
                      onClick={() => setIsReuploading(false)}
                      className="text-xs font-bold text-zinc-500 hover:text-zinc-700 cursor-pointer"
                    >
                      ← Cancel &amp; View Current Review Status
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !declarationAccepted}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50 ml-auto"
                  >
                    <span>{isSubmitting ? "Submitting Documents..." : "Submit Verification Documents"}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  )
}

