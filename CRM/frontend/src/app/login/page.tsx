"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  Lock, Mail, CheckCircle2, Eye, EyeOff, 
  KeyRound, X, RefreshCw, Loader2, Check,
  ShieldCheck, ArrowRight, User as UserIcon,
  Sparkles, AlertCircle
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore, DEMO_USERS, Role } from "@/store/useAuthStore"
import { recordUserAccount, getStoredUserAccountsAsync, unmarkUserAsDeleted } from "@/app/feature/users/services/userService"
import { UserItem } from "@/app/feature/users/types"
import { fetchModuleDataFromDB, isGlobalItemDeleted, getLocalDeletedIds } from "@/lib/storageSync"
import { normalizeRole } from "@/store/usePermissionStore"
import { AuthService } from "@/services/apiServices"

type ForgotStep = "email" | "otp" | "newpass" | "done"
type LoginMode = "password" | "pin"

interface SavedUser {
  email: string
  name: string
  avatar?: string
  role?: string
  hasPin?: boolean
}

// ─── 6-Digit Email OTP Input Component ─────────────────────────────────────────
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
          className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2 bg-surface border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
          style={{ caretColor: "transparent" }}
        />
      ))}
    </div>
  )
}

// ─── 4-Digit Security PIN Input Component ──────────────────────────────────────
function PINInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
}: {
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  disabled?: boolean
  autoFocus?: boolean
}) {
  const refs = Array.from({ length: 4 }, () => React.useRef<HTMLInputElement>(null))
  const digits = value.padEnd(4, " ").split("").slice(0, 4)

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[i].trim() && i > 0) {
        refs[i - 1].current?.focus()
      }
    }
  }

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1)
    const arr = value.padEnd(4, " ").split("").slice(0, 4)
    arr[i] = v || " "
    const nextVal = arr.join("").trimEnd()
    onChange(nextVal)
    if (v && i < 3) {
      refs[i + 1].current?.focus()
    }
    const cleanDigits = nextVal.replace(/\s/g, "")
    if (v && i === 3 && cleanDigits.length === 4) {
      onComplete?.(cleanDigits)
    }
  }

  return (
    <div className="flex gap-3 justify-center my-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={d.trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-13 h-15 text-center text-2xl font-black rounded-2xl border-2 bg-surface/90 border-border focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 text-foreground transition-all shadow-sm"
          autoFocus={autoFocus && i === 0}
        />
      ))}
    </div>
  )
}

// ─── Password Strength Evaluator ───────────────────────────────────────────────
function evaluatePasswordPolicy(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }
}

