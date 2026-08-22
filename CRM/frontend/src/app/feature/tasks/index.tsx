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
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [isManageLabelsOpen, setIsManageLabelsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadTasks = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const data = await taskService.getTasks()
      setTasks(data)
    } catch (err) {
      console.error("Error loading tasks:", err)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTasks(true)                              // first load: show spinner
    const interval = setInterval(() => loadTasks(false), 5000)  // background polls: silent
    window.addEventListener("storage", () => loadTasks(false))
    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", () => loadTasks(false))
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

  const { user } = useAuthStore()
  const isSuperOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const visibleTasks = React.useMemo(() => {
    if (!user || isSuperOrAdmin) return tasks
    const normName = (user.name || "").toLowerCase().trim()
    const normEmail = (user.email || "").toLowerCase().trim()
    return tasks.filter((t) => {
      const assigned = (t.assignedTo || "").toLowerCase().trim()
      const collab = (t.collaborators || "").toLowerCase().trim()
      if (!assigned) return false
      return (
        assigned === normName ||
        assigned === normEmail ||
        (normName && (assigned.includes(normName) || normName.includes(assigned))) ||
        (normEmail && assigned.includes(normEmail)) ||
        (collab && normName && collab.includes(normName)) ||
        (collab && normEmail && collab.includes(normEmail))
      )
    })
  }, [tasks, user, isSuperOrAdmin])

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
