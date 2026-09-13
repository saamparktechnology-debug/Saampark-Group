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
    const res = await api.get('/hr/leave/types')
    return unwrapList(res)
  },
  createType: async (data) => api.post('/hr/leave/types', data),
  getRequests: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/hr/leave/requests?${q}`)
    return unwrapList(res)
  },
  createRequest: async (data) => api.post('/hr/leave/requests', data),
  requestLeave: async (data) => api.post('/hr/leave/requests', data),
  approve: async (id, notes) => api.put(`/hr/leave/requests/${id}/status`, { status: 'Approved', review_notes: notes }),
  reject: async (id, notes) => api.put(`/hr/leave/requests/${id}/status`, { status: 'Rejected', review_notes: notes }),
  updateStatus: async (id, status, notes) => api.put(`/hr/leave/requests/${id}/status`, { status, review_notes: notes }),
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
