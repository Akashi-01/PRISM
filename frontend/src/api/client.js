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

export const api = axios.create({ baseURL: '/api', timeout: 120000 })

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