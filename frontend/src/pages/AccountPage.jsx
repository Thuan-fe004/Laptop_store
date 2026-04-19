// src/pages/AccountPage.jsx
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

const STATUS_MAP = {
  pending:    { label: 'Chờ xác nhận', color: '#f59e0b', bg: '#fffbeb', icon: '⏳' },
  confirmed:  { label: 'Đã xác nhận',  color: '#2563eb', bg: '#eff6ff', icon: '✅' },
  shipping:   { label: 'Đang giao',    color: '#7c3aed', bg: '#f5f3ff', icon: '🚚' },
  delivered:  { label: 'Đã nhận',      color: '#16a34a', bg: '#f0fdf4', icon: '📦' },
  cancelled:  { label: 'Đã hủy',       color: '#ef4444', bg: '#fef2f2', icon: '❌' },
}

const TABS = [
  { key: 'info',     label: 'Thông tin',    icon: '👤' },
  { key: 'password', label: 'Mật khẩu',    icon: '🔒' },
  { key: 'orders',   label: 'Đơn hàng',    icon: '📦' },
  { key: 'address',  label: 'Địa chỉ',     icon: '📍' },
  { key: 'wishlist', label: 'Yêu thích',   icon: '❤️' },
]

/* ═══════════════════════════════════════════════════════
   TOAST NOTIFICATION
═══════════════════════════════════════════════════════ */
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [msg, onClose])

  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 12,
      background: type === 'error' ? '#fef2f2' : '#f0fdf4',
      border: `1.5px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`,
      color: type === 'error' ? '#dc2626' : '#16a34a',
      borderRadius: 14, padding: '14px 22px',
      boxShadow: '0 8px 32px rgba(0,0,0,.12)',
      fontSize: 14, fontWeight: 700,
      animation: 'slideUp .3s ease',
    }}>
      <span style={{ fontSize: 20 }}>{type === 'error' ? '❌' : '✅'}</span>
      {msg}
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 16, color: 'inherit', marginLeft: 6, opacity: .6,
      }}>✕</button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SPINNER
