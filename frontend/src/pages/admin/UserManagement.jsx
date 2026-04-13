import { useState, useEffect, useCallback } from 'react';
import { adminUserAPI } from '../../services/api';

// ─── Helpers ─────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// ─── Toast Component ──────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b' };
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: '#fff', borderRadius: 12, padding: '14px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,.15)',
      borderLeft: `4px solid ${colors[type] || '#2563eb'}`,
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slideIn .3s ease',
      maxWidth: 360,
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <span style={{ fontSize: 18 }}>
        {type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}
      </span>
      <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, marginLeft: 'auto' }}>×</button>
    </div>
  );
}

// ─── Modal Chi tiết User ──────────────────────────────
function UserDetailModal({ userId, onClose }) {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminUserAPI.getById(userId)
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const STATUS_ORDER = {
    pending: { label: 'Chờ', color: '#f59e0b' },
    processing: { label: 'Xử lý', color: '#3b82f6' },
    shipping: { label: 'Giao', color: '#8b5cf6' },
    delivered: { label: 'Xong', color: '#10b981' },
    cancelled: { label: 'Huỷ', color: '#ef4444' },
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px',
        width: '90%', maxWidth: 640, maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
      }} onClick={e => e.stopPropagation()}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 36, height: 36, border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : !data ? (
          <p style={{ textAlign: 'center', color: '#ef4444' }}>Không tải được dữ liệu</p>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: '#2563eb', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800,
                }}>
                  {data.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>{data.name}</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{data.email}</p>
                  <span style={{
                    display: 'inline-block', marginTop: 4,
                    padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: data.role === 'admin' ? '#dbeafe' : '#d1fae5',
                    color: data.role === 'admin' ? '#2563eb' : '#059669',
                  }}>{data.role === 'admin' ? '🔑 Admin' : '👤 Khách hàng'}</span>
                </div>
              </div>
              <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                ['📞 Điện thoại', data.phone || '—'],
                ['📅 Ngày đăng ký', data.created_at],
                ['🏠 Địa chỉ', data.address || '—'],
                ['🔒 Trạng thái', data.status ? '✅ Hoạt động' : '🔴 Bị khoá'],
              ].map(([label, val]) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{label}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#374151', fontWeight: 500 }}>{val}</p>
                </div>
              ))}
            </div>

            {/* Orders */}
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#374151' }}>
              📦 Lịch sử đơn hàng ({data.orders.length})
            </h3>
            {data.orders.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Chưa có đơn hàng nào</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.orders.map(o => {
                  const sc = STATUS_ORDER[o.status] || { label: o.status, color: '#6b7280' };
                  return (
                    <div key={o.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10, background: '#f8fafc',
                      border: '1px solid #f3f4f6',
                    }}>
                      <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 13 }}>{o.order_code}</span>
                      <span style={{ fontSize: 13, color: '#374151' }}>{fmt(o.final_price)}</span>
                      <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: sc.color + '20', color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{o.created_at.slice(0, 10)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Modal Chỉnh sửa User ─────────────────────────────
function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user.name, phone: user.phone || '', address: user.address || '', role: user.role,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Họ tên không được để trống';
    if (form.phone && !/^[0-9]{9,11}$/.test(form.phone)) e.phone = 'Số điện thoại không hợp lệ';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await adminUserAPI.update(user.id, form);
      onSaved();
    } catch {
      setErrors({ general: 'Cập nhật thất bại. Thử lại.' });
    } finally { setSaving(false); }
  };

  const Field = ({ label, name, type = 'text', as }) => (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
      {as === 'select' ? (
        <select value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} style={{
          width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 14,
          border: errors[name] ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb',
          outline: 'none', boxSizing: 'border-box',
        }}>
          <option value="customer">👤 Khách hàng</option>
          <option value="admin">🔑 Admin</option>
        </select>
      ) : as === 'textarea' ? (
        <textarea value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} rows={2} style={{
          width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 14,
          border: errors[name] ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb',
          resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        }} />
      ) : (
        <input type={type} value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} style={{
          width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 14,
          border: errors[name] ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb',
          outline: 'none', boxSizing: 'border-box',
        }} />
      )}
      {errors[name] && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{errors[name]}</p>}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '90%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>✏️ Chỉnh sửa người dùng</h2>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        {errors.general && (
          <div style={{ background: '#fee2e2', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#ef4444' }}>{errors.general}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Họ và tên *" name="name" />
          <Field label="Điện thoại" name="phone" />
          <Field label="Địa chỉ" name="address" as="textarea" />
          <Field label="Vai trò" name="role" as="select" />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px 0', borderRadius: 10,
            border: '1.5px solid #e5e7eb', background: '#fff',
            color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 14,
          }}>Huỷ</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '11px 0', borderRadius: 10,
            border: 'none', background: saving ? '#93c5fd' : '#2563eb',
            color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14,
          }}>{saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────
export default function UserManagement() {
  const [users,      setUsers]      = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, per_page: 10 });
  const [loading,    setLoading]    = useState(true);
  const [filters,    setFilters]    = useState({ search: '', role: '', status: '' });
  const [searchInput,setSearchInput]= useState('');
  const [toast,      setToast]      = useState(null);
  const [detailId,   setDetailId]   = useState(null);
  const [editUser,   setEditUser]   = useState(null);
  const [confirmId,  setConfirmId]  = useState(null); // for delete confirm
  const [actionLoading, setActionLoading] = useState({});

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminUserAPI.getAll({ page, per_page: 10, ...filters });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      showToast('Không thể tải danh sách người dùng', 'error');
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setFilters(p => ({ ...p, search: searchInput })), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleToggleStatus = async (user) => {
    setActionLoading(p => ({ ...p, [user.id]: 'status' }));
    try {
      const res = await adminUserAPI.toggleStatus(user.id);
      showToast(res.data.message);
      fetchUsers(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác thất bại', 'error');
    } finally { setActionLoading(p => ({ ...p, [user.id]: null })); }
  };

  const handleDelete = async (userId) => {
    setActionLoading(p => ({ ...p, [userId]: 'delete' }));
    try {
      await adminUserAPI.delete(userId);
      showToast('Đã xoá người dùng thành công');
      setConfirmId(null);
      fetchUsers(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể xoá người dùng', 'error');
      setConfirmId(null);
    } finally { setActionLoading(p => ({ ...p, [userId]: null })); }
  };

  const handleExport = async () => {
    try {
      const res = await adminUserAPI.export();
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `users_${new Date().toISOString().slice(0,10)}.json`;
      a.click(); URL.revokeObjectURL(url);
      showToast('Xuất dữ liệu thành công');
    } catch { showToast('Xuất dữ liệu thất bại', 'error'); }
  };

  const btnStyle = (active, color = '#2563eb') => ({
    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
    fontWeight: 600, background: active ? color : '#f3f4f6',
    color: active ? '#fff' : '#6b7280', transition: 'all .15s',
  });

  return (
    <div style={{ padding: '28px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {detailId && <UserDetailModal userId={detailId} onClose={() => setDetailId(null)} />}
      {editUser  && (
        <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => {
          setEditUser(null);
          showToast('Cập nhật người dùng thành công');
          fetchUsers(pagination.page);
        }} />
      )}

      {/* Confirm Delete */}
      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>🗑️</p>
            <h3 style={{ margin: '0 0 8px', color: '#111827' }}>Xác nhận xoá?</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Hành động này không thể hoàn tác.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmId(null)} style={{ flex: 1, padding: 10, border: '1.5px solid #e5e7eb', borderRadius: 10, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Huỷ</button>
              <button onClick={() => handleDelete(confirmId)} disabled={actionLoading[confirmId] === 'delete'} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 10, background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                {actionLoading[confirmId] === 'delete' ? 'Đang xoá...' : 'Xoá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827' }}>👥 Quản lý người dùng</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            Tổng cộng <strong style={{ color: '#2563eb' }}>{pagination.total}</strong> tài khoản
          </p>
        </div>
        <button onClick={handleExport} style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: '#10b981', color: '#fff', fontWeight: 700,
          cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
        }}>📤 Xuất dữ liệu</button>
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,.08)', marginBottom: 24,
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>🔍</span>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại..."
            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Role Filter */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Vai trò:</span>
          {[['', 'Tất cả'], ['customer', '👤 KH'], ['admin', '🔑 Admin']].map(([val, label]) => (
            <button key={val} onClick={() => setFilters(p => ({ ...p, role: val }))} style={btnStyle(filters.role === val)}>{label}</button>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Trạng thái:</span>
          {[['', 'Tất cả'], ['1', '✅ Hoạt động'], ['0', '🔴 Bị khoá']].map(([val, label]) => (
            <button key={val} onClick={() => setFilters(p => ({ ...p, status: val }))}
              style={btnStyle(filters.status === val, val === '0' ? '#ef4444' : '#2563eb')}>{label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Người dùng', 'Liên hệ', 'Vai trò', 'Đơn hàng', 'Chi tiêu', 'Ngày đăng ký', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Không tìm thấy người dùng nào</td></tr>
                ) : users.map((user, i) => (
                  <tr key={user.id} style={{
                    borderTop: '1px solid #f3f4f6',
                    background: i % 2 === 0 ? '#fff' : '#fafafa',
                    transition: 'background .15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                  >
                    {/* ID */}
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af' }}>#{user.id}</td>

                    {/* Avatar + Name */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                          background: user.status ? '#2563eb' : '#9ca3af',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 800,
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{user.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{user.phone || '—'}</td>

                    {/* Role */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                        color: user.role === 'admin' ? '#2563eb' : '#6b7280',
                      }}>
                        {user.role === 'admin' ? '🔑 Admin' : '👤 KH'}
                      </span>
                    </td>

                    {/* Orders */}
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#374151', textAlign: 'center' }}>
                      {user.order_count}
                    </td>

                    {/* Spent */}
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#059669' }}>
                      {user.total_spent > 0 ? fmt(user.total_spent) : '—'}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af' }}>
                      {user.created_at.slice(0, 10)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => handleToggleStatus(user)}
                        disabled={actionLoading[user.id] === 'status'}
                        style={{
                          padding: '4px 12px', borderRadius: 20, border: 'none',
                          cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: user.status ? '#d1fae5' : '#fee2e2',
                          color: user.status ? '#059669' : '#ef4444',
                        }}>
                        {actionLoading[user.id] === 'status' ? '...' : user.status ? '✅ Hoạt động' : '🔴 Bị khoá'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setDetailId(user.id)} title="Chi tiết" style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none',
                          background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: 14,
                        }}>👁</button>
                        <button onClick={() => setEditUser(user)} title="Sửa" style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none',
                          background: '#fef3c7', color: '#d97706', cursor: 'pointer', fontSize: 14,
                        }}>✏️</button>
                        <button onClick={() => setConfirmId(user.id)} title="Xoá"
                          disabled={actionLoading[user.id] === 'delete'}
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: 'none',
                            background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: 14,
                          }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              Hiển thị {Math.min((pagination.page - 1) * pagination.per_page + 1, pagination.total)}–{Math.min(pagination.page * pagination.per_page, pagination.total)} / {pagination.total}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page === 1} style={{
                padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                background: '#fff', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                color: pagination.page === 1 ? '#d1d5db' : '#374151', fontWeight: 600, fontSize: 13,
              }}>← Trước</button>

              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let p = i + 1;
                if (pagination.pages > 5 && pagination.page > 3) p = pagination.page - 2 + i;
                if (p > pagination.pages) return null;
                return (
                  <button key={p} onClick={() => fetchUsers(p)} style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: p === pagination.page ? '#2563eb' : '#f3f4f6',
                    color: p === pagination.page ? '#fff' : '#374151',
                    fontWeight: 700, cursor: 'pointer', fontSize: 13,
                  }}>{p}</button>
                );
              })}

              <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page === pagination.pages} style={{
                padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                background: '#fff', cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer',
                color: pagination.page === pagination.pages ? '#d1d5db' : '#374151', fontWeight: 600, fontSize: 13,
              }}>Sau →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}