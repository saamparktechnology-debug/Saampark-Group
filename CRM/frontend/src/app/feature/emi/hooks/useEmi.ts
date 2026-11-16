import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { getInstallments } from "../service/emiService"

export const emiQueryKey = (companyId: string) => ["emi", companyId] as const

export function useEmiInstallmentsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: emiQueryKey(companyId),
    queryFn: () => getInstallments(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidateEmi(companyId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: emiQueryKey(companyId) })
}
