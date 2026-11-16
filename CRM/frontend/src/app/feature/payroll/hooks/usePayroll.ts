import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { payrollFeatureService } from "../service/payrollService"

export const PAYROLL_QUERY_KEY = ["payroll"] as const

export function usePayrollQuery(enabled = true) {
  return useQuery({
    queryKey: PAYROLL_QUERY_KEY,
    queryFn: payrollFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidatePayroll() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEY })
}
