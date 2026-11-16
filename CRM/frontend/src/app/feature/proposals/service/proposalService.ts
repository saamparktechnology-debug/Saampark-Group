import {
  fetchModuleDataFromDB,
  filterGlobalDeletedItems,
  markGlobalItemDeleted,
  saveModuleDataToDB,
} from "@/lib/storageSync"
import { ProposalItem } from "../types"

export const proposalFeatureService = {
  async getAll(companyId: string): Promise<ProposalItem[]> {
    const data = await fetchModuleDataFromDB<ProposalItem[]>("proposals", [], companyId)
    return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
  },

  async saveAll(proposals: ProposalItem[], companyId: string): Promise<void> {
    await saveModuleDataToDB("proposals", proposals, companyId)
  },

  async markDeleted(id: string): Promise<void> {
    await markGlobalItemDeleted(id, "proposals")
  },
}
