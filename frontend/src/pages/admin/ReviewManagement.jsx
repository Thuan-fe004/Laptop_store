// src/pages/admin/ReviewManagement.jsx
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { adminReviewAPI } from '../../services/api'
import { IMG_BASE_URL } from '../../constants/config';
const STARS = (r) => '★'.repeat(r) + '☆'.repeat(5 - r)

const STATUS_BADGE = {
  1: { label: 'Hiển thị', color: '#16a34a', bg: '#f0fdf4' },
  0: { label: 'Đã ẩn',    color: '#dc2626', bg: '#fef2f2' },
}

// ── Helper: build full image URL ──────────────────────────────

function imgUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${IMG_BASE_URL}/static/uploads/${url}`
}

function StarBar({ rating, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#6b7280', width: 20, textAlign: 'right' }}>{rating}★</span>
      <div style={{ flex: 1, height: 7, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 4, transition: 'width .8s' }} />
      </div>
      <span style={{ fontSize: 11, color: '#9ca3af', width: 24 }}>{count}</span>
    </div>
  )
}

// ── Modal xem chi tiết ────────────────────────────────────────
function ReviewDetailModal({ rv, onClose, onToggle, onDelete, RATING_COLORS }) {
  if (!rv) return null
  const sb = STATUS_BADGE[rv.status] || STATUS_BADGE[0]
  const images = Array.isArray(rv.images) ? rv.images : []

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: 32,
          width: '100%', maxWidth: 580, maxHeight: '88vh',
          overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.2)',
          animation: 'fadeUp .2s ease',
        }}
      >
        {/* Header modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#111827' }}>
            Chi tiết đánh giá #{rv.id}
          </h2>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Info rows */}
        {[
          { label: 'Khách hàng', value: `${rv.user_name} — ${rv.user_email}` },
          { label: 'Sản phẩm',   value: rv.product_name },
          { label: 'Ngày',       value: rv.created_at },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ width: 110, flexShrink: 0, fontSize: 13, color: '#6b7280', fontWeight: 700 }}>{label}</span>
            <span style={{ fontSize: 14, color: '#111827' }}>{value}</span>
          </div>
        ))}

        {/* Rating */}
        <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
          <span style={{ width: 110, flexShrink: 0, fontSize: 13, color: '#6b7280', fontWeight: 700 }}>Điểm</span>
          <span style={{ fontSize: 22, color: RATING_COLORS[rv.rating] || '#f59e0b' }}>
            {'★'.repeat(rv.rating)}<span style={{ color: '#e5e7eb' }}>{'★'.repeat(5 - rv.rating)}</span>
          </span>
          <span style={{ fontWeight: 800, fontSize: 15, color: RATING_COLORS[rv.rating] }}>{rv.rating}/5</span>
        </div>

        {/* Trạng thái */}
        <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
          <span style={{ width: 110, flexShrink: 0, fontSize: 13, color: '#6b7280', fontWeight: 700 }}>Trạng thái</span>
          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sb.bg, color: sb.color }}>
            {sb.label}
          </span>
        </div>

        {/* Nội dung */}
        <div style={{ marginTop: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>Nội dung đánh giá</p>
          <p style={{ margin: 0, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, fontSize: 14, lineHeight: 1.8, color: '#374151', border: '1px solid #f0f0f5' }}>
            {rv.comment}
          </p>
        </div>

        {/* ── Ảnh đính kèm ── */}
        {images.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
              📷 Ảnh đính kèm ({images.length})
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {images.map((url, i) => (
                <a key={i} href={imgUrl(url)} target="_blank" rel="noreferrer">
                  <img
                    src={imgUrl(url)}
                    alt={`review-${i + 1}`}
                    style={{
                      width: 96, height: 96, objectFit: 'cover',
                      borderRadius: 10, border: '2px solid #e5e7eb',
                      cursor: 'zoom-in', transition: 'transform .2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            onClick={() => onToggle(rv.id, rv.status)}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
              background: rv.status === 1 ? '#fffbeb' : '#f0fdf4',
              color: rv.status === 1 ? '#d97706' : '#16a34a',
              fontWeight: 700, cursor: 'pointer', fontSize: 14,
              border: `1.5px solid ${rv.status === 1 ? '#fde68a' : '#bbf7d0'}`,
            }}
          >
            {rv.status === 1 ? '🚫 Ẩn đánh giá' : '✅ Hiện đánh giá'}
          </button>
          <button
            onClick={() => onDelete(rv.id)}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              background: '#fff', color: '#ef4444',
              border: '1.5px solid #fee2e2', fontWeight: 700,
              cursor: 'pointer', fontSize: 14,
            }}
          >
            🗑️ Xóa đánh giá
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function ReviewManagement() {
  const [reviews,      setReviews]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [pagination,   setPagination]   = useState({ page: 1, per_page: 15, total: 0, total_pages: 1 })
  const [search,       setSearch]       = useState('')
  const [searchInput,  setSearchInput]  = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [stats,        setStats]        = useState({ total: 0, visible: 0, hidden: 0, avg: 0, dist: {} })
  const [selected,     setSelected]     = useState(null) // modal

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search)             params.search = search
      if (filterStatus !== '') params.status = filterStatus
      const res = await adminReviewAPI.getAll(params)
      setReviews(res.data?.data || [])
      setPagination(res.data?.pagination || { page: 1, per_page: 15, total: 0, total_pages: 1 })

      const all  = res.data?.data || []
      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      all.forEach(r => { if (dist[r.rating] !== undefined) dist[r.rating]++ })
      const total   = res.data?.pagination?.total || 0
      const visible = all.filter(r => r.status === 1).length
      const hidden  = all.filter(r => r.status === 0).length
      const avg     = all.length ? (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1) : 0
      setStats({ total, visible, hidden, avg, dist })
    } catch { toast.error('Không thể tải đánh giá') }
    finally   { setLoading(false) }
  }, [search, filterStatus])

  useEffect(() => { load(1) }, [load])

  const toggleStatus = async (id, currentStatus) => {
    try {
      await adminReviewAPI.toggleStatus(id)
      toast.success(currentStatus === 1 ? 'Đã ẩn đánh giá' : 'Đã hiện đánh giá')
      // Cập nhật lại status ngay trong state (không cần reload)
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: currentStatus === 1 ? 0 : 1 } : r))
      if (selected?.id === id) setSelected(s => ({ ...s, status: currentStatus === 1 ? 0 : 1 }))
    } catch { toast.error('Thao tác thất bại') }
  }

  const deleteReview = async (id) => {
    if (!window.confirm('Xóa vĩnh viễn đánh giá này?')) return
    try {
      await adminReviewAPI.delete(id)
      toast.success('Đã xóa đánh giá')
      setSelected(null)
      load(pagination.page)
    } catch { toast.error('Không thể xóa') }
  }

  const handleSearch = () => setSearch(searchInput.trim())
  const handleReset  = () => { setSearch(''); setSearchInput(''); setFilterStatus('') }

  const RATING_COLORS = { 5: '#16a34a', 4: '#65a30d', 3: '#d97706', 2: '#ea580c', 1: '#dc2626' }

  return (
    <div style={{ padding: 24, fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
        tr.rv-row:hover td { background: #fafafa !important; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#111827' }}>⭐ Quản lý đánh giá</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>Duyệt và quản lý đánh giá sản phẩm từ khách hàng</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng đánh giá', value: pagination.total, icon: '💬', color: '#2563eb', bg: '#eff6ff' },
          { label: 'Đang hiển thị', value: stats.visible,    icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Đã ẩn',         value: stats.hidden,     icon: '🚫', color: '#dc2626', bg: '#fef2f2' },
          { label: 'Điểm TB',       value: `${stats.avg}★`,  icon: '⭐', color: '#f59e0b', bg: '#fffbeb' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid rgba(0,0,0,.04)' }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', border: '1.5px solid #f0f0f5', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
        <div style={{ display: 'flex', flex: 1, minWidth: 240, background: '#f8fafc', border: '1.5px solid #e5e7eb', borderRadius: 9, overflow: 'hidden' }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="🔍 Tìm theo tên KH, sản phẩm, nội dung..."
            style={{ flex: 1, padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 14, outline: 'none' }}
          />
          <button onClick={handleSearch} style={{ padding: '9px 16px', background: '#1a2341', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Tìm</button>
        </div>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 14, background: '#fff', cursor: 'pointer', outline: 'none' }}>
          <option value="">Tất cả trạng thái</option>
          <option value="1">Đang hiển thị</option>
          <option value="0">Đã ẩn</option>
        </select>

        <button onClick={handleReset} style={{ padding: '9px 14px', background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          🔄 Reset
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f5', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 14 }}>
            <div style={{ width: 36, height: 36, border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            <p style={{ color: '#6b7280', fontWeight: 600, margin: 0 }}>Đang tải...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <p style={{ fontSize: 48, margin: '0 0 12px' }}>⭐</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>Không có đánh giá nào</p>
            <p style={{ margin: 0, fontSize: 14 }}>Thử thay đổi bộ lọc</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                {['Khách hàng', 'Sản phẩm', 'Điểm', 'Nội dung', 'Ảnh', 'Ngày', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#6b7280', textAlign: 'left', borderBottom: '1.5px solid #f0f0f5', textTransform: 'uppercase', letterSpacing: .6, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map((rv, i) => {
                const sb     = STATUS_BADGE[rv.status] || STATUS_BADGE[0]
                // images có thể là array hoặc JSON string từ API
                const images = Array.isArray(rv.images) ? rv.images
                             : (typeof rv.images === 'string' && rv.images)
                               ? (() => { try { return JSON.parse(rv.images) } catch { return [] } })()
                               : []
                return (
                  <tr
                    key={rv.id}
                    className="rv-row"
                    onClick={() => setSelected({ ...rv, images })}
                    style={{ borderBottom: i < reviews.length - 1 ? '1px solid #f9fafb' : 'none', transition: 'background .15s', animation: 'fadeUp .3s ease' }}
                  >
                    {/* Customer */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2341,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                          {rv.user_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111827' }}>{rv.user_name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{rv.user_email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Product */}
                    <td style={{ padding: '14px 16px', maxWidth: 160 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                        {rv.product_name}
                      </p>
                    </td>

                    {/* Rating */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 18, color: RATING_COLORS[rv.rating] || '#f59e0b' }}>
                          {'★'.repeat(rv.rating)}
                          <span style={{ color: '#e5e7eb' }}>{'★'.repeat(5 - rv.rating)}</span>
                        </span>
                        <span style={{ fontWeight: 800, fontSize: 14, color: RATING_COLORS[rv.rating] }}>{rv.rating}</span>
                      </div>
                    </td>

                    {/* Comment */}
                    <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {rv.comment}
                      </p>
                    </td>

                    {/* ── CỘT ẢNH MỚI ── */}
                    <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                      {images.length > 0 ? (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          {/* Hiện tối đa 2 thumbnail */}
                          {images.slice(0, 2).map((url, idx) => (
                            <a key={idx} href={imgUrl(url)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                              <img
                                src={imgUrl(url)}
                                alt={`img-${idx}`}
                                style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1.5px solid #e5e7eb' }}
                              />
                            </a>
                          ))}
                          {/* Badge "+N" nếu có nhiều hơn 2 */}
                          {images.length > 2 && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', borderRadius: 6, padding: '3px 6px' }}>
                              +{images.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: 12, color: '#9ca3af' }}>
                      {rv.created_at}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sb.bg, color: sb.color }}>
                        {sb.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => toggleStatus(rv.id, rv.status)}
                          title={rv.status === 1 ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
                          style={{ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${rv.status === 1 ? '#fde68a' : '#bbf7d0'}`, background: rv.status === 1 ? '#fffbeb' : '#f0fdf4', color: rv.status === 1 ? '#d97706' : '#16a34a', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .15s' }}
                        >
                          {rv.status === 1 ? '🚫 Ẩn' : '✅ Hiện'}
                        </button>
                        <button
                          onClick={() => deleteReview(rv.id)}
                          title="Xóa đánh giá"
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#fee2e2' }}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Hiển thị {(pagination.page - 1) * pagination.per_page + 1}–{Math.min(pagination.page * pagination.per_page, pagination.total)} / {pagination.total}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <PBtn label="‹" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} />
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - pagination.page) <= 2)
              .map(p => <PBtn key={p} label={p} active={p === pagination.page} onClick={() => load(p)} />)
            }
            <PBtn label="›" disabled={pagination.page >= pagination.total_pages} onClick={() => load(pagination.page + 1)} />
          </div>
        </div>
      )}

      {/* Modal chi tiết */}
      <ReviewDetailModal
        rv={selected}
        onClose={() => setSelected(null)}
        onToggle={toggleStatus}
        onDelete={deleteReview}
        RATING_COLORS={RATING_COLORS}
      />
    </div>
  )
}

function PBtn({ label, active, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      minWidth: 36, height: 36, padding: '0 8px', borderRadius: 8, border: 'none',
      background: active ? '#1a2341' : disabled ? '#f8fafc' : '#fff',
      color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
      fontWeight: active ? 800 : 600, fontSize: 14,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: active ? '0 4px 12px rgba(26,35,65,.3)' : '0 1px 4px rgba(0,0,0,.06)',
      transition: 'all .15s',
    }}>{label}</button>
  )
}