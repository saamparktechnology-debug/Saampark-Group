import { api, unwrapList } from '@/lib/api'

export const PurchaseOrderService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/purchase/orders?${q}`)
    return unwrapList(res)
  },
  getById: async (id) => api.get(`/purchase/orders/${id}`),
  create: async (data) => api.post('/purchase/orders', data),
  update: async (id, data) => api.put(`/purchase/orders/${id}`, data),
  delete: async (id) => api.delete(`/purchase/orders/${id}`),
}

export const PurchaseInvoiceService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/purchase/invoices?${q}`)
    return unwrapList(res)
  },
  getById: async (id) => api.get(`/purchase/invoices/${id}`),
  create: async (data) => api.post('/purchase/invoices', data),
  update: async (id, data) => api.put(`/purchase/invoices/${id}`, data),
  delete: async (id) => api.delete(`/purchase/invoices/${id}`),
}

export const PurchaseReturnService = {
  getAll: async () => {
    const res = await api.get('/purchase/returns')
    return unwrapList(res)
  },
  create: async (data) => api.post('/purchase/returns', data),
}
