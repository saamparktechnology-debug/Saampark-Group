import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { transactionFeatureService } from "../service/transactionService"
import { TransactionFormValues } from "../types"

export const TRANSACTIONS_QUERY_KEY = ["transactions"] as const

export function useTransactionsQuery(enabled = true) {
  return useQuery({
    queryKey: TRANSACTIONS_QUERY_KEY,
    queryFn: transactionFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      return executeWithFeedback(() => transactionFeatureService.create(values), {
        actionType: "create",
        successTitle: "Transaction Created",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
    },
  })
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(() => transactionFeatureService.remove(id), {
        actionType: "delete",
        successTitle: "Transaction Deleted",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
    },
  })
}
