import { Task } from "../types"
import { api } from "@/lib/api"
import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"

export const initialTasks: Task[] = []

const TASKS_STORAGE_KEY = "saampark_tasks_store"

function getPersistedTasks(): Task[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY)
    const list: Task[] = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? filterGlobalDeletedItems(list) : []
  } catch {
    return []
  }
}

function savePersistedTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
    saveModuleDataToDB("tasks", tasks)
  } catch {}
}

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    // Fetch persisted data from MySQL app_data store with deleted items filtered out
    const dbData = await fetchModuleDataFromDB<Task[]>("tasks", [])
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

  addTask: async (taskData: Omit<Task, "id"> & { id?: string }): Promise<Task> => {
    const current = await taskService.getTasks()
    let nextId = taskData.id
    if (!nextId) {
      const maxIdNum = current.reduce((max, t) => {
        const n = parseInt(String(t.id).replace(/[^0-9]/g, "")) || 0
        return Math.max(max, n)
      }, 3650)
      nextId = (maxIdNum + 1).toString()
    }
    const newTask: Task = { ...taskData, id: nextId }
    const updated = [newTask, ...current.filter(t => String(t.id).toLowerCase().trim() !== String(nextId).toLowerCase().trim())]
    await saveModuleDataToDB("tasks", updated)
    return newTask
  },

  addTasks: async (taskDataList: (Omit<Task, "id"> & { id?: string })[]): Promise<Task[]> => {
    if (!taskDataList || taskDataList.length === 0) return []
    const current = await taskService.getTasks()
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
    await saveModuleDataToDB("tasks", updated)
    return newTasks
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const strId = String(id).toLowerCase().trim()
    const current = await fetchModuleDataFromDB<Task[]>("tasks", [])
    const idx = current.findIndex((t) => String(t.id).toLowerCase().trim() === strId)
    
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates }
      await saveModuleDataToDB("tasks", current)
      return { ...current[idx] }
    }

    // Fallback: check localStorage directly
    let localList: Task[] = []
    try {
      const raw = localStorage.getItem("saampark_db_tasks") || localStorage.getItem(TASKS_STORAGE_KEY)
      if (raw) localList = JSON.parse(raw)
    } catch {}

    const localIdx = localList.findIndex((t) => String(t.id).toLowerCase().trim() === strId)
    if (localIdx !== -1) {
      localList[localIdx] = { ...localList[localIdx], ...updates }
      await saveModuleDataToDB("tasks", localList)
      return { ...localList[localIdx] }
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
    await saveModuleDataToDB("tasks", combined)
    return fallbackTask
  },

  deleteTask: async (id: string): Promise<void> => {
    const strId = String(id).toLowerCase().trim()
    await markGlobalItemDeleted(strId, "tasks")

    // Clear from local storage keys immediately
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("saampark_db_tasks") || localStorage.getItem(TASKS_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            const filteredLocal = parsed.filter((t) => String(t.id).toLowerCase().trim() !== strId)
            localStorage.setItem("saampark_db_tasks", JSON.stringify(filteredLocal))
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(filteredLocal))
          }
        }
      } catch {}
    }

    const current = await fetchModuleDataFromDB<Task[]>("tasks", [])
    const filtered = current.filter((t) => String(t.id).toLowerCase().trim() !== strId)
    await saveModuleDataToDB("tasks", filtered)
  },
}
