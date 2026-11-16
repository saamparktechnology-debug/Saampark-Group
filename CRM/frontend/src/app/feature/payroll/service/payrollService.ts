import { PayrollService } from "@/services/hrService"
import { PayrollItem } from "../types"

export const payrollFeatureService = {
  async getAll(): Promise<PayrollItem[]> {
    const data = await PayrollService.getAll({})
    return Array.isArray(data) ? data : []
  },
}
