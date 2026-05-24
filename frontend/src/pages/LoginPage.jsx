import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email)    newErrors.email    = 'Vui lòng nhập email'
    if (!form.password) newErrors.password = 'Vui lòng nhập mật khẩu'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const userData = await login(form.email, form.password)
      toast.success(`Chào mừng ${userData.name}!`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        * { box-sizing:border-box; }
        .login-input:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important;
          outline: none;
          background: #fff !important;
        }
        .login-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(37,99,235,.45) !important;
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }

        /* Responsive */
        @media (max-width: 480px) {
          .login-card { padding: 28px 20px !important; border-radius: 16px !important; margin: 0 12px; }
          .login-title { font-size: 20px !important; }
          .login-icon-wrap { width: 48px !important; height: 48px !important; font-size: 22px !important; }
        }
        @media (max-width: 360px) {
          .login-card { padding: 22px 16px !important; }
        }
      `}</style>

      {/* Logo top */}
      <div style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10,
      }}>
        <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize: 24 }}>💻</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#1a2341', whiteSpace: 'nowrap' }}>
            Laptop<span style={{ color:'#2563eb' }}>Store</span>
          </span>
        </Link>
      </div>

      <div className="login-card" style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div className="login-icon-wrap" style={styles.iconWrap}>🔑</div>
          <h1 className="login-title" style={styles.title}>Đăng nhập</h1>
          <p style={styles.subtitle}>Chào mừng bạn quay trở lại!</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>Email <span style={{color:'#ef4444'}}>*</span></label>
            <div style={{ position:'relative' }}>
              <span style={styles.inputIcon}>✉️</span>
              <input
                className="login-input"
                type="email" name="email" value={form.email}
                onChange={handleChange}
                placeholder="Nhập địa chỉ email"
                style={{ ...styles.input, paddingLeft:40, ...(errors.email ? styles.inputError : {}) }}
              />
            </div>
            {errors.email && <p style={styles.errorText}>⚠️ {errors.email}</p>}
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>Mật khẩu <span style={{color:'#ef4444'}}>*</span></label>
            <div style={{ position:'relative' }}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                className="login-input"
                type="password" name="password" value={form.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                style={{ ...styles.input, paddingLeft:40, ...(errors.password ? styles.inputError : {}) }}
              />
            </div>
            {errors.password && <p style={styles.errorText}>⚠️ {errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          >
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }} />
                Đang đăng nhập...
              </span>
            ) : '🚀 Đăng nhập'}
          </button>
        </form>

        <p style={styles.switchText}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={styles.link}>Đăng ký ngay →</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f0fdf4 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '80px 16px 24px',
    fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
    position: 'relative',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '36px 32px',
    width: '100%', maxWidth: 440,
    boxShadow: '0 20px 60px rgba(0,0,0,.1)',
    animation: 'fadeUp .5s ease',
    border: '1px solid rgba(255,255,255,.8)',
  },
  header:   { textAlign: 'center', marginBottom: 28 },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    background: 'linear-gradient(135deg,#1a2341,#2563eb)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, margin: '0 auto 16px',
  },
  title:    { fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 6px', letterSpacing: -.5 },
  subtitle: { fontSize: 14, color: '#6b7280', margin: 0 },
  form:     { display: 'flex', flexDirection: 'column', gap: 18 },
  field:    { display: 'flex', flexDirection: 'column', gap: 6 },
  label:    { fontSize: 13, fontWeight: 700, color: '#374151' },
  inputIcon: {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16,
  },
  input: {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid #e5e7eb', borderRadius: 10,
    fontSize: 15, background: '#fafafa', color: '#111827',
    transition: 'border-color .2s, box-shadow .2s',
  },
  inputError: { borderColor: '#ef4444', background: '#fff5f5' },
  errorText:  { fontSize: 12, color: '#ef4444', margin: 0, fontWeight: 600 },
  btn: {
    padding: '13px', background: 'linear-gradient(135deg,#1a2341,#2563eb)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 800, cursor: 'pointer', marginTop: 4,
    boxShadow: '0 8px 24px rgba(37,99,235,.3)',
    transition: 'opacity .2s, transform .2s, box-shadow .2s',
    width: '100%',
  },
  btnDisabled: { background: '#94a3b8', boxShadow: 'none', cursor: 'not-allowed' },
  switchText:  { textAlign: 'center', fontSize: 14, color: '#6b7280', margin: '20px 0 0' },
  link:        { color: '#2563eb', fontWeight: 700, textDecoration: 'none' },
}