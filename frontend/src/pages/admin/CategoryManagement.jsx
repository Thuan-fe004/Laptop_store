// src/pages/admin/CategoryManagement.jsx
import { useState, useEffect, useCallback } from 'react'
import { adminCategoryAPI } from '../../services/api'

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
      display: 'flex', alignItems: 'center', gap: 12, maxWidth: 380,
      animation: 'slideIn .3s ease',
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <span style={{ fontSize: 20 }}>
        {type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}
      </span>
      <span style={{ fontSize: 14, color: '#374151', fontWeight: 500, flex: 1 }}>
        {message}
      </span>
      <button onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}>
        ×
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// MODAL THÊM / SỬA
// ═══════════════════════════════════════════════════════
function CategoryFormModal({ category, onClose, onSaved }) {
  const isEdit = !!category

  const [form, setForm]     = useState({
    name:        category?.name        ?? '',
    description: category?.description ?? '',
    status:      category?.status      ?? 1,
  })
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)

  const setF = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    if (errors[key]) setErrors(p => ({ ...p, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())           e.name = 'Tên danh mục không được để trống'
    else if (form.name.length > 100) e.name = 'Tối đa 100 ký tự'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (isEdit) {
        await adminCategoryAPI.update(category.id, form)
        onSaved('Cập nhật danh mục thành công')
      } else {
        await adminCategoryAPI.create(form)
        onSaved('Thêm danh mục thành công')
      }
    } catch (err) {
      setErrors({ api: err.response?.data?.message || 'Có lỗi xảy ra!' })
    } finally {
      setSaving(false)
    }
  }

  // Style input dùng chung
  const inp = (field) => ({
    width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 14,
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
    border: `1.5px solid ${errors[field] ? '#ef4444' : '#e5e7eb'}`,
    transition: 'border-color .2s',
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500,
          boxShadow: '0 24px 64px rgba(0,0,0,.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '22px 28px 16px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>
            {isEdit ? '✏️ Chỉnh sửa danh mục' : '➕ Thêm danh mục mới'}
          </h2>
          <button onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 8, border: 'none',
              background: '#f3f4f6', cursor: 'pointer', fontSize: 18, color: '#374151',
            }}>
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Lỗi API */}
          {errors.api && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626',
            }}>
              ❌ {errors.api}
            </div>
          )}

          {/* Tên danh mục */}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Tên danh mục <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              value={form.name}
              onChange={e => setF('name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="VD: Laptop Gaming"
              maxLength={100}
              autoFocus
              style={inp('name')}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {errors.name
                ? <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.name}</span>
                : <span />}
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{form.name.length}/100</span>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Mô tả
            </label>
            <textarea
              value={form.description}
              onChange={e => setF('description', e.target.value)}
              placeholder="Mô tả ngắn về danh mục này..."
              rows={3}
              style={{ ...inp('description'), resize: 'vertical' }}
            />
          </div>

          {/* Trạng thái */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Trạng thái
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { v: 1, emoji: '✅', label: 'Hiển thị', bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
                { v: 0, emoji: '🙈', label: 'Ẩn',      bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
              ].map(opt => (
                <label
                  key={opt.v}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                    justifyContent: 'center', padding: '10px 0', borderRadius: 10,
                    cursor: 'pointer', transition: 'all .15s',
                    background: Number(form.status) === opt.v ? opt.bg : '#f9fafb',
                    border: `1.5px solid ${Number(form.status) === opt.v ? opt.border : '#e5e7eb'}`,
                  }}
                >
                  <input
                    type="radio"
                    name="modal_status"
                    value={opt.v}
                    checked={Number(form.status) === opt.v}
                    onChange={() => setF('status', Number(opt.v))}
                    style={{ accentColor: opt.color }}
                  />
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: Number(form.status) === opt.v ? opt.color : '#6b7280',
                  }}>
                    {opt.emoji} {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button onClick={onClose}
            style={{
              padding: '10px 22px', borderRadius: 9, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151',
            }}>
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{
              padding: '10px 26px', borderRadius: 9, cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700, border: 'none',
              background: saving ? '#93c5fd' : '#2563eb', color: '#fff',
              transition: 'background .2s',
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
function ConfirmDeleteModal({ category, onClose, onConfirm, deleting }) {
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
          Danh mục: <strong style={{ color: '#111827' }}>{category?.name}</strong>
        </p>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#9ca3af' }}>
          Chỉ xoá được khi không có sản phẩm nào. Hành động không thể hoàn tác.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 10, cursor: 'pointer',
              border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 600, fontSize: 14,
            }}>
            Huỷ
          </button>
          <button onClick={onConfirm} disabled={deleting}
            style={{
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
export default function CategoryManagement() {
  // ── State ──────────────────────────────────────────────
  const [categories,    setCategories]    = useState([])
  const [pagination,    setPagination]    = useState({ page: 1, pages: 1, total: 0, per_page: 10 })
  const [loading,       setLoading]       = useState(true)
  const [toast,         setToast]         = useState(null)

  // filters (giữ đúng pattern của ProductManagement)
  const [search,        setSearch]        = useState('')
  const [searchInput,   setSearchInput]   = useState('')
  const [statusFilter,  setStatusFilter]  = useState('')

  // modals
  const [formModal,     setFormModal]     = useState(null)   // null | 'add' | {category object}
  const [deleteModal,   setDeleteModal]   = useState(null)   // null | {category object}
  const [actionLoading, setActionLoading] = useState({})

  const showToast = (message, type = 'success') => setToast({ message, type })

  // ── Debounce search 400ms (giống ProductManagement) ───
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── fetchCategories (giống fetchProducts) ─────────────
  const fetchCategories = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, per_page: 10 }
      if (search)       params.search = search
      if (statusFilter) params.status = statusFilter   // '' | '0' | '1'

      const res = await adminCategoryAPI.getAll(params)
      // DEBUG: xem backend trả gì
      console.log('📦 categories API response:', res.data)

      setCategories(Array.isArray(res.data.data) ? res.data.data : [])
      // ✅ safe: luôn set đủ 4 field, không bao giờ undefined
      const pg = res.data.pagination || {}
      setPagination({
        page:     pg.page     ?? 1,
        pages:    pg.pages    ?? 1,
        total:    pg.total    ?? 0,
        per_page: pg.per_page ?? 10,
      })
    } catch (err) {
      console.error('fetchCategories error:', err)
      showToast('Không thể tải danh sách danh mục!', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  // chạy lại khi filter đổi (giống ProductManagement)
  useEffect(() => { fetchCategories(1) }, [fetchCategories])

  // ── Toggle ẩn/hiện (Number() đảm bảo so sánh đúng dù backend trả string hay int) ────────────────────────────────────
  const handleToggleStatus = async (cat) => {
    setActionLoading(p => ({ ...p, [cat.id]: 'status' }))
    try {
      const res = await adminCategoryAPI.toggleStatus(cat.id)
      showToast(res.data.message)
      fetchCategories(pagination?.page ?? 1)
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác thất bại', 'error')
    } finally {
      setActionLoading(p => ({ ...p, [cat.id]: null }))
    }
  }

  // ── Xoá ───────────────────────────────────────────────
  const handleDelete = async () => {
    const id = deleteModal.id
    setActionLoading(p => ({ ...p, [id]: 'delete' }))
    try {
      const res = await adminCategoryAPI.delete(id)
      showToast(res.data.message)
      setDeleteModal(null)
      fetchCategories(pagination?.page ?? 1)
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể xoá!', 'error')
      setDeleteModal(null)
    } finally {
      setActionLoading(p => ({ ...p, [id]: null }))
    }
  }

  // ── Mở sửa (load lại từ server) ───────────────────────
  const handleOpenEdit = async (cat) => {
    try {
      const res = await adminCategoryAPI.getById(cat.id)
      setFormModal(res.data.data)
    } catch {
      showToast('Không thể tải thông tin danh mục', 'error')
    }
  }

  // ── Style nút filter ───────────────────────────────────
  const filterBtn = (active) => ({
    padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, transition: 'all .15s',
    background: active ? '#2563eb' : '#f3f4f6',
    color:      active ? '#fff'    : '#6b7280',
  })

  // ══════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════
  return (
    <div style={{
      padding: '28px 32px', background: '#f8fafc',
      minHeight: '100vh', fontFamily: "'Be Vietnam Pro', sans-serif",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Toast */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Modal Thêm / Sửa */}
      {formModal !== null && (
        <CategoryFormModal
          category={formModal === 'add' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={(msg) => {
            setFormModal(null)
            showToast(msg)
            fetchCategories(pagination?.page ?? 1)
          }}
        />
      )}

      {/* Modal Xoá */}
      {deleteModal && (
        <ConfirmDeleteModal
          category={deleteModal}
          deleting={actionLoading[deleteModal.id] === 'delete'}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 24,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827' }}>
            📂 Quản lý danh mục
          </h1>
        </div>
        <button
          onClick={() => setFormModal('add')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 10, border: 'none',
            background: '#2563eb', color: '#fff', fontWeight: 700,
            cursor: 'pointer', fontSize: 14,
          }}>
          ➕ Thêm danh mục
        </button>
      </div>

      {/* ── Stats Cards ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Tổng danh mục',
            value: pagination?.total ?? 0,
            icon: '📂', bg: '#eff6ff', clr: '#2563eb',
          },
          {
            label: 'Đang hiển thị',
            value: loading ? '...' : categories.filter(c => Number(c.status) === 1).length,
            icon: '✅', bg: '#f0fdf4', clr: '#16a34a',
          },
          {
            label: 'Đang ẩn',
            value: loading ? '...' : categories.filter(c => Number(c.status) === 0).length,
            icon: '🙈', bg: '#fef2f2', clr: '#dc2626',
          },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 14, padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: 16,
            border: '1px solid rgba(0,0,0,.05)',
          }}>
            <span style={{ fontSize: 30 }}>{s.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: s.clr, lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ─────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '16px 22px',
        boxShadow: '0 1px 3px rgba(0,0,0,.08)', marginBottom: 22,
        display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Ô tìm kiếm */}
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 15,
          }}>🔍</span>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên danh mục..."
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10,
              border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter status */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['', 'Tất cả'], ['1', '✅ Hiện'], ['0', '🙈 Ẩn']].map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)} style={filterBtn(statusFilter === v)}>
              {l}
            </button>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={() => { setSearchInput(''); setSearch(''); setStatusFilter('') }}
          style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer',
          }}>
          🔄 Đặt lại
        </button>
      </div>

      {/* ── Bảng dữ liệu ───────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,.08)', overflow: 'hidden',
      }}>

        {loading ? (
          /* Loading spinner */
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
                  {['STT', 'Tên danh mục', 'Mô tả', 'Số SP', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: 12, fontWeight: 700, color: '#6b7280',
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                      borderBottom: '2px solid #f3f4f6',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 15 }}>
                      📭 Không tìm thấy danh mục nào
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, i) => (
                    <tr
                      key={cat.id}
                      style={{
                        borderTop: '1px solid #f3f4f6',
                        background: i % 2 === 0 ? '#fff' : '#fafafa',
                        transition: 'background .15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                    >
                      {/* STT */}
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
                        {((pagination?.page ?? 1) - 1) * (pagination?.per_page ?? 10) + i + 1}
                      </td>

                      {/* Tên */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                          {cat.name}
                        </span>
                      </td>

                      {/* Mô tả */}
                      <td style={{ padding: '14px 16px', maxWidth: 300 }}>
                        {cat.description ? (
                          <span style={{
                            fontSize: 13, color: '#6b7280',
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {cat.description}
                          </span>
                        ) : (
                          <em style={{ fontSize: 13, color: '#d1d5db' }}>Chưa có mô tả</em>
                        )}
                      </td>

                      {/* Số sản phẩm */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 12px', borderRadius: 20,
                          background: '#eff6ff', color: '#2563eb', fontSize: 13, fontWeight: 700,
                        }}>
                          {cat.product_count ?? 0}
                        </span>
                      </td>

                      {/* Trạng thái — click để toggle */}
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          disabled={actionLoading[cat.id] === 'status'}
                          style={{
                            padding: '5px 14px', borderRadius: 20, border: 'none',
                            cursor: actionLoading[cat.id] === 'status' ? 'not-allowed' : 'pointer',
                            fontSize: 12, fontWeight: 700, transition: 'all .2s',
                            background: Number(cat.status) === 1 ? '#dcfce7' : '#fee2e2',
                            color:      Number(cat.status) === 1 ? '#16a34a' : '#dc2626',
                          }}>
                          {actionLoading[cat.id] === 'status'
                            ? '...'
                            : Number(cat.status) === 1 ? '✅ Hiển thị' : '🙈 Đang ẩn'}
                        </button>
                      </td>

                      {/* Ngày tạo */}
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {cat.created_at
                          ? new Date(cat.created_at).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>

                      {/* Thao tác */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            title="Chỉnh sửa"
                            style={{
                              width: 34, height: 34, borderRadius: 8, border: 'none',
                              background: '#fef3c7', color: '#d97706',
                              cursor: 'pointer', fontSize: 15,
                            }}>
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteModal(cat)}
                            title="Xoá"
                            style={{
                              width: 34, height: 34, borderRadius: 8, border: 'none',
                              background: '#fee2e2', color: '#ef4444',
                              cursor: 'pointer', fontSize: 15,
                            }}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────── */}
        {!loading && (pagination?.pages ?? 1) > 1 && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              Hiển thị&nbsp;
              {Math.min(((pagination?.page ?? 1) - 1) * (pagination?.per_page ?? 10) + 1, pagination?.total ?? 0)}–
              {Math.min((pagination?.page ?? 1) * (pagination?.per_page ?? 10), pagination?.total ?? 0)}
              &nbsp;/&nbsp;{pagination?.total ?? 0} danh mục
            </p>

            <div style={{ display: 'flex', gap: 6 }}>
              {/* Nút Trước */}
              <button
                onClick={() => fetchCategories((pagination?.page ?? 1) - 1)}
                disabled={(pagination?.page ?? 1) === 1}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13,
                  border: '1.5px solid #e5e7eb', background: '#fff',
                  cursor:  (pagination?.page ?? 1) === 1 ? 'not-allowed' : 'pointer',
                  color:   (pagination?.page ?? 1) === 1 ? '#d1d5db' : '#374151',
                }}>
                ← Trước
              </button>

              {/* Số trang */}
              {Array.from({ length: Math.min(5, pagination?.pages ?? 1) }, (_, i) => {
                let p = i + 1
                if ((pagination?.pages ?? 1) > 5 && (pagination?.page ?? 1) > 3) p = (pagination?.page ?? 1) - 2 + i
                if (p > (pagination?.pages ?? 1)) return null
                return (
                  <button key={p} onClick={() => fetchCategories(p)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: 'none',
                      fontWeight: 700, cursor: 'pointer', fontSize: 13,
                      background: p === (pagination?.page ?? 1) ? '#2563eb' : '#f3f4f6',
                      color:      p === (pagination?.page ?? 1) ? '#fff'    : '#374151',
                    }}>
                    {p}
                  </button>
                )
              })}

              {/* Nút Sau */}
              <button
                onClick={() => fetchCategories((pagination?.page ?? 1) + 1)}
                disabled={(pagination?.page ?? 1) === (pagination?.pages ?? 1)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13,
                  border: '1.5px solid #e5e7eb', background: '#fff',
                  cursor:  (pagination?.page ?? 1) === (pagination?.pages ?? 1) ? 'not-allowed' : 'pointer',
                  color:   (pagination?.page ?? 1) === (pagination?.pages ?? 1) ? '#d1d5db' : '#374151',
                }}>
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}