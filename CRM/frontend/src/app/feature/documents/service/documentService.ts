import { DocumentService } from "@/services/supportService"
import { DocumentFormValues, DocumentItem } from "../types"

export const documentFeatureService = {
  async getAll(): Promise<DocumentItem[]> {
    const data = await DocumentService.getAll({})
    return Array.isArray(data) ? data : []
  },

  async getExpiring(days = 30): Promise<DocumentItem[]> {
    const data = await DocumentService.getExpiring(days)
    return Array.isArray(data) ? data : []
  },

  async create(payload: DocumentFormValues): Promise<DocumentItem> {
    return DocumentService.create(payload)
  },

  async remove(id: string): Promise<void> {
    return DocumentService.delete(id)
  },
}
