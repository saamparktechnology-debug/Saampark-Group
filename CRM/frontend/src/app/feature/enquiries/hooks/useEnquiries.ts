import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { enquiryFeatureService } from "../service/enquiryService"
import { EnquiryFormValues } from "../types"

export const ENQUIRIES_QUERY_KEY = ["enquiries"] as const

export function useEnquiriesQuery(enabled = true) {
  return useQuery({
    queryKey: ENQUIRIES_QUERY_KEY,
    queryFn: enquiryFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveEnquiryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: EnquiryFormValues }) => {
      return executeWithFeedback(
        async () => (id ? enquiryFeatureService.update(id, values) : enquiryFeatureService.create(values)),
        {
          actionType: id ? "update" : "create",
          successTitle: id ? "Enquiry Updated" : "Enquiry Created",
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENQUIRIES_QUERY_KEY })
    },
  })
}

export function useDeleteEnquiryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(() => enquiryFeatureService.remove(id), {
        actionType: "delete",
        successTitle: "Enquiry Deleted",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENQUIRIES_QUERY_KEY })
    },
  })
}
