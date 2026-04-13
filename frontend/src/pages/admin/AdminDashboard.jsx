import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { adminDashboardAPI } from '../../services/api';

// ─── Helpers ────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtShort = (n) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' tỷ';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + ' tr';
  return n.toLocaleString('vi-VN');
};

const STATUS_CONFIG = {
  pending:    { label: 'Chờ xử lý',   color: '#f59e0b', bg: '#fef3c7' },
  processing: { label: 'Đang xử lý',  color: '#3b82f6', bg: '#dbeafe' },
  shipping:   { label: 'Đang giao',   color: '#8b5cf6', bg: '#ede9fe' },
  delivered:  { label: 'Đã giao',     color: '#10b981', bg: '#d1fae5' },
  cancelled:  { label: 'Đã huỷ',      color: '#ef4444', bg: '#fee2e2' },
};

// ─── Stat Card ─────────────────────────────────────
function StatCard({ icon, label, value, sub, subColor = '#6b7280', accent }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,.08)',
      borderTop: `4px solid ${accent}`,
      display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'box-shadow .2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.08)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</p>
          <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#111827' }}>{value}</p>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: accent + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>{icon}</div>
      </div>
      {sub && <p style={{ margin: 0, fontSize: 12, color: subColor }}>{sub}</p>}
    </div>
  );
}

// ─── Quick Nav Button ───────────────────────────────
function QuickNav({ icon, label, to, color, navigate }) {
  return (
    <button onClick={() => navigate(to)} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 20px', borderRadius: 12, border: 'none',
      background: color + '12', color, fontWeight: 600, fontSize: 14,
      cursor: 'pointer', transition: 'all .2s', width: '100%',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = color + '12'; e.currentTarget.style.color = color; }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span> {label}
    </button>
  );
}

// ─── Status Badge ──────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
    }}>{cfg.label}</span>
  );
}

