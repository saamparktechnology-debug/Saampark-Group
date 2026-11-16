import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { productFeatureService } from "../service/productService"
import { ProductFormValues } from "../types"

export const PRODUCTS_QUERY_KEY = ["products"] as const
export const LOW_STOCK_PRODUCTS_QUERY_KEY = ["products", "low-stock"] as const

export function useProductsQuery(enabled = true) {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: productFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useLowStockProductsQuery(enabled = true) {
  return useQuery({
    queryKey: LOW_STOCK_PRODUCTS_QUERY_KEY,
    queryFn: productFeatureService.getLowStock,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: ProductFormValues }) => {
      return executeWithFeedback(
        async () => (id ? productFeatureService.update(id, values) : productFeatureService.create(values)),
        {
          actionType: id ? "update" : "create",
          successTitle: id ? "Product Updated" : "Product Created",
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    },
  })
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(() => productFeatureService.remove(id), {
        actionType: "delete",
        successTitle: "Product Deleted",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    },
  })
}
