// src/pages/HomePage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import AIChatBox from '../components/AIChatBox'
import { IMG_BASE_URL } from '../constants/config';
/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

const CAT_META = {
  'Laptop Gaming':     { icon: '🎮', color: '#ef4444', bg: '#fef2f2', desc: 'Hiệu năng vượt trội' },
  'Laptop Văn phòng':  { icon: '💼', color: '#2563eb', bg: '#eff6ff', desc: 'Mỏng nhẹ, pin trâu'  },
  'Laptop Đồ họa':     { icon: '🎨', color: '#7c3aed', bg: '#f5f3ff', desc: 'Card rời mạnh mẽ'    },
  'Laptop Sinh viên':  { icon: '📚', color: '#16a34a', bg: '#f0fdf4', desc: 'Giá tốt, đủ dùng'    },
  'Laptop Doanh nhân': { icon: '👔', color: '#0f766e', bg: '#f0fdfa', desc: 'Bảo mật, sang trọng'  },
}

const BRAND_LOGOS = {
  'ASUS': '🔵', 'Dell': '🔷', 'HP': '🔵', 'Lenovo': '⬛',
  'Apple': '🍎', 'Acer': '🔻', 'MSI': '🔴', 'Samsung': '🟦',
}

/* ═══════════════════════════════════════════════════════
   SPINNER
═══════════════════════════════════════════════════════ */
function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div className="ld-spinner" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   PRODUCT CARD
═══════════════════════════════════════════════════════ */
function ProductCard({ product, compact }) {
  const [hov, setHov] = useState(false)
  const price    = product.sale_price || product.price
  const oldPrice = product.sale_price ? product.price : null
  const discount = oldPrice ? Math.round((1 - product.sale_price / product.price) * 100) : null
  const img = product.primary_image
    ? `${IMG_BASE_URL}/${product.primary_image}`
    : 'https://placehold.co/300x220?text=Laptop'

  return (
    <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          border: `1.5px solid ${hov ? '#2563eb' : '#f0f0f5'}`,
          boxShadow: hov ? '0 16px 40px rgba(37,99,235,.13)' : '0 2px 10px rgba(0,0,0,.05)',
          transform: hov ? 'translateY(-5px)' : 'none',
          transition: 'all .25s cubic-bezier(.4,0,.2,1)',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {/* Badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {discount && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>
              -{discount}%
            </span>
          )}
          {product.is_bestseller === 1 && (
            <span style={{ background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
              🔥 Bán chạy
            </span>
          )}
          {product.is_featured === 1 && !product.is_bestseller && (
            <span style={{ background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
              ⭐ Nổi bật
            </span>
          )}
        </div>

        {/* Image */}
        <div style={{ background: 'linear-gradient(135deg,#f8fafc,#f0f4ff)', padding: compact ? 12 : 20, textAlign: 'center' }}>
          <img
            src={img}
            alt={product.name}
            style={{ width: '100%', height: compact ? 150 : 190, objectFit: 'contain', display: 'block',
              transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'transform .3s' }}
            onError={e => { e.target.src = 'https://placehold.co/300x220?text=?' }}
          />
        </div>

        {/* Info */}
        <div style={{ padding: compact ? '10px 14px 14px' : '14px 16px 18px' }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8 }}>
            {product.brand_name}
          </p>
          <p style={{
            margin: '0 0 8px', fontSize: compact ? 13 : 14, fontWeight: 700, color: '#111827',
            lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {product.name}
          </p>

          {/* Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 8 }}>
            {[1,2,3,4,5].map(i => (
              <span key={i} style={{ color: i <= Math.round(product.avg_rating) ? '#f59e0b' : '#e5e7eb', fontSize: 12 }}>★</span>
            ))}
            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>({product.review_count})</span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: compact ? 16 : 19, fontWeight: 900, color: '#ef4444' }}>{fmt(price)}</span>
            {oldPrice && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(oldPrice)}</span>}
          </div>

          {product.quantity <= 5 && product.quantity > 0 && (
            <p style={{ margin: '5px 0 0', fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>⚡ Còn {product.quantity} sp</p>
          )}
          {product.quantity === 0 && (
            <p style={{ margin: '5px 0 0', fontSize: 11, color: '#ef4444', fontWeight: 700 }}>Hết hàng</p>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ═══════════════════════════════════════════════════════
   HERO SLIDESHOW
═══════════════════════════════════════════════════════ */
const SLIDES = [
  {
    title: 'Laptop Gaming',
    subtitle: 'Chiến mọi tựa game',
    desc: 'RTX 4060 · 165Hz · Core i7 Gen 13 · Giảm đến 15%',
    cta: '/products?category_id=1',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
    accent: '#818cf8',
    emoji: '🎮',
    badge: '🔥 Flash Sale hôm nay',
  },
  {
    title: 'MacBook & Ultrabook',
    subtitle: 'Mỏng. Nhẹ. Đẳng cấp.',
    desc: 'Apple M3 · 18h pin · Màn hình Retina · Hàng chính hãng',
    cta: '/products?category_id=2',
    bg: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
    accent: '#38bdf8',
    emoji: '💼',
    badge: '✅ Chính hãng Apple VN/A',
  },
  {
    title: 'Laptop Đồ Họa',
    subtitle: 'Sáng tạo không giới hạn',
    desc: 'OLED 3.5K · RTX 4070 · Delta E<2 · Cho designer',
    cta: '/products?category_id=3',
    bg: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)',
    accent: '#c4b5fd',
    emoji: '🎨',
    badge: '🎨 Dành cho designer',
  },
]

function HeroSlider() {
  const [cur, setCur] = useState(0)
  const [anim, setAnim] = useState(true)
  const timer = useRef(null)

  const go = useCallback((idx) => {
    setAnim(false)
    setTimeout(() => { setCur(idx); setAnim(true) }, 80)
  }, [])

  useEffect(() => {
    timer.current = setInterval(() => go((cur + 1) % SLIDES.length), 5000)
    return () => clearInterval(timer.current)
  }, [cur, go])

  const s = SLIDES[cur]

  return (
    <section style={{
      background: s.bg,
      padding: '72px 24px',
      position: 'relative', overflow: 'hidden',
      transition: 'background 0.6s ease',
      minHeight: 440,
    }}>
      {/* Animated blobs */}
      <div style={{ position:'absolute', top:-100, right:-80, width:500, height:500, borderRadius:'50%',
        background:`radial-gradient(circle, ${s.accent}18, transparent 70%)`, transition:'background 0.6s' }} />
      <div style={{ position:'absolute', bottom:-80, left:-60, width:380, height:380, borderRadius:'50%',
        background:`radial-gradient(circle, ${s.accent}10, transparent 70%)` }} />

      <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', alignItems:'center', gap:48, position:'relative', zIndex:1 }}>
        {/* Text side */}
        <div style={{ flex:1, opacity: anim?1:0, transform: anim?'none':'translateX(-20px)', transition:'all 0.5s ease' }}>
          <span style={{
            display:'inline-block', padding:'6px 16px', borderRadius:20,
            background:`${s.accent}25`, color: s.accent,
            fontSize:13, fontWeight:700, marginBottom:18, border:`1px solid ${s.accent}40`,
          }}>{s.badge}</span>

          <h1 style={{ margin:'0 0 6px', fontSize:52, fontWeight:900, color:'#fff', lineHeight:1.1, letterSpacing:-1 }}>
            {s.title}
          </h1>
          <p style={{ margin:'0 0 14px', fontSize:24, fontWeight:700, color: s.accent }}>{s.subtitle}</p>
          <p style={{ margin:'0 0 32px', fontSize:16, color:'rgba(255,255,255,.65)', lineHeight:1.7 }}>{s.desc}</p>

          <div style={{ display:'flex', gap:12 }}>
            <Link to={s.cta} style={{
              padding:'13px 28px', borderRadius:12, background: s.accent,
              color:'#fff', fontWeight:800, fontSize:15, textDecoration:'none',
              boxShadow:`0 8px 24px ${s.accent}55`, transition:'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.filter='brightness(1.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.filter='none' }}
            >
              🛒 Mua ngay
            </Link>
            <Link to="/products" style={{
              padding:'13px 28px', borderRadius:12,
              background:'rgba(255,255,255,.1)', color:'#fff',
              fontWeight:700, fontSize:15, textDecoration:'none',
              border:'1.5px solid rgba(255,255,255,.25)', transition:'all .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.18)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.1)'}
            >
              Xem tất cả
            </Link>
          </div>

          {/* Trust row */}
          <div style={{ display:'flex', gap:24, marginTop:36 }}>
            {['✅ Hàng chính hãng', '🚚 Giao toàn quốc', '🔧 Bảo hành tận nơi'].map(b => (
              <span key={b} style={{ fontSize:13, color:'rgba(255,255,255,.55)', fontWeight:600 }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Visual side */}
        <div style={{
          flex:1, maxWidth:420, textAlign:'center',
          opacity: anim?1:0, transform: anim?'none':'translateX(20px)', transition:'all 0.5s ease',
        }}>
          <div style={{
            background:'rgba(255,255,255,.06)', borderRadius:28, padding:'40px 32px',
            border:`1px solid ${s.accent}30`, backdropFilter:'blur(12px)',
          }}>
            <div style={{ fontSize:110, lineHeight:1, marginBottom:14, filter:'drop-shadow(0 8px 32px rgba(0,0,0,.4))' }}>
              {s.emoji}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['500+','Sản phẩm'],['10K+','Khách hàng'],['8','Thương hiệu'],['24/7','Hỗ trợ']].map(([n,l]) => (
                <div key={l} style={{ background:'rgba(255,255,255,.07)', borderRadius:12, padding:'10px 0' }}>
                  <p style={{ margin:0, fontSize:20, fontWeight:900, color: s.accent }}>{n}</p>
                  <p style={{ margin:'2px 0 0', fontSize:12, color:'rgba(255,255,255,.5)' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide dots */}
      <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', display:'flex', gap:8 }}>
        {SLIDES.map((_,i) => (
          <button key={i} onClick={() => go(i)} style={{
            width: i===cur ? 28 : 8, height:8, borderRadius:4,
            background: i===cur ? s.accent : 'rgba(255,255,255,.3)',
            border:'none', cursor:'pointer', padding:0,
            transition:'all .3s',
          }} />
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   MARQUEE (chạy ngang)
═══════════════════════════════════════════════════════ */
function Marquee() {
  const items = [
    '🔥 Flash Sale — Giảm đến 30%',
    '🚚 Miễn phí giao hàng đơn từ 10 triệu',
    '✅ Bảo hành chính hãng 12–36 tháng',
    '💳 Trả góp 0% lãi suất qua thẻ tín dụng',
    '🎁 Tặng túi chống sốc & chuột khi mua laptop',
    '🔧 Hỗ trợ kỹ thuật 24/7 tại nhà',
    '⭐ Hơn 10.000 khách hàng hài lòng',
    '📦 Đổi trả trong 15 ngày nếu lỗi nhà sản xuất',
  ]
  const text = [...items, ...items].join('   ·   ')

  return (
    <div style={{ background:'#1a2341', overflow:'hidden', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
      <style>{`
        @keyframes marquee { from { transform:translateX(0) } to { transform:translateX(-50%) } }
      `}</style>
      <div style={{
        display:'inline-block', whiteSpace:'nowrap',
        animation:'marquee 32s linear infinite',
        fontSize:13, color:'#94a3b8', fontWeight:600, letterSpacing:.3,
      }}>
        &nbsp;&nbsp;&nbsp;{text}&nbsp;&nbsp;&nbsp;{text}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   NAVBAR (với dropdown danh mục)
═══════════════════════════════════════════════════════ */
function Navbar({ categories, searchInput, setSearchInput, onSearch, user, logout }) {
  const [catOpen, setCatOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const catRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav style={{
      position:'sticky', top:0, zIndex:200,
      background: scrolled ? 'rgba(26,35,65,.97)' : '#1a2341',
      backdropFilter:'blur(16px)',
      boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,.3)' : 'none',
      transition:'all .3s',
      borderBottom:'1px solid rgba(255,255,255,.06)',
    }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px',
        display:'flex', alignItems:'center', height:64, gap:24 }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <span style={{ fontSize:26 }}>💻</span>
          <span style={{ fontSize:19, fontWeight:900, color:'#fff', letterSpacing:-.5 }}>
            Laptop<span style={{ color:'#60a5fa' }}>Store</span>
          </span>
        </Link>

        {/* Dropdown danh mục */}
        <div ref={catRef} style={{ position:'relative', flexShrink:0 }}>
          <button
            onClick={() => setCatOpen(v => !v)}
            style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'9px 16px', borderRadius:8,
              background: catOpen ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.08)',
              border:'1.5px solid rgba(255,255,255,.12)',
              color:'#e2e8f0', fontSize:14, fontWeight:700, cursor:'pointer',
              transition:'all .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.15)'}
            onMouseLeave={e => !catOpen && (e.currentTarget.style.background='rgba(255,255,255,.08)')}
          >
            ☰ Danh mục
            <span style={{ fontSize:10, opacity:.7, transform: catOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s', display:'inline-block' }}>▼</span>
          </button>

          {/* Mega dropdown */}
          {catOpen && (
            <div style={{
              position:'absolute', top:'calc(100% + 10px)', left:0,
              background:'#fff', borderRadius:16, minWidth:580,
              boxShadow:'0 24px 64px rgba(0,0,0,.18)',
              border:'1px solid #e5e7eb', zIndex:300, overflow:'hidden',
              animation:'dropIn .2s ease',
            }}>
              <div style={{ padding:'12px 16px', background:'#f8fafc', borderBottom:'1px solid #f3f4f6' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:.8 }}>
                  Tất cả danh mục
                </span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                {categories.filter(c => c.status===1).map(cat => {
                  const meta = CAT_META[cat.name] || { icon:'💻', color:'#2563eb', bg:'#eff6ff', desc:'Xem sản phẩm' }
                  return (
                    <Link key={cat.id} to={`/products?category_id=${cat.id}`}
                      onClick={() => setCatOpen(false)}
                      style={{ textDecoration:'none' }}
                    >
                      <div style={{
                        display:'flex', alignItems:'center', gap:14,
                        padding:'14px 20px', transition:'background .15s', cursor:'pointer',
                        borderBottom:'1px solid #f9fafb',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background='#f8fafc' }}
                        onMouseLeave={e => { e.currentTarget.style.background='transparent' }}
                      >
                        <div style={{
                          width:44, height:44, borderRadius:12, flexShrink:0,
                          background: meta.bg, display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:22,
                        }}>{meta.icon}</div>
                        <div>
                          <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#111827' }}>{cat.name}</p>
                          <p style={{ margin:'2px 0 0', fontSize:12, color:'#9ca3af' }}>{meta.desc}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div style={{ padding:'12px 20px', background:'#f8fafc', borderTop:'1px solid #f3f4f6', textAlign:'center' }}>
                <Link to="/products" onClick={() => setCatOpen(false)}
                  style={{ fontSize:13, color:'#2563eb', fontWeight:700, textDecoration:'none' }}>
                  Xem tất cả sản phẩm →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <form onSubmit={onSearch} style={{ flex:1, maxWidth:500 }}>
          <div style={{ display:'flex', background:'rgba(255,255,255,.1)', borderRadius:10, overflow:'hidden',
            border:'1.5px solid rgba(255,255,255,.12)', transition:'all .2s' }}
            onFocusCapture={e => e.currentTarget.style.borderColor='#60a5fa'}
            onBlurCapture={e => e.currentTarget.style.borderColor='rgba(255,255,255,.12)'}
          >
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm laptop theo tên, hãng, cấu hình..."
              style={{
                flex:1, padding:'10px 16px', border:'none', background:'transparent',
                fontSize:14, outline:'none', color:'#fff',
              }}
            />
            <button type="submit" style={{
              padding:'10px 18px', background:'#2563eb', border:'none',
              color:'#fff', cursor:'pointer', fontSize:15, transition:'background .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background='#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.background='#2563eb'}
            >
              🔍
            </button>
          </div>
        </form>

        {/* Right nav */}
        <div style={{ display:'flex', gap:4, alignItems:'center', marginLeft:'auto', flexShrink:0 }}>
          <NavLink to="/products" label="Sản phẩm" icon="🖥️" />
          <NavLink to="/cart" label="Giỏ hàng" icon="🛒" />
          <NavLink to="/orders" label="Đơn hàng" icon="📦" />

          {/* User */}
          <div ref={userRef} style={{ position:'relative' }}>
            <button onClick={() => setUserOpen(v => !v)}
              style={{
                padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600,
                color:'#e2e8f0', background: userOpen ? 'rgba(255,255,255,.15)' : 'transparent',
                border:'none', cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', gap:6,
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.12)'}
              onMouseLeave={e => !userOpen && (e.currentTarget.style.background='transparent')}
            >
              👤 {user ? user.name?.split(' ').pop() : 'Tài khoản'}
            </button>
            {userOpen && (
              <div style={{
                position:'absolute', top:'calc(100% + 8px)', right:0,
                background:'#fff', borderRadius:12, minWidth:180,
                boxShadow:'0 16px 48px rgba(0,0,0,.15)',
                border:'1px solid #f0f0f5', zIndex:300, overflow:'hidden',
                animation:'dropIn .2s ease',
              }}>
                {(user ? [
                  { to:'/profile', label:'👤 Tài khoản', action: null },
                  { to:'/orders',  label:'📦 Đơn hàng',  action: null },
                ] : [
                  { to:'/login',    label:'🔑 Đăng nhập', action: null },
                  { to:'/register', label:'📝 Đăng ký',   action: null },
                ]).map(item => (
                  <Link key={item.to} to={item.to} onClick={() => setUserOpen(false)}
                    style={{ display:'block', padding:'11px 18px', fontSize:14, color:'#374151',
                      textDecoration:'none', transition:'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    {item.label}
                  </Link>
                ))}
                {user && (
                  <button
                    onClick={() => { setUserOpen(false); logout() }}
                    style={{ display:'block', width:'100%', textAlign:'left', padding:'11px 18px',
                      fontSize:14, color:'#ef4444', background:'transparent', border:'none',
                      borderTop:'1px solid #f3f4f6', cursor:'pointer', fontWeight:600,
                      transition:'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    🚪 Đăng xuất
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, label, icon }) {
  return (
    <Link to={to} style={{
      padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600,
      color:'#e2e8f0', textDecoration:'none', transition:'all .15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.12)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}
    >
      {icon} {label}
    </Link>
  )
}

/* ═══════════════════════════════════════════════════════
   AI CHAT BOX
═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   SECTION: SẢN PHẨM THEO DANH MỤC (từng section theo thứ tự)
═══════════════════════════════════════════════════════ */
function CategoryProductSection({ cat }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const meta = CAT_META[cat.name] || { icon:'💻', color:'#2563eb', bg:'#eff6ff', desc:'Xem sản phẩm' }

  useEffect(() => {
    api.get(`/products?category_id=${cat.id}&per_page=8&sort=bestseller`)
      .then(r => setProducts(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [cat.id])

  if (!loading && products.length === 0) return null

  return (
    <div style={{ marginBottom:64 }}>
      {/* Section header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:52, height:52, borderRadius:16, flexShrink:0,
            background: meta.bg,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:26, boxShadow:`0 4px 14px ${meta.color}22`,
          }}>{meta.icon}</div>
          <div style={{ borderLeft:`4px solid ${meta.color}`, paddingLeft:14 }}>
            <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:'#111827', letterSpacing:-.3 }}>{cat.name}</h2>
            <p style={{ margin:'2px 0 0', fontSize:13, color:'#6b7280' }}>{meta.desc}</p>
          </div>
        </div>
        <Link to={`/products?category_id=${cat.id}`} style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'9px 20px', borderRadius:10,
          background: meta.bg, color: meta.color,
          fontWeight:700, fontSize:14, textDecoration:'none',
          border:`1.5px solid ${meta.color}30`, transition:'all .2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background=meta.color; e.currentTarget.style.color='#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background=meta.bg; e.currentTarget.style.color=meta.color }}
        >
          Xem tất cả →
        </Link>
      </div>

      {/* Products grid */}
      {loading ? <Spinner /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px,1fr))', gap:20 }}>
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}

function ProductsByCategory({ categories }) {
  const cats = categories.filter(c => c.status === 1)
  if (!cats.length) return null

  return (
    <section style={{ padding:'72px 24px', background:'#fff' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <h2 style={{ margin:'0 0 8px', fontSize:34, fontWeight:900, color:'#111827' }}>
            Sản phẩm theo danh mục
          </h2>
          <p style={{ margin:0, color:'#6b7280', fontSize:15 }}>Khám phá laptop phù hợp với nhu cầu của bạn</p>
        </div>
        {cats.map(cat => <CategoryProductSection key={cat.id} cat={cat} />)}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION: BỘ LỌC NHANH
═══════════════════════════════════════════════════════ */
function QuickFilter({ categories, brands }) {
  const navigate = useNavigate()
  const [budget, setBudget] = useState('')
  const [catId, setCatId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [need, setNeed] = useState('')

  const NEEDS = [
    { v:'gaming', label:'🎮 Chơi game' },
    { v:'office', label:'💼 Văn phòng' },
    { v:'design', label:'🎨 Đồ họa' },
    { v:'student', label:'📚 Sinh viên' },
  ]
  const BUDGETS = [
    { v:'0-10000000', label:'Dưới 10 triệu' },
    { v:'10000000-20000000', label:'10 – 20 triệu' },
    { v:'20000000-35000000', label:'20 – 35 triệu' },
    { v:'35000000-999999999', label:'Trên 35 triệu' },
  ]

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (catId)   params.set('category_id', catId)
    if (brandId) params.set('brand_id', brandId)
    if (budget) {
      const [min, max] = budget.split('-')
      if (min) params.set('min_price', min)
      if (max) params.set('max_price', max)
    }
    navigate(`/products?${params.toString()}`)
  }

  return (
    <section style={{ padding:'48px 24px', background:'linear-gradient(135deg, #1a2341 0%, #1e3a5f 100%)' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <h2 style={{ margin:'0 0 8px', fontSize:26, fontWeight:900, color:'#fff' }}>
            🔍 Tìm laptop phù hợp ngay
          </h2>
          <p style={{ margin:0, color:'#94a3b8', fontSize:14 }}>Chọn nhu cầu và ngân sách — chúng tôi gợi ý cho bạn</p>
        </div>

        <div style={{ background:'rgba(255,255,255,.06)', borderRadius:20, padding:'28px 32px',
          border:'1px solid rgba(255,255,255,.1)', backdropFilter:'blur(12px)' }}>

          {/* Nhu cầu */}
          <div style={{ marginBottom:20 }}>
            <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.8 }}>
              Nhu cầu sử dụng
            </p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {NEEDS.map(n => (
                <button key={n.v} onClick={() => setNeed(need===n.v ? '' : n.v)}
                  style={{
                    padding:'9px 18px', borderRadius:10,
                    background: need===n.v ? '#2563eb' : 'rgba(255,255,255,.08)',
                    color: need===n.v ? '#fff' : '#e2e8f0',
                    border: need===n.v ? '1.5px solid #2563eb' : '1.5px solid rgba(255,255,255,.12)',
                    fontSize:14, fontWeight:600, cursor:'pointer', transition:'all .2s',
                  }}
                >{n.label}</button>
              ))}
            </div>
          </div>

          {/* Row 2: 3 bộ lọc + nút */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, alignItems:'end' }}>
            <div>
              <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.8 }}>Ngân sách</p>
              <select value={budget} onChange={e => setBudget(e.target.value)}
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid rgba(255,255,255,.15)',
                  background:'rgba(255,255,255,.1)', color: budget ? '#fff' : '#94a3b8',
                  fontSize:14, outline:'none', cursor:'pointer' }}>
                <option value="">Tất cả mức giá</option>
                {BUDGETS.map(b => <option key={b.v} value={b.v} style={{ background:'#1a2341' }}>{b.label}</option>)}
              </select>
            </div>

            <div>
              <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.8 }}>Danh mục</p>
              <select value={catId} onChange={e => setCatId(e.target.value)}
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid rgba(255,255,255,.15)',
                  background:'rgba(255,255,255,.1)', color: catId ? '#fff' : '#94a3b8',
                  fontSize:14, outline:'none', cursor:'pointer' }}>
                <option value="">Tất cả danh mục</option>
                {categories.filter(c=>c.status===1).map(c => (
                  <option key={c.id} value={c.id} style={{ background:'#1a2341' }}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.8 }}>Thương hiệu</p>
              <select value={brandId} onChange={e => setBrandId(e.target.value)}
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid rgba(255,255,255,.15)',
                  background:'rgba(255,255,255,.1)', color: brandId ? '#fff' : '#94a3b8',
                  fontSize:14, outline:'none', cursor:'pointer' }}>
                <option value="">Tất cả hãng</option>
                {brands.filter(b=>b.status===1).map(b => (
                  <option key={b.id} value={b.id} style={{ background:'#1a2341' }}>{b.name}</option>
                ))}
              </select>
            </div>

            <button onClick={handleFilter} style={{
              padding:'11px 28px', borderRadius:10,
              background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff',
              border:'none', fontSize:15, fontWeight:800, cursor:'pointer',
              boxShadow:'0 8px 24px rgba(37,99,235,.4)', transition:'all .2s',
              whiteSpace:'nowrap',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(37,99,235,.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 24px rgba(37,99,235,.4)' }}
            >
              🔍 Tìm ngay
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION: FLASH SALE COUNTDOWN
═══════════════════════════════════════════════════════ */
function FlashSaleCountdown({ products }) {
  const [timeLeft, setTimeLeft] = useState({ h:5, m:23, s:47 })

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev
        s--
        if (s < 0) { s=59; m-- }
        if (m < 0) { m=59; h-- }
        if (h < 0) { h=23; m=59; s=59 }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const pad = n => String(n).padStart(2, '0')
  const flashItems = products.filter(p => p.sale_price).slice(0, 6)

  if (!flashItems.length) return null

  return (
    <section style={{ padding:'64px 24px', background:'#fff' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32, flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <h2 style={{ margin:0, fontSize:32, fontWeight:900, color:'#111827' }}>⚡ Flash Sale</h2>
            {/* Countdown */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:13, color:'#6b7280', fontWeight:600 }}>Kết thúc sau:</span>
              {[timeLeft.h, timeLeft.m, timeLeft.s].map((v, i) => (
                <span key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{
                    display:'inline-block', minWidth:40, textAlign:'center',
                    padding:'5px 8px', background:'#1a2341', color:'#fff',
                    fontSize:18, fontWeight:900, borderRadius:8,
                    fontVariantNumeric:'tabular-nums',
                  }}>{pad(v)}</span>
                  {i < 2 && <span style={{ fontSize:16, fontWeight:900, color:'#ef4444' }}>:</span>}
                </span>
              ))}
            </div>
          </div>
          <Link to="/products?sale=1" style={{
            padding:'9px 20px', borderRadius:10, border:'1.5px solid #ef4444',
            color:'#ef4444', fontWeight:700, fontSize:14, textDecoration:'none', transition:'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#ef4444' }}
          >Xem tất cả →</Link>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:18 }}>
          {flashItems.map(p => <ProductCard key={p.id} product={p} compact />)}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION: THƯƠNG HIỆU (scroll marquee)
═══════════════════════════════════════════════════════ */
function BrandsSection({ brands }) {
  const list = brands.length > 0
    ? brands.filter(b => b.status===1)
    : ['ASUS','Dell','HP','Lenovo','Apple','Acer','MSI','Samsung'].map((n,i) => ({id:i,name:n,status:1}))

  return (
    <section style={{ padding:'48px 24px', background:'#f8fafc', overflow:'hidden' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>
        <h2 style={{ textAlign:'center', margin:'0 0 32px', fontSize:26, fontWeight:900, color:'#111827' }}>
          Thương hiệu hàng đầu
        </h2>
        <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:12 }}>
          {list.map(brand => (
            <Link key={brand.id} to={`/products?brand_id=${brand.id}`} style={{ textDecoration:'none' }}>
              <div style={{
                padding:'14px 28px', borderRadius:14,
                border:'2px solid #e5e7eb', background:'#fff',
                fontSize:15, fontWeight:800, color:'#374151',
                cursor:'pointer', transition:'all .2s',
                display:'flex', alignItems:'center', gap:8,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor='#2563eb'
                  e.currentTarget.style.color='#2563eb'
                  e.currentTarget.style.background='#eff6ff'
                  e.currentTarget.style.transform='translateY(-2px)'
                  e.currentTarget.style.boxShadow='0 6px 18px rgba(37,99,235,.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor='#e5e7eb'
                  e.currentTarget.style.color='#374151'
                  e.currentTarget.style.background='#fff'
                  e.currentTarget.style.transform='none'
                  e.currentTarget.style.boxShadow='none'
                }}
              >
                <span style={{ fontSize:18 }}>{BRAND_LOGOS[brand.name] || '💻'}</span>
                {brand.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [searchInput, setSearchInput] = useState('')
  const [featured,    setFeatured]    = useState([])
  const [bestseller,  setBestseller]  = useState([])
  const [categories,  setCategories]  = useState([])
  const [brands,      setBrands]      = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/products?is_featured=1&per_page=8'),
      api.get('/products?is_bestseller=1&per_page=8'),
      api.get('/categories'),
      api.get('/brands'),
    ]).then(([feat, best, cats, brs]) => {
      setFeatured(feat.data.data   || [])
      setBestseller(best.data.data || [])
      setCategories(cats.data.data || [])
      setBrands(brs.data.data      || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) navigate(`/products?search=${encodeURIComponent(searchInput.trim())}`)
  }

  return (
    <div style={{ fontFamily:"'Be Vietnam Pro','Segoe UI',sans-serif", background:'#fff', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin      { to { transform:rotate(360deg) } }
        @keyframes fadeUp    { from { opacity:0;transform:translateY(20px) } to { opacity:1;transform:none } }
        @keyframes dropIn    { from { opacity:0;transform:translateY(-8px) } to { opacity:1;transform:none } }
        @keyframes slideUp   { from { opacity:0;transform:translateY(20px) } to { opacity:1;transform:none } }
        @keyframes bounce    { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes pulseRing { 0%{transform:scale(.8);opacity:1} 70%{transform:scale(1.4);opacity:0} 100%{opacity:0} }
        .ld-spinner {
          width:36px;height:36px;margin:0 auto;
          border:4px solid #e5e7eb;border-top-color:#2563eb;
          border-radius:50%;animation:spin .8s linear infinite;
        }
        * { box-sizing:border-box }
        ::placeholder { color:rgba(255,255,255,.4) !important }
      `}</style>

      {/* Marquee */}
      <Marquee />

      {/* Navbar */}
      <Navbar
        categories={categories}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSearch={handleSearch}
        user={user}
        logout={logout}
      />

      {/* Hero Slider */}
      <HeroSlider />

      {/* Quick Filter */}
      <QuickFilter categories={categories} brands={brands} />

      {/* Danh mục */}
      <section style={{ padding:'72px 24px', background:'#f8fafc' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <h2 style={{ margin:'0 0 8px', fontSize:34, fontWeight:900, color:'#111827' }}>Danh mục sản phẩm</h2>
            <p style={{ margin:0, color:'#6b7280', fontSize:15 }}>Chọn dòng laptop phù hợp với nhu cầu của bạn</p>
          </div>
          {loading ? <Spinner /> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:16 }}>
              {categories.filter(c => c.status===1).map(cat => {
                const meta = CAT_META[cat.name] || { icon:'💻', color:'#2563eb', bg:'#eff6ff', desc:'Xem sản phẩm' }
                return (
                  <Link key={cat.id} to={`/products?category_id=${cat.id}`} style={{ textDecoration:'none' }}>
                    <div style={{
                      background:'#fff', borderRadius:18, padding:'28px 20px',
                      textAlign:'center', border:`2px solid #f0f0f5`,
                      transition:'all .25s', cursor:'pointer',
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor=meta.color
                        e.currentTarget.style.boxShadow=`0 10px 28px ${meta.color}20`
                        e.currentTarget.style.transform='translateY(-4px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor='#f0f0f5'
                        e.currentTarget.style.boxShadow='none'
                        e.currentTarget.style.transform='none'
                      }}
                    >
                      <div style={{ width:64, height:64, borderRadius:16, background:meta.bg,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:30, margin:'0 auto 14px' }}>{meta.icon}</div>
                      <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:800, color:'#111827' }}>{cat.name}</p>
                      <p style={{ margin:0, fontSize:12, color:meta.color, fontWeight:600 }}>{meta.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Flash Sale */}
      <FlashSaleCountdown products={[...featured, ...bestseller]} />

      {/* Sản phẩm nổi bật */}
      <section style={{ padding:'72px 24px', background:'#f8fafc' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32 }}>
            <div>
              <h2 style={{ margin:'0 0 6px', fontSize:32, fontWeight:900, color:'#111827' }}>⭐ Sản phẩm nổi bật</h2>
              <p style={{ margin:0, color:'#6b7280', fontSize:15 }}>Những mẫu laptop được yêu thích nhất</p>
            </div>
            <Link to="/products?is_featured=1" style={{
              padding:'9px 20px', borderRadius:10, border:'1.5px solid #2563eb',
              color:'#2563eb', fontWeight:700, fontSize:14, textDecoration:'none', transition:'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background='#2563eb'; e.currentTarget.style.color='#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#2563eb' }}
            >Xem tất cả →</Link>
          </div>
          {loading ? <Spinner /> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:20 }}>
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Sản phẩm theo danh mục (tabs) */}
      <ProductsByCategory categories={categories} />

      {/* Bán chạy */}
      <section style={{ padding:'72px 24px', background:'#f8fafc' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32 }}>
            <div>
              <h2 style={{ margin:'0 0 6px', fontSize:32, fontWeight:900, color:'#111827' }}>🔥 Bán chạy nhất</h2>
              <p style={{ margin:0, color:'#6b7280', fontSize:15 }}>Top sản phẩm được khách hàng tin chọn nhiều nhất</p>
            </div>
            <Link to="/products?is_bestseller=1" style={{
              padding:'9px 20px', borderRadius:10, border:'1.5px solid #2563eb',
              color:'#2563eb', fontWeight:700, fontSize:14, textDecoration:'none', transition:'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background='#2563eb'; e.currentTarget.style.color='#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#2563eb' }}
            >Xem tất cả →</Link>
          </div>
          {loading ? <Spinner /> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:20 }}>
              {bestseller.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Thương hiệu */}
      <BrandsSection brands={brands} />

      {/* Banner giữa */}
      <section style={{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)', padding:'56px 24px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:24 }}>
          <div>
            <h2 style={{ margin:'0 0 10px', fontSize:30, fontWeight:900, color:'#fff' }}>🎁 Ưu đãi đặc biệt — Giảm đến 30%</h2>
            <p style={{ margin:0, color:'#bfdbfe', fontSize:16 }}>Áp dụng cho laptop gaming và văn phòng cao cấp. Số lượng có hạn!</p>
          </div>
          <Link to="/products" style={{
            display:'inline-flex', alignItems:'center', gap:8, whiteSpace:'nowrap',
            padding:'14px 28px', borderRadius:12,
            background:'#fff', color:'#2563eb',
            fontWeight:800, fontSize:15, textDecoration:'none',
            boxShadow:'0 8px 24px rgba(0,0,0,.2)', transition:'all .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform='none'}
          >🛍️ Mua ngay</Link>
        </div>
      </section>

      {/* Tại sao chọn chúng tôi */}
      <section style={{ padding:'72px 24px', background:'#fff' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <h2 style={{ textAlign:'center', margin:'0 0 12px', fontSize:32, fontWeight:900, color:'#111827' }}>
            Tại sao chọn LaptopStore?
          </h2>
          <p style={{ textAlign:'center', margin:'0 0 48px', color:'#6b7280', fontSize:15 }}>
            Chúng tôi cam kết mang lại trải nghiệm mua sắm tốt nhất
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:24 }}>
            {[
              { icon:'🏆', title:'Chính hãng 100%', desc:'Tất cả sản phẩm nhập khẩu chính hãng, có tem phân phối chính thức.', color:'#f59e0b' },
              { icon:'💰', title:'Giá cạnh tranh',  desc:'Cam kết giá tốt nhất thị trường. Tìm thấy rẻ hơn — chúng tôi hoàn tiền.', color:'#10b981' },
              { icon:'🚚', title:'Giao hàng nhanh', desc:'Giao hàng toàn quốc trong 1-3 ngày. Miễn phí cho đơn từ 10 triệu.', color:'#2563eb' },
              { icon:'🔧', title:'Bảo hành tận nơi',desc:'Đội kỹ thuật hỗ trợ 24/7. Bảo hành tại nhà trong vòng 24h.', color:'#7c3aed' },
              { icon:'↩️', title:'Đổi trả dễ dàng', desc:'15 ngày đổi trả miễn phí nếu sản phẩm có lỗi từ nhà sản xuất.', color:'#ef4444' },
              { icon:'💳', title:'Thanh toán linh hoạt',desc:'Hỗ trợ COD, chuyển khoản, trả góp 0% lãi suất qua thẻ tín dụng.', color:'#0ea5e9' },
            ].map(f => (
              <div key={f.title} style={{
                background:'#fff', borderRadius:18, padding:'28px 24px',
                border:'2px solid #f0f0f5', transition:'all .2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow=`0 10px 30px ${f.color}20`
                  e.currentTarget.style.borderColor=f.color
                  e.currentTarget.style.transform='translateY(-3px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow='none'
                  e.currentTarget.style.borderColor='#f0f0f5'
                  e.currentTarget.style.transform='none'
                }}
              >
                <div style={{ fontSize:36, marginBottom:14 }}>{f.icon}</div>
                <h3 style={{ margin:'0 0 10px', fontSize:16, fontWeight:800, color:'#111827' }}>{f.title}</h3>
                <p style={{ margin:0, fontSize:14, color:'#6b7280', lineHeight:1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:'#1a2341', color:'#94a3b8', padding:'48px 24px 24px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:40, marginBottom:40 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <span style={{ fontSize:22 }}>💻</span>
                <span style={{ fontSize:18, fontWeight:900, color:'#fff' }}>
                  Laptop<span style={{ color:'#60a5fa' }}>Store</span>
                </span>
              </div>
              <p style={{ margin:'0 0 16px', fontSize:13, lineHeight:1.7 }}>Hệ thống bán laptop chính hãng uy tín hàng đầu Việt Nam.</p>
              <p style={{ margin:0, fontSize:13 }}>📞 1800-1234 (Miễn phí)</p>
              <p style={{ margin:'4px 0 0', fontSize:13 }}>📧 support@laptopstore.vn</p>
            </div>
            {[
              { title:'Sản phẩm', links:[
                { label:'Laptop Gaming',      href:'/products?category_id=1', ai: false },
                { label:'Laptop Văn phòng',   href:'/products?category_id=2', ai: false },
                { label:'Laptop Đồ họa',      href:'/products?category_id=3', ai: false },
                { label:'Laptop Sinh viên',   href:'/products?category_id=4', ai: false },
              ]},
              { title:'Hỗ trợ', links:[
                { label:'Hướng dẫn mua hàng',  ai: true, q:'Hướng dẫn tôi cách mua hàng và thanh toán trên LaptopStore' },
                { label:'Chính sách bảo hành', ai: true, q:'Chính sách bảo hành tại LaptopStore như thế nào?' },
                { label:'Chính sách đổi trả',  ai: true, q:'Tôi muốn biết chính sách đổi trả hàng tại LaptopStore' },
                { label:'Tư vấn chọn laptop',  ai: true, q:'Giúp tôi tư vấn chọn laptop phù hợp với nhu cầu' },
                { label:'Liên hệ hỗ trợ',      ai: true, q:'Tôi cần liên hệ bộ phận hỗ trợ khách hàng' },
              ]},
              { title:'Thương hiệu', links:[
                { label:'ASUS', href:'/products?brand_id=1', ai: false },
                { label:'Dell', href:'/products?brand_id=2', ai: false },
                { label:'HP',   href:'/products?brand_id=3', ai: false },
                { label:'Lenovo', href:'/products?brand_id=4', ai: false },
                { label:'Apple', href:'/products?brand_id=5', ai: false },
                { label:'MSI',  href:'/products?brand_id=6', ai: false },
              ]},
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ margin:'0 0 16px', fontSize:14, fontWeight:700, color:'#fff' }}>{col.title}</h4>
                {col.links.map(l => (
                  l.ai ? (
                    <p key={l.label} style={{ margin:'0 0 8px', fontSize:13, cursor:'pointer', transition:'color .15s', display:'flex', alignItems:'center', gap:5 }}
                      onClick={() => window._aiChatSend && window._aiChatSend(l.q)}
                      onMouseEnter={e => e.currentTarget.style.color='#60a5fa'}
                      onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}
                    >
                      <span style={{ fontSize:10, opacity:.6 }}>💬</span> {l.label}
                    </p>
                  ) : (
                    <p key={l.label} style={{ margin:'0 0 8px', fontSize:13, cursor:'pointer', transition:'color .15s' }}
                      onClick={() => window.location.href = l.href}
                      onMouseEnter={e => e.currentTarget.style.color='#60a5fa'}
                      onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}
                    >{l.label}</p>
                  )
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:24,
            display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <p style={{ margin:0, fontSize:13 }}>© 2025 LaptopStore. Tất cả quyền được bảo lưu.</p>
            <div style={{ display:'flex', gap:16 }}>
              {['Điều khoản dịch vụ','Chính sách bảo mật','Cookie'].map(l => (
                <span key={l} style={{ fontSize:13, cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color='#60a5fa'}
                  onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}
                >{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chat */}
      <AIChatBox />
    </div>
  )
}