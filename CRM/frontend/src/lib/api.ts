const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    // If explicitly configured with a remote production API URL (not localhost), use it
    if (envUrl && !envUrl.includes('127.0.0.1') && !envUrl.includes('localhost')) {
      return envUrl
    }
    // If accessed over a domain or remote host in browser, use relative /api/v1 (routed via Next.js rewrites)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '/api/v1'
    }
    return envUrl || 'http://127.0.0.1:5000/api/v1'
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api/v1'
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('saampark_token')
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem('saampark_token', token)
  } else {
    localStorage.removeItem('saampark_token')
  }
}

export function getActiveCompanyScope(): { companyId?: string; branchId?: string } {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem('saampark-auth-v3')
    if (raw) {
      const parsed = JSON.parse(raw)
      const state = parsed?.state
      return {
        companyId: state?.activeCompanyId || state?.user?.companyId,
        branchId: state?.activeBranchId || state?.user?.branchId,
      }
    }
  } catch {}
  return {}
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const scope = getActiveCompanyScope()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (scope.companyId && !headers['x-company-id']) {
    headers['x-company-id'] = String(scope.companyId)
  }

  if (scope.branchId && !headers['x-branch-id']) {
    headers['x-branch-id'] = String(scope.branchId)
  }

  const baseUrl = getBaseUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${baseUrl}${cleanEndpoint}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.error || `Request failed with status ${response.status}`
      console.warn(`API Http Status Warning [${options.method || 'GET'} ${endpoint}]:`, errorMessage)
      return { status: "error", message: errorMessage, data: null, error: true } as any
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return await response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.warn(`API Fast Fallback [${options.method || 'GET'} ${endpoint}]:`, error.name === 'AbortError' ? 'Backend request timed out (8s limit)' : (error.message || error))
    return { status: "error", message: error.message || 'Network error', data: null, error: true } as any
  }
}

export function unwrapList<T = any>(res: any): T[] {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && res.data && Array.isArray(res.data.items)) return res.data.items
  return []
}

export const api = {
  get: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) => 
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T = any>(endpoint: string, body?: any) => 
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T = any>(endpoint: string, body?: any) => 
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
}

