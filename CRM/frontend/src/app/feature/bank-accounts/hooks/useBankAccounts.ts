import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { bankAccountFeatureService } from "../service/bankAccountService"
import { BankAccountFormValues } from "../types"

export const BANK_ACCOUNTS_QUERY_KEY = ["bank-accounts"] as const

export function useBankAccountsQuery(enabled = true) {
  return useQuery({
    queryKey: BANK_ACCOUNTS_QUERY_KEY,
    queryFn: bankAccountFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveBankAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: BankAccountFormValues }) => {
      return executeWithFeedback(
        async () => {
          if (id) {
            return bankAccountFeatureService.update(id, values)
          }
          return bankAccountFeatureService.create(values)
        },
        {
          actionType: id ? "update" : "create",
          successTitle: id ? "Account Updated" : "Account Created",
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_QUERY_KEY })
    },
  })
}

export function useDeleteBankAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(
        () => bankAccountFeatureService.remove(id),
        { actionType: "delete", successTitle: "Account Deleted" }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_QUERY_KEY })
    },
  })
}
