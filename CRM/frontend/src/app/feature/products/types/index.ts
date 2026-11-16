export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  status: string
  description?: string
}

export interface ProductFormValues {
  name: string
  sku: string
  category: string
  price: number
  stock: number
  status: string
  description: string
}
