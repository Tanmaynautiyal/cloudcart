import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { config } from '../config'
import { getAuthToken, removeAuthToken } from '../functionality/storage'

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Request Interceptor: Attach role-specific or path-aware bearer token
apiClient.interceptors.request.use(
  (reqConfig: InternalAxiosRequestConfig) => {
    const token = getAuthToken()
    if (token && reqConfig.headers) {
      reqConfig.headers.Authorization = `Bearer ${token}`
    }
    return reqConfig
  },
  (error: AxiosError) => Promise.reject(error)
)

// Response Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname
        if (path.startsWith('/admin') && path !== '/admin/login') {
          removeAuthToken('admin')
          window.location.href = '/admin/login'
        } else if (path.startsWith('/merchant') && path !== '/merchant/login') {
          removeAuthToken('merchant')
          window.location.href = '/merchant/login'
        } else if (!path.startsWith('/login')) {
          removeAuthToken('customer')
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
