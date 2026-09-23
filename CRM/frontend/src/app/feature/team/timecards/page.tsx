"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Clock, Plus, Search, Calendar, CheckCircle2, AlertCircle, 
  Users, Monitor, Building2, MapPin, X, Trash2, Edit2, Play, Square,
  Filter, Download, ChevronDown, Coffee, Briefcase, Home, Navigation,
  Printer, ShieldCheck, Check, Sparkles, AlertTriangle, ArrowUpRight
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useAuthStore, getCompanyFullName, isMatchingCompany } from "@/store/useAuthStore"
import { useTimerStore, WorkMode } from "@/store/useTimerStore"
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
  subBranchName?: string
  workMode?: WorkMode
  inDate: string
  inTime: string
  outDate?: string
  outTime?: string
  breakDurationMins?: number
  durationSecs: number
  status: "Active Shift" | "Completed" | "Late" | "Half Day" | "On Break" | "Overtime"
  isVerified?: boolean
  notes?: string
}

export default function AttendanceTimecardsPage() {
  const { user, companies, branches, subBranches, activeCompanyId, activeBranchId } = useAuthStore()
  const { 
    isClockedIn, 
    isOnBreak, 
    clockInTime, 
    clockInDate, 
    clockInTimeString,
    workMode,
    breakStartTime,
    breakSeconds,
    secondsElapsed, 
    clockIn, 
    clockOut, 
    startBreak, 
    endBreak, 
    setWorkMode,
    tick 
  } = useTimerStore()

  const [activeTab, setActiveTab] = React.useState<"all" | "clocked_in" | "today" | "late" | "breaks">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedMemberFilter, setSelectedMemberFilter] = React.useState("all")
  const [selectedDateFilter, setSelectedDateFilter] = React.useState<string>("")
  const [timecards, setTimecards] = React.useState<TimeCardRecord[]>([])
  const [teamMembers, setTeamMembers] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Manual Add / Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [editingCardId, setEditingCardId] = React.useState<string | null>(null)
  const [selectedWorkMode, setSelectedWorkMode] = React.useState<WorkMode>("Office")
  const [manualForm, setManualForm] = React.useState({
    memberEmail: "",
    date: new Date().toISOString().split("T")[0],
    inTime: "09:30",
    outTime: "18:30",
    workMode: "Office" as WorkMode,
    breakMins: 45,
    status: "Completed" as TimeCardRecord["status"],
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
          workMode: idx % 3 === 0 ? "Office" : (idx % 3 === 1 ? "Work From Home" : "Field / Client Visit"),
          inDate: idx % 2 === 0 ? todayStr : yesterday,
          inTime: idx === 2 ? "10:15 AM" : (idx % 2 === 0 ? "09:30 AM" : "09:45 AM"),
          outDate: idx === 0 ? undefined : (idx % 2 === 0 ? todayStr : yesterday),
          outTime: idx === 0 ? undefined : "06:30 PM",
          breakDurationMins: 45,
          durationSecs: idx === 0 ? 14400 : 29700,
          status: idx === 0 ? "Active Shift" : (idx === 2 ? "Late" : "Completed"),
          isVerified: idx !== 0,
          notes: idx === 0 ? "Currently active on project sprint" : (idx === 2 ? "Late arrival: metro transit delay" : "Regular verified shift")
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

  React.useEffect(() => {
    setSelectedMemberFilter("all")
  }, [activeCompanyId])

  React.useEffect(() => {
    const handleSwitch = () => {
      setSelectedMemberFilter("all")
      loadData()
    }
    window.addEventListener("saampark_company_switched", handleSwitch)
    window.addEventListener("saampark_data_synced", handleSwitch)
    window.addEventListener("storage", handleSwitch)
    return () => {
      window.removeEventListener("saampark_company_switched", handleSwitch)
      window.removeEventListener("saampark_data_synced", handleSwitch)
      window.removeEventListener("storage", handleSwitch)
    }
  }, [loadData])

  // Handle Team Member Punch In / Punch Out
  const handleUserClockToggle = async () => {
    if (!user) return
    const now = new Date()
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    const dateStr = now.toISOString().split("T")[0]
    const effectiveCompanyId = (activeCompanyId && activeCompanyId !== "all") ? activeCompanyId : (user.companyId || "tech")

    // Check if punch in is late (after 09:45 AM)
    const isLatePunch = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 45)

    if (!isClockedIn) {
      // Clock In
      clockIn(selectedWorkMode)
      const newCard: TimeCardRecord = {
        id: `tc_${Date.now()}`,
        userId: String(user.id),
        memberName: user.name,
        memberEmail: user.email,
        memberRole: user.role,
        memberAvatar: user.avatar || (user as any).avatarUrl || getUserAvatar(user.name, undefined, user.name),
        companyId: effectiveCompanyId,
        branchName: (user as any).branchName || "Main HQ",
        workMode: selectedWorkMode,
        inDate: dateStr,
        inTime: timeStr,
        breakDurationMins: 0,
        durationSecs: 0,
        status: isLatePunch ? "Late" : "Active Shift",
        isVerified: false,
        notes: `Clocked in via portal (${selectedWorkMode})`
      }
      const updated = [newCard, ...timecards]
      setTimecards(updated)
      await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
    } else {
      // Clock Out
      clockOut()
      const userEmailNorm = user.email.toLowerCase().trim()
      const breakMins = Math.round(breakSeconds / 60)
      const updated = timecards.map(tc => {
        if (tc.memberEmail.toLowerCase().trim() === userEmailNorm && (tc.status === "Active Shift" || tc.status === "Late" || tc.status === "On Break")) {
          const finalDuration = secondsElapsed > 0 ? secondsElapsed : 28800
          const finalStatus: TimeCardRecord["status"] = finalDuration > 32400 ? "Overtime" : (finalDuration < 14400 ? "Half Day" : (tc.status === "Late" ? "Late" : "Completed"))
          return {
            ...tc,
            outDate: dateStr,
            outTime: timeStr,
            breakDurationMins: breakMins,
            durationSecs: finalDuration,
            status: finalStatus,
            notes: tc.notes ? `${tc.notes} | Clocked out at ${timeStr}` : `Clocked out at ${timeStr}`
          }
        }
        return tc
      })
      setTimecards(updated)
      await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
    }
  }

  // Handle Break Toggle for Team Member
  const handleBreakToggle = async () => {
    if (!user || !isClockedIn) return
    const userEmailNorm = user.email.toLowerCase().trim()
    if (!isOnBreak) {
      startBreak()
      const updated = timecards.map(tc => {
        if (tc.memberEmail.toLowerCase().trim() === userEmailNorm && tc.status === "Active Shift") {
          return { ...tc, status: "On Break" as const }
        }
        return tc
      })
      setTimecards(updated)
      await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
    } else {
      endBreak()
      const updated = timecards.map(tc => {
        if (tc.memberEmail.toLowerCase().trim() === userEmailNorm && tc.status === "On Break") {
          return { ...tc, status: "Active Shift" as const }
        }
        return tc
      })
      setTimecards(updated)
      await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
    }
  }

  // Handle Manual Add or Edit Timecard
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualForm.memberEmail) return

    const memberObj = teamMembers.find(m => m.email.toLowerCase() === manualForm.memberEmail.toLowerCase()) || {
      name: manualForm.memberEmail.split("@")[0],
      email: manualForm.memberEmail,
      role: "Teams",
      companyId: activeCompanyId || "tech"
    }

    // Calculate duration in seconds (net after breaks)
    const [inH, inM] = manualForm.inTime.split(":").map(Number)
    const [outH, outM] = manualForm.outTime.split(":").map(Number)
    let totalMins = (outH * 60 + outM) - (inH * 60 + inM)
    if (totalMins < 0) totalMins += 24 * 60
    totalMins = Math.max(0, totalMins - (manualForm.breakMins || 0))

    const effectiveCompanyId = (activeCompanyId && activeCompanyId !== "all") 
      ? activeCompanyId 
      : (memberObj.companyId || user?.companyId || "tech")

    if (editingCardId) {
      const updated = timecards.map(tc => {
        if (tc.id === editingCardId) {
          return {
            ...tc,
            memberName: memberObj.name || manualForm.memberEmail,
            memberEmail: manualForm.memberEmail,
            workMode: manualForm.workMode,
            inDate: manualForm.date,
            inTime: manualForm.inTime,
            outDate: manualForm.date,
            outTime: manualForm.outTime,
            breakDurationMins: manualForm.breakMins,
            durationSecs: totalMins * 60,
            status: manualForm.status,
            notes: manualForm.notes || "Updated by administrator"
          }
        }
        return tc
      })
      setTimecards(updated)
      await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
    } else {
      const newCard: TimeCardRecord = {
        id: `tc_manual_${Date.now()}`,
        userId: String(memberObj.id || ""),
        memberName: memberObj.name || manualForm.memberEmail,
        memberEmail: manualForm.memberEmail,
        memberRole: memberObj.role || "Teams",
        memberAvatar: memberObj.avatar || memberObj.avatarUrl || getUserAvatar(memberObj.name, undefined, memberObj.name),
        companyId: effectiveCompanyId,
        branchName: memberObj.branchName || "Main HQ",
        workMode: manualForm.workMode,
        inDate: manualForm.date,
        inTime: manualForm.inTime,
        outDate: manualForm.date,
        outTime: manualForm.outTime,
        breakDurationMins: manualForm.breakMins,
        durationSecs: totalMins * 60,
        status: manualForm.status,
        isVerified: true,
        notes: manualForm.notes || "Manually recorded by administrator"
      }
      const updated = [newCard, ...timecards]
      setTimecards(updated)
      await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
    }

    setIsAddModalOpen(false)
    setEditingCardId(null)
    setManualForm({
      memberEmail: "",
      date: new Date().toISOString().split("T")[0],
      inTime: "09:30",
      outTime: "18:30",
      workMode: "Office",
      breakMins: 45,
      status: "Completed",
      notes: ""
    })
  }

  // Open Edit Modal for a Record
  const handleEditTimecard = (tc: TimeCardRecord) => {
    setEditingCardId(tc.id)
    setManualForm({
      memberEmail: tc.memberEmail,
      date: tc.inDate || new Date().toISOString().split("T")[0],
      inTime: tc.inTime || "09:30",
      outTime: tc.outTime || "18:30",
      workMode: tc.workMode || "Office",
      breakMins: tc.breakDurationMins || 45,
      status: tc.status,
      notes: tc.notes || ""
    })
    setIsAddModalOpen(true)
  }

  // Verify / Approve Timecard Record
  const handleVerifyTimecard = async (id: string) => {
    const updated = timecards.map(tc => tc.id === id ? { ...tc, isVerified: true } : tc)
    setTimecards(updated)
    await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
  }

  // Delete a timecard record
  const handleDeleteTimecard = async (id: string) => {
    if (!confirm("Are you sure you want to remove this attendance record?")) return
    const updated = timecards.filter(tc => tc.id !== id)
    setTimecards(updated)
    await saveModuleDataToDB("timecards", updated, "all").catch(() => {})
  }

  // Export Attendance to CSV
  const handleExportCSV = () => {
    const headers = ["Employee Name", "Email", "Role", "Date", "Work Mode", "Punch In", "Punch Out", "Break (Mins)", "Net Duration (Hrs)", "Status", "Notes"]
    const rows = filteredTimecards.map(tc => [
      `"${tc.memberName}"`,
      `"${tc.memberEmail}"`,
      `"${tc.memberRole || 'Teams'}"`,
      `"${tc.inDate}"`,
      `"${tc.workMode || 'Office'}"`,
      `"${tc.inTime}"`,
      `"${tc.outTime || 'Active'}"`,
      tc.breakDurationMins || 0,
      (tc.durationSecs / 3600).toFixed(2),
      `"${tc.status}"`,
      `"${tc.notes || ''}"`
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Saampark_Attendance_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Scoped Team Members (STRICTLY by active company)
  const scopedTeamMembers = React.useMemo(() => {
    if (!activeCompanyId || activeCompanyId === "all") return teamMembers
    return teamMembers.filter(m => {
      if (Array.isArray(m.companyIds) && m.companyIds.length > 0) {
        return m.companyIds.some((cid: any) => isMatchingCompany({ id: cid, slug: cid } as any, activeCompanyId))
      }
      if (typeof m.companyIds === "string") {
        try {
          const parsed = JSON.parse(m.companyIds)
          if (Array.isArray(parsed)) {
            return parsed.some((cid: any) => isMatchingCompany({ id: cid, slug: cid } as any, activeCompanyId))
          }
        } catch {}
      }
      const cId = m.companyId || m.company_id || m.company
      if (!cId) return false
      return isMatchingCompany({ id: cId, slug: cId } as any, activeCompanyId)
    })
  }, [teamMembers, activeCompanyId])

  // Company Scoped Timecards for stats & aggregate KPIs
  const companyScopedTimecards = React.useMemo(() => {
    if (!activeCompanyId || activeCompanyId === "all") return timecards
    return timecards.filter(tc => {
      const tcComp = tc.companyId || (tc as any).company_id || (tc as any).company
      if (!tcComp) return false
      return isMatchingCompany({ id: tcComp, slug: tcComp } as any, activeCompanyId)
    })
  }, [timecards, activeCompanyId])

  // Filtered Timecards (with member & tab filters applied on top of company scope)
  const todayStr = new Date().toISOString().split("T")[0]
  const filteredTimecards = React.useMemo(() => {
    return companyScopedTimecards.filter(tc => {
      // 1. Member filter
      if (selectedMemberFilter !== "all") {
        if (tc.memberEmail.toLowerCase() !== selectedMemberFilter.toLowerCase()) return false
      }

      // 2. Date filter
      if (selectedDateFilter && tc.inDate !== selectedDateFilter) {
        return false
      }

      // 3. Tab filter
      if (activeTab === "clocked_in" && tc.status !== "Active Shift") return false
      if (activeTab === "today" && tc.inDate !== todayStr) return false
      if (activeTab === "late" && tc.status !== "Late") return false
      if (activeTab === "breaks" && tc.status !== "On Break") return false

      // 4. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          tc.memberName.toLowerCase().includes(q) ||
          tc.memberEmail.toLowerCase().includes(q) ||
          (tc.memberRole && tc.memberRole.toLowerCase().includes(q)) ||
          (tc.workMode && tc.workMode.toLowerCase().includes(q))
        )
      }

      return true
    })
  }, [companyScopedTimecards, selectedMemberFilter, selectedDateFilter, activeTab, searchQuery, todayStr])

  // Aggregate Stats (CALCULATED ON REAL COMPANY SCOPED CARDS)
  const activeClockedInCount = companyScopedTimecards.filter(tc => tc.status === "Active Shift" || tc.status === "On Break").length
  const todayPresentCount = companyScopedTimecards.filter(tc => tc.inDate === todayStr).length
  const lateArrivalsCount = companyScopedTimecards.filter(tc => tc.status === "Late" || (tc.inDate === todayStr && tc.inTime > "09:45")).length
  const onBreakCount = companyScopedTimecards.filter(tc => tc.status === "On Break").length
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

  const isTeamMember = user?.role === "Teams"
  const isAdminOrSuper = user?.role === "Super Admin" || user?.role === "Admin"

  return (
    <div className="space-y-6 max-w-[1550px] mx-auto p-4 sm:p-6 pb-24 font-sans">
      {/* ── HEADER & DIGITAL SHIFT BANNER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Clock size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Attendance & Shift Management Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold text-[11px] border border-blue-200/60 dark:border-blue-900/60">
                  Saampark HRM
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time digital shift punch card, break tracker, verified logs, and payroll analytics
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Team Member Punch Widget */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* If Team Member: Show Quick Punch In / Out & Break Bar */}
          {isTeamMember && (
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-zinc-800/90 p-2 rounded-2xl border border-slate-200 dark:border-zinc-700">
              {/* Work Mode Select */}
              {!isClockedIn && (
                <select
                  value={selectedWorkMode}
                  onChange={(e) => setSelectedWorkMode(e.target.value as WorkMode)}
                  className="text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-zinc-200 font-bold outline-none cursor-pointer"
                >
                  <option value="Office">🏢 Office</option>
                  <option value="Work From Home">🏠 Work From Home</option>
                  <option value="Field / Client Visit">🚗 Field Visit</option>
                </select>
              )}

              {/* Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  isOnBreak ? "bg-amber-500 animate-ping" : (isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-400")
                }`} />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    {isOnBreak ? "On Break" : (isClockedIn ? "Active Shift" : "Shift Status")}
                  </p>
                  <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                    {isClockedIn ? formatLiveSeconds(secondsElapsed) : "Clocked Out"}
                  </p>
                </div>
              </div>

              {/* Break Button (if clocked in) */}
              {isClockedIn && (
                <Button
                  onClick={handleBreakToggle}
                  variant="outline"
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    isOnBreak ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300" : ""
                  }`}
                >
                  <Coffee size={14} />
                  <span>{isOnBreak ? "End Break" : "Take Break"}</span>
                </Button>
              )}

              {/* Punch Button */}
              <Button
                onClick={handleUserClockToggle}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                  isClockedIn 
                    ? "bg-rose-600 hover:bg-rose-700 text-white" 
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {isClockedIn ? <Square size={14} /> : <Play size={14} />}
                <span>{isClockedIn ? "Punch Out" : "Punch In Now"}</span>
              </Button>
            </div>
          )}

          {/* Admin Tools: Add Record & Export */}
          {isAdminOrSuper && (
            <Button
              onClick={() => {
                setEditingCardId(null)
                setManualForm({
                  memberEmail: scopedTeamMembers[0]?.email || "",
                  date: new Date().toISOString().split("T")[0],
                  inTime: "09:30",
                  outTime: "18:30",
                  workMode: "Office",
                  breakMins: 45,
                  status: "Completed",
                  notes: ""
                })
                setIsAddModalOpen(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
            >
              <Plus size={15} />
              <span>Record Shift Manually</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => window.print()}
            className="text-xs font-semibold px-3 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer bg-white dark:bg-zinc-800"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print</span>
          </Button>
        </div>
      </div>

      {/* ── REAL-TIME KPI METRICS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-zinc-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Staff</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {scopedTeamMembers.length || 1}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Enrolled Members</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Present Today</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {todayPresentCount}
          </p>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Logged In Today</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Shifts</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {activeClockedInCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Currently Working</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Late Arrivals</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {lateArrivalsCount}
          </p>
          <p className="text-[10px] text-amber-600/80 mt-0.5">After 09:45 AM</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">On Break</span>
            <Coffee size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {onBreakCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Tea / Lunch Break</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Logged Hours</span>
            <Clock size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {totalCompletedHours} <span className="text-sm font-semibold">hrs</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total Cumulative</p>
        </div>
      </div>

      {/* ── FILTERS, SEARCH & TABS ── */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-3.5">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs font-bold">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              All Records ({companyScopedTimecards.length})
            </button>
            <button
              onClick={() => setActiveTab("clocked_in")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "clocked_in"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Shifts ({activeClockedInCount})</span>
            </button>
            <button
              onClick={() => setActiveTab("today")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "today"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              Today's Logs ({todayPresentCount})
            </button>
            <button
              onClick={() => setActiveTab("late")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "late"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              Late Arrivals ({lateArrivalsCount})
            </button>
            <button
              onClick={() => setActiveTab("breaks")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "breaks"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              On Break ({onBreakCount})
            </button>
          </div>

          {/* Search, Member Filter & Date Picker */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Filter */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-zinc-200">
              <Calendar size={13} className="text-slate-400" />
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
              />
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter("")}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Team Member Select */}
            <select
              value={selectedMemberFilter}
              onChange={(e) => setSelectedMemberFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-slate-700 dark:text-zinc-200 font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Team Members ({scopedTeamMembers.length})</option>
              {scopedTeamMembers.map(m => (
                <option key={m.id || m.email} value={m.email}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-44 sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, mode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* ── ATTENDANCE LOG TABLE ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                <th className="pb-3 pr-4">Team Member</th>
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Work Mode</th>
                <th className="pb-3 px-3">Punch In</th>
                <th className="pb-3 px-3">Punch Out</th>
                <th className="pb-3 px-3 text-center">Break</th>
                <th className="pb-3 px-3 text-center">Net Working Duration</th>
                <th className="pb-3 px-3 text-center">Shift Status</th>
                <th className="pb-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredTimecards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <p className="text-4xl mb-2">⏱️</p>
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No attendance records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedDateFilter ? "No attendance entries on the selected date" : "Use Punch In or Record Shift Manually to record hours"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTimecards.map((tc) => {
                  const isActiveShift = tc.status === "Active Shift"
                  const isOnBreakNow = tc.status === "On Break"
                  const isLateShift = tc.status === "Late"

                  return (
                    <tr key={tc.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors group">
                      {/* Team Member Column */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3 min-w-[210px]">
                          <img
                            src={tc.memberAvatar || getUserAvatar(tc.memberName, undefined, tc.memberName)}
                            alt={tc.memberName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0 shadow-xs"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {tc.memberName}
                              </p>
                              {tc.isVerified && (
                                <ShieldCheck size={13} className="text-blue-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold text-slate-500 dark:text-slate-400">{tc.memberRole || "Teams"}</span>
                              <span>·</span>
                              <span>{tc.memberEmail}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                        {tc.inDate}
                      </td>

                      {/* Work Mode */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-[11px] border border-slate-200/80 dark:border-zinc-700">
                          {tc.workMode === "Work From Home" ? <Home size={12} className="text-purple-500" /> : 
                           tc.workMode === "Field / Client Visit" ? <Navigation size={12} className="text-amber-500" /> : 
                           <Building2 size={12} className="text-blue-500" />}
                          <span>{tc.workMode || "Office"}</span>
                        </span>
                      </td>

                      {/* In Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                          isLateShift
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800"
                        }`}>
                          <Clock size={11} />
                          <span>{tc.inTime}</span>
                        </span>
                      </td>

                      {/* Out Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isActiveShift || isOnBreakNow ? (
                          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                            Live Active
                          </span>
                        ) : tc.outTime ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 font-semibold border border-slate-200/60 dark:border-zinc-700">
                            {tc.outTime}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Break Duration */}
                      <td className="py-3.5 px-3 text-center text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {tc.breakDurationMins ? `${tc.breakDurationMins}m` : "—"}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-3 text-center font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {isActiveShift && user?.email.toLowerCase() === tc.memberEmail.toLowerCase() ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatLiveSeconds(secondsElapsed)}
                          </span>
                        ) : (
                          formatDuration(tc.durationSecs)
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isOnBreakNow
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                            : isActiveShift
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 animate-pulse"
                            : isLateShift
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                            : tc.status === "Half Day"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border border-orange-200"
                            : tc.status === "Overtime"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border border-purple-200"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200"
                        }`}>
                          <span>{tc.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {isAdminOrSuper && !tc.isVerified && (
                            <button
                              onClick={() => handleVerifyTimecard(tc.id)}
                              title="Approve & Verify Attendance"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          {isAdminOrSuper && (
                            <button
                              onClick={() => handleEditTimecard(tc)}
                              title="Edit Record"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {isAdminOrSuper && (
                            <button
                              onClick={() => handleDeleteTimecard(tc.id)}
                              title="Delete Record"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MANUAL ADD / EDIT MODAL ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {editingCardId ? "Edit Attendance Shift" : "Record Shift Manually"}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Official administrator attendance modification
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleManualAddSubmit} className="space-y-4 pt-4">
                {/* Team Member */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Team Member
                  </label>
                  <select
                    value={manualForm.memberEmail}
                    onChange={(e) => setManualForm({ ...manualForm, memberEmail: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an Employee...</option>
                    {scopedTeamMembers.map(m => (
                      <option key={m.id || m.email} value={m.email}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Shift Date
                    </label>
                    <input
                      type="date"
                      value={manualForm.date}
                      onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Work Mode */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Work Mode
                    </label>
                    <select
                      value={manualForm.workMode}
                      onChange={(e) => setManualForm({ ...manualForm, workMode: e.target.value as WorkMode })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Office">🏢 Office (HQ)</option>
                      <option value="Work From Home">🏠 Work From Home</option>
                      <option value="Field / Client Visit">🚗 Field / On-Site</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Punch In */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Punch In
                    </label>
                    <input
                      type="time"
                      value={manualForm.inTime}
                      onChange={(e) => setManualForm({ ...manualForm, inTime: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Punch Out */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Punch Out
                    </label>
                    <input
                      type="time"
                      value={manualForm.outTime}
                      onChange={(e) => setManualForm({ ...manualForm, outTime: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Break Mins */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Break (Mins)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={180}
                      value={manualForm.breakMins}
                      onChange={(e) => setManualForm({ ...manualForm, breakMins: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Shift Status
                    </label>
                    <select
                      value={manualForm.status}
                      onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Completed">✅ Completed</option>
                      <option value="Active Shift">🟢 Active Shift</option>
                      <option value="Late">🟡 Late Arrival</option>
                      <option value="Half Day">🟠 Half Day</option>
                      <option value="Overtime">🟣 Overtime</option>
                      <option value="On Break">☕ On Break</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Notes / Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Approved shift adjustment"
                      value={manualForm.notes}
                      onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    {editingCardId ? "Update Record" : "Save Attendance"}
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
