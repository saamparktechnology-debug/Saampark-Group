export type TaskStatus = "To do" | "In progress" | "Review" | "Done"
export type TaskPriority = "Low" | "Normal" | "High" | "Urgent"

export interface Task {
  id: string
  title: string
  startDate?: string
  deadline: string
  milestone?: string
  relatedTo?: string
  assignedTo: string
  assignedToAvatar?: string
  collaborators?: string
  status: TaskStatus
  priority?: TaskPriority
  priorityIcon?: "up" | "exclamation" | "down" | "none"
  labels?: string[]
  points?: string
  description?: string
  isRecurring?: boolean
}
