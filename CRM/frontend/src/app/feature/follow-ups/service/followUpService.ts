import { FollowUpService } from "@/services/crmCoreService"
import { FollowUp, FollowUpFormValues } from "../types"

export const followUpFeatureService = {
  async getAll(): Promise<FollowUp[]> {
    const data = await FollowUpService.getAll({})
    return Array.isArray(data) ? data : []
  },

  async create(payload: FollowUpFormValues): Promise<FollowUp> {
    return FollowUpService.create(payload)
  },

  async update(id: string, payload: FollowUpFormValues): Promise<FollowUp> {
    return FollowUpService.update(id, payload)
  },

  async remove(id: string): Promise<void> {
    return FollowUpService.delete(id)
  },
}
