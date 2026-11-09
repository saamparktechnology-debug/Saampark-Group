export type AttendanceDayStatus = 
  | "Present" 
  | "Half Day" 
  | "Late" 
  | "Absent" 
  | "On Leave" 
  | "Holiday" 
  | "Day Off" 
  | "Upcoming"

export interface DayPunchDetail {
  dateStr: string // YYYY-MM-DD
  dayNumber: number
  dayOfWeek: string // Mon, Tue, etc.
  isSunday: boolean
  isHoliday: boolean
  holidayName?: string
  status: AttendanceDayStatus
  punchIn?: string
  punchOut?: string
  breakMins?: number
  workedSeconds: number
  workMode?: "Office" | "Work From Home" | "Field / Client Visit"
  notes?: string
  timecardId?: string
  // If on leave
  leaveInfo?: {
    id: string
    type: string
    reason?: string
    isHalfDay?: boolean
    approvedBy?: string
  }
}

export interface EmployeeMonthlyAttendance {
  employeeId: string
  name: string
  email: string
  role?: string
  avatar?: string
  department?: string
  branchName?: string
  companyId?: string
  dailyDetails: Record<number, DayPunchDetail> // day 1..31 -> details
  // Summary totals for the month
  totalWorkedSeconds: number
  totalPresent: number
  totalHalfDays: number
  totalLate: number
  totalLeaves: number
  totalAbsents: number
  totalDaysOff: number
  totalHolidays: number
}
