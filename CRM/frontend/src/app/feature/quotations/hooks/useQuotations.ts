import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { quotationFeatureService } from "../service/quotationService"

export const quotationsQueryKey = (companyId: string) => ["quotations", companyId] as const

export function useQuotationsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: quotationsQueryKey(companyId),
    queryFn: () => quotationFeatureService.getAll(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidateQuotations(companyId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: quotationsQueryKey(companyId) })
}
