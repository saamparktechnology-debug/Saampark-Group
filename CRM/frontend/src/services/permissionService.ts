import { api } from '@/lib/api'

export const PermissionService = {
  getAll: async () => api.get('/access/permissions'),
  getModules: async () => api.get('/access/modules'),
  checkPermission: async (module: string, action: string) => api.get(`/access/check?module=${module}&action=${action}`),
  getRolePermissions: async (roleId: string) => api.get(`/access/roles/${roleId}`),
  setRolePermissions: async (roleId: string, data: any) => api.put(`/access/roles/${roleId}`, data),
  getUserPermissions: async (userId: string) => api.get(`/access/users/${userId}`),
  setUserPermissions: async (userId: string, data: any) => api.put(`/access/users/${userId}`, data),
  getCustomRoles: async () => api.get('/access/custom-roles'),
  createCustomRole: async (data: any) => api.post('/access/custom-roles', data),
  updateCustomRole: async (id: string, data: any) => api.put(`/access/custom-roles/${id}`, data),
  deleteCustomRole: async (id: string) => api.delete(`/access/custom-roles/${id}`),

  // Matrix-format endpoints
  getAllRoleMatrices: async () => api.get('/access/matrices'),
  getRoleMatrix: async (roleId: string) => api.get(`/access/roles/${encodeURIComponent(roleId)}/matrix`),
  saveRoleMatrix: async (roleId: string, matrix: any) => api.put(`/access/roles/${encodeURIComponent(roleId)}/matrix`, { matrix }),
  getUserMatrix: async (userId: string) => api.get(`/access/users/${encodeURIComponent(userId)}/matrix`),
  saveUserMatrix: async (userId: string, matrix: any) => api.put(`/access/users/${encodeURIComponent(userId)}/matrix`, { matrix }),
}