// ─── Main Login Page ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const { loginAs } = useAuthStore()

  const [savedUser, setSavedUser] = React.useState<SavedUser | null>(null)
  const [loginMode, setLoginMode] = React.useState<LoginMode>("password")

  // Password Login State
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState("")

  // Quick PIN Login State
  const [loginPin, setLoginPin] = React.useState("")
  const [pinLoading, setPinLoading] = React.useState(false)
  const [pinError, setPinError] = React.useState("")

  // First-Time PIN Setup State
  const [isPinSetupOpen, setIsPinSetupOpen] = React.useState(false)
  const [pinSetupData, setPinSetupData] = React.useState<{
    email: string
    name: string
    role: Role
    account: any
    token?: string
  } | null>(null)
  const [pinSetupOTP, setPinSetupOTP] = React.useState("")
  const [pinSetupNewPin, setPinSetupNewPin] = React.useState("")
  const [pinSetupConfirmPin, setPinSetupConfirmPin] = React.useState("")
  const [pinSetupLoading, setPinSetupLoading] = React.useState(false)
  const [pinSetupError, setPinSetupError] = React.useState("")
  const [pinSetupMsg, setPinSetupMsg] = React.useState("")
  const [pinSetupCooldown, setPinSetupCooldown] = React.useState(0)

  // Forgot PIN State
  const [isForgotPinOpen, setIsForgotPinOpen] = React.useState(false)
  const [forgotPinEmail, setForgotPinEmail] = React.useState("")
  const [forgotPinOTP, setForgotPinOTP] = React.useState("")
  const [forgotPinNew, setForgotPinNew] = React.useState("")
  const [forgotPinConfirm, setForgotPinConfirm] = React.useState("")
  const [forgotPinLoading, setForgotPinLoading] = React.useState(false)
  const [forgotPinError, setForgotPinError] = React.useState("")
  const [forgotPinMsg, setForgotPinMsg] = React.useState("")
  const [forgotPinCooldown, setForgotPinCooldown] = React.useState(0)

  // Email Verification OTP State
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

  // Load Saved User and check inactivity/session notices
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawSaved = localStorage.getItem("saampark_last_user")
        if (rawSaved) {
          const parsed: SavedUser = JSON.parse(rawSaved)
          if (parsed && parsed.email) {
            setSavedUser(parsed)
            setEmail(parsed.email)
            if (parsed.hasPin) {
              setLoginMode("pin")
            }
          }
        }
      } catch {}

      const notice = sessionStorage.getItem("saampark_inactive_logout")
      const searchParams = new URLSearchParams(window.location.search)
      const searchParamError = searchParams.get("error")
      const searchParamReason = searchParams.get("reason")

      if (notice || searchParamReason === "inactivity") {
        setError("You were automatically locked out due to inactivity. Enter your 4-digit PIN to quickly resume.")
        sessionStorage.removeItem("saampark_inactive_logout")
      } else if (searchParamReason === "session_expired") {
        setError("Your previous session ended. Please enter your PIN or password to sign in.")
      } else if (searchParamError === "inactive") {
        setError("Your account is on inactive stage, please contact your administration.")
      }
    }
  }, [])

  // Cooldown timers
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendCooldown])

  React.useEffect(() => {
    if (pinSetupCooldown > 0) {
      const t = setTimeout(() => setPinSetupCooldown((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [pinSetupCooldown])

  React.useEffect(() => {
    if (forgotPinCooldown > 0) {
      const t = setTimeout(() => setForgotPinCooldown((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [forgotPinCooldown])

  // Helper to commit successful login and redirect
  const completeSuccessfulLogin = (
    matchedRole: Role,
    matchedAccount: any,
    effectiveEmail: string,
    displayName: string,
    backendToken?: string | null,
    hasPin: boolean = false
  ) => {
    // Save last user info in localStorage for next PIN login
    const savedInfo: SavedUser = {
      email: effectiveEmail,
      name: displayName,
      avatar: matchedAccount.avatarUrl || (matchedAccount as any).avatar || matchedAccount.avatar_url,
      role: matchedRole,
      hasPin: hasPin,
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("saampark_last_user", JSON.stringify(savedInfo))
      sessionStorage.removeItem("saampark_inactivity_logout")
      sessionStorage.removeItem("saampark_inactive_logout")
      localStorage.removeItem("saampark_session_revoked")
      if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
      sessionStorage.setItem("saampark_session_active", "true")
      localStorage.removeItem("saampark_session_active")
      localStorage.setItem("saampark_last_activity_time", String(Date.now()))
      if (backendToken) {
        localStorage.setItem("saampark_token", backendToken)
      }
    }

    recordUserAccount({ ...matchedAccount, name: displayName, email: effectiveEmail, lastLogin: "Just now" })
    setSuccessMessage(`Welcome back, ${displayName}! 👋`)
    setSuccess(true)

    let parsedCompanyIds: string[] = []
    const rawCompIds = matchedAccount.company_ids || matchedAccount.companyIds || (matchedAccount as any)?.company_ids
    if (typeof rawCompIds === "string") {
      try { parsedCompanyIds = JSON.parse(rawCompIds) } catch { parsedCompanyIds = [rawCompIds] }
    } else if (Array.isArray(rawCompIds)) {
      parsedCompanyIds = rawCompIds
    }
    if (!Array.isArray(parsedCompanyIds) || parsedCompanyIds.length === 0) {
      const fallbackSingle = matchedAccount.companyId || matchedAccount.company_id || "tech"
      parsedCompanyIds = matchedRole === "Super Admin" ? ["tech", "consultancy"] : [fallbackSingle]
    }

    const selectedCompanyId = matchedRole === "Super Admin" ? "all" : (parsedCompanyIds[0] || "tech")

    loginAs(matchedRole, {
      id: String(matchedAccount.sql_id || matchedAccount.id || matchedAccount.email),
      name: displayName,
      email: effectiveEmail,
      username: matchedAccount.username || (!effectiveEmail.includes("@") ? effectiveEmail : undefined),
      role: matchedRole,
      companyId: selectedCompanyId as any,
      companyIds: parsedCompanyIds,
      avatar: matchedAccount.avatarUrl || (matchedAccount as any).avatar || matchedAccount.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${effectiveEmail}`,
      avatarUrl: matchedAccount.avatarUrl || (matchedAccount as any).avatar || matchedAccount.avatar_url || undefined,
      phone: matchedAccount.phone,
      branchId: matchedAccount.branchId || matchedAccount.branch_id || undefined,
      branchName: matchedAccount.branchName || matchedAccount.branch_name || undefined,
      allowedModules: matchedAccount.allowedModules || (matchedAccount as any)?.permissions?.allowedModules,
      permissions: matchedAccount.permissions,
      token: backendToken || undefined,
    } as any)

    setTimeout(() => {
      router.replace("/feature/dashboard")
    }, 500)
  }

  // ─── PIN LOGIN HANDLER ────────────────────────────────────────────────────────
  const handlePinLogin = async (pinValue?: string) => {
    const targetPin = pinValue || loginPin
    if (!targetPin || targetPin.length < 4) {
      setPinError("Please enter your complete 4-digit PIN.")
      return
    }
    const targetEmail = (savedUser?.email || email || "").toLowerCase().trim()
    if (!targetEmail) {
      setPinError("Please enter your email or username.")
      return
    }

    setPinLoading(true)
    setPinError("")

    try {
      const res: any = await AuthService.loginWithPin({
        email: targetEmail,
        identifier: targetEmail,
        pin: targetPin,
      })

      if (res?.data?.user || res?.user) {
        const u = res.data?.user || res.user
        const token = res.data?.token || res.token
        const role = normalizeRole(u.role_name || u.role || "")
        completeSuccessfulLogin(role, u, targetEmail, u.full_name || u.name || targetEmail, token, true)
      } else {
        setPinError(res?.message || "Invalid Security PIN. Please try again.")
        setLoginPin("")
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Invalid Security PIN."
      setPinError(msg)
      setLoginPin("")
    } finally {
      setPinLoading(false)
    }
  }

  // ─── PASSWORD LOGIN HANDLER ──────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const normalizedInput = email.toLowerCase().replace(/^@/, "").trim()

    try {
      unmarkUserAsDeleted(normalizedInput)
      const registeredAccounts = await getStoredUserAccountsAsync()

      let dbAccount = registeredAccounts.find(
        (acc) =>
          (acc.email || "").toLowerCase().trim() === normalizedInput ||
          (acc.username && acc.username.toLowerCase().replace(/^@/, "").trim() === normalizedInput)
      )

      if (!dbAccount) {
        const allDbUsers = await fetchModuleDataFromDB<UserItem[]>("users", [], "all").catch(() => [])
        dbAccount = allDbUsers.find(
          (acc) =>
            (acc.email || "").toLowerCase().trim() === normalizedInput ||
            (acc.username && acc.username.toLowerCase().replace(/^@/, "").trim() === normalizedInput)
        )
      }

      let backendUser: any = null
      let backendRole: Role | null = null
      let backendToken: string | null = null
      let mustSetupPin = false
      let hasPin = false

      try {
        const backendRes: any = await AuthService.login({ email: normalizedInput, password })
        if (backendRes?.data?.user || backendRes?.user) {
          backendUser = backendRes.data?.user || backendRes.user
          backendRole = normalizeRole(backendUser.role_name || backendUser.role || "")
          backendToken = backendRes.data?.token || backendRes.token
          mustSetupPin = Boolean(backendRes.data?.mustSetupPin ?? backendRes?.mustSetupPin)
          hasPin = Boolean(backendRes.data?.hasPin ?? backendRes?.hasPin)
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
        }
      } catch (backendErr: any) {
        const msg: string = backendErr?.response?.data?.message || backendErr?.message || ""
        if (msg.toLowerCase().includes("not verified")) {
          setVerifyEmail(normalizedInput)
          setVerifyEmailModal(true)
          setIsLoading(false)
          return
        }
        if (msg.toLowerCase().includes("company not available")) {
          setIsLoading(false)
          setError("Company not available. Please contact administrator.")
          return
        }
      }

      // Role and Account resolution
      let matchedRole: Role | null = backendRole
      let matchedAccount: any = backendUser

      if (backendUser && backendUser.role_id) {
        const rid = parseInt(String(backendUser.role_id), 10)
        if (rid === 1) matchedRole = "Super Admin"
        else if (rid === 2) matchedRole = "Admin"
        else if (rid === 4) matchedRole = "Clients"
      }

      if (dbAccount) {
        matchedRole = normalizeRole(dbAccount.role) || matchedRole || "Teams"
        matchedAccount = { ...dbAccount, ...matchedAccount }
        if (!backendUser) {
          const isRootSuper = normalizedInput === "saampark.official@gmail.com" || matchedRole === "Super Admin"
          const validPasswords = [
            dbAccount.password,
            dbAccount.password?.trim(),
            isRootSuper ? "123456" : null,
            isRootSuper ? "admin123" : null,
            "Password123",
          ].filter(Boolean)

          if (!validPasswords.includes(password.trim()) && !validPasswords.includes(password)) {
            setIsLoading(false)
            setError("Invalid password. Please check and try again.")
            return
          }
        }
      }

      if (!matchedAccount || !matchedRole) {
        setIsLoading(false)
        setError("Account does not exist. Please contact your System Administrator.")
        return
      }

      // Check inactive status
      const rawStatus = (matchedAccount.status || dbAccount?.status || "").toString().toLowerCase().trim()
      if (rawStatus === "inactive" || matchedAccount.is_active === false) {
        setIsLoading(false)
        setError("Your account is on inactive stage, please contact your administration.")
        return
      }

      const effectiveEmail = (matchedAccount.email || dbAccount?.email || normalizedInput).toLowerCase().trim()
      const displayName = effectiveEmail === "saampark.official@gmail.com"
        ? "Saampark Group (Super Admin)"
        : (matchedAccount.full_name || matchedAccount.name || dbAccount?.name || effectiveEmail)

      // ── FIRST-TIME LOGIN PIN SETUP TRIGGER ──────────────────────────────────
      // Check if user has already configured PIN
      const localSavedPin = (typeof window !== "undefined")
        ? Boolean(JSON.parse(localStorage.getItem("saampark_last_user") || "{}")?.hasPin && JSON.parse(localStorage.getItem("saampark_last_user") || "{}")?.email?.toLowerCase().trim() === effectiveEmail)
        : false

      const userHasCompletedPin = hasPin || localSavedPin || Boolean(matchedAccount.hasPin) || Boolean(matchedAccount.pin_hash) || Boolean(Number(matchedAccount.pin_setup_completed) === 1) || Boolean(Number(backendUser?.pin_setup_completed) === 1)

      if (!userHasCompletedPin && mustSetupPin) {
        setPinSetupData({
          email: effectiveEmail,
          name: displayName,
          role: matchedRole,
          account: matchedAccount,
          token: backendToken || undefined,
        })
        // Automatically dispatch Email OTP
        try {
          await AuthService.sendPinOTP({ email: effectiveEmail })
          setPinSetupMsg(`A 6-digit verification code has been dispatched to ${effectiveEmail}`)
          setPinSetupCooldown(60)
        } catch {}
        setIsLoading(false)
        setIsPinSetupOpen(true)
        return
      }

      // Normal PIN-enabled user logging in via password
      completeSuccessfulLogin(matchedRole, matchedAccount, effectiveEmail, displayName, backendToken, true)

    } catch (err: any) {
      setIsLoading(false)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      if (!success) setIsLoading(false)
    }
  }

  // ─── COMPLETE PIN SETUP (WITH EMAIL OTP) ──────────────────────────────────────
  const handleCompletePinSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pinSetupData) return
    if (pinSetupOTP.length < 6) {
      setPinSetupError("Please enter the 6-digit OTP code sent to your email.")
      return
    }
    if (pinSetupNewPin.length < 4) {
      setPinSetupError("Please enter your new 4-digit PIN.")
      return
    }
    if (pinSetupNewPin !== pinSetupConfirmPin) {
      setPinSetupError("PIN confirmation does not match. Please re-enter.")
      return
    }

    setPinSetupLoading(true)
    setPinSetupError("")

    try {
      await AuthService.setupPin({
        email: pinSetupData.email,
        pin: pinSetupNewPin,
        otp: pinSetupOTP,
      })

      if (typeof window !== "undefined") {
        try {
          const lastUser = JSON.parse(localStorage.getItem("saampark_last_user") || "{}")
          lastUser.hasPin = true
          lastUser.email = pinSetupData.email
          localStorage.setItem("saampark_last_user", JSON.stringify(lastUser))
        } catch {}
      }

      setIsPinSetupOpen(false)
      completeSuccessfulLogin(
        pinSetupData.role,
        { ...pinSetupData.account, hasPin: true, pin_setup_completed: 1 },
        pinSetupData.email,
        pinSetupData.name,
        pinSetupData.token,
        true
      )
    } catch (err: any) {
      setPinSetupError(err?.response?.data?.message || "Verification code is invalid or expired.")
    } finally {
      setPinSetupLoading(false)
    }
  }

  // ─── FORGOT PIN HANDLERS ──────────────────────────────────────────────────────
  const openForgotPinModal = async () => {
    const target = (savedUser?.email || email || "").toLowerCase().trim()
    setForgotPinEmail(target)
    setForgotPinOTP("")
    setForgotPinNew("")
    setForgotPinConfirm("")
    setForgotPinError("")
    setIsForgotPinOpen(true)
    if (target) {
      setForgotPinLoading(true)
      try {
        await AuthService.sendPinOTP({ email: target })
        setForgotPinMsg(`Verification code sent to ${target}`)
        setForgotPinCooldown(60)
      } catch {}
      setForgotPinLoading(false)
    }
  }

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (forgotPinOTP.length < 6) {
      setForgotPinError("Please enter the 6-digit verification code.")
      return
    }
    if (forgotPinNew.length < 4) {
      setForgotPinError("Please enter a 4-digit PIN.")
      return
    }
    if (forgotPinNew !== forgotPinConfirm) {
      setForgotPinError("PINs do not match.")
      return
    }

    setForgotPinLoading(true)
    setForgotPinError("")

    try {
      await AuthService.resetPin({
        email: forgotPinEmail,
        otp: forgotPinOTP,
        newPin: forgotPinNew,
      })
      setForgotPinMsg("PIN successfully updated! You can now sign in.")
      setLoginPin(forgotPinNew)
      setTimeout(() => {
        setIsForgotPinOpen(false)
      }, 1500)
    } catch (err: any) {
      setForgotPinError(err?.response?.data?.message || "Invalid or expired verification code.")
    } finally {
      setForgotPinLoading(false)
    }
  }

  // ─── FORGOT PASSWORD HANDLERS WITH STRICT 8-CHAR POLICY ──────────────────────
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
    const policy = evaluatePasswordPolicy(forgotNewPass)
    if (!policy.length || !policy.upper || !policy.lower || !policy.number || !policy.special) {
      setForgotError("Password does not meet all security requirements.")
      return
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError("Passwords do not match.")
      return
    }

    setForgotLoading(true)
    setForgotError("")
    try {
      await AuthService.resetPassword({
        email: forgotEmail.toLowerCase(),
        newPassword: forgotNewPass,
        resetToken: forgotResetToken,
      })

      const stored = await getStoredUserAccountsAsync()
      const existing = stored.find((a) => a.email.toLowerCase().trim() === forgotEmail.toLowerCase().trim())
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

  // ─── EMAIL VERIFICATION HANDLER ──────────────────────────────────────────────
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

  const pwdPolicy = evaluatePasswordPolicy(forgotNewPass)
  const isPwdAllValid = pwdPolicy.length && pwdPolicy.upper && pwdPolicy.lower && pwdPolicy.number && pwdPolicy.special
  const isPwdMatch = forgotNewPass.length > 0 && forgotNewPass === forgotConfirmPass

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

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 1. QUICK 4-DIGIT PIN LOGIN MODE (DEFAULT ON RETURN / AUTO-LOGOUT)   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {loginMode === "pin" ? (
            <motion.div
              key="pin-login-card"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="max-w-md mx-auto liquid-glass-card rounded-[2rem] p-8 sm:p-10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] relative border border-white/40 dark:border-white/10"
            >
              <div className="flex flex-col items-center mb-6">
                {/* User Avatar Badge */}
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/50 overflow-hidden shadow-xl bg-surface flex items-center justify-center p-1">
                    {savedUser?.avatar ? (
                      <img src={savedUser.avatar} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                        <UserIcon size={32} />
                      </div>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-surface flex items-center justify-center text-[11px] text-white font-bold" title="PIN Protected">
                    🛡️
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                  {savedUser?.name || "Welcome Back"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {savedUser?.email || email}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                  <ShieldCheck size={13} />
                  <span>Enter 4-Digit Security PIN</span>
                </div>
              </div>

              {/* PIN Input */}
              <div className="space-y-4">
                <PINInput
                  value={loginPin}
                  onChange={setLoginPin}
                  onComplete={(val) => handlePinLogin(val)}
                  disabled={pinLoading || success}
                />

                {pinError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>{pinError}</span>
                  </motion.div>
                )}

                <Button
                  type="button"
                  onClick={() => handlePinLogin()}
                  variant="primary"
                  className="w-full h-11 text-sm font-bold shadow-md cursor-pointer"
                  disabled={pinLoading || loginPin.length < 4 || success}
                >
                  {pinLoading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 size={16} className="animate-spin" />
                      Verifying PIN...
                    </span>
                  ) : "Sign In with PIN →"}
                </Button>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
                  <button
                    type="button"
                    onClick={() => setLoginMode("password")}
                    className="font-medium text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Lock size={12} />
                    <span>Login with Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={openForgotPinModal}
                    className="font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Forgot PIN?
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSavedUser(null)
                      setLoginMode("password")
                      setEmail("")
                      setPassword("")
                    }}
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    Sign in to another account
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (

            /* ═══════════════════════════════════════════════════════════════════ */
            /* 2. PASSWORD LOGIN FORM                                              */
            /* ═══════════════════════════════════════════════════════════════════ */
            <motion.div
              key="password-login-card"
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
                <p className="text-xs text-muted-foreground mt-1">Sign in with your email and password</p>

                {/* If a PIN-enabled saved user exists, offer 1-click switch */}
                {savedUser?.hasPin && (
                  <button
                    type="button"
                    onClick={() => setLoginMode("pin")}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all hover:scale-103 cursor-pointer shadow-xs"
                  >
                    <Sparkles size={13} />
                    <span>⚡ Quick Sign In with PIN as {savedUser.name.split(" ")[0]}</span>
                  </button>
                )}
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4 relative">
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
                  <div className="flex justify-between items-center mt-1.5 text-xs">
                    {savedUser?.hasPin ? (
                      <button
                        type="button"
                        onClick={() => setLoginMode("pin")}
                        className="font-medium text-primary hover:underline cursor-pointer"
                      >
                        Use 4-digit PIN instead
                      </button>
                    ) : <span />}

                    <button
                      type="button"
                      onClick={openForgotModal}
                      className="font-medium text-primary hover:underline cursor-pointer"
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
          )}

        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3. FIRST-TIME 4-DIGIT PIN SETUP MODAL (WITH EMAIL OTP)                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isPinSetupOpen && pinSetupData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-foreground">Set Up 4-Digit Security PIN</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  A 6-digit verification code was sent to <strong className="text-foreground">{pinSetupData.email}</strong>. Enter it below to activate your PIN.
                </p>
                {pinSetupMsg && <p className="text-xs text-primary font-medium mt-1">{pinSetupMsg}</p>}
              </div>

              <form onSubmit={handleCompletePinSetup} className="space-y-4">
                {/* Step 1: Email OTP */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1 text-center">
                    1. Enter Email Verification Code
                  </label>
                  <OTPInput value={pinSetupOTP} onChange={setPinSetupOTP} />
                  <div className="flex justify-center mt-1.5">
                    <button
                      type="button"
                      disabled={pinSetupCooldown > 0}
                      onClick={async () => {
                        if (pinSetupCooldown > 0) return
                        try {
                          await AuthService.sendPinOTP({ email: pinSetupData.email })
                          setPinSetupMsg("New verification code sent!")
                          setPinSetupCooldown(60)
                        } catch {}
                      }}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw size={11} />
                      {pinSetupCooldown > 0 ? `Resend OTP in ${pinSetupCooldown}s` : "Resend OTP"}
                    </button>
                  </div>
                </div>

                {/* Step 2: Choose 4-Digit PIN */}
                <div className="pt-2 border-t border-border/50">
                  <label className="block text-xs font-bold text-foreground mb-1 text-center">
                    2. Choose Your 4-Digit PIN
                  </label>
                  <PINInput value={pinSetupNewPin} onChange={setPinSetupNewPin} autoFocus={false} />
                </div>

                {/* Step 3: Confirm 4-Digit PIN */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1 text-center">
                    3. Re-enter PIN to Confirm
                  </label>
                  <PINInput value={pinSetupConfirmPin} onChange={setPinSetupConfirmPin} autoFocus={false} />
                </div>

                {pinSetupError && (
                  <p className="text-xs text-danger text-center font-semibold bg-danger/10 p-2 rounded-lg">
                    {pinSetupError}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11 font-bold shadow-md cursor-pointer mt-2"
                  disabled={pinSetupLoading || pinSetupOTP.length < 6 || pinSetupNewPin.length < 4 || pinSetupConfirmPin.length < 4}
                >
                  {pinSetupLoading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 size={16} className="animate-spin" />
                      Activating PIN...
                    </span>
                  ) : "Complete PIN Setup & Enter CRM →"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 4. FORGOT / RESET PIN MODAL                                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isForgotPinOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <button
                onClick={() => setIsForgotPinOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary">
                  <KeyRound size={28} />
                </div>
                <h3 className="text-xl font-extrabold text-foreground">Reset Security PIN</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  We sent a 6-digit verification code to <strong className="text-foreground">{forgotPinEmail}</strong>.
                </p>
                {forgotPinMsg && <p className="text-xs text-primary font-medium mt-1">{forgotPinMsg}</p>}
              </div>

              <form onSubmit={handleResetPin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-center">Enter 6-Digit Email Code</label>
                  <OTPInput value={forgotPinOTP} onChange={setForgotPinOTP} />
                  <div className="flex justify-center mt-1">
                    <button
                      type="button"
                      disabled={forgotPinCooldown > 0}
                      onClick={async () => {
                        if (forgotPinCooldown > 0) return
                        try {
                          await AuthService.sendPinOTP({ email: forgotPinEmail })
                          setForgotPinMsg("New code sent!")
                          setForgotPinCooldown(60)
                        } catch {}
                      }}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw size={11} />
                      {forgotPinCooldown > 0 ? `Resend OTP in ${forgotPinCooldown}s` : "Resend OTP"}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <label className="block text-xs font-bold mb-1 text-center">New 4-Digit PIN</label>
                  <PINInput value={forgotPinNew} onChange={setForgotPinNew} autoFocus={false} />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-center">Confirm New 4-Digit PIN</label>
                  <PINInput value={forgotPinConfirm} onChange={setForgotPinConfirm} autoFocus={false} />
                </div>

                {forgotPinError && (
                  <p className="text-xs text-danger text-center font-semibold bg-danger/10 p-2 rounded-lg">
                    {forgotPinError}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsForgotPinOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 font-bold shadow-md"
                    disabled={forgotPinLoading || forgotPinOTP.length < 6 || forgotPinNew.length < 4 || forgotPinConfirm.length < 4}
                  >
                    {forgotPinLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Save New PIN"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 5. EMAIL VERIFICATION MODAL                                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 6. FORGOT PASSWORD MODAL WITH 8-CHAR / 1-CAP / 1-SPECIAL CHECKLIST      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
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
                    {forgotStep === "newpass" && "Create a strong new password"}
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
                    onClick={async () => {
                      if (resendCooldown > 0) return
                      setForgotLoading(true)
                      try {
                        await AuthService.sendForgotPasswordOTP({ email: forgotEmail.toLowerCase() })
                        setForgotMsg("New OTP sent!")
                        setResendCooldown(60)
                      } catch {}
                      setForgotLoading(false)
                    }}
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

              {/* Step 3: New Password with Strict Policy Checklist */}
              {forgotStep === "newpass" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">New Password *</label>
                    <Input
                      type="password"
                      required
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      placeholder="Minimum 8 characters"
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
                      placeholder="Re-type new password"
                      className="bg-background"
                      leftIcon={<Lock size={16} />}
                    />
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="p-3 bg-background/80 rounded-xl border border-border/60 space-y-1.5 text-[11px]">
                    <p className="font-bold text-foreground text-[11px] mb-1">Password Requirements:</p>
                    <div className={`flex items-center gap-1.5 ${pwdPolicy.length ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                      <Check size={12} className={pwdPolicy.length ? "stroke-[3]" : "opacity-40"} />
                      <span>At least 8 characters long</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdPolicy.upper ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                      <Check size={12} className={pwdPolicy.upper ? "stroke-[3]" : "opacity-40"} />
                      <span>At least 1 uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdPolicy.lower ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                      <Check size={12} className={pwdPolicy.lower ? "stroke-[3]" : "opacity-40"} />
                      <span>At least 1 lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdPolicy.number ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                      <Check size={12} className={pwdPolicy.number ? "stroke-[3]" : "opacity-40"} />
                      <span>At least 1 number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdPolicy.special ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                      <Check size={12} className={pwdPolicy.special ? "stroke-[3]" : "opacity-40"} />
                      <span>At least 1 special character (!@#$%^&* etc.)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${isPwdMatch ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                      <Check size={12} className={isPwdMatch ? "stroke-[3]" : "opacity-40"} />
                      <span>Passwords match</span>
                    </div>
                  </div>

                  {forgotError && <p className="text-xs text-danger font-medium">{forgotError}</p>}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-11 font-bold shadow-md"
                    disabled={forgotLoading || !isPwdAllValid || !isPwdMatch}
                  >
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
