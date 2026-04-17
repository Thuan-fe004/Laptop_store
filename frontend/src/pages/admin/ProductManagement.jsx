import { useState, useEffect, useCallback } from 'react'
import { adminProductAPI } from '../../services/api'
import { IMG_BASE_URL } from '../../constants/config';
// ─── Helpers ──────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

// ─── Toast ────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b' }
  return (
    <div style={{
      position:'fixed', top:24, right:24, zIndex:9999,
      background:'#fff', borderRadius:12, padding:'14px 20px',
      boxShadow:'0 8px 32px rgba(0,0,0,.15)',
      borderLeft:`4px solid ${colors[type]||'#2563eb'}`,
      display:'flex', alignItems:'center', gap:12, maxWidth:380,
      animation:'slideIn .3s ease',
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <span style={{fontSize:18}}>{type==='success'?'✅':type==='error'?'❌':'⚠️'}</span>
      <span style={{fontSize:14,color:'#374151',fontWeight:500,flex:1}}>{message}</span>
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:18}}>×</button>
    </div>
  )
}

// ─── Stock Modal ──────────────────────────────────────
function StockModal({ product, onClose, onSaved }) {
  const [qty, setQty] = useState(product.quantity)
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    if (isNaN(qty) || qty < 0) return
    setSaving(true)
    try {
      await adminProductAPI.updateStock(product.id, qty)
      onSaved()
    } finally { setSaving(false) }
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:20,padding:32,width:360,boxShadow:'0 20px 60px rgba(0,0,0,.25)'}} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:'0 0 8px',fontSize:17,fontWeight:800,color:'#111827'}}>📦 Cập nhật tồn kho</h3>
        <p style={{margin:'0 0 20px',fontSize:14,color:'#6b7280'}}>{product.name}</p>
        <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>Số lượng tồn kho</label>
        <input type="number" min="0" value={qty} onChange={e=>setQty(Number(e.target.value))}
          style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e5e7eb',fontSize:15,fontWeight:700,boxSizing:'border-box',outline:'none'}} />
        <div style={{display:'flex',gap:12,marginTop:20}}>
          <button onClick={onClose} style={{flex:1,padding:'10px 0',borderRadius:10,border:'1.5px solid #e5e7eb',background:'#fff',fontWeight:600,cursor:'pointer'}}>Huỷ</button>
          <button onClick={handleSave} disabled={saving} style={{flex:1,padding:'10px 0',borderRadius:10,border:'none',background:saving?'#93c5fd':'#2563eb',color:'#fff',fontWeight:700,cursor:saving?'not-allowed':'pointer'}}>
            {saving?'Đang lưu...':'💾 Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Product Form Modal (Thêm / Sửa) ─────────────────
function ProductFormModal({ product, categories, brands, onClose, onSaved }) {
  const isEdit = !!product
  const [activeTab, setActiveTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [images, setImages] = useState(product?.images || [])
  const [uploadingImg, setUploadingImg] = useState(false)

  const [form, setForm] = useState({
    name:         product?.name         || '',
    category_id:  product?.category_id  || '',
    brand_id:     product?.brand_id     || '',
    price:        product?.price        || '',
    sale_price:   product?.sale_price   || '',
    quantity:     product?.quantity     ?? 0,
    short_desc:   product?.short_desc   || '',
    description:  product?.description  || '',
    status:       product?.status       ?? 1,
    is_featured:  product?.is_featured  ?? 0,
    is_bestseller:product?.is_bestseller?? 0,
  })

  const [specs, setSpecs] = useState({
    cpu:'', cpu_speed:'', ram:'', ram_slots:'', storage:'', storage_slots:'',
    display:'', resolution:'', gpu:'', battery:'', os:'', ports:'',
    wifi:'', bluetooth:'', weight:'', dimensions:'', color:'', warranty:'',
    ...(product?.specs || {})
  })

  const setF  = (k,v) => setForm(p=>({...p,[k]:v}))
  const setSp = (k,v) => setSpecs(p=>({...p,[k]:v}))

  const validate = () => {
    const e = {}
    if (!form.name.trim())   e.name = 'Tên sản phẩm không được để trống'
    if (!form.category_id)   e.category_id = 'Chọn danh mục'
    if (!form.brand_id)      e.brand_id    = 'Chọn thương hiệu'
    if (!form.price || form.price <= 0) e.price = 'Giá phải lớn hơn 0'
    if (form.quantity < 0)   e.quantity = 'Số lượng không được âm'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) { setActiveTab('basic'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        price:      Number(form.price),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        quantity:   Number(form.quantity),
        specs,
      }
      if (isEdit) {
        await adminProductAPI.update(product.id, payload)
      } else {
        await adminProductAPI.create(payload)
      }
      onSaved()
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Lỗi lưu sản phẩm' })
    } finally { setSaving(false) }
  }

  const handleUploadImage = async (e) => {
    const file = e.target.files[0]
    if (!file || !product?.id) return
    setUploadingImg(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('is_primary', images.length === 0 ? 1 : 0)
      const res = await adminProductAPI.uploadImage(product.id, fd)
      setImages(p => [...p, res.data.data])
    } finally { setUploadingImg(false); e.target.value = '' }
  }

  const handleDeleteImage = async (imageId) => {
    await adminProductAPI.deleteImage(imageId)
    setImages(p => p.filter(i => i.id !== imageId))
  }

  // Shared input style
  const inp = (err) => ({
    width:'100%', padding:'9px 12px', borderRadius:9, fontSize:14, boxSizing:'border-box',
    border: err ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb', outline:'none', fontFamily:'inherit',
  })

  const Field = ({ label, required, error, children }) => (
    <div>
      <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:600,color:'#374151'}}>
        {label}{required && <span style={{color:'#ef4444'}}> *</span>}
      </label>
      {children}
      {error && <p style={{margin:'4px 0 0',fontSize:12,color:'#ef4444'}}>{error}</p>}
    </div>
  )

  const TABS = [
    { id:'basic',  label:'📋 Thông tin cơ bản' },
    { id:'specs',  label:'⚙️ Thông số kỹ thuật' },
    { id:'images', label:`🖼️ Hình ảnh ${isEdit ? `(${images.length})` : ''}` },
  ]

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:20,width:'100%',maxWidth:780,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(0,0,0,.3)'}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:'24px 28px 0',borderBottom:'1px solid #f3f4f6'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h2 style={{margin:0,fontSize:19,fontWeight:800,color:'#111827'}}>
              {isEdit ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm mới'}
            </h2>
            <button onClick={onClose} style={{background:'#f3f4f6',border:'none',borderRadius:8,width:36,height:36,cursor:'pointer',fontSize:18}}>×</button>
          </div>
          {/* Tabs */}
          <div style={{display:'flex',gap:4}}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{
                padding:'9px 18px',borderRadius:'8px 8px 0 0',border:'none',cursor:'pointer',
                fontSize:13,fontWeight:600,
                background: activeTab===tab.id ? '#fff' : 'transparent',
                color: activeTab===tab.id ? '#2563eb' : '#6b7280',
                borderBottom: activeTab===tab.id ? '2px solid #2563eb' : '2px solid transparent',
              }}>{tab.label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'24px 28px'}}>
          {errors.general && (
            <div style={{background:'#fee2e2',padding:'10px 14px',borderRadius:10,marginBottom:16,fontSize:13,color:'#ef4444'}}>
              ❌ {errors.general}
            </div>
          )}

          {/* ── Tab: Thông tin cơ bản ── */}
          {activeTab==='basic' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <Field label="Tên sản phẩm" required error={errors.name}>
                <input value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="VD: ASUS ROG Strix G16 2024" style={inp(errors.name)} />
              </Field>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <Field label="Danh mục" required error={errors.category_id}>
                  <select value={form.category_id} onChange={e=>setF('category_id',e.target.value)} style={inp(errors.category_id)}>
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Thương hiệu" required error={errors.brand_id}>
                  <select value={form.brand_id} onChange={e=>setF('brand_id',e.target.value)} style={inp(errors.brand_id)}>
                    <option value="">-- Chọn thương hiệu --</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                <Field label="Giá gốc (đ)" required error={errors.price}>
                  <input type="number" min="0" value={form.price} onChange={e=>setF('price',e.target.value)} placeholder="28990000" style={inp(errors.price)} />
                </Field>
                <Field label="Giá khuyến mãi (đ)">
                  <input type="number" min="0" value={form.sale_price} onChange={e=>setF('sale_price',e.target.value)} placeholder="Để trống nếu không KM" style={inp(false)} />
                </Field>
                <Field label="Tồn kho" required error={errors.quantity}>
                  <input type="number" min="0" value={form.quantity} onChange={e=>setF('quantity',e.target.value)} style={inp(errors.quantity)} />
                </Field>
              </div>

              <Field label="Mô tả ngắn">
                <textarea value={form.short_desc} onChange={e=>setF('short_desc',e.target.value)} rows={2}
                  placeholder="Mô tả tóm tắt hiển thị trong danh sách..." style={{...inp(false),resize:'vertical'}} />
              </Field>

              <Field label="Mô tả chi tiết">
                <textarea value={form.description} onChange={e=>setF('description',e.target.value)} rows={4}
                  placeholder="Mô tả đầy đủ sản phẩm..." style={{...inp(false),resize:'vertical'}} />
              </Field>

              {/* Flags */}
              <div style={{display:'flex',gap:24}}>
                {[
                  ['status', 'Hiển thị (Active)'],
                  ['is_featured', 'Nổi bật'],
                  ['is_bestseller', 'Bán chạy'],
                ].map(([key, label]) => (
                  <label key={key} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:14,fontWeight:500,color:'#374151'}}>
                    <input type="checkbox" checked={!!form[key]} onChange={e=>setF(key, e.target.checked ? 1 : 0)}
                      style={{width:16,height:16,accentColor:'#2563eb'}} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: Thông số kỹ thuật ── */}
          {activeTab==='specs' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {[
                  ['cpu','CPU', 'Intel Core i7-13650HX'],
                  ['cpu_speed','Tốc độ CPU','2.6 GHz, Turbo 4.9 GHz'],
                  ['ram','RAM','16GB DDR5 4800MHz'],
                  ['ram_slots','Khe RAM','2 khe, tối đa 32GB'],
                  ['storage','Ổ cứng','512GB SSD NVMe PCIe 4.0'],
                  ['storage_slots','Khe lưu trữ','1 khe M.2 trống'],
                  ['display','Màn hình','16 inch IPS 165Hz'],
                  ['resolution','Độ phân giải','1920 x 1200 (WUXGA)'],
                  ['gpu','Card đồ họa','NVIDIA GeForce RTX 4060 8GB'],
                  ['battery','Pin','90Wh, sạc 240W'],
                  ['os','Hệ điều hành','Windows 11 Home'],
                  ['wifi','WiFi','WiFi 6E (802.11ax)'],
                  ['bluetooth','Bluetooth','Bluetooth 5.3'],
                  ['dimensions','Kích thước','355 x 259.5 x 22.6 mm'],
                  ['color','Màu sắc','Eclipse Gray'],
                  ['warranty','Bảo hành','24 tháng'],
                ].map(([key, label, placeholder]) => (
                  <div key={key}>
                    <label style={{display:'block',marginBottom:5,fontSize:12,fontWeight:600,color:'#6b7280'}}>{label}</label>
                    <input value={specs[key]||''} onChange={e=>setSp(key,e.target.value)} placeholder={placeholder}
                      style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1.5px solid #e5e7eb',fontSize:13,boxSizing:'border-box',outline:'none'}} />
                  </div>
                ))}
                <div>
                  <label style={{display:'block',marginBottom:5,fontSize:12,fontWeight:600,color:'#6b7280'}}>Khối lượng (kg)</label>
                  <input type="number" step="0.01" value={specs.weight||''} onChange={e=>setSp('weight',e.target.value)} placeholder="2.30"
                    style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1.5px solid #e5e7eb',fontSize:13,boxSizing:'border-box',outline:'none'}} />
                </div>
              </div>
              <div>
                <label style={{display:'block',marginBottom:5,fontSize:12,fontWeight:600,color:'#6b7280'}}>Cổng kết nối</label>
                <textarea value={specs.ports||''} onChange={e=>setSp('ports',e.target.value)} rows={2}
                  placeholder="1x USB-A 3.2, 2x USB-C, 1x HDMI 2.1..."
                  style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1.5px solid #e5e7eb',fontSize:13,boxSizing:'border-box',resize:'vertical',outline:'none',fontFamily:'inherit'}} />
              </div>
            </div>
          )}

          {/* ── Tab: Hình ảnh ── */}
          {activeTab==='images' && (
            <div>
              {!isEdit && (
                <div style={{background:'#fef3c7',border:'1px solid #fbbf24',borderRadius:10,padding:'12px 16px',marginBottom:16,fontSize:13,color:'#92400e'}}>
                  💡 Lưu sản phẩm trước, sau đó quay lại để upload ảnh.
                </div>
              )}
              {isEdit && (
                <>
                  {/* Upload zone */}
                  <label style={{
                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                    padding:'32px',border:'2px dashed #d1d5db',borderRadius:12,cursor:'pointer',
                    background: uploadingImg ? '#f8fafc' : '#fafafa',marginBottom:20,
                    transition:'border-color .2s',
                  }}>
                    <input type="file" accept="image/*" onChange={handleUploadImage} style={{display:'none'}} disabled={uploadingImg} />
                    <span style={{fontSize:32,marginBottom:8}}>{uploadingImg ? '⏳' : '📷'}</span>
                    <span style={{fontSize:14,fontWeight:600,color:'#374151'}}>{uploadingImg ? 'Đang upload...' : 'Nhấn để chọn ảnh'}</span>
                    <span style={{fontSize:12,color:'#9ca3af',marginTop:4}}>PNG, JPG, JPEG, WEBP — tối đa 16MB</span>
                  </label>

                  {/* Image grid */}
                  {images.length === 0 ? (
                    <p style={{textAlign:'center',color:'#9ca3af',padding:'20px 0'}}>Chưa có ảnh nào</p>
                  ) : (
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                      {images.map(img => (
                        <div key={img.id} style={{position:'relative',borderRadius:12,overflow:'hidden',border:'1.5px solid #e5e7eb'}}>
                          <img src={`${IMG_BASE_URL}/${img.image_url}`}
                            alt={img.image_name}
                            style={{width:'100%',height:140,objectFit:'cover',display:'block'}}
                            onError={e => { e.target.src = 'https://via.placeholder.com/200x140?text=No+Image' }}
                          />
                          <div style={{padding:'8px 10px',background:'#fff'}}>
                            {img.is_primary === 1 && (
                              <span style={{fontSize:11,fontWeight:700,color:'#059669',background:'#d1fae5',padding:'2px 8px',borderRadius:20}}>
                                ⭐ Ảnh chính
                              </span>
                            )}
                          </div>
                          <button onClick={()=>handleDeleteImage(img.id)} style={{
                            position:'absolute',top:8,right:8,
                            background:'rgba(239,68,68,.9)',color:'#fff',
                            border:'none',borderRadius:8,width:30,height:30,
                            cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',
                          }}>🗑</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'16px 28px',borderTop:'1px solid #f3f4f6',display:'flex',justifyContent:'flex-end',gap:12}}>
          <button onClick={onClose} style={{padding:'10px 24px',borderRadius:10,border:'1.5px solid #e5e7eb',background:'#fff',fontWeight:600,cursor:'pointer',fontSize:14}}>
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding:'10px 28px',borderRadius:10,border:'none',
            background: saving ? '#93c5fd' : '#2563eb',
            color:'#fff',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontSize:14,
          }}>
            {saving ? 'Đang lưu...' : isEdit ? '💾 Cập nhật' : '➕ Thêm sản phẩm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm Delete Modal ─────────────────────────────
function ConfirmDeleteModal({ product, onClose, onConfirm, loading }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
      <div style={{background:'#fff',borderRadius:16,padding:28,maxWidth:380,width:'90%',textAlign:'center'}}>
        <p style={{fontSize:40,margin:'0 0 12px'}}>🗑️</p>
        <h3 style={{margin:'0 0 8px',color:'#111827'}}>Xác nhận xoá?</h3>
        <p style={{color:'#6b7280',fontSize:14,marginBottom:4}}><strong>{product?.name}</strong></p>
        <p style={{color:'#9ca3af',fontSize:13,marginBottom:24}}>Hành động này không thể hoàn tác.</p>
        <div style={{display:'flex',gap:12}}>
          <button onClick={onClose} style={{flex:1,padding:10,border:'1.5px solid #e5e7eb',borderRadius:10,background:'#fff',cursor:'pointer',fontWeight:600}}>Huỷ</button>
          <button onClick={onConfirm} disabled={loading} style={{flex:1,padding:10,border:'none',borderRadius:10,background:'#ef4444',color:'#fff',cursor:'pointer',fontWeight:700}}>
            {loading ? 'Đang xoá...' : 'Xoá'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════
export default function ProductManagement() {
  const [products,   setProducts]   = useState([])
  const [pagination, setPagination] = useState({ page:1, pages:1, total:0, per_page:10 })
  const [categories, setCategories] = useState([])
  const [brands,     setBrands]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [toast,      setToast]      = useState(null)

  // Filters
  const [search,      setSearch]      = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [catFilter,   setCatFilter]   = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [statusFilter,setStatusFilter]= useState('')

  // Modals
  const [formModal,    setFormModal]    = useState(null) // null | 'add' | product object
  const [stockModal,   setStockModal]   = useState(null)
  const [deleteModal,  setDeleteModal]  = useState(null)
  const [actionLoading,setActionLoading]= useState({})

  const showToast = (message, type = 'success') => setToast({ message, type })

  // Load dropdowns
  useEffect(() => {
    Promise.all([adminProductAPI.getCategories(), adminProductAPI.getBrands()])
      .then(([c, b]) => { setCategories(c.data.data); setBrands(b.data.data) })
      .catch(() => {})
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminProductAPI.getAll({
        page, per_page: 10,
        search,
        category_id: catFilter,
        brand_id:    brandFilter,
        status:      statusFilter,
      })
      setProducts(res.data.data)
      setPagination(res.data.pagination)
    } catch {
      showToast('Không thể tải danh sách sản phẩm', 'error')
    } finally { setLoading(false) }
  }, [search, catFilter, brandFilter, statusFilter])

  useEffect(() => { fetchProducts(1) }, [fetchProducts])

  const handleToggleStatus = async (product) => {
    setActionLoading(p => ({...p, [product.id]: 'status'}))
    try {
      const res = await adminProductAPI.toggleStatus(product.id)
      showToast(res.data.message)
      fetchProducts(pagination.page)
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác thất bại', 'error')
    } finally { setActionLoading(p => ({...p, [product.id]: null})) }
  }

  const handleDelete = async () => {
    setActionLoading(p => ({...p, [deleteModal.id]: 'delete'}))
    try {
      await adminProductAPI.delete(deleteModal.id)
      showToast('Đã xoá sản phẩm thành công')
      setDeleteModal(null)
      fetchProducts(pagination.page)
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể xoá', 'error')
      setDeleteModal(null)
    } finally { setActionLoading(p => ({...p, [deleteModal?.id]: null})) }
  }

  const handleOpenEdit = async (product) => {
    try {
      const res = await adminProductAPI.getById(product.id)
      setFormModal(res.data.data)
    } catch { showToast('Không thể tải thông tin sản phẩm', 'error') }
  }

  const filterBtnStyle = (active, color = '#2563eb') => ({
    padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer',
    fontSize:13, fontWeight:600,
    background: active ? color : '#f3f4f6',
    color: active ? '#fff' : '#6b7280',
    transition:'all .15s',
  })

  const STOCK_COLOR = (qty) => qty === 0 ? '#ef4444' : qty <= 5 ? '#f59e0b' : '#10b981'

  return (
    <div style={{padding:'28px 32px',background:'#f8fafc',minHeight:'100vh',fontFamily:"'Be Vietnam Pro',sans-serif"}}>
      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}

      {formModal !== null && (
        <ProductFormModal
          product={formModal === 'add' ? null : formModal}
          categories={categories} brands={brands}
          onClose={()=>setFormModal(null)}
          onSaved={()=>{
            setFormModal(null)
            showToast(formModal==='add' ? 'Thêm sản phẩm thành công' : 'Cập nhật thành công')
            fetchProducts(pagination.page)
          }}
        />
      )}

      {stockModal && (
        <StockModal product={stockModal} onClose={()=>setStockModal(null)}
          onSaved={()=>{
            setStockModal(null)
            showToast('Đã cập nhật tồn kho')
            fetchProducts(pagination.page)
          }} />
      )}

      {deleteModal && (
        <ConfirmDeleteModal
          product={deleteModal}
          onClose={()=>setDeleteModal(null)}
          onConfirm={handleDelete}
          loading={actionLoading[deleteModal.id]==='delete'}
        />
      )}

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:'#111827'}}>💻 Quản lý sản phẩm</h1>
          <p style={{margin:'4px 0 0',color:'#6b7280',fontSize:14}}>
            Tổng cộng <strong style={{color:'#2563eb'}}>{pagination.total}</strong> sản phẩm
          </p>
        </div>
        <button onClick={()=>setFormModal('add')} style={{
          padding:'11px 22px',borderRadius:10,border:'none',
          background:'#2563eb',color:'#fff',fontWeight:700,
          cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',gap:8,
        }}>➕ Thêm sản phẩm</button>
      </div>

      {/* Filters */}
      <div style={{background:'#fff',borderRadius:16,padding:'18px 24px',boxShadow:'0 1px 3px rgba(0,0,0,.08)',marginBottom:24}}>
        <div style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'center'}}>
          {/* Search */}
          <div style={{flex:1,minWidth:220,position:'relative'}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}>🔍</span>
            <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              style={{width:'100%',padding:'9px 12px 9px 36px',borderRadius:10,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',boxSizing:'border-box'}} />
          </div>

          {/* Category */}
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
            style={{padding:'9px 12px',borderRadius:10,border:'1.5px solid #e5e7eb',fontSize:13,color:'#374151',outline:'none',minWidth:150}}>
            <option value="">🏷️ Tất cả danh mục</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Brand */}
          <select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)}
            style={{padding:'9px 12px',borderRadius:10,border:'1.5px solid #e5e7eb',fontSize:13,color:'#374151',outline:'none',minWidth:140}}>
            <option value="">🏭 Tất cả hãng</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Status */}
          <div style={{display:'flex',gap:6}}>
            {[['','Tất cả'],['1','✅ Hiện'],['0','🙈 Ẩn']].map(([v,l]) => (
              <button key={v} onClick={()=>setStatusFilter(v)}
                style={filterBtnStyle(statusFilter===v, v==='0'?'#6b7280':'#2563eb')}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{background:'#fff',borderRadius:16,boxShadow:'0 1px 3px rgba(0,0,0,.08)',overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:60,textAlign:'center'}}>
            <div style={{width:36,height:36,border:'4px solid #e5e7eb',borderTopColor:'#2563eb',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f8fafc'}}>
                  {['Sản phẩm','Danh mục / Hãng','Giá','Tồn kho','Đánh giá','Trạng thái','Thao tác'].map(h=>(
                    <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:12,fontWeight:700,color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length===0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center',padding:'60px 0',color:'#9ca3af'}}>Không tìm thấy sản phẩm nào</td></tr>
                ) : products.map((p,i)=>(
                  <tr key={p.id} style={{borderTop:'1px solid #f3f4f6',background:i%2===0?'#fff':'#fafafa',transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#eff6ff'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#fafafa'}
                  >
                    {/* Product info */}
                    <td style={{padding:'12px 16px',maxWidth:280}}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <img
                          src={p.primary_image ? `${IMG_BASE_URL}/${p.primary_image}` : 'https://via.placeholder.com/48?text=No'}
                          alt={p.name}
                          style={{width:48,height:48,borderRadius:8,objectFit:'cover',flexShrink:0,border:'1px solid #e5e7eb'}}
                          onError={e=>{e.target.src='https://via.placeholder.com/48?text=?'}}
                        />
                        <div>
                          <p style={{margin:0,fontSize:13,fontWeight:700,color:'#111827',lineHeight:1.3,
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200}}>
                            {p.name}
                          </p>
                          <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap'}}>
                            {p.is_featured===1 && <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fef3c7',color:'#d97706',fontWeight:700}}>⭐ Nổi bật</span>}
                            {p.is_bestseller===1 && <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#dbeafe',color:'#2563eb',fontWeight:700}}>🔥 Bán chạy</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category / Brand */}
                    <td style={{padding:'12px 16px'}}>
                      <p style={{margin:0,fontSize:13,color:'#374151',fontWeight:500}}>{p.category_name}</p>
                      <p style={{margin:'2px 0 0',fontSize:12,color:'#9ca3af'}}>{p.brand_name}</p>
                    </td>

                    {/* Price */}
                    <td style={{padding:'12px 16px'}}>
                      {p.sale_price ? (
                        <>
                          <p style={{margin:0,fontSize:13,fontWeight:700,color:'#ef4444'}}>{fmt(p.sale_price)}</p>
                          <p style={{margin:0,fontSize:11,color:'#9ca3af',textDecoration:'line-through'}}>{fmt(p.price)}</p>
                        </>
                      ) : (
                        <p style={{margin:0,fontSize:13,fontWeight:700,color:'#111827'}}>{fmt(p.price)}</p>
                      )}
                    </td>

                    {/* Stock */}
                    <td style={{padding:'12px 16px'}}>
                      <button onClick={()=>setStockModal(p)} style={{
                        display:'flex',alignItems:'center',gap:6,padding:'4px 10px',
                        borderRadius:20,border:'none',cursor:'pointer',
                        background: STOCK_COLOR(p.quantity)+'20',
                        color: STOCK_COLOR(p.quantity),fontWeight:700,fontSize:13,
                      }}>
                        <span style={{width:7,height:7,borderRadius:'50%',background:STOCK_COLOR(p.quantity),display:'inline-block'}} />
                        {p.quantity} {p.quantity===0?'(Hết)':p.quantity<=5?'(Sắp hết)':''}
                        <span style={{fontSize:10,opacity:.7}}>✏️</span>
                      </button>
                    </td>

                    {/* Rating */}
                    <td style={{padding:'12px 16px',fontSize:13}}>
                      <span style={{color:'#f59e0b',fontWeight:700}}>★ {p.avg_rating.toFixed(1)}</span>
                      <span style={{color:'#9ca3af',fontSize:12}}> ({p.review_count})</span>
                    </td>

                    {/* Status toggle */}
                    <td style={{padding:'12px 16px'}}>
                      <button onClick={()=>handleToggleStatus(p)}
                        disabled={actionLoading[p.id]==='status'}
                        style={{
                          padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',
                          fontSize:12,fontWeight:700,
                          background: p.status===1?'#d1fae5':'#f3f4f6',
                          color: p.status===1?'#059669':'#6b7280',
                        }}>
                        {actionLoading[p.id]==='status'?'...': p.status===1?'✅ Hiện':'🙈 Ẩn'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{padding:'12px 16px'}}>
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={()=>handleOpenEdit(p)} title="Sửa" style={{width:32,height:32,borderRadius:8,border:'none',background:'#fef3c7',color:'#d97706',cursor:'pointer',fontSize:14}}>✏️</button>
                        <button onClick={()=>setDeleteModal(p)} title="Xoá" style={{width:32,height:32,borderRadius:8,border:'none',background:'#fee2e2',color:'#ef4444',cursor:'pointer',fontSize:14}}>🗑</button>
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
          <div style={{padding:'16px 24px',borderTop:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <p style={{margin:0,fontSize:13,color:'#6b7280'}}>
              Hiển thị {Math.min((pagination.page-1)*pagination.per_page+1, pagination.total)}–{Math.min(pagination.page*pagination.per_page, pagination.total)} / {pagination.total}
            </p>
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>fetchProducts(pagination.page-1)} disabled={pagination.page===1}
                style={{padding:'6px 14px',borderRadius:8,border:'1.5px solid #e5e7eb',background:'#fff',cursor:pagination.page===1?'not-allowed':'pointer',color:pagination.page===1?'#d1d5db':'#374151',fontWeight:600,fontSize:13}}>← Trước</button>
              {Array.from({length:Math.min(5,pagination.pages)},(_,i)=>{
                let p=i+1; if(pagination.pages>5&&pagination.page>3) p=pagination.page-2+i; if(p>pagination.pages) return null
                return <button key={p} onClick={()=>fetchProducts(p)} style={{width:36,height:36,borderRadius:8,border:'none',background:p===pagination.page?'#2563eb':'#f3f4f6',color:p===pagination.page?'#fff':'#374151',fontWeight:700,cursor:'pointer',fontSize:13}}>{p}</button>
              })}
              <button onClick={()=>fetchProducts(pagination.page+1)} disabled={pagination.page===pagination.pages}
                style={{padding:'6px 14px',borderRadius:8,border:'1.5px solid #e5e7eb',background:'#fff',cursor:pagination.page===pagination.pages?'not-allowed':'pointer',color:pagination.page===pagination.pages?'#d1d5db':'#374151',fontWeight:600,fontSize:13}}>Sau →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}