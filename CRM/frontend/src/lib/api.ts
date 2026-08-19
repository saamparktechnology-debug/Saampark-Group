const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // In browser, route through local Next.js proxy to prevent CORS errors
    return '/api/v1'
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://saampark-srm.onrender.com/api/v1'
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

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const baseUrl = getBaseUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${baseUrl}${cleanEndpoint}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 800) // Fast 800ms timeout for snappy page loading

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
      return { status: "error", message: errorMessage, data: [] } as any
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return await response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.warn(`API Fast Fallback [${options.method || 'GET'} ${endpoint}]:`, error.name === 'AbortError' ? 'Backend request timed out (2s limit)' : (error.message || error))
    return { status: "error", message: error.message || 'Network error', data: [] } as any
  }
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
