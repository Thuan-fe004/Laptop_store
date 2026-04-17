// src/pages/ProductDetailPage.jsx
import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
import { IMG_BASE_URL } from '../constants/config';

const IMG = (url) => url ? `${IMG_BASE_URL}/${url}` : null

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

function SpecRow({ label, value, highlight }) {
  if (!value) return null
  return (
    <tr>
      <td style={{ padding: '11px 16px', background: '#f8fafc', fontWeight: 700, fontSize: 13, color: '#374151', width: '36%', borderBottom: '1px solid #f1f5f9' }}>{label}</td>
      <td style={{ padding: '11px 16px', fontSize: 13, color: '#111827', borderBottom: '1px solid #f1f5f9', fontWeight: highlight ? 700 : 400, color: highlight ? '#1a2341' : '#111827' }}>{value}</td>
    </tr>
  )
}

export default function ProductDetailPage() {
  const { slug }   = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const [product,    setProduct]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [activeImg,  setActiveImg]  = useState(0)
  const [activeTab,  setActiveTab]  = useState('specs')
  const [qty,        setQty]        = useState(1)
  const [addingCart, setAddingCart] = useState(false)
  const [imgZoom,    setImgZoom]    = useState(false)
  // Review form
  const [myRating,    setMyRating]    = useState(5)
  const [myComment,   setMyComment]   = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [hasReviewed,  setHasReviewed]  = useState(false)
  // ── Upload ảnh review ──
  const [reviewImages,    setReviewImages]    = useState([])   // File[] chưa upload
  const [previewUrls,     setPreviewUrls]     = useState([])   // blob URL preview
  const [uploadedUrls,    setUploadedUrls]    = useState([])   // URL đã upload xong
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    setLoading(true)
    setActiveImg(0)
    api.get(`/products/${slug}`)
      .then(res => { if (res.data.success) setProduct(res.data.data); else navigate('/products') })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [slug])

  // Kiểm tra user đã mua & đã review chưa
  useEffect(() => {
    if (!user || !product) return
    // Kiểm tra đã mua (có đơn delivered với sản phẩm này)
    api.get('/orders', { params: { status: 'delivered', per_page: 50 } })
      .then(res => {
        const orders = res.data?.data || []
        const bought = orders.some(o =>
          (o.items || []).some(it => it.product_id === product.id || it.product_name === product.name)
        )
        setHasPurchased(bought)
      })
      .catch(() => {})

    // Kiểm tra đã review chưa
    const existingReview = (product.reviews || []).find(r => r.user_id === user.id)
    if (existingReview) {
      setHasReviewed(true)
      setMyRating(existingReview.rating)
      setMyComment(existingReview.comment || '')
    }
  }, [user, product])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 16, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 48, height: 48, border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <p style={{ color: '#6b7280', fontWeight: 600 }}>Đang tải sản phẩm...</p>
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

  const handleAddToCart = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng'); navigate('/login'); return }
    setAddingCart(true)
    try {
      await api.post('/cart', { product_id: product.id, quantity: qty })
      toast.success(`✅ Đã thêm vào giỏ hàng!`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể thêm vào giỏ hàng')
    } finally { setAddingCart(false) }
  }

  const handleBuyNow = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập để mua hàng'); navigate('/login'); return }
    setAddingCart(true)
    try {
      await api.post('/cart', { product_id: product.id, quantity: qty })
      navigate('/checkout')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể thêm vào giỏ hàng')
      setAddingCart(false)
    }
  }

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files || [])
    if (reviewImages.length + files.length > 5) {
      toast.warning('Tối đa 5 ảnh cho mỗi đánh giá'); return
    }
    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) { toast.warning(`${f.name} vượt quá 5MB`); return false }
      return true
    })
    setReviewImages(prev => [...prev, ...validFiles])
    setPreviewUrls(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))])
    // reset input để có thể chọn lại cùng file
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

    // Lấy product.id an toàn — tránh lỗi /products/undefined/reviews
    const pid = product?.id
    if (!pid) { toast.error('Không xác định được sản phẩm'); return }

    setSubmitting(true)
    try {
      // Bước 1: Upload ảnh nếu có (dùng biến local, KHÔNG dùng state async)
      let finalImageUrls = []
      if (reviewImages.length > 0) {
        setUploadingImages(true)
        const form = new FormData()
        reviewImages.forEach(f => form.append('images', f))
        try {
          const upRes = await api.post('/reviews/upload-images', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          finalImageUrls = upRes.data?.urls || []
        } catch (upErr) {
          toast.warning('Không thể tải ảnh, sẽ gửi đánh giá không có ảnh')
        }
        setUploadingImages(false)
      }

      // Bước 2: Gửi đánh giá kèm URLs ảnh
      await api.post(`/products/${pid}/reviews`, {
        rating:     myRating,
        comment:    myComment,
        image_urls: finalImageUrls,
      })
      toast.success(hasReviewed ? '✅ Đã cập nhật đánh giá!' : '✅ Gửi đánh giá thành công!')
      setHasReviewed(true)
      // Reset ảnh sau khi gửi thành công
      previewUrls.forEach(u => URL.revokeObjectURL(u))
      setReviewImages([])
      setPreviewUrls([])
      setUploadedUrls(finalImageUrls)
      // Reload product để cập nhật rating mới
      const res = await api.get(`/products/${slug}`)
      if (res.data.success) setProduct(res.data.data)
    } catch (e) {
      const msg = e.response?.data?.message || 'Không thể gửi đánh giá'
      toast.error(msg)
    } finally { setSubmitting(false) }
  }

  const TABS = [
    { key: 'specs',   label: '📋 Thông số', count: null },
    { key: 'reviews', label: '⭐ Đánh giá',  count: product.review_count },
    { key: 'desc',    label: '📄 Mô tả',     count: null },
  ]

  return (
    <div style={{ fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin   { to { transform:rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0;transform:translateY(12px) } to { opacity:1;transform:none } }
        @keyframes zoomIn { from { opacity:0;transform:scale(.95) } to { opacity:1;transform:scale(1) } }
        * { box-sizing: border-box }
        textarea:focus, input:focus { border-color:#2563eb !important; box-shadow:0 0 0 3px rgba(37,99,235,.1) !important; outline:none }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Trang chủ</Link>
          <span style={{ color: '#d1d5db' }}>›</span>
          <Link to="/products" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Sản phẩm</Link>
          <span style={{ color: '#d1d5db' }}>›</span>
          <Link to={`/products?category_id=${product.category_id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>{product.category_name}</Link>
          <span style={{ color: '#d1d5db' }}>›</span>
          <span style={{ color: '#374151', fontWeight: 700 }}>{product.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── TOP: Image + Info ── */}
        <div style={{ background: '#fff', borderRadius: 22, padding: 32, marginBottom: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>

          {/* Images */}
          <div>
            {/* Main image */}
            <div style={{ borderRadius: 18, background: 'linear-gradient(135deg,#f8fafc,#f0f4ff)', padding: 28, marginBottom: 14, position: 'relative', border: '1.5px solid #f1f5f9', cursor: 'zoom-in', overflow: 'hidden' }}
              onClick={() => setImgZoom(true)}>
              {images.length > 0 ? (
                <img
                  src={IMG(images[activeImg]?.url)}
                  alt={product.name}
                  style={{ width: '100%', height: 360, objectFit: 'contain', display: 'block', transition: 'transform .3s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  onError={e => { e.target.src = 'https://placehold.co/400x360/f1f5f9/94a3b8?text=Laptop' }}
                />
              ) : (
                <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 96, color: '#cbd5e1' }}>💻</div>
              )}
              {discount && (
                <span style={{ position: 'absolute', top: 16, left: 16, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontWeight: 900, padding: '7px 14px', borderRadius: 20, fontSize: 15, boxShadow: '0 4px 12px rgba(239,68,68,.4)' }}>
                  -{discount}%
                </span>
              )}
              {product.is_bestseller === 1 && (
                <span style={{ position: 'absolute', top: 16, right: 16, background: '#f59e0b', color: '#fff', fontWeight: 700, padding: '5px 12px', borderRadius: 20, fontSize: 12 }}>
                  🔥 Bán chạy
                </span>
              )}
              <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,.4)', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>🔍 Phóng to</div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <div key={i} onClick={() => setActiveImg(i)}
                    style={{ width: 76, height: 76, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: `2.5px solid ${activeImg === i ? '#2563eb' : '#e5e7eb'}`, background: '#f8fafc', padding: 6, transition: 'all .2s', boxShadow: activeImg === i ? '0 4px 12px rgba(37,99,235,.3)' : 'none' }}
                  >
                    <img src={IMG(img.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => e.target.src = 'https://placehold.co/76x76/f1f5f9/94a3b8?text=?'} />
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

            <h1 style={{ margin: '0 0 14px', fontSize: 23, fontWeight: 900, color: '#111827', lineHeight: 1.4 }}>
              {product.name}
            </h1>

            {/* Rating row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '10px 14px', background: '#fffbeb', borderRadius: 10 }}>
              <Stars rating={product.avg_rating} size={18} />
              <strong style={{ color: '#f59e0b', fontSize: 16 }}>{product.avg_rating?.toFixed(1)}</strong>
              <span style={{ color: '#9ca3af', fontSize: 13 }}>({product.review_count} đánh giá)</span>
              <span style={{ color: '#e5e7eb' }}>|</span>
              <span style={{ color: '#6b7280', fontSize: 13 }}>Đã bán: <strong style={{ color: '#111827' }}>{product.sold_count}</strong></span>
            </div>

            {/* Price */}
            <div style={{ background: 'linear-gradient(135deg,#fef2f2,#fff5f5)', borderRadius: 16, padding: '18px 22px', marginBottom: 20, border: '1px solid #fee2e2' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: '#ef4444', letterSpacing: -.5 }}>{fmt(price)}</span>
                {oldPrice && <span style={{ fontSize: 18, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(oldPrice)}</span>}
              </div>
              {discount && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>Tiết kiệm {fmt(oldPrice - price)}</span>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>so với giá niêm yết</span>
                </div>
              )}
            </div>

            {/* Short desc */}
            {product.short_desc && (
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.75, marginBottom: 20, background: '#f8fafc', padding: '12px 16px', borderRadius: 10, borderLeft: '3px solid #2563eb', margin: '0 0 20px' }}>
                {product.short_desc}
              </p>
            )}

            {/* Key specs preview */}
            {specs.cpu && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
                {[
                  { icon: '🖥️', label: 'CPU',     value: specs.cpu?.split(',')[0]?.substring(0, 40) },
                  { icon: '💾', label: 'RAM',     value: specs.ram },
                  { icon: '💿', label: 'Ổ cứng',  value: specs.storage },
                  { icon: '🖼️', label: 'Màn hình', value: specs.display?.substring(0, 30) },
                ].filter(s => s.value).map(s => (
                  <div key={s.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1px solid #f1f5f9', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Qty + buttons */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#374151' }}>
                Số lượng:
                <span style={{ marginLeft: 8, fontWeight: 500, color: product.quantity > 0 ? '#16a34a' : '#ef4444' }}>
                  {product.quantity > 0 ? `Còn ${product.quantity} sản phẩm` : 'Hết hàng'}
                </span>
              </p>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: 12, border: '1.5px solid #e5e7eb', width: 'fit-content', overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
                  style={{ width: 44, height: 44, border: 'none', background: 'transparent', fontSize: 20, cursor: qty <= 1 ? 'not-allowed' : 'pointer', color: '#374151', fontWeight: 700, opacity: qty <= 1 ? .3 : 1, transition: 'background .15s' }}
                  onMouseEnter={e => { if (qty > 1) e.currentTarget.style.background = '#e5e7eb' }}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>−</button>
                <span style={{ width: 52, textAlign: 'center', fontSize: 16, fontWeight: 800, color: '#111827' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.quantity, q + 1))} disabled={qty >= product.quantity}
                  style={{ width: 44, height: 44, border: 'none', background: 'transparent', fontSize: 20, cursor: qty >= product.quantity ? 'not-allowed' : 'pointer', color: '#374151', fontWeight: 700, opacity: qty >= product.quantity ? .3 : 1, transition: 'background .15s' }}
                  onMouseEnter={e => { if (qty < product.quantity) e.currentTarget.style.background = '#e5e7eb' }}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>+</button>
              </div>
            </div>

            {product.quantity > 0 ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={handleAddToCart} disabled={addingCart}
                  style={{ flex: 1, minWidth: 155, padding: '14px 0', background: addingCart ? '#f3f4f6' : '#fff', color: addingCart ? '#9ca3af' : '#1a2341', border: `2px solid ${addingCart ? '#e5e7eb' : '#1a2341'}`, borderRadius: 13, fontWeight: 800, fontSize: 15, cursor: addingCart ? 'not-allowed' : 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onMouseEnter={e => { if (!addingCart) { e.currentTarget.style.background = '#1a2341'; e.currentTarget.style.color = '#fff' } }}
                  onMouseLeave={e => { if (!addingCart) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1a2341' } }}>
                  🛒 {addingCart ? 'Đang thêm...' : 'Thêm vào giỏ'}
                </button>
                <button onClick={handleBuyNow} disabled={addingCart}
                  style={{ flex: 1, minWidth: 155, padding: '14px 0', background: addingCart ? '#94a3b8' : 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 13, fontWeight: 800, fontSize: 15, cursor: addingCart ? 'not-allowed' : 'pointer', boxShadow: addingCart ? 'none' : '0 8px 24px rgba(239,68,68,.35)', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onMouseEnter={e => { if (!addingCart) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(239,68,68,.45)' } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = addingCart ? 'none' : '0 8px 24px rgba(239,68,68,.35)' }}>
                  ⚡ Mua ngay
                </button>
              </div>
            ) : (
              <button disabled style={{ width: '100%', padding: '14px 0', background: '#f3f4f6', color: '#9ca3af', border: 'none', borderRadius: 13, fontWeight: 800, fontSize: 15, cursor: 'not-allowed' }}>
                😔 Hết hàng — Thông báo khi có hàng
              </button>
            )}

            {product.quantity > 0 && product.quantity <= 5 && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                <span>⚡</span>
                <span style={{ fontSize: 13, color: '#92400e', fontWeight: 700 }}>Chỉ còn {product.quantity} sản phẩm!</span>
              </div>
            )}

            {/* Commitments */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 20 }}>
              {[['🏆', 'Hàng chính hãng 100%'], ['🚚', 'Giao hàng 1-3 ngày'], ['🔧', 'Bảo hành tận nơi'], ['↩️', 'Đổi trả 15 ngày']].map(([ic, tx]) => (
                <div key={tx} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', background: '#f8fafc', borderRadius: 9, border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 16 }}>{ic}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{tx}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ background: '#fff', borderRadius: 22, border: '1px solid #f1f5f9', marginBottom: 24, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: '16px 28px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', transition: 'all .2s', color: activeTab === t.key ? '#2563eb' : '#6b7280', borderBottom: activeTab === t.key ? '3px solid #2563eb' : '3px solid transparent', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6 }}>
                {t.label}
                {t.count != null && <span style={{ background: activeTab === t.key ? '#2563eb' : '#e5e7eb', color: activeTab === t.key ? '#fff' : '#6b7280', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 800 }}>{t.count}</span>}
              </button>
            ))}
          </div>

          <div style={{ padding: 28 }}>
            {/* Specs */}
            {activeTab === 'specs' && (
              <div style={{ animation: 'fadeUp .3s ease' }}>
                {specs.cpu ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #f1f5f9' }}>
                    <tbody>
                      <SpecRow label="Bộ vi xử lý (CPU)"  value={specs.cpu}        highlight />
                      <SpecRow label="Tốc độ CPU"          value={specs.cpu_speed} />
                      <SpecRow label="RAM"                 value={specs.ram}        highlight />
                      <SpecRow label="Khe RAM"             value={specs.ram_slots} />
                      <SpecRow label="Bộ nhớ trong"        value={specs.storage}    highlight />
                      <SpecRow label="Khe lưu trữ"         value={specs.storage_slots} />
                      <SpecRow label="Màn hình"            value={specs.display}    highlight />
                      <SpecRow label="Độ phân giải"        value={specs.resolution} />
                      <SpecRow label="Card đồ họa (GPU)"   value={specs.gpu}        highlight />
                      <SpecRow label="Pin"                 value={specs.battery} />
                      <SpecRow label="Hệ điều hành"        value={specs.os} />
                      <SpecRow label="Cổng kết nối"        value={specs.ports} />
                      <SpecRow label="WiFi"                value={specs.wifi} />
                      <SpecRow label="Bluetooth"           value={specs.bluetooth} />
                      <SpecRow label="Trọng lượng"         value={specs.weight ? `${specs.weight} kg` : null} />
                      <SpecRow label="Kích thước"          value={specs.dimensions} />
                      <SpecRow label="Màu sắc"             value={specs.color} />
                      <SpecRow label="Bảo hành"            value={specs.warranty}   highlight />
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

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div style={{ animation: 'fadeUp .3s ease' }}>
                {/* Summary */}
                <div style={{ display: 'flex', gap: 40, alignItems: 'center', padding: '20px 28px', background: 'linear-gradient(135deg,#fffbeb,#fff)', borderRadius: 16, marginBottom: 28, border: '1.5px solid #fde68a' }}>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 52, fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{product.avg_rating?.toFixed(1)}</div>
                    <Stars rating={product.avg_rating} size={22} />
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{product.review_count} đánh giá</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {[5,4,3,2,1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length
                      const pct   = reviews.length ? (count / reviews.length * 100) : 0
                      return (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                          <span style={{ fontSize: 13, color: '#6b7280', width: 24, textAlign: 'right', fontWeight: 600 }}>{star}★</span>
                          <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct > 50 ? '#f59e0b' : pct > 20 ? '#fbbf24' : '#fde68a', borderRadius: 4, transition: 'width 1s ease' }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#9ca3af', width: 24, fontWeight: 600 }}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Write review — kiểm tra đã mua chưa */}
                {!user ? (
                  <div style={{ background: '#eff6ff', borderRadius: 14, padding: '20px 22px', marginBottom: 28, border: '1.5px solid #bfdbfe', textAlign: 'center' }}>
                    <p style={{ fontSize: 28, margin: '0 0 10px' }}>🔑</p>
                    <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#1e40af', fontSize: 15 }}>Đăng nhập để viết đánh giá</p>
                    <button onClick={() => navigate('/login')}
                      style={{ padding: '10px 24px', borderRadius: 10, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                      👤 Đăng nhập ngay
                    </button>
                  </div>
                ) : !hasPurchased ? (
                  <div style={{ background: '#fffbeb', borderRadius: 14, padding: '20px 22px', marginBottom: 28, border: '1.5px solid #fde68a', textAlign: 'center' }}>
                    <p style={{ fontSize: 28, margin: '0 0 10px' }}>🛒</p>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#92400e', fontSize: 15 }}>Cần mua hàng trước khi đánh giá</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#b45309' }}>Chỉ khách hàng đã mua và nhận sản phẩm mới được viết đánh giá</p>
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', borderRadius: 16, padding: 22, marginBottom: 28, border: `1.5px solid ${hasReviewed ? '#bbf7d0' : '#e5e7eb'}` }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {hasReviewed ? '✏️ Cập nhật đánh giá của bạn' : '✍️ Viết đánh giá của bạn'}
                    </h4>
                    {hasReviewed && (
                      <p style={{ margin: '0 0 14px', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✅ Bạn đã đánh giá sản phẩm này — có thể chỉnh sửa bên dưới</p>
                    )}
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Điểm đánh giá:</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Stars rating={myRating} size={32} interactive onRate={setMyRating} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                          {['','Rất tệ','Tệ','Bình thường','Tốt','Rất tốt'][myRating]}
                        </span>
                      </div>
                    </div>
                    <textarea
                      value={myComment}
                      onChange={e => setMyComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm thực tế của bạn về sản phẩm này (tối thiểu 10 ký tự)..."
                      rows={4}
                      style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box', transition: 'border .2s' }}
                      onFocus={e => e.target.style.borderColor = '#2563eb'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />

                    {/* ── UPLOAD ẢNH ── */}
                    <div style={{ marginTop: 14 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#374151' }}>
                        📷 Ảnh đính kèm
                        <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
                          ({reviewImages.length}/5 ảnh — mỗi ảnh tối đa 5MB)
                        </span>
                      </p>

                      {/* Preview thumbnails */}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: previewUrls.length ? 10 : 0 }}>
                        {previewUrls.map((url, idx) => (
                          <div key={idx} style={{ position: 'relative', width: 80, height: 80 }}>
                            <img
                              src={url} alt={`preview-${idx}`}
                              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '2px solid #e5e7eb' }}
                            />
                            <button
                              onClick={() => removeImage(idx)}
                              style={{
                                position: 'absolute', top: -6, right: -6,
                                width: 20, height: 20, borderRadius: '50%',
                                background: '#ef4444', color: '#fff', border: 'none',
                                cursor: 'pointer', fontSize: 11, fontWeight: 900,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(239,68,68,.4)',
                              }}
                            >✕</button>
                          </div>
                        ))}

                        {/* Nút thêm ảnh */}
                        {reviewImages.length < 5 && (
                          <label style={{
                            width: 80, height: 80, borderRadius: 10,
                            border: '2px dashed #d1d5db', background: '#f8fafc',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#9ca3af', fontSize: 11,
                            fontWeight: 600, gap: 4, transition: 'all .2s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.background = '#eff6ff' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = '#f8fafc' }}
                          >
                            <span style={{ fontSize: 22 }}>📷</span>
                            <span>Thêm ảnh</span>
                            <input
                              type="file" multiple accept="image/*"
                              onChange={handleImagePick}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                      <span style={{ fontSize: 12, color: myComment.length < 10 ? '#ef4444' : '#9ca3af' }}>
                        {myComment.length}/500 ký tự {myComment.length < 10 && `(cần thêm ${10 - myComment.length} ký tự)`}
                      </span>
                      <button
                        onClick={submitReview}
                        disabled={submitting || uploadingImages || myComment.trim().length < 10}
                        style={{
                          padding: '10px 28px', borderRadius: 10, border: 'none', fontWeight: 800, fontSize: 14,
                          cursor: submitting || uploadingImages || myComment.trim().length < 10 ? 'not-allowed' : 'pointer',
                          background: submitting || uploadingImages || myComment.trim().length < 10
                            ? '#94a3b8' : 'linear-gradient(135deg,#1a2341,#2563eb)',
                          color: '#fff',
                          boxShadow: submitting || uploadingImages || myComment.trim().length < 10
                            ? 'none' : '0 4px 14px rgba(37,99,235,.3)',
                          transition: 'all .2s',
                        }}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2341,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 16 }}>
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
                        {/* Ảnh đính kèm trong review */}
                        {(() => {
                          // Parse images: có thể là array hoặc JSON string từ API
                          let imgs = []
                          if (Array.isArray(rv.images)) imgs = rv.images
                          else if (typeof rv.images === 'string' && rv.images) {
                            try { imgs = JSON.parse(rv.images) } catch { imgs = [] }
                          }
                          if (!imgs.length) return null
                          return (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingLeft: 52, marginTop: 10 }}>
                              {imgs.map((url, imgIdx) => {
                                const fullUrl = url.startsWith('http') ? url : `${IMG_BASE_URL}/${url}`
                                return (
                                  <a key={imgIdx} href={fullUrl} target="_blank" rel="noreferrer">
                                    <img
                                      src={fullUrl} alt={`rv-img-${imgIdx}`}
                                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'zoom-in', transition: 'transform .2s' }}
                                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    />
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

            {/* Description */}
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
          <div style={{ background: '#fff', borderRadius: 22, padding: 28, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,.05)' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 21, fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
              🔗 Sản phẩm liên quan
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16 }}>
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
                          <img src={rImg} alt={rp.name} style={{ width: '100%', height: 140, objectFit: 'contain' }} onError={e => { e.target.src = 'https://placehold.co/200x140/f1f5f9/94a3b8?text=Laptop' }} />
                        ) : (
                          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, color: '#cbd5e1' }}>💻</div>
                        )}
                        {rDisc && <span style={{ position: 'absolute', top: 8, left: 8, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10 }}>-{rDisc}%</span>}
                      </div>
                      <div style={{ padding: '12px 14px 16px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: 10, color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8 }}>{rp.brand_name}</p>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#111827', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{rp.name}</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#ef4444' }}>{fmt(rPrice)}</span>
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
        <div onClick={() => setImgZoom(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', animation: 'fadeUp .2s ease' }}>
          <img src={IMG(images[activeImg]?.url)} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12, animation: 'zoomIn .25s ease' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setImgZoom(false)} style={{ position: 'fixed', top: 20, right: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: '50%', width: 44, height: 44, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}
    </div>
  )
}