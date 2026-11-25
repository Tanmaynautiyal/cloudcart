import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PATHS } from './Paths'

// Layouts
import CustomerLayout from '../layouts/customer/CustomerLayout'
import MerchantLayout from '../layouts/merchant/MerchantLayout'
import AdminLayout from '../layouts/admin/AdminLayout'
import AuthLayout from '../layouts/auth/AuthLayout'

// Guards
import ProtectedRoute from './ProtectedRoute'
import GuestRoute from './Guards'

// Customer Pages
import HomePage from '../pages/customer/home/HomePage'
import ShopPage from '../pages/customer/shop/ShopPage'
import ProductDetailPage from '../pages/customer/product-detail/ProductDetailPage'
import CartPage from '../pages/customer/cart/CartPage'
import CheckoutPage from '../pages/customer/checkout/CheckoutPage'
import CustomerOrdersPage from '../pages/customer/orders/CustomerOrdersPage'
import WishlistPage from '../pages/customer/wishlist/WishlistPage'
import CustomerProfilePage from '../pages/customer/profile/CustomerProfilePage'

// Auth Pages
import CustomerLoginPage from '../pages/auth/login/CustomerLoginPage'
import RegisterPage from '../pages/auth/register/RegisterPage'
import AdminLoginPage from '../pages/auth/admin-login/AdminLoginPage'
import MerchantLoginPage from '../pages/auth/merchant-login/MerchantLoginPage'

// Merchant Pages
import MerchantDashboardPage from '../pages/merchant/dashboard/MerchantDashboardPage'
import MerchantProductsPage from '../pages/merchant/products/MerchantProductsPage'
import MerchantPricingPage from '../pages/merchant/pricing/MerchantPricingPage'
import MerchantInventoryPage from '../pages/merchant/inventory/MerchantInventoryPage'
import MerchantOrdersPage from '../pages/merchant/orders/MerchantOrdersPage'
import MerchantLogisticsPage from '../pages/merchant/logistics/MerchantLogisticsPage'
import MerchantProfilePage from '../pages/merchant/profile/MerchantProfilePage'

// Admin Pages
import AdminDashboardPage from '../pages/admin/dashboard/AdminDashboardPage'
import AdminUsersPage from '../pages/admin/users/AdminUsersPage'
import AdminMerchantsPage from '../pages/admin/merchants/AdminMerchantsPage'
import AdminProductsPage from '../pages/admin/products/AdminProductsPage'
import AdminCategoriesPage from '../pages/admin/categories/AdminCategoriesPage'
import AdminOrdersPage from '../pages/admin/orders/AdminOrdersPage'
import AdminAnalyticsPage from '../pages/admin/analytics/AdminAnalyticsPage'
import AdminSettingsPage from '../pages/admin/settings/AdminSettingsPage'

// Special Pages
import MaintenancePage from '../pages/maintenance/MaintenancePage'
import NotFoundPage from '../pages/not-found/NotFoundPage'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Customer Storefront Routes */}
      <Route element={<CustomerLayout />}>
        <Route path={PATHS.HOME} element={<HomePage />} />
        <Route path={PATHS.SHOP} element={<ShopPage />} />
        <Route path={PATHS.PRODUCT_DETAIL} element={<ProductDetailPage />} />
        <Route path={PATHS.CART} element={<CartPage />} />
        <Route path={PATHS.WISHLIST} element={<WishlistPage />} />

        {/* Protected Customer Routes */}
        <Route
          path={PATHS.CHECKOUT}
          element={
            <ProtectedRoute requiredRole="customer">
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.ORDERS}
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.PROFILE}
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 2. Authentication Pages (Guest Guarded) */}
      <Route element={<AuthLayout />}>
        <Route
          path={PATHS.LOGIN}
          element={
            <GuestRoute>
              <CustomerLoginPage />
            </GuestRoute>
          }
        />
        <Route
          path={PATHS.REGISTER}
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path={PATHS.ADMIN_LOGIN}
          element={
            <GuestRoute>
              <AdminLoginPage />
            </GuestRoute>
          }
        />
        <Route
          path={PATHS.MERCHANT_LOGIN}
          element={
            <GuestRoute>
              <MerchantLoginPage />
            </GuestRoute>
          }
        />
      </Route>

      {/* 3. Merchant Self-Service Portal (Merchant Protected) */}
      <Route
        path={PATHS.MERCHANT.ROOT}
        element={
          <ProtectedRoute requiredRole="merchant">
            <MerchantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MerchantDashboardPage />} />
        <Route path="products" element={<MerchantProductsPage />} />
        <Route path="pricing" element={<MerchantPricingPage />} />
        <Route path="inventory" element={<MerchantInventoryPage />} />
        <Route path="orders" element={<MerchantOrdersPage />} />
        <Route path="logistics" element={<MerchantLogisticsPage />} />
        <Route path="profile" element={<MerchantProfilePage />} />
      </Route>

      {/* 4. Administrator Governance Portal (Admin Protected) */}
      <Route
        path={PATHS.ADMIN.ROOT}
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="merchants" element={<AdminMerchantsPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* 5. Maintenance Mode */}
      <Route path={PATHS.MAINTENANCE} element={<MaintenancePage />} />

      {/* 6. 404 Catch-All */}
      <Route path={PATHS.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
