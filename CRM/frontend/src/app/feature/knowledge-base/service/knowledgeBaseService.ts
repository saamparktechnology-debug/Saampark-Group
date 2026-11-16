import { KnowledgeBaseService } from "@/services/supportService"
import { KnowledgeArticle, KnowledgeArticleFormValues } from "../types"

export const knowledgeBaseFeatureService = {
  async getAll(): Promise<KnowledgeArticle[]> {
    const data = await KnowledgeBaseService.getAll({})
    return Array.isArray(data) ? data : []
  },

  async create(payload: KnowledgeArticleFormValues): Promise<KnowledgeArticle> {
    return KnowledgeBaseService.create(payload)
  },

  async update(id: string, payload: KnowledgeArticleFormValues): Promise<KnowledgeArticle> {
    return KnowledgeBaseService.update(id, payload)
  },

  async remove(id: string): Promise<void> {
    return KnowledgeBaseService.delete(id)
  },
}
