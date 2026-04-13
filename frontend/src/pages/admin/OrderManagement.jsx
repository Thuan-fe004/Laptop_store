// src/pages/admin/OrderManagement.jsx
import { useState, useEffect, useCallback } from 'react'
import { adminOrderAPI } from '../../services/api'

const fmt     = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('vi-VN', {
  day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'
}) : '—'

const STATUS_CFG = {
  pending:    { label:'Chờ xác nhận', bg:'#fef3c7', color:'#d97706', dot:'#f59e0b' },
  processing: { label:'Đang xử lý',   bg:'#dbeafe', color:'#2563eb', dot:'#3b82f6' },
  shipping:   { label:'Đang giao',    bg:'#ede9fe', color:'#7c3aed', dot:'#8b5cf6' },
  delivered:  { label:'Đã giao',      bg:'#dcfce7', color:'#16a34a', dot:'#22c55e' },
  cancelled:  { label:'Đã huỷ',       bg:'#fee2e2', color:'#dc2626', dot:'#ef4444' },
}
const PAY_CFG = {
  unpaid:   { label:'Chưa thanh toán', bg:'#fef9c3', color:'#ca8a04' },
  paid:     { label:'Đã thanh toán',   bg:'#dcfce7', color:'#16a34a' },
  refunded: { label:'Đã hoàn tiền',    bg:'#f3e8ff', color:'#9333ea' },
}
const VALID_NEXT = {
  pending:    ['processing','cancelled'],
  processing: ['shipping',  'cancelled'],
  shipping:   ['delivered', 'cancelled'],
  delivered:  [], cancelled: [],
}

