// src/pages/ProductDetailPage.jsx
import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { IMG_BASE_URL } from '../constants/config'
// Import Navbar from ProductsPage (shared component)
import { Navbar } from './ProductsPage'

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
const IMG = (url) => url ? `${IMG_BASE_URL}/${url}` : null

/* ─────────────────── STARS ─────────────────── */
function Stars({ rating, size = 16, interactive = false, onRate }) {
  const [hover, setHover] = useState(0)
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate?.(i)}
          style={{ fontSize: size, color: i <= (hover || Math.round(rating)) ? '#f59e0b' : '#e5e7eb', cursor: interactive ? 'pointer' : 'default', transition: 'transform .1s', transform: interactive && hover >= i ? 'scale(1.2)' : 'scale(1)' }}
        >★</span>
      ))}
    </span>
  )
}

/* ─────────────────── SPEC ROW ─────────────────── */
function SpecRow({ label, value, highlight }) {
  if (!value) return null
  return (
    <tr>
      <td style={{ padding: '11px 16px', background: '#f8fafc', fontWeight: 700, fontSize: 13, color: '#374151', width: '36%', borderBottom: '1px solid #f1f5f9' }}>{label}</td>
      <td style={{ padding: '11px 16px', fontSize: 13, borderBottom: '1px solid #f1f5f9', fontWeight: highlight ? 700 : 400, color: highlight ? '#1a2341' : '#111827' }}>{value}</td>
    </tr>
  )
}

/* ─────────────────── CART FLY ─────────────────── */
function CartFlyEffect({ origin, onDone }) {
  const [style, setStyle] = useState({
    position: 'fixed',
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#2563eb,#1a2341)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
    color: '#fff',
    zIndex: 9999,
    pointerEvents: 'none',
    left: origin.x,
    top: origin.y,
    transition: 'none',
    boxShadow: '0 4px 16px rgba(37,99,235,.5)',
  })

  useEffect(() => {
    const target = document.querySelector('.cart-icon-target')
    if (!target) { onDone(); return }
    const rect = target.getBoundingClientRect()
    const tx = rect.left + rect.width / 2 - 18
    const ty = rect.top + rect.height / 2 - 18

    requestAnimationFrame(() => {
      setTimeout(() => {
        setStyle(s => ({
          ...s,
          left: tx,
          top: ty,
          transform: 'scale(0.2)',
          opacity: 0,
          transition: 'all .65s cubic-bezier(.25,.46,.45,.94)',
        }))
      }, 30)
    })

    const t = setTimeout(onDone, 700)
    return () => clearTimeout(t)
  }, [])

  return <div style={style}>🛒</div>
}

