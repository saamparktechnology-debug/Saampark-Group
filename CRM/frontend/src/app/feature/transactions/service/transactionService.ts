import { TransactionService } from "@/services/accountService"
import { Transaction, TransactionFormValues } from "../types"

export const transactionFeatureService = {
  async getAll(): Promise<Transaction[]> {
    const data = await TransactionService.getAll({})
    return Array.isArray(data) ? data : []
  },

  async create(payload: TransactionFormValues): Promise<Transaction> {
    return TransactionService.create(payload)
  },

  async remove(id: string): Promise<void> {
    return TransactionService.delete(id)
  },
}
