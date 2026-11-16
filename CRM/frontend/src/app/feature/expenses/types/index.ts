export interface ProjectExtraCharge {
  id: string
  projectId: string
  title: string
  amount: number
  category: string
  date: string
  payee?: string
  vendor?: string
  notes?: string
}

export interface ExpenseItem {
  id: string
  expenseNumber: string
  title: string
  category: string
  amount: number
  date: string
  paymentMethod?: string
  status?: string
  projectId?: string
  vendor?: string
  notes?: string
  companyId?: string
}
