import { PurchaseOrderService } from "@/services/purchaseService"
import { LineItem, PurchaseOrder, PurchaseOrderFormValues } from "../types"

export interface PurchaseOrderPayload extends PurchaseOrderFormValues {
  items: LineItem[]
  subtotal: number
  tax: number
  total: number
  companyId?: string | null
}

export const purchaseOrderFeatureService = {
  async getAll(): Promise<PurchaseOrder[]> {
    const data = await PurchaseOrderService.getAll({})
    return Array.isArray(data) ? data : []
  },

  async create(payload: PurchaseOrderPayload): Promise<PurchaseOrder> {
    return PurchaseOrderService.create(payload)
  },

  async update(id: string, payload: PurchaseOrderPayload): Promise<PurchaseOrder> {
    return PurchaseOrderService.update(id, payload)
  },

  async remove(id: string): Promise<void> {
    return PurchaseOrderService.delete(id)
  },
}