═══════════════════════════════════════════════════════ */
function Spinner({ size = 40 }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{
        width: size, height: size, margin: '0 auto',
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #2563eb',
        borderRadius: '50%',
        animation: 'spin .8s linear infinite',
      }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   TAB: THÔNG TIN CÁ NHÂN
═══════════════════════════════════════════════════════ */
function InfoTab({ user, setToast }) {
  const [form, setForm] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [saving, setSaving] = useState(false)
  const { setUser } = useAuth?.() || {}

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) return setToast({ msg: 'Tên không được để trống!', type: 'error' })
    setSaving(true)
    try {
      const res = await api.put('/api/auth/profile', form)
      if (res.data?.success) {
        setToast({ msg: 'Cập nhật thông tin thành công! 🎉', type: 'success' })
        if (setUser) setUser(res.data.user)
      } else {
        setToast({ msg: res.data?.message || 'Cập nhật thất bại.', type: 'error' })
      }
    } catch (err) {
      setToast({ msg: err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <SectionHeader icon="👤" title="Thông tin cá nhân" desc="Quản lý tên, email và số điện thoại của bạn" />

      {/* Avatar block */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 28,
        border: '1.5px solid #dbeafe',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, color: '#fff', fontWeight: 900, flexShrink: 0,
          boxShadow: '0 6px 20px rgba(37,99,235,.3)',
        }}>
          {(user?.name || 'U')[0].toUpperCase()}
        </div>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 800, color: '#111827' }}>{user?.name}</p>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: '#6b7280' }}>{user?.email}</p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20,
            background: user?.role === 'admin' ? '#fef3c7' : '#ecfdf5',
            color: user?.role === 'admin' ? '#d97706' : '#16a34a',
            fontSize: 12, fontWeight: 700,
          }}>
            {user?.role === 'admin' ? '⭐ Admin' : '✅ Thành viên'}
          </span>
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'grid', gap: 20 }}>
        <InputField
          label="Họ và tên" name="name" value={form.name}
          onChange={handleChange} icon="✏️" placeholder="Nhập họ tên đầy đủ"
          required
        />
        <InputField
          label="Email" name="email" value={form.email}
          onChange={handleChange} icon="📧" placeholder="example@email.com"
          type="email"
        />
        <InputField
          label="Số điện thoại" name="phone" value={form.phone}
          onChange={handleChange} icon="📱" placeholder="0912 345 678"
          type="tel"
        />

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            marginTop: 8, padding: '13px 32px', borderRadius: 12,
            background: saving ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 15, fontWeight: 800, width: '100%',
            boxShadow: '0 4px 16px rgba(37,99,235,.35)',
            transition: 'all .2s',
          }}
          onMouseEnter={e => !saving && (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
        >
          {saving ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
        </button>
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

  const strength = (pw) => {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }

  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#2563eb', '#16a34a']
  const s = strength(form.new_password)

  const handleSubmit = async () => {
    if (!form.current_password) return setToast({ msg: 'Vui lòng nhập mật khẩu hiện tại!', type: 'error' })
    if (form.new_password.length < 6) return setToast({ msg: 'Mật khẩu mới phải từ 6 ký tự!', type: 'error' })
    if (form.new_password !== form.confirm_password) return setToast({ msg: 'Mật khẩu xác nhận không khớp!', type: 'error' })

    setSaving(true)
    try {
      const res = await api.put('/api/auth/change-password', {
        current_password: form.current_password,
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
      <SectionHeader icon="🔒" title="Đổi mật khẩu" desc="Bảo mật tài khoản với mật khẩu mạnh" />

      {/* Security tips */}
      <div style={{
        background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
        border: '1.5px solid #fde68a', borderRadius: 14,
        padding: '14px 18px', marginBottom: 24,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#92400e' }}>Lời khuyên bảo mật</p>
          <p style={{ margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
            Dùng ít nhất 8 ký tự, kết hợp chữ hoa, chữ số và ký tự đặc biệt. Không dùng lại mật khẩu cũ.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
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
          {/* Strength bar */}
          {form.new_password && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    height: 4, flex: 1, borderRadius: 4,
                    background: i <= s ? strengthColor[s] : '#e5e7eb',
                    transition: 'background .3s',
                  }} />
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: strengthColor[s], fontWeight: 700 }}>
                Độ mạnh: {strengthLabel[s]}
              </p>
            </div>
          )}
        </div>

        <PasswordField
          label="Xác nhận mật khẩu mới" name="confirm_password"
          value={form.confirm_password} onChange={handleChange}
          show={show.confirm} onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
          error={form.confirm_password && form.new_password !== form.confirm_password ? 'Mật khẩu không khớp!' : ''}
        />

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            marginTop: 8, padding: '13px 32px', borderRadius: 12,
            background: saving ? '#fca5a5' : 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 15, fontWeight: 800, width: '100%',
            boxShadow: '0 4px 16px rgba(239,68,68,.3)', transition: 'all .2s',
          }}
          onMouseEnter={e => !saving && (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
        >
          {saving ? '⏳ Đang lưu...' : '🔒 Đổi mật khẩu'}
        </button>
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
    api.get('/api/orders')
      .then(r => setOrders(r.data?.data || r.data?.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const handleCancel = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return
    try {
      const res = await api.put(`/api/orders/${orderId}/cancel`)
      if (res.data?.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
        setToast({ msg: 'Đã hủy đơn hàng!', type: 'success' })
      }
    } catch {
      setToast({ msg: 'Không thể hủy đơn hàng này.', type: 'error' })
    }
  }

  return (
    <div>
      <SectionHeader icon="📦" title="Đơn hàng của tôi" desc="Theo dõi và quản lý các đơn hàng" />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'pending',   label: '⏳ Chờ xác nhận' },
          { key: 'confirmed', label: '✅ Đã xác nhận' },
          { key: 'shipping',  label: '🚚 Đang giao' },
          { key: 'delivered', label: '📦 Đã nhận' },
          { key: 'cancelled', label: '❌ Đã hủy' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, transition: 'all .2s',
            background: filter === f.key ? '#2563eb' : '#f3f4f6',
            color: filter === f.key ? '#fff' : '#6b7280',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="📦" title="Chưa có đơn hàng nào" desc="Hãy mua sắm ngay để xem đơn hàng tại đây!" cta={{ to: '/products', label: '🛒 Mua ngay' }} />
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map(order => {
            const st = STATUS_MAP[order.status] || STATUS_MAP.pending
            const isExpanded = expanded === order.id
            return (
              <div key={order.id} style={{
                border: '1.5px solid #f0f0f5', borderRadius: 16,
                overflow: 'hidden', transition: 'box-shadow .2s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.07)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Order header */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                  style={{
                    padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fafafa', gap: 12, flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>{st.icon}</div>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 800, color: '#111827' }}>
                        Đơn #{order.id}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : ''}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20,
                      background: st.bg, color: st.color, fontSize: 12, fontWeight: 700,
                    }}>{st.label}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#ef4444' }}>
                      {fmt(order.total_amount || 0)}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af', transition: 'transform .2s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f5' }}>
                    {/* Items */}
                    {(order.items || order.order_items || []).map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 12, alignItems: 'center',
                        padding: '10px 0', borderBottom: '1px solid #f9fafb',
                      }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                          background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden',
                        }}>
                          {item.primary_image
                            ? <img src={`${import.meta.env.VITE_IMG_BASE_URL || ''}/${item.primary_image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
                            : <span style={{ fontSize: 22 }}>💻</span>
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.product_name || item.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>SL: {item.quantity} × {fmt(item.price || item.unit_price || 0)}</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>{fmt((item.quantity || 1) * (item.price || item.unit_price || 0))}</span>
                      </div>
                    ))}

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                        <p style={{ margin: '0 0 2px' }}>📍 {order.shipping_address || 'Không có địa chỉ'}</p>
                        {order.note && <p style={{ margin: 0 }}>📝 {order.note}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            style={{
                              padding: '7px 16px', borderRadius: 8, border: '1.5px solid #fca5a5',
                              background: '#fff', color: '#ef4444', cursor: 'pointer',
                              fontSize: 13, fontWeight: 700, transition: 'all .2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background='#fef2f2' }}
                            onMouseLeave={e => { e.currentTarget.style.background='#fff' }}
                          >
                            ❌ Hủy đơn
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <Link to={`/products`} style={{
                            padding: '7px 16px', borderRadius: 8,
                            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                            color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                          }}>
                            🔄 Mua lại
                          </Link>
                        )}
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: '0 0 2px', fontSize: 12, color: '#9ca3af' }}>Tổng đơn</p>
                          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#ef4444' }}>{fmt(order.total_amount || 0)}</p>
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
    api.get('/api/auth/addresses')
      .then(r => setAddresses(r.data?.data || r.data?.addresses || []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!form.full_name || !form.address || !form.city) return setToast({ msg: 'Vui lòng điền đủ thông tin!', type: 'error' })
    setSaving(true)
    try {
      const res = await api.post('/api/auth/addresses', form)
      if (res.data?.success) {
        setAddresses(prev => [...prev, res.data.address])
        setAdding(false)
        setForm({ full_name: '', phone: '', address: '', city: '', is_default: false })
        setToast({ msg: 'Đã thêm địa chỉ mới!', type: 'success' })
      }
    } catch {
      setToast({ msg: 'Không thể thêm địa chỉ. Thử lại sau!', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa địa chỉ này?')) return
    try {
      await api.delete(`/api/auth/addresses/${id}`)
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
          <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
            {addresses.length === 0 && !adding && (
              <EmptyState icon="📍" title="Chưa có địa chỉ" desc="Thêm địa chỉ để thanh toán nhanh hơn khi mua hàng!" />
            )}
            {addresses.map(addr => (
              <div key={addr.id} style={{
                border: `1.5px solid ${addr.is_default ? '#bfdbfe' : '#f0f0f5'}`,
                background: addr.is_default ? '#eff6ff' : '#fff',
                borderRadius: 14, padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
              }}>
                <div>
                  {addr.is_default && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 20, marginBottom: 6, display: 'inline-block' }}>
                      ⭐ Mặc định
                    </span>
                  )}
                  <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#111827' }}>{addr.full_name}</p>
                  <p style={{ margin: '0 0 2px', fontSize: 13, color: '#6b7280' }}>📱 {addr.phone}</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>📍 {addr.address}, {addr.city}</p>
                </div>
                <button
                  onClick={() => handleDelete(addr.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#ef4444', padding: 4, flexShrink: 0 }}
                  title="Xóa"
                >🗑️</button>
              </div>
            ))}
          </div>

          {adding ? (
            <div style={{ border: '1.5px solid #dbeafe', borderRadius: 16, padding: 24, background: '#f8faff' }}>
              <p style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 800, color: '#1e3a8a' }}>➕ Thêm địa chỉ mới</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <InputField label="Họ tên" name="full_name" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Nguyễn Văn A" />
                <InputField label="Số điện thoại" name="phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="0912 345 678" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <InputField label="Địa chỉ" name="address" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="Số nhà, đường, phường/xã" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <InputField label="Tỉnh / Thành phố" name="city" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} placeholder="Hà Nội" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer', marginBottom: 20 }}>
                <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({...f, is_default: e.target.checked}))} />
                Đặt làm địa chỉ mặc định
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleAdd} disabled={saving} style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                }}>
                  {saving ? '⏳...' : '💾 Lưu địa chỉ'}
                </button>
                <button onClick={() => setAdding(false)} style={{
                  padding: '11px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', fontSize: 14, color: '#6b7280', fontWeight: 600,
                }}>
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{
              width: '100%', padding: '13px', borderRadius: 12,
              border: '2px dashed #bfdbfe', background: '#eff6ff',
              color: '#2563eb', cursor: 'pointer', fontSize: 14, fontWeight: 700,
              transition: 'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background='#dbeafe'; e.currentTarget.style.borderColor='#2563eb' }}
              onMouseLeave={e => { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.borderColor='#bfdbfe' }}
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
   TAB: YÊU THÍCH
═══════════════════════════════════════════════════════ */
function WishlistTab({ setToast }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/wishlist')
      .then(r => setItems(r.data?.data || r.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (productId) => {
    try {
      await api.delete(`/api/wishlist/${productId}`)
      setItems(prev => prev.filter(i => i.product_id !== productId && i.id !== productId))
      setToast({ msg: 'Đã xóa khỏi danh sách yêu thích!', type: 'success' })
    } catch {
      setToast({ msg: 'Không thể xóa, thử lại sau!', type: 'error' })
    }
  }

  return (
    <div>
      <SectionHeader icon="❤️" title="Sản phẩm yêu thích" desc="Các sản phẩm bạn đã lưu để xem sau" />

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon="❤️" title="Chưa có sản phẩm yêu thích" desc="Bấm ❤️ vào sản phẩm để lưu vào đây!" cta={{ to: '/products', label: '🛍️ Khám phá ngay' }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          {items.map(item => {
            const price = item.sale_price || item.price
            const oldPrice = item.sale_price ? item.price : null
            const img = item.primary_image ? `${import.meta.env.VITE_IMG_BASE_URL || ''}/${item.primary_image}` : 'https://placehold.co/200x150?text=💻'
            return (
              <div key={item.id || item.product_id} style={{
                border: '1.5px solid #f0f0f5', borderRadius: 16, overflow: 'hidden',
                background: '#fff', transition: 'all .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.08)'; e.currentTarget.style.transform='translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none' }}
              >
                <Link to={`/products/${item.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'linear-gradient(135deg,#f8fafc,#f0f4ff)', padding: '16px', textAlign: 'center' }}>
                    <img src={img} alt={item.name} style={{ width: '100%', height: 130, objectFit: 'contain' }} onError={e => e.target.src = 'https://placehold.co/200x150?text=?'} />
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#ef4444' }}>{fmt(price)}</p>
                    {oldPrice && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(oldPrice)}</p>}
                  </div>
                </Link>
                <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
                  <Link to={`/products/${item.slug}`} style={{
                    flex: 1, padding: '8px', borderRadius: 8, textAlign: 'center',
                    background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                    color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  }}>
                    Xem ngay
                  </Link>
                  <button onClick={() => handleRemove(item.product_id || item.id)} style={{
                    padding: '8px 10px', borderRadius: 8, border: '1.5px solid #fca5a5',
                    background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: 14,
                  }} title="Xóa yêu thích">🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════ */
function SectionHeader({ icon, title, desc }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>{icon}</span> {title}
      </h2>
      <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>{desc}</p>
      <div style={{ height: 3, width: 48, background: 'linear-gradient(90deg,#2563eb,#7c3aed)', borderRadius: 4, marginTop: 12 }} />
    </div>
  )
}

function InputField({ label, name, value, onChange, placeholder, type = 'text', icon, required, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 700, color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 10, outline: 'none',
          border: `1.5px solid ${error ? '#fca5a5' : focused ? '#2563eb' : '#e5e7eb'}`,
          background: focused ? '#f8faff' : '#fff',
          fontSize: 14, color: '#111827', transition: 'all .2s',
          boxSizing: 'border-box',
        }}
      />
      {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{error}</p>}
    </div>
  )
}

function PasswordField({ label, name, value, onChange, show, onToggle, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 700, color: '#374151' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          name={name} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="••••••••"
          style={{
            width: '100%', padding: '11px 44px 11px 14px', borderRadius: 10, outline: 'none',
            border: `1.5px solid ${error ? '#fca5a5' : focused ? '#2563eb' : '#e5e7eb'}`,
            background: focused ? '#f8faff' : '#fff',
            fontSize: 14, color: '#111827', transition: 'all .2s',
            boxSizing: 'border-box',
          }}
        />
        <button type="button" onClick={onToggle} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af',
        }}>
          {show ? '🙈' : '👁️'}
        </button>
      </div>
      {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{error}</p>}
    </div>
  )
}

function EmptyState({ icon, title, desc, cta }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#374151' }}>{title}</h3>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: '#9ca3af' }}>{desc}</p>
      {cta && (
        <Link to={cta.to} style={{
          display: 'inline-block', padding: '10px 24px', borderRadius: 10,
          background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
          color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
        }}>{cta.label}</Link>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN: ACCOUNT PAGE
═══════════════════════════════════════════════════════ */
export default function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')
  const [toast, setToast] = useState({ msg: '', type: 'success' })

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (user === null) navigate('/login', { replace: true })
  }, [user, navigate])

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={52} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes dropIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing: border-box }
        input::placeholder { color: #d1d5db }
        ::-webkit-scrollbar { width: 6px }
        ::-webkit-scrollbar-track { background: #f1f5f9 }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px }
      `}</style>

      {/* Top banner */}
      <div style={{ background: 'linear-gradient(135deg,#1a2341,#1e3a8a)', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 24 }}>
            <span style={{ fontSize: 22 }}>💻</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Laptop<span style={{ color: '#60a5fa' }}>Store</span></span>
          </Link>
          <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Trang chủ</Link>
            <span style={{ margin: '0 8px', color: '#475569' }}>›</span>
            <span style={{ color: '#cbd5e1' }}>Tài khoản</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg,#60a5fa,#818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 900, color: '#fff', flexShrink: 0,
              boxShadow: '0 4px 20px rgba(96,165,250,.5)',
            }}>
              {(user.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 900, color: '#fff' }}>
                Xin chào, {user.name?.split(' ').pop()}! 👋
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '-48px auto 0', padding: '0 24px 60px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '8px', boxShadow: '0 4px 24px rgba(0,0,0,.07)', position: 'sticky', top: 80 }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                marginBottom: 2,
                background: activeTab === tab.key ? 'linear-gradient(135deg,#eff6ff,#f0f4ff)' : 'transparent',
                color: activeTab === tab.key ? '#2563eb' : '#6b7280',
                fontWeight: activeTab === tab.key ? 800 : 600,
                fontSize: 14, textAlign: 'left', transition: 'all .15s',
                borderLeft: activeTab === tab.key ? '3px solid #2563eb' : '3px solid transparent',
              }}
                onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 18 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}

            <div style={{ margin: '12px 8px 4px', borderTop: '1px solid #f3f4f6' }} />

            {/* Logout */}
            <button onClick={logout} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#ef4444',
              fontWeight: 700, fontSize: 14, textAlign: 'left', transition: 'all .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 18 }}>🚪</span> Đăng xuất
            </button>
          </div>

          {/* Content panel */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 36px', boxShadow: '0 4px 24px rgba(0,0,0,.07)', minHeight: 500 }}>
            {activeTab === 'info'     && <InfoTab     user={user} setToast={setToast} />}
            {activeTab === 'password' && <PasswordTab              setToast={setToast} />}
            {activeTab === 'orders'   && <OrdersTab                setToast={setToast} />}
            {activeTab === 'address'  && <AddressTab               setToast={setToast} />}
            {activeTab === 'wishlist' && <WishlistTab              setToast={setToast} />}
          </div>
        </div>
      </div>

      {/* Toast */}
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: toast.type })} />
    </div>
  )
}