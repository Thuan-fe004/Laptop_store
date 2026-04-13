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
      // Không có token → khách chưa đăng nhập, render ngay
      setLoading(false)
      return
    }

    // Có token → verify với backend để đảm bảo còn hợp lệ
    // Tránh trường hợp token hết hạn nhưng localStorage vẫn còn
    api.get('/auth/me')
      .then(res => {
        if (res.data?.user) {
          setUser(res.data.user)
          // Cập nhật user mới nhất từ server vào localStorage
          localStorage.setItem('user', JSON.stringify(res.data.user))
        } else {
          // Token không hợp lệ → xóa sạch
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      })
      .catch(() => {
        // Token hết hạn hoặc server lỗi → xóa sạch, về trạng thái khách
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: u } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user',  JSON.stringify(u))
    setUser(u)
    // Redirect theo role — AuthContext xử lý, LoginPage không cần navigate nữa
    if (u.role === 'admin') navigate('/admin', { replace: true })
    else                    navigate('/',      { replace: true })
    return u
  }, [navigate])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const updateUser = useCallback((newData) => {
    const merged = { ...user, ...newData }
    localStorage.setItem('user', JSON.stringify(merged))
    setUser(merged)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}