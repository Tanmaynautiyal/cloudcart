export const PATHS = {
  // Public Customer Routes
  HOME: '/',
  SHOP: '/shop',
  PRODUCT_DETAIL: '/product/:slug',
  CART: '/cart',
  CHECKOUT: '/checkout',
  WISHLIST: '/wishlist',
  ORDERS: '/orders',
  PROFILE: '/profile',

  // Auth Routes
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin/login',
  MERCHANT_LOGIN: '/merchant/login',
  REGISTER: '/register',

  // Merchant Portal Routes
  MERCHANT: {
    ROOT: '/merchant',
    DASHBOARD: '/merchant',
    PRODUCTS: '/merchant/products',
    PRICING: '/merchant/pricing',
    INVENTORY: '/merchant/inventory',
    ORDERS: '/merchant/orders',
    LOGISTICS: '/merchant/logistics',
    PROFILE: '/merchant/profile',
  },

  // Admin Governance Portal Routes
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    MERCHANTS: '/admin/merchants',
    PRODUCTS: '/admin/products',
    CATEGORIES: '/admin/categories',
    ORDERS: '/admin/orders',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
  },

  MAINTENANCE: '/maintenance',
  NOT_FOUND: '*',
} as const
