import { Project } from "../types"
import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"

export const initialProjects: Project[] = []

export const getProjects = async (companyId?: string): Promise<Project[]> => {
  const data = await fetchModuleDataFromDB<Project[]>("projects", [], companyId)
  return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
}

export const addProject = async (project: Omit<Project, "id">, companyId?: string): Promise<Project> => {
  const current = await fetchModuleDataFromDB<Project[]>("projects", [], companyId)
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
  await saveModuleDataToDB("projects", updated, companyId)
  return newProject
}

export const updateProject = async (id: string, updates: Partial<Project>, companyId?: string): Promise<Project> => {
  const strId = String(id).toLowerCase().trim()
  const current = await fetchModuleDataFromDB<Project[]>("projects", [], companyId)
  const idx = current.findIndex(p => String(p.id).toLowerCase().trim() === strId)
  if (idx === -1) {
    const updatedProj = { id: String(id), title: "Project", ...updates } as Project
    const nextList = [updatedProj, ...current]
    await saveModuleDataToDB("projects", nextList, companyId)
    return updatedProj
  }
  current[idx] = { ...current[idx], ...updates }
  await saveModuleDataToDB("projects", current, companyId)
  return { ...current[idx] }
}

export const deleteProject = async (id: string, companyId?: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "projects")
  const current = await fetchModuleDataFromDB<Project[]>("projects", [], companyId)
  const filtered = current.filter(p => String(p.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("projects", filtered, companyId)
  return true
}
