// src/pages/OrdersPage.jsx
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { orderAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { IMG_BASE_URL } from '../constants/config';

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

const STATUS_MAP = {
  pending:    { label:'Chờ xác nhận', color:'#f59e0b', bg:'#fef3c7', icon:'🕐' },
  processing: { label:'Đang xử lý',   color:'#2563eb', bg:'#eff6ff', icon:'⚙️' },
  shipping:   { label:'Đang giao',    color:'#7c3aed', bg:'#f5f3ff', icon:'🚚' },
  delivered:  { label:'Đã giao',      color:'#16a34a', bg:'#f0fdf4', icon:'✅' },
  cancelled:  { label:'Đã hủy',       color:'#ef4444', bg:'#fef2f2', icon:'❌' },
}
const PAYMENT_STATUS = {
  unpaid:   { label:'Chưa thanh toán', color:'#f59e0b' },
  paid:     { label:'Đã thanh toán',   color:'#16a34a' },
  refunded: { label:'Đã hoàn tiền',    color:'#6b7280' },
}
const TABS = [
  { v:'',           label:'Tất cả' },
  { v:'pending',    label:'Chờ xác nhận' },
  { v:'processing', label:'Đang xử lý' },
  { v:'shipping',   label:'Đang giao' },
  { v:'delivered',  label:'Đã giao' },
  { v:'cancelled',  label:'Đã hủy' },
]

/* ── Navbar ── */
function MiniNav({ user, logout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isMobile } = useIsMobile()
  return (
    <nav style={{ background:'#1a2341', padding:`0 ${isMobile ? 14 : 24}px`, height:60,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(0,0,0,.2)' }}>
      <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:22 }}>💻</span>
        <span style={{ fontSize:17, fontWeight:900, color:'#fff' }}>Laptop<span style={{ color:'#60a5fa' }}>Store</span></span>
      </Link>

      {isMobile ? (
        <>
          <button onClick={() => setMenuOpen(o => !o)}
            style={{ background:'none', border:'none', color:'#fff', fontSize:22, cursor:'pointer', padding:6 }}>
            {menuOpen ? '✕' : '☰'}
          </button>
          {menuOpen && (
            <div style={{ position:'fixed', top:60, left:0, right:0, background:'#1a2341', padding:'12px 16px', display:'flex', flexDirection:'column', gap:6, zIndex:99, borderBottom:'1px solid rgba(255,255,255,.1)', boxShadow:'0 8px 24px rgba(0,0,0,.3)' }}>
              <Link to="/products" onClick={() => setMenuOpen(false)} style={nl}>🖥️ Sản phẩm</Link>
              <Link to="/cart"     onClick={() => setMenuOpen(false)} style={nl}>🛒 Giỏ hàng</Link>
              <Link to="/orders"   onClick={() => setMenuOpen(false)} style={{ ...nl, background:'rgba(255,255,255,.15)' }}>📦 Đơn hàng</Link>
              {user
                ? <button onClick={() => { logout(); setMenuOpen(false) }} style={{ ...nl, border:'none', cursor:'pointer', textAlign:'left' }}>🚪 Đăng xuất</button>
                : <Link to="/login" onClick={() => setMenuOpen(false)} style={nl}>👤 Đăng nhập</Link>
              }
            </div>
          )}
        </>
      ) : (
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Link to="/products" style={nl}>🖥️ Sản phẩm</Link>
          <Link to="/cart"     style={nl}>🛒 Giỏ hàng</Link>
          <Link to="/orders"   style={{ ...nl, background:'rgba(255,255,255,.15)' }}>📦 Đơn hàng</Link>
          {user
            ? <button onClick={logout} style={{ ...nl, border:'none', cursor:'pointer' }}>🚪 Đăng xuất</button>
            : <Link to="/login" style={nl}>👤 Đăng nhập</Link>
          }
        </div>
      )}
    </nav>
  )
}
const nl = { padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:600, color:'#e2e8f0', textDecoration:'none', background:'transparent' }

/* ── ReviewForm ── */
function ReviewForm({ item, productId, onDone }) {
  const [rating,     setRating]     = useState(5)
  const [hover,      setHover]      = useState(0)
  const [comment,    setComment]    = useState('')
  const [images,     setImages]     = useState([])
  const [previews,   setPreviews]   = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const fileRef = useRef(null)
  const LABELS = ['','Rất tệ','Tệ','Bình thường','Tốt','Rất tốt 🌟']

  const pickImages = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5)
    setImages(prev => { const combined = [...prev, ...files].slice(0, 5); setPreviews(combined.map(f => URL.createObjectURL(f))); return combined })
    e.target.value = ''
  }

  const removeImg = (idx) => {
    setImages(prev => { const a = [...prev]; a.splice(idx,1); return a })
    setPreviews(prev => { const a = [...prev]; URL.revokeObjectURL(a[idx]); a.splice(idx,1); return a })
  }

  const submit = async () => {
    if (!comment.trim() || comment.trim().length < 10) { toast.error('Đánh giá phải có ít nhất 10 ký tự'); return }
    const pid = Number(productId)
    if (!pid || isNaN(pid)) { toast.error('Không xác định được sản phẩm, vui lòng thử lại'); return }
    setSubmitting(true)
    try {
      let imageUrls = []
      if (images.length > 0) {
        const fd = new FormData()
        images.forEach(f => fd.append('images', f))
        try {
          const upRes = await api.post('/reviews/upload-images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
          imageUrls = upRes.data?.urls || []
        } catch { toast.warning('Không tải được ảnh, gửi đánh giá không có ảnh') }
      }
      await api.post(`/products/${pid}/reviews`, { rating, comment, image_urls: imageUrls })
      toast.success('✅ Gửi đánh giá thành công!')
      setDone(true)
      onDone?.()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể gửi đánh giá')
    } finally { setSubmitting(false) }
  }

  if (done) return (
    <div style={{ padding:'11px 14px', background:'#f0fdf4', borderRadius:10, border:'1px solid #bbf7d0', fontSize:13, color:'#16a34a', fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
      ✅ Đã đánh giá sản phẩm này
    </div>
  )

  return (
    <div style={{ background:'#f8fafc', borderRadius:12, padding:14, border:'1.5px solid #e5e7eb', marginTop:10 }}>
      <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:800, color:'#374151' }}>✍️ Đánh giá "{item.product_name}"</p>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{ display:'flex', gap:3 }}>
          {[1,2,3,4,5].map(i => (
            <span key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)}
              style={{ fontSize:24, cursor:'pointer', color: i <= (hover || rating) ? '#f59e0b' : '#e5e7eb', transition:'transform .1s', transform: (hover || rating) >= i ? 'scale(1.15)' : 'scale(1)', display:'inline-block' }}>★</span>
          ))}
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:'#f59e0b' }}>{LABELS[hover || rating]}</span>
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Chia sẻ trải nghiệm thực tế... (tối thiểu 10 ký tự)" rows={3}
        style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, resize:'vertical', fontFamily:'inherit', lineHeight:1.6, boxSizing:'border-box', outline:'none' }}
        onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:11, color: comment.length < 10 ? '#ef4444' : '#9ca3af' }}>
          {comment.length}/500 ký tự {comment.length < 10 && `(cần thêm ${10 - comment.length})`}
        </span>
      </div>
      <div style={{ marginBottom:12 }}>
        <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:'#6b7280' }}>📷 Thêm ảnh (tối đa 5 ảnh)</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {previews.map((url, idx) => (
            <div key={idx} style={{ position:'relative', width:60, height:60 }}>
              <img src={url} alt="" style={{ width:60, height:60, objectFit:'cover', borderRadius:8, border:'1.5px solid #e5e7eb' }} />
              <button onClick={() => removeImg(idx)} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'#ef4444', color:'#fff', border:'none', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>✕</button>
            </div>
          ))}
          {previews.length < 5 && (
            <button onClick={() => fileRef.current?.click()}
              style={{ width:60, height:60, borderRadius:8, border:'2px dashed #d1d5db', background:'#fff', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, transition:'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#2563eb'; e.currentTarget.style.background='#eff6ff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#d1d5db'; e.currentTarget.style.background='#fff' }}>
              <span style={{ fontSize:18 }}>📷</span>
              <span style={{ fontSize:9, color:'#9ca3af', fontWeight:700 }}>Thêm ảnh</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={pickImages} style={{ display:'none' }} />
      </div>
      <button onClick={submit} disabled={submitting || comment.trim().length < 10}
        style={{ padding:'9px 20px', borderRadius:9, border:'none', fontWeight:800, fontSize:13, cursor: submitting || comment.trim().length < 10 ? 'not-allowed' : 'pointer', background: submitting || comment.trim().length < 10 ? '#94a3b8' : 'linear-gradient(135deg,#1a2341,#2563eb)', color:'#fff', transition:'all .2s' }}>
        {submitting ? '⏳ Đang gửi...' : '📤 Gửi đánh giá'}
      </button>
    </div>
  )
}

