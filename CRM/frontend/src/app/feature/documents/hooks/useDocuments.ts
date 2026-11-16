import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { documentFeatureService } from "../service/documentService"
import { DocumentFormValues } from "../types"

export const DOCUMENTS_QUERY_KEY = ["documents"] as const
export const EXPIRING_DOCUMENTS_QUERY_KEY = ["documents", "expiring", 30] as const

export function useDocumentsQuery(enabled = true) {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: documentFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useExpiringDocumentsQuery(enabled = true) {
  return useQuery({
    queryKey: EXPIRING_DOCUMENTS_QUERY_KEY,
    queryFn: () => documentFeatureService.getExpiring(30),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useCreateDocumentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: DocumentFormValues) => {
      return executeWithFeedback(() => documentFeatureService.create(values), {
        actionType: "create",
        successTitle: "Document Uploaded",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY })
    },
  })
}

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(() => documentFeatureService.remove(id), {
        actionType: "delete",
        successTitle: "Document Deleted",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY })
    },
  })
}
