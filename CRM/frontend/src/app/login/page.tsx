"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  Lock, Mail, CheckCircle2, Eye, EyeOff, 
  KeyRound, X, RefreshCw, Loader2, Check
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore, DEMO_USERS, Role } from "@/store/useAuthStore"
import { recordUserAccount, getStoredUserAccountsAsync, isUserDeleted, unmarkUserAsDeleted } from "@/app/feature/users/services/userService"
import { UserItem } from "@/app/feature/users/types"
import { fetchModuleDataFromDB, isGlobalItemDeleted, getLocalDeletedIds } from "@/lib/storageSync"
import { normalizeRole } from "@/store/usePermissionStore"
import { AuthService } from "@/services/apiServices"

type ForgotStep = "email" | "otp" | "newpass" | "done"

// ─── OTP Input Component ───────────────────────────────────────────────────────
function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = Array.from({ length: 6 }, () => React.useRef<HTMLInputElement>(null))
  const digits = value.padEnd(6, " ").split("").slice(0, 6)

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    if (e.key === "Backspace") {
      if (el.value === "" && i > 0) refs[i - 1].current?.focus()
    }
  }

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1)
    const arr = value.padEnd(6, " ").split("")
    arr[i] = v || " "
    onChange(arr.join("").trimEnd())
    if (v && i < 5) refs[i + 1].current?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    onChange(pasted)
    const nextIndex = Math.min(pasted.length, 5)
    refs[nextIndex].current?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-surface border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
          style={{ caretColor: "transparent" }}
        />
      ))}
    </div>
  )
}

