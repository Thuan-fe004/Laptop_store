// src/pages/CartPage.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

/* ── Responsive hook ── */
function useIsMobile() {
  const [w, setW] = useState(window.innerWidth)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024 }
}

/* ── Navbar ── */
function Navbar({ user, logout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isMobile } = useIsMobile()

  return (
    <nav style={{
      background: '#1a2341', padding: '0 16px', height: 62,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 200,
      boxShadow: '0 2px 20px rgba(0,0,0,.25)',
      borderBottom: '1px solid rgba(255,255,255,.06)',
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>💻</span>
        <span style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: -.5 }}>
          Laptop<span style={{ color: '#60a5fa' }}>Store</span>
        </span>
      </Link>

      {isMobile ? (
        <>
          <button onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 6 }}>
            {menuOpen ? '✕' : '☰'}
          </button>
          {menuOpen && (
            <div style={{
              position: 'fixed', top: 62, left: 0, right: 0, background: '#1a2341',
              padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6,
              zIndex: 199, borderBottom: '1px solid rgba(255,255,255,.1)',
              boxShadow: '0 8px 24px rgba(0,0,0,.3)',
            }}>
              {[{ to: '/', label: 'Trang chủ', icon: '🏠' }, { to: '/products', label: 'Sản phẩm', icon: '🖥️' }, { to: '/orders', label: 'Đơn hàng', icon: '📦' }].map(({ to, label, icon }) => (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                  style={{ ...NB, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {icon} {label}
                </Link>
              ))}
              <Link to="/cart" onClick={() => setMenuOpen(false)}
                style={{ ...NB, background: 'rgba(96,165,250,.2)', color: '#93c5fd', border: '1px solid rgba(96,165,250,.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                🛒 Giỏ hàng
              </Link>
              {user
                ? <button onClick={() => { logout(); setMenuOpen(false) }}
                    style={{ ...NB, border: 'none', cursor: 'pointer', color: '#fca5a5', background: 'rgba(239,68,68,.1)', textAlign: 'left' }}>
                    🚪 Đăng xuất
                  </button>
                : <Link to="/login" onClick={() => setMenuOpen(false)} style={NB}>👤 Đăng nhập</Link>
              }
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          {[{ to: '/', label: 'Trang chủ', icon: '🏠' }, { to: '/products', label: 'Sản phẩm', icon: '🖥️' }, { to: '/orders', label: 'Đơn hàng', icon: '📦' }].map(({ to, label, icon }) => (
            <Link key={to} to={to} style={NB}>{icon} {label}</Link>
          ))}
          <Link to="/cart" style={{ ...NB, background: 'rgba(96,165,250,.2)', color: '#93c5fd', border: '1px solid rgba(96,165,250,.3)' }}>🛒 Giỏ hàng</Link>
          {user
            ? <button onClick={logout} style={{ ...NB, border: 'none', cursor: 'pointer', color: '#fca5a5', background: 'rgba(239,68,68,.1)' }}>🚪 Đăng xuất</button>
            : <Link to="/login" style={NB}>👤 Đăng nhập</Link>
          }
        </div>
      )}
    </nav>
  )
}
const NB = { padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#cbd5e1', textDecoration: 'none', background: 'transparent', transition: 'all .15s' }

/* ── Empty Cart ── */
function EmptyCart() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 16px', animation: 'fadeUp .5s ease' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🛒</div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>Giỏ hàng đang trống</h2>
      <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>Khám phá hàng trăm mẫu laptop chính hãng!</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#1a2341,#2563eb)', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: '0 8px 24px rgba(37,99,235,.3)' }}>🛍️ Mua sắm ngay</Link>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: '1.5px solid #e5e7eb', color: '#374151', fontWeight: 700, fontSize: 14, textDecoration: 'none', background: '#fff' }}>🏠 Trang chủ</Link>
      </div>
      <div style={{ marginTop: 36, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[['🎮 Gaming', '/products?category_id=1'], ['💼 Văn phòng', '/products?category_id=2'], ['🎨 Đồ họa', '/products?category_id=3'], ['📚 Sinh viên', '/products?category_id=4']].map(([l, t]) => (
          <Link key={t} to={t} style={{ padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e5e7eb', color: '#374151', textDecoration: 'none', fontSize: 13, fontWeight: 600, background: '#fff' }}>{l}</Link>
        ))}
      </div>
    </div>
  )
}

function SumRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 14, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{value}</span>
    </div>
  )
}

export default function CartPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { isMobile, isTablet } = useIsMobile()
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [showSummary, setShowSummary] = useState(false)

  const loadCart = async () => {
    try {
      const res = await api.get('/cart')
      const data = res.data?.data || []
      setItems(data)
      setSelected(new Set())
    } catch { if (!user) navigate('/login') }
    finally  { setLoading(false) }
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadCart()
  }, [user])

  const updateQty = async (productId, qty) => {
    if (qty < 1) return
    setUpdating(productId)
    try {
      await api.put(`/cart/${productId}`, { quantity: qty })
      setItems(prev => prev.map(it => it.product_id === productId ? { ...it, quantity: qty } : it))
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể cập nhật')
    } finally { setUpdating(null) }
  }

  const removeItem = async (productId) => {
    setUpdating(productId)
    try {
      await api.delete(`/cart/${productId}`)
      setItems(prev => prev.filter(it => it.product_id !== productId))
      setSelected(prev => { const s = new Set(prev); s.delete(productId); return s })
      toast.success('Đã xóa khỏi giỏ hàng')
    } catch { toast.error('Không thể xóa') }
    finally  { setUpdating(null) }
  }

  const clearCart = async () => {
    if (!window.confirm('Xóa toàn bộ giỏ hàng?')) return
    try { await api.delete('/cart'); setItems([]); setSelected(new Set()); toast.success('Đã xóa giỏ hàng') }
    catch { toast.error('Không thể xóa') }
  }

  const toggleSelect  = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const toggleAll     = () => setSelected(selected.size === items.length ? new Set() : new Set(items.map(it => it.product_id)))

  const selectedItems = items.filter(it => selected.has(it.product_id))
  const subtotal  = selectedItems.reduce((s, it) => s + (it.sale_price || it.price) * it.quantity, 0)
  const itemCount = selectedItems.reduce((s, it) => s + it.quantity, 0)
  const SHIP_FREE = 10_000_000
  const shipping  = subtotal > 0 ? (subtotal >= SHIP_FREE ? 0 : 50_000) : 0
  const total     = subtotal + shipping
  const savings   = selectedItems.reduce((s, it) => s + (it.sale_price ? (it.price - it.sale_price) * it.quantity : 0), 0)

  const goCheckout = () => {
    if (selected.size === 0) { toast.info('Vui lòng chọn ít nhất 1 sản phẩm'); return }
    sessionStorage.setItem('checkout_selected', JSON.stringify([...selected]))
    navigate('/checkout')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <Navbar user={user} logout={logout} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <p style={{ color: '#6b7280', fontWeight: 600 }}>Đang tải giỏ hàng...</p>
      </div>
    </div>
  )

  const isCompact = isMobile || isTablet

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
        *{box-sizing:border-box}
      `}</style>
      <Navbar user={user} logout={logout} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isCompact ? '20px 12px' : '32px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Trang chủ</Link>
          <span style={{ margin: '0 6px', color: '#d1d5db' }}>›</span>
          <span style={{ color: '#111827', fontWeight: 700 }}>Giỏ hàng</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 900, color: '#111827' }}>
            🛒 Giỏ hàng
            {items.length > 0 && <span style={{ marginLeft: 10, fontSize: 13, background: '#1a2341', color: '#fff', padding: '3px 10px', borderRadius: 20, fontWeight: 700, verticalAlign: 'middle' }}>{items.length}</span>}
          </h1>
          {items.length > 0 && (
            <button onClick={clearCart} style={{ padding: '8px 14px', borderRadius: 9, border: '1.5px solid #ef4444', color: '#ef4444', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              🗑️ Xóa tất cả
            </button>
          )}
        </div>

        {items.length === 0 ? <EmptyCart /> : (
          <>
            {/* Desktop / Tablet layout */}
            {!isMobile ? (
              <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 380px', gap: 24, alignItems: 'start' }}>

                {/* LEFT — Cart items */}
                <div>
                  {/* Select all bar */}
                  <div style={{ background: '#fff', borderRadius: 14, padding: '12px 18px', marginBottom: 10, border: '1.5px solid #f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, color: '#374151', fontSize: 14 }} onClick={toggleAll}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected.size === items.length ? '#2563eb' : '#d1d5db'}`, background: selected.size === items.length ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>
                        {selected.size === items.length && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
                        {selected.size > 0 && selected.size < items.length && <span style={{ color: '#2563eb', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>−</span>}
                      </div>
                      Chọn tất cả ({items.length})
                    </label>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Đã chọn: <strong style={{ color: '#1a2341' }}>{selected.size}</strong></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map(item => {
                      const price    = item.sale_price || item.price
                      const oldPrice = item.sale_price ? item.price : null
                      const discount = oldPrice ? Math.round((1 - item.sale_price / item.price) * 100) : null
                      const img      = item.image ? `http://localhost:5000/static/uploads/${item.image}` : 'https://placehold.co/110x86?text=Laptop'
                      const isU      = updating === item.product_id
                      const isSel    = selected.has(item.product_id)

                      return (
                        <div key={item.product_id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          {/* Checkbox */}
                          <div onClick={() => toggleSelect(item.product_id)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSel ? '#2563eb' : '#d1d5db'}`, background: isSel ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}>
                            {isSel && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
                          </div>

                          {/* Item card */}
                          <div style={{
                            flex: 1, background: '#fff', borderRadius: 16, padding: isTablet ? '14px 16px' : '18px 22px',
                            border: `1.5px solid ${isSel ? '#bfdbfe' : '#f0f0f5'}`,
                            display: 'grid',
                            gridTemplateColumns: isTablet ? 'auto 1fr' : 'auto 1fr auto auto auto',
                            gap: isTablet ? 12 : 18,
                            alignItems: 'center',
                            opacity: isU ? .65 : 1, transition: 'all .2s',
                            boxShadow: isSel ? '0 4px 16px rgba(37,99,235,.08)' : '0 2px 8px rgba(0,0,0,.04)',
                          }}>
                            {/* Image */}
                            <Link to={`/products/${item.slug}`}>
                              <div style={{ width: isTablet ? 80 : 100, height: isTablet ? 62 : 78, background: 'linear-gradient(135deg,#f8fafc,#f0f4ff)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                                <img src={img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} onError={e => e.target.src = 'https://placehold.co/100x78?text=?'} />
                                {discount && <span style={{ position: 'absolute', top: 4, left: 4, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 8 }}>-{discount}%</span>}
                              </div>
                            </Link>

                            {/* Info + controls for tablet */}
                            {isTablet ? (
                              <div style={{ minWidth: 0 }}>
                                <p style={{ margin: '0 0 2px', fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8 }}>{item.brand_name}</p>
                                <Link to={`/products/${item.slug}`} style={{ textDecoration: 'none' }}>
                                  <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</p>
                                </Link>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 15, fontWeight: 900, color: '#ef4444' }}>{fmt(price)}</span>
                                    {oldPrice && <span style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(oldPrice)}</span>}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {/* Qty */}
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: 9, border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
                                      <button onClick={() => updateQty(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1 || isU} style={{ width: 32, height: 32, border: 'none', background: 'transparent', fontSize: 15, cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', color: '#374151', fontWeight: 700, opacity: item.quantity <= 1 ? .3 : 1 }}>−</button>
                                      <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#111827' }}>{isU ? '…' : item.quantity}</span>
                                      <button onClick={() => updateQty(item.product_id, item.quantity + 1)} disabled={isU} style={{ width: 32, height: 32, border: 'none', background: 'transparent', fontSize: 15, cursor: 'pointer', color: '#374151', fontWeight: 700 }}>+</button>
                                    </div>
                                    {/* Total + Remove */}
                                    <span style={{ fontSize: 14, fontWeight: 900, color: '#1a2341', minWidth: 90, textAlign: 'right' }}>{fmt(price * item.quantity)}</span>
                                    <button onClick={() => removeItem(item.product_id)} disabled={isU} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Info */}
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ margin: '0 0 2px', fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8 }}>{item.brand_name}</p>
                                  <Link to={`/products/${item.slug}`} style={{ textDecoration: 'none' }}>
                                    <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</p>
                                  </Link>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 17, fontWeight: 900, color: '#ef4444' }}>{fmt(price)}</span>
                                    {oldPrice && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(oldPrice)}</span>}
                                    {discount && <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 8 }}>Tiết kiệm {fmt(oldPrice - price)}</span>}
                                  </div>
                                </div>

                                {/* Qty */}
                                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: 11, border: '1.5px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                                  <button onClick={() => updateQty(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1 || isU} style={{ width: 36, height: 36, border: 'none', background: 'transparent', fontSize: 17, cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', color: '#374151', fontWeight: 700, opacity: item.quantity <= 1 ? .3 : 1 }}>−</button>
                                  <span style={{ width: 36, textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#111827' }}>{isU ? '…' : item.quantity}</span>
                                  <button onClick={() => updateQty(item.product_id, item.quantity + 1)} disabled={isU} style={{ width: 36, height: 36, border: 'none', background: 'transparent', fontSize: 17, cursor: 'pointer', color: '#374151', fontWeight: 700 }}>+</button>
                                </div>

                                {/* Line total */}
                                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 108 }}>
                                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#1a2341' }}>{fmt(price * item.quantity)}</p>
                                  {item.quantity > 1 && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>{item.quantity} × {fmt(price)}</p>}
                                </div>

                                {/* Remove */}
                                <button onClick={() => removeItem(item.product_id)} disabled={isU} style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>✕</button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '10px 18px', borderRadius: 10, border: '1.5px solid #e5e7eb', color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 600, background: '#fff' }}>← Tiếp tục mua sắm</Link>
                </div>

                {/* RIGHT — Summary (desktop only, tablet shows below) */}
                {!isTablet && (
                  <div style={{ position: 'sticky', top: 82, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <SummaryCard
                      selected={selected} selectedItems={selectedItems} subtotal={subtotal}
                      itemCount={itemCount} shipping={shipping} savings={savings} total={total}
                      SHIP_FREE={SHIP_FREE} goCheckout={goCheckout}
                    />
                  </div>
                )}

                {/* Tablet: summary below list */}
                {isTablet && (
                  <div style={{ marginTop: 8 }}>
                    <SummaryCard
                      selected={selected} selectedItems={selectedItems} subtotal={subtotal}
                      itemCount={itemCount} shipping={shipping} savings={savings} total={total}
                      SHIP_FREE={SHIP_FREE} goCheckout={goCheckout}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* ── Mobile layout ── */
              <div>
                {/* Select all */}
                <div style={{ background: '#fff', borderRadius: 12, padding: '11px 14px', marginBottom: 8, border: '1.5px solid #f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, color: '#374151', fontSize: 13 }} onClick={toggleAll}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected.size === items.length ? '#2563eb' : '#d1d5db'}`, background: selected.size === items.length ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>
                      {selected.size === items.length && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
                      {selected.size > 0 && selected.size < items.length && <span style={{ color: '#2563eb', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>−</span>}
                    </div>
                    Chọn tất cả ({items.length})
                  </label>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Đã chọn: <strong style={{ color: '#1a2341' }}>{selected.size}</strong></span>
                </div>

                {/* Mobile item cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {items.map(item => {
                    const price    = item.sale_price || item.price
                    const oldPrice = item.sale_price ? item.price : null
                    const discount = oldPrice ? Math.round((1 - item.sale_price / item.price) * 100) : null
                    const img      = item.image ? `http://localhost:5000/static/uploads/${item.image}` : 'https://placehold.co/80x64?text=Laptop'
                    const isU      = updating === item.product_id
                    const isSel    = selected.has(item.product_id)

                    return (
                      <div key={item.product_id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        {/* Checkbox */}
                        <div onClick={() => toggleSelect(item.product_id)}
                          style={{ width: 20, height: 20, marginTop: 4, borderRadius: 6, border: `2px solid ${isSel ? '#2563eb' : '#d1d5db'}`, background: isSel ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          {isSel && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
                        </div>
                        {/* Card */}
                        <div style={{
                          flex: 1, background: '#fff', borderRadius: 14, padding: '12px', overflow: 'hidden',
                          border: `1.5px solid ${isSel ? '#bfdbfe' : '#f0f0f5'}`,
                          opacity: isU ? .65 : 1, transition: 'all .2s',
                        }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            {/* Image */}
                            <Link to={`/products/${item.slug}`}>
                              <div style={{ width: 72, height: 58, background: 'linear-gradient(135deg,#f8fafc,#f0f4ff)', borderRadius: 10, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                                <img src={img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} onError={e => e.target.src = 'https://placehold.co/72x58?text=?'} />
                                {discount && <span style={{ position: 'absolute', top: 2, left: 2, background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 5 }}>-{discount}%</span>}
                              </div>
                            </Link>
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: '0 0 1px', fontSize: 9, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6 }}>{item.brand_name}</p>
                              <Link to={`/products/${item.slug}`} style={{ textDecoration: 'none' }}>
                                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</p>
                              </Link>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ fontSize: 14, fontWeight: 900, color: '#ef4444' }}>{fmt(price)}</span>
                                {oldPrice && <span style={{ fontSize: 10, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(oldPrice)}</span>}
                              </div>
                            </div>
                            {/* Remove */}
                            <button onClick={() => removeItem(item.product_id)} disabled={isU}
                              style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                          </div>

                          {/* Bottom row: qty + total */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: 9, border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
                              <button onClick={() => updateQty(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1 || isU}
                                style={{ width: 32, height: 32, border: 'none', background: 'transparent', fontSize: 16, cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', color: '#374151', fontWeight: 700, opacity: item.quantity <= 1 ? .3 : 1 }}>−</button>
                              <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#111827' }}>{isU ? '…' : item.quantity}</span>
                              <button onClick={() => updateQty(item.product_id, item.quantity + 1)} disabled={isU}
                                style={{ width: 32, height: 32, border: 'none', background: 'transparent', fontSize: 16, cursor: 'pointer', color: '#374151', fontWeight: 700 }}>+</button>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#1a2341' }}>{fmt(price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', color: '#374151', textDecoration: 'none', fontSize: 13, fontWeight: 600, background: '#fff' }}>← Tiếp tục mua sắm</Link>

                {/* Mobile summary */}
                <SummaryCard
                  selected={selected} selectedItems={selectedItems} subtotal={subtotal}
                  itemCount={itemCount} shipping={shipping} savings={savings} total={total}
                  SHIP_FREE={SHIP_FREE} goCheckout={goCheckout} isMobile
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile sticky checkout bar */}
      {isMobile && items.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTop: '1px solid #e5e7eb',
          padding: '10px 14px', zIndex: 150,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 -4px 20px rgba(0,0,0,.1)',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>Đã chọn {selected.size} sản phẩm</p>
            {selected.size > 0 && <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ef4444' }}>{fmt(total)}</p>}
          </div>
          <button onClick={goCheckout}
            style={{ padding: '12px 24px', borderRadius: 12, background: selected.size === 0 ? '#e5e7eb' : 'linear-gradient(135deg,#1a2341,#2563eb)', color: selected.size === 0 ? '#9ca3af' : '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: selected.size === 0 ? 'not-allowed' : 'pointer', boxShadow: selected.size === 0 ? 'none' : '0 6px 20px rgba(37,99,235,.3)', whiteSpace: 'nowrap' }}>
            {selected.size === 0 ? 'Chọn sản phẩm' : `💳 Thanh toán (${selected.size})`}
          </button>
        </div>
      )}
      {/* Spacer for mobile sticky bar */}
      {isMobile && items.length > 0 && <div style={{ height: 72 }} />}
    </div>
  )
}

/* ── Summary Card Component ── */
function SummaryCard({ selected, selectedItems, subtotal, itemCount, shipping, savings, total, SHIP_FREE, goCheckout, isMobile }) {
  return (
    <>
      {/* Coupon hint */}
      <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', borderRadius: 14, padding: '12px 16px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>🎁</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e40af' }}>Có mã giảm giá?</p>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Nhập mã ở bước thanh toán</p>
        </div>
      </div>

      {/* Summary box */}
      <div style={{ background: '#fff', borderRadius: 18, padding: isMobile ? 18 : 24, border: '1.5px solid #f0f0f5', boxShadow: '0 8px 32px rgba(0,0,0,.07)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#111827' }}>📋 Tóm tắt đơn hàng</h3>

        {selected.size === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af' }}>
            <p style={{ fontSize: 26, margin: '0 0 6px' }}>☝️</p>
            <p style={{ margin: 0, fontSize: 13 }}>Chọn sản phẩm để xem tổng tiền</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14, maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedItems.map(it => {
                const price = it.sale_price || it.price
                const img   = it.image ? `http://localhost:5000/static/uploads/${it.image}` : null
                return (
                  <div key={it.product_id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 38, height: 30, borderRadius: 7, background: '#f8fafc', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      {img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />}
                      <span style={{ position: 'absolute', top: -4, right: -4, width: 15, height: 15, borderRadius: '50%', background: '#1a2341', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.quantity}</span>
                    </div>
                    <p style={{ flex: 1, margin: 0, fontSize: 12, color: '#374151', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.name}</p>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', flexShrink: 0 }}>{new Intl.NumberFormat('vi-VN').format((it.sale_price || it.price) * it.quantity)}đ</span>
                  </div>
                )
              })}
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SumRow label={`Tạm tính (${itemCount} sp)`} value={new Intl.NumberFormat('vi-VN').format(subtotal) + 'đ'} />
              <SumRow label="Phí giao hàng" value={shipping === 0 ? <span style={{ color: '#16a34a', fontWeight: 800 }}>🎉 Miễn phí</span> : new Intl.NumberFormat('vi-VN').format(shipping) + 'đ'} />
              {savings > 0 && <SumRow label="Tiết kiệm được" value={<span style={{ color: '#16a34a', fontWeight: 800 }}>-{new Intl.NumberFormat('vi-VN').format(savings)}đ</span>} />}
            </div>

            {subtotal > 0 && subtotal < SHIP_FREE && (
              <div style={{ background: '#eff6ff', borderRadius: 10, padding: '9px 12px', margin: '10px 0', fontSize: 12, color: '#2563eb', display: 'flex', gap: 6 }}>
                🚚 Mua thêm <strong>{new Intl.NumberFormat('vi-VN').format(SHIP_FREE - subtotal)}đ</strong> để miễn phí ship!
              </div>
            )}

            <div style={{ borderTop: '2px solid #f3f4f6', paddingTop: 12, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Tổng cộng</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{new Intl.NumberFormat('vi-VN').format(total)}đ</span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'right' }}>Đã bao gồm VAT</p>
            </div>
          </>
        )}

        {!isMobile && (
          <button
            onClick={goCheckout}
            style={{ width: '100%', marginTop: 16, padding: '14px 0', borderRadius: 13, background: selected.size === 0 ? '#e5e7eb' : 'linear-gradient(135deg,#1a2341,#2563eb)', color: selected.size === 0 ? '#9ca3af' : '#fff', border: 'none', fontSize: 15, fontWeight: 800, cursor: selected.size === 0 ? 'not-allowed' : 'pointer', boxShadow: selected.size === 0 ? 'none' : '0 8px 28px rgba(37,99,235,.3)', transition: 'all .2s' }}
          >
            {selected.size === 0 ? 'Chọn sản phẩm' : `💳 Thanh toán (${selected.size} sp) →`}
          </button>
        )}

        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[['🔒', 'Thanh toán an toàn'], ['🚚', 'Giao hàng nhanh'], ['↩️', 'Đổi trả 15 ngày'], ['🏆', 'Hàng chính hãng']].map(([ic, tx]) => (
            <div key={tx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ fontSize: 13 }}>{ic}</span>
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{tx}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}