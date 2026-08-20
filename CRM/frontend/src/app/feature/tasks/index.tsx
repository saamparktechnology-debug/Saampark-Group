"use client"

import * as React from "react"
import { Task } from "./types"
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
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    )
  }

  const handleDeleteTask = async (id: string) => {
    const { user } = useAuthStore.getState()
    const { canPerformAction } = usePermissionStore.getState()
    if (!canPerformAction(user, "Tasks", "delete")) {
      alert("Action forbidden: You do not have permission to delete tasks.")
      return
    }

    if (confirm("Are you sure you want to delete this task?")) {
      await taskService.deleteTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task)
    setIsEditModalOpen(true)
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* View Switcher: List vs Kanban vs Gantt */}
      {activeViewTab === "list" && (
        <TaskList
          tasks={tasks}
          activeViewTab={activeViewTab}
          onChangeViewTab={setActiveViewTab}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onSelectTask={handleSelectTask}
          onDeleteTask={handleDeleteTask}
          onOpenManageLabels={() => setIsManageLabelsOpen(true)}
        />
      )}

      {activeViewTab === "kanban" && (
        <TaskKanban
          tasks={tasks}
          activeViewTab={activeViewTab}
          onChangeViewTab={setActiveViewTab}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onSelectTask={handleSelectTask}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {activeViewTab === "gantt" && (
        <TasksGantt
          tasks={tasks}
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
      />

      {/* Manage Labels Modal */}
      <ManageTaskLabelsModal
        isOpen={isManageLabelsOpen}
        onClose={() => setIsManageLabelsOpen(false)}
      />

    </div>
  )
}
