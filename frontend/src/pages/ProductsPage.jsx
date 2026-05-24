// src/pages/ProductsPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { IMG_BASE_URL } from '../constants/config'

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
const IMG = (url) => url ? `${IMG_BASE_URL}/${url}` : null

/* ─────────────────── SHARED NAVBAR ─────────────────── */
export function Navbar({ searchInput, setSearchInput, onSearch, cartBump }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav style={{
      background: '#1a2341',
      padding: '0 20px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 300,
      boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,.35)' : '0 2px 16px rgba(0,0,0,.2)',
      borderBottom: '1px solid rgba(255,255,255,.06)',
      transition: 'box-shadow .3s',
      gap: 12,
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 22 }}>💻</span>
        <span style={{ fontSize: 17, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
          Laptop<span style={{ color: '#60a5fa' }}>Store</span>
        </span>
      </Link>

      {/* Search — hidden on very small screens */}
      {onSearch && (
        <form onSubmit={onSearch} style={{ flex: 1, maxWidth: 460, margin: '0 8px', display: 'flex' }} className="nav-search">
          <div style={{ display: 'flex', background: 'rgba(255,255,255,.1)', borderRadius: 10, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,.12)', width: '100%' }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm laptop..."
              style={{ flex: 1, padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: '#fff', minWidth: 0 }}
            />
            <button type="submit" style={{ padding: '9px 16px', background: '#2563eb', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15, flexShrink: 0 }}>🔍</button>
          </div>
        </form>
      )}

      {/* Desktop nav links */}
      <div className="nav-links" style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
        <Link to="/" style={NL}>🏠 Trang chủ</Link>
        <Link to="/cart" style={{ ...NL, position: 'relative' }}>
          <span style={{
            display: 'inline-block',
            animation: cartBump ? 'cartBump .4s cubic-bezier(.36,.07,.19,.97)' : 'none',
          }}>🛒</span>
          {' '}Giỏ hàng
        </Link>
        <Link to="/orders" style={NL}>📦 Đơn hàng</Link>
        {user
          ? <button onClick={logout} style={{ ...NL, border: 'none', cursor: 'pointer', color: '#fca5a5', background: 'rgba(239,68,68,.1)' }}>🚪 Đăng xuất</button>
          : <Link to="/login" style={NL}>👤 Đăng nhập</Link>
        }
      </div>

      {/* Mobile hamburger */}
      <button
        className="hamburger"
        onClick={() => setMenuOpen(m => !m)}
        style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 4, flexShrink: 0 }}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          position: 'absolute', top: 60, left: 0, right: 0,
          background: '#1e2d4a', borderBottom: '1px solid rgba(255,255,255,.08)',
          padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4,
          zIndex: 299, boxShadow: '0 8px 24px rgba(0,0,0,.3)',
        }}>
          {onSearch && (
            <form onSubmit={e => { onSearch(e); setMenuOpen(false) }} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,.1)', borderRadius: 10, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,.12)' }}>
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Tìm laptop..." style={{ flex: 1, padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: '#fff' }} />
                <button type="submit" style={{ padding: '9px 16px', background: '#2563eb', border: 'none', color: '#fff', cursor: 'pointer' }}>🔍</button>
              </div>
            </form>
          )}
          <Link to="/" onClick={() => setMenuOpen(false)} style={MNL}>🏠 Trang chủ</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)} style={MNL}>🛒 Giỏ hàng</Link>
          <Link to="/orders" onClick={() => setMenuOpen(false)} style={MNL}>📦 Đơn hàng</Link>
          {user
            ? <button onClick={() => { logout(); setMenuOpen(false) }} style={{ ...MNL, border: 'none', cursor: 'pointer', color: '#fca5a5', background: 'rgba(239,68,68,.08)', textAlign: 'left' }}>🚪 Đăng xuất</button>
            : <Link to="/login" onClick={() => setMenuOpen(false)} style={MNL}>👤 Đăng nhập</Link>
          }
        </div>
      )}
    </nav>
  )
}

const NL = { padding: '7px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#cbd5e1', textDecoration: 'none', background: 'transparent', whiteSpace: 'nowrap' }
const MNL = { padding: '11px 14px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#cbd5e1', textDecoration: 'none', background: 'rgba(255,255,255,.04)', display: 'block' }

