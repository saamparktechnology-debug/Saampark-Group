export type { ActivityLog, ActivityType } from "@/services/activityLogService"

export interface ActivityActorOption {
  key: string
  name: string
  role: string
  email?: string
}