// ── Toast ──────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  const clr = { success:'#10b981', error:'#ef4444', warning:'#f59e0b' }[type] || '#2563eb'
  return (
    <div style={{ position:'fixed', top:24, right:24, zIndex:9999, background:'#fff',
      borderRadius:12, padding:'14px 20px', boxShadow:'0 8px 32px rgba(0,0,0,.15)',
      borderLeft:`4px solid ${clr}`, display:'flex', alignItems:'center', gap:12,
      maxWidth:400, animation:'slideIn .3s ease' }}>
      <style>{`@keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <span style={{fontSize:20}}>{type==='success'?'✅':type==='error'?'❌':'⚠️'}</span>
      <span style={{fontSize:14,color:'#374151',fontWeight:500,flex:1}}>{message}</span>
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:20}}>×</button>
    </div>
  )
}

// ── Badges ────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || {}
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px',
      borderRadius:20, fontSize:12, fontWeight:700, background:c.bg, color:c.color }}>
      <span style={{width:6,height:6,borderRadius:'50%',background:c.dot,display:'inline-block'}}/>
      {c.label}
    </span>
  )
}
function PayBadge({ status }) {
  const c = PAY_CFG[status] || {}
  return (
    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20,
      fontSize:12, fontWeight:700, background:c.bg, color:c.color }}>
      {c.label}
    </span>
  )
}

// ════════════════════════════════════════════════════════
// MODAL CHI TIẾT ĐƠN HÀNG
// ════════════════════════════════════════════════════════
function OrderDetailModal({ order, onClose, onUpdated }) {
  const [detail,     setDetail]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [newStatus,  setNewStatus]  = useState(order.status)
  const [newPay,     setNewPay]     = useState(order.payment_status)
  const [reason,     setReason]     = useState('')
  const [savingSt,   setSavingSt]   = useState(false)
  const [savingPay,  setSavingPay]  = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    adminOrderAPI.getById(order.id)
      .then(r => { setDetail(r.data.data); setNewPay(r.data.data.payment_status) })
      .catch(() => setError('Không thể tải chi tiết'))
      .finally(() => setLoading(false))
  }, [order.id])

  const d = detail || order
  const nextAllowed  = VALID_NEXT[order.status] || []
  const canStatus    = nextAllowed.length > 0
  const canPay       = order.status !== 'cancelled'

  // Preview: tính trước payment sẽ thay đổi gì khi đổi status
  const previewPay = (s) => {
    const m = d.payment_method, p = d.payment_status
    if (s === 'delivered' && m === 'cod') return 'paid'
    if (s === 'cancelled' && p === 'paid') return 'refunded'
    if (s === 'cancelled') return 'unpaid'
    return p
  }
  const autoPayPreview  = previewPay(newStatus)
  const willPayChange   = autoPayPreview !== d.payment_status

  // ── Cập nhật trạng thái ──────────────────────────────
  const handleUpdateStatus = async () => {
    if (newStatus === order.status) { onClose(); return }
    if (newStatus === 'cancelled' && !reason.trim()) {
      setError('Vui lòng nhập lý do huỷ'); return
    }
    setSavingSt(true); setError('')
    try {
      const res = await adminOrderAPI.updateStatus(order.id, { status: newStatus, cancelled_reason: reason })
      onUpdated(res.data.message, res.data.payment_changed ? 'warning' : 'success')
    } catch(e) {
      setError(e.response?.data?.message || 'Cập nhật thất bại')
    } finally { setSavingSt(false) }
  }

  // ── Xác nhận thanh toán thủ công ─────────────────────
  const handleUpdatePay = async () => {
    if (newPay === d.payment_status) return
    setSavingPay(true); setError('')
    try {
      const res = await adminOrderAPI.updatePayment(order.id, { payment_status: newPay })
      onUpdated(res.data.message)
    } catch(e) {
      setError(e.response?.data?.message || 'Cập nhật thất bại')
    } finally { setSavingPay(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:720,
        maxHeight:'93vh', display:'flex', flexDirection:'column',
        boxShadow:'0 24px 64px rgba(0,0,0,.25)' }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'20px 28px', borderBottom:'1px solid #f3f4f6',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#111827' }}>
              📦 {d.order_code}
            </h2>
            <div style={{ display:'flex', gap:8, marginTop:6 }}>
              <StatusBadge status={d.status} />
              <PayBadge status={d.payment_status} />
              <span style={{ fontSize:12, color:'#9ca3af' }}>{fmtDate(d.created_at)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:8, border:'none',
            background:'#f3f4f6', cursor:'pointer', fontSize:18 }}>×</button>
        </div>

        {/* Body scroll */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 28px', display:'flex', flexDirection:'column', gap:18 }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:60, color:'#9ca3af' }}>
              <div style={{ width:36, height:36, margin:'0 auto 12px', border:'4px solid #e5e7eb',
                borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
              Đang tải...
            </div>
          ) : (<>

            {/* Khách hàng + địa chỉ */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px' }}>
                <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:700, color:'#374151' }}>👤 Khách hàng</p>
                <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:600 }}>{d.customer_name}</p>
                <p style={{ margin:'0 0 3px', fontSize:13, color:'#6b7280' }}>{d.customer_email}</p>
                <p style={{ margin:0, fontSize:13, color:'#6b7280' }}>{d.customer_phone}</p>
                {d.payment_method && (
                  <p style={{ margin:'8px 0 0', fontSize:12, color:'#9ca3af' }}>
                    💳 {d.payment_method === 'cod' ? 'COD – Thu tiền khi giao' : 'Thanh toán online'}
                  </p>
                )}
              </div>
              <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px' }}>
                <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:700, color:'#374151' }}>📍 Giao hàng</p>
                {d.shipping_info ? (<>
                  <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:600 }}>
                    {d.shipping_info.receiver_name} · {d.shipping_info.receiver_phone}
                  </p>
                  <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.6 }}>
                    {d.shipping_info.address}{d.shipping_info.ward ? ', '+d.shipping_info.ward : ''}, {d.shipping_info.district}, {d.shipping_info.province}
                  </p>
                </>) : <p style={{ margin:0, fontSize:13, color:'#9ca3af' }}>Không có thông tin</p>}
              </div>
            </div>

            {/* Sản phẩm */}
            <div>
              <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:'#374151' }}>🛒 Sản phẩm</p>
              <div style={{ border:'1px solid #f3f4f6', borderRadius:12, overflow:'hidden' }}>
                {(d.items||[]).map((item,i) => (
                  <div key={item.id} style={{ display:'flex', alignItems:'center', gap:14,
                    padding:'12px 16px', borderTop: i>0?'1px solid #f3f4f6':'none' }}>
                    <img src={item.product_image
                      ? `http://localhost:5000/static/uploads/${item.product_image}`
                      : 'https://placehold.co/48?text=?'}
                      alt={item.product_name}
                      style={{ width:48, height:48, borderRadius:8, objectFit:'cover', border:'1px solid #e5e7eb' }}
                      onError={e=>{e.target.src='https://placehold.co/48?text=?'}}/>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:600 }}>{item.product_name}</p>
                      <p style={{ margin:0, fontSize:12, color:'#9ca3af' }}>x{item.quantity} × {fmt(item.unit_price)}</p>
                    </div>
                    <p style={{ margin:0, fontSize:14, fontWeight:700 }}>{fmt(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng tiền */}
            <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 18px' }}>
              {[['Tạm tính', fmt(d.total_price)],
                ['Giảm giá', d.discount>0 ? `-${fmt(d.discount)}` : '0đ'],
                ['Phí ship',  fmt(d.shipping_fee)]].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14, color:'#6b7280' }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
              {d.coupon_code && (
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13, color:'#059669' }}>
                  <span>🏷️ Mã: {d.coupon_code}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8,
                borderTop:'1px solid #e5e7eb', fontSize:16, fontWeight:800 }}>
                <span>Tổng thanh toán</span>
                <span style={{ color:'#ef4444' }}>{fmt(d.final_price)}</span>
              </div>
            </div>

            {/* ══ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG ══ */}
            {canStatus ? (
              <div style={{ background:'#eff6ff', borderRadius:12, padding:'16px 18px', border:'1px solid #bfdbfe' }}>
                <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:700, color:'#1d4ed8' }}>
                  🔄 Cập nhật trạng thái đơn hàng
                </p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                  {nextAllowed.map(s => (
                    <button key={s} onClick={()=>{setNewStatus(s); setError('')}} style={{
                      padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer',
                      fontSize:13, fontWeight:600, transition:'all .15s',
                      background: newStatus===s ? STATUS_CFG[s].dot : '#e5e7eb',
                      color:      newStatus===s ? '#fff' : '#374151',
                    }}>{STATUS_CFG[s].label}</button>
                  ))}
                </div>

                {/* Preview tự động payment */}
                {willPayChange && newStatus !== order.status && (
                  <div style={{ background:'#fef3c7', borderRadius:8, padding:'8px 14px',
                    fontSize:13, color:'#92400e', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                    ⚡ Hệ thống sẽ tự động cập nhật thanh toán →&nbsp;
                    <strong>{PAY_CFG[autoPayPreview]?.label}</strong>
                    {d.payment_method === 'cod' && newStatus === 'delivered' && (
                      <span style={{ color:'#6b7280' }}> (COD: giao xong = thu tiền xong)</span>
                    )}
                    {newStatus === 'cancelled' && d.payment_status === 'paid' && (
                      <span style={{ color:'#6b7280' }}> (đã thu → cần hoàn tiền)</span>
                    )}
                  </div>
                )}

                {newStatus === 'cancelled' && (
                  <textarea value={reason} onChange={e=>setReason(e.target.value)}
                    placeholder="Nhập lý do huỷ đơn hàng... *"
                    rows={2} style={{ width:'100%', padding:'9px 12px', borderRadius:9,
                      border:`1.5px solid ${error&&!reason.trim()?'#ef4444':'#e5e7eb'}`,
                      fontSize:13, outline:'none', resize:'vertical',
                      boxSizing:'border-box', fontFamily:'inherit', marginBottom:4 }}/>
                )}

                {error && <p style={{ margin:'4px 0 8px', fontSize:12, color:'#ef4444' }}>⚠️ {error}</p>}

                <button onClick={handleUpdateStatus}
                  disabled={savingSt || newStatus===order.status} style={{
                  padding:'9px 24px', borderRadius:9, border:'none', fontSize:14, fontWeight:700,
                  cursor: (savingSt||newStatus===order.status) ? 'not-allowed' : 'pointer',
                  background: (savingSt||newStatus===order.status) ? '#93c5fd' : '#2563eb',
                  color:'#fff',
                }}>
                  {savingSt ? '⏳ Đang lưu...' : '💾 Xác nhận cập nhật'}
                </button>
              </div>
            ) : (
              <div style={{ background:'#f9fafb', borderRadius:12, padding:'14px 18px',
                fontSize:13, color:'#6b7280', textAlign:'center' }}>
                🔒 Đơn hàng đã <strong>{STATUS_CFG[order.status]?.label}</strong> — không thể thay đổi trạng thái
              </div>
            )}

            {/* ══ CẬP NHẬT THANH TOÁN THỦ CÔNG ══ */}
            {canPay && (
              <div style={{ background:'#f0fdf4', borderRadius:12, padding:'16px 18px', border:'1px solid #bbf7d0' }}>
                <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:700, color:'#15803d' }}>
                  💳 Xác nhận thanh toán thủ công
                </p>
                <p style={{ margin:'0 0 12px', fontSize:12, color:'#6b7280' }}>
                  {d.payment_method === 'cod'
                    ? '⚡ COD: tự động cập nhật khi đơn giao thành công. Dùng nút bên dưới nếu cần chỉnh sửa thủ công.'
                    : '📋 Online: admin kiểm tra sao kê ngân hàng / ví rồi xác nhận tại đây.'}
                </p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                  {Object.entries(PAY_CFG).map(([key, cfg]) => (
                    <button key={key} onClick={()=>setNewPay(key)} style={{
                      padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer',
                      fontSize:13, fontWeight:600, transition:'all .15s',
                      background: newPay===key ? cfg.color : '#e5e7eb',
                      color:      newPay===key ? '#fff'    : '#374151',
                    }}>{cfg.label}</button>
                  ))}
                </div>
                <button onClick={handleUpdatePay}
                  disabled={savingPay || newPay===d.payment_status} style={{
                  padding:'9px 24px', borderRadius:9, border:'none', fontSize:14, fontWeight:700,
                  cursor: (savingPay||newPay===d.payment_status) ? 'not-allowed' : 'pointer',
                  background: (savingPay||newPay===d.payment_status) ? '#86efac' : '#16a34a',
                  color:'#fff',
                }}>
                  {savingPay ? '⏳ Đang lưu...' : '💾 Xác nhận thanh toán'}
                </button>
              </div>
            )}

            {/* Ghi chú / lý do huỷ */}
            {(d.note || d.cancelled_reason) && (
              <div style={{ background:'#fef9c3', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#854d0e' }}>
                {d.note            && <p style={{margin:'0 0 4px'}}>📝 Ghi chú: {d.note}</p>}
                {d.cancelled_reason && <p style={{margin:0}}>❌ Lý do huỷ: {d.cancelled_reason}</p>}
              </div>
            )}
          </>)}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 28px', borderTop:'1px solid #f3f4f6', display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'10px 24px', borderRadius:9,
            border:'1.5px solid #e5e7eb', background:'#fff', fontWeight:600, cursor:'pointer', fontSize:14 }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function OrderManagement() {
  const [orders,      setOrders]      = useState([])
  const [pagination,  setPagination]  = useState({ page:1, pages:1, total:0, per_page:10 })
  const [stats,       setStats]       = useState({})
  const [loading,     setLoading]     = useState(true)
  const [toast,       setToast]       = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [search,      setSearch]      = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter,setStatusFilter]= useState('')
  const [payFilter,   setPayFilter]   = useState('')

  const showToast = (msg, type='success') => setToast({ message: msg, type })

  const loadStats = useCallback(() => {
    adminOrderAPI.getStats().then(r => setStats(r.data.data || {})).catch(()=>{})
  }, [])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchOrders = useCallback(async (page=1) => {
    setLoading(true)
    try {
      const params = { page, per_page: 10 }
      if (search)       params.search         = search
      if (statusFilter) params.status         = statusFilter
      if (payFilter)    params.payment_status = payFilter
      const res = await adminOrderAPI.getAll(params)
      setOrders(Array.isArray(res.data.data) ? res.data.data : [])
      const pg = res.data.pagination || {}
      setPagination({ page: pg.page??1, pages: pg.pages??1, total: pg.total??0, per_page: pg.per_page??10 })
    } catch { showToast('Không thể tải đơn hàng!', 'error') }
    finally { setLoading(false) }
  }, [search, statusFilter, payFilter])

  useEffect(() => { fetchOrders(1) }, [fetchOrders])

  const fBtn = (active) => ({
    padding:'6px 13px', borderRadius:8, border:'none', cursor:'pointer',
    fontSize:12, fontWeight:600, transition:'all .15s',
    background: active ? '#2563eb' : '#f3f4f6',
    color:      active ? '#fff'    : '#6b7280',
  })

  return (
    <div style={{ padding:'28px 32px', background:'#f8fafc', minHeight:'100vh', fontFamily:"'Be Vietnam Pro',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}

      {detailModal && (
        <OrderDetailModal order={detailModal} onClose={()=>setDetailModal(null)}
          onUpdated={(msg, type) => {
            setDetailModal(null); showToast(msg, type||'success')
            fetchOrders(pagination?.page??1); loadStats()
          }}/>
      )}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:'#111827' }}>📋 Quản lý đơn hàng</h1>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:4 }}>
          <p style={{ margin:0, color:'#6b7280', fontSize:14 }}>
            Tổng <strong style={{color:'#2563eb'}}>{pagination?.total??0}</strong> đơn hàng
          </p>
          {stats.unpaid_count > 0 && (
            <span style={{ padding:'3px 10px', borderRadius:20, background:'#fef3c7',
              color:'#d97706', fontSize:12, fontWeight:700 }}>
              ⚠️ {stats.unpaid_count} đơn chưa thanh toán
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards — click để lọc nhanh */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div key={key}
            onClick={()=>setStatusFilter(statusFilter===key ? '' : key)}
            style={{ background: statusFilter===key ? cfg.bg : '#fff',
              border:`1.5px solid ${statusFilter===key ? cfg.dot : '#e5e7eb'}`,
              borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all .2s' }}>
            <p style={{ margin:'0 0 2px', fontSize:24, fontWeight:800, color:cfg.color }}>{stats[key]??0}</p>
            <p style={{ margin:0, fontSize:12, color:'#6b7280', fontWeight:600 }}>{cfg.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ background:'#fff', borderRadius:16, padding:'14px 20px',
        boxShadow:'0 1px 3px rgba(0,0,0,.08)', marginBottom:20,
        display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>

        <div style={{ flex:1, minWidth:200, position:'relative' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}>🔍</span>
          <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
            placeholder="Tìm mã đơn, tên, email..."
            style={{ width:'100%', padding:'8px 10px 8px 32px', borderRadius:10,
              border:'1.5px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
        </div>

        {/* Lọc trạng thái đơn */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          <button onClick={()=>setStatusFilter('')} style={fBtn(statusFilter==='')}>Tất cả</button>
          {Object.entries(STATUS_CFG).map(([k,v])=>(
            <button key={k} onClick={()=>setStatusFilter(statusFilter===k?'':k)} style={fBtn(statusFilter===k)}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Lọc thanh toán */}
        <div style={{ display:'flex', gap:5 }}>
          <button onClick={()=>setPayFilter('')} style={fBtn(payFilter==='')}>Tất cả TT</button>
          {Object.entries(PAY_CFG).map(([k,v])=>(
            <button key={k} onClick={()=>setPayFilter(payFilter===k?'':k)} style={fBtn(payFilter===k)}>
              {v.label}
            </button>
          ))}
        </div>

        <button onClick={()=>{setSearchInput('');setSearch('');setStatusFilter('');setPayFilter('')}}
          style={{ padding:'7px 12px', borderRadius:8, border:'1.5px solid #e5e7eb',
            background:'#fff', cursor:'pointer', fontSize:12, color:'#6b7280', fontWeight:600 }}>
          🔄 Đặt lại
        </button>
      </div>

      {/* Bảng */}
      <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 1px 3px rgba(0,0,0,.08)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:80, textAlign:'center' }}>
            <div style={{ width:40, height:40, margin:'0 auto', border:'4px solid #e5e7eb',
              borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
            <p style={{ color:'#9ca3af', marginTop:16, fontSize:14 }}>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Mã đơn','Khách hàng','SP','Tổng tiền','Trạng thái','Thanh toán','Ngày đặt',''].map(h=>(
                    <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:11,
                      fontWeight:700, color:'#6b7280', textTransform:'uppercase',
                      whiteSpace:'nowrap', borderBottom:'2px solid #f3f4f6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length===0 ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af', fontSize:15 }}>
                    📭 Không tìm thấy đơn hàng nào
                  </td></tr>
                ) : orders.map((o,i) => (
                  <tr key={o.id}
                    style={{ borderTop:'1px solid #f3f4f6', background:i%2===0?'#fff':'#fafafa', transition:'background .15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#eff6ff'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#fafafa'}>

                    <td style={{ padding:'13px 14px' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#2563eb' }}>{o.order_code}</span>
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:600, color:'#111827' }}>{o.customer_name}</p>
                      <p style={{ margin:0, fontSize:12, color:'#9ca3af' }}>{o.customer_email}</p>
                    </td>
                    <td style={{ padding:'13px 14px', textAlign:'center' }}>
                      <span style={{ padding:'3px 10px', borderRadius:20, background:'#eff6ff', color:'#2563eb', fontSize:13, fontWeight:700 }}>
                        {o.item_count}
                      </span>
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'#ef4444' }}>{fmt(o.final_price)}</span>
                    </td>
                    <td style={{ padding:'13px 14px' }}><StatusBadge status={o.status}/></td>
                    <td style={{ padding:'13px 14px' }}><PayBadge status={o.payment_status}/></td>
                    <td style={{ padding:'13px 14px', fontSize:12, color:'#6b7280', whiteSpace:'nowrap' }}>
                      {fmtDate(o.created_at)}
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <button onClick={()=>setDetailModal(o)} style={{
                        padding:'6px 14px', borderRadius:8, border:'none',
                        background:'#eff6ff', color:'#2563eb', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && (pagination?.pages??1) > 1 && (
          <div style={{ padding:'14px 22px', borderTop:'1px solid #f3f4f6',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ margin:0, fontSize:13, color:'#6b7280' }}>
              {Math.min(((pagination?.page??1)-1)*(pagination?.per_page??10)+1, pagination?.total??0)}–
              {Math.min((pagination?.page??1)*(pagination?.per_page??10), pagination?.total??0)}
              &nbsp;/&nbsp;{pagination?.total??0} đơn
            </p>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>fetchOrders((pagination?.page??1)-1)}
                disabled={(pagination?.page??1)===1}
                style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff',
                  fontWeight:600, fontSize:13, cursor:(pagination?.page??1)===1?'not-allowed':'pointer',
                  color:(pagination?.page??1)===1?'#d1d5db':'#374151' }}>← Trước</button>
              {Array.from({length:Math.min(5,pagination?.pages??1)},(_,i)=>{
                let p=i+1
                if((pagination?.pages??1)>5&&(pagination?.page??1)>3) p=(pagination?.page??1)-2+i
                if(p>(pagination?.pages??1)) return null
                return <button key={p} onClick={()=>fetchOrders(p)} style={{
                  width:36, height:36, borderRadius:8, border:'none', fontWeight:700, cursor:'pointer', fontSize:13,
                  background:p===(pagination?.page??1)?'#2563eb':'#f3f4f6',
                  color:p===(pagination?.page??1)?'#fff':'#374151' }}>{p}</button>
              })}
              <button onClick={()=>fetchOrders((pagination?.page??1)+1)}
                disabled={(pagination?.page??1)===(pagination?.pages??1)}
                style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff',
                  fontWeight:600, fontSize:13,
                  cursor:(pagination?.page??1)===(pagination?.pages??1)?'not-allowed':'pointer',
                  color:(pagination?.page??1)===(pagination?.pages??1)?'#d1d5db':'#374151' }}>Sau →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}