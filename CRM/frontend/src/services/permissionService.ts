import { api } from '@/lib/api'
import { recordActivityLog } from './activityLogService'

export const PermissionService = {
  getAll: async () => api.get('/access/permissions'),
  getModules: async () => api.get('/access/modules'),
  checkPermission: async (module: string, action: string) => api.get(`/access/check?module=${module}&action=${action}`),
  getRolePermissions: async (roleId: string) => api.get(`/access/roles/${roleId}`),
  setRolePermissions: async (roleId: string, data: any) => {
    const res = await api.put(`/access/roles/${roleId}`, data)
    recordActivityLog({
      type: "permission",
      module: "Permissions",
      action: "Role Permissions Updated",
      description: `Permissions updated for role "${roleId}"`,
      details: `Role ID: ${roleId}`
    }).catch(() => {})
    return res
  },
  getUserPermissions: async (userId: string) => api.get(`/access/users/${userId}`),
  setUserPermissions: async (userId: string, data: any) => {
    const res = await api.put(`/access/users/${userId}`, data)
    recordActivityLog({
      type: "permission",
      module: "Permissions",
      action: "User Permissions Updated",
      description: `Permissions updated for user "${userId}"`,
      details: `User ID: ${userId}`
    }).catch(() => {})
    return res
  },
  getCustomRoles: async () => api.get('/access/custom-roles'),
  createCustomRole: async (data: any) => {
    const res = await api.post('/access/custom-roles', data)
    recordActivityLog({
      type: "permission",
      module: "Permissions",
      action: "Custom Role Created",
      description: `New custom role "${data?.name || 'Custom Role'}" created`,
      details: data?.description || ""
    }).catch(() => {})
    return res
  },
  updateCustomRole: async (id: string, data: any) => {
    const res = await api.put(`/access/custom-roles/${id}`, data)
    recordActivityLog({
      type: "permission",
      module: "Permissions",
      action: "Custom Role Updated",
      description: `Custom role "${data?.name || id}" updated`,
      details: data?.description || ""
    }).catch(() => {})
    return res
  },
  deleteCustomRole: async (id: string) => {
    const res = await api.delete(`/access/custom-roles/${id}`)
    recordActivityLog({
      type: "permission",
      module: "Permissions",
      action: "Custom Role Deleted",
      description: `Custom role #${id} deleted`,
    }).catch(() => {})
    return res
  },

  // Matrix-format endpoints
  getAllRoleMatrices: async () => api.get('/access/matrices'),
  getRoleMatrix: async (roleId: string) => api.get(`/access/roles/${encodeURIComponent(roleId)}/matrix`),
  saveRoleMatrix: async (roleId: string, matrix: any) => {
    const res = await api.put(`/access/roles/${encodeURIComponent(roleId)}/matrix`, { matrix })
    recordActivityLog({
      type: "permission",
      module: "Permissions",
      action: "Role Permission Matrix Saved",
      description: `Global permission matrix updated for role "${roleId}"`,
      details: `Modules configured: ${Object.keys(matrix || {}).length} module(s)`
    }).catch(() => {})
    return res
  },
  getUserMatrix: async (userId: string) => api.get(`/access/users/${encodeURIComponent(userId)}/matrix`),
  saveUserMatrix: async (userId: string, matrix: any) => {
    const res = await api.put(`/access/users/${encodeURIComponent(userId)}/matrix`, { matrix })
    recordActivityLog({
      type: "permission",
      module: "Permissions",
      action: "User Permission Matrix Overridden",
      description: `Custom permissions override saved for user "${userId}"`,
      details: `Custom modules configured: ${Object.keys(matrix || {}).length} module(s)`
    }).catch(() => {})
    return res
  },
}

