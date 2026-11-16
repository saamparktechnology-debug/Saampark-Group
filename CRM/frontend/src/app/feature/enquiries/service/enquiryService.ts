import { EnquiryService } from "@/services/crmCoreService"
import { Enquiry, EnquiryFormValues } from "../types"

export const enquiryFeatureService = {
  async getAll(): Promise<Enquiry[]> {
    const data = await EnquiryService.getAll({})
    return Array.isArray(data) ? data : []
  },

  async create(payload: EnquiryFormValues): Promise<Enquiry> {
    return EnquiryService.create(payload)
  },

  async update(id: string, payload: EnquiryFormValues): Promise<Enquiry> {
    return EnquiryService.update(id, payload)
  },

  async remove(id: string): Promise<void> {
    return EnquiryService.delete(id)
  },
}
