import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
 
export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
 
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: ''
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
 
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }
 
  const validate = () => {
    const newErrors = {}
 
    if (!form.name.trim())
      newErrors.name = 'Vui lòng nhập họ và tên'
    else if (form.name.trim().length < 2)
      newErrors.name = 'Họ tên phải có ít nhất 2 ký tự'
 
    if (!form.email)
      newErrors.email = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Email không đúng định dạng'
 
    if (!form.password)
      newErrors.password = 'Vui lòng nhập mật khẩu'
    else if (form.password.length < 8)
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
 
    if (!form.confirmPassword)
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
 
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
 
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
 
    setLoading(true)
    try {
      await register({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        phone:    form.phone.trim(),
      })
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (err) {
      const serverErrors = err.response?.data?.errors
      if (serverErrors) {
        setErrors(serverErrors)
      } else {
        toast.error(err.response?.data?.message || 'Đăng ký thất bại')
      }
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>🖥️ LaptopStore</h1>
          <p style={styles.subtitle}>Tạo tài khoản mới</p>
        </div>
 
        <form onSubmit={handleSubmit} style={styles.form}>
 
          {/* Họ tên */}
          <div style={styles.field}>
            <label style={styles.label}>Họ và tên *</label>
            <input
              type="text" name="name" value={form.name}
              onChange={handleChange} placeholder="Nguyễn Văn A"
              style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
            />
            {errors.name && <p style={styles.errorText}>{errors.name}</p>}
          </div>
 
          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>Email *</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="email@example.com"
              style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
            />
            {errors.email && <p style={styles.errorText}>{errors.email}</p>}
          </div>
 
          {/* Số điện thoại */}
          <div style={styles.field}>
            <label style={styles.label}>Số điện thoại</label>
            <input
              type="tel" name="phone" value={form.phone}
              onChange={handleChange} placeholder="0912345678"
              style={styles.input}
            />
          </div>
 
          {/* Mật khẩu */}
          <div style={styles.field}>
            <label style={styles.label}>Mật khẩu *</label>
            <input
              type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Tối thiểu 8 ký tự"
              style={{ ...styles.input, ...(errors.password ? styles.inputError : {}) }}
            />
            {errors.password && <p style={styles.errorText}>{errors.password}</p>}
          </div>
 
          {/* Xác nhận mật khẩu */}
          <div style={styles.field}>
            <label style={styles.label}>Xác nhận mật khẩu *</label>
            <input
              type="password" name="confirmPassword" value={form.confirmPassword}
              onChange={handleChange} placeholder="Nhập lại mật khẩu"
              style={{ ...styles.input, ...(errors.confirmPassword ? styles.inputError : {}) }}
            />
            {errors.confirmPassword && <p style={styles.errorText}>{errors.confirmPassword}</p>}
          </div>
 
          <button
            type="submit" disabled={loading}
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          >
            {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
          </button>
        </form>
 
        <p style={styles.switchText}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={styles.link}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
 
const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f4f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
  },
  header:   { textAlign: 'center', marginBottom: '28px' },
  title:    { fontSize: '28px', fontWeight: '700', color: '#1a2341', margin: '0 0 8px' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  form:     { display: 'flex', flexDirection: 'column', gap: '14px' },
  field:    { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:    { fontSize: '14px', fontWeight: '500', color: '#374151' },
  input:    {
    padding: '10px 14px',
    border: '1.5px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  inputError:  { borderColor: '#ef4444' },
  errorText:   { fontSize: '12px', color: '#ef4444', margin: 0 },
  btn: {
    padding: '12px',
    background: '#1a2341',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '6px',
  },
  btnDisabled: { background: '#94a3b8', cursor: 'not-allowed' },
  switchText:  { textAlign: 'center', fontSize: '14px', color: '#6b7280', margin: '20px 0 0' },
  link:        { color: '#1a2341', fontWeight: '600', textDecoration: 'none' },
}
 