// ─── Custom Tooltip ────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1f2937', color: '#fff', borderRadius: 10,
      padding: '10px 14px', fontSize: 13,
    }}>
      <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color }}>
          {p.name}: {p.name === 'Doanh thu' ? fmtShort(p.value) + 'đ' : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [chart,   setChart]   = useState([]);
  const [topProds,setTopProds]= useState([]);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    Promise.all([
      adminDashboardAPI.getStats(),
      adminDashboardAPI.getRevenueChart(),
      adminDashboardAPI.getTopProducts(),
      adminDashboardAPI.getRecentOrders(),
    ])
      .then(([s, c, t, r]) => {
        setStats(s.data.data);
        setChart(c.data.data.map(d => ({
          month: d.month.slice(5) + '/' + d.month.slice(0, 4),
          'Doanh thu': d.revenue,
          'Đơn hàng':  d.orders,
        })));
        setTopProds(t.data.data);
        setRecent(r.data.data);
      })
      .catch(() => setError('Không thể tải dữ liệu. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <div style={{
        width: 36, height: 36, border: '4px solid #e5e7eb',
        borderTopColor: '#2563eb', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color: '#6b7280', fontSize: 16 }}>Đang tải dữ liệu...</span>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <p style={{ fontSize: 40 }}>⚠️</p>
      <p style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>
      <button onClick={() => window.location.reload()} style={{
        marginTop: 12, padding: '8px 20px', borderRadius: 8,
        background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer',
      }}>Tải lại</button>
    </div>
  );

  const maxRevenue = Math.max(...topProds.map(p => p.revenue), 1);

  return (
    <div style={{ padding: '28px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827' }}>
          📊 Tổng quan hệ thống
        </h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          Cập nhật theo thời gian thực — {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        <StatCard
          icon="💰" accent="#2563eb" label="Tổng doanh thu"
          value={fmtShort(stats.revenue.total) + 'đ'}
          sub={`Tháng này: ${fmtShort(stats.revenue.this_month)}đ`}
          subColor="#2563eb"
        />
        <StatCard
          icon="🛒" accent="#10b981" label="Đơn hàng"
          value={stats.orders.total.toLocaleString()}
          sub={`Đã giao: ${stats.orders.delivered} · Đang xử lý: ${stats.orders.processing + stats.orders.shipping}`}
          subColor="#10b981"
        />
        <StatCard
          icon="💻" accent="#8b5cf6" label="Sản phẩm"
          value={stats.products.total.toLocaleString()}
          sub={stats.products.low_stock > 0 ? `⚠️ ${stats.products.low_stock} sản phẩm sắp hết hàng` : '✅ Tồn kho ổn định'}
          subColor={stats.products.low_stock > 0 ? '#f59e0b' : '#10b981'}
        />
        <StatCard
          icon="👥" accent="#f59e0b" label="Khách hàng"
          value={stats.users.total.toLocaleString()}
          sub={`Tháng này: +${stats.users.new_this_month} thành viên mới`}
          subColor="#f59e0b"
        />
      </div>

      {/* ── Order Status Row ── */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,.08)', marginBottom: 28,
        display: 'flex', gap: 0, flexWrap: 'wrap',
      }}>
        <p style={{ margin: '0 24px 0 0', fontWeight: 700, color: '#374151', alignSelf: 'center', fontSize: 14 }}>
          Trạng thái đơn hàng:
        </p>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', marginRight: 4,
            borderRadius: 8, background: cfg.bg,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>
              {stats.orders[key] ?? 0}
            </span>
          </div>
        ))}
      </div>

      {/* ── Quick Navigation ── */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,.08)', marginBottom: 28,
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#374151' }}>
          🚀 Truy cập nhanh
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <QuickNav navigate={navigate} icon="💻" label="Quản lý sản phẩm"  to="/admin/products" color="#8b5cf6" />
          <QuickNav navigate={navigate} icon="🛒" label="Quản lý đơn hàng"  to="/admin/orders"   color="#2563eb" />
          <QuickNav navigate={navigate} icon="👥" label="Quản lý người dùng" to="/admin/users"    color="#10b981" />
          <QuickNav navigate={navigate} icon="🏷️" label="Quản lý danh mục"  to="/admin/categories" color="#f59e0b" />
          <QuickNav navigate={navigate} icon="🎫" label="Mã giảm giá"        to="/admin/coupons"  color="#ef4444" />
        </div>
      </div>

      {/* ── Chart + Top Products ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Revenue Chart */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,.08)',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#374151' }}>
            📈 Doanh thu theo tháng
          </h2>
          {chart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Chưa có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="l" tickFormatter={v => fmtShort(v)} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line yAxisId="l" type="monotone" dataKey="Doanh thu" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="r" type="monotone" dataKey="Đơn hàng"  stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,.08)',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#374151' }}>
            🏆 Top sản phẩm bán chạy
          </h2>
          {topProds.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Chưa có dữ liệu</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topProds.map((p, i) => (
                <div key={p.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', fontSize: 11,
                        fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7c40' : '#e5e7eb',
                        color: '#fff',
                      }}>{i + 1}</span>
                      {p.name.length > 26 ? p.name.slice(0, 26) + '…' : p.name}
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{p.sold_qty} máy</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${(p.revenue / maxRevenue) * 100}%`,
                      background: ['#2563eb','#10b981','#8b5cf6','#f59e0b','#ef4444'][i],
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'right' }}>
                    {fmtShort(p.revenue)}đ
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Orders Table ── */}
      <div style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,.08)', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#374151' }}>
            🕐 Đơn hàng mới nhất
          </h2>
          <button onClick={() => navigate('/admin/orders')} style={{
            padding: '7px 16px', borderRadius: 8, border: '1.5px solid #2563eb',
            color: '#2563eb', background: 'transparent', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}>Xem tất cả →</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Mã đơn', 'Khách hàng', 'Giá trị', 'Trạng thái', 'Thanh toán', 'Thời gian'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((o, i) => (
                <tr key={o.id} style={{
                  borderTop: '1px solid #f3f4f6',
                  background: i % 2 === 0 ? '#fff' : '#fafafa',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                >
                  <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
                    {o.order_code}
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 13, color: '#374151' }}>
                    {o.customer_name}
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 600, color: '#111827' }}>
                    {fmt(o.final_price)}
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <StatusBadge status={o.status} />
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 12 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20,
                      background: o.payment_status === 'paid' ? '#d1fae5' : '#fef3c7',
                      color: o.payment_status === 'paid' ? '#059669' : '#d97706',
                      fontWeight: 600,
                    }}>
                      {o.payment_status === 'paid' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 12, color: '#9ca3af' }}>
                    {o.created_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Chưa có đơn hàng nào</p>
          )}
        </div>
      </div>
    </div>
  );
}