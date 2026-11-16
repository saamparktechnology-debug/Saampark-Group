import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { expenseFeatureService } from "../service/expenseService"

export const expensesQueryKey = (companyId: string) => ["expenses", companyId] as const

export function useExpensesQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: expensesQueryKey(companyId),
    queryFn: () => expenseFeatureService.getAll(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidateExpenses(companyId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: expensesQueryKey(companyId) })
}
