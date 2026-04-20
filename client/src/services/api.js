import axios from 'axios'

const TOKEN_KEY = 'electromap_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('electromap:logout'))

      if (window.location.pathname !== '/login') {
        const redirect = encodeURIComponent(
          `${window.location.pathname}${window.location.search}`,
        )
        window.location.assign(`/login?redirect=${redirect}`)
      }
    }

    return Promise.reject(error)
  },
)

export default api
