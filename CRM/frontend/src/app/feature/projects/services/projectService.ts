import { Project } from "../types"
import { DealService } from "@/services/apiServices"

export const getProjects = async (): Promise<Project[]> => {
  try {
    const liveDeals = await DealService.getDeals()
    if (Array.isArray(liveDeals)) {
      return liveDeals.map((d: any) => ({
        id: `PRJ-${d.id || d._id}`,
        name: d.title || 'Project',
        client: d.customer_id ? `Customer #${d.customer_id}` : 'Client',
        status: d.stage === 'won' ? 'Completed' : d.stage === 'proposal' ? 'In Progress' : 'Planning',
        deadline: d.close_date ? new Date(d.close_date).toLocaleDateString('en-GB') : '-',
        progress: d.stage === 'won' ? 100 : 50,
        budget: d.deal_value ? `₹${d.deal_value}` : '₹0',
      }))
    }
  } catch (err) {
    console.error("API error loading projects/deals:", err)
  }
  return []
}
