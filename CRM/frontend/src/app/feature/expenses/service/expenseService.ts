import {
  fetchModuleDataFromDB,
  filterGlobalDeletedItems,
  markGlobalItemDeleted,
  saveModuleDataToDB,
} from "@/lib/storageSync"
import { ExpenseItem } from "../types"

export const expenseFeatureService = {
  async getAll(companyId: string): Promise<ExpenseItem[]> {
    const data = await fetchModuleDataFromDB<ExpenseItem[]>("expenses", [], companyId)
    return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
  },

  async saveAll(expenses: ExpenseItem[], companyId: string): Promise<void> {
    await saveModuleDataToDB("expenses", expenses, companyId)
  },

  async markDeleted(id: string): Promise<void> {
    await markGlobalItemDeleted(id, "expenses")
  },
}
