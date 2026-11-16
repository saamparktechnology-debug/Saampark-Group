import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { leaveFeatureService } from "../service/leaveService"

export const LEAVE_REQUESTS_QUERY_KEY = ["leave-requests"] as const
export const LEAVE_TYPES_QUERY_KEY = ["leave-types"] as const
export const LEAVE_TEAM_MEMBERS_QUERY_KEY = ["leave-team-members"] as const

export function useLeaveRequestsQuery(todayStr: string, enabled = true) {
  return useQuery({
    queryKey: LEAVE_REQUESTS_QUERY_KEY,
    queryFn: () => leaveFeatureService.getRequests(todayStr),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useLeaveTypesQuery(enabled = true) {
  return useQuery({
    queryKey: LEAVE_TYPES_QUERY_KEY,
    queryFn: leaveFeatureService.getTypes,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useLeaveTeamMembersQuery(enabled = true) {
  return useQuery({
    queryKey: LEAVE_TEAM_MEMBERS_QUERY_KEY,
    queryFn: leaveFeatureService.getTeamMembers,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidateLeaveQueries() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: LEAVE_REQUESTS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: LEAVE_TYPES_QUERY_KEY })
  }
}
