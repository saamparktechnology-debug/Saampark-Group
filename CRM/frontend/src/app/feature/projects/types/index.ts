export type ProjectType = "Client Project" | "Internal Project"
export type ProjectStatus = "Open" | "Completed" | "Hold" | "In Progress"

export interface ProjectMember {
  id: string
  name: string
  role: string
  avatar?: string
  email?: string
}

export interface TaskBreakdown {
  todo: number
  inProgress: number
  review: number
  done: number
}

export interface ActivityItem {
  id: string
  user: string
  timestamp: string
  action: string
  title: string
  badge?: string
}

export interface Project {
  id: string
  title: string
  projectType: ProjectType
  client: string
  price: string
  startDate: string
  deadline: string
  progress: number
  status: ProjectStatus
  labels: string[]
  description?: string
  starred?: boolean
  totalHours?: number
  members?: ProjectMember[]
  taskBreakdown?: TaskBreakdown
  activityLogs?: ActivityItem[]
}
