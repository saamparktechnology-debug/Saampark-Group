"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ClipboardList, Search, Building2, GitBranch, User, 
  FolderKanban, CreditCard, CheckCircle2, Clock, Filter, 
  ArrowLeft, Shield, Target, Briefcase, FileText, CheckSquare,
  RotateCcw, Sparkles, AlertCircle, Trash2, Calendar, Crown,
  UserCheck, ShieldAlert, Users, Layers, ExternalLink
} from "lucide-react"
import Link from "next/link"
import { useAuthStore, getCompanyFullName } from "@/store/useAuthStore"
import { getActivityLogs, clearAllActivityLogs, ActivityLog, ActivityType } from "@/services/activityLogService"
import { Button } from "@/components/ui/Button"

export default function ActivityLogsMain() {
  const { user, companies, activeCompanyId } = useAuthStore()
  const [logs, setLogs] = React.useState<ActivityLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCompany, setSelectedCompany] = React.useState<string>(activeCompanyId || "all")
  const [selectedActor, setSelectedActor] = React.useState<string>("all")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")

  const isSuperAdmin = user?.role === "Super Admin"
  const isAdmin = user?.role === "Admin"
  const isAuthorized = isSuperAdmin || isAdmin

  // Company scope filtering
  const allowedCompanies = React.useMemo(() => {
    if (!user) return []
    if (isSuperAdmin) return companies
    const compIds = (user.companyIds || (user.companyId ? [user.companyId] : ["tech"])).map(id => String(id).toLowerCase().trim())
    return companies.filter(c => compIds.includes(String(c.id).toLowerCase().trim()) || (c.slug && compIds.includes(String(c.slug).toLowerCase().trim())))
  }, [user, companies, isSuperAdmin])

  const loadLogs = React.useCallback(async () => {
    setLoading(true)
    try {
      // If Admin, strictly constrain company scope to their allowed companies
      let targetComp = selectedCompany
      if (!isSuperAdmin && targetComp === "all") {
        targetComp = allowedCompanies[0]?.id || user?.companyId || "tech"
      }
      const data = await getActivityLogs(targetComp)
      setLogs(data)
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, isSuperAdmin, allowedCompanies, user])

  React.useEffect(() => {
    if (isAuthorized) {
      loadLogs()
    }
  }, [loadLogs, isAuthorized])

  React.useEffect(() => {
    if (!isAuthorized) return
    const handleSync = () => loadLogs()
    window.addEventListener("saampark_activity_logged", handleSync)
    window.addEventListener("storage", handleSync)
    return () => {
      window.removeEventListener("saampark_activity_logged", handleSync)
      window.removeEventListener("storage", handleSync)
    }
  }, [loadLogs, isAuthorized])

  const handleClearLogs = async () => {
    if (!isSuperAdmin) return
    if (confirm("Are you sure you want to clear the activity log history? This action cannot be undone.")) {
      await clearAllActivityLogs()
      setLogs([])
    }
  }

  // Extract distinct actors/admins for the Actor Filter
  const actorsList = React.useMemo(() => {
    const map = new Map<string, { key: string; name: string; role: string; email?: string }>()
    logs.forEach(l => {
      const key = (l.userName || l.userEmail || "System").trim()
      if (key && !map.has(key)) {
        map.set(key, {
          key,
          name: l.userName || key,
          role: l.userRole || "User",
          email: l.userEmail,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => {
      // Super Admin and Admin first
      if (a.role === "Super Admin" && b.role !== "Super Admin") return -1
      if (b.role === "Super Admin" && a.role !== "Super Admin") return 1
      if (a.role === "Admin" && b.role !== "Admin") return -1
      if (b.role === "Admin" && a.role !== "Admin") return 1
      return a.name.localeCompare(b.name)
    })
  }, [logs])

  // Filter logs by search, company, category type, and actor/admin
  const filteredLogs = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return logs.filter(log => {
      const matchesSearch = !q ||
        (log.action || "").toLowerCase().includes(q) ||
        (log.description || "").toLowerCase().includes(q) ||
        (log.companyName || "").toLowerCase().includes(q) ||
        (log.userName || "").toLowerCase().includes(q) ||
        (log.userRole || "").toLowerCase().includes(q) ||
        (log.userEmail || "").toLowerCase().includes(q) ||
        (log.module || "").toLowerCase().includes(q) ||
        (log.details || "").toLowerCase().includes(q)

      let matchesType = true
      if (typeFilter !== "all") {
        if (typeFilter === "finance") {
          matchesType = log.type === "invoice" || log.type === "payment" || log.type === "quotation" || log.type === "estimate"
        } else if (typeFilter === "operations") {
          matchesType = log.type === "project" || log.type === "task"
        } else {
          matchesType = log.type === typeFilter
        }
      }

      let matchesActor = true
      if (selectedActor !== "all") {
        if (selectedActor === "__admins_only__") {
          const roleLower = (log.userRole || "").toLowerCase().trim()
          matchesActor = roleLower === "admin" || roleLower === "super admin"
        } else {
          const actorKey = (log.userName || log.userEmail || "").trim().toLowerCase()
          matchesActor = actorKey === selectedActor.toLowerCase()
        }
      }

      return matchesSearch && matchesType && matchesActor
    })
  }, [logs, searchQuery, typeFilter, selectedActor])

  // Count categories for KPI cards
  const stats = React.useMemo(() => {
    return {
      total: logs.length,
      adminActions: logs.filter(l => {
        const r = (l.userRole || "").toLowerCase()
        return r === "admin" || r === "super admin"
      }).length,
      permissions: logs.filter(l => l.type === "permission").length,
      leadsAndClients: logs.filter(l => l.type === "lead" || l.type === "client").length,
      billing: logs.filter(l => l.type === "invoice" || l.type === "payment" || l.type === "quotation" || l.type === "estimate").length,
      operations: logs.filter(l => l.type === "project" || l.type === "task").length,
    }
  }, [logs])

  const getTypeMeta = (type: ActivityType | string) => {
    switch (type) {
      case "permission":
        return {
          icon: Shield,
          color: "text-amber-500",
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
          label: "Security & Permissions",
        }
      case "lead":
        return {
          icon: Target,
          color: "text-blue-500",
          bg: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
          label: "Leads Pipeline",
        }
      case "client":
        return {
          icon: Briefcase,
          color: "text-purple-500",
          bg: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
          label: "Client Accounts",
        }
      case "invoice":
      case "payment":
        return {
          icon: CreditCard,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          label: "Billing & Revenue",
        }
      case "quotation":
      case "estimate":
        return {
          icon: FileText,
          color: "text-indigo-500",
          bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
          label: "Estimates & Proposals",
        }
      case "project":
        return {
          icon: FolderKanban,
          color: "text-cyan-500",
          bg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400",
          label: "Projects & Operations",
        }
      case "task":
        return {
          icon: CheckSquare,
          color: "text-teal-500",
          bg: "bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400",
          label: "Task Operations",
        }
      case "user":
        return {
          icon: User,
          color: "text-rose-500",
          bg: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
          label: "User Accounts",
        }
      default:
        return {
          icon: ClipboardList,
          color: "text-zinc-500",
          bg: "bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400",
          label: "System Action",
        }
    }
  }

  const getActorRoleBadge = (role?: string) => {
    const rLower = (role || "").toLowerCase().trim()
    if (rLower === "super admin") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <Crown size={10} className="text-purple-600 dark:text-purple-400" /> Super Admin
        </span>
      )
    }
    if (rLower === "admin") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Shield size={10} className="text-blue-600 dark:text-blue-400" /> Admin
        </span>
      )
    }
    if (rLower === "clients") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Briefcase size={10} className="text-amber-600 dark:text-amber-400" /> Client
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
        <Users size={10} /> {role || "Team Member"}
      </span>
    )
  }

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts)
      if (isNaN(d.getTime())) return "Recently"
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin < 1) return "Just now"
      if (diffMin < 60) return `${diffMin}m ago`
      const diffHrs = Math.floor(diffMin / 60)
      if (diffHrs < 24) return `${diffHrs}h ago`
      const diffDays = Math.floor(diffHrs / 24)
      if (diffDays === 1) return "Yesterday"
      if (diffDays < 7) return `${diffDays}d ago`
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    } catch {
      return "Recently"
    }
  }

  const formatExactTime = (ts: string) => {
    try {
      const d = new Date(ts)
      if (isNaN(d.getTime())) return ""
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    } catch {
      return ""
    }
  }

  // ACCESS GUARD: Strict restriction for Super Admin and Admin only
  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {user?.role || "User"} Access Restricted
            </span>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              Admin Authorization Required
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              The Activity & Audit Logs are strictly restricted to Super Admin and Admin accounts to safeguard system security and sensitive organizational records.
            </p>
          </div>

          <Link href="/feature/dashboard" className="block w-full">
            <Button variant="outline" className="w-full text-xs font-semibold gap-2 cursor-pointer">
              <ArrowLeft size={14} /> Back to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto p-4 sm:p-6 pb-16">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/feature/dashboard" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
              <ArrowLeft size={13} /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
            <ClipboardList className="text-primary" size={24} />
            <span>Audit & Activity Logs</span>
            {isSuperAdmin ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <Crown size={11} /> Super Admin Audit (All Activities)
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <Shield size={11} /> Admin Activity View
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isSuperAdmin 
              ? "Comprehensive audit trail tracking every action, admin event, permission change, lead, client, and financial transaction across all companies"
              : "Audit trail for your assigned company and operational activities"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadLogs()}
            className="text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>

          {isSuperAdmin && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearLogs}
              className="text-xs font-semibold gap-1.5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div 
          onClick={() => { setTypeFilter("all"); setSelectedActor("all") }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            typeFilter === "all" && selectedActor === "all" ? "bg-primary/5 border-primary shadow-xs" : "bg-card border-border hover:border-primary/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">All Activities</span>
            <ClipboardList size={16} className="text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.total}</p>
        </div>

        {/* What Admins Did Card */}
        <div 
          onClick={() => { setSelectedActor("__admins_only__"); setTypeFilter("all") }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedActor === "__admins_only__" ? "bg-purple-500/10 border-purple-500 shadow-xs" : "bg-card border-border hover:border-purple-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Admin Actions</span>
            <Crown size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.adminActions}</p>
        </div>

        <div 
          onClick={() => { setTypeFilter("permission"); setSelectedActor("all") }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            typeFilter === "permission" ? "bg-amber-500/10 border-amber-500 shadow-xs" : "bg-card border-border hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Permissions & RBAC</span>
            <Shield size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.permissions}</p>
        </div>

        <div 
          onClick={() => { setTypeFilter("lead"); setSelectedActor("all") }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            typeFilter === "lead" ? "bg-blue-500/10 border-blue-500 shadow-xs" : "bg-card border-border hover:border-blue-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Leads & Deals</span>
            <Target size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.leadsAndClients}</p>
        </div>

        <div 
          onClick={() => { setTypeFilter("finance"); setSelectedActor("all") }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            typeFilter === "finance" ? "bg-emerald-500/10 border-emerald-500 shadow-xs" : "bg-card border-border hover:border-emerald-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Invoices & Billing</span>
            <CreditCard size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.billing}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by action, admin name, role, module, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Company Filter (Super Admin sees all, Admin sees assigned) */}
          <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs">
            <Building2 size={13} className="text-muted-foreground" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-transparent text-xs text-foreground font-medium focus:outline-none cursor-pointer"
            >
              {isSuperAdmin && <option value="all">All Companies</option>}
              {allowedCompanies.map(c => (
                <option key={c.id} value={c.id}>
                  {getCompanyFullName(c)}
                </option>
              ))}
            </select>
          </div>

          {/* Actor / Admin Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs">
            <UserCheck size={13} className="text-primary" />
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="bg-transparent text-xs text-foreground font-medium focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">All Actors</option>
              <option value="__admins_only__">🛡️ All Admins Only</option>
              {actorsList.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.role === "Super Admin" ? "👑 " : a.role === "Admin" ? "🛡️ " : "👤 "}
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
          </div>

          {/* Category Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1 overflow-x-auto text-[11px]">
            {[
              { key: "all", label: "All" },
              { key: "permission", label: "Permissions" },
              { key: "lead", label: "Leads" },
              { key: "client", label: "Clients" },
              { key: "finance", label: "Billing" },
              { key: "operations", label: "Operations" },
              { key: "user", label: "Users" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  typeFilter === tab.key
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {(selectedActor !== "all" || typeFilter !== "all" || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          <span className="font-semibold">Active Filters:</span>
          {selectedActor !== "all" && (
            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 font-medium">
              Actor: {selectedActor === "__admins_only__" ? "All Admins" : selectedActor}
              <button onClick={() => setSelectedActor("all")} className="hover:text-primary/70 cursor-pointer ml-1">✕</button>
            </span>
          )}
          {typeFilter !== "all" && (
            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 font-medium">
              Category: {typeFilter}
              <button onClick={() => setTypeFilter("all")} className="hover:text-primary/70 cursor-pointer ml-1">✕</button>
            </span>
          )}
          {searchQuery && (
            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 font-medium">
              Search: &quot;{searchQuery}&quot;
              <button onClick={() => setSearchQuery("")} className="hover:text-primary/70 cursor-pointer ml-1">✕</button>
            </span>
          )}
          <button 
            onClick={() => { setSelectedActor("all"); setTypeFilter("all"); setSearchQuery("") }}
            className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer ml-2"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Activity Timeline List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Loading system audit trail...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-16 text-center bg-card border border-border rounded-2xl space-y-3 p-6">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <ClipboardList size={24} />
          </div>
          <h3 className="text-sm font-bold text-foreground">No Activities Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || typeFilter !== "all" || selectedActor !== "all"
              ? "No activities matched your search criteria. Try resetting the filters."
              : "System actions such as creating leads, updating clients, modifying permissions, or billing will appear here automatically."}
          </p>
          {(searchQuery || typeFilter !== "all" || selectedActor !== "all") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setSearchQuery(""); setTypeFilter("all"); setSelectedActor("all") }}
              className="text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log, idx) => {
            const meta = getTypeMeta(log.type)
            const Icon = meta.icon

            return (
              <motion.div
                key={log.id || idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.3) }}
                className="bg-card border border-border hover:border-primary/40 rounded-2xl p-4 transition-all hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${meta.bg}`}>
                    <Icon size={18} className={meta.color} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {log.action}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${meta.bg}`}>
                        {log.module || meta.label}
                      </span>
                      {log.companyName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-muted text-muted-foreground border border-border flex items-center gap-1">
                          <Building2 size={10} /> {log.companyName}
                        </span>
                      )}
                      {log.branchName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-muted text-muted-foreground border border-border flex items-center gap-1">
                          <GitBranch size={10} /> {log.branchName}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {log.description}
                    </p>

                    {log.details && (
                      <div className="pt-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-muted/50 p-2 rounded-lg border border-border/60">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actor (Who did what) & Timestamp */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border text-right gap-1">
                  <div 
                    onClick={() => {
                      if (log.userName) setSelectedActor(log.userName)
                    }}
                    title={`Click to filter only actions by ${log.userName || "this user"}`}
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                      {(log.userName || "U")[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-foreground hover:underline">
                      {log.userName || "System"}
                    </span>
                    {getActorRoleBadge(log.userRole)}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5" title={new Date(log.timestamp).toLocaleString()}>
                    <Clock size={11} />
                    <span>{formatTime(log.timestamp)}</span>
                    <span className="hidden sm:inline opacity-60">· {formatExactTime(log.timestamp)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
