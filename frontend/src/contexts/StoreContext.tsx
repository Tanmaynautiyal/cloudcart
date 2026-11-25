import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Product, Category, Order, User, OrderStatus } from '../types'
import { productsApi, categoriesApi, ordersApi, usersApi, wishlistApi } from '../api/baseApi'
import { useToast } from '../components/toaster/Toaster'
import { STORAGE_KEYS } from '../constants/storage'

export interface StoreContextType {
  products: Product[]
  categories: Category[]
  orders: Order[]
  users: User[]
  merchants: User[]
  wishlist: Product[]
  loading: boolean
  error: string | null
  refreshCatalog: () => Promise<void>
  addProduct: (productData: Partial<Product>) => Promise<Product>
  updateProduct: (productData: Partial<Product> & { id: string | number }) => Promise<Product>
  deleteProduct: (id: string | number) => Promise<void>
  updateStock: (id: string | number, stock: number) => Promise<void>
  restockProduct: (id: string | number, amount?: number) => void
  restockAllLow: () => void
  duplicateProduct: (id: string | number) => Promise<void>
  toggleProductPause: (id: string | number) => Promise<void>
  addCategory: (categoryData: Partial<Category>) => Promise<Category>
  updateCategory: (categoryData: Partial<Category> & { id: string | number }) => Promise<Category>
  deleteCategory: (id: string | number) => Promise<void>
  createOrder: (orderData: any) => Promise<string>
  updateOrderStatus: (id: string | number, status: OrderStatus) => Promise<void>
  toggleUserActive: (id: string | number) => Promise<void>
  toggleUserBlock: (id: string | number) => Promise<void>
  setUserStatus: (id: string | number, status: 'active' | 'blocked' | 'deactivated') => Promise<void>
  deleteUser: (id: string | number) => Promise<void>
  toggleWishlist: (product: Product) => void
  isWishlisted: (productId: string | number) => boolean
  removeFromWishlist: (productId: string | number) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

// --- Normalization Helpers for Backend API Responses ---
export const normalizeProduct = (p: any): Product => {
  const priceNum = typeof p.price === 'string' ? parseFloat(p.price) : Number(p.price) || 0
  const originalPriceNum = p.original_price
    ? typeof p.original_price === 'string'
      ? parseFloat(p.original_price)
      : Number(p.original_price)
    : p.originalPrice
    ? Number(p.originalPrice)
    : undefined

  const categorySlug =
    typeof p.category === 'object' && p.category?.slug
      ? p.category.slug
      : typeof p.category === 'string'
      ? p.category
      : 'accessories'

  return {
    id: String(p.id),
    rawId: typeof p.id === 'number' ? p.id : parseInt(String(p.id), 10) || undefined,
    name: p.name || 'Product',
    slug: p.slug || (p.name ? p.name.toLowerCase().replace(/\s+/g, '-') : `prod-${p.id}`),
    description: p.description || '',
    price: priceNum,
    originalPrice: originalPriceNum,
    stock: p.stock !== undefined ? Number(p.stock) : 10,
    category: categorySlug,
    categoryId: p.category_id || p.category?.id,
    rating: typeof p.rating === 'string' ? parseFloat(p.rating) : Number(p.rating) || 4.5,
    reviewsCount: p.reviews_count || 0,
    image: p.image_url || p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    isFeatured: Boolean(p.is_featured),
    isPaused: p.is_active === false,
    merchantId: p.merchant_id ? String(p.merchant_id) : undefined,
    storeName: p.store_name || undefined,
    created_at: p.created_at,
  }
}

export const normalizeCategory = (c: any): Category => ({
  id: String(c.id),
  rawId: typeof c.id === 'number' ? c.id : parseInt(String(c.id), 10) || undefined,
  name: c.name || 'Department',
  slug: c.slug || (c.name ? c.name.toLowerCase().replace(/\s+/g, '-') : `dept-${c.id}`),
  description: c.description || '',
  image: c.image_url || c.image || '',
  image_url: c.image_url || c.image || '',
  icon: c.image_url || c.image || c.icon || 'Layers',
  itemCount: c.product_count || 0,
  is_active: c.is_active ?? true,
})

export const normalizeOrder = (o: any): Order => {
  const totalVal =
    typeof o.total_amount === 'string'
      ? parseFloat(o.total_amount)
      : typeof o.total === 'number'
      ? o.total
      : Number(o.total_amount) || 0

  return {
    id: String(o.id),
    rawId: typeof o.id === 'number' ? o.id : parseInt(String(o.id), 10) || undefined,
    orderNumber: o.order_number || `ORD-${o.id}`,
    date: o.created_at || o.date || new Date().toISOString(),
    createdAt: o.created_at || o.date || new Date().toISOString(),
    total: totalVal,
    status: (o.status || 'PENDING').toUpperCase() as OrderStatus,
    shippingAddress: o.shipping_address_text || o.shipping_address || 'Customer Shipping Address',
    paymentMethod: o.payment_method || 'CARD',
    trackingNumber: o.tracking_number,
    customerName: o.user?.full_name || o.customerName || o.customer_name || 'Verified Customer',
    customerEmail: o.user?.email || o.customerEmail,
    items: (o.items || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id || item.productId,
      product_id: item.product_id || item.productId,
      name: item.product_name || item.product?.name || item.name || `Item #${item.id || ''}`,
      productName: item.product_name || item.product?.name || item.name || `Item #${item.id || ''}`,
      image: item.product?.image_url || item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      quantity: Number(item.quantity) || 1,
      price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : Number(item.price) || 0,
      subtotal: typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : Number(item.subtotal) || 0,
    })),
  }
}

