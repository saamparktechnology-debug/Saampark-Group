import { api, unwrapList } from '@/lib/api'

export const EnquiryService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/crm/enquiries?${q}`)
    return unwrapList(res)
  },
  getById: async (id) => api.get(`/crm/enquiries/${id}`),
  create: async (data) => api.post('/crm/enquiries', data),
  update: async (id, data) => api.put(`/crm/enquiries/${id}`, data),
  delete: async (id) => api.delete(`/crm/enquiries/${id}`),
}

export const FollowUpService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/crm/follow-ups?${q}`)
    return unwrapList(res)
  },
  getById: async (id) => api.get(`/crm/follow-ups/${id}`),
  create: async (data) => api.post('/crm/follow-ups', data),
  update: async (id, data) => api.put(`/crm/follow-ups/${id}`, data),
  delete: async (id) => api.delete(`/crm/follow-ups/${id}`),
}

export const CallService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/crm/calls?${q}`)
    return unwrapList(res)
  },
  create: async (data) => api.post('/crm/calls', data),
  delete: async (id) => api.delete(`/crm/calls/${id}`),
}

export const MeetingService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/crm/meetings?${q}`)
    return unwrapList(res)
  },
  getById: async (id) => api.get(`/crm/meetings/${id}`),
  create: async (data) => api.post('/crm/meetings', data),
  update: async (id, data) => api.put(`/crm/meetings/${id}`, data),
  delete: async (id) => api.delete(`/crm/meetings/${id}`),
}

export const NoteService = {
  getByModule: async (moduleType, moduleId) => api.get(`/crm/notes/${moduleType}/${moduleId}`),
  create: async (data) => api.post('/crm/notes', data),
  update: async (id, data) => api.put(`/crm/notes/${id}`, data),
  delete: async (id) => api.delete(`/crm/notes/${id}`),
}

export const ActivityService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/crm/activities?${q}`)
    return unwrapList(res)
  },
  getByModule: async (moduleType, moduleId) => api.get(`/crm/activities/${moduleType}/${moduleId}`),
  create: async (data) => api.post('/crm/activities', data),
}
