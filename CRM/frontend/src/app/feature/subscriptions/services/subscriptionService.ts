import { Subscription } from "../types"
import { SubscriptionService } from "@/services/apiServices"

export const getSubscriptions = async (companyId: string): Promise<Subscription[]> => {
  try {
    const liveSubs = await SubscriptionService.getSubscriptions()
    if (Array.isArray(liveSubs)) {
      return liveSubs.map((s: any) => ({
        id: String(s.id || s._id),
        clientName: s.customer_id ? `Customer #${s.customer_id}` : 'Customer',
        planName: s.package_id ? `Package 0${s.package_id}` : 'Standard Package',
        status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Active',
        amount: s.amount ? `₹${s.amount}` : '₹0',
        billingCycle: s.billing_cycle ? s.billing_cycle.charAt(0).toUpperCase() + s.billing_cycle.slice(1) : 'Monthly',
        nextBillingDate: s.next_billing_date || '-',
      }))
    }
  } catch (err) {
    console.error("API error loading subscriptions:", err)
  }
  return []
}
