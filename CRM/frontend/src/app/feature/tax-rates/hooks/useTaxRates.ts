import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { taxRateFeatureService } from "../service/taxRateService"
import { TaxRateFormValues } from "../types"

export const TAX_RATES_QUERY_KEY = ["tax-rates"] as const

export function useTaxRatesQuery(enabled = true) {
  return useQuery({
    queryKey: TAX_RATES_QUERY_KEY,
    queryFn: taxRateFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveTaxRateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: TaxRateFormValues }) => {
      return executeWithFeedback(
        async () => {
          if (id) {
            return taxRateFeatureService.update(id, values)
          }
          return taxRateFeatureService.create(values)
        },
        {
          actionType: id ? "update" : "create",
          successTitle: id ? "Tax Rate Updated" : "Tax Rate Created",
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_RATES_QUERY_KEY })
    },
  })
}

export function useDeleteTaxRateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(
        () => taxRateFeatureService.remove(id),
        { actionType: "delete", successTitle: "Tax Rate Deleted" }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_RATES_QUERY_KEY })
    },
  })
}
