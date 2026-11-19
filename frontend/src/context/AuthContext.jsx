import { createContext, useContext, useEffect, useState } from 'react'
import { loginUser, registerUser, getMe } from '../api/auth'
import { getToken, setToken, clearToken, UNAUTHORIZED_EVENT } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // only "loading" if there is a saved token we still have to verify
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  // on page load: check the saved token
  useEffect(() => {
    if (!getToken()) return
    let cancelled = false
    getMe()
      .then((u) => { if (!cancelled) setUser(u) })
      .catch(() => { if (!cancelled) setUser(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // api/client.js fires this when any request gets a 401
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const login = async (email, password) => {
    const { user: u, token } = await loginUser(email, password)
    setToken(token)
    setUser(u)
  }

  const register = async (name, email, password) => {
    const { user: u, token } = await registerUser(name, email, password)
    setToken(token)
    setUser(u)
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}