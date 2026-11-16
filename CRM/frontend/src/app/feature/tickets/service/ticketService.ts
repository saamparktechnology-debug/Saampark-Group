import {
  fetchModuleDataFromDB,
  filterGlobalDeletedItems,
  markGlobalItemDeleted,
  saveModuleDataToDB,
} from "@/lib/storageSync"
import { DisputeTicket } from "../types"

export const ticketFeatureService = {
  async getAll(companyId: string): Promise<DisputeTicket[]> {
    const data = await fetchModuleDataFromDB<DisputeTicket[]>("tickets", [], companyId)
    return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
  },

  async saveAll(tickets: DisputeTicket[], companyId: string): Promise<void> {
    await saveModuleDataToDB("tickets", tickets, companyId)
  },

  async markDeleted(id: string): Promise<void> {
    await markGlobalItemDeleted(id, "tickets")
  },
}
