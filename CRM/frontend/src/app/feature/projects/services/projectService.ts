import { Project, ProjectMilestone, ActivityItem } from "../types"
import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { sendProjectCompletionEmailNotification } from "@/services/emailNotificationService"

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
    if (updates.status === "Completed") {
      sendProjectCompletionEmailNotification(updatedProj).catch(() => null)
    }
    return updatedProj
  }
  const prevStatus = current[idx].status
  current[idx] = { ...current[idx], ...updates }
  await saveModuleDataToDB("projects", current, companyId)

  if (updates.status === "Completed" && prevStatus !== "Completed") {
    sendProjectCompletionEmailNotification(current[idx]).catch(() => null)
  }
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

  if (newStatus === "Completed" && target.status !== "Completed") {
    sendProjectCompletionEmailNotification(updatedProj).catch(() => null)
  }

  return updatedProj
}


export const deleteProject = async (id: string, companyId?: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "projects")

  // Find target project for cascading cleanup
  const allProjects = await getProjects()
  const targetProject = allProjects.find(p => String(p.id).toLowerCase().trim() === strId)
  const projTitleNorm = targetProject?.title ? targetProject.title.toLowerCase().trim() : ""
  const clientNameNorm = targetProject?.client ? targetProject.client.toLowerCase().trim() : ""

  const current = await fetchModuleDataFromDB<Project[]>("projects", [], companyId)
  const filtered = current.filter(p => String(p.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("projects", filtered, companyId)

  // Also remove from master 'all' list
  const masterList = await fetchModuleDataFromDB<Project[]>("projects", [], "all")
  const filteredMaster = masterList.filter(p => String(p.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("projects", filteredMaster, "all")

  // Cascading Cleanup of Invoices, Orders, Payments, and Client Totals
  if (projTitleNorm) {
    try {
      // 1. Cascade Invoices
      const { getInvoices, deleteInvoice } = await import("@/app/feature/sales/invoices/services/invoiceService")
      const invoices = await getInvoices()
      const matchingInvoices = invoices.filter(i => 
        (i.project && i.project.toLowerCase().trim() === projTitleNorm) ||
        (clientNameNorm && i.client && i.client.toLowerCase().trim() === clientNameNorm && i.project && i.project.toLowerCase().trim().includes(projTitleNorm))
      )
      for (const inv of matchingInvoices) {
        await deleteInvoice(inv.id)
      }

      // 2. Cascade Orders
      const orders = await fetchModuleDataFromDB<any[]>("orders", [])
      const remainingOrders = orders.filter(o => {
        const oProj = (o.project || "").toLowerCase().trim()
        const oMatch = oProj === projTitleNorm || matchingInvoices.some(i => i.id === o.invoiceId || i.id === o.orderNumber)
        if (oMatch) {
          markGlobalItemDeleted(String(o.id || o.orderNumber), "orders")
          return false
        }
        return true
      })
      await saveModuleDataToDB("orders", remainingOrders)

      // 3. Cascade Payments
      const { getPayments, deletePayment } = await import("@/app/feature/sales/payments/services/paymentService")
      const payments = await getPayments()
      const matchingPayments = payments.filter(p => {
        const pProj = (p.project || "").toLowerCase().trim()
        const pInv = (p.invoiceId || "").toLowerCase().trim()
        return pProj === projTitleNorm || matchingInvoices.some(i => i.id.toLowerCase().trim() === pInv)
      })
      for (const pay of matchingPayments) {
        await deletePayment(pay.id)
      }

      // 4. Adjust Client totals
      if (clientNameNorm) {
        const { getClients, saveStoredClient } = await import("@/app/feature/clients/services/clientService")
        const clients = await getClients()
        const targetClient = clients.find(c => c.name.toLowerCase().trim() === clientNameNorm)
        if (targetClient) {
          const removedInvoiced = matchingInvoices.reduce((sum, inv) => sum + (parseInt((inv.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0), 0)
          const removedPaid = matchingInvoices.reduce((sum, inv) => sum + (parseInt((inv.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0), 0)
          const removedDue = matchingInvoices.reduce((sum, inv) => sum + (parseInt((inv.due || "0").replace(/[^0-9]/g, "")) || 0), 0)

          const currInvoiced = parseInt((targetClient.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
          const currPaid = parseInt((targetClient.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
          const currDue = parseInt((targetClient.due || "0").replace(/[^0-9]/g, "")) || 0
          const currProjectsCount = targetClient.projectsCount || 1

          await saveStoredClient({
            ...targetClient,
            projectsCount: Math.max(0, currProjectsCount - 1),
            totalInvoiced: `₹${Math.max(0, currInvoiced - removedInvoiced).toLocaleString("en-IN")}`,
            paymentReceived: `₹${Math.max(0, currPaid - removedPaid).toLocaleString("en-IN")}`,
            due: `₹${Math.max(0, currDue - removedDue).toLocaleString("en-IN")}`,
          })
        }
      }
    } catch (err) {
      console.warn("Error during cascading project deletion:", err)
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_projects_updated"))
    window.dispatchEvent(new CustomEvent("saampark_invoices_updated"))
    window.dispatchEvent(new CustomEvent("saampark_orders_updated"))
  }

  return true
}
