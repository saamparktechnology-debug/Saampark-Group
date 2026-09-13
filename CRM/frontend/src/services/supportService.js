import { api, unwrapList } from '@/lib/api'

export const KnowledgeBaseService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/support/kb?${q}`)
    return unwrapList(res)
  },
  getById: async (id) => api.get(`/support/kb/${id}`),
  create: async (data) => api.post('/support/kb', data),
  update: async (id, data) => api.put(`/support/kb/${id}`, data),
  delete: async (id) => api.delete(`/support/kb/${id}`),
}

export const DocumentService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/support/documents?${q}`)
    return unwrapList(res)
  },
  create: async (data) => api.post('/support/documents', data),
  delete: async (id) => api.delete(`/support/documents/${id}`),
  getExpiring: async (days) => {
    const res = await api.get(`/support/documents/expiring?days=${days || 30}`)
    return unwrapList(res)
  },
}

export const EmailTemplateService = {
  getAll: async () => {
    const res = await api.get('/support/templates')
    return unwrapList(res)
  },
  create: async (data) => api.post('/support/templates', data),
  update: async (id, data) => api.put(`/support/templates/${id}`, data),
  delete: async (id) => api.delete(`/support/templates/${id}`),
}

export const NotificationService = {
  getAll: async () => {
    const res = await api.get('/support/notifications')
    return unwrapList(res)
  },
  markRead: async (id) => api.put(`/support/notifications/${id}/read`),
  markAllRead: async () => api.put('/support/notifications/read-all'),
}

export const SlaService = {
  getAll: async () => {
    const res = await api.get('/support/sla')
    return unwrapList(res)
  },
  create: async (data) => api.post('/support/sla', data),
  update: async (id, data) => api.put(`/support/sla/${id}`, data),
  delete: async (id) => api.delete(`/support/sla/${id}`),
}