/* ── Order detail modal ── */
function OrderModal({ order, onClose, onCancel, reviewedIds, onReviewed }) {
  const { isMobile } = useIsMobile()
  const s  = STATUS_MAP[order.status] || STATUS_MAP.pending
  const ps = PAYMENT_STATUS[order.payment_status] || PAYMENT_STATUS.unpaid
  const [openReview, setOpenReview] = useState(null)
  const TIMELINE = ['pending','processing','shipping','delivered']
  const curIdx   = TIMELINE.indexOf(order.status)
  const isDelivered = order.status === 'delivered'

  const buildAddress = (info) => {
    const parts = []
    if (info.address) parts.push(info.address)
    if (info.block) parts.push(`Khu phố ${info.block}`)
    if (info.ward) parts.push(info.ward)
    if (info.district) parts.push(info.district)
    if (info.province) parts.push(info.province)
    return parts.join(', ')
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile ? 12 : 20 }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, maxWidth:680, width:'100%', maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.2)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: isMobile ? '16px 16px' : '20px 24px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
          <div>
            <h3 style={{ margin:'0 0 3px', fontSize: isMobile ? 15 : 17, fontWeight:800, color:'#111827' }}>Chi tiết đơn #{order.order_code}</h3>
            <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>
              {new Date(order.created_at).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        <div style={{ padding: isMobile ? 14 : 24 }}>
          {/* Timeline */}
          {order.status !== 'cancelled' && (
            <div style={{ marginBottom:24, overflowX: isMobile ? 'auto' : 'visible' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', minWidth: isMobile ? 320 : 'auto' }}>
                <div style={{ position:'absolute', top:18, left:'10%', right:'10%', height:2, background:'#e5e7eb', zIndex:0 }} />
                <div style={{ position:'absolute', top:18, left:'10%', height:2, zIndex:0, background:'#16a34a', width:`${Math.min(curIdx / (TIMELINE.length-1) * 80, 80)}%`, transition:'width .5s ease' }} />
                {TIMELINE.map((st, i) => {
                  const sm   = STATUS_MAP[st]
                  const done = i <= curIdx
                  return (
                    <div key={st} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, zIndex:1 }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', border:`3px solid ${done ? '#16a34a' : '#e5e7eb'}`, background: done ? '#16a34a' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, transition:'all .3s' }}>
                        {done ? <span style={{ color:'#fff', fontWeight:800 }}>✓</span> : <span style={{ color:'#9ca3af' }}>{i+1}</span>}
                      </div>
                      <span style={{ fontSize: isMobile ? 10 : 11, fontWeight:600, color: done ? '#16a34a' : '#9ca3af', textAlign:'center' }}>{sm.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Status badges */}
          <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
            <span style={{ padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:700, background: s.bg, color: s.color }}>{s.icon} {s.label}</span>
            <span style={{ padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:'#f3f4f6', color: ps.color }}>💳 {ps.label}</span>
            <span style={{ padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:'#f3f4f6', color:'#6b7280' }}>📦 {order.payment_method?.toUpperCase()}</span>
          </div>

          {/* Products */}
          <div style={{ background:'#f8fafc', borderRadius:12, padding: isMobile ? 12 : 16, marginBottom:18 }}>
            <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:'#374151' }}>
              Sản phẩm đã đặt
              {isDelivered && <span style={{ marginLeft:8, fontSize:12, color:'#16a34a', fontWeight:600 }}>— Nhấn "Đánh giá" để review</span>}
            </h4>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {(order.items || []).map((it, i) => {
                const img = it.product_image ? `${IMG_BASE_URL}/${it.product_image}` : 'https://placehold.co/56x44?text=?'
                const pid = it.product_id ?? null
                const reviewed = reviewedIds?.has(pid) || false
                const isOpen   = openReview === pid
                return (
                  <div key={i}>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <img src={img} alt={it.product_name} style={{ width: isMobile ? 44 : 56, height: isMobile ? 36 : 44, objectFit:'contain', borderRadius:8, background:'#fff', padding:4, flexShrink:0 }} onError={e => e.target.src='https://placehold.co/56x44?text=?'} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:0, fontSize: isMobile ? 12 : 14, fontWeight:600, color:'#111827', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{it.product_name}</p>
                        <p style={{ margin:'2px 0 0', fontSize:12, color:'#6b7280' }}>x{it.quantity} · {fmt(it.unit_price)}/cái</p>
                      </div>
                      <span style={{ fontWeight:700, color:'#374151', fontSize: isMobile ? 12 : 14, flexShrink:0 }}>{fmt(it.subtotal)}</span>
                      {isDelivered && (
                        reviewed ? (
                          <span style={{ padding:'4px 10px', borderRadius:20, background:'#f0fdf4', color:'#16a34a', fontSize:11, fontWeight:700, flexShrink:0, whiteSpace:'nowrap' }}>✅ Đã đánh giá</span>
                        ) : (
                          <button onClick={() => setOpenReview(isOpen ? null : pid)}
                            style={{ padding:'5px 12px', borderRadius:8, border:`1.5px solid ${isOpen ? '#ef4444' : '#2563eb'}`, background:'#fff', color: isOpen ? '#ef4444' : '#2563eb', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap', transition:'all .2s' }}>
                            {isOpen ? '✕ Đóng' : '✍️ Đánh giá'}
                          </button>
                        )
                      )}
                    </div>
                    {isDelivered && isOpen && !reviewed && (
                      <ReviewForm item={it} productId={pid} onDone={() => { setOpenReview(null); onReviewed?.(pid) }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Price summary */}
          <div style={{ background:'#f8fafc', borderRadius:12, padding: isMobile ? 12 : 16, marginBottom:18 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <PRRow label="Tạm tính"  value={fmt(order.total_price)} />
              {order.discount > 0 && <PRRow label="Giảm giá" value={<span style={{color:'#16a34a'}}>-{fmt(order.discount)}</span>} />}
              <PRRow label="Phí ship"  value={order.shipping_fee > 0 ? fmt(order.shipping_fee) : <span style={{color:'#16a34a'}}>Miễn phí</span>} />
              <div style={{ borderTop:'1.5px solid #e5e7eb', paddingTop:8, marginTop:4, display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontWeight:800, color:'#111827' }}>Tổng cộng</span>
                <span style={{ fontSize:18, fontWeight:900, color:'#ef4444' }}>{fmt(order.final_price)}</span>
              </div>
            </div>
          </div>

          {/* Shipping info */}
          {order.shipping_info && (
            <div style={{ background:'#eff6ff', borderRadius:12, padding: isMobile ? 12 : 16, marginBottom:18, border:'1px solid #bfdbfe' }}>
              <h4 style={{ margin:'0 0 8px', fontSize:14, fontWeight:700, color:'#1d4ed8' }}>📍 Địa chỉ giao hàng</h4>
              <p style={{ margin:'0 0 2px', fontWeight:600, color:'#111827', fontSize: isMobile ? 13 : 14 }}>
                {order.shipping_info.receiver_name} · {order.shipping_info.receiver_phone}
              </p>
              <p style={{ margin:0, color:'#6b7280', fontSize:13, lineHeight:1.5 }}>
                {buildAddress(order.shipping_info)}
              </p>
            </div>
          )}

          {/* Note */}
          {order.note && (
            <div style={{ background:'#fffbeb', borderRadius:10, padding:12, marginBottom:16, border:'1px solid #fde68a' }}>
              <p style={{ margin:0, fontSize:13, color:'#92400e' }}>📝 Ghi chú: {order.note}</p>
            </div>
          )}

          {/* Cancel */}
          {(order.status === 'pending' || order.status === 'processing') && (
            <button onClick={() => onCancel(order.id)}
              style={{ width:'100%', padding:'12px 0', borderRadius:12, border:'1.5px solid #ef4444', color:'#ef4444', background:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color='#ef4444' }}>
              🚫 Hủy đơn hàng
            </button>
          )}

          {/* Review banner */}
          {isDelivered && (order.items || []).some(it => !reviewedIds?.has(it.product_id)) && (
            <div style={{ background:'linear-gradient(135deg,#fffbeb,#fef3c7)', borderRadius:12, padding:'12px 16px', border:'1px solid #fde68a', display:'flex', alignItems:'center', gap:10, marginTop:14 }}>
              <span style={{ fontSize:22 }}>⭐</span>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#92400e' }}>Bạn chưa đánh giá tất cả sản phẩm</p>
                <p style={{ margin:0, fontSize:12, color:'#b45309' }}>Nhấn "✍️ Đánh giá" bên cạnh từng sản phẩm để chia sẻ trải nghiệm</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PRRow({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between' }}>
      <span style={{ fontSize:13, color:'#6b7280' }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{value}</span>
    </div>
  )
}

export default function OrdersPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { isMobile } = useIsMobile()
  const [orders,      setOrders]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('')
  const [selected,    setSelected]    = useState(null)
  const [page,        setPage]        = useState(1)
  const [total,       setTotal]       = useState(0)
  const [reviewedIds, setReviewedIds] = useState(new Set())
  const PER_PAGE = 8

  const load = async (tabVal = tab, pg = page) => {
    setLoading(true)
    try {
      const params = { page: pg, per_page: PER_PAGE }
      if (tabVal) params.status = tabVal
      const res = await api.get('/orders', { params })
      setOrders(res.data?.data || [])
      setTotal(res.data?.pagination?.total || 0)
    } catch { toast.error('Không thể tải đơn hàng') }
    finally  { setLoading(false) }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentResult = params.get('payment')
    if (paymentResult === 'success') {
      toast.success('🎉 Thanh toán thành công! Đơn hàng đã được xác nhận.')
      window.history.replaceState({}, '', '/orders')
    } else if (paymentResult === 'error') {
      toast.error('❌ Thanh toán thất bại. Vui lòng thử lại hoặc chọn phương thức khác.')
      window.history.replaceState({}, '', '/orders')
    }
  }, [])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    load()
  }, [user, tab, page])

  const openDetail = async (order) => {
    try {
      const res = await api.get(`/orders/${order.id}`)
      setSelected(res.data?.data || order)
    } catch { setSelected(order) }
  }

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return
    try {
      await orderAPI.cancel(orderId, 'Khách hủy')
      toast.success('Đã hủy đơn hàng')
      setSelected(null)
      load()
    } catch (e) { toast.error(e.response?.data?.message || 'Không thể hủy') }
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:"'Be Vietnam Pro','Segoe UI',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>
      <MiniNav user={user} logout={logout} />

      <div style={{ maxWidth:1000, margin:'0 auto', padding: isMobile ? '18px 12px' : '32px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>
          <Link to="/" style={{ color:'#6b7280', textDecoration:'none' }}>Trang chủ</Link> ›{' '}
          <span style={{ color:'#111827', fontWeight:600 }}>Đơn hàng của tôi</span>
        </div>

        <h1 style={{ margin:'0 0 20px', fontSize: isMobile ? 22 : 26, fontWeight:900, color:'#111827' }}>📦 Đơn hàng của tôi</h1>

        {/* Status tabs — scrollable on mobile */}
        <div style={{ display:'flex', gap:6, marginBottom:20, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
          {TABS.map(t => (
            <button key={t.v} onClick={() => { setTab(t.v); setPage(1) }}
              style={{
                padding: isMobile ? '7px 14px' : '8px 18px', borderRadius:50, border:'none',
                background: tab===t.v ? '#1a2341' : '#fff',
                color: tab===t.v ? '#fff' : '#374151',
                fontWeight:700, fontSize: isMobile ? 12 : 13, cursor:'pointer',
                whiteSpace:'nowrap', transition:'all .2s',
                boxShadow: tab===t.v ? '0 4px 12px rgba(26,35,65,.25)' : '0 1px 4px rgba(0,0,0,.06)',
                flexShrink: 0,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ width:36, height:36, margin:'0 auto', border:'4px solid #e5e7eb', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 16px', background:'#fff', borderRadius:16, border:'1.5px solid #f0f0f5' }}>
            <div style={{ fontSize:56, marginBottom:14 }}>📦</div>
            <h3 style={{ fontWeight:800, color:'#111827', marginBottom:8, fontSize: isMobile ? 16 : 18 }}>
              {tab ? `Không có đơn hàng "${STATUS_MAP[tab]?.label}"` : 'Chưa có đơn hàng nào'}
            </h3>
            <p style={{ color:'#6b7280', marginBottom:20, fontSize:14 }}>Mua sắm ngay để có đơn hàng đầu tiên!</p>
            <Link to="/products" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', background:'#1a2341', color:'#fff', borderRadius:12, fontWeight:700, textDecoration:'none', fontSize:14 }}>🛍️ Mua sắm ngay</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {orders.map(order => {
              const s  = STATUS_MAP[order.status] || STATUS_MAP.pending
              const ps = PAYMENT_STATUS[order.payment_status] || PAYMENT_STATUS.unpaid
              return (
                <div key={order.id} style={{
                  background:'#fff', borderRadius:16, border:'1.5px solid #f0f0f5',
                  overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.04)',
                  transition:'box-shadow .2s', animation:'fadeUp .3s ease',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.04)'}
                >
                  {/* Order header */}
                  <div style={{ padding: isMobile ? '11px 14px' : '14px 20px', background:'#f9fafb', borderBottom:'1px solid #f3f4f6',
                    display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <span style={{ fontSize: isMobile ? 13 : 14, fontWeight:800, color:'#111827' }}>#{order.order_code}</span>
                      <span style={{ fontSize:12, color:'#9ca3af' }}>
                        {new Date(order.created_at).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })}
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700, background: s.bg, color: s.color }}>{s.icon} {s.label}</span>
                      <span style={{ fontSize:11, fontWeight:600, color: ps.color }}>· {ps.label}</span>
                    </div>
                  </div>

                  {/* Products preview */}
                  <div style={{ padding: isMobile ? '11px 14px' : '14px 20px', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ display:'flex', flexShrink:0 }}>
                      {(order.items || []).slice(0, isMobile ? 2 : 3).map((it, i) => {
                        const img = it.product_image ? `${IMG_BASE_URL}/${it.product_image}` : 'https://placehold.co/52x40?text=?'
                        return (
                          <img key={i} src={img} alt={it.product_name}
                            style={{ width: isMobile ? 44 : 52, height: isMobile ? 34 : 40, objectFit:'contain', borderRadius:8,
                              background:'#f8fafc', padding:3, border:'1.5px solid #f0f0f5',
                              marginLeft: i > 0 ? -8 : 0 }}
                            onError={e => e.target.src='https://placehold.co/52x40?text=?'} />
                        )
                      })}
                      {(order.items||[]).length > (isMobile ? 2 : 3) && (
                        <div style={{ width: isMobile ? 44 : 52, height: isMobile ? 34 : 40, borderRadius:8, background:'#f3f4f6',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:11, fontWeight:700, color:'#6b7280', border:'1.5px solid #e5e7eb', marginLeft:-8 }}>
                          +{(order.items||[]).length - (isMobile ? 2 : 3)}
                        </div>
                      )}
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize: isMobile ? 12 : 14, color:'#374151', display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {(order.items||[]).map(it => it.product_name).join(', ')}
                      </p>
                      <p style={{ margin:'2px 0 0', fontSize:11, color:'#9ca3af' }}>{(order.items||[]).length} sản phẩm</p>
                    </div>

                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ margin:0, fontSize: isMobile ? 15 : 17, fontWeight:900, color:'#ef4444' }}>{fmt(order.final_price)}</p>
                      <p style={{ margin:'2px 0 0', fontSize:11, color:'#9ca3af' }}>{order.payment_method?.toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ padding: isMobile ? '9px 14px' : '10px 20px', borderTop:'1px solid #f9fafb',
                    display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                    <button onClick={() => openDetail(order)}
                      style={{ padding: isMobile ? '6px 12px' : '7px 16px', borderRadius:8, border:'1.5px solid #1a2341', color:'#1a2341', background:'transparent', fontWeight:700, fontSize: isMobile ? 12 : 13, cursor:'pointer', transition:'all .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#1a2341'; e.currentTarget.style.color='#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#1a2341' }}>
                      Xem chi tiết →
                    </button>

                    <div style={{ display:'flex', gap:6 }}>
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button onClick={() => cancelOrder(order.id)}
                          style={{ padding: isMobile ? '6px 10px' : '7px 14px', borderRadius:8, border:'1.5px solid #ef4444', color:'#ef4444', background:'transparent', fontWeight:600, fontSize: isMobile ? 11 : 13, cursor:'pointer' }}>
                          Hủy đơn
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <Link to="/products"
                          style={{ padding: isMobile ? '6px 10px' : '7px 14px', borderRadius:8, border:'1.5px solid #2563eb', color:'#2563eb', fontWeight:600, fontSize: isMobile ? 11 : 13, textDecoration:'none' }}>
                          Mua lại
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:24, flexWrap:'wrap' }}>
            <PageBtn onClick={() => setPage(p => p-1)} disabled={page<=1} label="‹" />
            {Array.from({length: totalPages}, (_,i) => i+1)
              .filter(p => Math.abs(p - page) <= 2)
              .map(p => <PageBtn key={p} onClick={() => setPage(p)} active={p===page} label={p} />)}
            <PageBtn onClick={() => setPage(p => p+1)} disabled={page>=totalPages} label="›" />
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onCancel={cancelOrder}
          reviewedIds={reviewedIds}
          onReviewed={(pid) => setReviewedIds(prev => new Set([...prev, pid]))}
        />
      )}
    </div>
  )
}

function PageBtn({ onClick, disabled, active, label }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ minWidth:36, height:36, padding:'0 10px', borderRadius:8, border: active ? 'none' : '1.5px solid #e5e7eb', background: active ? '#1a2341' : '#fff', color: active ? '#fff' : '#374151', fontWeight: active ? 800 : 600, fontSize:14, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .4 : 1, transition:'all .2s' }}>
      {label}
    </button>
  )
}