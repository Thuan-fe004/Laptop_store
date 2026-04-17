// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setLoading(false)
      return
    }

    api.get('/auth/me')
      .then(res => {
        if (res.data?.user) {
          setUser(res.data.user)
          localStorage.setItem('user', JSON.stringify(res.data.user))
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // ─── ĐĂNG KÝ ────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const res = await api.post('/auth/register', formData)
    return res.data
  }, [])

  // ─── ĐĂNG NHẬP ──────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: u } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user',  JSON.stringify(u))
    setUser(u)
    if (u.role === 'admin') navigate('/admin', { replace: true })
    else                    navigate('/',      { replace: true })
    return u
  }, [navigate])

  // ─── ĐĂNG XUẤT ──────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  // ─── CẬP NHẬT USER ──────────────────────────────────────────
  const updateUser = useCallback((newData) => {
    const merged = { ...user, ...newData }
    localStorage.setItem('user', JSON.stringify(merged))
    setUser(merged)
  }, [user])

  return (
    // ✅ Đã thêm register vào value
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}