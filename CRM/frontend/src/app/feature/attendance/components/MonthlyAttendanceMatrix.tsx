"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronLeft, ChevronRight, Search, Download, Filter, 
  Calendar, CheckCircle2, Clock, AlertCircle, XCircle, 
  PlaneTakeoff, Sparkles, Coffee, RefreshCw, UserCheck, 
  Building2, MapPin, Eye, FileSpreadsheet
} from "lucide-react"
import { useAuthStore, isMatchingCompany, getCanonicalCompanyId } from "@/store/useAuthStore"
import { fetchModuleDataFromDB, filterGlobalDeletedItems } from "@/lib/storageSync"
import { LeaveService } from "@/services/hrService"
import { getUsers, getUserAvatar } from "../../users/services/userService"
import { TimeCardRecord } from "../team/timecards/page"
import { EmployeeMonthlyAttendance, DayPunchDetail, AttendanceDayStatus } from "../types"
import AttendanceTypeLegend from "./AttendanceTypeLegend"
import AttendanceSummaryCards from "./AttendanceSummaryCards"
import DayPunchModal from "./DayPunchModal"
import { Button } from "@/components/ui/Button"

// Common Indian / Corporate Public Holidays (month is 0-indexed)
const STANDARD_HOLIDAYS: Record<string, string> = {
  "01-01": "New Year's Day",
  "01-26": "Republic Day",
  "05-01": "May Day",
  "08-15": "Independence Day",
  "10-02": "Gandhi Jayanti",
  "10-24": "Dussehra",
  "11-01": "Diwali Festival",
  "11-15": "Guru Nanak Jayanti",
  "12-25": "Christmas Day"
}

