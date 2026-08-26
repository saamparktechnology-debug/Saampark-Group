import { Project, ProjectMilestone, ActivityItem } from "../types"
import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"

export const initialProjects: Project[] = []

export const getProjects = async (companyId?: string): Promise<Project[]> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  
  const scopedData = await fetchModuleDataFromDB<Project[]>("projects", [], targetComp || "all")
  const allMaster = (targetComp && targetComp !== "all") 
    ? await fetchModuleDataFromDB<Project[]>("projects", [], "all")
    : []
  
  const map = new Map<string, Project>()
  for (const p of (Array.isArray(allMaster) ? allMaster : [])) {
    if (p && p.id) map.set(String(p.id).toLowerCase().trim(), p)
  }
  for (const p of (Array.isArray(scopedData) ? scopedData : [])) {
    if (p && p.id) map.set(String(p.id).toLowerCase().trim(), p)
  }
  
  return filterGlobalDeletedItems(Array.from(map.values()))
}

export const addProject = async (project: Omit<Project, "id">, companyId?: string): Promise<Project> => {
  const current = await fetchModuleDataFromDB<Project[]>("projects", [], companyId || "all")
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
  await saveModuleDataToDB("projects", updated, companyId || "all")
  
  // Also sync to master "all" and active company if distinct
  if (companyId && companyId !== "all") {
    const allList = await fetchModuleDataFromDB<Project[]>("projects", [], "all")
    const mergedAll = [newProject, ...allList.filter(p => String(p.id) !== String(newId))]
    await saveModuleDataToDB("projects", mergedAll, "all")
  } else {
    // Also save to default tech/digital company
    const techList = await fetchModuleDataFromDB<Project[]>("projects", [], "tech")
    await saveModuleDataToDB("projects", [newProject, ...techList.filter(p => String(p.id) !== String(newId))], "tech")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_projects_updated"))
  }
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

export const addOrUpdateProjectMilestone = async (
  projectId: string,
  milestone: ProjectMilestone,
  userName: string = "Developer",
  companyId?: string
): Promise<Project> => {
  const current = await getProjects(companyId)
  const idx = current.findIndex(p => String(p.id).toLowerCase().trim() === String(projectId).toLowerCase().trim())
  if (idx === -1) throw new Error("Project not found")

  const target = current[idx]
  const existingMilestones = target.milestones || []
  const mIdx = existingMilestones.findIndex(m => m.id === milestone.id)

  let updatedMilestones: ProjectMilestone[] = []
  if (mIdx !== -1) {
    updatedMilestones = existingMilestones.map(m => m.id === milestone.id ? milestone : m)
  } else {
    updatedMilestones = [...existingMilestones, milestone]
  }

  // Auto calculate progress percentage
  const totalM = updatedMilestones.length
  const completedM = updatedMilestones.filter(m => m.status === "Completed").length
  const newProgress = totalM > 0 ? Math.round((completedM / totalM) * 100) : target.progress
  const newStatus = newProgress === 100 ? "Completed" : newProgress > 0 ? "In Progress" : target.status

  const newActivity: ActivityItem = {
    id: `act_${Date.now()}`,
    user: userName,
    timestamp: "Just now",
    action: milestone.status === "Completed" ? "Completed" : "Updated",
    title: `${milestone.title} (${milestone.status})${milestone.notes ? `: ${milestone.notes}` : ""}`,
    badge: milestone.stage,
  }

  const updatedProj: Project = {
    ...target,
    milestones: updatedMilestones,
    progress: newProgress,
    status: newStatus as any,
    activityLogs: [newActivity, ...(target.activityLogs || [])],
  }

  current[idx] = updatedProj
  await saveModuleDataToDB("projects", current, companyId)
  return updatedProj
}

export const deleteProject = async (id: string, companyId?: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "projects")
  const current = await fetchModuleDataFromDB<Project[]>("projects", [], companyId)
  const filtered = current.filter(p => String(p.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("projects", filtered, companyId)
  return true
}
