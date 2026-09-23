import { Task } from "../types"
import { api } from "@/lib/api"
import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"
import { recordActivityLog } from "@/services/activityLogService"

export const initialTasks: Task[] = []

export const taskService = {
  getTasks: async (companyId?: string): Promise<Task[]> => {
    let targetComp = companyId
    if (!targetComp && typeof window !== "undefined") {
      try {
        const { useAuthStore } = require("@/store/useAuthStore")
        targetComp = useAuthStore.getState().activeCompanyId || undefined
      } catch {}
    }

    if (!targetComp || targetComp === "all") {
      const allData = await fetchModuleDataFromDB<Task[]>("tasks", [], "all").catch(() => [])
      return filterGlobalDeletedItems(Array.isArray(allData) ? allData : [])
    }

    // Strictly fetch tasks only for the specified company
    const scopedData = await fetchModuleDataFromDB<Task[]>("tasks", [], targetComp).catch(() => [])
    const filtered = (Array.isArray(scopedData) ? scopedData : []).filter(t => {
      if (!t || !t.id) return false
      const tComp = (t.companyId || targetComp).toLowerCase().trim()
      return tComp === targetComp.toLowerCase().trim()
    })

    return filterGlobalDeletedItems(filtered)
  },

  addTask: async (taskData: Omit<Task, "id"> & { id?: string }, companyId?: string): Promise<Task> => {
    let activeBranch: string | undefined = undefined
    let activeCompany: string | undefined = undefined
    let activeSubBranch: string | undefined = undefined
    let activeBranchName: string | undefined = undefined
    let activeSubBranchName: string | undefined = undefined

    if (typeof window !== "undefined") {
      try {
        const { useAuthStore } = require("@/store/useAuthStore")
        const state = useAuthStore.getState()
        activeBranch = state.activeBranchId || state.user?.branchId || undefined
        activeCompany = state.activeCompanyId || state.user?.companyId || "tech"
        activeSubBranch = state.activeSubBranchId || (state.user as any)?.subBranchId || undefined
        
        if (activeBranch) {
          const ab = activeBranch
          const bObj = state.branches.find((b: any) => b.id === ab || (b.name && b.name.toLowerCase() === ab.toLowerCase()))
          if (bObj) activeBranchName = bObj.name
        }
        if (activeSubBranch) {
          const asb = activeSubBranch
          const sbObj = state.subBranches.find((sb: any) => sb.id === asb || (sb.name && sb.name.toLowerCase() === asb.toLowerCase()))
          if (sbObj) activeSubBranchName = sbObj.name
        }
      } catch {}
    }

    const effectiveComp = companyId || taskData.companyId || activeCompany || "tech"
    const effectiveBranch = (taskData as any).branchId || activeBranch || undefined
    const effectiveBranchName = (taskData as any).branchName || activeBranchName || undefined
    const effectiveSubBranch = (taskData as any).subBranchId || activeSubBranch || undefined
    const effectiveSubBranchName = (taskData as any).subBranchName || activeSubBranchName || undefined

    const currentScoped = await taskService.getTasks(effectiveComp)
    const currentAll = await fetchModuleDataFromDB<Task[]>("tasks", [], "all").catch(() => [])

    let nextId = taskData.id
    if (!nextId) {
      const maxIdNum = [...currentScoped, ...currentAll].reduce((max, t) => {
        const n = parseInt(String(t.id).replace(/[^0-9]/g, "")) || 0
        return Math.max(max, n)
      }, 3650)
      nextId = (maxIdNum + 1).toString()
    }

    const newTask: Task = { 
      ...taskData, 
      id: nextId,
      companyId: effectiveComp,
      branchId: effectiveBranch,
      branchName: effectiveBranchName,
      subBranchId: effectiveSubBranch,
      subBranchName: effectiveSubBranchName,
    }

    const updatedScoped = [newTask, ...currentScoped.filter(t => String(t.id).toLowerCase().trim() !== String(nextId).toLowerCase().trim())]
    const updatedAll = [newTask, ...currentAll.filter(t => String(t.id).toLowerCase().trim() !== String(nextId).toLowerCase().trim())]

    await Promise.all([
      saveModuleDataToDB("tasks", updatedScoped, effectiveComp),
      saveModuleDataToDB("tasks", updatedAll, "all"),
    ])

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"))
      window.dispatchEvent(new CustomEvent("saampark_data_synced"))
      window.dispatchEvent(new CustomEvent("saampark_tasks_updated"))
    }

    recordActivityLog({
      type: "task",
      module: "Tasks",
      action: "Task Created",
      description: `Task "${newTask.title}" assigned to ${newTask.assignedTo || "Team Member"}`,
      companyId: newTask.companyId,
      branchId: newTask.branchId,
      branchName: newTask.branchName,
      details: `Priority: ${newTask.priority || "Normal"} | Deadline: ${newTask.deadline || "None"}`
    }).catch(() => {})

    return newTask
  },


  addTasks: async (taskDataList: (Omit<Task, "id"> & { id?: string })[], companyId?: string): Promise<Task[]> => {
    if (!taskDataList || taskDataList.length === 0) return []
    const effectiveComp = companyId || "tech"
    const currentScoped = await taskService.getTasks(effectiveComp)
    const currentAll = await fetchModuleDataFromDB<Task[]>("tasks", [], "all").catch(() => [])

    let maxIdNum = [...currentScoped, ...currentAll].reduce((max, t) => {
      const n = parseInt(String(t.id).replace(/[^0-9]/g, "")) || 0
      return Math.max(max, n)
    }, 3650)

    const newTasks: Task[] = taskDataList.map((t) => {
      maxIdNum += 1
      const id = t.id || maxIdNum.toString()
      return {
        ...t,
        id,
        companyId: t.companyId || effectiveComp,
      }
    })

    const newIds = new Set(newTasks.map(t => String(t.id).toLowerCase().trim()))
    const updatedScoped = [...newTasks, ...currentScoped.filter(t => !newIds.has(String(t.id).toLowerCase().trim()))]
    const updatedAll = [...newTasks, ...currentAll.filter(t => !newIds.has(String(t.id).toLowerCase().trim()))]

    await Promise.all([
      saveModuleDataToDB("tasks", updatedScoped, effectiveComp),
      saveModuleDataToDB("tasks", updatedAll, "all"),
    ])

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"))
      window.dispatchEvent(new CustomEvent("saampark_data_synced"))
      window.dispatchEvent(new CustomEvent("saampark_tasks_updated"))
    }

    return newTasks
  },

  updateTask: async (id: string, updates: Partial<Task>, companyId?: string): Promise<Task> => {
    const strId = String(id).toLowerCase().trim()
    const currentAll = await fetchModuleDataFromDB<Task[]>("tasks", [], "all").catch(() => [])
    const foundInAll = currentAll.find(t => String(t.id).toLowerCase().trim() === strId)

    const oldCompanyId = (foundInAll?.companyId || companyId || "tech").toLowerCase().trim()
    const newCompanyId = (updates.companyId || companyId || oldCompanyId).toLowerCase().trim()

    const updatedTask: Task = {
      id: String(id),
      title: updates.title || foundInAll?.title || "Task",
      startDate: updates.startDate || foundInAll?.startDate || "-",
      deadline: updates.deadline || foundInAll?.deadline || "-",
      status: updates.status || foundInAll?.status || "To do",
      priority: updates.priority || foundInAll?.priority || "Normal",
      ...foundInAll,
      ...updates,
      companyId: newCompanyId,
    } as Task

    // Cross-Company Transfer
    if (newCompanyId !== oldCompanyId) {
      const oldList = await fetchModuleDataFromDB<Task[]>("tasks", [], oldCompanyId).catch(() => [])
      const filteredOld = oldList.filter(t => String(t.id).toLowerCase().trim() !== strId)
      await saveModuleDataToDB("tasks", filteredOld, oldCompanyId)

      const newList = await fetchModuleDataFromDB<Task[]>("tasks", [], newCompanyId).catch(() => [])
      const updatedNew = [updatedTask, ...newList.filter(t => String(t.id).toLowerCase().trim() !== strId)]
      await saveModuleDataToDB("tasks", updatedNew, newCompanyId)
    } else {
      const targetComp = companyId || newCompanyId
      const currentList = await fetchModuleDataFromDB<Task[]>("tasks", [], targetComp).catch(() => [])
      const updatedList = [updatedTask, ...currentList.filter(t => String(t.id).toLowerCase().trim() !== strId)]
      await saveModuleDataToDB("tasks", updatedList, targetComp)
    }

    // Update in "all"
    const allList = Array.isArray(currentAll) ? currentAll : []
    const updatedAll = [updatedTask, ...allList.filter(t => String(t.id).toLowerCase().trim() !== strId)]
    await saveModuleDataToDB("tasks", updatedAll, "all")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"))
      window.dispatchEvent(new CustomEvent("saampark_data_synced"))
      window.dispatchEvent(new CustomEvent("saampark_tasks_updated"))
    }

    const prevStatus = foundInAll?.status
    if (updates.status && updates.status !== prevStatus) {
      recordActivityLog({
        type: "task",
        module: "Tasks",
        action: `Task ${updatedTask.status}`,
        description: `Task "${updatedTask.title}" status changed to ${updatedTask.status}`,
        companyId: updatedTask.companyId,
        branchId: updatedTask.branchId,
        branchName: updatedTask.branchName,
        details: `Assigned To: ${updatedTask.assignedTo || "Team"} | Priority: ${updatedTask.priority || "Normal"}`
      }).catch(() => {})
    }

    return updatedTask
  },

  deleteTask: async (id: string, companyId?: string): Promise<void> => {
    const strId = String(id).toLowerCase().trim()
    markGlobalItemDeleted(strId, "tasks")

    const targetComp = companyId || "all"
    const current = await fetchModuleDataFromDB<Task[]>("tasks", [], targetComp)
    const target = current.find(t => String(t.id).toLowerCase().trim() === strId)
    const filtered = current.filter((t) => String(t.id).toLowerCase().trim() !== strId)
    await saveModuleDataToDB("tasks", filtered, targetComp)

    if (targetComp !== "all") {
      const currentAll = await fetchModuleDataFromDB<Task[]>("tasks", [], "all").catch(() => [])
      const filteredAll = currentAll.filter((t) => String(t.id).toLowerCase().trim() !== strId)
      await saveModuleDataToDB("tasks", filteredAll, "all")
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"))
      window.dispatchEvent(new CustomEvent("saampark_data_synced"))
      window.dispatchEvent(new CustomEvent("saampark_tasks_updated"))
    }

    recordActivityLog({
      type: "task",
      module: "Tasks",
      action: "Task Deleted",
      description: `Task "${target?.title || strId}" removed from the system`,
      companyId: target?.companyId || companyId,
      branchId: target?.branchId,
      branchName: target?.branchName,
    }).catch(() => {})
  },
}

