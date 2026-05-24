// src/pages/AccountPage.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

const STATUS_MAP = {
  pending:   { label: 'Chờ xác nhận', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⏳' },
  confirmed: { label: 'Đã xác nhận',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '✅' },
  shipping:  { label: 'Đang giao',    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '🚚' },
  delivered: { label: 'Đã nhận',      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '📦' },
  cancelled: { label: 'Đã hủy',       color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '❌' },
}

const TABS = [
  { key: 'info',     label: 'Thông tin',   icon: '👤', desc: 'Hồ sơ cá nhân' },
  { key: 'password', label: 'Bảo mật',     icon: '🔒', desc: 'Đổi mật khẩu' },
  { key: 'orders',   label: 'Đơn hàng',   icon: '📦', desc: 'Lịch sử mua' },
  { key: 'address',  label: 'Địa chỉ',    icon: '📍', desc: 'Nơi giao hàng' },
]

/* ═══════════════════════════════════════════════════════
   GLOBAL STYLES (injected once)
═══════════════════════════════════════════════════════ */
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap');
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes scaleIn { from { opacity:0; transform:scale(.96) } to { opacity:1; transform:scale(1) } }
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: 'Inter', sans-serif }
  input, button, select, textarea { font-family: inherit }
  input::placeholder { color: #94a3b8 }
  ::-webkit-scrollbar { width: 5px; height: 5px }
  ::-webkit-scrollbar-track { background: #f1f5f9 }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px }

  .acc-root { min-height: 100vh; background: #f0f4f8; font-family: 'Inter', sans-serif; color: #1e293b }

  /* HERO */
  .acc-hero { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #312e81 100%); padding: 40px 24px 100px; position: relative; overflow: hidden }
  .acc-hero::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); pointer-events: none }
  .acc-hero-inner { max-width: 1100px; margin: 0 auto }
  .acc-logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; margin-bottom: 28px }
  .acc-logo-text { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 900; color: #fff }
  .acc-logo-text span { color: #60a5fa }
  .acc-breadcrumb { font-size: 13px; color: #64748b; margin-bottom: 24px; display: flex; align-items: center; gap: 8px }
  .acc-breadcrumb a { color: #94a3b8; text-decoration: none }
  .acc-breadcrumb a:hover { color: #fff }
  .acc-user-hero { display: flex; align-items: center; gap: 20px; flex-wrap: wrap }
  .acc-avatar-hero { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #60a5fa, #818cf8); display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; font-size: 30px; font-weight: 900; color: #fff; flex-shrink: 0; box-shadow: 0 0 0 4px rgba(96,165,250,.3), 0 8px 24px rgba(0,0,0,.3) }
  .acc-user-name { font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px }
  .acc-user-email { font-size: 14px; color: #94a3b8 }

  /* LAYOUT */
  .acc-body { max-width: 1100px; margin: -56px auto 0; padding: 0 16px 60px; position: relative; z-index: 10 }
  .acc-grid { display: grid; grid-template-columns: 256px 1fr; gap: 20px; align-items: start }

  /* SIDEBAR */
  .acc-sidebar { background: #fff; border-radius: 20px; padding: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.07); position: sticky; top: 80px }
  .acc-nav-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; border: none; cursor: pointer; background: transparent; color: #64748b; font-size: 14px; font-weight: 600; text-align: left; transition: all .15s; border-left: 3px solid transparent; margin-bottom: 2px }
  .acc-nav-btn:hover { background: #f8fafc; color: #374151 }
  .acc-nav-btn.active { background: linear-gradient(135deg, #eff6ff, #eef2ff); color: #2563eb; font-weight: 800; border-left-color: #2563eb }
  .acc-nav-icon { font-size: 18px; flex-shrink: 0 }
  .acc-nav-meta { display: flex; flex-direction: column; gap: 1px }
  .acc-nav-sublabel { font-size: 11px; font-weight: 400; color: #9ca3af }
  .acc-nav-btn.active .acc-nav-sublabel { color: #93c5fd }
  .acc-nav-divider { margin: 10px 6px; border-top: 1px solid #f1f5f9 }
  .acc-logout-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; border: none; cursor: pointer; background: transparent; color: #ef4444; font-size: 14px; font-weight: 700; text-align: left; transition: all .15s }
  .acc-logout-btn:hover { background: #fef2f2 }

  /* PANEL */
  .acc-panel { background: #fff; border-radius: 20px; padding: 32px 36px; box-shadow: 0 4px 24px rgba(0,0,0,.07); min-height: 500px; animation: scaleIn .25s ease }

  /* SECTION HEADER */
  .acc-section-header { margin-bottom: 28px }
  .acc-section-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; margin-bottom: 4px }
  .acc-section-desc { font-size: 14px; color: #64748b }
  .acc-section-line { height: 3px; width: 40px; background: linear-gradient(90deg, #2563eb, #7c3aed); border-radius: 4px; margin-top: 12px }

  /* INPUT */
  .acc-field { display: flex; flex-direction: column; gap: 7px }
  .acc-label { font-size: 13px; font-weight: 700; color: #374151 }
  .acc-input-wrap { position: relative }
  .acc-input { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1.5px solid #e2e8f0; outline: none; font-size: 14px; color: #0f172a; transition: all .2s; background: #fff }
  .acc-input:focus { border-color: #2563eb; background: #f8faff; box-shadow: 0 0 0 3px rgba(37,99,235,.08) }
  .acc-input.error { border-color: #fca5a5 }
  .acc-error-msg { font-size: 12px; color: #ef4444; margin-top: 2px }

  /* PASSWORD FIELD */
  .acc-pw-input { padding-right: 44px }
  .acc-pw-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; color: #94a3b8; display: flex; align-items: center }
  .acc-pw-toggle:hover { color: #64748b }

  /* STRENGTH BAR */
  .acc-strength { margin-top: 8px }
  .acc-strength-bars { display: flex; gap: 4px; margin-bottom: 5px }
  .acc-strength-bar { height: 4px; flex: 1; border-radius: 4px; transition: background .3s }
  .acc-strength-label { font-size: 12px; font-weight: 700 }

  /* BUTTON */
  .acc-btn-primary { width: 100%; padding: 13px 24px; border-radius: 12px; border: none; cursor: pointer; font-size: 15px; font-weight: 800; color: #fff; background: linear-gradient(135deg, #2563eb, #1d4ed8); box-shadow: 0 4px 16px rgba(37,99,235,.3); transition: all .2s; font-family: 'Sora', sans-serif }
  .acc-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,99,235,.4) }
  .acc-btn-primary:disabled { background: #93c5fd; cursor: not-allowed; transform: none; box-shadow: none }
  .acc-btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 16px rgba(239,68,68,.25) }
  .acc-btn-danger:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(239,68,68,.35) }
  .acc-btn-outline { padding: 10px 20px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 14px; font-weight: 600; color: #64748b; transition: all .15s }
  .acc-btn-outline:hover { border-color: #cbd5e1; background: #f8fafc }

  /* AVATAR CARD */
  .acc-avatar-card { display: flex; align-items: center; gap: 18px; background: linear-gradient(135deg, #eff6ff, #eef2ff); border-radius: 16px; padding: 18px 20px; margin-bottom: 28px; border: 1.5px solid #dbeafe }
  .acc-avatar-lg { width: 68px; height: 68px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #7c3aed); display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 900; color: #fff; flex-shrink: 0; box-shadow: 0 4px 16px rgba(37,99,235,.3) }
  .acc-avatar-name { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 2px }
  .acc-avatar-email { font-size: 13px; color: #64748b; margin-bottom: 8px }
  .acc-role-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700 }

  /* INFO BOX */
  .acc-info-box { border-radius: 14px; padding: 14px 18px; margin-bottom: 24px; display: flex; gap: 12; align-items: flex-start }
  .acc-info-box-title { font-size: 13px; font-weight: 700; margin-bottom: 4px }
  .acc-info-box-text { font-size: 13px; line-height: 1.7 }

  /* TOAST */
  .acc-toast { position: fixed; bottom: 28px; right: 28px; z-index: 9999; display: flex; align-items: center; gap: 12px; border-radius: 14px; padding: 14px 20px; box-shadow: 0 8px 32px rgba(0,0,0,.14); font-size: 14px; font-weight: 700; animation: slideUp .3s ease; max-width: 380px }

  /* SPINNER */
  .acc-spinner-wrap { text-align: center; padding: 56px 0 }
  .acc-spinner { display: inline-block; width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin .7s linear infinite }

  /* ORDERS */
  .acc-filter-bar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap }
  .acc-filter-btn { padding: 7px 14px; border-radius: 20px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; transition: all .15s }
  .acc-filter-btn.active { background: #2563eb; color: #fff }
  .acc-filter-btn:not(.active) { background: #f1f5f9; color: #64748b }
  .acc-filter-btn:not(.active):hover { background: #e2e8f0 }
  .acc-order-card { border: 1.5px solid #f0f0f5; border-radius: 16px; overflow: hidden; transition: box-shadow .2s; margin-bottom: 12px }
  .acc-order-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.07) }
  .acc-order-header { padding: 16px 20px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; background: #fafafa; gap: 12px; flex-wrap: wrap }
  .acc-order-body { padding: 16px 20px; border-top: 1px solid #f0f0f5; animation: fadeIn .2s ease }
  .acc-order-item { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid #f9fafb }
  .acc-order-img { width: 52px; height: 52px; border-radius: 10px; flex-shrink: 0; background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: hidden }
  .acc-status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700 }

  /* ADDRESS */
  .acc-addr-card { border-radius: 14px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12; margin-bottom: 12px; transition: box-shadow .15s }
  .acc-addr-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06) }
  .acc-addr-form { border: 1.5px solid #dbeafe; border-radius: 16px; padding: 24px; background: #f8faff }
  .acc-addr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px }
  .acc-addr-actions { display: flex; gap: 10px }

  /* EMPTY STATE */
  .acc-empty { text-align: center; padding: 52px 24px }
  .acc-empty-icon { font-size: 52px; margin-bottom: 16px }
  .acc-empty-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 800; color: #374151; margin-bottom: 8px }
  .acc-empty-desc { font-size: 14px; color: #9ca3af; margin-bottom: 20px }
  .acc-empty-cta { display: inline-block; padding: 10px 24px; border-radius: 10px; background: linear-gradient(135deg,#2563eb,#1d4ed8); color: #fff; font-weight: 700; font-size: 14px; text-decoration: none }

  /* MOBILE BOTTOM NAV */
  .acc-mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; background: #fff; border-top: 1px solid #e2e8f0; padding: 8px 0 env(safe-area-inset-bottom); box-shadow: 0 -4px 20px rgba(0,0,0,.08) }
  .acc-mobile-nav-inner { display: flex; justify-content: space-around }
  .acc-mobile-nav-btn { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 12px; background: none; border: none; cursor: pointer; font-size: 11px; font-weight: 600; color: #94a3b8; transition: color .15s; min-width: 64px }
  .acc-mobile-nav-btn .mnb-icon { font-size: 20px }
  .acc-mobile-nav-btn.active { color: #2563eb }

  /* RESPONSIVE */
  @media (max-width: 900px) {
    .acc-grid { grid-template-columns: 1fr }
    .acc-sidebar { display: none }
    .acc-mobile-nav { display: block }
    .acc-body { padding-bottom: 90px }
    .acc-panel { padding: 24px 20px }
    .acc-hero { padding: 28px 16px 88px }
    .acc-user-name { font-size: 20px }
    .acc-avatar-hero { width: 58px; height: 58px; font-size: 24px }
  }
  @media (max-width: 600px) {
    .acc-panel { padding: 20px 16px; border-radius: 16px }
    .acc-addr-grid { grid-template-columns: 1fr }
    .acc-addr-actions { flex-direction: column }
    .acc-addr-actions .acc-btn-outline { width: 100% }
    .acc-order-header { flex-direction: column; align-items: flex-start }
    .acc-toast { bottom: 90px; right: 16px; left: 16px; max-width: none }
    .acc-avatar-card { flex-direction: column; text-align: center }
    .acc-avatar-lg { margin: 0 auto }
    .acc-info-box { flex-direction: column; gap: 8px }
  }
  @media (min-width: 901px) {
    .acc-mobile-nav { display: none }
  }
`

/* ═══════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════ */
function Spinner() {
  return <div className="acc-spinner-wrap"><div className="acc-spinner" /></div>
}

function SectionHeader({ icon, title, desc }) {
  return (
    <div className="acc-section-header">
      <h2 className="acc-section-title"><span>{icon}</span>{title}</h2>
      <p className="acc-section-desc">{desc}</p>
      <div className="acc-section-line" />
    </div>
  )
}

function InputField({ label, name, value, onChange, placeholder, type = 'text', required, error }) {
  return (
    <div className="acc-field">
      <label className="acc-label">{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <input
        className={`acc-input${error ? ' error' : ''}`}
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
      />
      {error && <span className="acc-error-msg">{error}</span>}
    </div>
  )
}

function PasswordField({ label, name, value, onChange, show, onToggle, error }) {
  return (
    <div className="acc-field">
      <label className="acc-label">{label}</label>
      <div className="acc-input-wrap">
        <input
          className={`acc-input acc-pw-input${error ? ' error' : ''}`}
          type={show ? 'text' : 'password'} name={name} value={value} onChange={onChange} placeholder="••••••••"
        />
        <button type="button" className="acc-pw-toggle" onClick={onToggle}>{show ? '🙈' : '👁️'}</button>
      </div>
      {error && <span className="acc-error-msg">{error}</span>}
    </div>
  )
}

function EmptyState({ icon, title, desc, cta }) {
  return (
    <div className="acc-empty">
      <div className="acc-empty-icon">{icon}</div>
      <h3 className="acc-empty-title">{title}</h3>
      <p className="acc-empty-desc">{desc}</p>
      {cta && <Link to={cta.to} className="acc-empty-cta">{cta.label}</Link>}
    </div>
  )
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [msg, onClose])

  if (!msg) return null

  const isErr = type === 'error'
  return (
    <div className="acc-toast" style={{
      background: isErr ? '#fef2f2' : '#f0fdf4',
      border: `1.5px solid ${isErr ? '#fca5a5' : '#86efac'}`,
      color: isErr ? '#dc2626' : '#16a34a',
    }}>
      <span style={{ fontSize: 20 }}>{isErr ? '❌' : '✅'}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'inherit', opacity: .5, lineHeight: 1 }}>✕</button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   TAB: THÔNG TIN CÁ NHÂN
═══════════════════════════════════════════════════════ */
function InfoTab({ user, setToast }) {
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
  const [saving, setSaving] = useState(false)
  const { setUser } = useAuth?.() || {}

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) return setToast({ msg: 'Tên không được để trống!', type: 'error' })
    setSaving(true)
    try {
      const res = await api.put('/auth/profile', form)
      if (res.data?.success) {
        setToast({ msg: 'Cập nhật thành công! 🎉', type: 'success' })
        if (setUser) setUser(res.data.user)
      } else {
        setToast({ msg: res.data?.message || 'Cập nhật thất bại.', type: 'error' })
      }
    } catch (err) {
      setToast({ msg: err.response?.data?.message || 'Có lỗi xảy ra.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <SectionHeader icon="👤" title="Thông tin cá nhân" desc="Quản lý tên, email và số điện thoại của bạn" />

      <div className="acc-avatar-card">
        <div className="acc-avatar-lg">{(user?.name || 'U')[0].toUpperCase()}</div>
        <div>
          <p className="acc-avatar-name">{user?.name}</p>
          <p className="acc-avatar-email">{user?.email}</p>
          <span className="acc-role-badge" style={{
            background: user?.role === 'admin' ? '#fef3c7' : '#ecfdf5',
            color: user?.role === 'admin' ? '#d97706' : '#16a34a',
          }}>
            {user?.role === 'admin' ? '⭐ Admin' : '✅ Thành viên'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        <InputField label="Họ và tên" name="name" value={form.name} onChange={handleChange} placeholder="Nguyễn Văn A" required />
        <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@email.com" />
        <InputField label="Số điện thoại" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="0912 345 678" />
        <div style={{ marginTop: 4 }}>
          <button className="acc-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   TAB: ĐỔI MẬT KHẨU
═══════════════════════════════════════════════════════ */
function PasswordTab({ setToast }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [saving, setSaving] = useState(false)
  const [show, setShow] = useState({ current: false, newp: false, confirm: false })

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const strengthScore = (pw) => {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }

  const strengthInfo = [
    null,
    { label: 'Yếu', color: '#ef4444' },
    { label: 'Trung bình', color: '#f59e0b' },
    { label: 'Khá mạnh', color: '#2563eb' },
    { label: 'Rất mạnh', color: '#16a34a' },
  ]
  const s = strengthScore(form.new_password)

  const handleSubmit = async () => {
    if (!form.current_password) return setToast({ msg: 'Vui lòng nhập mật khẩu hiện tại!', type: 'error' })
    if (form.new_password.length < 8) return setToast({ msg: 'Mật khẩu mới phải từ 8 ký tự!', type: 'error' })
    if (form.new_password !== form.confirm_password) return setToast({ msg: 'Xác nhận mật khẩu không khớp!', type: 'error' })
    setSaving(true)
    try {
      const res = await api.put('/auth/change-password', {
        old_password: form.current_password,
        new_password: form.new_password,
      })
      if (res.data?.success) {
        setToast({ msg: 'Đổi mật khẩu thành công! 🔒', type: 'success' })
        setForm({ current_password: '', new_password: '', confirm_password: '' })
      } else {
        setToast({ msg: res.data?.message || 'Đổi mật khẩu thất bại.', type: 'error' })
      }
    } catch (err) {
      setToast({ msg: err.response?.data?.message || 'Mật khẩu hiện tại không đúng.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <SectionHeader icon="🔒" title="Bảo mật tài khoản" desc="Cập nhật mật khẩu để bảo vệ tài khoản của bạn" />

      <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1.5px solid #fde68a', borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Mẹo bảo mật</p>
          <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>
            Dùng ít nhất 8 ký tự, kết hợp chữ hoa, số và ký tự đặc biệt (@, #, $...). Không dùng lại mật khẩu cũ.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        <PasswordField
          label="Mật khẩu hiện tại" name="current_password"
          value={form.current_password} onChange={handleChange}
          show={show.current} onToggle={() => setShow(s => ({ ...s, current: !s.current }))}
        />

        <div>
          <PasswordField
            label="Mật khẩu mới" name="new_password"
            value={form.new_password} onChange={handleChange}
            show={show.newp} onToggle={() => setShow(s => ({ ...s, newp: !s.newp }))}
          />
          {form.new_password && (
            <div className="acc-strength">
              <div className="acc-strength-bars">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="acc-strength-bar" style={{ background: i <= s ? (strengthInfo[s]?.color || '#e2e8f0') : '#e2e8f0' }} />
                ))}
              </div>
              {strengthInfo[s] && (
                <span className="acc-strength-label" style={{ color: strengthInfo[s].color }}>
                  Độ mạnh: {strengthInfo[s].label}
                </span>
              )}
            </div>
          )}
        </div>

        <PasswordField
          label="Xác nhận mật khẩu mới" name="confirm_password"
          value={form.confirm_password} onChange={handleChange}
          show={show.confirm} onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
          error={form.confirm_password && form.new_password !== form.confirm_password ? 'Mật khẩu không khớp!' : ''}
        />

        <div style={{ marginTop: 4 }}>
          <button className="acc-btn-primary acc-btn-danger" onClick={handleSubmit} disabled={saving}>
            {saving ? '⏳ Đang lưu...' : '🔒 Cập nhật mật khẩu'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   TAB: ĐƠN HÀNG
═══════════════════════════════════════════════════════ */
function OrdersTab({ setToast }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/orders')
      .then(r => setOrders(r.data?.data || r.data?.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const handleCancel = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return
    try {
      const res = await api.put(`/orders/${orderId}/cancel`)
      if (res.data?.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
        setToast({ msg: 'Đã hủy đơn hàng!', type: 'success' })
      }
    } catch {
      setToast({ msg: 'Không thể hủy đơn hàng này.', type: 'error' })
    }
  }

  const FILTERS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending',   label: '⏳ Chờ xác nhận' },
    { key: 'confirmed', label: '✅ Đã xác nhận' },
    { key: 'shipping',  label: '🚚 Đang giao' },
    { key: 'delivered', label: '📦 Đã nhận' },
    { key: 'cancelled', label: '❌ Đã hủy' },
  ]

  return (
    <div>
      <SectionHeader icon="📦" title="Đơn hàng của tôi" desc="Theo dõi và quản lý tất cả đơn hàng" />

      <div className="acc-filter-bar">
        {FILTERS.map(f => (
          <button key={f.key} className={`acc-filter-btn${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="📦" title="Không có đơn hàng nào" desc="Hãy mua sắm ngay để xem đơn hàng tại đây!" cta={{ to: '/products', label: '🛒 Mua ngay' }} />
      ) : (
        <div>
          {filtered.map(order => {
            const st = STATUS_MAP[order.status] || STATUS_MAP.pending
            const isExpanded = expanded === order.id
            return (
              <div key={order.id} className="acc-order-card" style={{ borderColor: isExpanded ? st.border : '#f0f0f5' }}>
                <div className="acc-order-header" onClick={() => setExpanded(isExpanded ? null : order.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, border: `1px solid ${st.border}` }}>
                      {st.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>Đơn #{order.id}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8' }}>
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span className="acc-status-badge" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#ef4444' }}>{fmt(order.total_amount || 0)}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', transform: isExpanded ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform .2s' }}>▼</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="acc-order-body">
                    {(order.items || order.order_items || []).map((item, i) => (
                      <div key={i} className="acc-order-item">
                        <div className="acc-order-img">
                          {item.primary_image
                            ? <img src={`${import.meta.env.VITE_IMG_BASE_URL || ''}/${item.primary_image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                            : <span style={{ fontSize: 22 }}>💻</span>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name || item.name}</p>
                          <p style={{ fontSize: 12, color: '#94a3b8' }}>SL: {item.quantity} × {fmt(item.price || item.unit_price || 0)}</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#2563eb', flexShrink: 0 }}>{fmt((item.quantity || 1) * (item.price || item.unit_price || 0))}</span>
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        {order.shipping_address && <p>📍 {order.shipping_address}</p>}
                        {order.note && <p style={{ marginTop: 3 }}>📝 {order.note}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        {order.status === 'pending' && (
                          <button onClick={() => handleCancel(order.id)} style={{
                            padding: '7px 16px', borderRadius: 8, border: '1.5px solid #fca5a5',
                            background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                          }}>❌ Hủy đơn</button>
                        )}
                        {order.status === 'delivered' && (
                          <Link to="/products" style={{
                            padding: '7px 16px', borderRadius: 8,
                            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                            color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                          }}>🔄 Mua lại</Link>
                        )}
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Tổng cộng</p>
                          <p style={{ fontSize: 18, fontWeight: 900, color: '#ef4444' }}>{fmt(order.total_amount || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   TAB: ĐỊA CHỈ
═══════════════════════════════════════════════════════ */
function AddressTab({ setToast }) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', address: '', city: '', is_default: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/auth/addresses')
      .then(r => setAddresses(r.data?.data || r.data?.addresses || []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false))
  }, [])

  const upd = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleAdd = async () => {
    if (!form.full_name || !form.address || !form.city) return setToast({ msg: 'Vui lòng điền đủ thông tin!', type: 'error' })
    setSaving(true)
    try {
      const res = await api.post('/auth/addresses', form)
      if (res.data?.success) {
        setAddresses(prev => [...prev, res.data.address])
        setAdding(false)
        setForm({ full_name: '', phone: '', address: '', city: '', is_default: false })
        setToast({ msg: 'Đã thêm địa chỉ mới!', type: 'success' })
      }
    } catch {
      setToast({ msg: 'Không thể thêm địa chỉ.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa địa chỉ này?')) return
    try {
      await api.delete(`/auth/addresses/${id}`)
      setAddresses(prev => prev.filter(a => a.id !== id))
      setToast({ msg: 'Đã xóa địa chỉ!', type: 'success' })
    } catch {
      setToast({ msg: 'Không thể xóa địa chỉ.', type: 'error' })
    }
  }

  return (
    <div>
      <SectionHeader icon="📍" title="Địa chỉ giao hàng" desc="Quản lý các địa chỉ nhận hàng của bạn" />

      {loading ? <Spinner /> : (
        <>
          {addresses.length === 0 && !adding && (
            <EmptyState icon="📍" title="Chưa có địa chỉ" desc="Thêm địa chỉ để thanh toán nhanh hơn!" />
          )}
          <div style={{ marginBottom: 16 }}>
            {addresses.map(addr => (
              <div key={addr.id} className="acc-addr-card" style={{
                border: `1.5px solid ${addr.is_default ? '#bfdbfe' : '#f0f0f5'}`,
                background: addr.is_default ? '#eff6ff' : '#fff',
              }}>
                <div>
                  {addr.is_default && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 20, marginBottom: 6, display: 'inline-block' }}>
                      ⭐ Mặc định
                    </span>
                  )}
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{addr.full_name}</p>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>📱 {addr.phone}</p>
                  <p style={{ fontSize: 13, color: '#64748b' }}>📍 {addr.address}, {addr.city}</p>
                </div>
                <button onClick={() => handleDelete(addr.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#ef4444', padding: 6, flexShrink: 0, borderRadius: 8, transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  title="Xóa địa chỉ"
                >🗑️</button>
              </div>
            ))}
          </div>

          {adding ? (
            <div className="acc-addr-form">
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1e3a8a', marginBottom: 18 }}>➕ Thêm địa chỉ mới</p>
              <div className="acc-addr-grid">
                <InputField label="Họ và tên" name="full_name" value={form.full_name} onChange={upd('full_name')} placeholder="Nguyễn Văn A" required />
                <InputField label="Số điện thoại" name="phone" value={form.phone} onChange={upd('phone')} placeholder="0912 345 678" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <InputField label="Địa chỉ" name="address" value={form.address} onChange={upd('address')} placeholder="Số nhà, đường, phường/xã" required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <InputField label="Tỉnh / Thành phố" name="city" value={form.city} onChange={upd('city')} placeholder="Hà Nội" required />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer', marginBottom: 20 }}>
                <input type="checkbox" checked={form.is_default} onChange={upd('is_default')} style={{ accentColor: '#2563eb' }} />
                Đặt làm địa chỉ mặc định
              </label>
              <div className="acc-addr-actions">
                <button className="acc-btn-primary" style={{ flex: 1, padding: '11px' }} onClick={handleAdd} disabled={saving}>
                  {saving ? '⏳ Đang lưu...' : '💾 Lưu địa chỉ'}
                </button>
                <button className="acc-btn-outline" onClick={() => setAdding(false)}>Hủy</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{
              width: '100%', padding: '13px', borderRadius: 12,
              border: '2px dashed #bfdbfe', background: '#eff6ff',
              color: '#2563eb', cursor: 'pointer', fontSize: 14, fontWeight: 700,
              transition: 'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#2563eb' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe' }}
            >
              ➕ Thêm địa chỉ mới
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')
  const [toast, setToast] = useState({ msg: '', type: 'success' })

  useEffect(() => {
    if (user === null) navigate('/login', { replace: true })
  }, [user, navigate])

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )

  const renderTab = () => {
    switch (activeTab) {
      case 'info':     return <InfoTab     user={user} setToast={setToast} />
      case 'password': return <PasswordTab              setToast={setToast} />
      case 'orders':   return <OrdersTab                setToast={setToast} />
      case 'address':  return <AddressTab               setToast={setToast} />
      default:         return null
    }
  }

  return (
    <div className="acc-root">
      <style>{globalCSS}</style>

      {/* HERO */}
      <div className="acc-hero">
        <div className="acc-hero-inner">
          <Link to="/" className="acc-logo">
            <span style={{ fontSize: 22 }}>💻</span>
            <span className="acc-logo-text">Laptop<span>Store</span></span>
          </Link>
          <nav className="acc-breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span>›</span>
            <span style={{ color: '#cbd5e1' }}>Tài khoản</span>
          </nav>
          <div className="acc-user-hero">
            <div className="acc-avatar-hero">{(user.name || 'U')[0].toUpperCase()}</div>
            <div>
              <h1 className="acc-user-name">Xin chào, {user.name?.split(' ').pop()}! 👋</h1>
              <p className="acc-user-email">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="acc-body">
        <div className="acc-grid">

          {/* SIDEBAR — hidden on mobile */}
          <aside className="acc-sidebar">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`acc-nav-btn${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="acc-nav-icon">{tab.icon}</span>
                <span className="acc-nav-meta">
                  <span>{tab.label}</span>
                  <span className="acc-nav-sublabel">{tab.desc}</span>
                </span>
              </button>
            ))}
            <div className="acc-nav-divider" />
            <button className="acc-logout-btn" onClick={logout}>
              <span className="acc-nav-icon">🚪</span> Đăng xuất
            </button>
          </aside>

          {/* CONTENT PANEL */}
          <main className="acc-panel" key={activeTab}>
            {renderTab()}
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="acc-mobile-nav">
        <div className="acc-mobile-nav-inner">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`acc-mobile-nav-btn${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="mnb-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          <button className="acc-mobile-nav-btn" onClick={logout} style={{ color: '#ef4444' }}>
            <span className="mnb-icon">🚪</span>
            Thoát
          </button>
        </div>
      </nav>

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, msg: '' }))} />
    </div>
  )
}