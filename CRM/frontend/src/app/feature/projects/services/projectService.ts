import { Project } from "../types"
import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"

export const initialProjects: Project[] = []

export const getProjects = async (): Promise<Project[]> => {
  const data = await fetchModuleDataFromDB<Project[]>("projects", [])
  return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
}

export const addProject = async (project: Omit<Project, "id">): Promise<Project> => {
  const current = await fetchModuleDataFromDB<Project[]>("projects", [])
  const newId = (Math.max(...current.map(p => parseInt(p.id) || 0), 0) + 1).toString()
  
  const newProject: Project = {
    ...project,
    id: newId,
    starred: false,
    totalHours: 0,
    members: project.members || [],
    taskBreakdown: { todo: 0, inProgress: 0, review: 0, done: 0 },
    activityLogs: [
      { 
        id: `act-${Date.now()}`, 
        user: project.billedBy || "Admin", 
        timestamp: "Just now", 
        action: "Created", 
        title: `Project "${project.title}" created`, 
        badge: "Project" 
      }
    ]
  }
  const updated = [newProject, ...current]
  await saveModuleDataToDB("projects", updated)
  
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("saampark_db_projects", JSON.stringify(updated))
      localStorage.setItem("saampark_projects_updated", String(Date.now()))
      window.dispatchEvent(new Event("storage"))
    } catch {}
  }
  
  return newProject
}

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
  const strId = String(id).toLowerCase().trim()
  const current = await fetchModuleDataFromDB<Project[]>("projects", [])
  const idx = current.findIndex(p => String(p.id).toLowerCase().trim() === strId)
  if (idx === -1) {
    const updatedProj = { id: String(id), title: "Project", ...updates } as Project
    const nextList = [updatedProj, ...current]
    await saveModuleDataToDB("projects", nextList)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("saampark_db_projects", JSON.stringify(nextList))
        localStorage.setItem("saampark_projects_updated", String(Date.now()))
        window.dispatchEvent(new Event("storage"))
      } catch {}
    }
    return updatedProj
  }
  current[idx] = { ...current[idx], ...updates }
  await saveModuleDataToDB("projects", current)
  
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("saampark_db_projects", JSON.stringify(current))
      localStorage.setItem("saampark_projects_updated", String(Date.now()))
      window.dispatchEvent(new Event("storage"))
    } catch {}
  }
  
  return { ...current[idx] }
}

export const deleteProject = async (id: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "projects")
  const current = await fetchModuleDataFromDB<Project[]>("projects", [])
  const filtered = current.filter(p => String(p.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("projects", filtered)

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("saampark_db_projects", JSON.stringify(filtered))
      localStorage.setItem("saampark_projects_updated", String(Date.now()))
      window.dispatchEvent(new Event("storage"))
    } catch {}
  }
  return true
}
