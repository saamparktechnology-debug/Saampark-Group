import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { getCompanyPaymentSettings } from "../service/companyPaymentService"

export const settingsPaymentQueryKey = (companyId: string) =>
  ["settings", "payment", companyId] as const

export function useCompanyPaymentSettingsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: settingsPaymentQueryKey(companyId),
    queryFn: () => getCompanyPaymentSettings(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidateSettingsPayment(companyId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: settingsPaymentQueryKey(companyId) })
}
