import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { getSubscriptions } from "../service/subscriptionService"

export const subscriptionsQueryKey = (companyId: string) => ["subscriptions", companyId] as const

export function useSubscriptionsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: subscriptionsQueryKey(companyId),
    queryFn: () => getSubscriptions(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidateSubscriptions(companyId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey(companyId) })
}
