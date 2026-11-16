import { ProductService } from "@/services/inventoryService"
import { Product, ProductFormValues } from "../types"

export const productFeatureService = {
  async getAll(): Promise<Product[]> {
    const data = await ProductService.getAll({})
    return Array.isArray(data) ? data : []
  },

  async getLowStock(): Promise<Product[]> {
    const data = await ProductService.getLowStock()
    return Array.isArray(data) ? data : []
  },

  async create(payload: ProductFormValues): Promise<Product> {
    return ProductService.create(payload)
  },

  async update(id: string, payload: ProductFormValues): Promise<Product> {
    return ProductService.update(id, payload)
  },

  async remove(id: string): Promise<void> {
    return ProductService.delete(id)
  },
}
