import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { followUpFeatureService } from "../service/followUpService"
import { FollowUpFormValues } from "../types"

export const FOLLOW_UPS_QUERY_KEY = ["follow-ups"] as const

export function useFollowUpsQuery(enabled = true) {
  return useQuery({
    queryKey: FOLLOW_UPS_QUERY_KEY,
    queryFn: followUpFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveFollowUpMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: FollowUpFormValues }) => {
      return executeWithFeedback(
        async () => (id ? followUpFeatureService.update(id, values) : followUpFeatureService.create(values)),
        {
          actionType: id ? "update" : "create",
          successTitle: id ? "Follow-up Updated" : "Follow-up Created",
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLLOW_UPS_QUERY_KEY })
    },
  })
}

export function useDeleteFollowUpMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(() => followUpFeatureService.remove(id), {
        actionType: "delete",
        successTitle: "Follow-up Deleted",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLLOW_UPS_QUERY_KEY })
    },
  })
}
