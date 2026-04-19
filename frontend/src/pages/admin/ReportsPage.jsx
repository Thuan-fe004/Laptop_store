// src/pages/admin/ReportsPage.jsx
import { useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import api from '../../services/api'

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0)

const fmtShort = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' tỷ'
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + ' tr'
  return n.toLocaleString('vi-VN')
}

const today     = () => new Date().toISOString().slice(0, 10)
const monthAgo  = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10) }

const STATUS_COLORS = {
  pending: '#f59e0b', processing: '#3b82f6',
  shipping: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444',
}
const STATUS_LABELS = {
  pending: 'Chờ xử lý', processing: 'Đang xử lý',
  shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã huỷ',
}

// ─── Sub-components ───────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 24,
      boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #f1f5f9',
      ...style,
    }}>{children}</div>
  )
}

function KpiCard({ icon, label, value, sub, accent }) {
  return (
    <Card style={{ borderTop: `4px solid ${accent}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px' }}>{label}</p>
          <p style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280' }}>{sub}</p>}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
      </div>
    </Card>
  )
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{children}</h2>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9ca3af' }}>{sub}</p>}
    </div>
  )
}

function Tooltip2({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1f2937', color: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '3px 0', color: p.color, display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>
            {typeof p.value === 'number' && p.value > 10000 ? fmtShort(p.value) + 'đ' : p.value?.toLocaleString('vi-VN')}
          </span>
        </p>
      ))}
    </div>
  )
}

const TABS = [
  { key: 'revenue',  label: '💰 Doanh thu' },
  { key: 'orders',   label: '🛒 Đơn hàng' },
  { key: 'products', label: '💻 Sản phẩm' },
  { key: 'customers',label: '👥 Khách hàng' },
  { key: 'inventory',label: '📦 Tồn kho' },
  { key: 'reviews',  label: '⭐ Đánh giá' },
]

// ─── Main ─────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tab,       setTab]       = useState('revenue')
  const [dateFrom,  setDateFrom]  = useState(monthAgo())
  const [dateTo,    setDateTo]    = useState(today())
  const [groupBy,   setGroupBy]   = useState('day')   // day | month
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error,     setError]     = useState('')
  const [queried,   setQueried]   = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true); setError(''); setQueried(true)
    try {
      const res = await api.get('/admin/reports/data', {
        params: { tab, date_from: dateFrom, date_to: dateTo, group_by: groupBy }
      })
      setData(res.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Không thể tải báo cáo')
    } finally {
      setLoading(false)
    }
  }, [tab, dateFrom, dateTo, groupBy])

  const exportExcel = useCallback(async () => {
    setExporting(true)
    try {
      const res = await api.get('/admin/reports/export', {
        params: { tab, date_from: dateFrom, date_to: dateTo, group_by: groupBy },
        responseType: 'blob',
      })
      const url  = URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href  = url
      link.download = `bao_cao_${tab}_${dateFrom}_${dateTo}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Xuất file thất bại. Vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }, [tab, dateFrom, dateTo, groupBy])

  // quick range helpers
  const setRange = (days) => {
    const to   = new Date()
    const from = new Date(); from.setDate(from.getDate() - days)
    setDateTo(to.toISOString().slice(0, 10))
    setDateFrom(from.toISOString().slice(0, 10))
  }

  const s = data  // shorthand

  return (
    <div style={{ padding: '28px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Be Vietnam Pro', Arial, sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .tab-btn { transition: all .18s; border: none; cursor: pointer; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; }
        .tab-btn:hover { opacity: .85; }
        .qr-btn { border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; background: #fff; color: #374151; transition: all .15s; }
        .qr-btn:hover { border-color: #2563eb; color: #2563eb; }
        tr.hov:hover td { background: #eff6ff !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827' }}>📑 Báo cáo thống kê</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>Phân tích chi tiết theo ngày tháng — xuất Excel</p>
        </div>
        <button
          onClick={exportExcel}
          disabled={!queried || !data || exporting}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 10, border: 'none',
            background: (!queried || !data) ? '#e5e7eb' : '#16a34a',
            color: (!queried || !data) ? '#9ca3af' : '#fff',
            fontSize: 14, fontWeight: 700, cursor: (!queried || !data) ? 'not-allowed' : 'pointer',
            transition: 'all .2s',
          }}
        >
          {exporting ? '⏳ Đang xuất...' : '📥 Xuất Excel'}
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, background: '#fff', padding: 6, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} className="tab-btn"
            onClick={() => { setTab(t.key); setData(null); setQueried(false) }}
            style={{ background: tab === t.key ? '#2563eb' : 'transparent', color: tab === t.key ? '#fff' : '#6b7280' }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <Card style={{ marginBottom: 22, padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Từ ngày</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#374151' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Đến ngày</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#374151' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Nhóm theo</label>
            <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#374151' }}>
              <option value="day">Ngày</option>
              <option value="month">Tháng</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['7', '7 ngày'], ['30', '30 ngày'], ['90', '3 tháng'], ['365', '1 năm']].map(([d, l]) => (
              <button key={d} className="qr-btn" onClick={() => setRange(+d)}>{l}</button>
            ))}
          </div>
          <button onClick={fetchReport} disabled={loading} style={{
            marginLeft: 'auto', padding: '9px 24px', borderRadius: 10, border: 'none',
            background: loading ? '#93c5fd' : '#2563eb', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s',
          }}>
            {loading ? '⏳ Đang tải...' : '🔍 Xem báo cáo'}
          </button>
        </div>
      </Card>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '14px 20px', background: '#fee2e2', borderRadius: 10, color: '#ef4444', fontWeight: 600, marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!queried && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Chọn khoảng thời gian và nhấn <b style={{ color: '#2563eb' }}>Xem báo cáo</b></p>
          <p style={{ fontSize: 13 }}>Dữ liệu sẽ hiển thị theo từng ngày hoặc từng tháng</p>
        </div>
      )}

      {/* ── Content ── */}
      {data && !loading && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>

          {/* ══ REVENUE TAB ══ */}
          {tab === 'revenue' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 22 }}>
                <KpiCard icon="💰" accent="#2563eb" label="Tổng doanh thu" value={fmtShort(s.kpi?.total_revenue) + 'đ'} sub={`${s.kpi?.order_count ?? 0} đơn đã giao`} />
                <KpiCard icon="📦" accent="#8b5cf6" label="Tổng đơn hàng"  value={(s.kpi?.order_count ?? 0).toLocaleString('vi-VN')} sub={`Huỷ: ${s.kpi?.cancelled_count ?? 0}`} />
                <KpiCard icon="💵" accent="#10b981" label="Giá trị TB/đơn" value={fmtShort(s.kpi?.avg_order_value) + 'đ'} sub="Tính trên đơn đã giao" />
                <KpiCard icon="🎫" accent="#f59e0b" label="Tiết kiệm coupon" value={fmtShort(s.kpi?.total_discount) + 'đ'} sub="Tổng giảm giá đã dùng" />
              </div>
              <Card style={{ marginBottom: 22 }}>
                <SectionTitle sub={`Doanh thu theo ${groupBy === 'day' ? 'ngày' : 'tháng'}`}>📈 Biểu đồ doanh thu</SectionTitle>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={s.chart}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }}/>
                    <YAxis tickFormatter={v => fmtShort(v)} tick={{ fontSize: 11 }}/>
                    <Tooltip content={<Tooltip2/>}/>
                    <Area type="monotone" dataKey="Doanh thu" stroke="#2563eb" strokeWidth={2.5} fill="url(#gRev)" dot={{ r: 3 }} activeDot={{ r: 6 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <SectionTitle sub="Chi tiết từng ngày/tháng">📋 Bảng chi tiết doanh thu</SectionTitle>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Thời gian','Đơn đã giao','Doanh thu','Giảm giá','Phí ship','Doanh thu thuần'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Thời gian' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.rows?.map((r, i) => (
                        <tr key={i} className="hov" style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '11px 16px', fontWeight: 600, color: '#374151' }}>{r.label}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', color: '#6b7280' }}>{r.order_count}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{fmt(r.revenue)}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', color: '#ef4444' }}>{fmt(r.discount)}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', color: '#6b7280' }}>{fmt(r.shipping_fee)}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{fmt(r.net_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8fafc', borderTop: '2px solid #e5e7eb' }}>
                        <td style={{ padding: '11px 16px', fontWeight: 800, color: '#111827' }}>TỔNG CỘNG</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 800 }}>{s.kpi?.order_count}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>{fmt(s.kpi?.total_revenue)}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>{fmt(s.kpi?.total_discount)}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 800 }}>{fmt(s.kpi?.total_shipping)}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>{fmt(s.kpi?.net_revenue)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ══ ORDERS TAB ══ */}
          {tab === 'orders' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 22 }}>
                {Object.entries(STATUS_LABELS).map(([k, l]) => (
                  <Card key={k} style={{ borderTop: `4px solid ${STATUS_COLORS[k]}`, padding: '16px 20px' }}>
                    <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>{l}</p>
                    <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: STATUS_COLORS[k] }}>{s.by_status?.[k] ?? 0}</p>
                  </Card>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 22 }}>
                <Card>
                  <SectionTitle sub="Số đơn theo thời gian">📈 Biểu đồ đơn hàng</SectionTitle>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={s.chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }}/>
                      <YAxis tick={{ fontSize: 11 }}/>
                      <Tooltip content={<Tooltip2/>}/>
                      <Bar dataKey="Tổng đơn" fill="#2563eb" radius={[5,5,0,0]}/>
                      <Bar dataKey="Đã giao"  fill="#10b981" radius={[5,5,0,0]}/>
                      <Bar dataKey="Đã huỷ"   fill="#ef4444" radius={[5,5,0,0]}/>
                      <Legend/>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card>
                  <SectionTitle sub="Tỷ lệ trạng thái">🥧 Phân bổ trạng thái</SectionTitle>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={Object.entries(STATUS_LABELS).map(([k,l]) => ({ name: l, value: s.by_status?.[k] ?? 0, color: STATUS_COLORS[k] })).filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                        {Object.keys(STATUS_LABELS).map((k, i) => <Cell key={i} fill={STATUS_COLORS[k]}/>)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v + ' đơn', n]}/>
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>
              <Card>
                <SectionTitle sub="Chi tiết đơn hàng từng ngày">📋 Bảng chi tiết đơn hàng</SectionTitle>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Thời gian','Tổng đơn','Chờ','Xử lý','Giao','Đã giao','Huỷ','Tỷ lệ giao'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Thời gian' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.rows?.map((r, i) => (
                        <tr key={i} className="hov" style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '11px 14px', fontWeight: 600 }}>{r.label}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700 }}>{r.total}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#f59e0b' }}>{r.pending}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#3b82f6' }}>{r.processing}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#8b5cf6' }}>{r.shipping}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{r.delivered}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#ef4444' }}>{r.cancelled}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: r.rate >= 70 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>{r.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ══ PRODUCTS TAB ══ */}
          {tab === 'products' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 22 }}>
                <KpiCard icon="💻" accent="#8b5cf6" label="Sản phẩm bán được" value={s.kpi?.sold_products ?? 0} sub="Trong khoảng thời gian" />
                <KpiCard icon="📦" accent="#2563eb" label="Tổng SL bán ra"    value={(s.kpi?.total_qty ?? 0).toLocaleString()} sub="sản phẩm" />
                <KpiCard icon="💰" accent="#10b981" label="Doanh thu SP"       value={fmtShort(s.kpi?.revenue) + 'đ'} sub="Từ đơn đã giao" />
                <KpiCard icon="⭐" accent="#f59e0b" label="Rating TB"          value={(s.kpi?.avg_rating ?? 0) + ' / 5'} sub={`${s.kpi?.review_count ?? 0} lượt đánh giá`} />
              </div>
              <Card>
                <SectionTitle sub="Xếp hạng theo doanh thu trong kỳ">🏆 Bảng xếp hạng sản phẩm</SectionTitle>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['#','Sản phẩm','Danh mục','SL bán','Doanh thu','% tổng DT','Tồn kho','Rating'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Sản phẩm' || h === 'Danh mục' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.rows?.map((r, i) => (
                        <tr key={r.id} className="hov" style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '11px 14px', fontWeight: 700, color: ['#d97706','#6b7280','#c05621'][i] ?? '#9ca3af' }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                          </td>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: '#111827', maxWidth: 220 }}>{r.name}</td>
                          <td style={{ padding: '11px 14px', color: '#6b7280' }}>{r.category}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600 }}>{r.qty}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{fmt(r.revenue)}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#6b7280' }}>{r.pct}%</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: r.stock <= 5 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{r.stock}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{'⭐ ' + (r.avg_rating ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ══ CUSTOMERS TAB ══ */}
          {tab === 'customers' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 22 }}>
                <KpiCard icon="👥" accent="#2563eb" label="KH mới trong kỳ"   value={s.kpi?.new_customers ?? 0} sub="Tài khoản đăng ký mới" />
                <KpiCard icon="🛒" accent="#8b5cf6" label="KH có đơn hàng"    value={s.kpi?.active_customers ?? 0} sub="Trong khoảng thời gian" />
                <KpiCard icon="💰" accent="#10b981" label="Chi tiêu TB/KH"    value={fmtShort(s.kpi?.avg_spend) + 'đ'} sub="Tính trên KH có đơn" />
                <KpiCard icon="🔁" accent="#f59e0b" label="Đơn TB/KH"         value={(s.kpi?.avg_orders ?? 0) + ' đơn'} sub="Trung bình mỗi khách" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>
                <Card>
                  <SectionTitle sub="Số KH mới theo thời gian">📈 Khách hàng mới</SectionTitle>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={s.chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }}/>
                      <YAxis tick={{ fontSize: 11 }}/>
                      <Tooltip content={<Tooltip2/>}/>
                      <Line type="monotone" dataKey="KH mới" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 7 }}/>
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
                <Card>
                  <SectionTitle sub="Top 10 khách chi tiêu nhiều nhất">👑 Top khách hàng</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                    {s.top_customers?.map((c, i) => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>
                            {c.name?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>{c.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{c.order_count} đơn</p>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{fmtShort(c.total_spend)}đ</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <Card>
                <SectionTitle sub="Chi tiết KH mới từng ngày/tháng">📋 Bảng chi tiết khách hàng</SectionTitle>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Thời gian','KH mới','KH có đơn','Tổng đơn','Doanh thu','Chi tiêu TB'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Thời gian' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.rows?.map((r, i) => (
                        <tr key={i} className="hov" style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '11px 14px', fontWeight: 600 }}>{r.label}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>+{r.new_customers}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>{r.active_customers}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>{r.orders}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{fmt(r.revenue)}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#6b7280' }}>{fmt(r.avg_spend)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ══ INVENTORY TAB ══ */}
          {tab === 'inventory' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 22 }}>
                <KpiCard icon="📦" accent="#2563eb" label="Tổng sản phẩm"     value={s.kpi?.total_products ?? 0} sub="Đang kinh doanh" />
                <KpiCard icon="⚠️" accent="#ef4444" label="Sắp hết hàng"      value={s.kpi?.low_stock ?? 0} sub="Tồn kho ≤ 5 sản phẩm" />
                <KpiCard icon="✅" accent="#10b981" label="Còn hàng tốt"       value={s.kpi?.healthy_stock ?? 0} sub="Tồn kho > 5" />
                <KpiCard icon="💰" accent="#f59e0b" label="Giá trị tồn kho"    value={fmtShort(s.kpi?.stock_value) + 'đ'} sub="Theo giá bán" />
              </div>
              <Card>
                <SectionTitle sub="Tất cả sản phẩm — sắp xếp theo tồn kho tăng dần">📋 Chi tiết tồn kho</SectionTitle>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['#','Sản phẩm','Danh mục','Thương hiệu','Tồn kho','Đã bán','Giá bán','Giá trị tồn','Trạng thái'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: ['Sản phẩm','Danh mục','Thương hiệu'].includes(h) ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.rows?.map((r, i) => (
                        <tr key={r.id} className="hov" style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '11px 14px', color: '#9ca3af', fontWeight: 600 }}>{i + 1}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: '#111827' }}>{r.name}</td>
                          <td style={{ padding: '11px 14px', color: '#6b7280' }}>{r.category}</td>
                          <td style={{ padding: '11px 14px', color: '#6b7280' }}>{r.brand}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: r.quantity === 0 ? '#ef4444' : r.quantity <= 5 ? '#f59e0b' : '#10b981' }}>{r.quantity}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#6b7280' }}>{r.sold_count}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: '#374151' }}>{fmt(r.price)}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>{fmt(r.stock_value)}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                              background: r.quantity === 0 ? '#fee2e2' : r.quantity <= 5 ? '#fef3c7' : '#d1fae5',
                              color: r.quantity === 0 ? '#ef4444' : r.quantity <= 5 ? '#d97706' : '#059669',
                            }}>
                              {r.quantity === 0 ? 'Hết hàng' : r.quantity <= 5 ? 'Sắp hết' : 'Còn hàng'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ══ REVIEWS TAB ══ */}
          {tab === 'reviews' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 22 }}>
                <KpiCard icon="⭐" accent="#f59e0b" label="Rating trung bình" value={(s.kpi?.avg_rating ?? 0) + ' / 5'} sub={`${s.kpi?.total_reviews ?? 0} lượt đánh giá`} />
                <KpiCard icon="👍" accent="#10b981" label="Đánh giá tốt (4-5★)" value={s.kpi?.good_reviews ?? 0} sub={`${s.kpi?.good_pct ?? 0}% tổng đánh giá`} />
                <KpiCard icon="😐" accent="#f59e0b" label="Trung bình (3★)"   value={s.kpi?.ok_reviews ?? 0} sub={`${s.kpi?.ok_pct ?? 0}% tổng đánh giá`} />
                <KpiCard icon="👎" accent="#ef4444" label="Đánh giá xấu (1-2★)" value={s.kpi?.bad_reviews ?? 0} sub={`${s.kpi?.bad_pct ?? 0}% tổng đánh giá`} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 22 }}>
                <Card>
                  <SectionTitle sub="Số đánh giá theo thời gian">📈 Biểu đồ đánh giá</SectionTitle>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={s.chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }}/>
                      <YAxis tick={{ fontSize: 11 }}/>
                      <Tooltip content={<Tooltip2/>}/>
                      <Bar dataKey="Đánh giá" fill="#f59e0b" radius={[5,5,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card>
                  <SectionTitle sub="Phân bổ số sao">⭐ Phân bổ rating</SectionTitle>
                  {[5,4,3,2,1].map(star => {
                    const count = s.by_star?.[star] ?? 0
                    const total = s.kpi?.total_reviews ?? 1
                    const pct   = total > 0 ? Math.round((count/total)*100) : 0
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', minWidth: 24 }}>{star}★</span>
                        <div style={{ flex: 1, height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: star >= 4 ? '#10b981' : star === 3 ? '#f59e0b' : '#ef4444', borderRadius: 5, transition: 'width 0.8s ease' }}/>
                        </div>
                        <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 40, textAlign: 'right' }}>{count} ({pct}%)</span>
                      </div>
                    )
                  })}
                </Card>
              </div>
              <Card>
                <SectionTitle sub="Sản phẩm được đánh giá trong kỳ">📋 Đánh giá theo sản phẩm</SectionTitle>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['#','Sản phẩm','SL đánh giá','Rating TB','5★','4★','3★','2★','1★'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Sản phẩm' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.rows?.map((r, i) => (
                        <tr key={r.id} className="hov" style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '11px 14px', color: '#9ca3af' }}>{i + 1}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 600 }}>{r.product_name}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>{r.total}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: r.avg >= 4 ? '#10b981' : r.avg >= 3 ? '#f59e0b' : '#ef4444' }}>{'⭐ ' + r.avg}</td>
                          {[5,4,3,2,1].map(s => <td key={s} style={{ padding: '11px 14px', textAlign: 'right', color: '#6b7280' }}>{r['star_' + s]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

        </div>
      )}
    </div>
  )
}