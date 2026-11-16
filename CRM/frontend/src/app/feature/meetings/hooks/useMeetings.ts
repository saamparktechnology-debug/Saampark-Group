import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { meetingFeatureService } from "../service/meetingService"
import { MeetingFormValues } from "../types"

export const MEETINGS_QUERY_KEY = ["meetings"] as const

export function useMeetingsQuery(enabled = true) {
  return useQuery({
    queryKey: MEETINGS_QUERY_KEY,
    queryFn: meetingFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveMeetingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: MeetingFormValues }) => {
      return executeWithFeedback(
        async () => (id ? meetingFeatureService.update(id, values) : meetingFeatureService.create(values)),
        {
          actionType: id ? "update" : "create",
          successTitle: id ? "Meeting Updated" : "Meeting Created",
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY })
    },
  })
}

export function useDeleteMeetingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(() => meetingFeatureService.remove(id), {
        actionType: "delete",
        successTitle: "Meeting Deleted",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY })
    },
  })
}
