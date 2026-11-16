import { TaxRateService } from "@/services/accountService"
import { TaxRate, TaxRateFormValues } from "../types"

export const taxRateFeatureService = {
  async getAll(): Promise<TaxRate[]> {
    const data = await TaxRateService.getAll()
    return Array.isArray(data) ? data : []
  },

  async create(payload: TaxRateFormValues): Promise<TaxRate> {
    return TaxRateService.create(payload)
  },

  async update(id: string, payload: TaxRateFormValues): Promise<TaxRate> {
    return TaxRateService.update(id, payload)
  },

  async remove(id: string): Promise<void> {
    return TaxRateService.delete(id)
  },
}
