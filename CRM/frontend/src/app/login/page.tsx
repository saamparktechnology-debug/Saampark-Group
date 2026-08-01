"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore, DEMO_USERS, Role } from "@/store/useAuthStore"

export default function LoginPage() {
  const router = useRouter()
  const { loginAs } = useAuthStore()
  
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Find if the typed email matches a demo user
    const matchedRole = (Object.keys(DEMO_USERS) as Role[]).find(
      role => DEMO_USERS[role].email === email && password === (role === 'Manager' || role === 'Employee' || role === 'Client' ? 'pass123' : 'admin123')
    )

    if (matchedRole) {
      setTimeout(() => {
        setSuccess(true)
        loginAs(matchedRole)
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      }, 800)
    } else {
      setTimeout(() => {
        setIsLoading(false)
        setError("Invalid email or password. Please use a demo account.")
      }, 800)
    }
  }

  const quickLogin = (role: Role) => {
    const u = DEMO_USERS[role]
    setEmail(u.email)
    setPassword(role === 'Manager' || role === 'Employee' || role === 'Client' ? 'pass123' : 'admin123')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Background ambient mesh */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-info/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 z-10"
      >
        {/* Left Side - Login Form */}
        <div className="flex flex-col justify-center max-w-md w-full mx-auto lg:mr-auto lg:ml-0">
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-6">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-lg">
              Sign in to your enterprise workspace
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 relative">
            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm rounded-xl"
                >
                  <motion.div
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 size={32} />
                  </motion.div>
                  <p className="text-lg font-semibold">Authentication successful</p>
                  <p className="text-sm text-muted-foreground">Redirecting to workspace...</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-surface" 
                  placeholder="name@company.com" 
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Password</label>
                <a href="#" className="text-sm font-medium text-primary hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-surface" 
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
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-danger font-medium">
                {error}
              </motion.p>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading || success}
            >
              {isLoading ? "Signing in..." : "Sign in to workspace"}
            </Button>
          </form>
        </div>

        {/* Right Side - Demo Roles (SAAMPARK Specific) */}
        <div className="hidden lg:flex flex-col bg-surface/50 backdrop-blur-xl border border-border rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-info/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Demo Access</h2>
            <p className="text-muted-foreground mb-8">Test the multi-company RBAC system with one click.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => quickLogin('Super Admin')} className="group flex flex-col items-start p-4 bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all text-left">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">👑</div>
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">Super Admin</span>
                  <span className="text-xs text-muted-foreground mt-1">Full access • Can switch companies</span>
                </button>
                
                <button onClick={() => quickLogin('Admin')} className="group flex flex-col items-start p-4 bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all text-left">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">🛡️</div>
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">Admin</span>
                  <span className="text-xs text-muted-foreground mt-1">Tech company • Full access</span>
                </button>

                <button onClick={() => quickLogin('Manager')} className="group flex flex-col items-start p-4 bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all text-left">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">📊</div>
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">Manager</span>
                  <span className="text-xs text-muted-foreground mt-1">Tech company • Project/Client access</span>
                </button>

                <button onClick={() => quickLogin('Employee')} className="group flex flex-col items-start p-4 bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all text-left">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">💼</div>
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">Employee</span>
                  <span className="text-xs text-muted-foreground mt-1">Tech company • Tasks & Calendar only</span>
                </button>
              </div>

              <button onClick={() => quickLogin('Client')} className="w-full group flex items-center justify-between p-4 bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all text-left">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center text-lg">🤝</div>
                  <div>
                    <span className="font-semibold text-sm block group-hover:text-primary transition-colors">Client Portal</span>
                    <span className="text-xs text-muted-foreground">Limited view for Acme Corp</span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
