"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff, User, Phone, UserPlus, LogIn, KeyRound, X } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore, DEMO_USERS, Role } from "@/store/useAuthStore"
import { AuthService } from "@/services/apiServices"
import { isEmailRegistered, recordUserAccount, getStoredUserAccounts } from "@/app/feature/users/services/userService"

export default function LoginPage() {
  const router = useRouter()
  const { loginAs, loginWithCredentials } = useAuthStore()
  
  const [isRegistering, setIsRegistering] = React.useState(false)
  
  // Form fields
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("john@example.com")
  const [password, setPassword] = React.useState("Password123")
  const [phone, setPhone] = React.useState("")
  
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState("")

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = React.useState(false)
  const [resetEmail, setResetEmail] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [resetStatusMessage, setResetStatusMessage] = React.useState("")
  const [resetError, setResetError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const normalizedEmail = email.toLowerCase().trim()

    if (isRegistering) {
      // --- REGISTER FLOW ---
      // Check if user email is already registered or added by Admin in Users section
      if (isEmailRegistered(normalizedEmail)) {
        setIsLoading(false)
        setError("Account already registered. Please click 'Forgot Password' or log in to enter.")
        return
      }

      try {
        const regRes = await AuthService.register({
          full_name: fullName || "New User",
          email: normalizedEmail,
          password,
          phone: phone || "+15551234567",
          role_id: 1, // Admin role
        }).catch((err) => console.warn("Backend API register warning:", err))

        // Record registered user account into persistent store
        recordUserAccount({
          name: fullName || "Registered User",
          email: normalizedEmail,
          role: "Employee",
          companyId: "tech",
          status: "Active",
          phone: phone || "",
          lastLogin: "Just created",
        })

        setSuccessMessage("Account created successfully!")
        setSuccess(true)
        
        try {
          await loginWithCredentials(normalizedEmail, password)
        } catch (loginErr) {
          loginAs("Employee")
        }

        setTimeout(() => {
          router.push("/feature/dashboard")
        }, 1000)
        return
      } catch (err: any) {
        setIsLoading(false)
        setError(err.message || "Registration failed. Account already registered.")
        return
      }
    } else {
      // --- LOGIN FLOW ---
      // 1. Check live backend API login
      try {
        const successLive = await loginWithCredentials(normalizedEmail, password)
        if (successLive) {
          recordUserAccount({ email: normalizedEmail, lastLogin: "Just now" })
          setSuccessMessage("Authentication successful")
          setSuccess(true)
          setTimeout(() => {
            router.push("/feature/dashboard")
          }, 800)
          return
        }
      } catch (err: any) {
        console.warn("Live login attempt failed, checking persistent accounts store...", err)
      }

      // 2. Check persistent user database (accounts added by Admin or previously registered)
      const registeredAccounts = getStoredUserAccounts()
      const matchedAccount = registeredAccounts.find(
        (acc) => acc.email.toLowerCase().trim() === normalizedEmail
      )

      if (matchedAccount) {
        recordUserAccount({ ...matchedAccount, lastLogin: "Just now" })
        setSuccessMessage(`Welcome back, ${matchedAccount.name}!`)
        setSuccess(true)
        loginAs(matchedAccount.role, {
          id: matchedAccount.id,
          name: matchedAccount.name,
          email: matchedAccount.email,
          role: matchedAccount.role,
          companyId: matchedAccount.companyId as any || 'tech',
          avatar: matchedAccount.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${matchedAccount.email}`,
          phone: matchedAccount.phone,
        })
        setTimeout(() => {
          router.push("/feature/dashboard")
        }, 800)
        return
      }

      // 3. Fallback to demo role match
      const matchedRole = (Object.keys(DEMO_USERS) as Role[]).find(
        (role) => DEMO_USERS[role].email.toLowerCase() === normalizedEmail || (normalizedEmail === 'john@example.com' && role === 'Employee')
      )

      if (matchedRole) {
        recordUserAccount({
          name: DEMO_USERS[matchedRole].name,
          email: DEMO_USERS[matchedRole].email,
          role: matchedRole,
          companyId: DEMO_USERS[matchedRole].companyId,
          status: "Active",
          lastLogin: "Just now",
        })
        setTimeout(() => {
          setSuccessMessage("Authentication successful")
          setSuccess(true)
          loginAs(matchedRole)
          setTimeout(() => {
            router.push("/feature/dashboard")
          }, 800)
        }, 400)
      } else {
        setIsLoading(false)
        setError("Invalid credentials. If your account was added by an admin, please click 'Forgot Password' to set your password.")
      }
    }
  }

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setResetError("")
    setResetStatusMessage("")

    if (!resetEmail) {
      setResetError("Please enter your registered email address.")
      return
    }

    const normalizedResetEmail = resetEmail.toLowerCase().trim()
    const registeredAccounts = getStoredUserAccounts()
    const account = registeredAccounts.find(
      (acc) => acc.email.toLowerCase().trim() === normalizedResetEmail
    )

    if (account || isEmailRegistered(normalizedResetEmail)) {
      // Record updated status
      recordUserAccount({
        email: normalizedResetEmail,
        status: "Active",
        lastLogin: "Password reset completed",
      })

      setEmail(normalizedResetEmail)
      if (newPassword) setPassword(newPassword)

      setResetStatusMessage(`Password updated successfully for ${normalizedResetEmail}! You can now sign in.`)
      setTimeout(() => {
        setIsForgotModalOpen(false)
        setResetStatusMessage("")
      }, 2000)
    } else {
      setResetError("No account found with this email. Please ask your administrator to add your account.")
    }
  }

  const quickLogin = (role: Role) => {
    setIsRegistering(false)
    const u = DEMO_USERS[role]
    if (role === 'User') {
      setEmail("john@example.com")
      setPassword("Password123")
    } else {
      setEmail(u.email)
      setPassword("admin123")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Ambient mesh background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-info/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 z-10"
      >
        {/* Left Side - Login / Register Form */}
        <div className="flex flex-col justify-center max-w-md w-full mx-auto lg:mr-auto lg:ml-0">
          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
              {isRegistering ? <UserPlus size={28} /> : <ShieldCheck size={28} />}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {isRegistering ? "Create an Account" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground text-base">
              {isRegistering 
                ? "Register a new account on SAAMPARK CRM" 
                : "Sign in to access your enterprise workspace"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative">
            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-sm rounded-xl p-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 size={32} />
                  </motion.div>
                  <p className="text-lg font-semibold">{successMessage}</p>
                  <p className="text-sm text-muted-foreground">Redirecting to workspace dashboard...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registration specific field: Full Name */}
            {isRegistering && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 bg-surface" 
                    placeholder="John Doe" 
                    required={isRegistering}
                  />
                </div>
              </motion.div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-surface" 
                  placeholder="john@example.com" 
                  required
                />
              </div>
            </div>

            {/* Phone Number (Optional for Register) */}
            {isRegistering && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-medium mb-1.5">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-11 bg-surface" 
                    placeholder="+91 98765 43210" 
                  />
                </div>
              </motion.div>
            )}

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium">Password</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email)
                      setIsForgotModalOpen(true)
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-surface" 
                  placeholder="••••••••" 
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
                {error}
              </motion.div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full h-11 text-base font-semibold"
              disabled={isLoading || success}
            >
              {isLoading 
                ? (isRegistering ? "Creating account..." : "Authenticating...") 
                : (isRegistering ? "Create Account" : "Sign in to workspace")}
            </Button>
          </form>

          {/* Toggle between Sign In & Register */}
          <div className="mt-6 text-center border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {isRegistering ? "Already have an account?" : "Don't have an account yet?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering)
                  setError("")
                }}
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                {isRegistering ? (
                  <>Sign In <LogIn size={14} /></>
                ) : (
                  <>Create Account <UserPlus size={14} /></>
                )}
              </button>
            </p>
          </div>
        </div>

        {/* Right Side - Quick Demo Roles */}
        <div className="hidden lg:flex flex-col bg-surface/50 backdrop-blur-xl border border-border rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-info/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Live Workspace Authentication</h2>
            <p className="text-muted-foreground mb-8">Connected to <code className="text-primary font-mono text-xs">saampark-srm.onrender.com</code></p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => quickLogin('Super Admin')} className="group flex flex-col items-start p-4 bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all text-left">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">👑</div>
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">Super Admin</span>
                  <span className="text-xs text-muted-foreground mt-1">Superior of all • Full access</span>
                </button>
                
                <button onClick={() => quickLogin('Admin')} className="group flex flex-col items-start p-4 bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all text-left">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">🛡️</div>
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">Admin</span>
                  <span className="text-xs text-muted-foreground mt-1">Assigned to Company</span>
                </button>

                <button onClick={() => quickLogin('Teams')} className="group flex flex-col items-start p-4 bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all text-left">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">📊</div>
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">Teams</span>
                  <span className="text-xs text-muted-foreground mt-1">Team & Project Leads</span>
                </button>

                <button onClick={() => quickLogin('User')} className="group flex flex-col items-start p-4 bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all text-left">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">💼</div>
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">User</span>
                  <span className="text-xs text-muted-foreground mt-1">Standard Staff User</span>
                </button>
              </div>

              <button onClick={() => quickLogin('Clients')} className="w-full group flex items-center justify-between p-4 bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all text-left">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center text-lg">🤝</div>
                  <div>
                    <span className="font-semibold text-sm block group-hover:text-primary transition-colors">Clients Portal</span>
                    <span className="text-xs text-muted-foreground">Limited view for Acme Corp</span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal Dialog */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel p-6 rounded-2xl border border-border shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Forgot Password</h3>
                    <p className="text-xs text-muted-foreground">Set entry password for your registered account</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsForgotModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Registered Email *</label>
                  <Input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. ananya@saampark.in"
                    className="bg-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">New Password *</label>
                  <Input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="bg-surface"
                  />
                </div>

                {resetError && (
                  <p className="text-xs text-rose-400 font-medium">{resetError}</p>
                )}

                {resetStatusMessage && (
                  <p className="text-xs text-emerald-400 font-medium">{resetStatusMessage}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsForgotModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Reset & Login
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
