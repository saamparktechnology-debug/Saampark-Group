import { api, unwrapList } from '@/lib/api'

export interface ExpenseItem {
  id: string
  expenseNumber: string
  title: string
  amount: string
  amountNum: number
  category: string
  date: string
  member: string
  receiptUrl?: string
  status: "Approved" | "Pending" | "Rejected"
  notes?: string
  projectId?: string
  projectName?: string
  isProjectExpense?: boolean
  assignedMemberId?: string
  isExtraCharge?: boolean
  extraChargeCategory?: string
  companyId?: string
}

export const ExpenseService = {
  getAll: async (params: Record<string, any> = {}): Promise<ExpenseItem[]> => {
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/expenses${q ? `?${q}` : ''}`)
    return unwrapList<ExpenseItem>(res)
  },

  getById: async (id: string): Promise<ExpenseItem | null> => {
    const res = await api.get(`/expenses/${id}`)
    return res?.data ?? res ?? null
  },

  create: async (data: Partial<ExpenseItem> & Record<string, any>): Promise<any> => {
    return api.post('/expenses', data)
  },

  update: async (id: string, data: Partial<ExpenseItem> & Record<string, any>): Promise<any> => {
    return api.put(`/expenses/${id}`, data)
  },

  updateStatus: async (id: string, status: "Approved" | "Pending" | "Rejected"): Promise<any> => {
    return api.patch(`/expenses/${id}/status`, { status })
  },

  delete: async (id: string): Promise<any> => {
    return api.delete(`/expenses/${id}`)
  },

  getStats: async (companyId?: string): Promise<any> => {
    const res = await api.get(`/expenses/stats${companyId ? `?company_id=${companyId}` : ''}`)
    return res?.data ?? res ?? {}
  },
}
