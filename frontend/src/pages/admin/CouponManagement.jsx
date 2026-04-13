// src/pages/admin/CouponManagement.jsx
import { useState, useEffect, useCallback } from 'react'
import { adminCouponAPI } from '../../services/api'

// ═══════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const color = { success: '#10b981', error: '#ef4444', warning: '#f59e0b' }[type] || '#2563eb'
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: '#fff', borderRadius: 12, padding: '14px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,.15)',
      borderLeft: `4px solid ${color}`,
      display: 'flex', alignItems: 'center', gap: 12, maxWidth: 400,
      animation: 'slideIn .3s ease',
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <span style={{ fontSize: 20 }}>
        {type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}
      </span>
      <span style={{ fontSize: 14, color: '#374151', fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}>
        ×
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// BADGE TRẠNG THÁI COUPON
// ═══════════════════════════════════════════════════════
const STATUS_CONFIG = {
  active:    { label: '✅ Đang hoạt động', bg: '#dcfce7', color: '#16a34a' },
  inactive:  { label: '🚫 Đã tắt',         bg: '#fee2e2', color: '#dc2626' },
  expired:   { label: '⏰ Hết hạn',         bg: '#fef3c7', color: '#d97706' },
  upcoming:  { label: '🕐 Chưa bắt đầu',   bg: '#eff6ff', color: '#2563eb' },
  exhausted: { label: '🔴 Đã dùng hết',    bg: '#fce7f3', color: '#be185d' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.inactive
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

// ═══════════════════════════════════════════════════════
// HELPER FORMAT
// ═══════════════════════════════════════════════════════
const fmtMoney = (n) => n == null ? '—' : Number(n).toLocaleString('vi-VN') + 'đ'
const fmtDiscount = (type, value, max) => {
  if (type === 'percent') {
    return `${value}%${max ? ` (tối đa ${fmtMoney(max)})` : ''}`
  }
  return fmtMoney(value)
}

// ═══════════════════════════════════════════════════════
// FORM MODAL – Thêm / Sửa
// ═══════════════════════════════════════════════════════
const EMPTY_FORM = {
  code: '', description: '',
  discount_type: 'percent', discount_value: '',
  max_discount: '', min_order: '0',
  max_uses: '0', starts_at: '', expires_at: '',
  is_active: 1,
}

function CouponFormModal({ coupon, onClose, onSaved }) {
  const isEdit = !!coupon
  const [form, setForm]   = useState(isEdit ? {
    code:           coupon.code,
    description:    coupon.description,
    discount_type:  coupon.discount_type,
    discount_value: String(coupon.discount_value),
    max_discount:   coupon.max_discount != null ? String(coupon.max_discount) : '',
    min_order:      String(coupon.min_order),
    max_uses:       String(coupon.max_uses),
    starts_at:      coupon.starts_at  || '',
    expires_at:     coupon.expires_at || '',
    is_active:      coupon.is_active,
  } : { ...EMPTY_FORM })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const setF = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.code.trim())           e.code = 'Nhập mã coupon'
    if (!form.discount_value || isNaN(Number(form.discount_value)) || Number(form.discount_value) <= 0)
      e.discount_value = 'Giá trị giảm phải lớn hơn 0'
    if (form.discount_type === 'percent' && Number(form.discount_value) > 100)
      e.discount_value = 'Giảm % không được vượt quá 100'
    if (form.expires_at && form.starts_at && form.expires_at <= form.starts_at)
      e.expires_at = 'Ngày kết thúc phải sau ngày bắt đầu'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        code:           form.code.trim().toUpperCase(),
        discount_value: Number(form.discount_value),
        max_discount:   form.max_discount ? Number(form.max_discount) : null,
        min_order:      Number(form.min_order) || 0,
        max_uses:       Number(form.max_uses)  || 0,
        starts_at:      form.starts_at  || null,
        expires_at:     form.expires_at || null,
        is_active:      Number(form.is_active),
      }
      if (isEdit) {
        await adminCouponAPI.update(coupon.id, payload)
        onSaved('Cập nhật mã giảm giá thành công')
      } else {
        await adminCouponAPI.create(payload)
        onSaved('Thêm mã giảm giá thành công')
      }
    } catch (err) {
      setErrors({ api: err.response?.data?.message || 'Có lỗi xảy ra!' })
    } finally {
      setSaving(false)
    }
  }

  const inp = (field) => ({
    width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 14,
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
    border: `1.5px solid ${errors[field] ? '#ef4444' : '#e5e7eb'}`,
  })

  const Label = ({ children, required }) => (
    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
      {children} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
  )

  const ErrMsg = ({ field }) => errors[field]
    ? <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>{errors[field]}</span>
    : null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16, overflowY: 'auto',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600,
        boxShadow: '0 24px 64px rgba(0,0,0,.2)', margin: 'auto',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '22px 28px 16px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>
            {isEdit ? '✏️ Chỉnh sửa mã giảm giá' : '➕ Thêm mã giảm giá mới'}
          </h2>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 8, border: 'none',
            background: '#f3f4f6', cursor: 'pointer', fontSize: 18, color: '#374151',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {errors.api && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626',
            }}>❌ {errors.api}</div>
          )}

          {/* Mã coupon */}
          <div>
            <Label required>Mã coupon</Label>
            <input value={form.code}
              onChange={e => setF('code', e.target.value.toUpperCase())}
              placeholder="VD: SUMMER30"
              maxLength={50}
              style={inp('code')}
              disabled={isEdit} // không cho sửa mã khi edit
            />
            {isEdit && <span style={{ fontSize: 12, color: '#9ca3af' }}>Không thể thay đổi mã sau khi tạo</span>}
            <ErrMsg field="code" />
          </div>

          {/* Mô tả */}
          <div>
            <Label>Mô tả</Label>
            <input value={form.description}
              onChange={e => setF('description', e.target.value)}
              placeholder="VD: Giảm 30% cho đơn đầu tiên"
              style={inp('description')}
            />
          </div>

          {/* Loại & Giá trị giảm */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <Label required>Loại giảm giá</Label>
              <select value={form.discount_type}
                onChange={e => setF('discount_type', e.target.value)}
                style={{ ...inp('discount_type'), background: '#fff' }}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (đ)</option>
              </select>
            </div>
            <div>
              <Label required>Giá trị giảm</Label>
              <input type="number" value={form.discount_value}
                onChange={e => setF('discount_value', e.target.value)}
                placeholder={form.discount_type === 'percent' ? 'VD: 10' : 'VD: 50000'}
                min={0} max={form.discount_type === 'percent' ? 100 : undefined}
                style={inp('discount_value')}
              />
              <ErrMsg field="discount_value" />
            </div>
          </div>

          {/* Giảm tối đa & Đơn tối thiểu */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <Label>Giảm tối đa (đ)</Label>
              <input type="number" value={form.max_discount}
                onChange={e => setF('max_discount', e.target.value)}
                placeholder="Để trống = không giới hạn"
                min={0} style={inp('max_discount')}
              />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>Chỉ áp dụng cho giảm %</span>
            </div>
            <div>
              <Label>Đơn hàng tối thiểu (đ)</Label>
              <input type="number" value={form.min_order}
                onChange={e => setF('min_order', e.target.value)}
                placeholder="0 = không yêu cầu"
                min={0} style={inp('min_order')}
              />
            </div>
          </div>

          {/* Số lần dùng tối đa */}
          <div>
            <Label>Số lần dùng tối đa</Label>
            <input type="number" value={form.max_uses}
              onChange={e => setF('max_uses', e.target.value)}
              placeholder="0 = không giới hạn"
              min={0} style={inp('max_uses')}
            />
          </div>

          {/* Ngày hiệu lực */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <Label>Ngày bắt đầu</Label>
              <input type="date" value={form.starts_at}
                onChange={e => setF('starts_at', e.target.value)}
                style={inp('starts_at')}
              />
            </div>
            <div>
              <Label>Ngày hết hạn</Label>
              <input type="date" value={form.expires_at}
                onChange={e => setF('expires_at', e.target.value)}
                style={inp('expires_at')}
              />
              <ErrMsg field="expires_at" />
            </div>
          </div>

          {/* Trạng thái */}
          <div>
            <Label>Trạng thái</Label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { v: 1, label: '✅ Kích hoạt', bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
                { v: 0, label: '🚫 Tắt',       bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
              ].map(opt => (
                <label key={opt.v} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                  justifyContent: 'center', padding: '10px 0', borderRadius: 10,
                  cursor: 'pointer',
                  background: Number(form.is_active) === opt.v ? opt.bg : '#f9fafb',
                  border: `1.5px solid ${Number(form.is_active) === opt.v ? opt.border : '#e5e7eb'}`,
                }}>
                  <input type="radio" name="coupon_status" value={opt.v}
                    checked={Number(form.is_active) === opt.v}
                    onChange={() => setF('is_active', opt.v)}
                    style={{ accentColor: opt.color }}
                  />
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: Number(form.is_active) === opt.v ? opt.color : '#6b7280',
                  }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button onClick={onClose} style={{
            padding: '10px 22px', borderRadius: 9, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151',
          }}>Huỷ</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '10px 26px', borderRadius: 9,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 700, border: 'none',
            background: saving ? '#93c5fd' : '#2563eb', color: '#fff',
          }}>
            {saving ? '⏳ Đang lưu...' : isEdit ? '💾 Cập nhật' : '➕ Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// MODAL XÁC NHẬN XOÁ
// ═══════════════════════════════════════════════════════
function ConfirmDeleteModal({ coupon, onClose, onConfirm, deleting }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: '32px 28px',
        maxWidth: 400, width: '90%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,.2)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#111827' }}>Xác nhận xoá?</h3>
        <p style={{ margin: '0 0 6px', fontSize: 14, color: '#6b7280' }}>
          Mã coupon: <strong style={{ color: '#111827' }}>{coupon?.code}</strong>
        </p>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#9ca3af' }}>
          Chỉ xoá được khi chưa có đơn hàng nào dùng mã này.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px 0', borderRadius: 10, cursor: 'pointer',
            border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 600, fontSize: 14,
          }}>Huỷ</button>
          <button onClick={onConfirm} disabled={deleting} style={{
            flex: 1, padding: '11px 0', borderRadius: 10, cursor: 'pointer',
            border: 'none', background: deleting ? '#fca5a5' : '#ef4444',
            color: '#fff', fontWeight: 700, fontSize: 14,
          }}>
            {deleting ? '⏳ Đang xoá...' : '🗑️ Xoá'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function CouponManagement() {
  const [coupons,       setCoupons]       = useState([])
  const [pagination,    setPagination]    = useState({ page: 1, pages: 1, total: 0, per_page: 10 })
  const [stats,         setStats]         = useState({ total: 0, active: 0, expired: 0, total_used: 0 })
  const [loading,       setLoading]       = useState(true)
  const [toast,         setToast]         = useState(null)

  const [search,        setSearch]        = useState('')
  const [searchInput,   setSearchInput]   = useState('')
  const [activeFilter,  setActiveFilter]  = useState('')   // '' | '1' | '0'

  const [formModal,     setFormModal]     = useState(null) // null | 'add' | coupon object
  const [deleteModal,   setDeleteModal]   = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  const showToast = (message, type = 'success') => setToast({ message, type })

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Tải danh sách
  const fetchCoupons = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, per_page: 10 }
      if (search)       params.search    = search
      if (activeFilter) params.is_active = activeFilter

      const res = await adminCouponAPI.getAll(params)
      setCoupons(Array.isArray(res.data.data) ? res.data.data : [])
      const pg = res.data.pagination || {}
      setPagination({
        page:     pg.page     ?? 1,
        pages:    pg.pages    ?? 1,
        total:    pg.total    ?? 0,
        per_page: pg.per_page ?? 10,
      })
    } catch {
      showToast('Không thể tải danh sách mã giảm giá!', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, activeFilter])

  // Tải stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminCouponAPI.getStats()
      if (res.data.success) setStats(res.data.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchCoupons(1) }, [fetchCoupons])
  useEffect(() => { fetchStats() },    [fetchStats])

  // Toggle kích hoạt
  const handleToggle = async (coupon) => {
    setActionLoading(p => ({ ...p, [coupon.id]: 'status' }))
    try {
      const res = await adminCouponAPI.toggleStatus(coupon.id)
      showToast(res.data.message)
      fetchCoupons(pagination?.page ?? 1)
      fetchStats()
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác thất bại', 'error')
    } finally {
      setActionLoading(p => ({ ...p, [coupon.id]: null }))
    }
  }

  // Xoá
  const handleDelete = async () => {
    const id = deleteModal.id
    setActionLoading(p => ({ ...p, [id]: 'delete' }))
    try {
      const res = await adminCouponAPI.delete(id)
      showToast(res.data.message)
      setDeleteModal(null)
      fetchCoupons(pagination?.page ?? 1)
      fetchStats()
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể xoá!', 'error')
      setDeleteModal(null)
    } finally {
      setActionLoading(p => ({ ...p, [id]: null }))
    }
  }

  // Mở form sửa
  const handleOpenEdit = async (coupon) => {
    try {
      const res = await adminCouponAPI.getById(coupon.id)
      setFormModal(res.data.data)
    } catch {
      showToast('Không thể tải thông tin mã giảm giá', 'error')
    }
  }

  const filterBtn = (active) => ({
    padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, transition: 'all .15s',
    background: active ? '#2563eb' : '#f3f4f6',
    color:      active ? '#fff'    : '#6b7280',
  })

  // ── RENDER ──────────────────────────────────────────
  return (
    <div style={{
      padding: '28px 32px', background: '#f8fafc',
      minHeight: '100vh', fontFamily: "'Be Vietnam Pro', sans-serif",
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Modal Thêm / Sửa */}
      {formModal !== null && (
        <CouponFormModal
          coupon={formModal === 'add' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={(msg) => {
            setFormModal(null)
            showToast(msg)
            fetchCoupons(pagination?.page ?? 1)
            fetchStats()
          }}
        />
      )}

      {/* Modal Xoá */}
      {deleteModal && (
        <ConfirmDeleteModal
          coupon={deleteModal}
          deleting={actionLoading[deleteModal.id] === 'delete'}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 24,
      }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827' }}>
          🏷️ Quản lý mã giảm giá
        </h1>
        <button onClick={() => setFormModal('add')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '11px 22px', borderRadius: 10, border: 'none',
          background: '#2563eb', color: '#fff', fontWeight: 700,
          cursor: 'pointer', fontSize: 14,
        }}>
          ➕ Thêm mã mới
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng mã',         value: stats.total,      icon: '🏷️', bg: '#eff6ff', clr: '#2563eb' },
          { label: 'Đang hoạt động',  value: stats.active,     icon: '✅', bg: '#f0fdf4', clr: '#16a34a' },
          { label: 'Đã hết hạn',      value: stats.expired,    icon: '⏰', bg: '#fef3c7', clr: '#d97706' },
          { label: 'Lượt dùng',        value: stats.total_used, icon: '🛒', bg: '#fce7f3', clr: '#be185d' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 14, padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: 16,
            border: '1px solid rgba(0,0,0,.05)',
          }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: s.clr, lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '16px 22px',
        boxShadow: '0 1px 3px rgba(0,0,0,.08)', marginBottom: 22,
        display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 15,
          }}>🔍</span>
          <input value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo mã hoặc mô tả..."
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10,
              border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[['', 'Tất cả'], ['1', '✅ Kích hoạt'], ['0', '🚫 Đã tắt']].map(([v, l]) => (
            <button key={v} onClick={() => setActiveFilter(v)} style={filterBtn(activeFilter === v)}>
              {l}
            </button>
          ))}
        </div>

        <button onClick={() => { setSearchInput(''); setSearch(''); setActiveFilter('') }} style={{
          padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer',
        }}>🔄 Đặt lại</button>
      </div>

      {/* ── Bảng dữ liệu ── */}
      <div style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,.08)', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 80, textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40, margin: '0 auto',
              border: '4px solid #e5e7eb', borderTopColor: '#2563eb',
              borderRadius: '50%', animation: 'spin .8s linear infinite',
            }} />
            <p style={{ color: '#9ca3af', marginTop: 16, fontSize: 14 }}>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['STT', 'Mã coupon', 'Loại giảm', 'Đơn tối thiểu', 'Lượt dùng', 'Hiệu lực', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: 12, fontWeight: 700, color: '#6b7280',
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                      borderBottom: '2px solid #f3f4f6',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 15 }}>
                      📭 Không tìm thấy mã giảm giá nào
                    </td>
                  </tr>
                ) : coupons.map((c, i) => (
                  <tr key={c.id}
                    style={{
                      borderTop: '1px solid #f3f4f6',
                      background: i % 2 === 0 ? '#fff' : '#fafafa',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                  >
                    {/* STT */}
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#9ca3af' }}>
                      {((pagination?.page ?? 1) - 1) * (pagination?.per_page ?? 10) + i + 1}
                    </td>

                    {/* Mã & mô tả */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px',
                        background: '#1e293b', color: '#f8fafc',
                        borderRadius: 6, fontFamily: 'monospace',
                        fontSize: 13, fontWeight: 700, letterSpacing: 1,
                        marginBottom: 4,
                      }}>{c.code}</span>
                      {c.description && (
                        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{c.description}</p>
                      )}
                    </td>

                    {/* Loại giảm */}
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#059669' }}>
                      {fmtDiscount(c.discount_type, c.discount_value, c.max_discount)}
                    </td>

                    {/* Đơn tối thiểu */}
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151' }}>
                      {c.min_order > 0 ? fmtMoney(c.min_order) : <em style={{ color: '#d1d5db' }}>Không giới hạn</em>}
                    </td>

                    {/* Lượt dùng */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                        {c.used_count}
                        {c.max_uses > 0 && (
                          <span style={{ color: '#9ca3af', fontWeight: 400 }}>/{c.max_uses}</span>
                        )}
                      </span>
                      {/* Progress bar */}
                      {c.max_uses > 0 && (
                        <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2, marginTop: 4, width: 60 }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            width: `${Math.min(100, (c.used_count / c.max_uses) * 100)}%`,
                            background: c.used_count >= c.max_uses ? '#ef4444' : '#2563eb',
                          }} />
                        </div>
                      )}
                    </td>

                    {/* Hiệu lực */}
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {c.starts_at  && <div>Từ: {new Date(c.starts_at).toLocaleDateString('vi-VN')}</div>}
                      {c.expires_at && <div style={{ color: c.status === 'expired' ? '#ef4444' : '#6b7280' }}>
                        Đến: {new Date(c.expires_at).toLocaleDateString('vi-VN')}
                      </div>}
                      {!c.starts_at && !c.expires_at && <em style={{ color: '#d1d5db' }}>Không giới hạn</em>}
                    </td>

                    {/* Trạng thái */}
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Thao tác */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Sửa */}
                        <button onClick={() => handleOpenEdit(c)} title="Chỉnh sửa" style={{
                          width: 34, height: 34, borderRadius: 8, border: 'none',
                          background: '#fef3c7', color: '#d97706', cursor: 'pointer', fontSize: 15,
                        }}>✏️</button>

                        {/* Bật/Tắt */}
                        <button
                          onClick={() => handleToggle(c)}
                          disabled={actionLoading[c.id] === 'status'}
                          title={Number(c.is_active) === 1 ? 'Tắt mã' : 'Kích hoạt'}
                          style={{
                            width: 34, height: 34, borderRadius: 8, border: 'none',
                            background: Number(c.is_active) === 1 ? '#fee2e2' : '#dcfce7',
                            color:      Number(c.is_active) === 1 ? '#dc2626' : '#16a34a',
                            cursor: actionLoading[c.id] === 'status' ? 'not-allowed' : 'pointer',
                            fontSize: 15,
                          }}>
                          {actionLoading[c.id] === 'status' ? '⏳' : Number(c.is_active) === 1 ? '🚫' : '✅'}
                        </button>

                        {/* Xoá */}
                        <button onClick={() => setDeleteModal(c)} title="Xoá" style={{
                          width: 34, height: 34, borderRadius: 8, border: 'none',
                          background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: 15,
                        }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && (pagination?.pages ?? 1) > 1 && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              Hiển thị {Math.min(((pagination?.page ?? 1) - 1) * (pagination?.per_page ?? 10) + 1, pagination?.total ?? 0)}–
              {Math.min((pagination?.page ?? 1) * (pagination?.per_page ?? 10), pagination?.total ?? 0)}
              &nbsp;/&nbsp;{pagination?.total ?? 0} mã
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => fetchCoupons((pagination?.page ?? 1) - 1)}
                disabled={(pagination?.page ?? 1) === 1}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                  background: '#fff', cursor: (pagination?.page ?? 1) === 1 ? 'not-allowed' : 'pointer',
                  color: (pagination?.page ?? 1) === 1 ? '#d1d5db' : '#374151', fontWeight: 600, fontSize: 13,
                }}>← Trước</button>

              {Array.from({ length: Math.min(5, pagination?.pages ?? 1) }, (_, i) => {
                let p = i + 1
                if ((pagination?.pages ?? 1) > 5 && (pagination?.page ?? 1) > 3)
                  p = (pagination?.page ?? 1) - 2 + i
                if (p > (pagination?.pages ?? 1)) return null
                return (
                  <button key={p} onClick={() => fetchCoupons(p)} style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    fontWeight: 700, cursor: 'pointer', fontSize: 13,
                    background: p === (pagination?.page ?? 1) ? '#2563eb' : '#f3f4f6',
                    color:      p === (pagination?.page ?? 1) ? '#fff'    : '#374151',
                  }}>{p}</button>
                )
              })}

              <button onClick={() => fetchCoupons((pagination?.page ?? 1) + 1)}
                disabled={(pagination?.page ?? 1) === (pagination?.pages ?? 1)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                  background: '#fff',
                  cursor: (pagination?.page ?? 1) === (pagination?.pages ?? 1) ? 'not-allowed' : 'pointer',
                  color:  (pagination?.page ?? 1) === (pagination?.pages ?? 1) ? '#d1d5db' : '#374151',
                  fontWeight: 600, fontSize: 13,
                }}>Sau →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}