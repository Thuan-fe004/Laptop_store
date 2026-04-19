import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/admin',            icon: '📊', label: 'Tổng quan'   },
  { path: '/admin/products',   icon: '💻', label: 'Sản phẩm'    },
  { path: '/admin/orders',     icon: '🛒', label: 'Đơn hàng'    },
  { path: '/admin/users',      icon: '👥', label: 'Người dùng'  },
  { path: '/admin/categories', icon: '🏷️', label: 'Danh mục'    },
  { path: '/admin/coupons',    icon: '🎫', label: 'Mã giảm giá' },
  { path: '/admin/reviews',    icon: '⭐', label: 'Đánh giá'    },
  {path: '/admin/reports',     icon: '📑', label: 'Báo cáo chi tiết'},  // ← path đầy đủ
  
];

export default function AdminLayout() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => logout();

  const isActive = (path) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Be Vietnam Pro', sans-serif", background: '#f8fafc' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: collapsed ? 72 : 240,
        background: '#0f172a',
        display: 'flex', flexDirection: 'column',
        transition: 'width .25s ease',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
        overflowX: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center',
          gap: 12, justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <span style={{ fontSize: 26 }}>💻</span>
          {!collapsed && (
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>LaptopStore</p>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: 12, padding: collapsed ? '12px 0' : '11px 20px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  margin: '2px 8px', borderRadius: 10,
                  background: active ? '#2563eb' : 'transparent',
                  color: active ? '#fff' : '#94a3b8',
                  fontWeight: active ? 700 : 500,
                  fontSize: 14, transition: 'all .15s', cursor: 'pointer',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = active ? '#fff' : '#94a3b8'; }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid #1e293b', padding: '12px 8px' }}>
          <div onClick={() => setCollapsed(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10, cursor: 'pointer', color: '#64748b',
            fontSize: 13,
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 18 }}>{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Thu gọn</span>}
          </div>
          <div onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10, cursor: 'pointer', color: '#ef4444',
            fontSize: 13,
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 18 }}>🚪</span>
            {!collapsed && <span>Đăng xuất</span>}
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflowX: 'auto' }}>
        {/* Top bar */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          padding: '14px 28px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#9ca3af', fontSize: 13 }}>Admin</span>
            <span style={{ color: '#d1d5db' }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
              {NAV_ITEMS.find(n => isActive(n.path))?.label || 'Trang'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Xin chào, Admin 👋</span>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#2563eb', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 15,
            }}>A</div>
          </div>
        </header>

        {/* Page content */}
        <Outlet />
      </main>
    </div>
  );
}