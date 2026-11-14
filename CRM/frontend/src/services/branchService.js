import { api } from '@/lib/api'

export const BranchService = {
  getAll: async (companyId) => api.get(`/branches?company_id=${companyId || ''}`),
  getById: async (id) => api.get(`/branches/${id}`),
  create: async (data) => api.post('/branches', data),
  update: async (id, data) => api.put(`/branches/${id}`, data),
  delete: async (id) => api.delete(`/branches/${id}`),
  getStats: async () => api.get('/branches/stats'),
  getSubBranches: async (branchId) => api.get(`/branches/sub-branches/all${branchId ? `?branch_id=${branchId}` : ''}`),
  createSubBranch: async (data) => api.post('/branches/sub-branches', data),
  updateSubBranch: async (id, data) => api.put(`/branches/sub-branches/${id}`, data),
  deleteSubBranch: async (id) => api.delete(`/branches/sub-branches/${id}`),
}
