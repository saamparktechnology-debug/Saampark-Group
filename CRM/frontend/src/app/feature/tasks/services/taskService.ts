import { Task } from "../types"
import { api } from "@/lib/api"
import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"

export const initialTasks: Task[] = []

export const taskService = {
  getTasks: async (companyId?: string): Promise<Task[]> => {
    // Fetch persisted data from MySQL app_data store with deleted items filtered out
    const dbData = await fetchModuleDataFromDB<Task[]>("tasks", [], companyId)
    if (!Array.isArray(dbData)) return []
    const filtered = filterGlobalDeletedItems(dbData)
    // Guarantee uniqueness by task ID
    const seen = new Set<string>()
    return filtered.filter((t) => {
      if (!t || !t.id) return false
      const normId = String(t.id).toLowerCase().trim()
      if (seen.has(normId)) return false
      seen.add(normId)
      return true
    })
  },

  addTask: async (taskData: Omit<Task, "id"> & { id?: string }, companyId?: string): Promise<Task> => {
    let activeBranch: string | undefined = undefined
    if (typeof window !== "undefined") {
      try {
        const { useAuthStore } = require("@/store/useAuthStore")
        activeBranch = useAuthStore.getState().activeBranchId || useAuthStore.getState().user?.branchId || undefined
      } catch {}
    }

    const current = await taskService.getTasks(companyId)
    let nextId = taskData.id
    if (!nextId) {
      const maxIdNum = current.reduce((max, t) => {
        const n = parseInt(String(t.id).replace(/[^0-9]/g, "")) || 0
        return Math.max(max, n)
      }, 3650)
      nextId = (maxIdNum + 1).toString()
    }
    const newTask: Task = { 
      ...taskData, 
      id: nextId,
      branchId: (taskData as any).branchId || activeBranch || undefined
    }
    const updated = [newTask, ...current.filter(t => String(t.id).toLowerCase().trim() !== String(nextId).toLowerCase().trim())]
    await saveModuleDataToDB("tasks", updated, companyId)
    return newTask
  },

  addTasks: async (taskDataList: (Omit<Task, "id"> & { id?: string })[], companyId?: string): Promise<Task[]> => {
    if (!taskDataList || taskDataList.length === 0) return []
    const current = await taskService.getTasks(companyId)
    let maxIdNum = current.reduce((max, t) => {
      const n = parseInt(String(t.id).replace(/[^0-9]/g, "")) || 0
      return Math.max(max, n)
    }, 3650)

    const newTasks: Task[] = taskDataList.map((t) => {
      maxIdNum += 1
      const id = t.id || maxIdNum.toString()
      return {
        ...t,
        id,
      }
    })
    const newIds = new Set(newTasks.map(t => String(t.id).toLowerCase().trim()))
    const updated = [...newTasks, ...current.filter(t => !newIds.has(String(t.id).toLowerCase().trim()))]
    await saveModuleDataToDB("tasks", updated, companyId)
    return newTasks
  },

  updateTask: async (id: string, updates: Partial<Task>, companyId?: string): Promise<Task> => {
    const strId = String(id).toLowerCase().trim()
    const current = await fetchModuleDataFromDB<Task[]>("tasks", [], companyId)
    const idx = current.findIndex((t) => String(t.id).toLowerCase().trim() === strId)
    
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates }
      await saveModuleDataToDB("tasks", current, companyId)
      return { ...current[idx] }
    }

    // Fallback: create or return updated placeholder if task not found
    const fallbackTask: Task = {
      id: String(id),
      title: updates.title || "Task",
      startDate: updates.startDate || "-",
      deadline: updates.deadline || "-",
      status: updates.status || "To do",
      priority: updates.priority || "Normal",
      ...updates,
    } as Task
    const combined = [fallbackTask, ...current]
    await saveModuleDataToDB("tasks", combined, companyId)
    return fallbackTask
  },

  deleteTask: async (id: string, companyId?: string): Promise<void> => {
    const strId = String(id).toLowerCase().trim()
    await markGlobalItemDeleted(strId, "tasks")

    const current = await fetchModuleDataFromDB<Task[]>("tasks", [], companyId)
    const filtered = current.filter((t) => String(t.id).toLowerCase().trim() !== strId)
    await saveModuleDataToDB("tasks", filtered, companyId)
  },
}
