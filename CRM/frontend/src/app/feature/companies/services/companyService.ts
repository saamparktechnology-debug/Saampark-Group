import { api } from '@/lib/api'

function unpack(res: any): any {
  if (!res || res.error || res.status === 'error') return null
  return res.data ?? res
}

function unpackArray(res: any): any[] {
  const data = unpack(res)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('saampark_token') || ''
}

function getBaseApiUrl(): string {
  if (typeof window === 'undefined') return 'http://127.0.0.1:5000'
  const env = process.env.NEXT_PUBLIC_API_BASE_URL
  if (env && !env.includes('127.0.0.1') && !env.includes('localhost')) {
    return env.replace('/api/v1', '')
  }
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return ''
  }
  return 'http://127.0.0.1:5000'
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const token = getToken()
  const base = getBaseApiUrl()
  const fullUrl = base ? `${base}/api/v1${url}` : `/api/v1${url}`
  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...((options.headers as Record<string, string>) || {}),
      },
    })
    return res.json()
  } catch {
    return { error: true }
  }
}

export const CompanyApiService = {
  getAll: async () => { const res = await api.get('/companies'); return unpackArray(res) },
  getById: async (id: string) => { const res = await api.get(`/companies/${id}`); return unpack(res) },
  getMembers: async (id: string) => { const res = await api.get(`/companies/${id}/members`); return unpackArray(res) },
  create: async (data: any) => { const res = await api.post('/companies', data); return unpack(res) },
  update: async (id: string, data: any) => { const res = await api.put(`/companies/${id}`, data); return unpack(res) },
  delete: async (id: string) => { const res = await api.delete(`/companies/${id}`); return unpack(res) },
}

export const BranchApiService = {
  getAll: async (companyId?: string) => {
    const headers: Record<string, string> = {}
    if (companyId && companyId !== 'all') headers['x-company-id'] = companyId
    const res = await fetchWithAuth('/branches', { headers })
    return unpackArray(res)
  },
  create: async (companyId: string, data: any) => {
    const res = await fetchWithAuth('/branches', {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify({ ...data, company_id: companyId }),
    })
    return unpack(res)
  },
  update: async (id: string, data: any) => { const res = await api.put(`/branches/${id}`, data); return unpack(res) },
  delete: async (id: string) => { const res = await api.delete(`/branches/${id}`); return unpack(res) },
}

export const SubBranchApiService = {
  getAll: async (branchId?: string) => {
    const query = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : ''
    const res = await api.get(`/branches/sub-branches/all${query}`)
    return unpackArray(res)
  },
  create: async (companyId: string, data: any) => {
    const res = await fetchWithAuth('/branches/sub-branches', {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify({ ...data, company_id: companyId }),
    })
    return unpack(res)
  },
  update: async (id: string, data: any) => { const res = await api.put(`/branches/sub-branches/${id}`, data); return unpack(res) },
  delete: async (id: string) => { const res = await api.delete(`/branches/sub-branches/${id}`); return unpack(res) },
}
