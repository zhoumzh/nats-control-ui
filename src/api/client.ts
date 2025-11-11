import axios, { AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// API Base URL
const API_BASE_URL = '/api/v1'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    // Extract error message from response
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Request failed'

    // Attach the formatted error message to the error object for components to use
    error.userMessage = errorMessage

    // Only log 404 warnings for debugging
    if (error.response?.status === 404) {
      console.warn('API endpoint not found:', error.config?.url)
    }

    return Promise.reject(error)
  }
)

export default apiClient
