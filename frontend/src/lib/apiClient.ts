import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token and Correlation ID to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kairo_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Ensure X-Correlation-ID is always present for end-to-end audit tracing
  if (!config.headers['X-Correlation-ID']) {
    config.headers['X-Correlation-ID'] =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `kairo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  return config
})

// Handle 401 — clear token and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kairo_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient

