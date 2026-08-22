import { Subscription } from "../types"
import { SubscriptionService } from "@/services/apiServices"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"

export const getSubscriptions = async (companyId: string): Promise<Subscription[]> => {
  try {
    const liveSubs = await SubscriptionService.getSubscriptions()
    if (Array.isArray(liveSubs) && liveSubs.length > 0) {
      const mapped = liveSubs.map((s: any) => ({
        id: String(s.id || s._id),
        clientName: s.customer_id ? `Customer #${s.customer_id}` : 'Customer',
        planName: s.package_id ? `Package 0${s.package_id}` : 'Standard Package',
        status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Active',
        amount: s.amount ? `₹${s.amount}` : '₹0',
        billingCycle: s.billing_cycle ? s.billing_cycle.charAt(0).toUpperCase() + s.billing_cycle.slice(1) : 'Monthly',
        nextBillingDate: s.next_billing_date || '-',
      }))
      return filterGlobalDeletedItems(mapped)
    }
  } catch (err) {
    console.error("API error loading subscriptions:", err)
  }
  const fallback = await fetchModuleDataFromDB<Subscription[]>("subscriptions", [])
  return filterGlobalDeletedItems(fallback)
}

export const addSubscription = async (sub: Omit<Subscription, "id">): Promise<Subscription> => {
  const current = await fetchModuleDataFromDB<Subscription[]>("subscriptions", [])
  const newSub: Subscription = {
    ...sub,
    id: `sub_${Date.now()}`,
  }
  const updated = [newSub, ...current]
  await saveModuleDataToDB("subscriptions", updated)
  return newSub
}

export const deleteSubscription = async (id: string): Promise<void> => {
  await markGlobalItemDeleted(id, "subscriptions")
  const current = await fetchModuleDataFromDB<Subscription[]>("subscriptions", [])
  const updated = current.filter(s => s.id !== id)
  await saveModuleDataToDB("subscriptions", updated)
}
