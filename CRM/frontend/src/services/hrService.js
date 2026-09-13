import { OrgService } from './orgService'
import { api, unwrapList } from '@/lib/api'

export const EmployeeService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/hr/employees?${q}`)
    return unwrapList(res)
  },
  getById: async (id) => api.get(`/hr/employees/${id}`),
  create: async (data) => api.post('/hr/employees', data),
  update: async (id, data) => api.put(`/hr/employees/${id}`, data),
  delete: async (id) => api.delete(`/hr/employees/${id}`),
}

export const AttendanceService = {
  clockIn: async (data) => api.post('/hr/attendance/clock-in', data),
  clockOut: async (data) => api.post('/hr/attendance/clock-out', data),
  getStatus: async (employeeId) => api.get(`/hr/attendance/status?employee_id=${employeeId}`),
  getByEmployee: async (employeeId, params) => { const q = new URLSearchParams(params).toString(); return api.get(`/hr/attendance/employee/${employeeId}?${q}`) },
  getByCompany: async (params) => { const q = new URLSearchParams(params).toString(); return api.get(`/hr/attendance/company?${q}`) },
}

export const LeaveService = {
  getTypes: async () => {
    try {
      const res = await api.get('/hr/leave/types')
      const list = unwrapList(res)
      if (Array.isArray(list) && list.length > 0) return list
    } catch {}
    const { fetchModuleDataFromDB } = await import('@/lib/storageSync')
    const stored = await fetchModuleDataFromDB('leave_types', [
      { id: 'lt-1', name: 'Casual Leave', daysAllowed: 12, status: 'Active' },
      { id: 'lt-2', name: 'Sick Leave', daysAllowed: 10, status: 'Active' },
      { id: 'lt-3', name: 'Earned Leave', daysAllowed: 15, status: 'Active' },
      { id: 'lt-4', name: 'Unpaid Leave', daysAllowed: 30, status: 'Active' }
    ], 'all').catch(() => [])
    return stored
  },
  createType: async (data) => {
    try { await api.post('/hr/leave/types', data) } catch {}
    const { fetchModuleDataFromDB, saveModuleDataToDB } = await import('@/lib/storageSync')
    const stored = await fetchModuleDataFromDB('leave_types', [], 'all').catch(() => [])
    const newType = { id: `lt_${Date.now()}`, ...data, status: 'Active' }
    const updated = [...stored, newType]
    await saveModuleDataToDB('leave_types', updated, 'all').catch(() => {})
    return newType
  },
  getRequests: async (params = {}) => { 
    const q = new URLSearchParams(params).toString()
    let apiList = []
    try {
      const res = await api.get(`/hr/leave/requests?${q}`)
      apiList = unwrapList(res) || []
    } catch {}
    const { fetchModuleDataFromDB, filterGlobalDeletedItems } = await import('@/lib/storageSync')
    const stored = await fetchModuleDataFromDB('leave_requests', [], 'all').catch(() => [])
    const cleanStored = filterGlobalDeletedItems(stored || [])
    
    // Merge API and Stored without duplicates
    const map = new Map()
    for (const r of cleanStored) {
      if (r && r.id) map.set(String(r.id), r)
    }
    for (const r of (Array.isArray(apiList) ? apiList : [])) {
      if (r && r.id) map.set(String(r.id), r)
    }
    return Array.from(map.values())
  },
  createRequest: async (data) => {
    return LeaveService.requestLeave(data)
  },
  requestLeave: async (data) => {
    try { await api.post('/hr/leave/request', data).catch(() => api.post('/hr/leave/requests', data)) } catch {}
    const { fetchModuleDataFromDB, saveModuleDataToDB } = await import('@/lib/storageSync')
    const stored = await fetchModuleDataFromDB('leave_requests', [], 'all').catch(() => [])
    const newReq = {
      id: `lr_${Date.now()}`,
      status: 'Pending',
      appliedAt: new Date().toISOString(),
      ...data
    }
    const updated = [newReq, ...stored]
    await saveModuleDataToDB('leave_requests', updated, 'all').catch(() => {})
    return newReq
  },
  approve: async (id, notes = '') => {
    try {
      await api.put(`/hr/leave/approve/${id}`, { review_notes: notes }).catch(() => 
        api.put(`/hr/leave/requests/${id}/approve`, { review_notes: notes })
      )
    } catch {}
    const { fetchModuleDataFromDB, saveModuleDataToDB } = await import('@/lib/storageSync')
    const stored = await fetchModuleDataFromDB('leave_requests', [], 'all').catch(() => [])
    const updated = stored.map(r => String(r.id) === String(id) ? { 
      ...r, 
      status: 'Approved', 
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes 
    } : r)
    await saveModuleDataToDB('leave_requests', updated, 'all').catch(() => {})
    return { success: true }
  },
  reject: async (id, notes = '') => {
    try {
      await api.put(`/hr/leave/reject/${id}`, { review_notes: notes }).catch(() => 
        api.put(`/hr/leave/requests/${id}/reject`, { review_notes: notes })
      )
    } catch {}
    const { fetchModuleDataFromDB, saveModuleDataToDB } = await import('@/lib/storageSync')
    const stored = await fetchModuleDataFromDB('leave_requests', [], 'all').catch(() => [])
    const updated = stored.map(r => String(r.id) === String(id) ? { 
      ...r, 
      status: 'Rejected', 
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes 
    } : r)
    await saveModuleDataToDB('leave_requests', updated, 'all').catch(() => {})
    return { success: true }
  },
  updateStatus: async (id, status, notes) => {
    if (status?.toLowerCase() === 'rejected') {
      return LeaveService.reject(id, notes)
    }
    return LeaveService.approve(id, notes)
  },
}

export const PayrollService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/hr/payroll?${q}`)
    return unwrapList(res)
  },
  create: async (data) => api.post('/hr/payroll', data),
  updateStatus: async (id, status, paymentDate) => api.put(`/hr/payroll/${id}/status`, { status, payment_date: paymentDate }),
  markPaid: async (id, paymentDate) => api.put(`/hr/payroll/${id}/status`, { status: 'Paid', payment_date: paymentDate || new Date().toISOString().split('T')[0] }),
  generateBulk: async (month, year) => api.post('/hr/payroll/bulk-generate', { month, year }),
}

export const PerformanceService = {
  getByEmployee: async (employeeId) => api.get(`/hr/performance/employee/${employeeId}`),
  create: async (data) => api.post('/hr/performance', data),
}

export { OrgService }
