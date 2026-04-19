// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, AdminRoute } from './routes/PrivateRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProductsPage      from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage           from './pages/CartPage'
import CheckoutPage       from './pages/CheckoutPage'
import OrdersPage         from './pages/OrdersPage'

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ProductManagement from './pages/admin/ProductManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import CouponManagement from './pages/admin/CouponManagement';
import OrderManagement from './pages/admin/OrderManagement';
import ReviewManagement from './pages/admin/ReviewManagement'
import ReportsPage from './pages/admin/ReportsPage'
import AccountPage from './pages/AccountPage'
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Trang chủ — public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products"       element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/profile" element={<AccountPage />} />
          

          {/* Private routes */}
          <Route path="/cart"     element={<PrivateRoute><CartPage /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="/orders"   element={<PrivateRoute><OrdersPage /></PrivateRoute>} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index             element={<AdminDashboard />} />
            <Route path="users"      element={<UserManagement />} />
            <Route path="products"   element={<ProductManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="coupons"    element={<CouponManagement />} />
            <Route path="orders"     element={<OrderManagement />} />
            <Route path="reviews"    element={<ReviewManagement />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}