/* ─────────────────── MAIN PAGE ─────────────────── */
export default function ProductDetailPage() {
  const { slug }   = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const addBtnRef  = useRef(null)

  const [product,      setProduct]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [activeImg,    setActiveImg]    = useState(0)
  const [activeTab,    setActiveTab]    = useState('specs')
  const [qty,          setQty]          = useState(1)
  const [addingCart,   setAddingCart]   = useState(false)
  const [addedCart,    setAddedCart]    = useState(false)
  const [imgZoom,      setImgZoom]      = useState(false)

  // Cart animation
  const [flyEffects, setFlyEffects] = useState([])
  const [cartBump,   setCartBump]   = useState(false)

  // Review
  const [myRating,      setMyRating]      = useState(5)
  const [myComment,     setMyComment]     = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [hasPurchased,  setHasPurchased]  = useState(false)
  const [hasReviewed,   setHasReviewed]   = useState(false)
  const [reviewImages,    setReviewImages]    = useState([])
  const [previewUrls,     setPreviewUrls]     = useState([])
  const [uploadedUrls,    setUploadedUrls]    = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    setLoading(true); setActiveImg(0)
    api.get(`/products/${slug}`)
      .then(res => { if (res.data.success) setProduct(res.data.data); else navigate('/products') })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!user || !product) return
    api.get('/orders', { params: { status: 'delivered', per_page: 50 } })
      .then(res => {
        const orders = res.data?.data || []
        setHasPurchased(orders.some(o => (o.items || []).some(it => it.product_id === product.id || it.product_name === product.name)))
      }).catch(() => {})
    const existingReview = (product.reviews || []).find(r => r.user_id === user.id)
    if (existingReview) { setHasReviewed(true); setMyRating(existingReview.rating); setMyComment(existingReview.comment || '') }
  }, [user, product])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: "'Be Vietnam Pro',sans-serif", background: '#f8fafc' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, gap: 16 }}>
        <div style={{ width: 48, height: 48, border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <p style={{ color: '#6b7280', fontWeight: 600 }}>Đang tải sản phẩm...</p>
      </div>
    </div>
  )
  if (!product) return null

  const price    = product.sale_price || product.price
  const oldPrice = product.sale_price ? product.price : null
  const discount = oldPrice ? Math.round((1 - product.sale_price / product.price) * 100) : null
  const images   = product.images  || []
  const specs    = product.specs   || {}
  const reviews  = product.reviews || []
  const related  = product.related || []

  const triggerFly = () => {
    if (addBtnRef.current) {
      const rect = addBtnRef.current.getBoundingClientRect()
      const id = Date.now()
      setFlyEffects(prev => [...prev, { id, origin: { x: rect.left + rect.width / 2 - 18, y: rect.top + rect.height / 2 - 18 } }])
    }
  }

  const handleFlyDone = (id) => {
    setFlyEffects(prev => prev.filter(f => f.id !== id))
    setCartBump(true)
    setTimeout(() => setCartBump(false), 500)
  }

  const handleAddToCart = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng'); navigate('/login'); return }
    triggerFly()
    setAddingCart(true)
    try {
      await api.post('/cart', { product_id: product.id, quantity: qty })
      setAddedCart(true)
      toast.success(`✅ Đã thêm ${qty} sản phẩm vào giỏ hàng!`)
      setTimeout(() => setAddedCart(false), 2500)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể thêm vào giỏ hàng')
    } finally { setAddingCart(false) }
  }

  const handleBuyNow = () => {
    if (!user) { toast.error('Vui lòng đăng nhập để mua hàng'); navigate('/login'); return }
    // Lưu thông tin sản phẩm mua ngay vào sessionStorage — KHÔNG thêm vào giỏ hàng
    const buyNowItem = {
      product_id: product.id,
      name:       product.name,
      price:      product.price,
      sale_price: product.sale_price || null,
      image:      product.images?.[0]?.url || null,
      brand_name: product.brand_name || '',
      slug:       product.slug,
      quantity:   qty,
    }
    sessionStorage.setItem('buy_now_item', JSON.stringify(buyNowItem))
    // Xoá checkout_selected để CheckoutPage biết đây là luồng mua ngay
    sessionStorage.removeItem('checkout_selected')
    navigate('/checkout')
  }

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files || [])
    if (reviewImages.length + files.length > 5) { toast.warning('Tối đa 5 ảnh cho mỗi đánh giá'); return }
    const validFiles = files.filter(f => { if (f.size > 5 * 1024 * 1024) { toast.warning(`${f.name} vượt quá 5MB`); return false } return true })
    setReviewImages(prev => [...prev, ...validFiles])
    setPreviewUrls(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeImage = (idx) => {
    URL.revokeObjectURL(previewUrls[idx])
    setReviewImages(prev => prev.filter((_, i) => i !== idx))
    setPreviewUrls(prev => prev.filter((_, i) => i !== idx))
    setUploadedUrls(prev => prev.filter((_, i) => i !== idx))
  }

  const submitReview = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập để đánh giá'); navigate('/login'); return }
    if (!myComment.trim()) { toast.error('Vui lòng nhập nội dung đánh giá'); return }
    if (myComment.trim().length < 10) { toast.error('Đánh giá phải có ít nhất 10 ký tự'); return }
    const pid = product?.id
    if (!pid) { toast.error('Không xác định được sản phẩm'); return }
    setSubmitting(true)
    try {
      let finalImageUrls = []
      if (reviewImages.length > 0) {
        setUploadingImages(true)
        const form = new FormData()
        reviewImages.forEach(f => form.append('images', f))
        try {
          const upRes = await api.post('/reviews/upload-images', form, { headers: { 'Content-Type': 'multipart/form-data' } })
          finalImageUrls = upRes.data?.urls || []
        } catch { toast.warning('Không thể tải ảnh, sẽ gửi đánh giá không có ảnh') }
        setUploadingImages(false)
      }
      await api.post(`/products/${pid}/reviews`, { rating: myRating, comment: myComment, image_urls: finalImageUrls })
      toast.success(hasReviewed ? '✅ Đã cập nhật đánh giá!' : '✅ Gửi đánh giá thành công!')
      setHasReviewed(true)
      previewUrls.forEach(u => URL.revokeObjectURL(u))
      setReviewImages([]); setPreviewUrls([]); setUploadedUrls(finalImageUrls)
      const res = await api.get(`/products/${slug}`)
      if (res.data.success) setProduct(res.data.data)
    } catch (e) { toast.error(e.response?.data?.message || 'Không thể gửi đánh giá') }
    finally { setSubmitting(false) }
  }

  const TABS = [
    { key: 'specs',   label: '📋 Thông số' },
    { key: 'reviews', label: `⭐ Đánh giá (${product.review_count || 0})` },
    { key: 'desc',    label: '📄 Mô tả' },
  ]

  return (
    <div style={{ fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0;transform:translateY(12px) } to { opacity:1;transform:none } }
        @keyframes zoomIn  { from { opacity:0;transform:scale(.95) } to { opacity:1;transform:scale(1) } }
        @keyframes cartBump { 0%{transform:scale(1)} 30%{transform:scale(1.45) rotate(-12deg)} 60%{transform:scale(0.88) rotate(6deg)} 100%{transform:scale(1)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes addedPop { 0%{transform:scale(1)} 40%{transform:scale(1.08)} 100%{transform:scale(1)} }
        * { box-sizing: border-box }
        textarea:focus, input:focus { border-color:#2563eb !important; box-shadow:0 0 0 3px rgba(37,99,235,.1) !important; outline:none }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .nav-links { display: none !important }
          .nav-search { display: none !important }
          .hamburger { display: flex !important }
          .detail-grid { grid-template-columns: 1fr !important; gap: 20px !important }
          .specs-grid  { grid-template-columns: 1fr 1fr !important }
        }
        @media (max-width: 600px) {
          .detail-top  { padding: 16px !important }
          .detail-outer { padding: 12px 10px !important }
          .btn-group   { flex-direction: column !important }
          .specs-grid  { grid-template-columns: 1fr !important }
          .tab-bar     { overflow-x: auto; -webkit-overflow-scrolling: touch }
          .thumb-strip { gap: 6px !important }
          .commit-grid { grid-template-columns: 1fr 1fr !important }
          .related-grid { grid-template-columns: repeat(auto-fill, minmax(150px,1fr)) !important }
        }
      `}</style>

      {/* Flying cart effects */}
      {flyEffects.map(f => (
        <CartFlyEffect key={f.id} origin={f.origin} onDone={() => handleFlyDone(f.id)} />
      ))}

      {/* Shared Navbar */}
      <Navbar cartBump={cartBump} />

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '12px 20px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Trang chủ</Link>
          <span>›</span>
          <Link to="/products" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Sản phẩm</Link>
          <span>›</span>
          <Link to={`/products?category_id=${product.category_id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>{product.category_name}</Link>
          <span>›</span>
          <span style={{ color: '#374151', fontWeight: 700, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
        </div>
      </div>

      <div className="detail-outer" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── TOP: Image + Info ── */}
        <div className="detail-top" style={{ background: '#fff', borderRadius: 22, padding: '28px 28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,.05)' }}>
          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>

            {/* Images */}
            <div>
              <div style={{ borderRadius: 18, background: 'linear-gradient(135deg,#f8fafc,#f0f4ff)', padding: 24, marginBottom: 14, position: 'relative', border: '1.5px solid #f1f5f9', cursor: 'zoom-in', overflow: 'hidden' }}
                onClick={() => setImgZoom(true)}>
                {images.length > 0 ? (
                  <img
                    src={IMG(images[activeImg]?.url)}
                    alt={product.name}
                    style={{ width: '100%', height: 320, objectFit: 'contain', display: 'block', transition: 'transform .3s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    onError={e => { e.target.src = 'https://placehold.co/400x320/f1f5f9/94a3b8?text=Laptop' }}
                  />
                ) : (
                  <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, color: '#cbd5e1' }}>💻</div>
                )}
                {discount && (
                  <span style={{ position: 'absolute', top: 14, left: 14, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontWeight: 900, padding: '6px 13px', borderRadius: 20, fontSize: 14, boxShadow: '0 4px 12px rgba(239,68,68,.4)' }}>
                    -{discount}%
                  </span>
                )}
                {product.is_bestseller === 1 && (
                  <span style={{ position: 'absolute', top: 14, right: 14, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontWeight: 800, padding: '5px 10px', borderRadius: 18, fontSize: 12 }}>
                    🔥 Bán chạy
                  </span>
                )}
                <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: 12, padding: '4px 8px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
                  🔍 Phóng to
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="thumb-strip" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {images.map((img, idx) => (
                    <div key={idx} onClick={() => setActiveImg(idx)}
                      style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 12, overflow: 'hidden', border: `2.5px solid ${idx === activeImg ? '#2563eb' : '#f1f5f9'}`, cursor: 'pointer', background: '#f8fafc', padding: 6, transition: 'all .2s', boxShadow: idx === activeImg ? '0 4px 14px rgba(37,99,235,.25)' : 'none', transform: idx === activeImg ? 'scale(1.05)' : 'scale(1)' }}>
                      <img src={IMG(img.url)} alt={idx} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.target.src = 'https://placehold.co/60x60/f1f5f9/94a3b8?text=img' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              {/* Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <Link to={`/products?brand_id=${product.brand_id}`} style={{ background: '#eff6ff', color: '#2563eb', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>{product.brand_name}</Link>
                <Link to={`/products?category_id=${product.category_id}`} style={{ background: '#f0fdf4', color: '#16a34a', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>{product.category_name}</Link>
                {product.is_featured === 1 && <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>⭐ Nổi bật</span>}
              </div>

              <h1 style={{ margin: '0 0 14px', fontSize: 22, fontWeight: 900, color: '#111827', lineHeight: 1.4 }}>{product.name}</h1>

              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', background: '#fffbeb', borderRadius: 10, flexWrap: 'wrap' }}>
                <Stars rating={product.avg_rating} size={18} />
                <strong style={{ color: '#f59e0b', fontSize: 15 }}>{product.avg_rating?.toFixed(1)}</strong>
                <span style={{ color: '#9ca3af', fontSize: 13 }}>({product.review_count} đánh giá)</span>
                <span style={{ color: '#e5e7eb' }}>|</span>
                <span style={{ color: '#6b7280', fontSize: 13 }}>Đã bán: <strong style={{ color: '#111827' }}>{product.sold_count}</strong></span>
              </div>

              {/* Price */}
              <div style={{ background: 'linear-gradient(135deg,#fef2f2,#fff5f5)', borderRadius: 16, padding: '16px 20px', marginBottom: 18, border: '1px solid #fee2e2' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: 30, fontWeight: 900, color: '#ef4444', letterSpacing: -.5 }}>{fmt(price)}</span>
                  {oldPrice && <span style={{ fontSize: 16, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(oldPrice)}</span>}
                </div>
                {discount && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>Tiết kiệm {fmt(oldPrice - price)}</span>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>so với giá niêm yết</span>
                  </div>
                )}
              </div>

              {/* Short desc */}
              {product.short_desc && (
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.75, background: '#f8fafc', padding: '12px 16px', borderRadius: 10, borderLeft: '3px solid #2563eb', margin: '0 0 18px' }}>
                  {product.short_desc}
                </p>
              )}

              {/* Key specs */}
              {specs.cpu && (
                <div className="specs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {[
                    { icon: '🖥️', label: 'CPU',      value: specs.cpu?.split(',')[0]?.substring(0, 40) },
                    { icon: '💾', label: 'RAM',      value: specs.ram },
                    { icon: '💿', label: 'Ổ cứng',   value: specs.storage },
                    { icon: '🖼️', label: 'Màn hình', value: specs.display?.substring(0, 30) },
                  ].filter(s => s.value).map(s => (
                    <div key={s.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', border: '1px solid #f1f5f9', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                      <div>
                        <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Qty */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#374151' }}>
                  Số lượng:
                  <span style={{ marginLeft: 8, fontWeight: 500, color: product.quantity > 0 ? '#16a34a' : '#ef4444' }}>
                    {product.quantity > 0 ? `Còn ${product.quantity} sản phẩm` : 'Hết hàng'}
                  </span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: 12, border: '1.5px solid #e5e7eb', width: 'fit-content', overflow: 'hidden' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
                    style={{ width: 44, height: 44, border: 'none', background: 'transparent', fontSize: 20, cursor: qty <= 1 ? 'not-allowed' : 'pointer', color: '#374151', fontWeight: 700, opacity: qty <= 1 ? .3 : 1 }}>−</button>
                  <span style={{ width: 52, textAlign: 'center', fontSize: 16, fontWeight: 800, color: '#111827' }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.quantity, q + 1))} disabled={qty >= product.quantity}
                    style={{ width: 44, height: 44, border: 'none', background: 'transparent', fontSize: 20, cursor: qty >= product.quantity ? 'not-allowed' : 'pointer', color: '#374151', fontWeight: 700, opacity: qty >= product.quantity ? .3 : 1 }}>+</button>
                </div>
              </div>

              {/* Action buttons */}
              {product.quantity > 0 ? (
                <div className="btn-group" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                  {/* ADD TO CART — with animation */}
                  <button
                    ref={addBtnRef}
                    onClick={handleAddToCart}
                    disabled={addingCart}
                    style={{
                      flex: 1, minWidth: 150, padding: '14px 0',
                      background: addedCart ? 'linear-gradient(135deg,#16a34a,#15803d)' : addingCart ? '#f3f4f6' : '#fff',
                      color: addedCart ? '#fff' : addingCart ? '#9ca3af' : '#1a2341',
                      border: `2px solid ${addedCart ? '#16a34a' : addingCart ? '#e5e7eb' : '#1a2341'}`,
                      borderRadius: 13, fontWeight: 800, fontSize: 15,
                      cursor: addingCart ? 'not-allowed' : 'pointer',
                      transition: 'all .3s cubic-bezier(.4,0,.2,1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: addedCart ? '0 8px 24px rgba(22,163,74,.35)' : 'none',
                      animation: addedCart ? 'addedPop .3s ease' : 'none',
                    }}
                    onMouseEnter={e => { if (!addingCart && !addedCart) { e.currentTarget.style.background = '#1a2341'; e.currentTarget.style.color = '#fff' } }}
                    onMouseLeave={e => { if (!addingCart && !addedCart) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1a2341' } }}
                  >
                    {addingCart ? (
                      <>
                        <span style={{ display: 'inline-block', animation: 'spin .6s linear infinite', fontSize: 16 }}>⟳</span>
                        Đang thêm...
                      </>
                    ) : addedCart ? (
                      <>✓ Đã thêm vào giỏ!</>
                    ) : (
                      <>🛒 Thêm vào giỏ</>
                    )}
                  </button>
                  <button onClick={handleBuyNow} disabled={addingCart}
                    style={{ flex: 1, minWidth: 150, padding: '14px 0', background: addingCart ? '#94a3b8' : 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 13, fontWeight: 800, fontSize: 15, cursor: addingCart ? 'not-allowed' : 'pointer', boxShadow: addingCart ? 'none' : '0 8px 24px rgba(239,68,68,.35)', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onMouseEnter={e => { if (!addingCart) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(239,68,68,.45)' } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = addingCart ? 'none' : '0 8px 24px rgba(239,68,68,.35)' }}>
                    ⚡ Mua ngay
                  </button>
                </div>
              ) : (
                <button disabled style={{ width: '100%', padding: '14px 0', background: '#f3f4f6', color: '#9ca3af', border: 'none', borderRadius: 13, fontWeight: 800, fontSize: 15, cursor: 'not-allowed', marginBottom: 14 }}>
                  😔 Hết hàng — Thông báo khi có hàng
                </button>
              )}

              {product.quantity > 0 && product.quantity <= 5 && (
                <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                  <span>⚡</span>
                  <span style={{ fontSize: 13, color: '#92400e', fontWeight: 700 }}>Chỉ còn {product.quantity} sản phẩm!</span>
                </div>
              )}

              {/* Commitments */}
              <div className="commit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                {[['🏆', 'Hàng chính hãng 100%'], ['🚚', 'Giao hàng 1-3 ngày'], ['🔧', 'Bảo hành tận nơi'], ['↩️', 'Đổi trả 15 ngày']].map(([ic, tx]) => (
                  <div key={tx} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', background: '#f8fafc', borderRadius: 9, border: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 16 }}>{ic}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{tx}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ background: '#fff', borderRadius: 22, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div className="tab-bar" style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fdfdfd' }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ padding: '16px 22px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === tab.key ? 800 : 600, fontSize: 14, color: activeTab === tab.key ? '#1a2341' : '#6b7280', borderBottom: `3px solid ${activeTab === tab.key ? '#2563eb' : 'transparent'}`, transition: 'all .2s', whiteSpace: 'nowrap' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '24px 28px' }}>
            {/* Specs tab */}
            {activeTab === 'specs' && (
              <div style={{ animation: 'fadeUp .3s ease', overflowX: 'auto' }}>
                {Object.keys(specs).length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 12, overflow: 'hidden', border: '1px solid #f1f5f9', minWidth: 300 }}>
                    <tbody>
                      <SpecRow label="CPU / Bộ xử lý"       value={specs.cpu}        highlight />
                      <SpecRow label="RAM"                   value={specs.ram}        highlight />
                      <SpecRow label="Ổ cứng"               value={specs.storage}    highlight />
                      <SpecRow label="Màn hình"              value={specs.display}    />
                      <SpecRow label="Card đồ họa"           value={specs.gpu}        />
                      <SpecRow label="Hệ điều hành"         value={specs.os}         />
                      <SpecRow label="Pin"                   value={specs.battery}    />
                      <SpecRow label="Kết nối"              value={specs.ports}      />
                      <SpecRow label="Kết nối không dây"    value={specs.wireless}   />
                      <SpecRow label="Webcam"                value={specs.webcam}     />
                      <SpecRow label="Trọng lượng"          value={specs.weight}     />
                      <SpecRow label="Kích thước"           value={specs.dimensions} />
                      <SpecRow label="Màu sắc"              value={specs.color}      />
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <p>Chưa có thông số kỹ thuật</p>
                  </div>
                )}
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === 'reviews' && (
              <div style={{ animation: 'fadeUp .3s ease' }}>
                {/* Rating summary */}
                {reviews.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 24px', background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', borderRadius: 16, marginBottom: 24, border: '1px solid #fde68a', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 48, fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{product.avg_rating?.toFixed(1)}</div>
                      <Stars rating={product.avg_rating} size={20} />
                      <div style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>{product.review_count} đánh giá</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      {[5,4,3,2,1].map(star => {
                        const count = reviews.filter(r => Math.round(r.rating) === star).length
                        const pct = reviews.length ? (count / reviews.length * 100) : 0
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <span style={{ fontSize: 12, color: '#92400e', width: 12 }}>{star}</span>
                            <span style={{ fontSize: 12 }}>★</span>
                            <div style={{ flex: 1, height: 8, background: '#fde68a', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 4, transition: 'width .5s' }} />
                            </div>
                            <span style={{ fontSize: 12, color: '#92400e', width: 20, textAlign: 'right' }}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Review form */}
                {user && hasPurchased && (
                  <div style={{ background: '#f8fafc', borderRadius: 16, padding: '20px 22px', marginBottom: 24, border: '1.5px solid #e5e7eb' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#111827' }}>
                      {hasReviewed ? '✏️ Sửa đánh giá của bạn' : '✍️ Viết đánh giá'}
                    </h3>
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Đánh giá:</p>
                      <Stars rating={myRating} size={28} interactive onRate={setMyRating} />
                    </div>
                    <textarea value={myComment} onChange={e => setMyComment(e.target.value)} placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..." rows={4}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit', transition: 'all .2s' }}
                    />
                    {/* Image upload */}
                    <div style={{ marginTop: 10 }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fff', border: '1.5px dashed #d1d5db', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#374151', transition: 'all .2s' }}>
                        📷 Thêm ảnh ({reviewImages.length}/5)
                        <input type="file" accept="image/*" multiple onChange={handleImagePick} style={{ display: 'none' }} disabled={reviewImages.length >= 5} />
                      </label>
                      {previewUrls.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          {previewUrls.map((url, idx) => (
                            <div key={idx} style={{ position: 'relative' }}>
                              <img src={url} alt={idx} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '2px solid #e5e7eb' }} />
                              <button onClick={() => removeImage(idx)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={submitReview} disabled={submitting || uploadingImages || myComment.trim().length < 10}
                        style={{ padding: '11px 28px', borderRadius: 11, fontWeight: 800, fontSize: 14, cursor: submitting || uploadingImages || myComment.trim().length < 10 ? 'not-allowed' : 'pointer', border: 'none', background: submitting || uploadingImages || myComment.trim().length < 10 ? '#94a3b8' : 'linear-gradient(135deg,#1a2341,#2563eb)', color: '#fff', boxShadow: submitting || uploadingImages || myComment.trim().length < 10 ? 'none' : '0 4px 14px rgba(37,99,235,.3)', transition: 'all .2s' }}>
                        {uploadingImages ? '⏳ Đang tải ảnh...' : submitting ? '⏳ Đang gửi...' : hasReviewed ? '💾 Cập nhật' : '📤 Gửi đánh giá'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Review list */}
                {reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                    <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {reviews.map((rv, i) => (
                      <div key={rv.id} style={{ padding: '20px 0', borderBottom: i < reviews.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2341,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 16, flexShrink: 0 }}>
                              {rv.user_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>{rv.user_name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <Stars rating={rv.rating} size={14} />
                                <span style={{ fontSize: 12, color: '#6b7280' }}>{rv.rating}/5</span>
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: '#9ca3af', background: '#f8fafc', padding: '3px 10px', borderRadius: 10 }}>
                            {new Date(rv.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.75, paddingLeft: 52 }}>{rv.comment}</p>
                        {(() => {
                          let imgs = []
                          if (Array.isArray(rv.images)) imgs = rv.images
                          else if (typeof rv.images === 'string' && rv.images) { try { imgs = JSON.parse(rv.images) } catch { imgs = [] } }
                          if (!imgs.length) return null
                          return (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingLeft: 52, marginTop: 10 }}>
                              {imgs.map((url, imgIdx) => {
                                const fullUrl = url.startsWith('http') ? url : `${IMG_BASE_URL}/${url}`
                                return (
                                  <a key={imgIdx} href={fullUrl} target="_blank" rel="noreferrer">
                                    <img src={fullUrl} alt={`rv-img-${imgIdx}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'zoom-in', transition: 'transform .2s' }}
                                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                                  </a>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description tab */}
            {activeTab === 'desc' && (
              <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, animation: 'fadeUp .3s ease' }}>
                {product.description
                  ? product.description.split('\n').map((line, i) => line.trim() ? <p key={i} style={{ margin: '0 0 14px' }}>{line}</p> : <br key={i} />)
                  : <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                      <p>Chưa có mô tả chi tiết</p>
                    </div>
                }
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 22, padding: '24px 28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,.05)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
              🔗 Sản phẩm liên quan
            </h2>
            <div className="related-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 16 }}>
              {related.map(rp => {
                const rPrice = rp.sale_price || rp.price
                const rImg   = IMG(rp.primary_image)
                const rDisc  = rp.sale_price ? Math.round((1 - rp.sale_price / rp.price) * 100) : null
                return (
                  <Link key={rp.id} to={`/products/${rp.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1.5px solid #f1f5f9', transition: 'all .25s' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#2563eb' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#f1f5f9' }}>
                      <div style={{ padding: 16, background: '#fff', position: 'relative' }}>
                        {rImg ? (
                          <img src={rImg} alt={rp.name} style={{ width: '100%', height: 130, objectFit: 'contain' }} onError={e => { e.target.src = 'https://placehold.co/200x130/f1f5f9/94a3b8?text=Laptop' }} />
                        ) : (
                          <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#cbd5e1' }}>💻</div>
                        )}
                        {rDisc && <span style={{ position: 'absolute', top: 8, left: 8, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10 }}>-{rDisc}%</span>}
                      </div>
                      <div style={{ padding: '12px 14px 16px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: 10, color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8 }}>{rp.brand_name}</p>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#111827', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{rp.name}</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#ef4444' }}>{fmt(rPrice)}</span>
                          {rp.sale_price && <span style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(rp.price)}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Image zoom modal */}
      {imgZoom && images.length > 0 && (
        <div onClick={() => setImgZoom(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', animation: 'fadeUp .2s ease' }}>
          <img src={IMG(images[activeImg]?.url)} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12, animation: 'zoomIn .25s ease' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setImgZoom(false)} style={{ position: 'fixed', top: 20, right: 24, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: '50%', width: 44, height: 44, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>✕</button>
          {/* Navigate between images in zoom */}
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i - 1 + images.length) % images.length) }}
                style={{ position: 'fixed', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: '50%', width: 48, height: 48, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>‹</button>
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i + 1) % images.length) }}
                style={{ position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: '50%', width: 48, height: 48, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>›</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}