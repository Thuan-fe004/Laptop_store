// src/services/api.js
import axios from 'axios';

// ====================== CẤU HÌNH API URL ======================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
console.log('🔥 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,        // ← Đã thay đổi ở đây
  headers: { 
    'Content-Type': 'application/json' 
  },
  timeout: 10000,
});

// Tự động gắn JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý lỗi 401 (token hết hạn)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ====================== ADMIN APIs ======================
// (Phần còn lại giữ nguyên, mình không thay đổi)

export const adminDashboardAPI = {
  getStats:        () => api.get('/admin/dashboard/stats'),
  getRevenueChart: () => api.get('/admin/dashboard/revenue-chart'),
  getTopProducts:  () => api.get('/admin/dashboard/top-products'),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),
};

export const adminUserAPI = {
  getAll:       (params = {}) => api.get('/admin/users', { params }),
  getById:      (id)          => api.get(`/admin/users/${id}`),
  update:       (id, data)    => api.put(`/admin/users/${id}`, data),
  toggleStatus: (id)          => api.put(`/admin/users/${id}/status`),
  delete:       (id)          => api.delete(`/admin/users/${id}`),
  export:       ()            => api.get('/admin/users/export'),
};

export const adminProductAPI = {
  getAll:       (params = {}) => api.get('/admin/products', { params }),
  getById:      (id)          => api.get(`/admin/products/${id}`),
  create:       (data)        => api.post('/admin/products', data),
  update:       (id, data)    => api.put(`/admin/products/${id}`, data),
  toggleStatus: (id)          => api.put(`/admin/products/${id}/status`),
  updateStock:  (id, quantity)=> api.put(`/admin/products/${id}/stock`, { quantity }),
  delete:       (id)          => api.delete(`/admin/products/${id}`),

  uploadImage:  (productId, formData) => 
    api.post(`/admin/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  deleteImage:  (imageId) => api.delete(`/admin/products/images/${imageId}`),

  getCategories: () => api.get('/admin/categories-dropdown'),
  getBrands:     () => api.get('/admin/brands'),
};

export const adminCategoryAPI = {
  getAll:       (params = {}) => api.get('/admin/categories', { params }),
  getById:      (id)          => api.get(`/admin/categories/${id}`),
  create:       (data)        => api.post('/admin/categories', data),
  update:       (id, data)    => api.put(`/admin/categories/${id}`, data),
  toggleStatus: (id)          => api.put(`/admin/categories/${id}/status`),
  delete:       (id)          => api.delete(`/admin/categories/${id}`),
};

export const adminCouponAPI = {
  getAll:       (params)   => api.get('/admin/coupons', { params }),
  getById:      (id)       => api.get(`/admin/coupons/${id}`),
  create:       (data)     => api.post('/admin/coupons', data),
  update:       (id, data) => api.put(`/admin/coupons/${id}`, data),
  toggleStatus: (id)       => api.put(`/admin/coupons/${id}/status`),
  delete:       (id)       => api.delete(`/admin/coupons/${id}`),
  getStats:     ()         => api.get('/admin/coupons/stats'),
};

export const adminOrderAPI = {
  getAll:        (params = {}) => api.get('/admin/orders', { params }),
  getById:       (id)          => api.get(`/admin/orders/${id}`),
  updateStatus:  (id, data)    => api.put(`/admin/orders/${id}/status`, data),
  updatePayment: (id, data)    => api.put(`/admin/orders/${id}/payment`, data),
  getStats:      ()            => api.get('/admin/orders/stats'),
};

export const adminReviewAPI = {
  getAll:       (params = {}) => api.get('/admin/reviews', { params }),
  toggleStatus: (id)          => api.put(`/admin/reviews/${id}/status`),
  delete:       (id)          => api.delete(`/reviews/${id}`),
};

// ====================== USER APIs ======================
export const cartAPI = {
  getAll:    ()               => api.get('/cart'),
  add:       (data)           => api.post('/cart', data),
  update:    (productId, qty) => api.put(`/cart/${productId}`, { quantity: qty }),
  remove:    (productId)      => api.delete(`/cart/${productId}`),
  clear:     ()               => api.delete('/cart'),
};

export const orderAPI = {
  getAll:  (params = {}) => api.get('/orders', { params }),
  getById: (id)          => api.get(`/orders/${id}`),
  place:   (data)        => api.post('/orders', data),
  cancel:  (id, reason = 'Khách hủy') =>
    api.put(`/orders/${id}/cancel`, { reason }),
};

export const couponAPI = {
  validate: (code, order_total) => api.post('/coupons/validate', { code, order_total }),
};