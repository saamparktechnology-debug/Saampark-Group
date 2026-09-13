import { api, unwrapList } from '@/lib/api'

export const OrgService = {
  getDepartments: async () => {
    const res = await api.get('/org/departments')
    return unwrapList(res)
  },
  createDepartment: async (data) => api.post('/org/departments', data),
  updateDepartment: async (id, data) => api.put(`/org/departments/${id}`, data),
  deleteDepartment: async (id) => api.delete(`/org/departments/${id}`),

  getDesignations: async () => {
    const res = await api.get('/org/designations')
    return unwrapList(res)
  },
  createDesignation: async (data) => api.post('/org/designations', data),
  updateDesignation: async (id, data) => api.put(`/org/designations/${id}`, data),
  deleteDesignation: async (id) => api.delete(`/org/designations/${id}`),

  getTeams: async () => {
    const res = await api.get('/org/teams')
    return unwrapList(res)
  },
  getTeam: async (id) => api.get(`/org/teams/${id}`),
  createTeam: async (data) => api.post('/org/teams', data),
  updateTeam: async (id, data) => api.put(`/org/teams/${id}`, data),
  deleteTeam: async (id) => api.delete(`/org/teams/${id}`),
  addTeamMember: async (teamId, userId, role) => api.post(`/org/teams/${teamId}/members`, { user_id: userId, role }),
  removeTeamMember: async (teamId, memberId) => api.delete(`/org/teams/${teamId}/members/${memberId}`),
}
