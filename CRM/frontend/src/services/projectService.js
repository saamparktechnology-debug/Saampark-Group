import { api } from '@/lib/api'

export const ProjectService = {
  getAll: async (params) => { const q = new URLSearchParams(params).toString(); return api.get(`/projects?${q}`) },
  getById: async (id) => api.get(`/projects/${id}`),
  create: async (data) => api.post('/projects', data),
  update: async (id, data) => api.put(`/projects/${id}`, data),
  delete: async (id) => api.delete(`/projects/${id}`),
}

export const MilestoneService = {
  getByProject: async (projectId) => api.get(`/projects/milestones/${projectId}`),
  create: async (data) => api.post('/projects/milestones', data),
  update: async (id, data) => api.put(`/projects/milestones/${id}`, data),
  delete: async (id) => api.delete(`/projects/milestones/${id}`),
}

export const SubtaskService = {
  getByTask: async (taskId) => api.get(`/projects/subtasks/${taskId}`),
  create: async (data) => api.post('/projects/subtasks', data),
  update: async (id, data) => api.put(`/projects/subtasks/${id}`, data),
  delete: async (id) => api.delete(`/projects/subtasks/${id}`),
}

export const TimesheetService = {
  getAll: async (params) => { const q = new URLSearchParams(params).toString(); return api.get(`/projects/timesheets?${q}`) },
  create: async (data) => api.post('/projects/timesheets', data),
  approve: async (id) => api.put(`/projects/timesheets/${id}/approve`),
  delete: async (id) => api.delete(`/projects/timesheets/${id}`),
}
