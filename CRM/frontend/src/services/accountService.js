import { api, unwrapList } from '@/lib/api'

function getCompanyId() {
  if (typeof window === 'undefined') return 'tech'
  try {
    const { useAuthStore } = require('@/store/useAuthStore')
    return useAuthStore.getState().activeCompanyId || useAuthStore.getState().user?.companyId || 'tech'
  } catch { return 'tech' }
}

export const TransactionService = {
  getAll: async (params = {}) => {
    const q = new URLSearchParams({ ...params, company_id: params.company_id || getCompanyId() }).toString()
    const res = await api.get(`/accounts/transactions?${q}`)
    return unwrapList(res)
  },
  getById: async (id) => api.get(`/accounts/transactions/${id}`),
  create: async (data) => api.post('/accounts/transactions', { ...data, company_id: data.company_id || getCompanyId() }),
  delete: async (id) => api.delete(`/accounts/transactions/${id}`),
  getSummary: async (params = {}) => {
    const q = new URLSearchParams({ ...params, company_id: params.company_id || getCompanyId() }).toString()
    return api.get(`/accounts/transactions/summary?${q}`)
  },
}

export const BankAccountService = {
  getAll: async () => {
    const res = await api.get(`/accounts/bank-accounts?company_id=${getCompanyId()}`)
    return unwrapList(res)
  },
  getById: async (id) => api.get(`/accounts/bank-accounts/${id}`),
  create: async (data) => api.post('/accounts/bank-accounts', { ...data, company_id: data.company_id || getCompanyId() }),
  update: async (id, data) => api.put(`/accounts/bank-accounts/${id}`, data),
  delete: async (id) => api.delete(`/accounts/bank-accounts/${id}`),
}

export const CategoryService = {
  getAll: async (type) => {
    const res = await api.get(`/accounts/categories?company_id=${getCompanyId()}${type ? `&type=${type}` : ''}`)
    return unwrapList(res)
  },
  create: async (data) => api.post('/accounts/categories', { ...data, company_id: data.company_id || getCompanyId() }),
  update: async (id, data) => api.put(`/accounts/categories/${id}`, data),
  delete: async (id) => api.delete(`/accounts/categories/${id}`),
}

export const TaxRateService = {
  getAll: async () => {
    const res = await api.get(`/accounts/tax-rates?company_id=${getCompanyId()}`)
    return unwrapList(res)
  },
  create: async (data) => api.post('/accounts/tax-rates', { ...data, company_id: data.company_id || getCompanyId() }),
  update: async (id, data) => api.put(`/accounts/tax-rates/${id}`, data),
  delete: async (id) => api.delete(`/accounts/tax-rates/${id}`),
}
