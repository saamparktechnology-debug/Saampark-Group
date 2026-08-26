export type ProjectType = "Client Project" | "Internal Project"
export type ProjectStatus = "Payment Pending" | "Open" | "In Progress" | "Completed" | "Hold" | "Finished" | "Cancelled"

export interface ProjectMember {
  id: string
  name: string
  role: string
  avatar?: string
  email?: string
}

export interface ProjectMilestone {
  id: string
  title: string
  stage: "Frontend" | "Backend" | "Design" | "Testing" | "Deployment" | "Credentials" | "Custom"
  status: "Completed" | "In Progress" | "Pending" | "Hold"
  notes?: string
  credentials?: string
  updatedBy?: string
  updatedAt?: string
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
  paymentStatus?: "Payment Pending" | "Paid" | "Advance Received" | "Partially Paid"
  paymentStructure?: "Full" | "Advance + Part Payment"
  advanceAmount?: number
  dueAmount?: number
  installmentsCount?: number
  installmentAmount?: number
  subscriptionId?: string
  baseAmount?: number
  gstRate?: number
  gstAmount?: number
  totalAmount?: number
  billedBy?: string
  members?: ProjectMember[]
  milestones?: ProjectMilestone[]
  taskBreakdown?: TaskBreakdown
  activityLogs?: ActivityItem[]
}
