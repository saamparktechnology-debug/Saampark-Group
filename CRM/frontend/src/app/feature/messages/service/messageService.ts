import {
  fetchModuleDataFromDB,
  filterGlobalDeletedItems,
  markGlobalItemDeleted,
  saveModuleDataToDB,
} from "@/lib/storageSync"
import { ChatMessage } from "../types"

export const messageFeatureService = {
  async getAll(companyId: string): Promise<ChatMessage[]> {
    const data = await fetchModuleDataFromDB<ChatMessage[]>("chat_messages", [], companyId)
    return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
  },

  async saveAll(messages: ChatMessage[], companyId: string): Promise<void> {
    await saveModuleDataToDB("chat_messages", messages, companyId)
  },

  async markDeleted(id: string): Promise<void> {
    await markGlobalItemDeleted(id, "chat_messages")
  },
}
