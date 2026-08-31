"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff, 
  KeyRound, X, Users, Briefcase, Shield, ArrowLeft, RefreshCw, Loader2,
  Building2, ChevronRight, Check
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore, DEMO_USERS, Role, getCompanyLogoUrl } from "@/store/useAuthStore"
import { recordUserAccount, getStoredUserAccountsAsync, isUserDeleted, unmarkUserAsDeleted } from "@/app/feature/users/services/userService"
import { UserItem } from "@/app/feature/users/types"
import { fetchModuleDataFromDB } from "@/lib/storageSync"
import { normalizeRole } from "@/store/usePermissionStore"
import { AuthService } from "@/services/apiServices"

type RoleChoice = "Teams" | "Clients" | "Admin" | null
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
  const { loginAs, companies, switchCompany } = useAuthStore()

  const [selectedRoleChoice, setSelectedRoleChoice] = React.useState<RoleChoice>(null)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState("")

  // Multi-Company Workspace Selector State
  const [multiCompanyModal, setMultiCompanyModal] = React.useState<{
    isOpen: boolean
    userData: any
    role: Role
    companyIds: string[]
  } | null>(null)

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

  const handleSelectRole = (choice: RoleChoice) => {
    setSelectedRoleChoice(choice)
    setError("")
    setEmail("")
    setPassword("")
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

      // ── STRICT PORTAL-BASED ROLE RESTRICTION ENFORCEMENT ─────────────────────
      if (selectedRoleChoice === "Admin") {
        if (matchedRole !== "Super Admin" && matchedRole !== "Admin") {
          setIsLoading(false)
          setError("Access Denied: This portal is reserved for Super Admin & System Administrators only. Please select the Team Member or Client Login portal.")
          return
        }
      } else if (selectedRoleChoice === "Teams") {
        if (matchedRole === "Super Admin" || matchedRole === "Admin") {
          setIsLoading(false)
          setError("Access Denied: Administrators and Super Admins must log in through the Administrator portal. Please choose the Administrator portal.")
          return
        }
        if (matchedRole === "Clients") {
          setIsLoading(false)
          setError("Access Denied: This portal is for internal Team Members only. Clients must log in through the Client Access portal.")
          return
        }
      } else if (selectedRoleChoice === "Clients") {
        if (matchedRole !== "Clients") {
          setIsLoading(false)
          setError("Access Denied: This portal is reserved for Client Access only. Staff and Administrators must log in through their designated portals.")
          return
        }
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

      // If user is assigned to multiple companies, prompt them with the Workspace Selection Screen
      if (parsedCompanyIds.length > 1) {
        setIsLoading(false)
        setMultiCompanyModal({
          isOpen: true,
          userData: {
            id: String(matchedAccount.id || matchedAccount.email),
            name: displayName,
            email: effectiveEmail,
            username: matchedAccount.username || dbAccount?.username || (!normalizedInput.includes("@") ? normalizedInput : undefined),
            role: matchedRole,
            avatar: matchedAccount.avatarUrl || (matchedAccount as any).avatar || matchedAccount.avatar_url || dbAccount?.avatarUrl || (dbAccount as any)?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${effectiveEmail}`,
            avatarUrl: matchedAccount.avatarUrl || (matchedAccount as any).avatar || matchedAccount.avatar_url || dbAccount?.avatarUrl || (dbAccount as any)?.avatar || undefined,
            phone: matchedAccount.phone || dbAccount?.phone,
            allowedModules: matchedAccount.allowedModules || dbAccount?.allowedModules || (matchedAccount as any)?.permissions?.allowedModules,
            permissions: matchedAccount.permissions || dbAccount?.permissions,
          },
          role: matchedRole,
          companyIds: parsedCompanyIds,
        })
        return
      }

      loginAs(matchedRole, {
        id: String(matchedAccount.id || matchedAccount.email),
        name: displayName,
        email: effectiveEmail,
        username: matchedAccount.username || dbAccount?.username || (!normalizedInput.includes("@") ? normalizedInput : undefined),
        role: matchedRole,
        companyId: (parsedCompanyIds[0] || "tech") as any,
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
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-info/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <div className="w-full max-w-4xl z-10">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: ROLE SELECTION ─────────────────────────────────────── */}
          {selectedRoleChoice === null ? (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <div>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-surface border border-border/80 text-primary mb-4 shadow-xl p-2">
                  <img src="/logo.png" alt="SAAMPARK Logo" className="w-full h-full rounded-2xl object-contain" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent flex items-center justify-center gap-3">
                  <img src="/logo.png" alt="SAAMPARK Logo" className="w-9 h-9 rounded-xl inline-block object-contain" />
                  <span>SAAMPARK Group CRM</span>
                </h1>
                <p className="text-muted-foreground text-base mt-2 max-w-md mx-auto">
                  Select your login portal to access your workspace
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5 w-full max-w-4xl">
                {/* Admin & Leadership Card */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleSelectRole("Admin")
                    setEmail("")
                    setPassword("")
                  }}
                  className="group relative p-6 rounded-3xl bg-surface/80 border border-border hover:border-amber-500/50 hover:bg-surface text-left shadow-xl transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield size={100} className="text-amber-500" />
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">👑</div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 uppercase tracking-wider mb-1.5">Executive & Admin</span>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-amber-500 transition-colors">Administrator</h2>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Super Admin and System Administrators with full system access.</p>
                  </div>
                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-amber-500">
                    <span>Admin Login</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>

                {/* Team Member Card */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleSelectRole("Teams")
                    setEmail("")
                    setPassword("")
                  }}
                  className="group relative p-6 rounded-3xl bg-surface/80 border border-border hover:border-primary/50 hover:bg-surface text-left shadow-xl transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users size={100} className="text-primary" />
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">👥</div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 uppercase tracking-wider mb-1.5">Internal Staff</span>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Team Member</h2>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Employees, department staff, telecallers and sales representatives.</p>
                  </div>
                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-primary">
                    <span>Team Login</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>

                {/* Client Card */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleSelectRole("Clients")
                    setEmail("")
                    setPassword("")
                  }}
                  className="group relative p-6 rounded-3xl bg-surface/80 border border-border hover:border-emerald-500/50 hover:bg-surface text-left shadow-xl transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Briefcase size={100} className="text-emerald-500" />
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">🤝</div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 uppercase tracking-wider mb-1.5">Client Portal</span>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-emerald-500 transition-colors">Client Access</h2>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">External clients, business owners and client portal users.</p>
                  </div>
                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                    <span>Client Login</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              </div>
            </motion.div>

          ) : (
            /* ── STEP 2: LOGIN FORM ──────────────────────────────────────────── */
            <motion.div
              key="credentials-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto bg-surface/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => { setSelectedRoleChoice(null); setError("") }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Choose different portal</span>
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedRoleChoice === "Clients" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                    : selectedRoleChoice === "Admin" ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                  }`}>
                    {selectedRoleChoice === "Clients" ? "🤝 Client Portal" : selectedRoleChoice === "Admin" ? "👑 Administrator Access" : "👥 Team Member"}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {selectedRoleChoice === "Clients" ? "Client Sign In" : selectedRoleChoice === "Admin" ? "Admin Sign In" : "Team Member Sign In"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Enter your registered email and password.</p>
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium">Password *</label>
                    <button
                      type="button"
                      onClick={openForgotModal}
                      className="text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
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
          )}
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

      {/* ── MULTI-COMPANY WORKSPACE SELECTION MODAL ───────────────────────── */}
      <AnimatePresence>
        {multiCompanyModal?.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card text-card-foreground border border-border rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 overflow-hidden relative"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  <Building2 size={28} />
                </div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Select Your Workspace</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Welcome back, <span className="font-semibold text-foreground">{multiCompanyModal.userData.name}</span>! Choose which organization dashboard you want to access:
                </p>
              </div>

              {/* Company Cards List */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {/* Global View for Super Admin */}
                {multiCompanyModal.role === "Super Admin" && (
                  <button
                    type="button"
                    onClick={() => {
                      const { userData, role, companyIds } = multiCompanyModal
                      loginAs(role, {
                        ...userData,
                        companyId: "all" as any,
                        companyIds: companyIds,
                      })
                      switchCompany("all")
                      setMultiCompanyModal(null)
                      setSuccess(true)
                      router.push("/feature/dashboard")
                    }}
                    className="w-full text-left p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-md">
                        ALL
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          <span>🌐 Consolidated Group View</span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            Super Admin
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          View aggregate metrics, invoices, and operations across all companies
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                {multiCompanyModal.companyIds.map((compId) => {
                  const compObj = companies.find(
                    (c) =>
                      String(c.id).toLowerCase().trim() === String(compId).toLowerCase().trim() ||
                      String(c.slug || "").toLowerCase().trim() === String(compId).toLowerCase().trim()
                  )
                  const compName = compObj?.brand_name || compObj?.name || (compId === "print" ? "Print Space India" : compId === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology")
                  const compSubtitle = compObj?.subtitle || compObj?.division_name || (compId === "print" ? "Commercial & Digital Printing" : compId === "digital" ? "Digital Growth & SEO" : "Web & IT Solutions")
                  const logoUrl = compObj ? getCompanyLogoUrl(compObj) : null

                  return (
                    <button
                      key={compId}
                      type="button"
                      onClick={() => {
                        const { userData, role, companyIds } = multiCompanyModal
                        loginAs(role, {
                          ...userData,
                          companyId: compId as any,
                          companyIds: companyIds,
                        })
                        switchCompany(compId)
                        setMultiCompanyModal(null)
                        setSuccess(true)
                        
                        if (role === "Clients") {
                          router.push("/feature/projects")
                        } else if (role === "Teams") {
                          router.push("/feature/tasks")
                        } else {
                          router.push("/feature/dashboard")
                        }
                      }}
                      className="w-full text-left p-4 rounded-2xl border border-border/80 bg-background hover:bg-surface hover:border-primary/50 hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {logoUrl ? (
                            <img src={logoUrl} alt={compName} className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="font-black text-sm text-primary uppercase">
                              {compName.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {compName}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {compSubtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <span className="hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">Launch</span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Footer Notice */}
              <div className="mt-6 pt-4 border-t border-border/60 text-center">
                <p className="text-xs text-muted-foreground">
                  💡 You can switch workspaces anytime from the top navigation bar.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
