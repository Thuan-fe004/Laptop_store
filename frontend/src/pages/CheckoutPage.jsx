// src/pages/CheckoutPage.jsx
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { IMG_BASE_URL } from '../constants/config';
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

const PROVINCES = ['TP. Hồ Chí Minh','Hà Nội','Đà Nẵng','Cần Thơ','Hải Phòng','An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu','Bắc Ninh','Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau','Cao Bằng','Đắk Lắk','Đắk Nông','Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam','Hà Tĩnh','Hải Dương','Hậu Giang','Hòa Bình','Hưng Yên','Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng','Lạng Sơn','Lào Cai','Long An','Nam Định','Nghệ An','Ninh Bình','Ninh Thuận','Phú Thọ','Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh','Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên','Thanh Hóa','Thừa Thiên Huế','Tiền Giang','Trà Vinh','Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái']

const PAYMENT_METHODS = [
  { id: 'cod',      icon: '💵', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt khi nhận hàng, an toàn và tiện lợi', color: '#16a34a' },
  { id: 'transfer', icon: '🏦', label: 'Chuyển khoản ngân hàng',         desc: 'Quét mã QR MB Bank — xác nhận tự động',           color: '#2563eb' },
  { id: 'momo',     icon: '💜', label: 'Ví MoMo',                        desc: 'Thanh toán nhanh qua ví điện tử MoMo',           color: '#a855f7' },
  { id: 'vnpay',    icon: '💳', label: 'VNPay',                          desc: 'Cổng thanh toán trực tuyến VNPay',               color: '#0ea5e9' },
]

/* ─────────────── QR Payment Modal ─────────────── */
function QRPaymentModal({ orderId, orderCode, amount, onSuccess }) {
  const [qrData,  setQrData]  = useState(null)
  const [status,  setStatus]  = useState('loading') // loading | waiting | paid | error
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef(null)
  const pollRef     = useRef(null)

  // Lấy QR từ backend
  useEffect(() => {
    api.get(`/payment/qr/${orderId}`)
      .then(r => {
        if (r.data.already_paid) { setStatus('paid'); onSuccess(); return }
        setQrData(r.data)
        setStatus('waiting')
      })
      .catch(() => setStatus('error'))
  }, [orderId])

  // Polling trạng thái mỗi 5 giây
  useEffect(() => {
    if (status !== 'waiting') return

    // Đếm giây chờ
    intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

    // Poll thanh toán
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get(`/payment/status/${orderId}`)
        if (r.data.payment_status === 'paid') {
          clearInterval(intervalRef.current)
          clearInterval(pollRef.current)
          setStatus('paid')
          setTimeout(() => onSuccess(), 800)
        }
      } catch (_) {}
    }, 5000)

    return () => {
      clearInterval(intervalRef.current)
      clearInterval(pollRef.current)
    }
  }, [status, orderId, onSuccess])

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '36px 32px',
        maxWidth: 440, width: '100%', textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,.25)',
        animation: 'fadeUp .35s ease',
      }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏦</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1a2341' }}>
            Thanh toán chuyển khoản
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>
            Mã đơn: <strong style={{ color: '#1a2341' }}>#{orderCode}</strong>
          </p>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div style={{ padding: '40px 0' }}>
            <div style={{ width: 40, height: 40, margin: '0 auto 16px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            <p style={{ color: '#6b7280' }}>Đang tải mã QR...</p>
          </div>
        )}

        {/* QR Waiting */}
        {status === 'waiting' && qrData && (
          <>
            {/* QR Image */}
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 20, border: '2px dashed #2563eb' }}>
              <img
                src={qrData.qr_url}
                alt="QR chuyển khoản"
                style={{ width: 200, height: 200, borderRadius: 12 }}
                onError={e => e.target.src = `https://img.vietqr.io/image/MB-${qrData.account_no}-compact2.png`}
              />
            </div>

            {/* Amount */}
            <div style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 14, padding: '14px 20px', marginBottom: 16 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6b7280' }}>Số tiền cần chuyển</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#ef4444' }}>{fmt(qrData.amount)}</p>
            </div>

            {/* Bank Info */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 20px', marginBottom: 16, textAlign: 'left' }}>
              {[
                ['🏦 Ngân hàng', qrData.bank],
                ['💳 Số tài khoản', qrData.account_no],
                ['👤 Chủ TK', qrData.account_name],
                ['📝 Nội dung CK', qrData.description],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>{label}</span>
                  <strong
                    style={{ fontSize: 13, color: '#111827', textAlign: 'right', cursor: 'pointer', maxWidth: '60%' }}
                    title="Click để copy"
                    onClick={() => { navigator.clipboard?.writeText(value); toast.info('✅ Đã copy!', { autoClose: 1500 }) }}
                  >
                    {value}
                  </strong>
                </div>
              ))}
            </div>

            {/* Copy nội dung CK nhanh */}
            <button
              onClick={() => { navigator.clipboard?.writeText(qrData.description); toast.info('✅ Đã copy nội dung chuyển khoản!', { autoClose: 2000 }) }}
              style={{ width: '100%', padding: '10px 0', borderRadius: 10, background: '#eff6ff', border: '1.5px solid #bfdbfe', color: '#2563eb', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}
            >
              📋 Copy nội dung chuyển khoản
            </button>

            {/* Polling indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#6b7280', fontSize: 13 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
              <span>Đang chờ xác nhận... {fmtTime(seconds)}</span>
            </div>

            <p style={{ margin: '10px 0 0', fontSize: 11, color: '#9ca3af' }}>
              Hệ thống tự động xác nhận sau khi nhận được tiền
            </p>
          </>
        )}

        {/* Paid Success */}
        {status === 'paid' && (
          <div style={{ padding: '20px 0', animation: 'pop .5s ease' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
            <h3 style={{ margin: '0 0 8px', color: '#16a34a', fontSize: 22, fontWeight: 900 }}>Thanh toán thành công!</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Đơn hàng của bạn đã được xác nhận</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#ef4444', fontWeight: 700 }}>Không thể tải mã QR</p>
            <button onClick={() => setStatus('loading')} style={{ padding: '10px 24px', borderRadius: 10, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              Thử lại
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────── Bill / Invoice Modal ─────────────── */
function BillModal({ orderId, orderCode, items, form, total, shipping, discount, payment, onClose }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const handlePrint = () => window.print()

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, overflowY: 'auto',
    }}>
      <div id="bill-content" style={{
        background: '#fff', borderRadius: 20, padding: '36px 32px',
        maxWidth: 520, width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,.25)',
        animation: 'fadeUp .35s ease',
        fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>💻</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1a2341' }}>
            Laptop<span style={{ color: '#2563eb' }}>Store</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>HÓA ĐƠN MUA HÀNG</p>
        </div>

        {/* Order Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20, fontSize: 13 }}>
          <div>
            <span style={{ color: '#6b7280' }}>Mã đơn hàng:</span>
            <strong style={{ display: 'block', color: '#1a2341' }}>#{orderCode}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#6b7280' }}>Ngày đặt:</span>
            <strong style={{ display: 'block', color: '#1a2341' }}>{dateStr}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Khách hàng:</span>
            <strong style={{ display: 'block', color: '#1a2341' }}>{form.receiver_name}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#6b7280' }}>SĐT:</span>
            <strong style={{ display: 'block', color: '#1a2341' }}>{form.receiver_phone}</strong>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <span style={{ color: '#6b7280' }}>Địa chỉ:</span>
            <strong style={{ display: 'block', color: '#1a2341' }}>
              {form.address}{form.ward ? `, ${form.ward}` : ''}, {form.district}, {form.province}
            </strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Thanh toán:</span>
            <strong style={{ display: 'block', color: payment === 'transfer' ? '#2563eb' : '#16a34a' }}>
              {payment === 'transfer' ? '🏦 Chuyển khoản' : payment === 'cod' ? '💵 COD' : payment.toUpperCase()}
            </strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#6b7280' }}>Trạng thái TT:</span>
            <strong style={{ display: 'block', color: '#16a34a' }}>✅ Đã thanh toán</strong>
          </div>
        </div>

        {/* Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Sản phẩm' ? 'left' : 'right', color: '#374151', fontWeight: 700, borderBottom: '2px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(it => {
              const price = it.sale_price || it.price
              return (
                <tr key={it.product_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 10px', color: '#111827', fontWeight: 600, maxWidth: 200 }}>{it.name}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#6b7280' }}>{it.quantity}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#6b7280' }}>{fmt(price)}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#111827', fontWeight: 700 }}>{fmt(price * it.quantity)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Tạm tính', fmt(total - shipping + discount)],
            ['Phí giao hàng', shipping === 0 ? 'Miễn phí 🎉' : fmt(shipping)],
            ...(discount > 0 ? [['Giảm giá', `-${fmt(discount)}`]] : []),
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
              <span>{label}</span><span style={{ fontWeight: 600, color: '#374151' }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: '#111827', paddingTop: 10, borderTop: '2px solid #1a2341', marginTop: 6 }}>
            <span>TỔNG CỘNG</span>
            <span style={{ color: '#ef4444' }}>{fmt(total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px dashed #e5e7eb', fontSize: 12, color: '#9ca3af' }}>
          <p style={{ margin: '0 0 4px' }}>🙏 Cảm ơn bạn đã mua hàng tại LaptopStore!</p>
          <p style={{ margin: 0 }}>Hỗ trợ: support@laptopstore.vn | Hotline: 1900 xxxx</p>
        </div>

        {/* Buttons — ẩn khi in */}
        <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            onClick={handlePrint}
            style={{ flex: 1, padding: '13px 0', borderRadius: 12, background: 'linear-gradient(135deg,#1a2341,#2563eb)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
          >
            🖨️ In hóa đơn
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '13px 0', borderRadius: 12, background: '#f3f4f6', color: '#374151', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
          >
            ✅ Đóng
          </button>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #bill-content, #bill-content * { visibility: visible; }
          #bill-content { position: fixed; left: 0; top: 0; width: 100%; box-shadow: none !important; border-radius: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

/* ── Step indicator ── */
function Steps({ current }) {
  const steps = [
    { label: 'Giỏ hàng',  icon: '🛒' },
    { label: 'Địa chỉ',   icon: '📍' },
    { label: 'Thanh toán', icon: '💳' },
    { label: 'Xác nhận',  icon: '🎉' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40, gap: 0 }}>
      {steps.map((s, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 72 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: done ? '#16a34a' : active ? 'linear-gradient(135deg,#1a2341,#2563eb)' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 18 : 20, fontWeight: 800,
                boxShadow: active ? '0 6px 20px rgba(37,99,235,.35)' : 'none',
                transition: 'all .3s',
              }}>
                {done ? <span style={{ color: '#fff', fontSize: 18 }}>✓</span> : <span style={{ filter: !active ? 'grayscale(1) opacity(.5)' : 'none' }}>{s.icon}</span>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#1a2341' : done ? '#16a34a' : '#9ca3af', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 70, height: 2, background: done ? '#16a34a' : '#e5e7eb', margin: '0 0 22px', transition: 'background .4s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Input Field ── */
function Field({ label, error, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ margin: '5px 0 0', fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  )
}

const iStyle = (err) => ({
  width: '100%', padding: '11px 14px',
  border: `1.5px solid ${err ? '#ef4444' : '#e5e7eb'}`,
  borderRadius: 10, fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fff',
  transition: 'border-color .2s, box-shadow .2s',
  fontFamily: 'inherit',
})

function SumRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</span>
    </div>
  )
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [step,    setStep]    = useState(1)
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [orderInfo, setOrderInfo] = useState(null) // { orderId, orderCode }

  // QR modal state (không dùng nữa — đã chuyển sang SePay PG)
  // Bill modal state
  const [showBill, setShowBill] = useState(false)

  const [form, setForm] = useState({
    receiver_name:  user?.name  || '',
    receiver_phone: user?.phone || '',
    address: '', ward: '', district: '',
    province: 'TP. Hồ Chí Minh', note: '',
  })
  const [payment,    setPayment]    = useState('cod')
  const [couponCode, setCouponCode] = useState('')
  const [coupon,     setCoupon]     = useState(null)
  const [couponErr,  setCouponErr]  = useState('')
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get('/cart').then(r => {
      const allItems = r.data?.data || []
      const raw = sessionStorage.getItem('checkout_selected')
      if (raw) {
        try {
          const selectedIds = new Set(JSON.parse(raw).map(Number))
          const filtered = allItems.filter(it => selectedIds.has(Number(it.product_id)))
          setItems(filtered.length > 0 ? filtered : allItems)
        } catch { setItems(allItems) }
      } else {
        setItems(allItems)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  // Xử lý khi SePay redirect về /checkout?payment=cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'cancel') {
      toast.warning('⚠️ Bạn đã hủy thanh toán. Đơn hàng vẫn được giữ lại.')
      window.history.replaceState({}, '', '/checkout')
    }
  }, [])

  const subtotal  = items.reduce((s, it) => s + (it.sale_price || it.price) * it.quantity, 0)
  const SHIP_FREE = 10_000_000
  const shipping  = subtotal >= SHIP_FREE ? 0 : 50_000
  const discount  = coupon
    ? coupon.discount_type === 'percent'
      ? Math.min(subtotal * coupon.discount_value / 100, coupon.max_discount || Infinity)
      : coupon.discount_value
    : 0
  const total = subtotal + shipping - discount

  const applyCoupon = async () => {
    setCouponErr('')
    if (!couponCode.trim()) return
    try {
      const res = await api.post('/coupons/validate', { code: couponCode.trim(), order_total: subtotal })
      setCoupon(res.data.coupon)
      toast.success('✅ Áp dụng mã giảm giá thành công!')
    } catch (e) {
      setCouponErr(e.response?.data?.message || 'Mã không hợp lệ')
      setCoupon(null)
    }
  }

  const validateForm = () => {
    const e = {}
    if (!form.receiver_name.trim())  e.receiver_name  = 'Vui lòng nhập tên người nhận'
    if (!form.receiver_phone.trim()) e.receiver_phone = 'Vui lòng nhập số điện thoại'
    else if (!/^[0-9]{9,11}$/.test(form.receiver_phone.replace(/\s/g, ''))) e.receiver_phone = 'Số điện thoại không hợp lệ'
    if (!form.address.trim())  e.address  = 'Vui lòng nhập địa chỉ'
    if (!form.district.trim()) e.district = 'Vui lòng nhập quận/huyện'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const placeOrder = async () => {
  if (!validateForm()) { setStep(1); toast.error('Vui lòng điền đầy đủ thông tin giao hàng'); return }
  setPlacing(true)
    try {
      const selectedProductIds = items.map(it => it.product_id)
  
      // Bước 1: Tạo đơn hàng
      const res = await api.post('/orders', {
        shipping_info:        form,
        payment_method:       payment,
        coupon_code:          coupon ? couponCode : null,
        selected_product_ids: selectedProductIds,
      }, { headers: { 'Content-Type': 'application/json' } })
  
      const { order_id, order_code } = res.data
      setOrderInfo({ orderId: order_id, orderCode: order_code })
      sessionStorage.removeItem('checkout_selected')
  
      if (payment === 'transfer') {
        // Bước 2: Gọi API tạo phiên thanh toán SePay → nhận checkout_url
        toast.info('🏦 Đang tạo phiên thanh toán...')
        const payRes = await api.post(`/payment/create/${order_id}`)
  
        if (payRes.data.success && payRes.data.checkout_url) {
          // SePay trả về link → redirect thẳng
          window.location.href = payRes.data.checkout_url

        } else if (payRes.data.success && payRes.data.use_form) {
          // SePay yêu cầu POST form → tạo form ẩn và submit
          const { action_url, form_fields } = payRes.data
          const f = document.createElement('form')
          f.method = 'POST'
          f.action = action_url
          Object.entries(form_fields).forEach(([key, value]) => {
            const input = document.createElement('input')
            input.type  = 'hidden'
            input.name  = key
            input.value = value
            f.appendChild(input)
          })
          document.body.appendChild(f)
          f.submit()

        } else {
          toast.error('Không thể tạo phiên thanh toán, vui lòng thử lại')
          setPlacing(false)
        }
      } else {
        // COD / MoMo / VNPay → thành công ngay
        setStep(3)
        toast.success('🎉 Đặt hàng thành công!')
        setPlacing(false)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại')
      setPlacing(false)
    }
  }
  const setF = (key, val) => { setForm(f => ({ ...f, [key]: val })); setFormErrors(e => ({ ...e, [key]: '' })) }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, margin: '0 auto 16px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <p style={{ color: '#6b7280', fontWeight: 600 }}>Đang tải...</p>
      </div>
    </div>
  )

  if (items.length === 0 && step !== 3) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🛒</div>
      <h2 style={{ fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>Giỏ hàng trống</h2>
      <Link to="/products" style={{ marginTop: 20, padding: '12px 28px', background: '#1a2341', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>Mua sắm ngay</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0;transform:translateY(16px) } to { opacity:1;transform:none } }
        @keyframes pop { 0%{transform:scale(.7);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing: border-box }
        input:focus,select:focus,textarea:focus { border-color:#2563eb !important;box-shadow:0 0 0 3px rgba(37,99,235,.12) !important;outline:none }
      `}</style>

      {/* Bill Modal */}
      {showBill && orderInfo && (
        <BillModal
          orderId={orderInfo.orderId}
          orderCode={orderInfo.orderCode}
          items={items}
          form={form}
          total={total}
          shipping={shipping}
          discount={discount}
          payment={payment}
          onClose={() => setShowBill(false)}
        />
      )}

      {/* Navbar */}
      <nav style={{ background: '#1a2341', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 16px rgba(0,0,0,.2)' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>💻</span>
          <span style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>Laptop<span style={{ color: '#60a5fa' }}>Store</span></span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>🔒 Thanh toán an toàn & bảo mật</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '36px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>
          <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Trang chủ</Link>
          <span style={{ margin: '0 6px', color: '#d1d5db' }}>›</span>
          <Link to="/cart" style={{ color: '#6b7280', textDecoration: 'none' }}>Giỏ hàng</Link>
          <span style={{ margin: '0 6px', color: '#d1d5db' }}>›</span>
          <span style={{ color: '#111827', fontWeight: 700 }}>Thanh toán</span>
        </div>

        <Steps current={step} />

        {/* ── SUCCESS ── */}
        {step === 3 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', animation: 'fadeUp .5s ease' }}>
            <div style={{ fontSize: 88, marginBottom: 20, animation: 'pop .6s ease' }}>🎉</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: '#111827', margin: '0 0 10px' }}>Đặt hàng thành công!</h2>
            <div style={{ display: 'inline-block', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '10px 24px', margin: '0 0 16px' }}>
              <span style={{ fontSize: 14, color: '#6b7280' }}>Mã đơn hàng: </span>
              <strong style={{ fontSize: 18, color: '#1a2341' }}>#{orderInfo?.orderCode}</strong>
            </div>
            <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 12px', lineHeight: 1.7 }}>
              Cảm ơn bạn đã tin tưởng mua sắm tại LaptopStore!<br />
              {payment === 'transfer'
                ? 'Thanh toán đã được xác nhận tự động. 🎊'
                : 'Chúng tôi sẽ liên hệ xác nhận và giao hàng trong 1–3 ngày làm việc.'}
            </p>

            {/* Nút in bill */}
            <div style={{ margin: '20px auto', maxWidth: 480 }}>
              <button
                onClick={() => setShowBill(true)}
                style={{ width: '100%', padding: '14px 0', borderRadius: 13, background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(22,163,74,.3)', marginBottom: 12 }}
              >
                🧾 In hóa đơn / Bill
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
              <Link to="/orders" style={{ padding: '13px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#1a2341,#2563eb)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 24px rgba(37,99,235,.3)' }}>📦 Xem đơn hàng</Link>
              <Link to="/" style={{ padding: '13px 24px', borderRadius: 12, border: '1.5px solid #e5e7eb', color: '#374151', fontWeight: 700, fontSize: 15, textDecoration: 'none', background: '#fff' }}>🏠 Trang chủ</Link>
              <Link to="/products" style={{ padding: '13px 24px', borderRadius: 12, border: '1.5px solid #2563eb', color: '#2563eb', fontWeight: 700, fontSize: 15, textDecoration: 'none', background: '#fff' }}>🛍️ Mua tiếp</Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 370px', gap: 28, alignItems: 'start' }}>

            {/* ── LEFT FORM ── */}
            <div>
              {/* Step 1: Shipping */}
              {step === 1 && (
                <div style={{ background: '#fff', borderRadius: 18, padding: 28, border: '1.5px solid #f0f0f5', boxShadow: '0 4px 20px rgba(0,0,0,.05)', animation: 'fadeUp .3s ease' }}>
                  <h3 style={{ margin: '0 0 24px', fontSize: 19, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2341,#2563eb)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📍</span>
                    Thông tin giao hàng
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Tên người nhận" required error={formErrors.receiver_name}>
                      <input value={form.receiver_name} onChange={e => setF('receiver_name', e.target.value)} placeholder="Nguyễn Văn A" style={iStyle(formErrors.receiver_name)} />
                    </Field>
                    <Field label="Số điện thoại" required error={formErrors.receiver_phone}>
                      <input value={form.receiver_phone} onChange={e => setF('receiver_phone', e.target.value)} placeholder="0901 234 567" style={iStyle(formErrors.receiver_phone)} />
                    </Field>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <Field label="Địa chỉ cụ thể" required error={formErrors.address}>
                      <input value={form.address} onChange={e => setF('address', e.target.value)} placeholder="Số nhà, tên đường, tòa nhà..." style={iStyle(formErrors.address)} />
                    </Field>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                    <Field label="Phường/Xã">
                      <input value={form.ward} onChange={e => setF('ward', e.target.value)} placeholder="Phường Bến Nghé" style={iStyle(false)} />
                    </Field>
                    <Field label="Quận/Huyện" required error={formErrors.district}>
                      <input value={form.district} onChange={e => setF('district', e.target.value)} placeholder="Quận 1" style={iStyle(formErrors.district)} />
                    </Field>
                    <Field label="Tỉnh/Thành phố" required>
                      <select value={form.province} onChange={e => setF('province', e.target.value)} style={{ ...iStyle(false), cursor: 'pointer' }}>
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </Field>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <Field label="Ghi chú đơn hàng">
                      <textarea value={form.note} onChange={e => setF('note', e.target.value)} placeholder="Giao giờ hành chính, gọi trước 30 phút khi giao..." rows={3} style={{ ...iStyle(false), resize: 'vertical', lineHeight: 1.6 }} />
                    </Field>
                  </div>

                  <button onClick={() => { if (validateForm()) setStep(2) }}
                    style={{ marginTop: 24, width: '100%', padding: '14px 0', borderRadius: 12, background: 'linear-gradient(135deg,#1a2341,#2563eb)', color: '#fff', border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,.25)', transition: 'opacity .2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '.9'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Tiếp theo: Chọn thanh toán →
                  </button>
                </div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <div style={{ animation: 'fadeUp .3s ease' }}>
                  <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: 0 }}>
                    ← Quay lại thông tin giao hàng
                  </button>

                  {/* Address summary */}
                  <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '16px 20px', border: '1.5px solid #bbf7d0', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#111827', fontSize: 15 }}>
                        📍 {form.receiver_name} · {form.receiver_phone}
                      </p>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
                        {form.address}{form.ward ? `, ${form.ward}` : ''}, {form.district}, {form.province}
                      </p>
                    </div>
                    <button onClick={() => setStep(1)} style={{ background: 'none', border: '1.5px solid #16a34a', borderRadius: 8, color: '#16a34a', cursor: 'pointer', padding: '5px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      ✏️ Sửa
                    </button>
                  </div>

                  {/* Payment methods */}
                  <div style={{ background: '#fff', borderRadius: 18, padding: 24, border: '1.5px solid #f0f0f5', boxShadow: '0 4px 20px rgba(0,0,0,.05)', marginBottom: 16 }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2341,#2563eb)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>💳</span>
                      Phương thức thanh toán
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {PAYMENT_METHODS.map(pm => (
                        <label key={pm.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 14, border: `2px solid ${payment === pm.id ? pm.color : '#e5e7eb'}`, background: payment === pm.id ? `${pm.color}08` : '#fff', cursor: 'pointer', transition: 'all .2s' }}
                          onClick={() => setPayment(pm.id)}
                        >
                          <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2.5px solid ${payment === pm.id ? pm.color : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}>
                            {payment === pm.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: pm.color }} />}
                          </div>
                          <span style={{ fontSize: 26 }}>{pm.icon}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 14 }}>{pm.label}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>{pm.desc}</p>
                          </div>
                          {payment === pm.id && <span style={{ fontSize: 18, color: pm.color }}>✓</span>}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Coupon */}
                  <div style={{ background: '#fff', borderRadius: 18, padding: 24, border: '1.5px solid #f0f0f5', boxShadow: '0 4px 20px rgba(0,0,0,.05)' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                      🎁 Mã giảm giá
                    </h3>
                    {coupon ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', borderRadius: 12, padding: '12px 16px', border: '1.5px solid #bbf7d0' }}>
                        <div style={{ display: 'flex', align: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>✅</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 800, color: '#16a34a' }}>{couponCode.toUpperCase()}</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Giảm {fmt(discount)}</p>
                          </div>
                        </div>
                        <button onClick={() => { setCoupon(null); setCouponCode('') }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Xóa</button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={couponCode}
                            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponErr('') }}
                            onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                            placeholder="Nhập mã giảm giá..."
                            style={{ flex: 1, padding: '11px 14px', border: `1.5px solid ${couponErr ? '#ef4444' : '#e5e7eb'}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', letterSpacing: 1 }}
                          />
                          <button onClick={applyCoupon} style={{ padding: '11px 22px', borderRadius: 10, background: '#1a2341', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}>
                            Áp dụng
                          </button>
                        </div>
                        {couponErr && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#ef4444' }}>⚠️ {couponErr}</p>}
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9ca3af' }}>
                          💡 Thử: WELCOME10, SALE50K, GIAM200K
                        </p>
                      </div>
                    )}
                  </div>

                  <button onClick={placeOrder} disabled={placing}
                    style={{ marginTop: 20, width: '100%', padding: '16px 0', borderRadius: 13, background: placing ? '#94a3b8' : 'linear-gradient(135deg,#1a2341,#2563eb)', color: '#fff', border: 'none', fontSize: 17, fontWeight: 800, cursor: placing ? 'not-allowed' : 'pointer', boxShadow: placing ? 'none' : '0 10px 32px rgba(37,99,235,.3)', transition: 'all .2s' }}
                  >
                    {placing ? '⏳ Đang xử lý đơn hàng...' : payment === 'transfer' ? '🏦 Đặt hàng & Thanh toán QR' : '🎉 Xác nhận đặt hàng'}
                  </button>

                  <p style={{ textAlign: 'center', margin: '12px 0 0', fontSize: 12, color: '#9ca3af' }}>
                    🔒 Thông tin của bạn được bảo mật tuyệt đối
                  </p>
                </div>
              )}
            </div>

            {/* ── RIGHT SUMMARY ── */}
            <div style={{ position: 'sticky', top: 24 }}>
              <div style={{ background: '#fff', borderRadius: 18, padding: 24, border: '1.5px solid #f0f0f5', boxShadow: '0 8px 32px rgba(0,0,0,.07)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#111827' }}>
                  🧾 Đơn hàng ({items.length} sản phẩm)
                </h3>

                {/* Items */}
                <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, paddingRight: 4 }}>
                  {items.map(it => {
                    const price = it.sale_price || it.price
                    const img   = it.image ? `${IMG_BASE_URL}/${it.image}` : null
                    return (
                      <div key={it.product_id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: 58, height: 46, borderRadius: 9, background: 'linear-gradient(135deg,#f8fafc,#f0f4ff)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} onError={e => e.target.style.display = 'none'} /> : <span style={{ fontSize: 20 }}>💻</span>}
                          </div>
                          <span style={{ position: 'absolute', top: -5, right: -5, width: 17, height: 17, borderRadius: '50%', background: '#1a2341', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.quantity}</span>
                        </div>
                        <p style={{ flex: 1, margin: 0, fontSize: 12, fontWeight: 600, color: '#374151', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{it.name}</p>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#111827', flexShrink: 0 }}>{fmt(price * it.quantity)}</span>
                      </div>
                    )
                  })}
                </div>

                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SumRow label="Tạm tính" value={fmt(subtotal)} />
                  <SumRow label="Phí giao hàng" value={shipping === 0 ? <span style={{ color: '#16a34a', fontWeight: 800 }}>🎉 Miễn phí</span> : fmt(shipping)} />
                  {discount > 0 && <SumRow label="Mã giảm giá" value={<span style={{ color: '#16a34a', fontWeight: 700 }}>-{fmt(discount)}</span>} />}
                  <div style={{ borderTop: '2px solid #f3f4f6', paddingTop: 12, marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Tổng cộng</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{fmt(total)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textAlign: 'right' }}>Đã bao gồm VAT</p>
                </div>

                {/* Trust */}
                <div style={{ marginTop: 18, borderTop: '1px solid #f3f4f6', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[['🔒', 'Thanh toán an toàn 100%'], ['📦', 'Đóng gói cẩn thận'], ['🚚', 'Giao hàng toàn quốc 1–3 ngày'], ['↩️', 'Đổi trả miễn phí 15 ngày']].map(([ic, tx]) => (
                    <div key={tx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                      <span>{ic}</span><span>{tx}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}