export default function MonthlyAttendanceMatrix() {
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  // Date Navigation State
  const today = new Date()
  const [selectedYear, setSelectedYear] = React.useState<number>(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = React.useState<number>(today.getMonth()) // 0 = Jan, 10 = Nov

  // Data State
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [teamMembers, setTeamMembers] = React.useState<any[]>([])
  const [timecards, setTimecards] = React.useState<TimeCardRecord[]>([])
  const [approvedLeaves, setApprovedLeaves] = React.useState<any[]>([])
  
  // Filter & Search State
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [branchFilter, setBranchFilter] = React.useState<string>("all")
  
  // Modal State
  const [selectedCell, setSelectedCell] = React.useState<{
    employee: EmployeeMonthlyAttendance
    detail: DayPunchDetail
  } | null>(null)

  // Month Navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(prev => prev - 1)
    } else {
      setSelectedMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(prev => prev + 1)
    } else {
      setSelectedMonth(prev => prev + 1)
    }
  }

  const handleCurrentMonth = () => {
    setSelectedYear(today.getFullYear())
    setSelectedMonth(today.getMonth())
  }

  // Helper to match employee with active company
  const matchEmployeeToCompany = React.useCallback((emp: any, targetCompId?: string) => {
    if (!targetCompId || targetCompId === "all" || targetCompId === "group" || targetCompId === "saampark-group") return true
    const canonTarget = getCanonicalCompanyId(targetCompId)
    
    // Super Admin belongs to all companies
    if (emp.role === "Super Admin" || emp.email?.toLowerCase().trim() === "saampark.official@gmail.com") {
      return true
    }

    // Direct companyId
    const empComp = getCanonicalCompanyId(emp.companyId || (emp as any).company_id)
    if (empComp && empComp === canonTarget) return true

    // Assigned companyIds list
    const rawCompIds = emp.companyIds || (emp as any).company_ids
    let userCompIds: string[] = []
    if (Array.isArray(rawCompIds)) {
      userCompIds = rawCompIds
    } else if (typeof rawCompIds === "string") {
      try { userCompIds = JSON.parse(rawCompIds) } catch { userCompIds = [rawCompIds] }
    }
    if (userCompIds.some(id => getCanonicalCompanyId(id) === canonTarget)) return true

    // Company name
    if (emp.companyName) {
      const compNameCanon = getCanonicalCompanyId(emp.companyName)
      if (compNameCanon && compNameCanon === canonTarget) return true
    }

    return false
  }, [])

  // Load Data
  const loadAttendanceData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [usersList, storedCards, leaveRequests] = await Promise.all([
        getUsers("all").catch(() => []),
        fetchModuleDataFromDB<TimeCardRecord[]>("timecards", [], "all").catch(() => []),
        LeaveService.getRequests().catch(() => [])
      ])

      // Only staff/employees (exclude Clients from attendance)
      const staffUsers = (usersList || []).filter(u => u && u.role !== "Clients" && !String(u.role || "").toLowerCase().includes("client"))
      setTeamMembers(staffUsers)

      // Purge fake mock emails if present
      const DEMO_EMAILS = new Set(["hiisupriya@gmail.com", "priya@saampark.com", "rohan@saampark.com", "anand@saampark.com", "kavita@saampark.com"])
      const realCards = filterGlobalDeletedItems(storedCards || []).filter(c => !DEMO_EMAILS.has((c.memberEmail || "").toLowerCase().trim()))
      setTimecards(realCards)

      // Filter only approved leaves
      const approvedOnly = (leaveRequests || []).filter(
        (l: any) => (l.status || "").toLowerCase().trim() === "approved"
      )
      setApprovedLeaves(approvedOnly)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadAttendanceData()
  }, [loadAttendanceData])

  // Reload when company changes or events fire
  React.useEffect(() => {
    const handleSync = () => loadAttendanceData()
    window.addEventListener("saampark_company_switched", handleSync)
    window.addEventListener("saampark_data_synced", handleSync)
    return () => {
      window.removeEventListener("saampark_company_switched", handleSync)
      window.removeEventListener("saampark_data_synced", handleSync)
    }
  }, [loadAttendanceData])

  // Calculate days in the selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleDateString("en-IN", { month: "long" })
  const monthDaysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Format YYYY-MM-DD
  const formatDateStr = (day: number) => {
    const m = String(selectedMonth + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    return `${selectedYear}-${m}-${d}`
  }

  // Check if a date is a public holiday
  const checkHoliday = (day: number) => {
    const m = String(selectedMonth + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    const key = `${m}-${d}`
    return STANDARD_HOLIDAYS[key] || null
  }

  // Build the attendance matrix per employee
  const employeeMatrix: EmployeeMonthlyAttendance[] = React.useMemo(() => {
    const effectiveCompanyId = activeCompanyId && activeCompanyId !== "all" ? activeCompanyId : undefined

    // Filter staff employees by company & branch
    const filteredEmployees = teamMembers.filter(emp => {
      // 1. Exclude Clients
      const isClient = emp.role === "Clients" || String(emp.role || "").toLowerCase().includes("client")
      if (isClient) return false

      // 2. Company check
      if (!matchEmployeeToCompany(emp, effectiveCompanyId)) {
        return false
      }

      // 3. Branch check
      const effBranch = branchFilter !== "all" ? branchFilter : (activeBranchId && activeBranchId !== "all" ? activeBranchId : "all")
      if (effBranch !== "all") {
        const bTarget = String(effBranch).toLowerCase().trim()
        const empBId = String(emp.branchId || emp.branch_id || "").toLowerCase().trim()
        const empBName = String(emp.branchName || emp.branch_name || "").toLowerCase().trim()
        const isGlobalStaff = emp.role === "Super Admin" || (!empBId && emp.role === "Admin")
        if (!isGlobalStaff && empBId !== bTarget && empBName !== bTarget && !empBName.includes(bTarget)) {
          return false
        }
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = (emp.name || "").toLowerCase().includes(q)
        const matchEmail = (emp.email || "").toLowerCase().includes(q)
        const matchRole = (emp.role || "").toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchRole) return false
      }

      return true
    })

    const todayDateStr = today.toISOString().split("T")[0]
    const todayTime = today.getTime()

    return filteredEmployees.map(emp => {
      const empEmail = (emp.email || "").toLowerCase().trim()
      const empId = String(emp.id || "")
      const empName = (emp.name || "").toLowerCase().trim()

      let totalWorkedSecs = 0
      let totalPresent = 0
      let totalHalfDays = 0
      let totalLate = 0
      let totalLeaves = 0
      let totalAbsents = 0
      let totalDaysOff = 0
      let totalHolidays = 0

      const dailyDetails: Record<number, DayPunchDetail> = {}

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDateStr(day)
        const currentDateObj = new Date(selectedYear, selectedMonth, day)
        const dayOfWeekIdx = currentDateObj.getDay()
        const dayOfWeekShort = currentDateObj.toLocaleDateString("en-US", { weekday: "narrow" }) // M, T, W...
        const isSunday = dayOfWeekIdx === 0
        const isPastDate = currentDateObj.getTime() < todayTime && dateStr !== todayDateStr
        const isToday = dateStr === todayDateStr
        const isFutureDate = currentDateObj.getTime() > todayTime && !isToday

        const holidayName = checkHoliday(day)
        const isHoliday = Boolean(holidayName)

        // 1. Check if employee has an approved leave on this date
        const matchingLeave = approvedLeaves.find(l => {
          const lEmail = (l.employeeEmail || "").toLowerCase().trim()
          const lName = (l.employee || "").toLowerCase().trim()
          const lId = String(l.employeeId || "")
          const isUserMatch = lEmail === empEmail || (empId && lId === empId) || (empName && lName === empName)
          if (!isUserMatch) return false

          const fromStr = (l.from || "").split("T")[0]
          const toStr = (l.to || fromStr).split("T")[0]
          return dateStr >= fromStr && dateStr <= toStr
        })

        // 2. Check if employee has a real timecard punch on this date
        const matchingCard = timecards.find(tc => {
          const tcEmail = (tc.memberEmail || "").toLowerCase().trim()
          const tcId = String(tc.userId || "")
          const isUserMatch = tcEmail === empEmail || (empId && tcId === empId)
          return isUserMatch && tc.inDate === dateStr
        })

        // Determine Status
        let status: AttendanceDayStatus = "Upcoming"
        let punchIn = matchingCard?.inTime
        let punchOut = matchingCard?.outTime
        let breakMins = matchingCard?.breakDurationMins || 0
        let workedSeconds = matchingCard?.durationSecs || 0
        let workMode = matchingCard?.workMode || "Office"
        let notes = matchingCard?.notes

        if (matchingLeave) {
          // Approved Leave takes precedence
          if (matchingLeave.isHalfDay) {
            status = "Half Day"
            totalHalfDays += 1
          } else {
            status = "On Leave"
            totalLeaves += 1
          }
        } else if (matchingCard) {
          // Worked Punch
          workedSeconds = matchingCard.durationSecs || 0
          totalWorkedSecs += workedSeconds

          // Check if late (punched in after 09:45 AM)
          let isLate = false
          if (matchingCard.inTime) {
            const match = matchingCard.inTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
            if (match) {
              let h = parseInt(match[1], 10)
              const m = parseInt(match[2], 10)
              const ampm = match[3]?.toUpperCase()
              if (ampm === "PM" && h < 12) h += 12
              if (ampm === "AM" && h === 12) h = 0
              if (h > 9 || (h === 9 && m > 45)) isLate = true
            }
          }

          if (matchingCard.status === "Late" || isLate) {
            status = "Late"
            totalLate += 1
            totalPresent += 1
          } else if (matchingCard.status === "Half Day" || (workedSeconds > 0 && workedSeconds < 25200)) { // < 7 hrs
            status = "Half Day"
            totalHalfDays += 1
          } else {
            status = "Present"
            totalPresent += 1
          }
        } else if (isHoliday) {
          status = "Holiday"
          totalHolidays += 1
        } else if (isSunday) {
          status = "Day Off"
          totalDaysOff += 1
        } else if (isPastDate) {
          status = "Absent"
          totalAbsents += 1
        } else {
          status = "Upcoming"
        }

        dailyDetails[day] = {
          dateStr,
          dayNumber: day,
          dayOfWeek: dayOfWeekShort,
          isSunday,
          isHoliday,
          holidayName: holidayName || undefined,
          status,
          punchIn,
          punchOut,
          breakMins,
          workedSeconds,
          workMode,
          notes,
          timecardId: matchingCard?.id,
          leaveInfo: matchingLeave ? {
            id: matchingLeave.id,
            type: matchingLeave.type || "Casual Leave",
            reason: matchingLeave.reason,
            isHalfDay: matchingLeave.isHalfDay,
            approvedBy: matchingLeave.reviewedBy || "Admin"
          } : undefined
        }
      }

      return {
        employeeId: empId,
        name: emp.name || "Employee",
        email: emp.email || "",
        role: emp.role || "Team Member",
        avatar: emp.avatar || emp.avatarUrl || getUserAvatar(emp.name, undefined, emp.name),
        department: emp.department || emp.designation || "Engineering",
        branchName: emp.branchName || "HQ",
        companyId: emp.companyId,
        dailyDetails,
        totalWorkedSeconds: totalWorkedSecs,
        totalPresent,
        totalHalfDays,
        totalLate,
        totalLeaves,
        totalAbsents,
        totalDaysOff,
        totalHolidays
      }
    })
  }, [teamMembers, approvedLeaves, timecards, selectedMonth, selectedYear, activeCompanyId, branchFilter, searchQuery, daysInMonth, isAdmin, user])

  // Monthly KPI Aggregates
  const totalEmployeesCount = employeeMatrix.length
  const todayDayNumber = selectedMonth === today.getMonth() && selectedYear === today.getFullYear() ? today.getDate() : null
  
  let presentTodayCount = 0
  let onLeaveTodayCount = 0
  let lateTodayCount = 0
  let halfDayTodayCount = 0
  let cumulativeMonthSecs = 0

  employeeMatrix.forEach(emp => {
    cumulativeMonthSecs += emp.totalWorkedSeconds
    if (todayDayNumber && emp.dailyDetails[todayDayNumber]) {
      const todayStatus = emp.dailyDetails[todayDayNumber].status
      if (todayStatus === "Present") presentTodayCount += 1
      if (todayStatus === "On Leave") onLeaveTodayCount += 1
      if (todayStatus === "Late") lateTodayCount += 1
      if (todayStatus === "Half Day") halfDayTodayCount += 1
    }
  })

  // Format Total Working Hours (e.g. 1,480 hrs)
  const formatTotalHours = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  // Export Monthly Matrix as CSV
  const handleExportCSV = () => {
    try {
      const header = ["Employee Name", "Email", "Role", "Branch", ...monthDaysArray.map(d => `Day ${d}`), "Total Hours", "Present Days", "Half Days", "Late", "Leaves", "Absents"]
      const rows = employeeMatrix.map(emp => {
        const daysStatus = monthDaysArray.map(d => emp.dailyDetails[d]?.status || "-")
        return [
          `"${emp.name}"`,
          `"${emp.email}"`,
          `"${emp.role || ''}"`,
          `"${emp.branchName || ''}"`,
          ...daysStatus.map(s => `"${s}"`),
          `"${formatTotalHours(emp.totalWorkedSeconds)}"`,
          emp.totalPresent,
          emp.totalHalfDays,
          emp.totalLate,
          emp.totalLeaves,
          emp.totalAbsents
        ].join(",")
      })

      const csvContent = "data:text/csv;charset=utf-8," + [header.join(","), ...rows].join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `Attendance_Sheet_${monthName}_${selectedYear}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      alert("Failed to export attendance CSV: " + err.message)
    }
  }

  // Render Status Icon for a Matrix Cell
  const renderCellIcon = (detail: DayPunchDetail) => {
    switch (detail.status) {
      case "Present":
        return (
          <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center transition-transform hover:scale-110">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        )
      case "Half Day":
        return (
          <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center transition-transform hover:scale-110">
            <Clock className="w-3.5 h-3.5" />
          </div>
        )
      case "Late":
        return (
          <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center transition-transform hover:scale-110">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        )
      case "On Leave":
        return (
          <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center transition-transform hover:scale-110 shadow-2xs">
            <PlaneTakeoff className="w-3.5 h-3.5" />
          </div>
        )
      case "Holiday":
        return (
          <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center transition-transform hover:scale-110">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        )
      case "Day Off":
        return (
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800/70 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center">
            <Coffee className="w-3 h-3" />
          </div>
        )
      case "Absent":
        return (
          <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center transition-transform hover:scale-110">
            <XCircle className="w-3.5 h-3.5" />
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-zinc-300 dark:text-zinc-600 font-bold text-xs">
            •
          </div>
        )
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header & Month Navigator */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Monthly Attendance Sheet
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Live Matrix
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time monthly attendance matrix synchronized with timecard punches and approved leave records.
          </p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-1 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 min-w-[130px] text-center select-none">
              {monthName} {selectedYear}
            </div>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            onClick={handleCurrentMonth}
            className="text-xs h-9 px-3 border-zinc-200 dark:border-zinc-700"
          >
            Today
          </Button>

          <Button
            onClick={handleExportCSV}
            className="text-xs h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <AttendanceSummaryCards
        totalEmployees={totalEmployeesCount}
        presentToday={presentTodayCount}
        onLeaveToday={onLeaveTodayCount}
        lateToday={lateTodayCount}
        halfDayToday={halfDayTodayCount}
        monthTotalHours={formatTotalHours(cumulativeMonthSecs)}
      />

      {/* Attendance Status Legend */}
      <AttendanceTypeLegend />

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee by name, email..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {branches && branches.length > 0 && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
            >
              <option value="all">All Branches</option>
              {branches.map((b: any) => (
                <option key={b.id || b.name} value={b.name || b.id}>
                  {b.name || b.branch_name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={loadAttendanceData}
            title="Refresh Data"
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Master Monthly Grid Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
                {/* Frozen Employee Column */}
                <th className="sticky left-0 z-20 bg-zinc-50 dark:bg-zinc-850 px-4 py-3.5 font-bold min-w-[200px] sm:min-w-[240px] border-r border-zinc-200 dark:border-zinc-800 shadow-xs">
                  Employee Details
                </th>

                {/* Day Columns 1..daysInMonth */}
                {monthDaysArray.map((day) => {
                  const dateStr = formatDateStr(day)
                  const isToday = dateStr === today.toISOString().split("T")[0]
                  const currentDateObj = new Date(selectedYear, selectedMonth, day)
                  const isSunday = currentDateObj.getDay() === 0
                  const dayName = currentDateObj.toLocaleDateString("en-US", { weekday: "narrow" })

                  return (
                    <th
                      key={day}
                      className={`text-center py-2 px-1 min-w-[36px] max-w-[40px] border-r border-zinc-200 dark:border-zinc-800 select-none ${
                        isToday 
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold" 
                          : isSunday 
                            ? "bg-zinc-100/70 dark:bg-zinc-800/40 text-zinc-400" 
                            : ""
                      }`}
                    >
                      <div className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500">
                        {dayName}
                      </div>
                      <div className={`text-xs font-bold mt-0.5 ${isToday ? "text-indigo-600 dark:text-indigo-400" : ""}`}>
                        {day}
                      </div>
                    </th>
                  )
                })}

                {/* Summary Total Columns */}
                <th className="text-center px-3 py-3.5 font-bold bg-zinc-50 dark:bg-zinc-850 border-r border-zinc-200 dark:border-zinc-800 min-w-[85px]">
                  Total Hrs
                </th>
                <th className="text-center px-2 py-3.5 font-bold bg-zinc-50 dark:bg-zinc-850 border-r border-zinc-200 dark:border-zinc-800 text-emerald-600 min-w-[55px]">
                  Present
                </th>
                <th className="text-center px-2 py-3.5 font-bold bg-zinc-50 dark:bg-zinc-850 border-r border-zinc-200 dark:border-zinc-800 text-blue-600 min-w-[55px]">
                  Half Day
                </th>
                <th className="text-center px-2 py-3.5 font-bold bg-zinc-50 dark:bg-zinc-850 border-r border-zinc-200 dark:border-zinc-800 text-orange-600 min-w-[50px]">
                  Late
                </th>
                <th className="text-center px-2 py-3.5 font-bold bg-zinc-50 dark:bg-zinc-850 text-purple-600 min-w-[55px]">
                  Leaves
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {employeeMatrix.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 6} className="text-center py-12 text-zinc-400">
                    No team members found matching the selected filters.
                  </td>
                </tr>
              ) : (
                employeeMatrix.map((emp) => (
                  <tr 
                    key={emp.employeeId || emp.email}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Frozen Employee Column */}
                    <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-4 py-2.5 border-r border-zinc-200 dark:border-zinc-800 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden shadow-2xs">
                          {emp.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            emp.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-xs" title={emp.name}>
                            {emp.name}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate" title={emp.email}>
                            {emp.role || emp.department || "Team Member"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Day Cells (1..daysInMonth) */}
                    {monthDaysArray.map((day) => {
                      const detail = emp.dailyDetails[day]
                      if (!detail) return <td key={day} className="border-r border-zinc-200 dark:border-zinc-800 text-center" />

                      const isSunday = detail.isSunday
                      const dateStr = detail.dateStr
                      const isToday = dateStr === today.toISOString().split("T")[0]

                      return (
                        <td
                          key={day}
                          onClick={() => setSelectedCell({ employee: emp, detail })}
                          title={`${emp.name} - ${dateStr}: ${detail.status} ${detail.punchIn ? `(${detail.punchIn} - ${detail.punchOut || 'Active'})` : ''}`}
                          className={`text-center py-1.5 px-0.5 border-r border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors ${
                            isToday 
                              ? "bg-indigo-50/40 dark:bg-indigo-950/20" 
                              : isSunday 
                                ? "bg-zinc-50 dark:bg-zinc-900/60" 
                                : ""
                          } hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40`}
                        >
                          <div className="flex items-center justify-center">
                            {renderCellIcon(detail)}
                          </div>
                        </td>
                      )
                    })}

                    {/* Summary Columns */}
                    <td className="text-center px-2 py-2.5 font-bold text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-850/30 text-xs">
                      {formatTotalHours(emp.totalWorkedSeconds)}
                    </td>
                    <td className="text-center px-2 py-2.5 font-bold text-emerald-600 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-850/30 text-xs">
                      {emp.totalPresent}
                    </td>
                    <td className="text-center px-2 py-2.5 font-bold text-blue-600 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-850/30 text-xs">
                      {emp.totalHalfDays}
                    </td>
                    <td className="text-center px-2 py-2.5 font-bold text-orange-600 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-850/30 text-xs">
                      {emp.totalLate}
                    </td>
                    <td className="text-center px-2 py-2.5 font-bold text-purple-600 bg-zinc-50/30 dark:bg-zinc-850/30 text-xs">
                      {emp.totalLeaves}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Punch & Work Record Modal */}
      {selectedCell && (
        <DayPunchModal
          isOpen={Boolean(selectedCell)}
          onClose={() => setSelectedCell(null)}
          employee={selectedCell.employee}
          detail={selectedCell.detail}
          onUpdatePunch={() => {
            loadAttendanceData()
          }}
        />
      )}
    </div>
  )
}

