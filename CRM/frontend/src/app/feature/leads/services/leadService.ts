import { Lead } from "../types"
import { LeadService, LeadPayload } from "@/services/apiServices"

export const statusColors: Record<string, string> = {
  New: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Discussion: "bg-info/10 text-info border-info/20",
  Negotiation: "bg-warning/10 text-warning border-warning/20",
  Qualified: "bg-success/10 text-success border-success/20",
  Won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Lost: "bg-danger/10 text-danger border-danger/20",
}

export const getLeads = async (companyId: string): Promise<Lead[]> => {
  try {
    const liveLeads = await LeadService.getLeads()
    if (Array.isArray(liveLeads)) {
      return liveLeads.map((item: any) => ({
        id: String(item.id || item._id),
        name: item.company_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Lead',
        primaryContact: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Contact',
        phone: item.phone || '+91 98000 00000',
        owner: item.assigned_to ? `User #${item.assigned_to}` : 'Sales Rep',
        value: item.lead_score ? `₹${item.lead_score * 1000}` : '₹50,000',
        createdAt: item.createdAt || item.created_at ? new Date(item.createdAt || item.created_at).toLocaleDateString('en-GB') : 'Today',
        status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'New',
      }))
    }
  } catch (err) {
    console.error("API error fetching leads:", err)
  }
  return []
}

export const createLead = async (payload: LeadPayload) => {
  return await LeadService.addLead(payload)
}
