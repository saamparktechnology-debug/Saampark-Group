import { BankAccountService } from "@/services/accountService"
import { BankAccount, BankAccountFormValues } from "../types"

export const bankAccountFeatureService = {
  async getAll(): Promise<BankAccount[]> {
    const data = await BankAccountService.getAll()
    return Array.isArray(data) ? data : []
  },

  async create(payload: BankAccountFormValues): Promise<BankAccount> {
    return BankAccountService.create(payload)
  },

  async update(id: string, payload: BankAccountFormValues): Promise<BankAccount> {
    return BankAccountService.update(id, payload)
  },

  async remove(id: string): Promise<void> {
    return BankAccountService.delete(id)
  },
}
