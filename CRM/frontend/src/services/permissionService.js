import { api } from '@/lib/api'

export const PermissionService = {
  getAll: async () => api.get('/access/permissions'),
  getModules: async () => api.get('/access/modules'),
  checkPermission: async (module, action) => api.get(`/access/check?module=${module}&action=${action}`),
  getRolePermissions: async (roleId) => api.get(`/access/roles/${roleId}`),
  setRolePermissions: async (roleId, data) => api.put(`/access/roles/${roleId}`, data),
  getUserPermissions: async (userId) => api.get(`/access/users/${userId}`),
  setUserPermissions: async (userId, data) => api.put(`/access/users/${userId}`, data),
  getCustomRoles: async () => api.get('/access/custom-roles'),
  createCustomRole: async (data) => api.post('/access/custom-roles', data),
  updateCustomRole: async (id, data) => api.put(`/access/custom-roles/${id}`, data),
  deleteCustomRole: async (id) => api.delete(`/access/custom-roles/${id}`),

  // Matrix-format endpoints
  getAllRoleMatrices: async () => api.get('/access/matrices'),
  getRoleMatrix: async (roleId) => api.get(`/access/roles/${encodeURIComponent(roleId)}/matrix`),
  saveRoleMatrix: async (roleId, matrix) => api.put(`/access/roles/${encodeURIComponent(roleId)}/matrix`, { matrix }),
  getUserMatrix: async (userId) => api.get(`/access/users/${encodeURIComponent(userId)}/matrix`),
  saveUserMatrix: async (userId, matrix) => api.put(`/access/users/${encodeURIComponent(userId)}/matrix`, { matrix }),
}