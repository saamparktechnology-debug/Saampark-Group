import { Subscription } from "../types"
import { SubscriptionService } from "@/services/apiServices"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"
import { Project } from "@/app/feature/projects/types"

export const getSubscriptions = async (companyId?: string): Promise<Subscription[]> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  const effectiveComp = (!targetComp || targetComp === "all") ? "tech" : targetComp

  const map = new Map<string, Subscription>()

  // 1. Load from dedicated subscriptions table
  const [scopedSubs, allSubs] = await Promise.all([
    fetchModuleDataFromDB<Subscription[]>("subscriptions", [], effectiveComp).catch(() => []),
    fetchModuleDataFromDB<Subscription[]>("subscriptions", [], "all").catch(() => []),
  ])

  for (const s of [...(Array.isArray(allSubs) ? allSubs : []), ...(Array.isArray(scopedSubs) ? scopedSubs : [])]) {
    if (s && s.id) {
      map.set(String(s.id).toLowerCase().trim(), s)
    }
  }

  // 2. Discover Part-Payment / Subscription Projects
  try {
    const [scopedProjects, allProjects] = await Promise.all([
      fetchModuleDataFromDB<Project[]>("projects", [], effectiveComp).catch(() => []),
      fetchModuleDataFromDB<Project[]>("projects", [], "all").catch(() => []),
    ])

    const combinedProjects = [...(Array.isArray(allProjects) ? allProjects : []), ...(Array.isArray(scopedProjects) ? scopedProjects : [])]

    for (const p of combinedProjects) {
      if (!p || !p.id) continue
      const isPartPayment = Boolean(
        (p.installmentsCount && p.installmentsCount > 0) ||
        (p.installmentAmount && p.installmentAmount > 0) ||
        p.paymentStructure === "Advance + Part Payment" ||
        (Array.isArray(p.labels) && p.labels.some(l => String(l).toLowerCase().includes("part") || String(l).toLowerCase().includes("subscription")))
      )

      if (isPartPayment) {
        const subId = p.subscriptionId || `sub_proj_${p.id}`
        if (!map.has(subId.toLowerCase().trim())) {
          map.set(subId.toLowerCase().trim(), {
            id: subId,
            clientName: p.client || "Client",
            planName: `${p.title} (Part Payment / ${p.installmentsCount || 1} Installments)`,
            status: p.dueAmount === 0 ? "Canceled" : "Active",
            amount: p.installmentAmount 
              ? `₹${p.installmentAmount.toLocaleString("en-IN")}` 
              : (p.price || "₹0"),
            billingCycle: "Monthly",
            nextBillingDate: p.deadline || "Monthly",
          })
        }
      }
    }
  } catch (err) {
    console.warn("Could not aggregate part payment projects into subscriptions:", err)
  }

  // 3. Fallback to API if available
  try {
    const liveSubs = await SubscriptionService.getSubscriptions().catch(() => [])
    if (Array.isArray(liveSubs) && liveSubs.length > 0) {
      for (const s of liveSubs) {
        const id = String(s.id || s._id)
        if (!map.has(id.toLowerCase().trim())) {
          map.set(id.toLowerCase().trim(), {
            id: id,
            clientName: s.customer_id ? `Customer #${s.customer_id}` : 'Customer',
            planName: s.package_id ? `Package 0${s.package_id}` : 'Standard Package',
            status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) as any : 'Active',
            amount: s.amount ? `₹${s.amount}` : '₹0',
            billingCycle: s.billing_cycle ? s.billing_cycle.charAt(0).toUpperCase() + s.billing_cycle.slice(1) as any : 'Monthly',
            nextBillingDate: s.next_billing_date || '-',
          })
        }
      }
    }
  } catch {}

  return filterGlobalDeletedItems(Array.from(map.values()))
}

export const addSubscription = async (sub: Omit<Subscription, "id">, companyId?: string): Promise<Subscription> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  const effectiveComp = (!targetComp || targetComp === "all") ? "tech" : targetComp

  const current = await fetchModuleDataFromDB<Subscription[]>("subscriptions", [], effectiveComp)
  const currentAll = await fetchModuleDataFromDB<Subscription[]>("subscriptions", [], "all")

  const newSub: Subscription = {
    ...sub,
    id: `sub_${Date.now()}`,
  }
  const updatedScoped = [newSub, ...(Array.isArray(current) ? current.filter(s => s.id !== newSub.id) : [])]
  const updatedAll = [newSub, ...(Array.isArray(currentAll) ? currentAll.filter(s => s.id !== newSub.id) : [])]

  await Promise.all([
    saveModuleDataToDB("subscriptions", updatedScoped, effectiveComp),
    saveModuleDataToDB("subscriptions", updatedAll, "all"),
  ])

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }

  return newSub
}

export const deleteSubscription = async (id: string, companyId?: string): Promise<void> => {
  await markGlobalItemDeleted(id, "subscriptions")
  const targetComp = companyId || "all"
  const current = await fetchModuleDataFromDB<Subscription[]>("subscriptions", [], targetComp)
  const updated = current.filter(s => s.id !== id)
  await Promise.all([
    saveModuleDataToDB("subscriptions", updated, targetComp),
    saveModuleDataToDB("subscriptions", updated, "all"),
  ])
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }
}
