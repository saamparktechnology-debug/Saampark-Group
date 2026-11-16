import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { teamFeatureService } from "../service/teamService"
import { TeamFormValues } from "../types"

export const TEAMS_QUERY_KEY = ["teams"] as const

export function useTeamsQuery(enabled = true) {
  return useQuery({
    queryKey: TEAMS_QUERY_KEY,
    queryFn: teamFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveTeamMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: TeamFormValues }) => {
      return executeWithFeedback(
        async () => (id ? teamFeatureService.update(id, values) : teamFeatureService.create(values)),
        {
          actionType: id ? "update" : "create",
          successTitle: id ? "Team Updated" : "Team Created",
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY })
    },
  })
}

export function useDeleteTeamMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(() => teamFeatureService.remove(id), {
        actionType: "delete",
        successTitle: "Team Deleted",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY })
    },
  })
}

export function useRemoveTeamMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      return executeWithFeedback(() => teamFeatureService.removeMember(teamId, userId), {
        actionType: "delete",
        successTitle: "Member Removed",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY })
    },
  })
}
