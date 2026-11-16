import { LeaveService } from "@/services/hrService"
import { getUsers } from "../../users/service/userService"
import { LeaveRequest, LeaveType } from "../types"

export const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  { id: "lt-1", name: "Casual Leave", daysAllowed: 12, status: "Active" },
  { id: "lt-2", name: "Sick Leave", daysAllowed: 10, status: "Active" },
  { id: "lt-3", name: "Earned Leave", daysAllowed: 15, status: "Active" },
  { id: "lt-4", name: "Unpaid Leave", daysAllowed: 30, status: "Active" },
]

export const leaveFeatureService = {
  async getRequests(todayStr: string): Promise<LeaveRequest[]> {
    const reqData = await LeaveService.getRequests({})
    const rawRequests: LeaveRequest[] = Array.isArray(reqData) ? reqData : []

    if (rawRequests.length > 0) {
      return rawRequests
    }

    return [
      {
        id: "lr_init_1",
        employee: "Priya Ghosh",
        employeeEmail: "priya@saampark.com",
        employeeId: "usr_priya",
        type: "Casual Leave",
        from: todayStr,
        to: todayStr,
        days: 1,
        isHalfDay: false,
        status: "Pending",
        reason: "Personal family commitment",
        companyId: "tech",
        appliedAt: new Date().toISOString(),
      },
      {
        id: "lr_init_2",
        employee: "Anand Verma",
        employeeEmail: "anand@saampark.com",
        employeeId: "usr_anand",
        type: "Sick Leave",
        from: new Date(Date.now() - 172800000).toISOString().split("T")[0],
        to: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        days: 2,
        isHalfDay: false,
        status: "Approved",
        reason: "Viral fever and doctor consultation",
        companyId: "digital",
        appliedAt: new Date(Date.now() - 172800000).toISOString(),
        reviewedBy: "Supriya (Super Admin)",
        reviewedAt: new Date(Date.now() - 150000000).toISOString(),
      },
    ]
  },

  async getTypes(): Promise<LeaveType[]> {
    const typeData = await LeaveService.getTypes()
    return Array.isArray(typeData) && typeData.length > 0 ? typeData : DEFAULT_LEAVE_TYPES
  },

  async getTeamMembers() {
    return getUsers().catch(() => [])
  },
}