export const normalizeUser = (u: any): User => {
  const rawRole = (u.role || '').toLowerCase()
  const role = rawRole === 'admin' ? 'admin' : rawRole === 'merchant' || rawRole === 'seller' ? 'merchant' : 'customer'
  const isBlocked = Boolean(u.is_blocked)
  const isActive = u.is_active ?? true
  return {
    id: String(u.id),
    email: u.email,
    name: u.full_name || u.username || u.name || 'User',
    username: u.username,
    full_name: u.full_name,
    role,
    is_admin: u.is_admin || role === 'admin',
    is_active: isActive,
    isActive: isActive,
    is_blocked: isBlocked,
    isBlocked: isBlocked,
    storeName: u.store_name || undefined,
    avatar: u.avatar_url || u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    createdAt: u.created_at,
    created_at: u.created_at,
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WISHLIST)
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Sync wishlist to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist))
  }, [wishlist])

  // --- Real-world API Data Ingestion ---
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch Categories
      try {
        const catRes = await categoriesApi.getCategories()
        if (Array.isArray(catRes)) {
          setCategories(catRes.map(normalizeCategory))
        }
      } catch (err: any) {
        console.warn('Categories API fetch warning:', err.message)
      }

      // 2. Fetch Products
      try {
        const prodRes = await productsApi.getProducts({ size: 100 })
        const rawItems = prodRes?.items || (Array.isArray(prodRes) ? prodRes : [])
        if (Array.isArray(rawItems)) {
          setProducts(rawItems.map(normalizeProduct))
        }
      } catch (err: any) {
        console.warn('Products API fetch warning:', err.message)
      }

      // 3. Fetch Orders (tries admin all orders first, falls back to customer orders)
      try {
        let orderRes: any[] = []
        try {
          orderRes = await ordersApi.getAllOrdersAdmin()
        } catch {
          orderRes = await ordersApi.getOrders()
        }
        const rawOrders = Array.isArray(orderRes) ? orderRes : (orderRes as any)?.items || []
        setOrders(rawOrders.map(normalizeOrder))
      } catch (err: any) {
        console.warn('Orders API fetch warning:', err.message)
      }

      // 4. Fetch Users (if admin access available)
      try {
        const userRes = await usersApi.getAllUsers()
        if (Array.isArray(userRes)) {
          setUsers(userRes.map(normalizeUser))
        }
      } catch {
        // Expected for non-admin accounts
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load platform data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Derived merchants list
  const merchants = users.filter((u) => u.role === 'merchant')

  // --- Product Mutations ---
  const addProduct = async (productData: Partial<Product>): Promise<Product> => {
    try {
      // 1. Resolve Category ID dynamically from categories state
      let catId: number | undefined = undefined
      if (productData.categoryId) {
        catId = typeof productData.categoryId === 'number' ? productData.categoryId : parseInt(String(productData.categoryId), 10)
      }
      if (!catId && productData.category) {
        const found = categories.find(
          (c) =>
            c.slug.toLowerCase() === productData.category?.toLowerCase() ||
            c.name.toLowerCase() === productData.category?.toLowerCase() ||
            c.id === String(productData.category)
        )
        if (found) {
          catId = found.rawId || parseInt(String(found.id), 10)
        }
      }
      if (!catId && categories.length > 0) {
        catId = categories[0].rawId || parseInt(String(categories[0].id), 10) || 1
      }
      if (!catId) {
        catId = 1
      }

      const desc =
        productData.description && productData.description.trim().length >= 3
          ? productData.description.trim()
          : `${productData.name || 'Electronics Product'} - High quality performance specifications.`

      const payload: Record<string, any> = {
        name: productData.name,
        price: productData.price,
        original_price: productData.originalPrice || undefined,
        stock: productData.stock ?? 0,
        description: desc,
        image_url:
          productData.image ||
          '/assets/exact/prod_iphone_full.png',
        category_id: catId,
        is_active: true,
        is_featured: productData.isFeatured ?? false,
        brand: productData.brand || 'CloudCart',
        badge: productData.badge || undefined,
      }

      const created = await productsApi.createProduct(payload)
      const normalized = normalizeProduct(created)
      if (productData.storeName) normalized.storeName = productData.storeName
      if (productData.merchantId) normalized.merchantId = String(productData.merchantId)

      setProducts((prev) => [normalized, ...prev.filter((p) => p.id !== normalized.id)])
      showToast('Product created successfully!', 'success')
      return normalized
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to create product'
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error')
      throw err
    }
  }

  const updateProduct = async (
    productData: Partial<Product> & { id: string | number }
  ): Promise<Product> => {
    try {
      const targetProd = products.find((p) => String(p.id) === String(productData.id))
      const targetId =
        targetProd?.rawId ||
        (typeof productData.id === 'number'
          ? productData.id
          : parseInt(String(productData.id), 10)) ||
        productData.id

      // Resolve category ID if category changed
      let catId: number | undefined = undefined
      if (productData.categoryId) {
        catId = typeof productData.categoryId === 'number' ? productData.categoryId : parseInt(String(productData.categoryId), 10)
      } else if (productData.category) {
        const found = categories.find(
          (c) =>
            c.slug.toLowerCase() === productData.category?.toLowerCase() ||
            c.name.toLowerCase() === productData.category?.toLowerCase() ||
            c.id === String(productData.category)
        )
        if (found) {
          catId = found.rawId || parseInt(String(found.id), 10)
        }
      }

      const payload: Record<string, any> = {}
      if (productData.name !== undefined) payload.name = productData.name
      if (productData.price !== undefined) payload.price = productData.price
      if (productData.originalPrice !== undefined) payload.original_price = productData.originalPrice
      if (productData.stock !== undefined) payload.stock = productData.stock
      if (productData.image !== undefined) payload.image_url = productData.image
      if (productData.brand !== undefined) payload.brand = productData.brand
      if (productData.badge !== undefined) payload.badge = productData.badge
      if (productData.isFeatured !== undefined) payload.is_featured = productData.isFeatured
      if (productData.isPaused !== undefined) payload.is_active = !productData.isPaused
      if (catId !== undefined) payload.category_id = catId

      if (productData.description !== undefined) {
        payload.description =
          productData.description.trim().length >= 3
            ? productData.description.trim()
            : `${productData.name || targetProd?.name || 'Product'} - Specifications and details.`
      }

      const updated = await productsApi.updateProduct(targetId, payload)
      const normalized = normalizeProduct(updated)
      if (targetProd?.storeName && !normalized.storeName) normalized.storeName = targetProd.storeName
      if (targetProd?.merchantId && !normalized.merchantId) normalized.merchantId = targetProd.merchantId

      setProducts((prev) =>
        prev.map((p) => (String(p.id) === String(productData.id) ? normalized : p))
      )
      showToast('Product updated successfully!', 'success')
      return normalized
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to update product'
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error')
      throw err
    }
  }

  const deleteProduct = async (id: string | number): Promise<void> => {
    try {
      const targetProd = products.find((p) => String(p.id) === String(id))
      const targetId =
        targetProd?.rawId ||
        (typeof id === 'number' ? id : parseInt(String(id), 10)) ||
        id

      await productsApi.deleteProduct(targetId)
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)))
      showToast('Product deleted successfully', 'success')
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to delete product'
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error')
      throw err
    }
  }

  const updateStock = async (id: string | number, newStock: number): Promise<void> => {
    try {
      const targetProd = products.find((p) => String(p.id) === String(id))
      const targetId =
        targetProd?.rawId ||
        (typeof id === 'number' ? id : parseInt(String(id), 10)) ||
        id

      await productsApi.updateStock(targetId, undefined, newStock)
      setProducts((prev) =>
        prev.map((p) => (String(p.id) === String(id) ? { ...p, stock: newStock } : p))
      )
      showToast(`Stock updated to ${newStock} units`, 'success')
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to update stock'
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error')
    }
  }

  const restockProduct = (id: string | number, amount: number = 20) => {
    const target = products.find((p) => String(p.id) === String(id))
    if (!target) return
    const newStock = (target.stock || 0) + amount
    updateStock(id, newStock)
  }

  const restockAllLow = () => {
    products.forEach((p) => {
      if (p.stock <= 10) {
        updateStock(p.id, p.stock + 25)
      }
    })
    showToast('Batch restocked all low-stock items (+25 units)', 'success')
  }

  const toggleProductPause = async (id: string | number): Promise<void> => {
    const target = products.find((p) => String(p.id) === String(id))
    if (!target) return
    const newPaused = !target.isPaused
    const targetId =
      target.rawId ||
      (typeof id === 'number' ? id : parseInt(String(id), 10)) ||
      id
    try {
      await productsApi.updateProduct(targetId, { is_active: !newPaused })
      setProducts((prev) =>
        prev.map((p) => (String(p.id) === String(id) ? { ...p, isPaused: newPaused } : p))
      )
      showToast(`Product ${newPaused ? 'paused' : 'activated'}`, 'info')
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to change product status'
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error')
    }
  }

  const duplicateProduct = async (id: string | number): Promise<void> => {
    const target = products.find((p) => String(p.id) === String(id))
    if (!target) return
    await addProduct({
      ...target,
      name: `${target.name} (Copy)`,
      slug: `${target.slug}-copy-${Date.now().toString().slice(-4)}`,
    })
  }

  // --- Category Mutations ---
  const addCategory = async (categoryData: Partial<Category>): Promise<Category> => {
    try {
      const created = await categoriesApi.createCategory({
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || '',
        image_url: categoryData.image_url || categoryData.image || categoryData.icon || '',
      })
      const normalized = normalizeCategory(created)
      setCategories((prev) => [normalized, ...prev])
      showToast('Department created successfully!', 'success')
      return normalized
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create category', 'error')
      throw err
    }
  }

  const updateCategory = async (
    categoryData: Partial<Category> & { id: string | number }
  ): Promise<Category> => {
    try {
      const updated = await categoriesApi.updateCategory(categoryData.id, {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        image_url: categoryData.image_url || categoryData.image || categoryData.icon || '',
      })
      const normalized = normalizeCategory(updated)
      setCategories((prev) =>
        prev.map((c) => (String(c.id) === String(categoryData.id) ? normalized : c))
      )
      showToast('Department updated successfully!', 'success')
      return normalized
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update category', 'error')
      throw err
    }
  }

  const deleteCategory = async (id: string | number): Promise<void> => {
    try {
      await categoriesApi.deleteCategory(id)
      setCategories((prev) => prev.filter((c) => String(c.id) !== String(id)))
      showToast('Department deleted successfully', 'success')
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete category', 'error')
      throw err
    }
  }

  // --- Order Mutations ---
  const createOrder = async (orderData: any): Promise<string> => {
    try {
      const payload = {
        ...orderData,
        shipping_address: orderData.shipping_address || orderData.shippingAddress || 'Standard Delivery Address',
        shippingAddress: orderData.shipping_address || orderData.shippingAddress || 'Standard Delivery Address',
        payment_method: orderData.payment_method || orderData.paymentMethod || 'Credit Card',
        paymentMethod: orderData.payment_method || orderData.paymentMethod || 'Credit Card',
      }
      const res = await ordersApi.createOrder(payload)
      const orderId = String(res?.order_number || res?.id || `ORD-${Date.now()}`)
      if (res) {
        setOrders((prev) => [normalizeOrder(res), ...prev])
      }
      await fetchAllData()
      return orderId
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Order checkout failed'
      showToast(errorMsg, 'error')
      throw err
    }
  }

  const updateOrderStatus = async (
    id: string | number,
    status: OrderStatus
  ): Promise<void> => {
    try {
      await ordersApi.updateOrderStatus(id, status)
      setOrders((prev) =>
        prev.map((o) => (String(o.id) === String(id) ? { ...o, status } : o))
      )
      showToast(`Order #${id} marked as ${status}`, 'success')
    } catch (err: any) {
      setOrders((prev) =>
        prev.map((o) => (String(o.id) === String(id) ? { ...o, status } : o))
      )
    }
  }

  // --- User / Merchant Governance ---
  const toggleUserActive = async (id: string | number): Promise<void> => {
    const target = users.find((u) => String(u.id) === String(id))
    if (!target) return
    const newActive = !(target.is_active ?? target.isActive ?? true)
    try {
      await usersApi.updateUser(id, { is_active: newActive })
      setUsers((prev) =>
        prev.map((u) =>
          String(u.id) === String(id) ? { ...u, is_active: newActive, isActive: newActive } : u
        )
      )
      showToast(`User account ${newActive ? 'activated' : 'suspended'}`, 'info')
    } catch {
      setUsers((prev) =>
        prev.map((u) =>
          String(u.id) === String(id) ? { ...u, is_active: newActive, isActive: newActive } : u
        )
      )
    }
  }

  const toggleUserBlock = async (id: string | number): Promise<void> => {
    const target = users.find((u) => String(u.id) === String(id))
    if (!target) return
    const newBlocked = !target.isBlocked
    try {
      await usersApi.updateUser(id, { is_blocked: newBlocked })
      setUsers((prev) =>
        prev.map((u) =>
          String(u.id) === String(id)
            ? { ...u, is_blocked: newBlocked, isBlocked: newBlocked }
            : u
        )
      )
      showToast(`Account ${newBlocked ? 'blocked' : 'unblocked'} successfully`, 'info')
    } catch {
      showToast('Failed to update user block status', 'error')
    }
  }

  const setUserStatus = async (
    id: string | number,
    status: 'active' | 'blocked' | 'deactivated'
  ): Promise<void> => {
    const target = users.find((u) => String(u.id) === String(id))
    if (!target) return
    let payload: Record<string, any> = {}
    if (status === 'active') {
      payload = { is_active: true, is_blocked: false }
    } else if (status === 'blocked') {
      payload = { is_active: false, is_blocked: true }
    } else if (status === 'deactivated') {
      payload = { is_active: false, is_blocked: false }
    }
    try {
      await usersApi.updateUser(id, payload)
      setUsers((prev) =>
        prev.map((u) =>
          String(u.id) === String(id)
            ? {
                ...u,
                is_active: payload.is_active,
                isActive: payload.is_active,
                is_blocked: payload.is_blocked,
                isBlocked: payload.is_blocked,
              }
            : u
        )
      )
      showToast(`Account set to ${status.toUpperCase()}`, 'info')
    } catch {
      showToast('Failed to update account status', 'error')
    }
  }

  const deleteUser = async (id: string | number): Promise<void> => {
    try {
      await usersApi.deleteUser(id)
      setUsers((prev) => prev.filter((u) => String(u.id) !== String(id)))
      showToast('User account deleted successfully', 'success')
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to delete user'
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error')
      throw err
    }
  }

  // --- Wishlist Management ---
  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => String(p.id) === String(product.id))
      if (exists) {
        showToast(`Removed "${product.name}" from wishlist`, 'info')
        return prev.filter((p) => String(p.id) !== String(product.id))
      }
      showToast(`Saved "${product.name}" to wishlist`, 'success')
      return [...prev, product]
    })
  }

  const removeFromWishlist = (productId: string | number) => {
    setWishlist((prev) => prev.filter((p) => String(p.id) !== String(productId)))
  }

  const isWishlisted = (productId: string | number): boolean => {
    return wishlist.some((p) => String(p.id) === String(productId))
  }

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        orders,
        users,
        merchants,
        wishlist,
        loading,
        error,
        refreshCatalog: fetchAllData,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        restockProduct,
        restockAllLow,
        duplicateProduct,
        toggleProductPause,
        addCategory,
        updateCategory,
        deleteCategory,
        createOrder,
        updateOrderStatus,
        toggleUserActive,
        toggleUserBlock,
        setUserStatus,
        deleteUser,
        toggleWishlist,
        isWishlisted,
        removeFromWishlist,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}

export default StoreContext
