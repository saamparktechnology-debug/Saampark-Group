"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  ClipboardList, Search, Building2, GitBranch, User, 
  FolderKanban, CreditCard, CheckCircle2, Clock, Filter, ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { useAuthStore, getCompanyFullName, isMatchingCompany } from "@/store/useAuthStore"
import { getActivityLogs, ActivityLog } from "@/services/activityLogService"

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
    const compIds = user.companyIds || (user.companyId ? [user.companyId] : ["tech"])
    return companies.filter(c => compIds.some(id => isMatchingCompany(c, id)))
  }, [user, isSuperAdmin, companies])

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

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.companyName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userName || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || log.type === typeFilter
    return matchesSearch && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "company": return <Building2 size={16} className="text-blue-600" />
      case "branch": return <GitBranch size={16} className="text-amber-600" />
      case "user": return <User size={16} className="text-purple-600" />
      case "project": return <FolderKanban size={16} className="text-pink-600" />
      case "payment": return <CreditCard size={16} className="text-emerald-600" />
      default: return <CheckCircle2 size={16} className="text-indigo-600" />
    }
  }

  const getTypeBg = (type: string) => {
    switch (type) {
      case "company": return "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900"
      case "branch": return "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900"
      case "user": return "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900"
      case "project": return "bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-900"
      case "payment": return "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900"
      default: return "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900"
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
      if (diffMins < 60) return `${diffMins} min ago`
      if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    } catch {
      return "Recently"
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 sm:p-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/feature/dashboard" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
              <ArrowLeft size={13} /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 border border-blue-200/60 dark:border-blue-800">
              <ClipboardList size={22} />
            </div>
            <span>Company Activity Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail and real-time activity events filtered against company
          </p>
        </div>

        {allowedCompanies.length > 1 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter by Company:</span>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs focus:outline-none cursor-pointer"
            >
              {isSuperAdmin && <option value="all">All Companies</option>}
              {allowedCompanies.map(c => (
                <option key={c.id} value={c.id}>
                  {getCompanyFullName(c)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
            <Building2 size={13} className="text-blue-600" />
            <span>{allowedCompanies[0] ? getCompanyFullName(allowedCompanies[0]) : "Assigned Company"}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activities, company, users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={13} className="text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="company">Company Events</option>
            <option value="branch">Branch Events</option>
            <option value="user">User Events</option>
            <option value="project">Project Events</option>
            <option value="payment">Payment Events</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading activities...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No activity logs found matching the filter.</div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-zinc-800">
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative flex items-start justify-between gap-4"
              >
                <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                </div>

                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={"p-2.5 rounded-xl border shrink-0 " + getTypeBg(log.type)}>
                    {getTypeIcon(log.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {log.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                      {log.companyName && (
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-zinc-300 font-semibold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          <Building2 size={11} className="text-blue-600" /> {log.companyName}
                        </span>
                      )}
                      {log.branchName && (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          <GitBranch size={11} className="text-amber-500" /> {log.branchName}
                        </span>
                      )}
                      {log.userName && <span>by {log.userName}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                    <Clock size={11} /> {formatTime(log.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
