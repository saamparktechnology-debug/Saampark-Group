export type LeaveTab = "requests" | "types"

export interface LeaveRequest {
  id: string
  employee: string
  employeeEmail?: string
  employeeId?: string
  type: string
  from: string
  to: string
  days: number
  isHalfDay?: boolean
  status: "Pending" | "Approved" | "Rejected"
  reason?: string
  companyId?: string
  appliedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
}

export interface LeaveType {
  id: string
  name: string
  daysAllowed: number
  status: string
}
