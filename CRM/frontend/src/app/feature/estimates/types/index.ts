export interface EstimateLineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface EstimateRecord {
  id: string
  estimateNumber: string
  clientName: string
  clientEmail?: string
  issueDate: string
  expiryDate?: string
  total: number
  status: string
  items?: EstimateLineItem[]
}
