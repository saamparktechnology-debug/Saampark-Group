"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Clock, Plus, Search, Calendar, CheckCircle2, AlertCircle, 
  Users, Monitor, Building2, MapPin, X, Trash2, Edit2, Play, Square,
  Filter, Download, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useAuthStore, getCompanyFullName, isMatchingCompany } from "@/store/useAuthStore"
import { useTimerStore } from "@/store/useTimerStore"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems } from "@/lib/storageSync"
import { getUsers, getUserAvatar } from "../../users/services/userService"

export interface TimeCardRecord {
  id: string
  userId?: string
  memberName: string
  memberEmail: string
  memberRole?: string
  memberAvatar?: string
  companyId: string
  branchName?: string
  inDate: string
  inTime: string
  outDate?: string
  outTime?: string
  durationSecs: number
  status: "Active Shift" | "Completed" | "Late" | "Half Day"
  notes?: string
}

export default function TimeCardsPage() {
  const { user, companies, activeCompanyId } = useAuthStore()
  const { isClockedIn, clockIn, clockOut, secondsElapsed, tick } = useTimerStore()

  const [activeTab, setActiveTab] = React.useState<"all" | "clocked_in" | "today" | "summary">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedMemberFilter, setSelectedMemberFilter] = React.useState("all")
  const [timecards, setTimecards] = React.useState<TimeCardRecord[]>([])
  const [teamMembers, setTeamMembers] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [manualForm, setManualForm] = React.useState({
    memberEmail: "",
    date: new Date().toISOString().split("T")[0],
    inTime: "09:30",
    outTime: "18:30",
    status: "Completed" as const,
    notes: ""
  })

  // Timer tick effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isClockedIn) {
      interval = setInterval(() => tick(), 1000)
    }
    return () => clearInterval(interval)
  }, [isClockedIn, tick])

  // Load team members and timecard records
  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Fetch real users
      const usersList = await getUsers().catch(() => [])
      setTeamMembers(usersList || [])

      // 2. Fetch timecards from DB
      const stored = await fetchModuleDataFromDB<TimeCardRecord[]>("timecards", [], "all").catch(() => [])
      let cleanCards = filterGlobalDeletedItems(stored || [])

      // If no stored timecards, generate realistic baseline attendance logs for registered users
      if (!cleanCards || cleanCards.length === 0) {
        const todayStr = new Date().toISOString().split("T")[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

        const defaultSeedTeam = [
          { name: "Supriya (Super Admin)", email: "hiisupriya@gmail.com", role: "Super Admin", companyId: "tech", branchName: "Kolkata HQ" },
          { name: "Chiranjit Mahapatra", email: "saamparktechnologyresearch@gmail.com", role: "Admin", companyId: "tech", branchName: "Kolkata HQ" },
          { name: "Rakhi Ghosh", email: "rakhighosh25899@gmail.com", role: "Teams", companyId: "tech", branchName: "New Town Branch" },
          { name: "Priya Ghosh", email: "priya@saampark.com", role: "Teams", companyId: "digital", branchName: "Salt Lake Branch" },
          { name: "Rohan Sengupta", email: "rohan@saampark.com", role: "Admin", companyId: "digital", branchName: "Salt Lake Branch" },
          { name: "Anand Verma", email: "anand@saampark.com", role: "Teams", companyId: "saampark-ai-solutions", branchName: "AI Lab Branch" },
          { name: "Kavita Roy", email: "kavita@saampark.com", role: "Teams", companyId: "saampark-ai-solutions", branchName: "AI Lab Branch" }
        ]

        cleanCards = defaultSeedTeam.map((m: any, idx: number) => ({
          id: `tc_init_${idx + 1}`,
          userId: String(idx + 1),
          memberName: m.name,
          memberEmail: m.email,
          memberRole: m.role,
          memberAvatar: getUserAvatar(m.name, undefined, m.name),
          companyId: m.companyId,
          branchName: m.branchName,
          inDate: idx % 2 === 0 ? todayStr : yesterday,
          inTime: idx % 2 === 0 ? "09:30 AM" : "09:45 AM",
          outDate: idx === 0 ? undefined : (idx % 2 === 0 ? todayStr : yesterday),
          outTime: idx === 0 ? undefined : "06:30 PM",
          durationSecs: idx === 0 ? 14400 : 32400,
          status: idx === 0 ? "Active Shift" : "Completed",
          notes: idx === 0 ? "Currently active on sprint session" : "Regular completed shift"
        }))

        await saveModuleDataToDB("timecards", cleanCards, "all").catch(() => {})
      }

      setTimecards(cleanCards)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Handle Current User Punch In / Punch Out
  const handleUserClockToggle = async () => {
    if (!user) return
    const now = new Date()
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    const dateStr = now.toISOString().split("T")[0]
    const effectiveCompanyId = (activeCompanyId && activeCompanyId !== "all") ? activeCompanyId : (user.companyId || "tech")

    if (!isClockedIn) {
      // Clock in
      clockIn()
      const newCard: TimeCardRecord = {
        id: `tc_${Date.now()}`,
        userId: String(user.id),
        memberName: user.name,
        memberEmail: user.email,
        memberRole: user.role,
        memberAvatar: user.avatar || (user as any).avatarUrl || getUserAvatar(user.name, undefined, user.name),
        companyId: effectiveCompanyId,
        branchName: (user as any).branchName || "Main HQ",
        inDate: dateStr,
        inTime: timeStr,
        durationSecs: 0,
        status: "Active Shift",
        notes: "Clocked in from web portal"
      }
      const updated = [newCard, ...timecards]
      setTimecards(updated)
      await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
    } else {
      // Clock out
      clockOut()
      const userEmailNorm = user.email.toLowerCase().trim()
      const updated = timecards.map(tc => {
        if (tc.memberEmail.toLowerCase().trim() === userEmailNorm && tc.status === "Active Shift") {
          return {
            ...tc,
            outDate: dateStr,
            outTime: timeStr,
            durationSecs: secondsElapsed > 0 ? secondsElapsed : 28800,
            status: "Completed" as const,
            notes: "Clocked out normally"
          }
        }
        return tc
      })
      setTimecards(updated)
      await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
    }
  }

  // Handle Manual Timecard Add
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualForm.memberEmail) return

    const memberObj = teamMembers.find(m => m.email.toLowerCase() === manualForm.memberEmail.toLowerCase()) || {
      name: manualForm.memberEmail.split("@")[0],
      email: manualForm.memberEmail,
      role: "Teams",
      companyId: activeCompanyId || "tech"
    }

    // Calculate approximate duration
    const [inH, inM] = manualForm.inTime.split(":").map(Number)
    const [outH, outM] = manualForm.outTime.split(":").map(Number)
    let totalMins = (outH * 60 + outM) - (inH * 60 + inM)
    if (totalMins < 0) totalMins += 24 * 60

    const effectiveCompanyId = (activeCompanyId && activeCompanyId !== "all") 
      ? activeCompanyId 
      : (memberObj.companyId || user?.companyId || "tech")

    const newCard: TimeCardRecord = {
      id: `tc_manual_${Date.now()}`,
      userId: String(memberObj.id || ""),
      memberName: memberObj.name || manualForm.memberEmail,
      memberEmail: manualForm.memberEmail,
      memberRole: memberObj.role || "Teams",
      memberAvatar: memberObj.avatar || memberObj.avatarUrl || getUserAvatar(memberObj.name, undefined, memberObj.name),
      companyId: effectiveCompanyId,
      branchName: memberObj.branchName || "Main HQ",
      inDate: manualForm.date,
      inTime: manualForm.inTime,
      outDate: manualForm.date,
      outTime: manualForm.outTime,
      durationSecs: totalMins * 60,
      status: manualForm.status,
      notes: manualForm.notes || "Manually added by administrator"
    }

    const updated = [newCard, ...timecards]
    setTimecards(updated)
    await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
    setIsAddModalOpen(false)
    setManualForm({
      memberEmail: "",
      date: new Date().toISOString().split("T")[0],
      inTime: "09:30",
      outTime: "18:30",
      status: "Completed",
      notes: ""
    })
  }

  // Delete a timecard record
  const handleDeleteTimecard = async (id: string) => {
    if (!confirm("Are you sure you want to remove this timecard record?")) return
    const updated = timecards.filter(tc => tc.id !== id)
    setTimecards(updated)
    await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
  }

  // Scoped Team Members (STRICTLY by active company)
  const scopedTeamMembers = React.useMemo(() => {
    if (!activeCompanyId || activeCompanyId === "all") return teamMembers
    return teamMembers.filter(m => {
      const cId = m.companyId || m.company || (Array.isArray(m.companyIds) ? m.companyIds[0] : null)
      if (!cId) return false
      return isMatchingCompany({ id: cId, slug: cId } as any, activeCompanyId)
    })
  }, [teamMembers, activeCompanyId])

  // Company Scoped Timecards for stats & aggregate KPIs
  const companyScopedTimecards = React.useMemo(() => {
    if (!activeCompanyId || activeCompanyId === "all") return timecards
    return timecards.filter(tc => isMatchingCompany({ id: tc.companyId, slug: tc.companyId } as any, activeCompanyId))
  }, [timecards, activeCompanyId])

  // Filtered Timecards (with member & tab filters applied on top of company scope)
  const todayStr = new Date().toISOString().split("T")[0]
  const filteredTimecards = React.useMemo(() => {
    return companyScopedTimecards.filter(tc => {
      // 1. Member filter
      if (selectedMemberFilter !== "all") {
        if (tc.memberEmail.toLowerCase() !== selectedMemberFilter.toLowerCase()) return false
      }

      // 2. Tab filter
      if (activeTab === "clocked_in" && tc.status !== "Active Shift") return false
      if (activeTab === "today" && tc.inDate !== todayStr) return false

      // 3. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          tc.memberName.toLowerCase().includes(q) ||
          tc.memberEmail.toLowerCase().includes(q) ||
          (tc.memberRole && tc.memberRole.toLowerCase().includes(q))
        )
      }

      return true
    })
  }, [companyScopedTimecards, selectedMemberFilter, activeTab, searchQuery, todayStr])

  // Aggregate Stats (CALCULATED ON REAL COMPANY SCOPED CARDS)
  const activeClockedInCount = companyScopedTimecards.filter(tc => tc.status === "Active Shift").length
  const completedLogsCount = companyScopedTimecards.filter(t => t.status === "Completed").length
  const totalCompletedHours = Math.round(companyScopedTimecards.reduce((acc, tc) => acc + (tc.durationSecs || 0), 0) / 3600)

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return `${h}h ${m.toString().padStart(2, "0")}m`
  }

  const formatLiveSeconds = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0")
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  return (
    <div className="space-y-6 max-w-[1550px] mx-auto p-4 sm:p-6 pb-24">
      {/* ── HEADER & LIVE SHIFT BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900/50">
              <Clock size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Attendance & Timecards Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live shift monitoring, automated punch times, and team attendance records
              </p>
            </div>
          </div>
        </div>

        {/* Live Personal Clock In / Out Banner */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/80 p-2.5 rounded-2xl border border-slate-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 px-3">
            <span className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400">
                {isClockedIn ? "Active Shift" : "Status"}
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {isClockedIn ? formatLiveSeconds(secondsElapsed) : "Clocked Out"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleUserClockToggle}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
              isClockedIn 
                ? "bg-rose-600 hover:bg-rose-700 text-white" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {isClockedIn ? <Square size={14} /> : <Play size={14} />}
            <span>{isClockedIn ? "Clock Out" : "Clock In Now"}</span>
          </Button>

          {['Super Admin', 'Admin'].includes(user?.role || "") && (
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add Time Manually</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── QUICK COUNTER STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Registered Members</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {scopedTeamMembers.length || 1}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-900">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Currently Working</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {activeClockedInCount}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-900">
            <Monitor size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Completed Logs</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {completedLogsCount}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center border border-purple-200 dark:border-purple-900">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Logged Hours</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalCompletedHours} hrs
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center border border-amber-200 dark:border-amber-900">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* ── FILTER TABS & SEARCH BAR ── */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs font-bold">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              All Records ({companyScopedTimecards.length})
            </button>
            <button
              onClick={() => setActiveTab("clocked_in")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "clocked_in"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Shifts ({activeClockedInCount})</span>
            </button>
            <button
              onClick={() => setActiveTab("today")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "today"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              Today's Logs
            </button>
          </div>

          {/* Search and Member Filter Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Team Member Select */}
            <div className="relative">
              <select
                value={selectedMemberFilter}
                onChange={(e) => setSelectedMemberFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 pr-8 text-slate-700 dark:text-zinc-200 font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Team Members ({scopedTeamMembers.length})</option>
                {scopedTeamMembers.map(m => (
                  <option key={m.id || m.email} value={m.email}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-48 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search member, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ── TIMECARDS TABLE ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                <th className="pb-3 pr-4">Team Member</th>
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Punch In</th>
                <th className="pb-3 px-3">Punch Out</th>
                <th className="pb-3 px-3 text-center">Shift Duration</th>
                <th className="pb-3 px-3 text-center">Shift Status</th>
                <th className="pb-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredTimecards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="text-3xl mb-2">⏱️</p>
                    <p className="font-semibold text-sm">No timecard records found</p>
                    <p className="text-xs text-slate-500 mt-0.5">Use Clock In or Add Time Manually to start recording hours</p>
                  </td>
                </tr>
              ) : (
                filteredTimecards.map((tc) => {
                  const isActiveShift = tc.status === "Active Shift"
                  return (
                    <tr key={tc.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors group">
                      {/* Team Member Column */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <img
                            src={tc.memberAvatar || getUserAvatar(tc.memberName, undefined, tc.memberName)}
                            alt={tc.memberName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                          />
                          <div className="truncate">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {tc.memberName}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              <span>{tc.memberRole || "Team Member"}</span>
                              <span>·</span>
                              <span>{tc.memberEmail}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 font-medium text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                        {tc.inDate}
                      </td>

                      {/* In Time */}
                      <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                          {tc.inTime}
                        </span>
                      </td>

                      {/* Out Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isActiveShift ? (
                          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold animate-pulse text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                            Live Punch In
                          </span>
                        ) : tc.outTime ? (
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 font-semibold">
                            {tc.outTime}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-3 text-center font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {isActiveShift ? (
                          <span className="text-emerald-600 font-mono">
                            {formatLiveSeconds(secondsElapsed)}
                          </span>
                        ) : (
                          formatDuration(tc.durationSecs)
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          isActiveShift
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 animate-pulse"
                            : tc.status === "Late"
                            ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                            : "bg-blue-500/15 text-blue-600 border-blue-500/30"
                        }`}>
                          {tc.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteTimecard(tc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MANUAL TIME ADD MODAL ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div 
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Add Time Card Manually
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleManualAddSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Select Team Member
                  </label>
                  <select
                    required
                    value={manualForm.memberEmail}
                    onChange={(e) => setManualForm({ ...manualForm, memberEmail: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="">-- Choose Employee / Member --</option>
                    {(scopedTeamMembers.length > 0 ? scopedTeamMembers : teamMembers).map(m => (
                      <option key={m.id || m.email} value={m.email}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Work Date
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      In Time
                    </label>
                    <input
                      type="time"
                      required
                      value={manualForm.inTime}
                      onChange={(e) => setManualForm({ ...manualForm, inTime: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Out Time
                    </label>
                    <input
                      type="time"
                      required
                      value={manualForm.outTime}
                      onChange={(e) => setManualForm({ ...manualForm, outTime: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Shift Status
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="Completed">Completed Full Shift</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Late">Late Arrival</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Notes / Work Summary
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of work done during shift..."
                    value={manualForm.notes}
                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-zinc-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Save Time Record
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
