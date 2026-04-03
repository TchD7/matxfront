// src/api/apiClient.ts
import axios from 'axios'

const PUBLIC_PATHS = [
  '/api/v1/customers/users/check-credentials/',
  '/api/v1/customers/auth/token/refresh/'
]

const api = axios.create({
  baseURL: 'http://localhost', // en prod: https://api.votredomaine.com
  withCredentials: true, // nécessaire pour cookies cross-site
})

// helper pour lire cookie (csrftoken n'est pas HttpOnly)
function getCookie(name: string): string | null {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')
  return match ? decodeURIComponent(match.pop() || '') : null
}

// récupère le cookie CSRF via endpoint dédié si absent
async function ensureCsrf(): Promise<string | null> {
  const existing = getCookie('csrftoken')
  if (existing) return existing
  try {
    // endpoint qui doit renvoyer Set-Cookie: csrftoken=...
    await api.get('/api/v1/customers/csrf/', { skipAuth: true } as any)
    return getCookie('csrftoken')
  } catch {
    return null
  }
}

// Request interceptor: ajoute Authorization et CSRF quand nécessaire
api.interceptors.request.use(async (config: any) => {
  const url = config.url || ''
  const isPublic = PUBLIC_PATHS.some(p => url.endsWith(p))
  if (config?.skipAuth || isPublic) {
    if (config.headers) delete config.headers.Authorization
    return config
  }

  // Authorization header depuis localStorage (si présent)
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  } else {
    if (config.headers) delete config.headers.Authorization
  }

  // Si méthode "unsafe" (POST/PUT/PATCH/DELETE) : s'assurer du CSRF token
  const method = (config.method || 'get').toLowerCase()
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrf = getCookie('csrftoken') || await ensureCsrf()
    if (csrf) {
      config.headers = config.headers || {}
      config.headers['X-CSRFToken'] = csrf
    }
  }

  return config
})

// Response interceptor: tente refresh si 401 et retry
api.interceptors.response.use(
  res => res,
  async (error) => {
    const originalRequest = error.config
    if (!originalRequest) return Promise.reject(error)

    const status = error.response?.status
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refresh = localStorage.getItem('refresh')
      try {
        if (refresh) {
          const r = await axios.post(
            `${api.defaults.baseURL}/api/v1/customers/auth/token/refresh/`,
            { refresh },
            { skipAuth: true, withCredentials: true }
          )
          const newAccess = r.data?.access
          if (newAccess) {
            localStorage.setItem('token', newAccess)
            originalRequest.headers.Authorization = `Bearer ${newAccess}`
            return api(originalRequest)
          }
        } else {
          // tentative via cookie (no body)
          const r = await axios.post(
            `${api.defaults.baseURL}/api/v1/customers/auth/token/refresh/`,
            {},
            { withCredentials: true, skipAuth: true }
          )
          const newAccess = r.data?.access
          if (newAccess) {
            localStorage.setItem('token', newAccess)
            originalRequest.headers.Authorization = `Bearer ${newAccess}`
            return api(originalRequest)
          }
        }
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('refresh')
        window.location.href = '/' // redirige vers login
      }
    }
    return Promise.reject(error)
  }
)

export default api
