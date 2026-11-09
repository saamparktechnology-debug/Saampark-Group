"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Clock, Calendar, User, Building2, MapPin, CheckCircle2, 
  AlertCircle, XCircle, PlaneTakeoff, Coffee, Sparkles, Edit2, 
  Save, ShieldAlert, Check, RefreshCw
} from "lucide-react"
import { DayPunchDetail } from "../types"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { saveModuleDataToDB, fetchModuleDataFromDB } from "@/lib/storageSync"
import { TimeCardRecord } from "../team/timecards/page"

interface DayPunchModalProps {
  isOpen: boolean
  onClose: () => void
  employee: {
    id: string
    name: string
    email: string
    role?: string
    avatar?: string
    branchName?: string
    companyId?: string
  } | null
  detail: DayPunchDetail | null
  onUpdatePunch?: () => void
}

export default function DayPunchModal({
  isOpen,
  onClose,
  employee,
  detail,
  onUpdatePunch
}: DayPunchModalProps) {
  const { user } = useAuthStore()
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Edit form state
  const [inTime, setInTime] = React.useState("")
  const [outTime, setOutTime] = React.useState("")
  const [breakMins, setBreakMins] = React.useState(45)
  const [workMode, setWorkMode] = React.useState<"Office" | "Work From Home" | "Field / Client Visit">("Office")
  const [status, setStatus] = React.useState<string>("Present")
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    if (detail) {
      setInTime(detail.punchIn || "")
      setOutTime(detail.punchOut || "")
      setBreakMins(detail.breakMins || 0)
      setWorkMode(detail.workMode || "Office")
      setStatus(detail.status || (detail.isSunday ? "Day Off" : (detail.isHoliday ? "Holiday" : "Present")))
      setNotes(detail.notes || "")
      setIsEditing(false)
    }
  }, [detail])

  if (!isOpen || !employee || !detail) return null

  // Helper to format worked duration
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0 hrs 0 mins"
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hrs} hr${hrs !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`
  }

  // Parse time string e.g. "09:30 AM" or "09:30" to seconds for duration calculation
  const calculateWorkSeconds = (startStr: string, endStr: string, breakMinutes: number) => {
    try {
      const parseTimeToMinutes = (t: string) => {
        const parts = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
        if (!parts) return 570 // default 9:30 AM
        let h = parseInt(parts[1], 10)
        const m = parseInt(parts[2], 10)
        const meridiem = parts[3]?.toUpperCase()
        if (meridiem === "PM" && h < 12) h += 12
        if (meridiem === "AM" && h === 12) h = 0
        return h * 60 + m
      }

      const startMins = parseTimeToMinutes(startStr)
      const endMins = parseTimeToMinutes(endStr)
      if (endMins > startMins) {
        const netMins = Math.max(0, (endMins - startMins) - (breakMinutes || 0))
        return netMins * 60
      }
      return 28800 // default 8 hours
    } catch {
      return 28800
    }
  }

  const handleSaveAdjustment = async () => {
    setIsSaving(true)
    try {
      const workedSecs = calculateWorkSeconds(inTime, outTime, breakMins)
      const stored = await fetchModuleDataFromDB<TimeCardRecord[]>("timecards", [], "all").catch(() => [])
      
      const existingIdx = stored.findIndex(tc => 
        tc.memberEmail?.toLowerCase().trim() === employee.email.toLowerCase().trim() && 
        tc.inDate === detail.dateStr
      )

      let updatedList: TimeCardRecord[]
      if (existingIdx >= 0) {
        updatedList = [...stored]
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          inTime,
          outTime,
          outDate: detail.dateStr,
          breakDurationMins: breakMins,
          durationSecs: workedSecs,
          workMode,
          status: status as any,
          notes: notes ? `${notes} (Adjusted by Admin ${user?.name || ''})` : `Adjusted by Admin ${user?.name || ''}`
        }
      } else {
        const newRecord: TimeCardRecord = {
          id: `tc_manual_${Date.now()}`,
          userId: employee.id,
          memberName: employee.name,
          memberEmail: employee.email,
          memberRole: employee.role,
          companyId: employee.companyId || user?.companyId || "tech",
          branchName: employee.branchName || user?.branchName || "Main HQ",
          workMode,
          inDate: detail.dateStr,
          inTime,
          outDate: detail.dateStr,
          outTime,
          breakDurationMins: breakMins,
          durationSecs: workedSecs,
          status: status as any,
          notes: notes ? `${notes} (Manual entry by Admin)` : `Manual attendance entry by Admin`
        }
        updatedList = [newRecord, ...stored]
      }

      await saveModuleDataToDB("timecards", updatedList, "all")
      setIsEditing(false)
      if (onUpdatePunch) {
        onUpdatePunch()
      }
      onClose()
    } catch (err: any) {
      alert("Failed to save attendance adjustment: " + (err?.message || "Unknown error"))
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadge = () => {
    switch (detail.status) {
      case "Present":
        return {
          icon: CheckCircle2,
          text: "Present",
          badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
        }
      case "Half Day":
        return {
          icon: Clock,
          text: "Half Day",
          badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
        }
      case "Late":
        return {
          icon: AlertCircle,
          text: "Late Punch",
          badge: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
        }
      case "On Leave":
        return {
          icon: PlaneTakeoff,
          text: "On Approved Leave",
          badge: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800"
        }
      case "Holiday":
        return {
          icon: Sparkles,
          text: detail.holidayName || "Public Holiday",
          badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
        }
      case "Day Off":
        return {
          icon: Coffee,
          text: "Day Off (Weekend)",
          badge: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
        }
      case "Absent":
        return {
          icon: XCircle,
          text: "Absent",
          badge: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
        }
      default:
        return {
          icon: Clock,
          text: "Upcoming Date",
          badge: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
        }
    }
  }

  const statusBadge = getStatusBadge()
  const StatusIcon = statusBadge.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
                Attendance Log: {new Date(detail.dateStr).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Detailed timecard and work record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Employee Info Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden">
                {employee.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
                ) : (
                  employee.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {employee.name}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {employee.email} • {employee.role || "Team Member"}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${statusBadge.badge}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusBadge.text}</span>
            </div>
          </div>

          {/* Leave Info if On Leave */}
          {detail.leaveInfo && (
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/70 dark:bg-purple-950/30 space-y-2">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold text-xs">
                <PlaneTakeoff className="w-4 h-4" />
                <span>Approved Leave Record</span>
              </div>
              <p className="text-xs text-purple-900 dark:text-purple-200">
                <strong>Type:</strong> {detail.leaveInfo.type} {detail.leaveInfo.isHalfDay ? "(Half Day)" : ""}
              </p>
              {detail.leaveInfo.reason && (
                <p className="text-xs text-purple-800 dark:text-purple-300">
                  <strong>Reason:</strong> {detail.leaveInfo.reason}
                </p>
              )}
              {detail.leaveInfo.approvedBy && (
                <p className="text-[11px] text-purple-600 dark:text-purple-400">
                  Approved by {detail.leaveInfo.approvedBy} via Leave Management
                </p>
              )}
            </div>
          )}

          {!isEditing ? (
            /* View Mode */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <span className="text-[11px] text-zinc-500 font-medium">Punch In Time</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {detail.punchIn || "—"}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <span className="text-[11px] text-zinc-500 font-medium">Punch Out Time</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {detail.punchOut || (detail.punchIn ? "In Progress" : "—")}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <span className="text-[11px] text-zinc-500 font-medium">Break Duration</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Coffee className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {detail.breakMins ? `${detail.breakMins} mins` : "0 mins"}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <span className="text-[11px] text-zinc-500 font-medium">Net Working Hours</span>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {formatDuration(detail.workedSeconds)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Work Mode & Notes */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-medium">Work Mode</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                    {detail.workMode || "Office"}
                  </span>
                </div>
                {detail.notes && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
                    <span className="text-[11px] text-zinc-500 font-medium block mb-0.5">Shift Notes:</span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 italic">
                      "{detail.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Override Trigger */}
              {isAdmin && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="w-full flex items-center justify-center gap-2 text-xs border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Admin: Override / Adjust Punch Times</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Admin Edit Mode */
            <div className="space-y-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                <span>Override Punch & Working Record</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                    Punch In Time
                  </label>
                  <input
                    type="text"
                    value={inTime}
                    onChange={(e) => setInTime(e.target.value)}
                    placeholder="e.g. 09:30 AM"
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                    Punch Out Time
                  </label>
                  <input
                    type="text"
                    value={outTime}
                    onChange={(e) => setOutTime(e.target.value)}
                    placeholder="e.g. 06:30 PM"
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                    Break Minutes
                  </label>
                  <input
                    type="number"
                    value={breakMins}
                    onChange={(e) => setBreakMins(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Present">Present</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Late">Late</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Absent">Absent</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Day Off">Day Off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                  Work Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Office", "Work From Home", "Field / Client Visit"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setWorkMode(mode)}
                      className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        workMode === mode 
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs" 
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                  Admin Adjustment Note
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Regularized punch as per employee request"
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={handleSaveAdjustment}
                  disabled={isSaving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 gap-1.5"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Punch Adjustment</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Saampark HRM Timecard Sync
          </span>
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs h-8 px-4"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

