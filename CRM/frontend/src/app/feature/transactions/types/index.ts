export interface Transaction {
  id: string
  number: string
  type: string
  category: string
  amount: number
  date: string
  method: string
  notes?: string
}

export interface TransactionFormValues {
  number: string
  type: string
  category: string
  amount: number
  date: string
  method: string
  notes: string
}
