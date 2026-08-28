export type TaskStatus = "To do" | "In progress" | "Review" | "Done"
export type TaskPriority = "Low" | "Normal" | "High" | "Urgent"

export interface Task {
  id: string
  title: string
  startDate?: string
  deadline: string
  dueTime?: string
  source?: "leads" | "projects" | "direct"
  sourceId?: string
  sourceName?: string
  milestone?: string
  relatedTo?: string
  assignedTo: string
  assignedToAvatar?: string
  assignedToEmail?: string
  assignedToId?: string
  collaborators?: string
  status: TaskStatus
  priority?: TaskPriority
  priorityIcon?: "up" | "exclamation" | "down" | "none"
  labels?: string[]
  points?: string
  description?: string
  isRecurring?: boolean
  companyId?: string
  branchId?: string
  branchName?: string
  client?: string
  clientEmail?: string
  createdBy?: string
  createdByEmail?: string
  projectName?: string
}

export interface CountdownChipInfo {
  label: string
  variant: "done" | "today" | "tomorrow" | "upcoming" | "overdue"
  colorClass: string
}

export function getTaskCountdownChip(deadlineStr?: string, dueTime?: string, status?: TaskStatus): CountdownChipInfo | null {
  if (status === "Done") {
    return {
      label: "Completed ✓",
      variant: "done",
      colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    }
  }

  if (!deadlineStr || deadlineStr === "None" || deadlineStr.trim() === "") {
    return null
  }

  // Parse deadline (supports ISO "YYYY-MM-DD" and "DD-MM-YYYY" or "DD/MM/YYYY")
  let targetDate: Date | null = null
  const clean = deadlineStr.trim().replace(/\(.*\)/g, "").trim()

  const isoMatch = clean.match(/^(\d{4})[-\/\.,](\d{1,2})[-\/\.,](\d{1,2})/)
  if (isoMatch) {
    targetDate = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10))
  } else {
    const parts = clean.split(/[\s\-\/\,\.]+/)
    if (parts.length >= 3) {
      const p0 = parseInt(parts[0], 10)
      const p1 = parseInt(parts[1], 10)
      const p2 = parseInt(parts[2], 10)
      if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        if (parts[2].length === 4 || p2 > 1000) {
          targetDate = new Date(p2, p1 - 1, p0)
        } else if (parts[0].length === 4 || p0 > 1000) {
          targetDate = new Date(p0, p1 - 1, p2)
        }
      }
    }
  }

  if (!targetDate || isNaN(targetDate.getTime())) {
    const fallback = new Date(deadlineStr)
    if (!isNaN(fallback.getTime())) {
      targetDate = fallback
    } else {
      return null
    }
  }

  // Normalize current date & target date
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime()

  const diffMs = targetDay - today
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays)
    return {
      label: `⚠️ Overdue by ${overdueDays}d`,
      variant: "overdue",
      colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold",
    }
  }

  if (diffDays === 0) {
    return {
      label: dueTime ? `🔥 Due Today (${dueTime})` : "🔥 Due Today",
      variant: "today",
      colorClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-extrabold animate-pulse",
    }
  }

  if (diffDays === 1) {
    return {
      label: "⏳ Due Tomorrow",
      variant: "tomorrow",
      colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold",
    }
  }

  return {
    label: `⏳ ${diffDays} Days Left`,
    variant: "upcoming",
    colorClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-semibold",
  }
}
