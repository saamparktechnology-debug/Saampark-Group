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
  
  if (!targetComp || targetComp === "all") {
    const knownCompanies = ["all", "tech", "infotech", "fashion", "digital", "consultancy", "jewellers"]
    const results = await Promise.all(
      knownCompanies.map(c => fetchModuleDataFromDB<Project[]>("projects", [], c).catch(() => []))
    )
    const map = new Map<string, Project>()
    for (const list of results) {
      for (const p of (Array.isArray(list) ? list : [])) {
        if (p && p.id) map.set(String(p.id).toLowerCase().trim(), p)
      }
    }
    return filterGlobalDeletedItems(Array.from(map.values()))
  }

  const scopedData = await fetchModuleDataFromDB<Project[]>("projects", [], targetComp)
  const allMaster = await fetchModuleDataFromDB<Project[]>("projects", [], "all").catch(() => [])
  
  const map = new Map<string, Project>()
  for (const p of (Array.isArray(allMaster) ? allMaster : [])) {
    if (p && p.id) {
      const pComp = p.companyId || (p as any).company || "tech"
      if (pComp === targetComp || (targetComp === "tech" && !p.companyId)) {
        map.set(String(p.id).toLowerCase().trim(), p)
      }
    }
  }
  for (const p of (Array.isArray(scopedData) ? scopedData : [])) {
    if (p && p.id) map.set(String(p.id).toLowerCase().trim(), { ...p, companyId: p.companyId || targetComp })
  }
  
  if (map.size === 0 && Array.isArray(allMaster) && allMaster.length > 0) {
    for (const p of allMaster) {
      if (p && p.id) map.set(String(p.id).toLowerCase().trim(), p)
    }
  }

  return Array.from(map.values())
}

export const addProject = async (project: Omit<Project, "id">, companyId?: string): Promise<Project> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  const effectiveComp = (!targetComp || targetComp === "all") ? "tech" : targetComp

  const currentScoped = await fetchModuleDataFromDB<Project[]>("projects", [], effectiveComp)
  const currentTech = effectiveComp !== "tech" ? await fetchModuleDataFromDB<Project[]>("projects", [], "tech") : []
  const currentAll = await fetchModuleDataFromDB<Project[]>("projects", [], "all")
  
  const allExisting = [...currentScoped, ...currentTech, ...currentAll]
  const numericIds = allExisting.map(p => {
    const raw = String(p?.id || "").replace(/\D/g, "")
    const num = parseInt(raw, 10)
    return isNaN(num) ? 0 : num
  })
  const maxNum = Math.max(...numericIds, 0)
  const nextNum = maxNum > 0 ? (maxNum + 1).toString() : String(Date.now()).slice(-6)
  
  // Guarantee ID is unique across all existing projects and non-empty
  let newId = nextNum
  if (allExisting.some(p => String(p.id).toLowerCase().trim() === newId.toLowerCase().trim())) {
    newId = `PRJ_${Date.now().toString().slice(-6)}`
  }
  
  let activeBranch: string | undefined = undefined
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      activeBranch = useAuthStore.getState().activeBranchId || useAuthStore.getState().user?.branchId || undefined
    } catch {}
  }

  const newProject: Project = {
    ...project,
    id: newId,
    companyId: effectiveComp,
    branchId: (project as any).branchId || activeBranch || undefined,
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
  
  // Save to effective company
  const updatedScoped = [newProject, ...currentScoped.filter(p => String(p?.id) !== String(newId))]
  await saveModuleDataToDB("projects", updatedScoped, effectiveComp)
  
  // Save to default tech company
  if (effectiveComp !== "tech") {
    const updatedTech = [newProject, ...currentTech.filter(p => String(p?.id) !== String(newId))]
    await saveModuleDataToDB("projects", updatedTech, "tech")
  }

  // Save to master "all"
  const updatedAll = [newProject, ...currentAll.filter(p => String(p?.id) !== String(newId))]
  await saveModuleDataToDB("projects", updatedAll, "all")

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_projects_updated"))
  }
  return newProject
}