// ─── Main Login Page ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const { loginAs } = useAuthStore()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState("")

  // Email Verification OTP State (after registration)
  const [verifyEmailModal, setVerifyEmailModal] = React.useState(false)
  const [verifyEmail, setVerifyEmail] = React.useState("")
  const [verifyOTP, setVerifyOTP] = React.useState("")
  const [verifyLoading, setVerifyLoading] = React.useState(false)
  const [verifyError, setVerifyError] = React.useState("")
  const [verifySuccess, setVerifySuccess] = React.useState(false)

  // Forgot Password States
  const [isForgotOpen, setIsForgotOpen] = React.useState(false)
  const [forgotStep, setForgotStep] = React.useState<ForgotStep>("email")
  const [forgotEmail, setForgotEmail] = React.useState("")
  const [forgotOTP, setForgotOTP] = React.useState("")
  const [forgotResetToken, setForgotResetToken] = React.useState("")
  const [forgotNewPass, setForgotNewPass] = React.useState("")
  const [forgotConfirmPass, setForgotConfirmPass] = React.useState("")
  const [forgotLoading, setForgotLoading] = React.useState(false)
  const [forgotError, setForgotError] = React.useState("")
  const [forgotMsg, setForgotMsg] = React.useState("")
  const [resendCooldown, setResendCooldown] = React.useState(0)

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendCooldown])

  // Check for inactive session logout redirect notice or session expiry
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const notice = sessionStorage.getItem("saampark_inactive_logout")
      const searchParams = new URLSearchParams(window.location.search)
      const searchParamError = searchParams.get("error")
      const searchParamReason = searchParams.get("reason")

      if (notice || searchParamReason === "inactivity") {
        setError("You have been automatically logged out due to 30 minutes of inactivity. Please log in again.")
        sessionStorage.removeItem("saampark_inactive_logout")
      } else if (searchParamReason === "session_expired") {
        setError("Your session ended after closing the browser. Please log in to continue.")
      } else if (searchParamError === "inactive") {
        setError("Your account is on inactive stage, please contact your administration.")
      }
    }
  }, [])

  // ─── FORGOT PASSWORD MODAL HANDLER ───────────────────────────────────────────
  const openForgotModal = () => {
    setForgotEmail(email)
    setForgotStep("email")
    setForgotOTP("")
    setForgotNewPass("")
    setForgotConfirmPass("")
    setForgotError("")
    setForgotMsg("")
    setIsForgotOpen(true)
  }

  // ─── LOGIN HANDLER ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const normalizedInput = email.toLowerCase().replace(/^@/, "").trim()

    try {
      // 1. Fetch active registered user accounts from MySQL database
      unmarkUserAsDeleted(normalizedInput)
      const registeredAccounts = await getStoredUserAccountsAsync()

      // Check if user is attempting to log in with an old transferred/obsolete email address
      const obsoleteAccount = registeredAccounts.find((acc) => {
        const mainEmail = (acc.email || "").toLowerCase().trim()
        const prevEmails = Array.isArray(acc.previousEmails)
          ? acc.previousEmails.map((pe) => (pe || "").toLowerCase().trim())
          : []
        const altEmail = ((acc as any).previousEmail || "").toLowerCase().trim()
        return mainEmail !== normalizedInput && (prevEmails.includes(normalizedInput) || altEmail === normalizedInput)
      })

      if (obsoleteAccount) {
        setIsLoading(false)
        setError(`This email address (${normalizedInput}) has been transferred to a new email. Please log in using your updated active email address.`)
        return
      }

      let dbAccount = registeredAccounts.find(
        (acc) =>
          (acc.email || "").toLowerCase().trim() === normalizedInput ||
          (acc.username && acc.username.toLowerCase().replace(/^@/, "").trim() === normalizedInput)
      )

      if (!dbAccount) {
        const allDbUsers = await fetchModuleDataFromDB<UserItem[]>("users", [], "all").catch(() => [])
        const obsoleteInAll = allDbUsers.find((acc) => {
          const mainEmail = (acc.email || "").toLowerCase().trim()
          const prevEmails = Array.isArray(acc.previousEmails)
            ? acc.previousEmails.map((pe) => (pe || "").toLowerCase().trim())
            : []
          const altEmail = ((acc as any).previousEmail || "").toLowerCase().trim()
          return mainEmail !== normalizedInput && (prevEmails.includes(normalizedInput) || altEmail === normalizedInput)
        })
        if (obsoleteInAll) {
          setIsLoading(false)
          setError(`This email address (${normalizedInput}) has been transferred to a new email. Please log in using your updated active email address.`)
          return
        }
        dbAccount = allDbUsers.find(
          (acc) =>
            (acc.email || "").toLowerCase().trim() === normalizedInput ||
            (acc.username && acc.username.toLowerCase().replace(/^@/, "").trim() === normalizedInput)
        )
      }

      // Ensure active account is un-suppressed
      if (dbAccount && dbAccount.email) {
        unmarkUserAsDeleted(dbAccount.email.toLowerCase().trim())
      }

      let backendUser: any = null
      let backendRole: Role | null = null

      // 2. Attempt backend API authentication
      try {
        const backendRes: any = await AuthService.login({ email: normalizedInput, password })
        if (backendRes?.data?.user || backendRes?.user) {
          backendUser = backendRes.data?.user || backendRes.user
          backendRole = normalizeRole(backendUser.role_name || backendUser.role || "")
          const token = backendRes.data?.token || backendRes.token
          if (token && typeof window !== "undefined") {
            localStorage.setItem("saampark_token", token)
          }
        } else if (backendRes?.status === "error" || (backendRes && backendRes.message)) {
          const msg: string = backendRes.message || ""
          if (msg.toLowerCase().includes("not verified")) {
            setVerifyEmail(normalizedInput)
            setVerifyEmailModal(true)
            setIsLoading(false)
            return
          }
          if (msg.toLowerCase().includes("company not available") || msg.toLowerCase().includes("company unavailable")) {
            setIsLoading(false)
            setError("Company not available. Please contact administrator.")
            return
          }
          console.warn("Backend auth attempt failed, checking database account store:", msg)
        }
      } catch (backendErr: any) {
        const msg: string = backendErr?.response?.data?.message || backendErr?.message || ""
        if (msg.toLowerCase().includes("not verified")) {
          setVerifyEmail(normalizedInput)
          setVerifyEmailModal(true)
          setIsLoading(false)
          return
        }
        if (msg.toLowerCase().includes("company not available") || msg.toLowerCase().includes("company unavailable")) {
          setIsLoading(false)
          setError("Company not available. Please contact administrator.")
          return
        }
        console.warn("Backend auth attempt failed, checking database account store:", msg)
      }

      // ── DETERMINE MATCHED ROLE & ACCOUNT ────────────────────────────────────
      let matchedRole: Role | null = backendRole
      let matchedAccount: any = backendUser

      // Check role_id mapping if backendRole wasn't Super Admin / Admin
      if (backendUser && backendUser.role_id) {
        const rid = parseInt(String(backendUser.role_id), 10)
        if (rid === 1) matchedRole = "Super Admin"
        else if (rid === 2) matchedRole = "Admin"
        else if (rid === 4) matchedRole = "Clients"
      }

      if (dbAccount) {
        const normDbRole = normalizeRole(dbAccount.role)
        matchedRole = normDbRole || matchedRole || "Teams"
        matchedAccount = { ...dbAccount, ...matchedAccount }

        // If backend auth didn't succeed, verify password with stored database password
        if (!backendUser) {
          const expectedPassword = dbAccount.password || (matchedRole === "Super Admin" ? "123456" : matchedRole === "Admin" ? "admin123" : "Password123")
          if (password !== expectedPassword) {
            setIsLoading(false)
            setError("Invalid password. Please check and try again.")
            return
          }
        }
      } else if (!matchedRole) {
        // Check demo accounts
        const matchedDemoKey = (Object.keys(DEMO_USERS) as Role[]).find(
          (r) => DEMO_USERS[r]?.email?.toLowerCase() === normalizedInput
        )
        if (matchedDemoKey && DEMO_USERS[matchedDemoKey]) {
          const demoObj = DEMO_USERS[matchedDemoKey]!
          matchedRole = normalizeRole(matchedDemoKey)
          matchedAccount = {
            id: String(demoObj.id),
            name: demoObj.name,
            email: demoObj.email,
            role: matchedDemoKey,
            companyId: demoObj.companyId,
            status: "Active",
            joinedDate: "2026-01-01",
          }
          const demoPass = matchedRole === "Super Admin" ? "123456" : matchedRole === "Admin" ? "admin123" : "Password123"
          if (password !== demoPass) {
            setIsLoading(false)
            setError("Invalid password.")
            return
          }
        }
      }

      if (!matchedAccount || !matchedRole) {
        setIsLoading(false)
        setError("Account does not exist. Please contact your System Administrator.")
        return
      }

      // ── INACTIVE ACCOUNT STATUS CHECK ───────────────────────────────────────
      const rawStatus = (matchedAccount.status || dbAccount?.status || "").toString().toLowerCase().trim()
      if (rawStatus === "inactive" || matchedAccount.is_active === false || (dbAccount as any)?.is_active === false) {
        setIsLoading(false)
        setError("Your account is on inactive stage, please contact your administration.")
        return
      }

      // ── DELETED COMPANY AVAILABILITY CHECK ──────────────────────────────────
      if (matchedRole !== "Super Admin") {
        if (matchedAccount.companyDeleted || matchedAccount.companyStatus === "deleted") {
          setIsLoading(false)
          setError("Company not available. Please contact administrator.")
          return
        }

        const userCompId = String(
          matchedAccount.companyId || 
          matchedAccount.company_id || 
          (Array.isArray(matchedAccount.companyIds) ? matchedAccount.companyIds[0] : "")
        ).toLowerCase().trim()

        if (userCompId) {
          const deletedIds = getLocalDeletedIds().map(d => String(d).toLowerCase().trim())
          if (deletedIds.includes(userCompId) || isGlobalItemDeleted(userCompId)) {
            setIsLoading(false)
            setError("Company not available. Please contact administrator.")
            return
          }
        }
      }

      const effectiveEmail = (matchedAccount.email || dbAccount?.email || (normalizedInput.includes("@") ? normalizedInput : "user@saampark.in")).toLowerCase().trim()

      // ── ROLE & PORTAL AUTO-ALIGNMENT ─────────────────────────────────────────
      if (
        effectiveEmail === "hiisupriya@gmail.com" || 
        effectiveEmail === "supriyo.main@gmail.com" || 
        effectiveEmail === "saampark.official@gmail.com"
      ) {
        matchedRole = "Super Admin"
      } else if (effectiveEmail === "saamparktechnologyresearch@gmail.com") {
        matchedRole = "Admin"
      }

      // ── SUCCESS ──────────────────────────────────────────────────────────────
      const displayName = effectiveEmail === "hiisupriya@gmail.com" 
        ? "Supriya (Super Admin)" 
        : (matchedAccount.full_name || matchedAccount.name || dbAccount?.name || effectiveEmail)
      recordUserAccount({ ...matchedAccount, name: displayName, email: effectiveEmail, lastLogin: "Just now" })
      setSuccessMessage(`Welcome back, ${displayName}! 👋`)
      setSuccess(true)

      let parsedCompanyIds: string[] = []
      const rawCompIds = matchedAccount.company_ids || matchedAccount.companyIds || dbAccount?.companyIds || (dbAccount as any)?.company_ids || backendUser?.company_ids
      if (typeof rawCompIds === "string") {
        try { parsedCompanyIds = JSON.parse(rawCompIds) } catch { parsedCompanyIds = [rawCompIds] }
      } else if (Array.isArray(rawCompIds)) {
        parsedCompanyIds = rawCompIds
      }
      if (!Array.isArray(parsedCompanyIds) || parsedCompanyIds.length === 0) {
        const fallbackSingle = matchedAccount.companyId || matchedAccount.company_id || dbAccount?.companyId || backendUser?.company_id || "tech"
        parsedCompanyIds = matchedRole === "Super Admin" ? ["tech", "digital"] : [fallbackSingle]
      }

      // If user is Super Admin, default to all companies across the group
      const selectedCompanyId = matchedRole === "Super Admin" ? "all" : (parsedCompanyIds[0] || "tech")

      loginAs(matchedRole, {
        id: String(matchedAccount.id || matchedAccount.email),
        name: displayName,
        email: effectiveEmail,
        username: matchedAccount.username || dbAccount?.username || (!normalizedInput.includes("@") ? normalizedInput : undefined),
        role: matchedRole,
        companyId: selectedCompanyId as any,
        companyIds: parsedCompanyIds,
        avatar: matchedAccount.avatarUrl || (matchedAccount as any).avatar || matchedAccount.avatar_url || dbAccount?.avatarUrl || (dbAccount as any)?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${effectiveEmail}`,
        avatarUrl: matchedAccount.avatarUrl || (matchedAccount as any).avatar || matchedAccount.avatar_url || dbAccount?.avatarUrl || (dbAccount as any)?.avatar || undefined,
        phone: matchedAccount.phone || dbAccount?.phone,
        allowedModules: matchedAccount.allowedModules || dbAccount?.allowedModules || (matchedAccount as any)?.permissions?.allowedModules,
        permissions: matchedAccount.permissions || dbAccount?.permissions,
      })

      setTimeout(() => {
        if (matchedRole === "Clients") {
          router.push("/feature/projects")
        } else if (matchedRole === "Teams") {
          router.push("/feature/tasks")
        } else {
          router.push("/feature/dashboard")
        }
      }, 900)

    } catch (err: any) {
      setIsLoading(false)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      if (!success) setIsLoading(false)
    }
  }

  // ─── EMAIL VERIFICATION OTP HANDLERS ────────────────────────────────────────
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verifyOTP.length < 6) { setVerifyError("Please enter the complete 6-digit OTP."); return }
    setVerifyLoading(true)
    setVerifyError("")
    try {
      await AuthService.verifyEmail({ email: verifyEmail, otp: verifyOTP })
      setVerifySuccess(true)
      setTimeout(() => {
        setVerifyEmailModal(false)
        setVerifyOTP("")
        setVerifySuccess(false)
      }, 2000)
    } catch (err: any) {
      setVerifyError(err?.response?.data?.message || "Invalid OTP. Please try again.")
    } finally {
      setVerifyLoading(false)
    }
  }

  // ─── FORGOT PASSWORD HANDLERS ────────────────────────────────────────────────
  const handleSendForgotOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) { setForgotError("Please enter your email address."); return }
    setForgotLoading(true)
    setForgotError("")
    try {
      await AuthService.sendForgotPasswordOTP({ email: forgotEmail.toLowerCase() })
      setForgotMsg("OTP sent! Check your inbox (also spam folder).")
      setForgotStep("otp")
      setResendCooldown(60)
    } catch (err: any) {
      setForgotError(err?.response?.data?.message || "Failed to send OTP. Please try again.")
    } finally {
      setForgotLoading(false)
    }
  }

  const handleVerifyForgotOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (forgotOTP.length < 6) { setForgotError("Please enter the complete 6-digit OTP."); return }
    setForgotLoading(true)
    setForgotError("")
    try {
      const res = await AuthService.verifyResetOTP({ email: forgotEmail.toLowerCase(), otp: forgotOTP })
      setForgotResetToken(res.data.resetToken)
      setForgotStep("newpass")
    } catch (err: any) {
      setForgotError(err?.response?.data?.message || "Invalid or expired OTP.")
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotNewPass || forgotNewPass.length < 6) { setForgotError("Password must be at least 6 characters."); return }
    if (forgotNewPass !== forgotConfirmPass) { setForgotError("Passwords do not match."); return }
    setForgotLoading(true)
    setForgotError("")
    try {
      await AuthService.resetPassword({ email: forgotEmail.toLowerCase(), newPassword: forgotNewPass, resetToken: forgotResetToken })
      // Safely update password in stored accounts without resetting role
      const stored = await getStoredUserAccountsAsync()
      const existing = stored.find(a => a.email.toLowerCase().trim() === forgotEmail.toLowerCase().trim())
      if (existing) {
        recordUserAccount({ ...existing, password: forgotNewPass })
      } else {
        recordUserAccount({ email: forgotEmail.toLowerCase().trim(), password: forgotNewPass })
      }
      setForgotStep("done")
      setForgotMsg("Password reset successfully! You can now log in.")
      setEmail(forgotEmail.toLowerCase())
      setPassword(forgotNewPass)
      setTimeout(() => setIsForgotOpen(false), 2500)
    } catch (err: any) {
      setForgotError(err?.response?.data?.message || "Failed to reset password.")
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    setForgotLoading(true)
    try {
      await AuthService.sendForgotPasswordOTP({ email: forgotEmail.toLowerCase() })
      setForgotMsg("New OTP sent!")
      setResendCooldown(60)
    } catch {}
    setForgotLoading(false)
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Ambient Liquid Glass Color Mesh */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent rounded-full blur-[140px] animate-liquid-1" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] bg-gradient-to-tl from-cyan-500/18 via-teal-500/12 to-transparent rounded-full blur-[140px] animate-liquid-2" />
        <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] max-w-[450px] max-h-[450px] bg-gradient-to-tr from-pink-500/10 via-amber-500/8 to-transparent rounded-full blur-[120px] animate-liquid-3" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(150,150,150,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(150,150,150,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />
      </div>

      <div className="w-full max-w-4xl z-10">
        <AnimatePresence mode="wait">

          {/* ── LOGIN FORM ──────────────────────────────────────────────── */}
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto liquid-glass-card rounded-[2rem] p-8 sm:p-10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] relative border border-white/40 dark:border-white/10"
          >
            <div className="flex flex-col items-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl liquid-glass-pill border border-white/40 dark:border-white/10 text-primary mb-3 shadow-lg p-2">
                <img src="/logo.png" alt="SAAMPARK Logo" className="w-full h-full rounded-xl object-contain" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                SAAMPARK Group CRM
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Enter your credentials to access your workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative">
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-sm rounded-2xl p-6 text-center"
                  >
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 size={32} />
                    </motion.div>
                    <p className="text-base font-bold text-foreground">{successMessage}</p>
                    <p className="text-xs text-muted-foreground mt-1">Entering your workspace...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email or Username */}
              <div>
                <label className="block text-xs font-medium mb-1">Email Address or Username *</label>
                <Input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-surface"
                  placeholder="e.g. user@saampark.in or your_username"
                  leftIcon={<Mail size={18} />}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium mb-1">Password *</label>
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-surface"
                  placeholder="••••••••"
                  leftIcon={<Lock size={18} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                  required
                />
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={openForgotModal}
                    className="text-xs font-medium text-primary hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium">
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-sm font-bold shadow-md mt-2 cursor-pointer"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 size={16} className="animate-spin" />
                    Authenticating...
                  </span>
                ) : "Sign In →"}
              </Button>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── EMAIL VERIFICATION MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {verifyEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl"
            >
              <button onClick={() => setVerifyEmailModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>

              {verifySuccess ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-success" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Email Verified!</h3>
                  <p className="text-sm text-muted-foreground mt-2">You can now sign in to your account.</p>
                </div>
              ) : (
                <form onSubmit={handleVerifyEmail} className="space-y-5">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Mail size={28} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Verify Your Email</h3>
                    <p className="text-sm text-muted-foreground mt-1">Enter the 6-digit OTP sent to</p>
                    <p className="text-sm font-semibold text-primary">{verifyEmail}</p>
                  </div>

                  <OTPInput value={verifyOTP} onChange={setVerifyOTP} />

                  {verifyError && <p className="text-xs text-danger text-center font-medium">{verifyError}</p>}

                  <Button type="submit" variant="primary" className="w-full h-11 font-bold" disabled={verifyLoading || verifyOTP.length < 6}>
                    {verifyLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Verify Email →"}
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FORGOT PASSWORD MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isForgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl"
            >
              <button onClick={() => setIsForgotOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10 text-primary"><KeyRound size={20} /></div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Reset Password</h3>
                  <p className="text-xs text-muted-foreground">
                    {forgotStep === "email" && "Enter your email to receive an OTP"}
                    {forgotStep === "otp" && "Enter the OTP from your email"}
                    {forgotStep === "newpass" && "Set a new password"}
                    {forgotStep === "done" && "All done!"}
                  </p>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="flex gap-1 mb-6">
                {(["email", "otp", "newpass", "done"] as ForgotStep[]).map((s, i) => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
                    forgotStep === "done" || i <= ["email","otp","newpass","done"].indexOf(forgotStep)
                      ? "bg-primary" : "bg-border"
                  }`} />
                ))}
              </div>

              {/* Step 1: Enter Email */}
              {forgotStep === "email" && (
                <form onSubmit={handleSendForgotOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Registered Email *</label>
                    <Input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-background"
                      leftIcon={<Mail size={16} />}
                    />
                  </div>
                  {forgotError && <p className="text-xs text-danger font-medium">{forgotError}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsForgotOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" className="flex-1" disabled={forgotLoading}>
                      {forgotLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Send OTP →"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 2: Enter OTP */}
              {forgotStep === "otp" && (
                <form onSubmit={handleVerifyForgotOTP} className="space-y-5">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">OTP sent to</p>
                    <p className="text-sm font-bold text-primary">{forgotEmail}</p>
                    {forgotMsg && <p className="text-xs text-success mt-1">{forgotMsg}</p>}
                  </div>

                  <OTPInput value={forgotOTP} onChange={setForgotOTP} />

                  {forgotError && <p className="text-xs text-danger text-center font-medium">{forgotError}</p>}

                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0 || forgotLoading}
                    className="w-full text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw size={12} />
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                  </button>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotStep("email")}>Back</Button>
                    <Button type="submit" variant="primary" className="flex-1" disabled={forgotLoading || forgotOTP.length < 6}>
                      {forgotLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Verify OTP →"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {forgotStep === "newpass" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">New Password *</label>
                    <Input
                      type="password"
                      required
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      placeholder="Min 6 characters"
                      className="bg-background"
                      leftIcon={<Lock size={16} />}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Confirm Password *</label>
                    <Input
                      type="password"
                      required
                      value={forgotConfirmPass}
                      onChange={(e) => setForgotConfirmPass(e.target.value)}
                      placeholder="Repeat new password"
                      className="bg-background"
                      leftIcon={<Lock size={16} />}
                    />
                  </div>
                  {forgotError && <p className="text-xs text-danger font-medium">{forgotError}</p>}
                  <Button type="submit" variant="primary" className="w-full h-11 font-bold" disabled={forgotLoading}>
                    {forgotLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Set New Password →"}
                  </Button>
                </form>
              )}

              {/* Step 4: Done */}
              {forgotStep === "done" && (
                <div className="flex flex-col items-center py-4 text-center space-y-3">
                  <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-success" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Password Reset!</h3>
                  <p className="text-sm text-muted-foreground">{forgotMsg}</p>
                  <p className="text-xs text-muted-foreground">Closing in a moment...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
