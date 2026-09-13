"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ClipboardList, Search, Building2, GitBranch, User, 
  FolderKanban, CreditCard, CheckCircle2, Clock, Filter, 
  ArrowLeft, Shield, Target, Briefcase, FileText, CheckSquare,
  RotateCcw, Sparkles, AlertCircle, Trash2, Calendar
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
  const [typeFilter, setTypeFilter] = React.useState<string>("all")

  const isSuperAdmin = user?.role === "Super Admin"

  const allowedCompanies = React.useMemo(() => {
    if (!user) return []
    if (isSuperAdmin) return companies
    const compIds = (user.companyIds || (user.companyId ? [user.companyId] : ["tech"])).map(id => String(id).toLowerCase().trim())
    return companies.filter(c => compIds.includes(String(c.id).toLowerCase().trim()) || (c.slug && compIds.includes(String(c.slug).toLowerCase().trim())))
  }, [user, companies, isSuperAdmin])


  const loadLogs = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getActivityLogs(selectedCompany)
      setLogs(data)
    } finally {
      setLoading(false)
    }
  }, [selectedCompany])

  React.useEffect(() => {
    loadLogs()
  }, [loadLogs])

  React.useEffect(() => {
    const handleSync = () => loadLogs()
    window.addEventListener("saampark_activity_logged", handleSync)
    window.addEventListener("storage", handleSync)
    return () => {
      window.removeEventListener("saampark_activity_logged", handleSync)
      window.removeEventListener("storage", handleSync)
    }
  }, [loadLogs])

  const handleClearLogs = async () => {
    if (confirm("Are you sure you want to clear the activity log history? This action cannot be undone.")) {
      await clearAllActivityLogs()
      setLogs([])
    }
  }

  // Filter logs by search, company, and category type
  const filteredLogs = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return logs.filter(log => {
      const matchesSearch = !q ||
        (log.action || "").toLowerCase().includes(q) ||
        (log.description || "").toLowerCase().includes(q) ||
        (log.companyName || "").toLowerCase().includes(q) ||
        (log.userName || "").toLowerCase().includes(q) ||
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

      return matchesSearch && matchesType
    })
  }, [logs, searchQuery, typeFilter])

  // Count categories for KPI cards
  const stats = React.useMemo(() => {
    return {
      total: logs.length,
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
          color: "text-indigo-500",
          bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
          label: "Client Account",
        }
      case "invoice":
      case "quotation":
      case "estimate":
        return {
          icon: FileText,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          label: "Invoice & Billing",
        }
      case "payment":
        return {
          icon: CreditCard,
          color: "text-teal-500",
          bg: "bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400",
          label: "Payment Collection",
        }
      case "project":
        return {
          icon: FolderKanban,
          color: "text-purple-500",
          bg: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
          label: "Project",
        }
      case "task":
        return {
          icon: CheckSquare,
          color: "text-rose-500",
          bg: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
          label: "Task Milestone",
        }
      case "user":
        return {
          icon: User,
          color: "text-sky-500",
          bg: "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400",
          label: "User Account",
        }
      case "company":
      case "branch":
        return {
          icon: Building2,
          color: "text-violet-500",
          bg: "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400",
          label: "Organisation",
        }
      default:
        return {
          icon: CheckCircle2,
          color: "text-zinc-500",
          bg: "bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400",
          label: "Activity",
        }
    }
  }

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts)
      if (isNaN(d.getTime())) return "Recently"
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHrs = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHrs < 24) return `${diffHrs}h ago`
      if (diffDays === 1) return "Yesterday"
      if (diffDays < 7) return `${diffDays}d ago`
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
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
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
              Live Real-Time Tracker
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete audit trail of system events: permission changes, new leads, client conversions, billing, and team actions
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
            <span>Refresh Logs</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setTypeFilter("all")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            typeFilter === "all" ? "bg-primary/5 border-primary shadow-xs" : "bg-card border-border hover:border-primary/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">All Activities</span>
            <ClipboardList size={16} className="text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.total}</p>
        </div>

        <div 
          onClick={() => setTypeFilter("permission")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            typeFilter === "permission" ? "bg-amber-500/10 border-amber-500 shadow-xs" : "bg-card border-border hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Permission Changes</span>
            <Shield size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.permissions}</p>
        </div>

        <div 
          onClick={() => setTypeFilter("lead")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            typeFilter === "lead" ? "bg-blue-500/10 border-blue-500 shadow-xs" : "bg-card border-border hover:border-blue-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Leads & Clients</span>
            <Target size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.leadsAndClients}</p>
        </div>

        <div 
          onClick={() => setTypeFilter("finance")}
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
      <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search activities by action, user, module, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Company Filter */}
          <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs">
            <Building2 size={13} className="text-muted-foreground" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-transparent text-xs text-foreground font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Companies</option>
              {allowedCompanies.map(c => (
                <option key={c.id} value={c.id}>
                  {getCompanyFullName(c)}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter Buttons */}
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
            {searchQuery || typeFilter !== "all" 
              ? "No activities matched your search criteria. Try resetting the filters."
              : "System actions such as creating leads, updating clients, modifying permissions, or billing will appear here automatically."}
          </p>
          {(searchQuery || typeFilter !== "all") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setSearchQuery(""); setTypeFilter("all") }}
              className="text-xs font-semibold"
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

                {/* Actor & Timestamp */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border text-right">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                      {(log.userName || "U")[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {log.userName || "System"}
                    </span>
                    {log.userRole && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({log.userRole})
                      </span>
                    )}
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
