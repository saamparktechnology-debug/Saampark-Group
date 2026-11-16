import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { EstimateService } from "@/services/salesService"

export const estimatesQueryKey = (companyId: string) => ["estimates", companyId] as const

export function useEstimatesQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: estimatesQueryKey(companyId),
    queryFn: () => EstimateService.getAll({ companyId }),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidateEstimates(companyId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: estimatesQueryKey(companyId) })
}
