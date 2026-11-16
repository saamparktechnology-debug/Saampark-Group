import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import {
  purchaseOrderFeatureService,
  PurchaseOrderPayload,
} from "../service/purchaseOrderService"

export const PURCHASE_ORDERS_QUERY_KEY = ["purchase-orders"] as const

export function usePurchaseOrdersQuery(enabled = true) {
  return useQuery({
    queryKey: PURCHASE_ORDERS_QUERY_KEY,
    queryFn: purchaseOrderFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSavePurchaseOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: PurchaseOrderPayload }) => {
      return executeWithFeedback(
        async () => (id ? purchaseOrderFeatureService.update(id, payload) : purchaseOrderFeatureService.create(payload)),
        {
          actionType: id ? "update" : "create",
          successTitle: id ? "PO Updated" : "PO Created",
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_QUERY_KEY })
    },
  })
}

export function useDeletePurchaseOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(() => purchaseOrderFeatureService.remove(id), {
        actionType: "delete",
        successTitle: "PO Deleted",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_QUERY_KEY })
    },
  })
}
