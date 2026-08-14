import { api } from '@/lib/api'

// Common array unpacker for backend envelopes like { status: "success", data: [...] } or { status: "success", data: { customers: [...] } }
function unpackArray(res: any, key?: string): any[] {
  if (Array.isArray(res)) return res
  if (res?.data) {
    if (Array.isArray(res.data)) return res.data
    if (key && Array.isArray(res.data[key])) return res.data[key]
  }
  if (key && Array.isArray(res?.[key])) return res[key]
  return []
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  name?: string
  full_name?: string
  role?: string
}

export interface LeadPayload {
  first_name: string
  last_name?: string
  company_name?: string
  email: string
  phone?: string
  industry?: string
  source_id?: number
  assigned_to?: number
  lead_score?: number
}

export interface UpdateLeadPayload {
  status?: string
  lead_score?: number
  assigned_to?: number
}

export interface CustomerPayload {
  company_name: string
  primary_contact_name?: string
  email: string
  phone?: string
  industry?: string
}

export interface DealPayload {
  title: string
  deal_value: number
  stage?: string
  customer_id: number
}

export interface TaskPayload {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: number
  customer_id?: number
}

export interface TicketPayload {
  customer_id: number
  subject: string
  description: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export const AuthService = {
  login: async (payload: LoginPayload) => api.post('/auth/login', payload),
  register: async (payload: RegisterPayload) => api.post('/auth/register', payload),
  getMe: async () => api.get('/auth/me'),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saampark_token')
    }
  },
}

export const UserService = {
  getTeamMembers: async () => {
    const res = await api.get('/users')
    return unpackArray(res, 'users')
  },
  getUserById: async (id: string | number) => api.get(`/users/${id}`),
  updateUser: async (id: string | number, data: any) => api.put(`/users/${id}`, data),
}

export const LeadService = {
  getLeads: async () => {
    const res = await api.get('/leads')
    return unpackArray(res, 'leads')
  },
  addLead: async (payload: LeadPayload) => api.post('/leads', payload),
  updateLeadStatus: async (id: string | number, payload: UpdateLeadPayload) => 
    api.put(`/leads/${id}`, payload),
  convertLead: async (id: string | number) => api.post(`/leads/${id}/convert`),
}

export const CustomerService = {
  getCustomers: async () => {
    const res = await api.get('/customers')
    return unpackArray(res, 'customers')
  },
  createCustomer: async (payload: CustomerPayload) => api.post('/customers', payload),
}

export const DealService = {
  getDeals: async () => {
    const res = await api.get('/deals')
    return unpackArray(res, 'deals')
  },
  createDeal: async (payload: DealPayload) => api.post('/deals', payload),
  updateStage: async (id: string | number, payload: { stage: string }) => 
    api.patch(`/deals/${id}/stage`, payload),
}

export const TaskService = {
  getTasks: async () => {
    const res = await api.get('/tasks')
    return unpackArray(res, 'tasks')
  },
  createTask: async (payload: TaskPayload) => api.post('/tasks', payload),
  updateStatus: async (id: string | number, status: string) => 
    api.patch(`/tasks/${id}/status`, { status }),
}

export const TicketService = {
  getTickets: async () => {
    const res = await api.get('/tickets')
    return unpackArray(res, 'tickets')
  },
  createTicket: async (payload: TicketPayload) => api.post('/tickets', payload),
  addComment: async (id: string | number, comment: string) => 
    api.post(`/tickets/${id}/comments`, { comment }),
}

export const SubscriptionService = {
  getPackages: async () => {
    const res = await api.get('/subscriptions/packages')
    return unpackArray(res, 'packages')
  },
  getSubscriptions: async () => {
    const res = await api.get('/subscriptions')
    return unpackArray(res, 'subscriptions')
  },
  subscribe: async (payload: { package_id: number; billing_cycle: string }) => 
    api.post('/subscriptions/subscribe', payload),
  updateStatus: async (id: string | number, status: string) => 
    api.patch(`/subscriptions/${id}/status`, { status }),
}

export const CampaignService = {
  getCampaigns: async () => {
    const res = await api.get('/campaigns')
    return unpackArray(res, 'campaigns')
  },
  createCampaign: async (payload: any) => api.post('/campaigns', payload),
}

export const ReportService = {
  getDashboardOverview: async () => api.get('/reports/dashboard'),
}
