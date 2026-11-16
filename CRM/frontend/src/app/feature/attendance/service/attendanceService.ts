import { AttendanceService } from "@/services/hrService"

export const attendanceFeatureService = {
  async getAll(params: Record<string, string> = {}) {
    const data = await AttendanceService.getAll(params)
    return Array.isArray(data) ? data : []
  },
}
