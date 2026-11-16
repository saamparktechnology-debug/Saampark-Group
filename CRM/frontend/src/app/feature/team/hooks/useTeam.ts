import { useQuery } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { getUsers } from "../../users/service/userService"

export const TEAM_MEMBERS_QUERY_KEY = ["team", "members"] as const

export function useTeamMembersQuery(enabled = true) {
  return useQuery({
    queryKey: TEAM_MEMBERS_QUERY_KEY,
    queryFn: () => getUsers("all"),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}