export const syncLinkedOrdersWithProject = async (
  projectTitle: string,
  projectId: string,
  projectStatus: string,
  companyId?: string
) => {
  try {
    const { getOrders, updateOrder } = await import("@/app/feature/sales/orders/services/orderService")
    const orders = await getOrders(companyId || "all").catch(() => [])
    const pTitleNorm = (projectTitle || "").toLowerCase().trim()
    const pIdNorm = String(projectId || "").toLowerCase().trim()

    let targetOrderStatus: "Pending" | "Processing" | "Completed" | "Cancelled" = "Processing"
    const normStatus = (projectStatus || "").toLowerCase().trim()

    if (normStatus === "completed" || normStatus === "finished") {
      targetOrderStatus = "Completed"
    } else if (normStatus === "canceled" || normStatus === "cancelled") {
      targetOrderStatus = "Cancelled"
    } else if (normStatus === "on hold" || normStatus === "pending" || normStatus === "not started") {
      targetOrderStatus = "Pending"
    } else {
      targetOrderStatus = "Processing"
    }

    for (const ord of orders) {
      const ordProj = (ord.project || "").toLowerCase().trim()
      const ordId = String(ord.id || "").toLowerCase().trim()
      const isMatch =
        ordProj === pTitleNorm ||
        ordId === pIdNorm ||
        (pTitleNorm && ordProj.includes(pTitleNorm)) ||
        (ordProj && pTitleNorm.includes(ordProj))

      if (isMatch && ord.status !== targetOrderStatus) {
        await updateOrder(ord.id, { status: targetOrderStatus }, companyId)
      }
    }
  } catch (err) {
    console.warn("Failed to sync orders with project status:", err)
  }
}

export const updateProject = async (id: string, updates: Partial<Project>, companyId?: string): Promise<Project> => {
  const strId = String(id).toLowerCase().trim()
  const allProjects = await fetchModuleDataFromDB<Project[]>("projects", [], "all").catch(() => [])
  const foundInAll = allProjects.find(p => String(p.id).toLowerCase().trim() === strId)

  const oldCompanyId = (foundInAll?.companyId || companyId || "tech").toLowerCase().trim()
  const newCompanyId = (updates.companyId || companyId || oldCompanyId).toLowerCase().trim()

  const prevStatus = foundInAll?.status
  const updatedProj: Project = {
    id: String(id),
    title: updates.title || foundInAll?.title || "Project",
    ...foundInAll,
    ...updates,
    companyId: newCompanyId,
  } as Project

  // Cross-Company Transfer
  if (newCompanyId !== oldCompanyId) {
    const oldList = await fetchModuleDataFromDB<Project[]>("projects", [], oldCompanyId).catch(() => [])
    const filteredOld = oldList.filter(p => String(p.id).toLowerCase().trim() !== strId)
    await saveModuleDataToDB("projects", filteredOld, oldCompanyId)

    const newList = await fetchModuleDataFromDB<Project[]>("projects", [], newCompanyId).catch(() => [])
    const updatedNew = [updatedProj, ...newList.filter(p => String(p.id).toLowerCase().trim() !== strId)]
    await saveModuleDataToDB("projects", updatedNew, newCompanyId)
  } else {
    const targetComp = companyId || newCompanyId
    const currentList = await fetchModuleDataFromDB<Project[]>("projects", [], targetComp).catch(() => [])
    const updatedList = [updatedProj, ...currentList.filter(p => String(p.id).toLowerCase().trim() !== strId)]
    await saveModuleDataToDB("projects", updatedList, targetComp)
  }

  // Update in "all"
  const allList = Array.isArray(allProjects) ? allProjects : []
  const updatedAll = [updatedProj, ...allList.filter(p => String(p.id).toLowerCase().trim() !== strId)]
  await saveModuleDataToDB("projects", updatedAll, "all")

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_projects_updated"))
  }

  if (updates.status && updates.status !== prevStatus) {
    syncLinkedOrdersWithProject(updatedProj.title, updatedProj.id, updates.status, newCompanyId).catch(() => null)
  }

  if (updates.status === "Completed" && prevStatus !== "Completed") {
    sendProjectCompletionEmailNotification(updatedProj).catch(() => null)
  }
  return updatedProj
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

  if (newStatus !== target.status) {
    syncLinkedOrdersWithProject(updatedProj.title, updatedProj.id, newStatus, companyId).catch(() => null)
  }

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
          }, targetProject?.companyId || companyId)
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
