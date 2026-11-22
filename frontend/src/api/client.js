import axios from 'axios'

const TOKEN_KEY = 'prism_token'
export const UNAUTHORIZED_EVENT = 'prism:unauthorized'

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export const setToken = (token) => {
  try { localStorage.setItem(TOKEN_KEY, token) } catch { /* storage unavailable */ }
}
export const clearToken = () => {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* storage unavailable */ }
}

// In production (Vercel) VITE_API_URL points to the Render backend.
// Locally it is unset, so requests go to /api and the Vite proxy handles them.
const API_ORIGIN = import.meta.env.VITE_API_URL ?? ''
export const api = axios.create({ baseURL: `${API_ORIGIN}/api`, timeout: 120000 })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url ?? ''
    // a wrong password on the login form is also a 401, so skip those two
    const isAuthForm = url.startsWith('/auth/login') || url.startsWith('/auth/register')
    if (err.response?.status === 401 && !isAuthForm && getToken()) {
      clearToken()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(err)
  }
)