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
import { executeWithFeedback, useActionFeedbackStore } from "@/store/useActionFeedbackStore"
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"

export default function TasksMain() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [activeViewTab, setActiveViewTab] = React.useState<"list" | "kanban" | "gantt">("list")
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [isManageLabelsOpen, setIsManageLabelsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  const roleLower = (user?.role || "").toLowerCase().trim()
  const isSuperAdmin = roleLower.includes("super") || roleLower === "super admin" || roleLower === "superadmin"
  const isAdmin = !isSuperAdmin && (
    roleLower.includes("admin") || 
    roleLower.includes("owner") || 
    roleLower.includes("director") || 
    roleLower.includes("ceo") || 
    roleLower.includes("head") || 
    roleLower.includes("manager") ||
    roleLower.includes("leader")
  )
  const isClient = roleLower.includes("client")

  const fetchTasks = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const targetComp = activeCompanyId || user?.companyId || "tech"
      try {
        const { getLeads } = await import("@/app/feature/leads/services/leadService")
        await getLeads(targetComp)
      } catch {}
      const data = await taskService.getTasks(targetComp)
      setTasks(data || [])
    } catch (err) {
      console.error("Error loading tasks:", err)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [activeCompanyId, user?.companyId])

  React.useEffect(() => {
    fetchTasks(true)
    const handleReload = () => fetchTasks(false)
    window.addEventListener("storage", handleReload)
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_branch_switched", handleReload)
    window.addEventListener("saampark_tasks_updated", handleReload)
    window.addEventListener("saampark_data_synced", handleReload)
    return () => {
      window.removeEventListener("storage", handleReload)
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_branch_switched", handleReload)
      window.removeEventListener("saampark_tasks_updated", handleReload)
      window.removeEventListener("saampark_data_synced", handleReload)
    }
  }, [fetchTasks])

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
    const task = tasks.find(t => String(t.id).toLowerCase().trim() === String(id).toLowerCase().trim())
    const taskTitle = task?.title || "Task"
    await executeWithFeedback(async () => {
      setTasks((prev) =>
        prev.map((t) =>
          String(t.id).toLowerCase().trim() === String(id).toLowerCase().trim()
            ? { ...t, status: newStatus }
            : t
        )
      )
      await taskService.updateTask(id, { status: newStatus })
    }, {
      actionType: "update",
      loadingTitle: "Updating Status...",
      loadingMsg: `Moving "${taskTitle}" to ${newStatus}...`,
      successTitle: "Status Updated!",
      successMsg: `"${taskTitle}" status changed to ${newStatus}.`,
      errorTitle: "Status Update Failed",
      minLoadingMs: 300,
      autoCloseMs: 1800,
    })
  }

  const handleDeleteTask = async (id: string) => {
    const { user } = useAuthStore.getState()
    const { canPerformAction } = usePermissionStore.getState()
    if (!canPerformAction(user, "Tasks", "delete")) {
      useActionFeedbackStore.getState().showError({
        title: "Permission Denied",
        message: "You do not have permission to delete tasks.",
        actionType: "delete",
      })
      return
    }

    const task = tasks.find(t => String(t.id).toLowerCase().trim() === String(id).toLowerCase().trim())
    const taskTitle = task?.title || "Task"
    const strId = String(id).toLowerCase().trim()

    await executeWithFeedback(async () => {
      setTasks((prev) => prev.filter((t) => String(t.id).toLowerCase().trim() !== strId))
      await taskService.deleteTask(id)
    }, {
      actionType: "delete",
      loadingTitle: "Deleting Task...",
      loadingMsg: `Removing "${taskTitle}"...`,
      successTitle: "Task Deleted",
      successMsg: `"${taskTitle}" has been deleted.`,
      errorTitle: "Delete Failed",
    })
  }

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task)
    setIsEditModalOpen(true)
  }

  const visibleTasks = React.useMemo(() => {
    if (!user) return []

    const userComp = (activeCompanyId || user?.companyId || "").toLowerCase().trim()
    const targetBranch = activeBranchId

    const targetBranchObj = branches.find(b => b.id === targetBranch || b.name.toLowerCase() === (targetBranch || "").toLowerCase())
    const targetBranchId = String(targetBranchObj?.id || targetBranch || "").toLowerCase().trim()
    const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

    const checkBranch = (t: any) => {
      if (!targetBranch) return true
      const tBranch = String(t.branchId || t.branch_id || "").toLowerCase().trim()
      const tBranchName = String(t.branchName || t.branch_name || "").toLowerCase().trim()
      return (tBranch && (tBranch === targetBranchId || (targetBranchName && tBranch === targetBranchName))) ||
             (tBranchName && (tBranchName === targetBranchName || tBranchName === targetBranchId))
    }

    if (isSuperAdmin || isAdmin) {
      let filtered = tasks
      if (userComp && userComp !== "all") {
        filtered = filtered.filter((t) => {
          const tComp = (t.companyId || (t as any).company || "tech").toLowerCase().trim()
          return tComp === userComp || (userComp === "tech" && !t.companyId)
        })
      }
      if (targetBranch) {
        filtered = filtered.filter((t) => checkBranch(t))
      }
      return filtered
    }

    const normName = (user.name || (user as any).full_name || "").toLowerCase().trim()
    const normEmail = (user.email || "").toLowerCase().trim()
    const normId = String(user.id || "").toLowerCase().trim()

    if (isClient) {
      return tasks.filter((t) => {
        if (!checkBranch(t)) return false
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

    return tasks.filter((t) => {
      if (!t) return false
      if (!checkBranch(t)) return false

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
  }, [tasks, user, isSuperAdmin, isAdmin, isClient, activeCompanyId, activeBranchId, branches])

  if (isLoading) {
    return <ThreeDotLoader text="Loading task board & assignees..." fullScreen={false} />
  }

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
        onSelectTask={handleSelectTask}
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
