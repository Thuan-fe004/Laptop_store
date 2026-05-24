import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: ''
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim())
      newErrors.name = 'Vui lòng nhập họ và tên'
    else if (form.name.trim().length < 2)
      newErrors.name = 'Họ tên phải có ít nhất 2 ký tự'
    if (!form.email)
      newErrors.email = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Email không đúng định dạng'
    if (!form.password)
      newErrors.password = 'Vui lòng nhập mật khẩu'
    else if (form.password.length < 8)
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    if (!form.confirmPassword)
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        phone:    form.phone.trim(),
      })
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (err) {
      const serverErrors = err.response?.data?.errors
      if (serverErrors) setErrors(serverErrors)
      else toast.error(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name:'name',            type:'text',     label:'Họ và tên',          placeholder:'Nguyễn Văn A',     required:true,  icon:'👤' },
    { name:'email',           type:'email',    label:'Email',              placeholder:'email@example.com', required:true,  icon:'✉️' },
    { name:'phone',           type:'tel',      label:'Số điện thoại',      placeholder:'0912 345 678',      required:false, icon:'📱' },
    { name:'password',        type:'password', label:'Mật khẩu',           placeholder:'Tối thiểu 8 ký tự', required:true,  icon:'🔒' },
    { name:'confirmPassword', type:'password', label:'Xác nhận mật khẩu', placeholder:'Nhập lại mật khẩu', required:true,  icon:'🔐' },
  ]

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        .reg-input:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important;
          outline: none;
          background: #fff !important;
        }
        .reg-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(37,99,235,.45) !important;
        }
        .reg-btn:active:not(:disabled) { transform: translateY(0); }

        @media (max-width: 480px) {
          .reg-card {
            padding: 28px 18px !important;
            border-radius: 16px !important;
            margin: 0 12px;
          }
          .reg-title { font-size: 20px !important; }
        }
        @media (max-width: 360px) {
          .reg-card { padding: 22px 14px !important; }
        }
      `}</style>

      {/* Logo */}
      <div style={{ position:'absolute', top:20, left:'50%', transform:'translateX(-50%)', zIndex:10 }}>
        <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:24 }}>💻</span>
          <span style={{ fontSize:18, fontWeight:900, color:'#1a2341', whiteSpace:'nowrap' }}>
            Laptop<span style={{ color:'#2563eb' }}>Store</span>
          </span>
        </Link>
      </div>

      <div className="reg-card" style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>📝</div>
          <h1 className="reg-title" style={styles.title}>Tạo tài khoản</h1>
          <p style={styles.subtitle}>Tham gia LaptopStore ngay hôm nay</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {fields.map(f => (
            <div key={f.name} style={styles.field}>
              <label style={styles.label}>
                {f.label} {f.required && <span style={{color:'#ef4444'}}>*</span>}
              </label>
              <div style={{ position:'relative' }}>
                <span style={styles.inputIcon}>{f.icon}</span>
                <input
                  className="reg-input"
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  style={{
                    ...styles.input,
                    paddingLeft: 40,
                    ...(errors[f.name] ? styles.inputError : {})
                  }}
                />
              </div>
              {errors[f.name] && <p style={styles.errorText}>⚠️ {errors[f.name]}</p>}
            </div>
          ))}

          {/* Password strength hint */}
          {form.password.length > 0 && form.password.length < 8 && (
            <div style={{ marginTop:-8, padding:'8px 12px', background:'#fef3c7', borderRadius:8, fontSize:12, color:'#92400e' }}>
              💡 Còn {8 - form.password.length} ký tự nữa để đạt độ dài tối thiểu
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="reg-btn"
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          >
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }} />
                Đang tạo tài khoản...
              </span>
            ) : '🚀 Tạo tài khoản'}
          </button>
        </form>

        <p style={styles.switchText}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={styles.link}>Đăng nhập ngay →</Link>
        </p>

        {/* Terms note */}
        <p style={{ textAlign:'center', fontSize:11, color:'#9ca3af', margin:'16px 0 0', lineHeight:1.5 }}>
          Bằng cách đăng ký, bạn đồng ý với{' '}
          <span style={{ color:'#2563eb', cursor:'pointer' }}>Điều khoản dịch vụ</span>
          {' '}và{' '}
          <span style={{ color:'#2563eb', cursor:'pointer' }}>Chính sách bảo mật</span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f0fdf4 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '80px 16px 32px',
    fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
    position: 'relative',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '36px 32px',
    width: '100%', maxWidth: 460,
    boxShadow: '0 20px 60px rgba(0,0,0,.1)',
    animation: 'fadeUp .5s ease',
    border: '1px solid rgba(255,255,255,.8)',
  },
  header:   { textAlign: 'center', marginBottom: 24 },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    background: 'linear-gradient(135deg,#1a2341,#2563eb)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, margin: '0 auto 14px',
  },
  title:    { fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 6px', letterSpacing: -.5 },
  subtitle: { fontSize: 14, color: '#6b7280', margin: 0 },
  form:     { display: 'flex', flexDirection: 'column', gap: 14 },
  field:    { display: 'flex', flexDirection: 'column', gap: 5 },
  label:    { fontSize: 13, fontWeight: 700, color: '#374151' },
  inputIcon: { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15 },
  input: {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #e5e7eb', borderRadius: 10,
    fontSize: 14, background: '#fafafa', color: '#111827',
    transition: 'border-color .2s, box-shadow .2s',
  },
  inputError:  { borderColor: '#ef4444', background: '#fff5f5' },
  errorText:   { fontSize: 12, color: '#ef4444', margin: 0, fontWeight: 600 },
  btn: {
    padding: '13px', background: 'linear-gradient(135deg,#1a2341,#2563eb)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 800, cursor: 'pointer', marginTop: 6,
    width: '100%',
    boxShadow: '0 8px 24px rgba(37,99,235,.3)',
    transition: 'opacity .2s, transform .2s, box-shadow .2s',
  },
  btnDisabled: { background: '#94a3b8', boxShadow: 'none', cursor: 'not-allowed' },
  switchText:  { textAlign: 'center', fontSize: 14, color: '#6b7280', margin: '20px 0 0' },
  link:        { color: '#2563eb', fontWeight: 700, textDecoration: 'none' },
}