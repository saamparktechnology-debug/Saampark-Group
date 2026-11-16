import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { activityLogFeatureService } from "../service/activityLogService"

export const activityLogsQueryKey = (companyId: string) => ["activity-logs", companyId] as const

export function useActivityLogsQuery(companyId: string, enabled = true) {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    const handleLogged = () => {
      queryClient.invalidateQueries({ queryKey: activityLogsQueryKey(companyId) })
    }
    window.addEventListener("saampark_activity_logged", handleLogged)
    return () => {
      window.removeEventListener("saampark_activity_logged", handleLogged)
    }
  }, [companyId, queryClient])

  return useQuery({
    queryKey: activityLogsQueryKey(companyId),
    queryFn: () => activityLogFeatureService.getAll(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useClearActivityLogsMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: activityLogFeatureService.clearAll,
    onSuccess: () => {
      queryClient.setQueryData(activityLogsQueryKey(companyId), [])
    },
  })
}
