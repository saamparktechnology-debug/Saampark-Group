import { clearAllActivityLogs, getActivityLogs, ActivityLog } from "@/services/activityLogService"

export const activityLogFeatureService = {
  async getAll(companyId: string): Promise<ActivityLog[]> {
    const data = await getActivityLogs(companyId)
    return Array.isArray(data) ? data : []
  },

  async clearAll(): Promise<void> {
    await clearAllActivityLogs()
  },
}
