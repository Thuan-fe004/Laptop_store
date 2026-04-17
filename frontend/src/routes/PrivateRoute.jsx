// src/routes/PrivateRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Đang tải...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Đang tải...</div>
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />
  return children
}