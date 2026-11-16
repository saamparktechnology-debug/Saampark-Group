import { QuotationService } from "@/services/salesService"

export const quotationFeatureService = {
  async getAll(companyId: string) {
    const data = await QuotationService.getAll({ companyId })
    return Array.isArray(data) ? data : []
  },
}
