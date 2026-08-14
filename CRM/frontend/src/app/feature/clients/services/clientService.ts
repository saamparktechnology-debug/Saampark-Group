import { Client } from "../types"
import { CustomerService, CustomerPayload } from "@/services/apiServices"

export const getClients = async (companyId: string): Promise<Client[]> => {
  try {
    const liveCustomers = await CustomerService.getCustomers()
    if (Array.isArray(liveCustomers)) {
      return liveCustomers.map((item: any) => ({
        id: String(item.id || item._id),
        name: item.company_name || item.name || 'Client',
        email: item.email || item.primary_contact_email || 'client@example.com',
        status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Active',
        projects: item.projects_count || 0,
        amount: item.total_value ? `₹${item.total_value}` : '₹0',
      }))
    }
  } catch (err) {
    console.error("API error fetching customers:", err)
  }
  return []
}

export const createCustomer = async (payload: CustomerPayload) => {
  return await CustomerService.createCustomer(payload)
}