/* ─────────────────── STARS ─────────────────── */
function Stars({ rating, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 12, color: i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb' }}>★</span>
      ))}
      {count !== undefined && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 2 }}>({count})</span>}
    </div>
  )
}

/* ─────────────────── CART FLY ANIMATION ─────────────────── */
function CartFlyEffect({ origin, onDone }) {
  const cartEl = document.querySelector('.cart-icon-target')
  const [style, setStyle] = useState({
    position: 'fixed',
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#2563eb,#1a2341)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14,
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
    const tx = rect.left + rect.width / 2 - 14
    const ty = rect.top + rect.height / 2 - 14

    requestAnimationFrame(() => {
      setStyle(s => ({
        ...s,
        left: tx,
        top: ty,
        transform: 'scale(0.3)',
        opacity: 0,
        transition: 'all .6s cubic-bezier(.25,.46,.45,.94)',
      }))
    })

    const t = setTimeout(onDone, 650)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={style}>🛒</div>
  )
}

/* ─────────────────── PRODUCT CARD ─────────────────── */
function ProductCard({ product, onCartFly }) {
  const [hovered, setHovered] = useState(false)
  const [adding, setAdding]   = useState(false)
  const [added, setAdded]     = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const btnRef = useRef(null)

  const price    = product.sale_price || product.price
  const oldPrice = product.sale_price ? product.price : null
  const discount = oldPrice ? Math.round((1 - product.sale_price / product.price) * 100) : null
  const img      = IMG(product.primary_image)

  const addToCart = async (e) => {
    e.preventDefault(); e.stopPropagation()
    if (!user) { toast.info('Vui lòng đăng nhập để thêm vào giỏ hàng'); navigate('/login'); return }
    if (adding) return

    // Trigger fly animation
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      onCartFly({ x: rect.left + rect.width / 2 - 14, y: rect.top + rect.height / 2 - 14 })
    }

    setAdding(true)
    try {
      await api.post('/cart', { product_id: product.id, quantity: 1 })
      setAdded(true)
      toast.success('🛒 Đã thêm vào giỏ hàng!')
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm vào giỏ hàng')
    } finally { setAdding(false) }
  }

  const buyNow = async (e) => {
    e.preventDefault(); e.stopPropagation()
    if (!user) { toast.info('Vui lòng đăng nhập để mua hàng'); navigate('/login'); return }
    setAdding(true)
    try { await api.post('/cart', { product_id: product.id, quantity: 1 }); navigate('/checkout') }
    catch (err) { toast.error(err.response?.data?.message || 'Không thể thêm vào giỏ hàng'); setAdding(false) }
  }

  return (
    <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff', borderRadius: 18, overflow: 'hidden',
          border: `1.5px solid ${hovered ? '#2563eb' : '#f0f0f5'}`,
          boxShadow: hovered ? '0 16px 40px rgba(37,99,235,.12)' : '0 2px 10px rgba(0,0,0,.05)',
          transform: hovered ? 'translateY(-5px)' : 'none',
          transition: 'all .25s cubic-bezier(.4,0,.2,1)',
          display: 'flex', flexDirection: 'column', height: '100%', position: 'relative',
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', background: 'linear-gradient(135deg,#f8fafc,#f0f4ff)', padding: 18, flexShrink: 0 }}>
          {img ? (
            <img src={img} alt={product.name}
              style={{ width: '100%', height: 168, objectFit: 'contain', display: 'block', transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform .3s' }}
              onError={e => { e.target.src = `https://placehold.co/280x168/f1f5f9/94a3b8?text=${encodeURIComponent(product.brand_name || 'Laptop')}` }}
            />
          ) : (
            <div style={{ height: 168, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#94a3b8' }}>💻</div>
          )}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {discount && <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>-{discount}%</span>}
            {product.is_bestseller === 1 && <span style={{ background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>🔥 Hot</span>}
          </div>
          {product.quantity === 0 && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
              <span style={{ background: '#6b7280', color: '#fff', padding: '7px 18px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>Hết hàng</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px 8px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <p style={{ margin: '0 0 3px', fontSize: 10, color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{product.brand_name}</p>
          <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>{product.name}</p>
          <Stars rating={product.avg_rating} count={product.review_count} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#ef4444' }}>{fmt(price)}</span>
            {oldPrice && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(oldPrice)}</span>}
          </div>
          {product.quantity > 0 && product.quantity <= 5 && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>⚡ Còn {product.quantity} sp</p>
          )}
        </div>

        {/* Action buttons */}
        {product.quantity > 0 && (
          <div style={{ padding: '8px 12px 14px', display: 'flex', gap: 6, opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(8px)', transition: 'all .22s ease' }}>
            <button
              ref={btnRef}
              onClick={addToCart}
              disabled={adding}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10,
                border: `1.5px solid ${added ? '#16a34a' : '#1a2341'}`,
                background: added ? '#f0fdf4' : '#fff',
                color: added ? '#16a34a' : '#1a2341',
                fontSize: 12, fontWeight: 700,
                cursor: adding ? 'not-allowed' : 'pointer', transition: 'all .2s',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!adding && !added) { e.currentTarget.style.background = '#1a2341'; e.currentTarget.style.color = '#fff' } }}
              onMouseLeave={e => { if (!adding && !added) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1a2341' } }}
            >
              {adding ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span style={{ display: 'inline-block', animation: 'spin .6s linear infinite', fontSize: 12 }}>⟳</span>
                </span>
              ) : added ? '✓ Đã thêm' : '🛒 Giỏ hàng'}
            </button>
            <button onClick={buyNow} disabled={adding}
              style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: adding ? '#94a3b8' : 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer', boxShadow: adding ? 'none' : '0 4px 12px rgba(239,68,68,.3)', transition: 'all .15s' }}
            >⚡ Mua ngay</button>
          </div>
        )}
      </div>
    </Link>
  )
}

/* ─────────────────── SKELETON ─────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: '1.5px solid #f3f4f6' }}>
      <div className="skeleton" style={{ height: 204 }} />
      <div style={{ padding: '14px 16px 18px' }}>
        {[50, 90, 40, 70].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: i === 1 ? 34 : 12, borderRadius: 6, marginBottom: 10, width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

/* ─────────────────── FILTER CHECKBOX ─────────────────── */
function FilterCheck({ label, checked, onChange, count }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 0', fontSize: 13, color: checked ? '#2563eb' : '#374151', fontWeight: checked ? 700 : 400, transition: 'color .15s' }}>
      <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `2px solid ${checked ? '#2563eb' : '#d1d5db'}`, background: checked ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
        {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
      </div>
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && <span style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', padding: '1px 7px', borderRadius: 10 }}>{count}</span>}
    </label>
  )
}

function FilterTag({ label, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 20, fontSize: 12, color: '#2563eb', fontWeight: 700 }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontWeight: 900, padding: 0, fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center' }}>×</button>
    </span>
  )
}

function PBtn({ label, active, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      minWidth: 40, height: 40, padding: '0 10px', borderRadius: 10, fontWeight: 700, fontSize: 14,
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', border: 'none',
      background: active ? '#1a2341' : disabled ? '#f8fafc' : '#fff',
      color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
      boxShadow: active ? '0 4px 14px rgba(26,35,65,.3)' : disabled ? 'none' : '0 1px 4px rgba(0,0,0,.08)',
    }}>{label}</button>
  )
}

/* ─────────────────── MAIN PAGE ─────────────────── */
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [brands,     setBrands]     = useState([])
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 })
  const [loading,    setLoading]    = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 900)
  const [mobileSidebar, setMobileSidebar] = useState(false)

  // Cart fly animation state
  const [flyEffects, setFlyEffects] = useState([])
  const [cartBump, setCartBump] = useState(false)

  const [filters, setFilters] = useState({
    search:        searchParams.get('search')        || '',
    category_id:   searchParams.get('category_id')   || '',
    brand_id:      searchParams.get('brand_id')      || '',
    is_featured:   searchParams.get('is_featured')   || '',
    is_bestseller: searchParams.get('is_bestseller') || '',
    min_price:     searchParams.get('min_price')     || '',
    max_price:     searchParams.get('max_price')     || '',
    sort:          searchParams.get('sort')          || 'newest',
    page:          parseInt(searchParams.get('page') || '1'),
  })
  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/brands')])
      .then(([c, b]) => { setCategories(c.data.data || []); setBrands(b.data.data || []) })
      .catch(() => {})
  }, [])

  const fetchProducts = useCallback(() => {
    setLoading(true)
    const params = {}
    Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v !== null) params[k] = v })
    api.get('/products', { params })
      .then(res => { setProducts(res.data.data || []); setPagination(res.data.pagination || { page: 1, total_pages: 1, total: 0 }) })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    const p = {}
    Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v !== null && !(k === 'sort' && v === 'newest') && !(k === 'page' && v === 1)) p[k] = v })
    if (filters.page > 1) p.page = filters.page
    setSearchParams(p, { replace: true })
  }, [filters])

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) { setSidebarOpen(true); setMobileSidebar(false) }
      else setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value, page: 1 }))
  const setPage   = (p) => setFilters(f => ({ ...f, page: p }))
  const toggleFilter = (key, value) => setFilter(key, filters[key] === value ? '' : value)
  const onSearchSubmit = (e) => { e.preventDefault(); setFilter('search', searchInput) }

  const handleCartFly = (origin) => {
    const id = Date.now()
    setFlyEffects(prev => [...prev, { id, origin }])
  }

  const handleFlyDone = (id) => {
    setFlyEffects(prev => prev.filter(f => f.id !== id))
    setCartBump(true)
    setTimeout(() => setCartBump(false), 500)
  }

  const PRICE_RANGES = [
    { label: 'Dưới 10 triệu',  min: '',         max: 10_000_000 },
    { label: '10 – 20 triệu',  min: 10_000_000, max: 20_000_000 },
    { label: '20 – 30 triệu',  min: 20_000_000, max: 30_000_000 },
    { label: '30 – 50 triệu',  min: 30_000_000, max: 50_000_000 },
    { label: 'Trên 50 triệu',  min: 50_000_000, max: '' },
  ]
  const activePrice = PRICE_RANGES.find(r => String(r.min) === String(filters.min_price) && String(r.max) === String(filters.max_price))

  const SORT_OPTIONS = [
    { value: 'newest',     label: '🆕 Mới nhất' },
    { value: 'bestseller', label: '🔥 Bán chạy' },
    { value: 'rating',     label: '⭐ Đánh giá cao' },
    { value: 'price_asc',  label: '💰 Giá tăng dần' },
    { value: 'price_desc', label: '💰 Giá giảm dần' },
  ]

  const clearAllFilters = () => setFilters({ search: '', category_id: '', brand_id: '', is_featured: '', is_bestseller: '', min_price: '', max_price: '', sort: 'newest', page: 1 })
  const hasActiveFilters = [filters.category_id, filters.brand_id, filters.is_featured, filters.is_bestseller, filters.min_price, filters.max_price, filters.search].some(v => v !== '')

  const pageTitle = filters.search
    ? `Kết quả: "${filters.search}"`
    : filters.category_id
      ? categories.find(c => String(c.id) === String(filters.category_id))?.name || 'Sản phẩm'
      : filters.brand_id
        ? brands.find(b => String(b.id) === String(filters.brand_id))?.name || 'Sản phẩm'
        : filters.is_bestseller ? '🔥 Bán chạy nhất'
        : filters.is_featured   ? '⭐ Sản phẩm nổi bật'
        : 'Tất cả sản phẩm'

  const FilterSidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
        <span style={{ fontWeight: 900, fontSize: 16, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>🎯 Bộ lọc</span>
        {hasActiveFilters && (
          <button onClick={clearAllFilters} style={{ fontSize: 12, color: '#ef4444', background: '#fef2f2', border: 'none', cursor: 'pointer', fontWeight: 700, padding: '4px 10px', borderRadius: 7 }}>
            ✕ Xóa tất cả
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid #f0f0f5', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
        <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: 13, color: '#374151', textTransform: 'uppercase', letterSpacing: .6 }}>🔍 Tìm kiếm</p>
        <form onSubmit={e => { e.preventDefault(); setFilter('search', searchInput); setMobileSidebar(false) }} style={{ display: 'flex', gap: 6 }}>
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Tên sản phẩm..." style={{ flex: 1, padding: '8px 11px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          <button type="submit" style={{ padding: '8px 12px', background: '#1a2341', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>→</button>
        </form>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid #f0f0f5', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 13, color: '#374151', textTransform: 'uppercase', letterSpacing: .6 }}>📂 Danh mục</p>
        <FilterCheck label="Tất cả" checked={!filters.category_id} onChange={() => setFilter('category_id', '')} />
        {categories.map(c => (
          <FilterCheck key={c.id} label={c.name} checked={String(filters.category_id) === String(c.id)} onChange={() => toggleFilter('category_id', String(c.id))} />
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid #f0f0f5', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 13, color: '#374151', textTransform: 'uppercase', letterSpacing: .6 }}>🏷️ Thương hiệu</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {brands.map(b => (
            <button key={b.id} onClick={() => toggleFilter('brand_id', String(b.id))}
              style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', background: String(filters.brand_id) === String(b.id) ? '#1a2341' : '#f8fafc', color: String(filters.brand_id) === String(b.id) ? '#fff' : '#374151', border: `1.5px solid ${String(filters.brand_id) === String(b.id) ? '#1a2341' : '#e5e7eb'}` }}
            >{b.name}</button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid #f0f0f5', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 13, color: '#374151', textTransform: 'uppercase', letterSpacing: .6 }}>💰 Khoảng giá</p>
        {PRICE_RANGES.map(r => (
          <FilterCheck key={r.label} label={r.label} checked={!!activePrice && activePrice.label === r.label}
            onChange={() => { if (activePrice?.label === r.label) setFilters(f => ({ ...f, min_price: '', max_price: '', page: 1 })); else setFilters(f => ({ ...f, min_price: r.min, max_price: r.max, page: 1 })) }}
          />
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid #f0f0f5', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 13, color: '#374151', textTransform: 'uppercase', letterSpacing: .6 }}>⭐ Phân loại</p>
        <FilterCheck label="Sản phẩm nổi bật" checked={!!filters.is_featured}   onChange={() => toggleFilter('is_featured',   '1')} />
        <FilterCheck label="🔥 Bán chạy nhất" checked={!!filters.is_bestseller} onChange={() => toggleFilter('is_bestseller', '1')} />
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes cartBump { 0%{transform:scale(1)} 30%{transform:scale(1.4) rotate(-10deg)} 60%{transform:scale(0.9) rotate(5deg)} 100%{transform:scale(1)} }
        .skeleton { background: linear-gradient(90deg,#f1f5f9 25%,#e8edf2 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
        * { box-sizing: border-box }
        ::-webkit-scrollbar { width: 5px }
        ::-webkit-scrollbar-track { background: #f1f5f9 }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px }
        select { outline: none }

        /* ── Responsive breakpoints ── */
        @media (max-width: 900px) {
          .nav-links { display: none !important }
          .nav-search { display: none !important }
          .hamburger { display: flex !important }
          .desktop-sidebar { display: none !important }
          .products-layout { flex-direction: column !important }
        }
        @media (max-width: 600px) {
          .page-wrapper { padding: 12px 10px !important }
          .toolbar { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important }
          .toolbar-right { width: 100% !important; justify-content: space-between !important }
          .sort-select { flex: 1 !important }
        }
      `}</style>

      {/* Flying cart effects */}
      {flyEffects.map(f => (
        <CartFlyEffect key={f.id} origin={f.origin} onDone={() => handleFlyDone(f.id)} />
      ))}

      <Navbar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSearch={onSearchSubmit}
        cartBump={cartBump}
      />

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '11px 24px' }}>
        <div style={{ maxWidth: 1380, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Trang chủ</Link>
          <span style={{ color: '#d1d5db' }}>›</span>
          <span style={{ color: '#374151', fontWeight: 700 }}>Sản phẩm</span>
          {filters.category_id && categories.find(c => String(c.id) === String(filters.category_id)) && (
            <><span style={{ color: '#d1d5db' }}>›</span><span style={{ color: '#374151', fontWeight: 700 }}>{categories.find(c => String(c.id) === String(filters.category_id)).name}</span></>
          )}
        </div>
      </div>

      <div className="page-wrapper products-layout" style={{ maxWidth: 1380, margin: '0 auto', padding: '24px 16px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* Desktop Sidebar */}
        <aside className="desktop-sidebar" style={{ width: sidebarOpen ? 268 : 0, flexShrink: 0, overflow: sidebarOpen ? 'visible' : 'hidden', transition: 'width .3s ease' }}>
          <div style={{ width: 268 }}>
            <FilterSidebarContent />
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebar && (
          <>
            <div onClick={() => setMobileSidebar(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 400, backdropFilter: 'blur(2px)' }} />
            <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 300, background: '#f8fafc', zIndex: 401, overflowY: 'auto', padding: '20px 16px', boxShadow: '4px 0 24px rgba(0,0,0,.2)', animation: 'slideInLeft .25s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 900, fontSize: 18, color: '#111827' }}>Bộ lọc</span>
                <button onClick={() => setMobileSidebar(false)} style={{ background: '#f3f4f6', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>✕</button>
              </div>
              <FilterSidebarContent />
              <div style={{ marginTop: 20 }}>
                <button onClick={() => setMobileSidebar(false)} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#1a2341,#2563eb)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,.3)' }}>
                  ✓ Xem kết quả
                </button>
              </div>
            </div>
          </>
        )}

        {/* MAIN */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <div className="toolbar" style={{ background: '#fff', borderRadius: 14, padding: '13px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, border: '1.5px solid #f0f0f5', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Desktop toggle */}
              <button onClick={() => setSidebarOpen(s => !s)}
                className="desktop-sidebar-toggle"
                style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a2341'; e.currentTarget.style.color = '#1a2341' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151' }}
              >
                {sidebarOpen ? '◀ Ẩn lọc' : '▶ Bộ lọc'}
              </button>
              {/* Mobile filter button */}
              <button onClick={() => setMobileSidebar(true)}
                className="mobile-filter-btn"
                style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#374151', display: 'none', alignItems: 'center', gap: 6 }}
              >
                🎯 Lọc {hasActiveFilters && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>!</span>}
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#111827' }}>{pageTitle}</h1>
                {!loading && <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Tìm thấy <strong>{pagination.total}</strong> sản phẩm</p>}
              </div>
            </div>
            <div className="toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>Sắp xếp:</span>
              <select className="sort-select" value={filters.sort} onChange={e => setFilter('sort', e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 700, color: '#374151', background: '#fff', cursor: 'pointer' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active filters */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, animation: 'fadeUp .3s ease' }}>
              {filters.search && <FilterTag label={`🔍 "${filters.search}"`} onRemove={() => { setFilter('search', ''); setSearchInput('') }} />}
              {filters.category_id && <FilterTag label={`📂 ${categories.find(c => String(c.id) === String(filters.category_id))?.name}`} onRemove={() => setFilter('category_id', '')} />}
              {filters.brand_id && <FilterTag label={`🏷️ ${brands.find(b => String(b.id) === String(filters.brand_id))?.name}`} onRemove={() => setFilter('brand_id', '')} />}
              {filters.is_featured && <FilterTag label="⭐ Nổi bật" onRemove={() => setFilter('is_featured', '')} />}
              {filters.is_bestseller && <FilterTag label="🔥 Bán chạy" onRemove={() => setFilter('is_bestseller', '')} />}
              {activePrice && <FilterTag label={`💰 ${activePrice.label}`} onRemove={() => setFilters(f => ({ ...f, min_price: '', max_price: '', page: 1 }))} />}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 18 }}>
              {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', animation: 'fadeUp .4s ease' }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>🔍</div>
              <h3 style={{ margin: '0 0 8px', color: '#374151', fontSize: 20, fontWeight: 800 }}>Không tìm thấy sản phẩm</h3>
              <p style={{ margin: '0 0 24px', fontSize: 15, color: '#6b7280' }}>Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
              <button onClick={clearAllFilters} style={{ padding: '11px 28px', background: '#1a2341', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                🔄 Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 18, animation: 'fadeUp .35s ease' }}>
              {products.map(p => <ProductCard key={p.id} product={p} onCartFly={handleCartFly} />)}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.total_pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 36, flexWrap: 'wrap' }}>
              <PBtn label="‹ Trước" disabled={filters.page <= 1} onClick={() => setPage(filters.page - 1)} />
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === pagination.total_pages || Math.abs(n - filters.page) <= 2)
                .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i - 1] > 1) acc.push('...'); acc.push(n); return acc }, [])
                .map((n, i) => n === '...'
                  ? <span key={`d${i}`} style={{ padding: '0 4px', color: '#9ca3af', fontWeight: 700 }}>…</span>
                  : <PBtn key={n} label={n} active={n === filters.page} onClick={() => setPage(n)} />
                )
              }
              <PBtn label="Sau ›" disabled={filters.page >= pagination.total_pages} onClick={() => setPage(filters.page + 1)} />
            </div>
          )}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .desktop-sidebar-toggle { display: none !important }
          .mobile-filter-btn { display: flex !important }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%) }
          to   { transform: translateX(0) }
        }
      `}</style>
    </div>
  )
}