import apiClient from './client'
import {
  User,
  Product,
  Category,
  CartItem,
  Order,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  Review,
} from '../types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', credentials)
    return res.data
  },
  register: async (data: RegisterCredentials): Promise<AuthResponse> => {
    const rawRole = (data.role || 'customer').toLowerCase()
    const role = rawRole === 'merchant' || rawRole === 'seller' ? 'MERCHANT' : 'CUSTOMER'
    const payload = {
      ...data,
      name: data.name,
      full_name: data.name,
      role,
      store_name: data.storeName || (data as any).store_name,
      storeName: data.storeName || (data as any).store_name,
      confirm_password: data.confirmPassword || (data as any).confirm_password,
    }
    const res = await apiClient.post('/auth/register', payload)
    return res.data
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me')
    return res.data
  },
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout')
    } catch (e) {
      // Ignore errors on logout
    }
  },
}

export const productsApi = {
  getProducts: async (params?: Record<string, any>): Promise<any> => {
    const res = await apiClient.get('/products/', { params })
    return res.data
  },
  getProductById: async (id: string | number): Promise<Product> => {
    const res = await apiClient.get(`/products/${id}`)
    return res.data
  },
  getProductBySlug: async (slug: string): Promise<Product> => {
    const res = await apiClient.get(`/products/slug/${slug}`)
    return res.data
  },
  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const res = await apiClient.post('/products/', productData)
    return res.data
  },
  updateProduct: async (id: string | number, productData: Partial<Product>): Promise<Product> => {
    const res = await apiClient.put(`/products/${id}`, productData)
    return res.data
  },
  deleteProduct: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/products/${id}`)
  },
  updateStock: async (id: string | number, stock_delta?: number, stock?: number): Promise<Product> => {
    const payload: Record<string, any> = {}
    if (stock_delta !== undefined) payload.stock_delta = stock_delta
    if (stock !== undefined) payload.stock = stock
    const res = await apiClient.patch(`/products/${id}/stock`, payload)
    return res.data
  },
  uploadProductImage: async (file: File, productId?: string | number): Promise<{ image_url: string; filename: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const url = productId ? `/products/${productId}/image` : '/products/upload-image'
    const res = await apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
  uploadMultipleProductImages: async (files: File[]): Promise<{ image_urls: string[]; filenames: string[]; count: number }> => {
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    const res = await apiClient.post('/products/upload-multiple-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}

export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories/')
    return res.data
  },
  createCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    const res = await apiClient.post('/categories/', categoryData)
    return res.data
  },
  updateCategory: async (id: string | number, categoryData: Partial<Category>): Promise<Category> => {
    const res = await apiClient.put(`/categories/${id}`, categoryData)
    return res.data
  },
  deleteCategory: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`)
  },
  uploadCategoryImage: async (file: File): Promise<{ image_url: string; filename: string; message: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post('/categories/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}

export const cartApi = {
  getCart: async (): Promise<any> => {
    const res = await apiClient.get('/cart/')
    return res.data
  },
  addItem: async (productId: number, quantity: number = 1): Promise<any> => {
    const res = await apiClient.post('/cart/items', { product_id: productId, quantity })
    return res.data
  },
  updateItem: async (itemId: number, quantity: number): Promise<any> => {
    const res = await apiClient.put(`/cart/items/${itemId}`, { quantity })
    return res.data
  },
  removeItem: async (itemId: number): Promise<any> => {
    const res = await apiClient.delete(`/cart/items/${itemId}`)
    return res.data
  },
  clearCart: async (): Promise<any> => {
    const res = await apiClient.delete('/cart/clear')
    return res.data
  },
}

export const ordersApi = {
  createOrder: async (orderData: any): Promise<any> => {
    const payload = {
      ...orderData,
      shipping_address: orderData.shipping_address || orderData.shippingAddress || 'Standard Delivery Address',
      shippingAddress: orderData.shipping_address || orderData.shippingAddress || 'Standard Delivery Address',
      payment_method: orderData.payment_method || orderData.paymentMethod || 'Credit Card',
      paymentMethod: orderData.payment_method || orderData.paymentMethod || 'Credit Card',
    }
    const res = await apiClient.post('/orders/', payload)
    return res.data
  },
  getOrders: async (): Promise<any[]> => {
    const res = await apiClient.get('/orders/')
    return res.data
  },
  getOrderById: async (id: string | number): Promise<any> => {
    const res = await apiClient.get(`/orders/${id}`)
    return res.data
  },
  getAllOrdersAdmin: async (): Promise<any[]> => {
    const res = await apiClient.get('/orders/admin/all')
    return res.data
  },
  updateOrderStatus: async (id: string | number, status: string): Promise<any> => {
    const res = await apiClient.put(`/orders/${id}/status`, { status })
    return res.data
  },
  updateOrderTracking: async (id: string | number, tracking_number: string): Promise<any> => {
    const res = await apiClient.patch(`/orders/${id}/tracking`, { tracking_number })
    return res.data
  },
  getMerchantOrders: async (): Promise<any[]> => {
    const res = await apiClient.get('/orders/merchant/my-orders')
    return res.data
  },
}

export const paymentsApi = {
  processPayment: async (data: { order_id: number; payment_method: string }): Promise<any> => {
    const res = await apiClient.post('/payments/process', data)
    return res.data
  },
  getOrderPayments: async (orderId: number): Promise<any[]> => {
    const res = await apiClient.get(`/payments/order/${orderId}`)
    return res.data
  },
  getAllPaymentsAdmin: async (): Promise<any[]> => {
    const res = await apiClient.get('/payments/admin/all')
    return res.data
  },
}

export const usersApi = {
  getProfile: async (): Promise<User> => {
    const res = await apiClient.get('/users/profile')
    return res.data
  },
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const res = await apiClient.put('/users/profile', data)
    return res.data
  },
  getAllUsers: async (): Promise<User[]> => {
    const res = await apiClient.get('/users/')
    return res.data
  },
  updateUser: async (id: string | number, data: Partial<User>): Promise<User> => {
    const res = await apiClient.put(`/users/${id}`, data)
    return res.data
  },
  deleteUser: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },
  getUserActivity: async (id: string | number): Promise<any> => {
    const res = await apiClient.get(`/users/${id}/activity`)
    return res.data
  },
}

export const wishlistApi = {
  getWishlist: async (): Promise<any[]> => {
    const res = await apiClient.get('/wishlist/')
    return res.data
  },
  addToWishlist: async (productId: number): Promise<any> => {
    const res = await apiClient.post('/wishlist/', { product_id: productId })
    return res.data
  },
  removeFromWishlist: async (productId: number): Promise<any> => {
    const res = await apiClient.delete(`/wishlist/${productId}`)
    return res.data
  },
}

export const reviewsApi = {
  getProductReviews: async (productId: number): Promise<Review[]> => {
    const res = await apiClient.get(`/reviews/product/${productId}`)
    return res.data
  },
  createReview: async (reviewData: { product_id: number; rating: number; title?: string; comment: string }): Promise<Review> => {
    const res = await apiClient.post('/reviews/', reviewData)
    return res.data
  },
  deleteReview: async (reviewId: number): Promise<void> => {
    await apiClient.delete(`/reviews/${reviewId}`)
  },
}
