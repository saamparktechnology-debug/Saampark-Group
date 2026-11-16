import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { knowledgeBaseFeatureService } from "../service/knowledgeBaseService"
import { KnowledgeArticleFormValues } from "../types"

export const KNOWLEDGE_BASE_QUERY_KEY = ["knowledge-base"] as const

export function useKnowledgeBaseQuery(enabled = true) {
  return useQuery({
    queryKey: KNOWLEDGE_BASE_QUERY_KEY,
    queryFn: knowledgeBaseFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveKnowledgeArticleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: KnowledgeArticleFormValues }) => {
      return executeWithFeedback(
        async () => (id ? knowledgeBaseFeatureService.update(id, values) : knowledgeBaseFeatureService.create(values)),
        {
          actionType: id ? "update" : "create",
          successTitle: id ? "Article Updated" : "Article Created",
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_BASE_QUERY_KEY })
    },
  })
}

export function useDeleteKnowledgeArticleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(() => knowledgeBaseFeatureService.remove(id), {
        actionType: "delete",
        successTitle: "Article Deleted",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_BASE_QUERY_KEY })
    },
  })
}
