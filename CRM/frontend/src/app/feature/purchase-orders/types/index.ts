export interface LineItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  total: number
}

export interface PurchaseOrder {
  id: string
  number: string
  vendor: string
  date: string
  total: number
  status: string
  items?: LineItem[]
}

export interface PurchaseOrderFormValues {
  number: string
  vendor: string
  date: string
  status: string
}
