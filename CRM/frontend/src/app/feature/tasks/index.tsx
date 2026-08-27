"use client"

import * as React from "react"
import { Task, TaskStatus } from "./types"
import { taskService } from "./services/taskService"
import { TaskList } from "./components/TaskList"
import { TaskKanban } from "./components/TaskKanban"
import { TasksGantt } from "./components/TasksGantt"
import { AddTaskModal } from "./components/AddTaskModal"
import { EditTaskModal } from "./components/EditTaskModal"
import { ManageTaskLabelsModal } from "./components/ManageTaskLabelsModal"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

export default function TasksMain() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [activeViewTab, setActiveViewTab] = React.useState<"list" | "kanban" | "gantt">("list")
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const { user, activeCompanyId } = useAuthStore()
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [isManageLabelsOpen, setIsManageLabelsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  const roleLower = (user?.role || "").toLowerCase().trim()
  const isSuperAdmin = roleLower.includes("super") || roleLower === "super admin" || roleLower === "superadmin"
  const isAdmin = !isSuperAdmin && (
    roleLower.includes("admin") || 
    roleLower.includes("owner") || 
    roleLower.includes("manager") ||
    roleLower.includes("management") ||
    roleLower === "admin"
  )
  const isClient = roleLower.includes("client")

  const loadTasks = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      let targetComp = "all"
      if (isSuperAdmin) {
        targetComp = activeCompanyId || "all"
      } else if (isAdmin) {
        targetComp = user?.companyId || activeCompanyId || "tech"
      } else {
        targetComp = user?.companyId || activeCompanyId || "all"
      }
      const data = await taskService.getTasks(targetComp)
      setTasks(data)
    } catch (err) {
      console.error("Error loading tasks:", err)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [activeCompanyId, user?.companyId, isSuperAdmin, isAdmin])

  React.useEffect(() => {
    loadTasks(true)                              // first load: show spinner
    const interval = setInterval(() => loadTasks(false), 3000)  // background polls: silent
    const handleReload = () => loadTasks(false)
    window.addEventListener("storage", handleReload)
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_tasks_updated", handleReload)
    window.addEventListener("saampark_data_synced", handleReload)
    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleReload)
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_tasks_updated", handleReload)
      window.removeEventListener("saampark_data_synced", handleReload)
    }
  }, [loadTasks])

  const handleTaskAdded = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev])
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) =>
        String(t.id).toLowerCase().trim() === String(updatedTask.id).toLowerCase().trim()
          ? updatedTask
          : t
      )
    )
  }

  const handleUpdateTaskStatus = async (id: string, newStatus: TaskStatus) => {
    // 1. Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        String(t.id).toLowerCase().trim() === String(id).toLowerCase().trim()
          ? { ...t, status: newStatus }
          : t
      )
    )
    // 2. Persist to DB
    try {
      await taskService.updateTask(id, { status: newStatus })
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  const handleDeleteTask = async (id: string) => {
    const { user } = useAuthStore.getState()
    const { canPerformAction } = usePermissionStore.getState()
    if (!canPerformAction(user, "Tasks", "delete")) {
      alert("Action forbidden: You do not have permission to delete tasks.")
      return
    }

    if (confirm("Are you sure you want to delete this task?")) {
      const strId = String(id).toLowerCase().trim()
      // Optimistically remove from state immediately
      setTasks((prev) => prev.filter((t) => String(t.id).toLowerCase().trim() !== strId))
      try {
        await taskService.deleteTask(id)
      } catch (err) {
        console.error("Failed to delete task:", err)
      }
    }
  }

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task)
    setIsEditModalOpen(true)
  }

  const visibleTasks = React.useMemo(() => {
    if (!user) return []

    // 1. Super Admin: sees all tasks in current company/all scope
    if (isSuperAdmin) return tasks

    // 2. Company Admin: sees only tasks belonging to their specific company
    if (isAdmin) {
      const userComp = (user.companyId || activeCompanyId || "").toLowerCase().trim()
      if (!userComp || userComp === "all") return tasks
      return tasks.filter((t) => {
        const tComp = (t.companyId || (t as any).company || "tech").toLowerCase().trim()
        return tComp === userComp || (userComp === "tech" && !t.companyId)
      })
    }

    const normName = (user.name || (user as any).full_name || "").toLowerCase().trim()
    const normEmail = (user.email || "").toLowerCase().trim()
    const normId = String(user.id || "").toLowerCase().trim()

    // 3. Client Role: sees tasks created for or by this client
    if (isClient) {
      return tasks.filter((t) => {
        const tClient = (t.client || (t as any).clientName || "").toLowerCase().trim()
        const tEmail = ((t as any).clientEmail || (t as any).createdByEmail || "").toLowerCase().trim()
        return (
          tClient === normName ||
          tEmail === normEmail ||
          (normName && tClient.includes(normName)) ||
          (normEmail && tEmail.includes(normEmail))
        )
      })
    }

    // 4. Team Member (Staff / Developer / Employee): ONLY tasks assigned to them, collaborated on, or created by them
    return tasks.filter((t) => {
      if (!t) return false

      const assigned = (t.assignedTo || (t as any).assigned_to || (t as any).assignee || "").toLowerCase().trim()
      const assignedEmail = ((t as any).assignedToEmail || "").toLowerCase().trim()
      const assignedId = String((t as any).assignedToId || "").toLowerCase().trim()
      const collab = (t.collaborators || (t as any).members || "").toLowerCase().trim()
      const createdBy = ((t as any).createdBy || (t as any).created_by || "").toLowerCase().trim()
      const createdEmail = ((t as any).createdByEmail || "").toLowerCase().trim()

      if (normId && (assignedId === normId)) return true
      if (normEmail && (assignedEmail === normEmail || createdEmail === normEmail)) return true

      const checkMatch = (fieldStr: string) => {
        if (!fieldStr || fieldStr === "unassigned" || fieldStr === "none") return false
        return (
          fieldStr === normName ||
          fieldStr === normEmail ||
          fieldStr === normId ||
          (normName && (fieldStr.includes(normName) || normName.includes(fieldStr))) ||
          (normEmail && fieldStr.includes(normEmail))
        )
      }

      return checkMatch(assigned) || checkMatch(collab) || checkMatch(createdBy)
    })
  }, [tasks, user, isSuperAdmin, isAdmin, isClient, activeCompanyId])

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* View Switcher: List vs Kanban vs Gantt */}
      {activeViewTab === "list" && (
        <TaskList
          tasks={visibleTasks}
          activeViewTab={activeViewTab}
          onChangeViewTab={setActiveViewTab}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onSelectTask={handleSelectTask}
          onDeleteTask={handleDeleteTask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onOpenManageLabels={() => setIsManageLabelsOpen(true)}
        />
      )}

      {activeViewTab === "kanban" && (
        <TaskKanban
          tasks={visibleTasks}
          activeViewTab={activeViewTab}
          onChangeViewTab={setActiveViewTab}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onSelectTask={handleSelectTask}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {activeViewTab === "gantt" && (
        <TasksGantt
          tasks={visibleTasks}
          activeViewTab={activeViewTab}
          onChangeViewTab={setActiveViewTab}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTaskAdded={handleTaskAdded}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={isEditModalOpen}
        task={selectedTask}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedTask(null)
        }}
        onTaskUpdated={handleTaskUpdated}
        onDeleteTask={handleDeleteTask}
      />

      {/* Manage Labels Modal */}
      <ManageTaskLabelsModal
        isOpen={isManageLabelsOpen}
        onClose={() => setIsManageLabelsOpen(false)}
      />

    </div>
  )
}
