import { api, unwrapList } from '@/lib/api'

export const QuotationService = {
  getAll: async (params?: any) => { 
    const q = new URLSearchParams(params || {}).toString()
    const res = await api.get(`/sales/quotations?${q}`)
    return unwrapList(res)
  },
  getById: async (id: string) => api.get(`/sales/quotations/${id}`),
  create: async (data: any) => api.post('/sales/quotations', data),
  update: async (id: string, data: any) => api.put(`/sales/quotations/${id}`, data),
  delete: async (id: string) => api.delete(`/sales/quotations/${id}`),
  convertToInvoice: async (id: string) => api.post(`/sales/quotations/${id}/convert-to-invoice`),
}

export const EstimateService = {
  getAll: async (params?: any) => { 
    const q = new URLSearchParams(params || {}).toString()
    const res = await api.get(`/sales/estimates?${q}`)
    return unwrapList(res)
  },
  getById: async (id: string) => api.get(`/sales/estimates/${id}`),
  create: async (data: any) => api.post('/sales/estimates', data),
  update: async (id: string, data: any) => api.put(`/sales/estimates/${id}`, data),
  delete: async (id: string) => api.delete(`/sales/estimates/${id}`),
}

export const SalesOrderService = {
  getAll: async (params?: any) => { 
    const q = new URLSearchParams(params || {}).toString()
    const res = await api.get(`/sales/sales-orders?${q}`)
    return unwrapList(res)
  },
  getById: async (id: string) => api.get(`/sales/sales-orders/${id}`),
  create: async (data: any) => api.post('/sales/sales-orders', data),
  update: async (id: string, data: any) => api.put(`/sales/sales-orders/${id}`, data),
  delete: async (id: string) => api.delete(`/sales/sales-orders/${id}`),
}

export const PaymentService = {
  getAll: async (params?: any) => { 
    const q = new URLSearchParams(params || {}).toString()
    const res = await api.get(`/sales/payments?${q}`)
    return unwrapList(res)
  },
  getById: async (id: string) => api.get(`/sales/payments/${id}`),
  create: async (data: any) => api.post('/sales/payments', data),
  delete: async (id: string) => api.delete(`/sales/payments/${id}`),
}

export const CreditNoteService = {
  getAll: async () => {
    const res = await api.get('/sales/credit-notes')
    return unwrapList(res)
  },
  create: async (data: any) => api.post('/sales/credit-notes', data),
  update: async (id: string, data: any) => api.put(`/sales/credit-notes/${id}`, data),
}

export const DebitNoteService = {
  getAll: async () => {
    const res = await api.get('/sales/debit-notes')
    return unwrapList(res)
  },
  create: async (data: any) => api.post('/sales/debit-notes', data),
  update: async (id: string, data: any) => api.put(`/sales/debit-notes/${id}`, data),
}
